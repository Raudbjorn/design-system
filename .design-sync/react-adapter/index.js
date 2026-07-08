// Entry for the React adapter dist. Imports the library's REAL packaged
// components (dist/ — the same files any consumer's bundler compiles) and
// exposes each behind the wrap() adapter. Snippet-prop lists mirror each
// component's Props interface exactly.
import {
  Alert as SvAlert,
  Avatar as SvAvatar,
  Badge as SvBadge,
  Breadcrumb as SvBreadcrumb,
  Button as SvButton,
  Card as SvCard,
  Checkbox as SvCheckbox,
  CodeBlock as SvCodeBlock,
  Heading as SvHeading,
  Icon as SvIcon,
  Input as SvInput,
  Kbd as SvKbd,
  Link as SvLink,
  Modal as SvModal,
  NavBar as SvNavBar,
  Progress as SvProgress,
  Radio as SvRadio,
  Select as SvSelect,
  Sheet as SvSheet,
  Spinner as SvSpinner,
  Stack as SvStack,
  StatCard as SvStatCard,
  Switch as SvSwitch,
  Table as SvTable,
  Tabs as SvTabs,
  Text as SvText,
  Timeline as SvTimeline,
  Tooltip as SvTooltip,
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

export const Input = wrap('Input', SvInput, []);
export const Select = wrap('Select', SvSelect, []);
export const Checkbox = wrap('Checkbox', SvCheckbox, ['children']);
export const Radio = wrap('Radio', SvRadio, ['children']);
export const Switch = wrap('Switch', SvSwitch, ['children']);
export const Alert = wrap('Alert', SvAlert, ['children']);
export const Tooltip = wrap('Tooltip', SvTooltip, ['children']);
export const Spinner = wrap('Spinner', SvSpinner, []);
export const Progress = wrap('Progress', SvProgress, []);
export const Tabs = wrap('Tabs', SvTabs, []);
export const Table = wrap('Table', SvTable, ['cell']);
export const Timeline = wrap('Timeline', SvTimeline, []);
export const Breadcrumb = wrap('Breadcrumb', SvBreadcrumb, []);
export const Modal = wrap('Modal', SvModal, ['children', 'footer']);
export const Sheet = wrap('Sheet', SvSheet, ['children', 'footer']);

// Theme-as-data spine — pure pass-through of the library's real compiled
// theme API (plain functions and palette data; nothing to wrap).
export { applyTheme, contrastGates, defineTheme, swapTheme, themeCss } from '../../dist/theme/theme.js';
export { contrastRatio } from '../../dist/internal/contrast.js';
export { dark, light } from '../../dist/tokens/palette.js';
