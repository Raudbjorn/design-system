// React-surface types for @svnbjrn/design — the Svelte 5 library consumed
// through its React adapter (see .design-sync/react-adapter/). Props mirror
// each component's Svelte Props interface 1:1; snippet props (children,
// header, footer, brand) accept React nodes. Event callbacks keep the
// library's real Svelte 5 names (onclick, lowercase).
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
