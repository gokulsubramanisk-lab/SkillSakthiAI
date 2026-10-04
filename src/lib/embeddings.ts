// Vector embedding engine used by the district labor-market matcher and the
// zero-hallucination RAG retriever.
//
// Two providers are supported:
//  - "local"  : deterministic hashed bag-of-words + character trigram embedding.
//               Runs with zero external dependencies, works offline in rural
//               edge deployments, and is stable across restarts (so vectors
//               stored in Postgres stay valid).
//  - "openai" : server-side call to an OpenAI-compatible /v1/embeddings
//               endpoint when OPENAI_API_KEY is configured.
//
// Both produce L2-normalised Float vectors so cosine similarity == dot product.

export const EMBEDDING_DIM = 384;

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "of", "for", "and", "to", "in", "on", "with",
  "what", "how", "i", "my", "me", "do", "does", "can", "will", "be", "it",
  "ka", "ki", "ke", "hai", "hain", "mein", "aur", "kya", "kaise", "ko", "se",
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
    (token) => token.length > 1 && !STOPWORDS.has(token),
  );
}

// FNV-1a 32 bit hash -> stable across Node versions and processes.
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function addFeature(vec: Float64Array, feature: string, weight: number) {
  const h = hash(feature);
  const idx = h % EMBEDDING_DIM;
  const sign = (h >>> 31) & 1 ? -1 : 1;
  vec[idx] += sign * weight;
}

export function localEmbed(text: string): number[] {
  const vec = new Float64Array(EMBEDDING_DIM);
  const tokens = tokenize(text);

  for (const token of tokens) {
    addFeature(vec, `w:${token}`, 1);
    // character trigrams make the vector robust to dialect spelling drift
    // (e.g. "bijli"/"bijlee", "welder"/"weldar") which matters for voice input.
    const padded = `  ${token}  `;
    for (let i = 0; i < padded.length - 2; i += 1) {
      addFeature(vec, `c:${padded.slice(i, i + 3)}`, 0.35);
    }
  }
  for (let i = 0; i < tokens.length - 1; i += 1) {
    addFeature(vec, `b:${tokens[i]}_${tokens[i + 1]}`, 0.6);
  }

  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIM; i += 1) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;

  const out = new Array<number>(EMBEDDING_DIM);
  for (let i = 0; i < EMBEDDING_DIM; i += 1) out[i] = vec[i] / norm;
  return out;
}

async function openAiEmbed(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  try {
    const res = await fetch(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
        input: text,
        dimensions: EMBEDDING_DIM,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { embedding?: number[] }[] };
    const embedding = json.data?.[0]?.embedding;
    if (!embedding || embedding.length !== EMBEDDING_DIM) return null;
    let norm = 0;
    for (const v of embedding) norm += v * v;
    norm = Math.sqrt(norm) || 1;
    return embedding.map((v) => v / norm);
  } catch {
    return null;
  }
}

export function embeddingProvider(): "openai" | "local" {
  return process.env.OPENAI_API_KEY && process.env.EMBEDDING_PROVIDER === "openai"
    ? "openai"
    : "local";
}

export async function embed(text: string): Promise<number[]> {
  if (embeddingProvider() === "openai") {
    const remote = await openAiEmbed(text);
    if (remote) return remote;
  }
  return localEmbed(text);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i += 1) dot += a[i] * b[i];
  return dot;
}

/** Lexical overlap score, blended with vectors to stabilise short voice queries. */
export function lexicalOverlap(query: string, document: string): number {
  const q = new Set(tokenize(query));
  if (q.size === 0) return 0;
  const d = new Set(tokenize(document));
  let hits = 0;
  for (const token of q) if (d.has(token)) hits += 1;
  return hits / q.size;
}
