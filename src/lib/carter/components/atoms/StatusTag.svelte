<!--
  StatusTag — case status tag. Maps `status` to a label + tone, rendered
  as a rectangular mono label with a tone-colored left edge (distinct
  from ClearanceBadge's dot-marker chip).
-->
<script lang="ts">
  type Status = "open" | "cold" | "burned" | "active" | "closed";
  type Tone = "primary" | "muted" | "danger" | "warning";

  interface Props {
    /** Case status. */
    status?: Status;
  }

  let { status = "open" }: Props = $props();

  const STATUS_MAP: Record<Status, { label: string; tone: Tone }> = {
    open: { label: "OPEN", tone: "primary" },
    active: { label: "ACTIVE", tone: "primary" },
    cold: { label: "COLD CASE", tone: "muted" },
    burned: { label: "BURNED", tone: "danger" },
    closed: { label: "CLOSED", tone: "warning" }
  };

  const entry = $derived(STATUS_MAP[status] ?? STATUS_MAP.open);
</script>

<span class="tag" data-tone={entry.tone} data-status={status}>
  {entry.label}
</span>

<style>
  .tag {
    display: inline-block;
    padding: 0.25em 0.65em;
    font-family: var(--carter-font-mono);
    font-weight: var(--carter-weight-strong);
    font-size: var(--carter-fs-2xs);
    letter-spacing: var(--carter-tracking-label);
    text-transform: uppercase;
    color: var(--carter-text);
    background: var(--carter-surface-raise);
    border-left: var(--carter-border-slab) solid var(--carter-border-strong);
    border-radius: var(--carter-radius-sm);
  }

  .tag[data-tone="primary"] { border-left-color: var(--carter-primary); }
  .tag[data-tone="muted"] { border-left-color: var(--carter-text-muted); color: var(--carter-text-muted); }
  .tag[data-tone="danger"] { border-left-color: var(--carter-danger); }
  .tag[data-tone="warning"] { border-left-color: var(--carter-warning); }
</style>
