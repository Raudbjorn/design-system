// $state-backed props bag — the reactive bridge between the React wrapper and
// the mounted Svelte component. Whole-object reassignment of .v is the update
// contract (deep-proxy reactivity flows into host.svelte's spread).
export function createBag(initial) {
  let v = $state(initial);
  return {
    get v() {
      return v;
    },
    set v(next) {
      v = next;
    },
  };
}
