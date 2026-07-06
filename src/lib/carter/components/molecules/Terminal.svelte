<!--
  Terminal — CRT phosphor screen. Reveals `lines` character-by-character
  when `typing` is true; renders everything immediately when `typing` is
  false or the user prefers reduced motion (both routes are deterministic
  for tests). Each line is prefixed with `prompt`.
-->
<script lang="ts">
  interface Props {
    /** Lines of terminal output, revealed in order. */
    lines?: string[];
    /** Prompt glyph prefixed to every line. */
    prompt?: string;
    /** Reveal lines character-by-character when true. */
    typing?: boolean;
    /** Milliseconds per revealed character; clamped to a sane range. */
    speed?: number;
  }

  let { lines = [], prompt = ">", typing = true, speed = 28 }: Props = $props();

  const clampedSpeed = $derived(Math.min(200, Math.max(4, speed)));

  let revealed = $state<string[]>([]);

  $effect(() => {
    const source = lines;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

    if (!typing || reduceMotion || source.length === 0) {
      revealed = [...source];
      return;
    }

    revealed = source.map(() => "");
    let lineIndex = 0;
    let charIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function tick() {
      const line = source[lineIndex] ?? "";
      charIndex += 1;
      const next = revealed.slice();
      next[lineIndex] = line.slice(0, charIndex);
      revealed = next;

      if (charIndex >= line.length) {
        lineIndex += 1;
        charIndex = 0;
      }
      if (lineIndex < source.length) {
        timeoutId = setTimeout(tick, clampedSpeed);
      }
    }

    timeoutId = setTimeout(tick, clampedSpeed);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  });
</script>

<div class="terminal carter-scanline" style="background: #030b06;" role="log" aria-label="Terminal session output">
  <div class="screen">
    {#each revealed as text, i (i)}
      <div class="line">
        <span class="prompt">{prompt}</span>
        <span class="text">{text}</span>{#if i === revealed.length - 1}<span class="caret" aria-hidden="true"></span>{/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .terminal {
    position: relative;
    padding: var(--carter-space-4);
    border-radius: var(--carter-radius-sm);
    overflow: hidden;
    animation: flicker 6s infinite steps(1, end);
  }

  .screen {
    font-family: var(--carter-font-mono);
    font-size: var(--carter-fs-sm);
    line-height: var(--carter-lh-body);
    color: var(--carter-phosphor);
    text-shadow:
      0 0 2px var(--carter-phosphor),
      0 0 8px var(--carter-phosphor-dim);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .line {
    display: block;
  }

  .prompt {
    opacity: 0.85;
  }

  .caret {
    display: inline-block;
    width: 0.6em;
    height: 1em;
    margin-left: 2px;
    background: var(--carter-phosphor);
    vertical-align: text-bottom;
    animation: blink 1s steps(1, end) infinite;
  }

  @keyframes flicker {
    0%,
    96%,
    100% {
      opacity: 1;
    }
    97% {
      opacity: 0.86;
    }
    98% {
      opacity: 1;
    }
  }

  @keyframes blink {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .terminal {
      animation: none;
    }
    .caret {
      animation: none;
    }
  }
</style>
