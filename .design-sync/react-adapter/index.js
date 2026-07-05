// Entry for the React adapter dist. Imports the library's REAL packaged
// components (dist/ — the same files any consumer's bundler compiles) and
// exposes each behind the wrap() adapter. Snippet-prop lists mirror each
// component's Props interface exactly.
import {
  Avatar as SvAvatar,
  Badge as SvBadge,
  Button as SvButton,
  Card as SvCard,
  CodeBlock as SvCodeBlock,
  Heading as SvHeading,
  Icon as SvIcon,
  Kbd as SvKbd,
  Link as SvLink,
  NavBar as SvNavBar,
  Stack as SvStack,
  StatCard as SvStatCard,
  Text as SvText,
} from '../../dist/index.js';
import { wrap } from './wrap.js';

export { ThemeRoot } from './wrap.js';

export const Text = wrap('Text', SvText, ['children']);
export const Heading = wrap('Heading', SvHeading, ['children']);
export const Button = wrap('Button', SvButton, ['children']);
export const Link = wrap('Link', SvLink, ['children']);
export const Badge = wrap('Badge', SvBadge, ['children']);
export const Icon = wrap('Icon', SvIcon, []);
export const Kbd = wrap('Kbd', SvKbd, ['children']);
export const Avatar = wrap('Avatar', SvAvatar, []);
export const Stack = wrap('Stack', SvStack, ['children']);
export const Card = wrap('Card', SvCard, ['children', 'header', 'footer']);
export const CodeBlock = wrap('CodeBlock', SvCodeBlock, []);
export const NavBar = wrap('NavBar', SvNavBar, ['children', 'brand']);
export const StatCard = wrap('StatCard', SvStatCard, []);

// Theme-as-data spine — pure pass-through of the library's real compiled
// theme API (plain functions and palette data; nothing to wrap).
export { applyTheme, contrastGates, defineTheme, swapTheme, themeCss } from '../../dist/theme/theme.js';
export { contrastRatio } from '../../dist/internal/contrast.js';
export { dark, light } from '../../dist/tokens/palette.js';
