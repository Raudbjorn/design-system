// Public surface of the ExtJS/Proxmox adapter (`@svnbjrn/design/extjs`).
//
// The committed sheets (theme-sv-dark.css, theme-sv-light.css) are what most
// consumers want; this module exists so generated world themes can be turned
// into sheets at runtime — see bin/design-generate.mjs --extjs.

export {
  checkProxmoxThemeName,
  emitExtJsCss,
  extJsInputsFromWorldTheme,
  HOVER_MIX,
  PRESSED_MIX
} from './emit.ts';
export type {
  ExtJsInputsResult,
  ExtJsThemeInput,
  ProxmoxNameCheck,
  ResolvedTokenDocument,
  WorldThemeLike
} from './emit.ts';
export { EXTJS_STRUCTURE } from './structure.ts';
