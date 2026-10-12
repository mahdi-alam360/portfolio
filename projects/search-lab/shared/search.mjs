export const LIMITS = Object.freeze({ documents: 40, characters: 8000, query: 200, bodyBytes: 100000 });
export const SAMPLE_DOCUMENTS = [
  { id: 'bm25', title: 'How BM25 ranks documents', text: 'BM25 is a lexical retrieval algorithm. It combines inverse document frequency, term frequency saturation, and document length normalization. Rare query terms carry more weight. It does not understand synonyms or generate answers.' },
  { id: 'experiments', title: 'Making experiments reproducible', text: 'Reproducible machine learning experiments record random seeds, data splits, configurations, environment versions, and metrics. An ablation study removes one component at a time to test its contribution. Compare against a baseline before claiming an improvement.' },
  { id: 'registration', title: 'Self-supervised image registration', text: 'Medical image registration estimates a spatial transformation between images. Self-supervised training can optimize image similarity without ground-truth deformation labels. Dice similarity evaluates anatomical overlap; Jacobian determinants help analyze deformation quality.' },
  { id: 'api', title: 'Designing a small search API', text: 'A search API should validate queries and document inputs, limit request size, return consistent errors, and handle empty results. HTTP integration tests check the client-server contract. This demonstration keeps documents in the request and does not persist uploads.' },
  { id: 'frontend', title: 'Building a React interface', text: 'React components render state and respond to user interactions. TypeScript helps describe data contracts. Accessible search interfaces need explicit labels, keyboard controls, visible focus, loading feedback, and clear empty states.' },
  { id: 'evaluation', title: 'Evaluating retrieval quality', text: 'Retrieval evaluation needs labeled queries and representative documents. Precision and recall measure relevance, while latency measures speed. Toy examples and passing unit tests do not demonstrate production readiness. Lexical retrieval can miss semantic matches.' }
];
export function tokenize(text) { return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []; }
export function validateInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Provide a JSON object.');
  const { query, documents } = input;
  if (typeof query !== 'string' || !query.trim() || query.length > LIMITS.query || !tokenize(query).length) throw new Error('Enter a query with letters or numbers (maximum 200 characters).');
  if (!Array.isArray(documents) || documents.length < 1 || documents.length > LIMITS.documents) throw new Error('Provide between 1 and 40 documents.');
  const ids = new Set();
  for (const doc of documents) {
    if (!doc || typeof doc !== 'object' || typeof doc.id !== 'string' || !doc.id.trim() || doc.id.length > 80 || ids.has(doc.id)) throw new Error('Document IDs must be unique, nonempty strings of at most 80 characters.');
    if (typeof doc.title !== 'string' || !doc.title.trim() || doc.title.length > 200 || typeof doc.text !== 'string' || !doc.text.trim() || doc.text.length > LIMITS.characters) throw new Error('Each document needs a title (up to 200 characters) and text (up to 8,000 characters).');
    ids.add(doc.id);
  }
  return { query: query.trim(), documents };
}
export function search(input) {
  const { query, documents } = validateInput(input);
  const terms = [...new Set(tokenize(query))];
  const corpus = documents.map(doc => {
    const tokens = tokenize(`${doc.title} ${doc.text}`);
    const frequencies = new Map();
    for (const token of tokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    return { doc, tokens, frequencies };
  });
  const averageLength = corpus.reduce((sum, item) => sum + item.tokens.length, 0) / corpus.length || 1;
  const k1 = 1.2, b = 0.75;
  const results = corpus.map(({ doc, tokens, frequencies }) => {
    const matches = terms.flatMap(term => {
      const frequency = frequencies.get(term) ?? 0;
      if (!frequency) return [];
      const df = corpus.filter(item => item.frequencies.has(term)).length;
      const idf = Math.log(1 + (corpus.length - df + 0.5) / (df + 0.5));
      const contribution = idf * frequency * (k1 + 1) / (frequency + k1 * (1 - b + b * tokens.length / averageLength));
      return [{ term, frequency, documentFrequency: df, contribution }];
    });
    return { ...doc, score: matches.reduce((sum, match) => sum + match.contribution, 0), matches };
  }).filter(result => result.score > 0).sort((a, z) => z.score - a.score || a.id.localeCompare(z.id));
  return { query, terms, documentCount: corpus.length, algorithm: { name: 'BM25', k1, b, averageLength }, results };
}
