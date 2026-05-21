const BASE = 'http://localhost:3000/api';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${BASE}${path}`, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

export function streamSSE(
  path: string,
  body: unknown,
  onChunk: (c: string) => void
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let output: unknown = null;

        function pump() {
          reader.read().then(({ done, value }) => {
            if (done) {
              resolve(output);
              return;
            }
            const text = decoder.decode(value);
            for (const line of text.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              try {
                const ev = JSON.parse(line.slice(6));
                if (ev.type === 'chunk') onChunk(ev.content);
                if (ev.type === 'done') output = ev.output;
                if (ev.type === 'error') reject(new Error(ev.message));
              } catch (e) {
                // ignore parse errors
              }
            }
            pump();
          });
        }

        pump();
      })
      .catch(reject);
  });
}
