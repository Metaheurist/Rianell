type OpenListener = (pane: number) => void;

let openListener: OpenListener | null = null;

export function registerGoalsModalOpenListener(fn: OpenListener | null) {
  openListener = fn;
}

export function requestOpenGoalsModal(pane = 0) {
  openListener?.(pane);
}
