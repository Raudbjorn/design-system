// React-surface types for @svnbjrn/design — the Svelte 5 library consumed
// through its React adapter (see .design-sync/react-adapter/). Props mirror
// each component's Svelte Props interface 1:1; snippet props (children,
// header, footer, and brand) accept React nodes. Lowercase Svelte event names
// remain canonical; matching React camelCase aliases are also accepted.
import * as React from 'react';

/** Body text on the token ramp. Renders a p by default; as switches the element. */
export interface TextProps {
  /** Type scale step. */
  size?: 'xs' | 'sm' | 'base' | 'lg';
  /** Ink strength: strong > default > muted > faint (all AA on the token background). */
  tone?: 'default' | 'strong' | 'muted' | 'faint';
  /** Iosevka instead of Inter. */
  mono?: boolean;
  /** Rendered element. */
  as?: 'p' | 'span' | 'div';
  children: React.ReactNode;
}
export declare const Text: React.FC<TextProps>;

/** Heading ramp h1–h4, Inter, token ink. */
export interface HeadingProps {
  /** Heading level (renders the matching h element). */
  level?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}
export declare const Heading: React.FC<HeadingProps>;

/**
 * Button — renders an anchor when href is set, a button otherwise.
 * loading sets aria-busy and disables the button element.
 */
export interface ButtonProps {
  /** primary = teal accent, secondary = coral, ghost = bordered, danger = error red. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  /** When set, renders an anchor. */
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  /** Busy state: aria-busy + disabled. */
  loading?: boolean;
  /** Svelte 5 callback prop — lowercase, not onClick. */
  onclick?: (e: MouseEvent) => void;
  children: React.ReactNode;
}
export declare const Button: React.FC<ButtonProps>;

/** Inline link. external adds the arrow and rel="noopener noreferrer". */
export interface LinkProps {
  href: string;
  /** External link: arrow suffix + safe rel. */
  external?: boolean;
  children: React.ReactNode;
}
export declare const Link: React.FC<LinkProps>;

/** Status pill. Tones map to the semantic token colors. */
export interface BadgeProps {
  tone?: 'neutral' | 'success' | 'error' | 'warning' | 'accent';
  children: React.ReactNode;
}
export declare const Badge: React.FC<BadgeProps>;

/**
 * Glyph-as-text icon: the bundled Iosevka subset keeps the Nerd-Font PUA
 * range (U+F000–F2FF), so icons are characters — no SVG pipeline.
 * Pass label for meaningful icons; omit it for aria-hidden decoration.
 */
export interface IconProps {
  /** The glyph character (e.g. "" terminal). */
  glyph: string;
  /** Accessible name; omit for decorative icons. */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}
export declare const Icon: React.FC<IconProps>;

/** Keyboard key cap. Compose chords as siblings: <Kbd>Ctrl</Kbd> + <Kbd>P</Kbd>. */
export interface KbdProps {
  children: React.ReactNode;
}
export declare const Kbd: React.FC<KbdProps>;

/** Avatar. Without src, initials derive from alt (first two words); alt is required either way. */
export interface AvatarProps {
  /** Image URL; omit for the initials fallback. */
  src?: string;
  /** Required accessible name (and the initials source). */
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}
export declare const Avatar: React.FC<AvatarProps>;

/**
 * The only layout primitive — a flex row/column on the spacing scale.
 * gap takes spacing-scale steps (--sv-space-*), not pixels.
 */
export interface StackProps {
  direction?: 'column' | 'row';
  /** Spacing-scale step (--sv-space-N), not pixels. */
  gap?: 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  children: React.ReactNode;
}
export declare const Stack: React.FC<StackProps>;

/** Surface-1 card: one border, one radius; optional header/footer bands. */
export interface CardProps {
  /** Body padding step. */
  padding?: 'sm' | 'md' | 'lg';
  /** --sv-shadow-md, for the one card per view that needs to float. */
  elevated?: boolean;
  /** Header band (surface-2, hairline below). */
  header?: React.ReactNode;
  /** Footer band (surface-2, hairline above). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}
export declare const Card: React.FC<CardProps>;

/**
 * Syntax-highlighted code block — the signature component. Accepts
 * pre-tokenized html from a build-time highlighter (token classes tok-* map
 * to --sv-syn-*); ships no client-side highlighter. Copy always copies the
 * raw code; the line-number gutter counts code, never html.
 */
export interface CodeBlockProps {
  /** The raw code — the copy source and the gutter's line count. */
  code: string;
  /** Optional pre-tokenized highlight HTML (must preserve code's line count). */
  html?: string;
  /** Filename shown in the title bar. */
  filename?: string;
  /** Line-number gutter, numbered from code. */
  showLineNumbers?: boolean;
  /** Visible copy-button label — override for world-flavored vernacular. */
  copyLabel?: string;
  /** Visible label while the 1.5s "copied" confirmation shows. */
  copiedLabel?: string;
  /** Accessible name of the copy button; defaults to tracking the visible label. */
  copyAriaLabel?: string;
}
export declare const CodeBlock: React.FC<CodeBlockProps>;

/**
 * Sticky top navigation: brand slot left, links right; below 768px the links
 * collapse behind a menu toggle.
 */
export interface NavBarProps {
  /** Brand slot (left side). */
  brand?: React.ReactNode;
  /** Links / actions (right side; typically Link and Badge). */
  children: React.ReactNode;
  /** Accessible name of the nav landmark — override for vernacular. */
  navLabel?: string;
  /** Accessible name of the collapsed-menu toggle. */
  menuLabel?: string;
}
export declare const NavBar: React.FC<NavBarProps>;

/** Dashboard stat: Iosevka tabular-numeral value over a muted label. */
export interface StatCardProps {
  /** The stat, rendered in mono with tabular numerals. */
  value: string;
  label: string;
  /** accent = teal, accent-2 = coral (the one number needing attention), default = ink. */
  tone?: 'accent' | 'accent-2' | 'default';
}
export declare const StatCard: React.FC<StatCardProps>;

/**
 * Theme frame — sets the library's real theming contract (data-theme on an
 * ancestor element) and paints the token background/ink. Wrap app roots in
 * <ThemeRoot theme="dark"> for the system's dark-first look.
 */
export interface ThemeRootProps {
  /** dark (default) or the pale-paper light theme. */
  theme?: 'dark' | 'light';
  children?: React.ReactNode;
}
export declare const ThemeRoot: React.FC<ThemeRootProps>;

// ── Theme-as-data API ──────────────────────────────────────────────────
// The library's real compiled theme spine, passed through unwrapped.
// Themes are data: defineTheme validates, themeCss/applyTheme render.

/** Full token palette — token name → 6-digit hex. */
export type Palette = Record<string, string>;
export type TokenName =
  | 'bg' | 'surface-1' | 'surface-2' | 'surface-3' | 'border'
  | 'text' | 'text-strong' | 'text-muted' | 'text-faint'
  | 'accent' | 'accent-2' | 'accent-rust' | 'mix-target'
  | 'success' | 'error' | 'warning'
  | 'syn-keyword' | 'syn-string' | 'syn-var' | 'syn-func' | 'syn-comment' | 'syn-number';

/** The built-in palettes — the data behind ThemeRoot's dark/light. */
export declare const dark: Palette;
export declare const light: Palette;

export type ThemeIssue =
  | { kind: 'unknown-token'; token: string }
  | { kind: 'invalid-color'; token: TokenName; value: string }
  | { kind: 'invalid-layer'; index: number }
  | { kind: 'missing-token'; token: TokenName }
  | { kind: 'contrast'; fg: TokenName; bg: TokenName; ratio: number; min: number };

export interface Theme {
  /** The accepted overrides only — what themeCss emits. */
  overrides: Partial<Palette>;
  /** The full merged palette (base + overrides) the gates were checked on. */
  palette: Palette;
}
export type ThemeResult = { ok: true; theme: Theme } | { ok: false; issues: ThemeIssue[] };

export interface DefineThemeOptions {
  /** Base palette for contrast gating: 'dark' (default), 'light', or a full custom palette. */
  base?: 'dark' | 'light' | Palette;
}
/**
 * Validate a partial palette override into a Theme. Accepts one override
 * record or an ordered layer array (later wins: base → world → activity →
 * user-override). Collects every issue instead of failing fast; only 6-digit
 * hex on known token names passes, and every WCAG pairing the base palettes
 * guarantee is re-checked. Rejections come back as an issue list, never CSS.
 */
export declare function defineTheme(
  overrides: Record<string, string> | ReadonlyArray<Record<string, string>>,
  options?: DefineThemeOptions
): ThemeResult;
/** Render a theme as a CSS custom-property block (deterministic; `--sv-*: #rrggbb;` only). */
export declare function themeCss(theme: Theme, selector?: string): string;

export interface ApplyThemeOptions {
  /** Scope for the overrides; defaults to `:root`. */
  selector?: string;
  /** Document to style; defaults to the global one. */
  target?: Document;
}
/** Apply a theme document-wide; returns a disposer. DOM-only — call in an effect. */
export declare function applyTheme(theme: Theme, options?: ApplyThemeOptions): () => void;

export interface SwapThemeOptions extends ApplyThemeOptions {
  /** Disposer from a previous applyTheme/swapTheme, removed inside the same transition frame. */
  dispose?: () => void;
}
/** Swap themes with a View Transitions crossfade where available. DOM-only. */
export declare function swapTheme(theme: Theme, options?: SwapThemeOptions): Promise<() => void>;

/** The WCAG pairings every palette must satisfy (4.5:1 normal text, 3:1 UI). */
export declare const contrastGates: ReadonlyArray<{ fg: TokenName; bg: TokenName; min: number }>;
/** WCAG contrast ratio between two hex colors. */
export declare const contrastRatio: (a: string, b: string) => number;

/**
 * World vernacular — per-world label overrides for component chrome.
 * Spread into the matching component: `<CodeBlock {...vernacular.codeBlock} …/>`.
 */
export interface Vernacular {
  codeBlock?: Pick<CodeBlockProps, 'copyLabel' | 'copiedLabel' | 'copyAriaLabel'>;
  navBar?: Pick<NavBarProps, 'navLabel' | 'menuLabel'>;
}

type ReactInputAttributesWithoutHandlers = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  keyof React.DOMAttributes<HTMLInputElement> | 'className'
>;
type ReactSelectAttributesWithoutHandlers = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  keyof React.DOMAttributes<HTMLSelectElement> | 'className'
>;

/** Labelled text field with hint + error states. */
export interface InputProps extends Omit<
  ReactInputAttributesWithoutHandlers,
  'value' | 'defaultValue' | 'type' | 'readOnly'
> {
  value?: string;
  label?: string;
  hint?: string;
  /** String message (shown) or boolean flag; either turns the border red. */
  error?: string | boolean;
  type?: 'text' | 'email' | 'password' | 'search';
  mono?: boolean;
  readonly?: boolean;
  oninput?: (e: Event) => void;
  onInput?: (e: Event) => void;
  onChange?: (e: Event) => void;
}
export declare const Input: React.FC<InputProps>;

/** Native select restyled to the token surface. */
export interface SelectProps extends Omit<
  ReactSelectAttributesWithoutHandlers,
  'value' | 'multiple'
> {
  value?: string;
  options: { value: string; label: string }[];
  label?: string;
  onchange?: (e: Event) => void;
  onChange?: (e: Event) => void;
}
export declare const Select: React.FC<SelectProps>;

/** Soft-fill checkbox. `disabled` renders the coral unavailable state. */
export interface CheckboxProps extends Omit<
  ReactInputAttributesWithoutHandlers,
  'type' | 'checked' | 'defaultChecked'
> {
  checked?: boolean;
  onchange?: (checked: boolean) => void;
  onChange?: (checked: boolean) => void;
  children?: React.ReactNode;
}
export declare const Checkbox: React.FC<CheckboxProps>;

/** Radio option. Group via a shared `name`; `group` holds the selected value. */
export interface RadioProps {
  group?: string;
  value: string;
  name: string;
  disabled?: boolean;
  id?: string;
  onchange?: (value: string) => void;
  onChange?: (value: string) => void;
  children?: React.ReactNode;
}
export declare const Radio: React.FC<RadioProps>;

type RenderableSwitchLabel = Exclude<React.ReactNode, boolean | null | undefined>;

/** Binary toggle; accent fills the track when on. */
export type SwitchProps = {
  checked?: boolean;
  disabled?: boolean;
  id?: string;
  onchange?: (checked: boolean) => void;
  onChange?: (checked: boolean) => void;
} & (
  | { children: RenderableSwitchLabel; 'aria-label'?: never }
  | { children?: never; 'aria-label': string }
);
export declare const Switch: React.FC<SwitchProps>;

/** Inline message; `info` maps to accent, the rest to semantic tokens. */
export interface AlertProps {
  tone?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  icon?: string;
  children: React.ReactNode;
}
export declare const Alert: React.FC<AlertProps>;

/** Hover/focus tooltip over a trigger. */
export interface TooltipProps {
  content: string;
  placement?: 'top' | 'bottom';
  children: React.ReactNode;
}
export declare const Tooltip: React.FC<TooltipProps>;

/** Indeterminate activity spinner. */
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}
export declare const Spinner: React.FC<SpinnerProps>;

/** Determinate or indeterminate progress bar. */
export type ProgressProps = {
  value?: number;
  indeterminate?: boolean;
  tone?: 'accent' | 'accent-2';
} & (
  | { label: string; 'aria-label'?: never }
  | { label?: never; 'aria-label': string }
);
export declare const Progress: React.FC<ProgressProps>;

/** Underline tablist (controlled via value). Consumer renders the panel. */
export interface TabsProps {
  tabs: {
    id: string;
    label: string;
    /** DOM id for the tab button. */
    tabId: string;
    /** DOM id of the consumer-rendered tabpanel. */
    panelId: string;
  }[];
  value?: string;
  onchange?: (id: string) => void;
  onChange?: (id: string) => void;
  /** Accessible name for the tab list. */
  'aria-label'?: string;
}
export declare const Tabs: React.FC<TabsProps>;

/** Data table with a surface-2 header band. */
export interface TableColumn {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  mono?: boolean;
}
export interface TableProps {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  /** Stable identity field for rows recreated between updates; object identity is the fallback. */
  rowKey?: string;
  /** Rich-cell renderer; receives the row, column, and resolved value. */
  cell?: (args: { row: Record<string, unknown>; column: TableColumn; value: unknown }) => React.ReactNode;
}
export declare const Table: React.FC<TableProps>;

/** Vertical timeline; alternate is the locked default in product use. */
export interface TimelineItem {
  content: string;
  title?: string;
  color?: 'accent' | 'success' | 'warning' | 'error' | 'accent-2' | string;
  loading?: boolean;
  placement?: 'start' | 'end';
}
export interface TimelineProps {
  items: TimelineItem[];
  mode?: 'start' | 'alternate' | 'end';
  variant?: 'filled' | 'outlined';
  reverse?: boolean;
}
export declare const Timeline: React.FC<TimelineProps>;

/** Skewed-block breadcrumb; last item is the current page. */
export interface BreadcrumbProps {
  items: { label: string; href?: string }[];
  'aria-label'?: string;
}
export declare const Breadcrumb: React.FC<BreadcrumbProps>;

/** Center modal dialog. */
export type ModalProps = {
  open?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
  closeOnScrim?: boolean;
  onclose?: () => void;
  onClose?: () => void;
} & (
  | { title: string; 'aria-label'?: never }
  | { title?: never; 'aria-label': string }
);
export declare const Modal: React.FC<ModalProps>;

/** Edge drawer over a blurred scrim (right | left). */
export type SheetProps = {
  open?: boolean;
  placement?: 'right' | 'left';
  footer?: React.ReactNode;
  children: React.ReactNode;
  closeOnScrim?: boolean;
  onclose?: () => void;
  onClose?: () => void;
} & (
  | { title: string; 'aria-label'?: never }
  | { title?: never; 'aria-label': string }
);
export declare const Sheet: React.FC<SheetProps>;
