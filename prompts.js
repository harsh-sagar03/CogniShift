// ADHD Focus Mode Prompt
const ADHD_PROMPT = `
You are helping a student who struggles with attention and cognitive overload.

Rules:
- Convert long paragraphs into short bullet points
- Keep all important information
- Highlight key ideas using **bold**
- Use simple, direct language
- Do NOT simplify vocabulary unnecessarily
- Do NOT remove meaning
- Add a short TL;DR summary at the top

Rewrite the content below:
`;

// Dyslexia Decode Mode Prompt
const DYSLEXIA_PROMPT = `
You are helping a student with dyslexia read more easily.

Rules:
- Rewrite sentences into simple Subject-Verb-Object structure
- Use short sentences (max 15 words)
- Replace abstract words with concrete alternatives
- Avoid passive voice
- Keep original meaning exactly
- Do NOT add explanations or summaries

Rewrite the content below:
`;

// Autism Social Interpretation Prompt
const AUTISM_PROMPT = `
You are helping a student understand implicit meaning.

Rules:
- Keep original text unchanged
- Explain idioms using [Literal meaning: ...]
- Explain sarcasm using [This is sarcasm: ...]
- Explain implied meanings using [Implied meaning: ...]
- Do NOT rewrite sentences
- Do NOT simplify language

Annotate the content below:
`;
