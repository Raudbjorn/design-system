// Focus containment, topmost Escape routing, return-focus, and reference-counted
// scroll locking for modal dialogs. The registry is keyed by dialog element.
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

type TrapEntry = {
  node: HTMLElement;
  onEscape: () => boolean | void;
  previouslyFocused: HTMLElement | null;
  addedTabIndex: boolean;
};

const traps: TrapEntry[] = [];
let previousBodyOverflow: string | null = null;

function focusables(node: HTMLElement): HTMLElement[] {
  return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.offsetParent !== null || element === document.activeElement
  );
}

function onDocumentKeydown(event: KeyboardEvent) {
  const active = traps[traps.length - 1];
  if (!active || event.key !== 'Escape' || event.defaultPrevented) return;

  if (active.onEscape() === false) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function onDocumentCaptureKeydown(event: KeyboardEvent) {
  const active = traps[traps.length - 1];
  if (!active || event.key !== 'Tab') return;

  const elements = focusables(active.node);
  const first = elements[0] ?? active.node;
  const last = elements[elements.length - 1] ?? active.node;
  const focused = document.activeElement;

  if (!active.node.contains(focused)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && focused === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && focused === last) {
    event.preventDefault();
    first.focus();
  }
}

export function trapFocus(node: HTMLElement, onEscape: () => boolean | void) {
  if (typeof document === 'undefined') return {};
  let entry = traps.find((candidate) => candidate.node === node);
  if (entry) {
    entry.onEscape = onEscape;
  } else {
    const addedTabIndex = !node.hasAttribute('tabindex');
    if (addedTabIndex) node.setAttribute('tabindex', '-1');
    entry = {
      node,
      onEscape,
      previouslyFocused: document.activeElement as HTMLElement | null,
      addedTabIndex
    };
    traps.push(entry);

    if (traps.length === 1) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onDocumentCaptureKeydown, true);
      document.addEventListener('keydown', onDocumentKeydown);
    }
  }

  (focusables(node)[0] ?? node).focus();

  return {
    update(nextOnEscape: () => boolean | void) {
      if (entry) entry.onEscape = nextOnEscape;
    },
    destroy() {
      const index = traps.findIndex((candidate) => candidate.node === node);
      if (index === -1) return;
      const wasTopmost = index === traps.length - 1;
      const [removed] = traps.splice(index, 1);
      if (traps.length === 0) {
        document.removeEventListener('keydown', onDocumentCaptureKeydown, true);
        document.removeEventListener('keydown', onDocumentKeydown);
        document.body.style.overflow = previousBodyOverflow ?? '';
        previousBodyOverflow = null;
      }
      if (!removed) return;
      if (removed.addedTabIndex && removed.node.getAttribute('tabindex') === '-1') {
        removed.node.removeAttribute('tabindex');
      }
      if (!wasTopmost) {
        const nextTrap = traps[index];
        if (nextTrap && removed.node.contains(nextTrap.previouslyFocused)) {
          nextTrap.previouslyFocused = removed.previouslyFocused;
        }
        return;
      }

      const nextTrap = traps[traps.length - 1];
      const returnTarget = removed.previouslyFocused;
      if (nextTrap && (!returnTarget || !nextTrap.node.contains(returnTarget))) {
        (focusables(nextTrap.node)[0] ?? nextTrap.node).focus();
      } else {
        returnTarget?.focus?.();
      }
    }
  };
}
