# sales-agents

AI sales agents that answer with rich, interactive HTML (cards, price tables, forms, quick replies).

## Run locally

```bash
npm install
cp .env.example .env   # add at least one provider key
npm run dev            # http://localhost:3000
```

## How it works

- `prompts/company.txt` is the company system prompt, `prompts/uiRules.js` the shared HTML component rules.
  The server builds the system prompt itself; the browser can never send or change it.
- The browser keeps the whole conversation and sends it with every `POST /api/chat { messages }`.
  The server accepts only `user` / `assistant` turns, validates and caps them, and keeps no state.
- `services/llm.js` tries Groq, then OpenRouter, then Requesty.

## Deploy on Vercel

Zero config: `index.js` exports the Express app, `public/` is served by the CDN.
Set the env vars from `.env.example` in the project settings.
Provider fallbacks can take a while, so check the function max duration in the project settings.
