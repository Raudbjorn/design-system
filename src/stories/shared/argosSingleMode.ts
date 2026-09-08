// Neither Vermis nor Carter respond to core's data-theme decorator (vermis has
// no runtime theming at all; carter uses a different attribute, data-carter-theme),
// so Argos's light/amber captures of these stories would be pixel-identical
// duplicates of the dark capture. Disable them to avoid burning the Argos
// Hobby-plan quota (216 screenshots today for 72 stories x 3 modes; see
// docs/visual-testing.md) 3x over on these stories for no signal.
export const argosSingleMode = {
  argos: { modes: { light: { disabled: true }, amber: { disabled: true } } }
} as const;
