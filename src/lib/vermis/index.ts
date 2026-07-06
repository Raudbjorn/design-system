// Vermis alternative design language — occult-ornate styling system ported
// from layform's pattern language (Vermis I/II, Plurabelle Comix).
//
// These components consume the `--layform-*` token surface shipped via
// `@svnbjrn/design/vermis/styles.css`. Import that stylesheet before
// rendering any of the components below — without it, every component
// renders unstyled because the layform custom properties resolve to nothing.
//
// Namespaced re-export: consumers import from `@svnbjrn/design/vermis`
// rather than the default barrel, so the existing `--sv-*` components at
// `@svnbjrn/design` stay the default and vermis is an explicit opt-in.

export { default as VermisHeading } from './components/atoms/Heading.svelte';
export { default as VermisLink } from './components/atoms/Link.svelte';
export { default as VermisButton } from './components/atoms/Button.svelte';
export { default as VermisBadge } from './components/atoms/Badge.svelte';
export { default as VermisCreditChip } from './components/atoms/CreditChip.svelte';
export { default as VermisStatusTag } from './components/atoms/StatusTag.svelte';
export { default as VermisCategoryChip } from './components/atoms/CategoryChip.svelte';
export { default as VermisPositionChip } from './components/atoms/PositionChip.svelte';
export { default as VermisIlluminatedInitial } from './components/atoms/IlluminatedInitial.svelte';
export { default as VermisStatMeter } from './components/atoms/StatMeter.svelte';
export { default as VermisFormLabel } from './components/atoms/FormLabel.svelte';
export { default as VermisStack } from './components/layout/Stack.svelte';
export { default as VermisCard } from './components/molecules/Card.svelte';
export { default as VermisFramedImage } from './components/molecules/FramedImage.svelte';
export { default as VermisHeroFrame } from './components/molecules/HeroFrame.svelte';
export { default as VermisDataTable } from './components/molecules/DataTable.svelte';
export { default as VermisNavList } from './components/molecules/NavList.svelte';
export { default as VermisFormField } from './components/molecules/FormField.svelte';
export { default as VermisCoverPage } from './components/templates/CoverPage.svelte';
export { default as VermisSectionDivider } from './components/templates/SectionDivider.svelte';
