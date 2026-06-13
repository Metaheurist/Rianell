import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pack = require('../../policy-packs/v1.json');

export const POLICY_PACK_V1 = pack;
