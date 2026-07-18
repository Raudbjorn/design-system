// React adapter core for @svnbjrn/design (a Svelte 5 library).
//
// wrap(name, SvelteComponent, snippetProps) returns a React component that
// mounts the library's REAL compiled Svelte component (from dist/) via
// Svelte 5's mount(). Scalar/callback props pass through 1:1. Snippet props
// (children, header, footer, brand) accept React nodes: the wrapper renders
// them through a React portal into a persistent display:contents container
// element, and hands Svelte a raw snippet that adopts that container — so
// React keeps ownership of its subtree while Svelte owns its placement.
//
// react/react-dom stay EXTERNAL here (the design-sync bundle shims them to
// window.React / window.ReactDOM); the svelte runtime is bundled in.
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createRawSnippet, mount, unmount } from 'svelte';
import Host from './host.svelte';
import { createBag } from './state.svelte.js';

function shallowEq(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}

export function wrap(name, SvelteComponent, snippetProps = []) {
  function Wrapper(props) {
    const hostRef = React.useRef(null);
    const st = React.useRef(null);
    if (!st.current) {
      st.current = {
        containers: new Map(),
        snippets: new Map(),
        app: null,
        bag: null,
        last: null,
        cells: new Map(),
        cellSeq: 0,
        cellFns: {},
        mounted: false,
        renderScheduled: false,
      };
    }
    const s = st.current;
    const [, forceRender] = React.useReducer((x) => x + 1, 0);
    s.cellFns = {};

    const scheduleRender = () => {
      if (s.renderScheduled) return;
      s.renderScheduled = true;
      queueMicrotask(() => {
        s.renderScheduled = false;
        if (s.mounted) forceRender();
      });
    };

    const svelteProps = {};
    const portals = [];
    for (const [k, v] of Object.entries(props)) {
      if (snippetProps.includes(k)) continue;
      svelteProps[k] = v;
    }
    // Forgiving aliases: React muscle memory writes camelCase event props; the
    // real Svelte 5 props stay lowercase. Documented API stays lowercase —
    // this only prevents silently dead handlers.
    const eventAliases = {
      onClick: 'onclick',
      onChange: 'onchange',
      onInput: 'oninput',
      onClose: 'onclose',
    };
    for (const [reactName, svelteName] of Object.entries(eventAliases)) {
      if (svelteProps[reactName] && !svelteProps[svelteName]) {
        svelteProps[svelteName] = svelteProps[reactName];
        delete svelteProps[reactName];
      }
    }
    for (const k of snippetProps) {
      const node = props[k];
      if (node == null || node === false) continue;

      if (typeof node === 'function') {
        // Parameterized snippet (React render-prop). Each Svelte {@render k(arg)}
        // gets its own container + portal; args flow through Svelte 5 getters.
        s.cellFns[k] = node;
        let snip = s.snippets.get(k);
        if (!snip) {
          snip = createRawSnippet((argGetter) => {
            const id = ++s.cellSeq;
            return {
              render: () => '<ds-slot style="display:contents"></ds-slot>',
              setup(target) {
                s.cells.set(id, { el: target, get: argGetter, prop: k });
                scheduleRender();
                return () => {
                  s.cells.delete(id);
                  scheduleRender();
                };
              },
            };
          });
          s.snippets.set(k, snip);
        }
        svelteProps[k] = snip;
        continue;
      }

      // --- existing static-portal path (unchanged) ---
      let el = s.containers.get(k);
      if (!el) {
        el = document.createElement('ds-slot');
        el.style.display = 'contents';
        s.containers.set(k, el);
      }
      let snip = s.snippets.get(k);
      if (!snip) {
        snip = createRawSnippet(() => ({
          render: () => '<ds-slot style="display:contents"></ds-slot>',
          setup(target) {
            target.appendChild(el);
            return () => {
              if (el.parentNode === target) target.removeChild(el);
            };
          },
        }));
        s.snippets.set(k, snip);
      }
      svelteProps[k] = snip;
      portals.push(ReactDOM.createPortal(node, el, `ds-${k}`));
    }

    React.useLayoutEffect(() => {
      s.mounted = true;
      s.bag = createBag(svelteProps);
      s.last = svelteProps;
      s.app = mount(Host, { target: hostRef.current, props: { component: SvelteComponent, bag: s.bag } });
      return () => {
        s.mounted = false;
        const app = s.app;
        s.app = null;
        s.bag = null;
        s.last = null;
        if (app) unmount(app);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    React.useLayoutEffect(() => {
      if (s.app && s.bag && !shallowEq(s.last, svelteProps)) {
        s.bag.v = svelteProps;
        s.last = svelteProps;
        if (s.cells.size > 0) scheduleRender();
      }
    });

    const cellPortals = [];
    for (const [id, c] of s.cells) {
      const fn = s.cellFns[c.prop];
      if (fn) {
        const args = typeof c.get === 'function' ? c.get() : undefined;
        cellPortals.push(ReactDOM.createPortal(fn(args), c.el, `ds-cell-${id}`));
      }
    }
    return React.createElement(
      React.Fragment,
      null,
      React.createElement('ds-host', { ref: hostRef, style: { display: 'contents' } }),
      portals,
      cellPortals,
    );
  }
  Wrapper.displayName = name;
  return Wrapper;
}

// Theme frame — the library's real theming contract (data-theme on an
// ancestor; see tokens/colors.css) plus the same token canvas the repo's own
// Storybook paints (.storybook/preview.css: token background/text/font).
export function ThemeRoot(props) {
  const theme = props.theme || 'dark';
  return React.createElement(
    'div',
    {
      'data-theme': theme,
      style: {
        background: 'var(--sv-bg)',
        color: 'var(--sv-text)',
        fontFamily: 'var(--sv-font-sans)',
        padding: '20px',
      },
    },
    props.children,
  );
}
