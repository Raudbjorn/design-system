// Carter alternative design language — a modern-mystery / cosmic-horror styling
// system distilled from Delta Green case files (The X-Files, True Detective S1,
// The Twilight Zone). Named for Chris Carter, creator of The X-Files.
//
// `// Components And Runes That End Reality`
//
// These components consume the `--carter-*` token surface shipped via
// `@svnbjrn/design/carter/styles.css`. Import that stylesheet before rendering
// any component below — without it every component renders unstyled because the
// carter custom properties resolve to nothing. The stylesheet also declares two
// runtime themes on `[data-carter-theme]`: `field` (night-ops dark, the default
// applied at :root) and `dossier` (paper case file, light).
//
// Namespaced re-export: consumers import from `@svnbjrn/design/carter` rather
// than the default barrel, so the existing `--sv-*` components at
// `@svnbjrn/design` stay the default and carter is an explicit opt-in — the
// same fold-in pattern as `@svnbjrn/design/vermis`.

// Atoms
export { default as CarterButton } from './components/atoms/Button.svelte';
export { default as CarterClassificationBanner } from './components/atoms/ClassificationBanner.svelte';
export { default as CarterStamp } from './components/atoms/Stamp.svelte';
export { default as CarterRedaction } from './components/atoms/Redaction.svelte';
export { default as CarterClearanceBadge } from './components/atoms/ClearanceBadge.svelte';
export { default as CarterStatusTag } from './components/atoms/StatusTag.svelte';
export { default as CarterHeading } from './components/atoms/Heading.svelte';
export { default as CarterLink } from './components/atoms/Link.svelte';
export { default as CarterInput } from './components/atoms/Input.svelte';
export { default as CarterCheckbox } from './components/atoms/Checkbox.svelte';
export { default as CarterSanityMeter } from './components/atoms/SanityMeter.svelte';
export { default as CarterKicker } from './components/atoms/Kicker.svelte';
export { default as CarterTimestamp } from './components/atoms/Timestamp.svelte';

// Layout
export { default as CarterStack } from './components/layout/Stack.svelte';
export { default as CarterDesk } from './components/layout/Desk.svelte';

// Molecules
export { default as CarterCaseFile } from './components/molecules/CaseFile.svelte';
export { default as CarterCallout } from './components/molecules/Callout.svelte';
export { default as CarterDataReadout } from './components/molecules/DataReadout.svelte';
export { default as CarterTerminal } from './components/molecules/Terminal.svelte';
export { default as CarterFormField } from './components/molecules/FormField.svelte';
export { default as CarterNavList } from './components/molecules/NavList.svelte';
export { default as CarterTabs } from './components/molecules/Tabs.svelte';
export { default as CarterEvidencePhoto } from './components/molecules/EvidencePhoto.svelte';

// Templates
export { default as CarterDossierCover } from './components/templates/DossierCover.svelte';
export { default as CarterSectionThreshold } from './components/templates/SectionThreshold.svelte';
export { default as CarterBriefingLayout } from './components/templates/BriefingLayout.svelte';
export { default as CarterEvidenceBoard } from './components/templates/EvidenceBoard.svelte';
