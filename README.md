# sales-agents

AI sales agents that answer with rich, interactive HTML (cards, price tables, forms, quick replies).

## Run locally

```bash
npm install
npm install mongoose nodemailer   # once: MongoDB Atlas storage, e-mail
cp .env.example .env   # add at least one provider key
npm run dev            # http://localhost:3000
```

## How it works

- `prompts/company.txt` is the company system prompt, `prompts/uiRules.js` the shared HTML component rules.
  The server builds the system prompt itself; the browser can never send or change it.
- The browser keeps the whole conversation and sends it with every `POST /api/chat { messages }`.
  The server accepts only `user` / `assistant` turns, validates and caps them, and keeps no state.
- `services/llm.js` tries Groq, then OpenRouter, then Requesty.

## Multi-tenant agents

- `/create`: the owner describes the company, reviews the generated agent (prompt, texts in en/de/pl, colors) and publishes it.
- `/a/:slug`: the public chat of one agent. The same shell for everyone (`views/agent.html`), filled with the
  agent's name, colors and texts. Visitors choose de/en/pl (default: browser language, else English).
- `POST /api/agents/:slug/chat` loads the agent's prompt from MongoDB, adds the fixed platform rules and
  the shared UI rules, and calls the provider chain. Visitors never see or change the prompt.
- Configs are cached in memory for 60 s (`AGENT_CACHE_TTL_MS`). No conversations are stored.
- The owner key returned on publish is stored only as a SHA-256 hash.

## Deploy on Vercel

Zero config: `index.js` exports the Express app, `public/` is served by the CDN.
Set the env vars from `.env.example` in the project settings.
Provider fallbacks can take a while, so check the function max duration in the project settings.

## Owner page, contact requests, safety (phase 3)

- **Owner page:** `/edit/:slug#<owner key>`. The key is shown once after publishing and only its SHA-256 hash is stored.
  The page edits everything, pauses or deletes the agent, and lists the last 50 contact requests.
- **Contact requests:** the AI shows a contact form; the page sends it to `POST /api/agents/:slug/lead` itself, so
  contact data never goes to the LLM providers. It is stored (deleted after 90 days) and e-mailed to the owner's
  address once that address is confirmed through a link (`EMAIL_VERIFY_SECRET`).
- **HTML safety:** every reply passes `utils/sanitizeHtml.js` (allowlist of tags, attributes and classes; output is rebuilt,
  never passed through) and the page sends a strict Content-Security-Policy. Links survive only if their URL, e-mail
  or phone number appears in the agent's own instructions.
- **Limits:** per IP and per agent rate limits, a daily message cap per agent, shared counters in MongoDB,
  a global kill switch (`KILL_SWITCH=true` or the `settings` document `{ key: "killSwitch", value: true }`).
- **Moderation:** owner instructions are checked on publish and on every change (fixed patterns plus an LLM check).
