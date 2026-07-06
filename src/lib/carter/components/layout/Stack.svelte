<!--
  Stack — flexbox layout primitive. Arranges children in a row or column
  with a token-driven gap. Purely presentational; no ARIA role of its own.
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  type Direction = "row" | "column";
  type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  type Align = "start" | "center" | "end" | "stretch";
  type Justify = "start" | "center" | "end" | "between";

  const GAPS: Gap[] = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12];
  const ALIGN_MAP: Record<Align, string> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch"
  };
  const JUSTIFY_MAP: Record<Justify, string> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    between: "space-between"
  };

  interface Props {
    /** Flex direction. */
    direction?: Direction;
    /** Gap size, mapped to --carter-space-{gap}. */
    gap?: Gap;
    /** Cross-axis alignment. */
    align?: Align;
    /** Main-axis alignment. */
    justify?: Justify;
    /** Allow items to wrap onto multiple lines. */
    wrap?: boolean;
    /** Stack content. */
    children?: Snippet;
  }

  let {
    direction = "column",
    gap = 4,
    align,
    justify,
    wrap = false,
    children
  }: Props = $props();

  const safeGap = $derived(GAPS.includes(gap) ? gap : 4);
  const style = $derived(
    [
      "display: flex",
      `flex-direction: ${direction}`,
      `gap: var(--carter-space-${safeGap})`,
      align ? `align-items: ${ALIGN_MAP[align]}` : "",
      justify ? `justify-content: ${JUSTIFY_MAP[justify]}` : "",
      `flex-wrap: ${wrap ? "wrap" : "nowrap"}`
    ]
      .filter(Boolean)
      .join("; ")
  );
</script>

<div class="stack" data-direction={direction} style={style}>
  {@render children?.()}
</div>
