<!--
  Timestamp — mono datetime stamp. Parses defensively; an invalid value
  renders "—" rather than throwing. Format: "dd MON yyyy · HH:mm".
-->
<script lang="ts">
  interface Props {
    /** The date to render. Defaults to a fixed literal for deterministic tests. */
    value?: Date | string | number;
    /** Optional label before the stamp, e.g. "LOGGED". */
    prefix?: string;
  }

  let { value = "1927-07-17T02:14:00", prefix }: Props = $props();

  const MONTHS = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
  ];

  function toDate(input: Date | string | number): Date | null {
    const date = input instanceof Date ? input : new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function pad(n: number): string {
    return String(n).padStart(2, "0");
  }

  function format(date: Date): string {
    const day = pad(date.getDate());
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${day} ${month} ${year} · ${hours}:${minutes}`;
  }

  const parsed = $derived(toDate(value));
  const display = $derived(parsed ? format(parsed) : "—");
  const iso = $derived(parsed ? parsed.toISOString() : undefined);
</script>

<time class="stamp carter-tnum" datetime={iso}>
  {#if prefix}<span class="prefix">{prefix}</span>{/if}
  {display}
</time>

<style>
  .stamp {
    font-family: var(--carter-font-mono);
    font-size: var(--carter-fs-xs);
    color: var(--carter-text-muted);
  }

  .prefix {
    margin-right: var(--carter-space-2);
    letter-spacing: var(--carter-tracking-label);
    text-transform: uppercase;
  }
</style>
