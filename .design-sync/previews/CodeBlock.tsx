// Mirrors src/stories/molecules/CodeBlock.stories.svelte
import * as React from 'react';
import { CodeBlock } from '@svnbjrn/design';

// `code` and `html` line counts must match — the dev-mode guard warns otherwise.
const tsCode = `// Result, not exceptions.
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

async function probe(port: number): Promise<Result<string, string>> {
  const res = await fetch(\`http://127.0.0.1:\${port}/api/v3/system/status\`);
  if (!res.ok) return { ok: false, error: \`HTTP \${res.status}\` };
  return { ok: true, value: await res.text() };
}`;
const tsHtml = `<span class="tok-comment">// Result, not exceptions.</span>
<span class="tok-keyword">type</span> <span class="tok-func">Result</span>&lt;<span class="tok-var">T</span>, <span class="tok-var">E</span>&gt; = { <span class="tok-var">ok</span>: <span class="tok-keyword">true</span>; <span class="tok-var">value</span>: <span class="tok-var">T</span> } | { <span class="tok-var">ok</span>: <span class="tok-keyword">false</span>; <span class="tok-var">error</span>: <span class="tok-var">E</span> };

<span class="tok-keyword">async function</span> <span class="tok-func">probe</span>(<span class="tok-var">port</span>: <span class="tok-keyword">number</span>): <span class="tok-func">Promise</span>&lt;<span class="tok-func">Result</span>&lt;<span class="tok-keyword">string</span>, <span class="tok-keyword">string</span>&gt;&gt; {
  <span class="tok-keyword">const</span> <span class="tok-var">res</span> = <span class="tok-keyword">await</span> <span class="tok-func">fetch</span>(<span class="tok-string">\`http://127.0.0.1:\${port}/api/v3/system/status\`</span>);
  <span class="tok-keyword">if</span> (!<span class="tok-var">res</span>.<span class="tok-var">ok</span>) <span class="tok-keyword">return</span> { <span class="tok-var">ok</span>: <span class="tok-keyword">false</span>, <span class="tok-var">error</span>: <span class="tok-string">\`HTTP \${res.status}\`</span> };
  <span class="tok-keyword">return</span> { <span class="tok-var">ok</span>: <span class="tok-keyword">true</span>, <span class="tok-var">value</span>: <span class="tok-keyword">await</span> <span class="tok-var">res</span>.<span class="tok-func">text</span>() };
}`;

const longLine =
  'ExecStart=/usr/bin/nginx -g "daemon off; error_log /var/log/nginx/error.log warn;" # keep the master process in the foreground so systemd owns it';

export const Highlighted = () => (
  <CodeBlock code={tsCode} html={tsHtml} filename="probe.ts" showLineNumbers />
);

export const Plain = () => <CodeBlock code="ssh svnbjrn@100.120.158.95" filename="connect.sh" />;

export const NoFilename = () => <CodeBlock code="paru -Syu && systemctl --user daemon-reload" />;

export const LongLines = () => (
  <CodeBlock code={longLine} filename="nginx.service" showLineNumbers />
);
