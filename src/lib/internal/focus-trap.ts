// Focus trap + return-focus for modal dialogs. Applied via `use:trapFocus` on
// the dialog element; the element only exists while the dialog is open, so the
// action's lifecycle brackets the open/close cycle.
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function trapFocus(node: HTMLElement) {
  const previouslyFocused = document.activeElement as HTMLElement | null;

  const focusables = (): HTMLElement[] =>
    Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );

  (focusables()[0] ?? node).focus();

  function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const els = focusables();
    const first = els[0];
    const last = els[els.length - 1];
    if (!first || !last) {
      e.preventDefault();
      node.focus();
      return;
    }
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  node.addEventListener('keydown', onKeydown);

  return {
    destroy() {
      node.removeEventListener('keydown', onKeydown);
      previouslyFocused?.focus?.();
    }
  };
}
