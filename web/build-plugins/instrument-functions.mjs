/**
 * AST instrumentation: wraps function bodies with __rianellTraceEnter / __rianellTraceExit.
 * Uses @babel/parser, @babel/traverse, @babel/types, @babel/generator.
 */
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';

const traverse = typeof _traverse === 'function' ? _traverse : _traverse.default;
const generate = typeof _generate === 'function' ? _generate : _generate.default;
import * as t from '@babel/types';

/** Max character length of arrow expression body to skip (reduces noise). */
const MAX_ARROW_EXPR_BODY = 48;

const PARSER_OPTS = {
  sourceType: 'unambiguous',
  allowReturnOutsideFunction: true,
  errorRecovery: true,
  plugins: [
    'optionalChaining',
    'nullishCoalescingOperator',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'topLevelAwait',
    'importMeta',
    'dynamicImport',
    'numericSeparator',
    'logicalAssignment',
    'asyncGenerators',
    'objectRestSpread',
  ],
};

function getFunctionName(path) {
  const node = path.node;
  if (t.isFunctionDeclaration(node) && node.id) return node.id.name;
  if (t.isObjectMethod(node)) {
    if (t.isIdentifier(node.key)) return node.key.name;
    if (t.isStringLiteral(node.key)) return node.key.value;
    return '[computed]';
  }
  if (t.isClassMethod(node)) {
    if (t.isIdentifier(node.key)) return node.key.name;
    if (t.isStringLiteral(node.key)) return node.key.value;
    return '[computed]';
  }
  if (t.isFunctionExpression(node) && node.id) return node.id.name;
  if (t.isArrowFunctionExpression(node)) return '[arrow]';
  return 'anonymous';
}

function shouldSkipArrow(path) {
  const body = path.node.body;
  if (t.isBlockStatement(body)) return false;
  if (!t.isExpression(body)) return true;
  try {
    const g = generate(body);
    return g.code.length <= MAX_ARROW_EXPR_BODY;
  } catch {
    return true;
  }
}

function buildEnterExitWrapper(moduleId, fnName, isArrow) {
  const argsArg = isArrow
    ? t.identifier('undefined')
    : t.identifier('arguments');

  const enterCall = t.conditionalExpression(
    t.binaryExpression(
      '===',
      t.unaryExpression('typeof', t.identifier('__rianellTraceEnter')),
      t.stringLiteral('function')
    ),
    t.callExpression(t.identifier('__rianellTraceEnter'), [
      t.stringLiteral(moduleId),
      t.stringLiteral(fnName),
      argsArg,
    ]),
    t.identifier('undefined')
  );

  const decl = t.variableDeclaration('var', [
    t.variableDeclarator(t.identifier('__rt'), enterCall),
  ]);

  const exitStmt = t.expressionStatement(
    t.callExpression(t.identifier('__rianellTraceExit'), [t.identifier('__rt')])
  );

  return { decl, exitStmt };
}

function wrapBlockBody(path, moduleId, fnName, isArrow) {
  const bodyPath = path.get('body');
  if (!bodyPath.isBlockStatement()) {
    if (bodyPath.isExpression()) {
      bodyPath.replaceWith(
        t.blockStatement([t.returnStatement(bodyPath.node)])
      );
    } else {
      return;
    }
  }

  const block = path.node.body;
  if (!t.isBlockStatement(block)) return;

  const { decl, exitStmt } = buildEnterExitWrapper(moduleId, fnName, isArrow);

  const inner = block.body;
  const trySt = t.tryStatement(
    t.blockStatement(inner),
    null,
    t.blockStatement([exitStmt])
  );

  block.body = [decl, trySt];
}

function visitFunction(path, moduleId) {
  if (path.node.__rianellTraceDone) return;

  let isArrow = false;
  if (t.isArrowFunctionExpression(path.node)) {
    isArrow = true;
    if (shouldSkipArrow(path)) return;
  }

  const fnName = getFunctionName(path);
  wrapBlockBody(path, moduleId, fnName, isArrow);
  path.node.__rianellTraceDone = true;
}

/**
 * @param {string} code
 * @param {{ moduleId: string }} opts
 * @returns {string}
 */
export function transformSource(code, opts) {
  const moduleId = opts.moduleId || 'unknown';
  let ast;
  try {
    ast = parse(code, PARSER_OPTS);
  } catch (e) {
    console.warn('[function-trace] parse failed for', moduleId, e.message);
    return code;
  }

  traverse(ast, {
    FunctionDeclaration(path) {
      visitFunction(path, moduleId);
    },
    FunctionExpression(path) {
      if (path.parentPath.isObjectProperty() || path.parentPath.isObjectMethod()) {
        // ObjectMethod is separate
      }
      visitFunction(path, moduleId);
    },
    ObjectMethod(path) {
      visitFunction(path, moduleId);
    },
    ClassMethod(path) {
      visitFunction(path, moduleId);
    },
    ArrowFunctionExpression(path) {
      visitFunction(path, moduleId);
    },
  });

  const out = generate(ast, {
    retainLines: false,
    compact: false,
    comments: true,
  });
  return out.code;
}
