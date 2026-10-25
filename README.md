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

- `prompts/urban_web.txt` is the Urban Web system prompt (the assistant at `/`), `prompts/uiRules.js` the shared HTML component rules.
  The server builds the system prompt itself; the browser can never send or change it.
- The browser keeps the whole conversation and sends it with every `POST /api/chat { messages }`.
  The server accepts only `user` / `assistant` turns, validates and caps them, and keeps no state.
- `services/llm.js` tries Groq, then OpenRouter, then Requesty.

## Urban Web assistant (`/`)

- The home page is the Urban Web sales assistant. It uses the same shell as `/a/:slug`, filled from `services/urbanWeb.js`
  (texts in en/de/pl, brand colors) and styled by `public/urbanweb.css` (logo top right). `/?ask=<question>` starts with a question.
- Chat: `POST /api/chat`, no database needed. The system prompt = `prompts/urban_web.txt` + platform rules + UI rules + link rules.
  Links survive only if the URL appears in `prompts/urban_web.txt`.
- Contact form: `POST /api/lead` stores the request in MongoDB (as slug `_urban-web`) and e-mails it to `LEAD_NOTIFY_EMAIL`
  (fallback `ADMIN_EMAIL`) via SMTP. Without `MONGODB_URI` the assistant does not offer the form.

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

## Creating and editing agents (changes after phase 3)

- **Describe your company:** `/create` starts with one big text box (default). The guided questions are optional
  (open them to answer instead of, or in addition to, your text). The server merges both into the agent's instructions.
- **Instructions stay on the server:** owners never see or edit the system prompt. They edit what they wrote
  (description and answers) and the look and texts; when the description changes, the server rewrites the
  instructions (max 10 times per agent and day).
- **Logo instead of emoji:** upload a PNG, JPEG or WebP (shrunk in the browser to 256 px, stored in MongoDB, served from
  `/api/agents/:slug/logo`). SVG is refused on purpose. The emoji is optional.
- **Links that start a conversation:** `/a/<slug>?ask=What%20does%20a%20wedding%20cake%20cost%3F` opens the agent and
  asks that question right away (max 300 characters). The edit page has a small link builder.
- **Owner keys expire** (default 6 months, `OWNER_KEY_DAYS`). The agent keeps running; only editing needs a valid key.
  Lost or expired keys are handled by the admin only:

```bash
node scripts/admin.js list
node scripts/admin.js rotate-key acme-gmbh        # new key (lost key, or renewal after payment), prints the edit link
node scripts/admin.js extend acme-gmbh 183        # same key, new expiry date
node scripts/admin.js pause acme-gmbh | resume acme-gmbh | delete acme-gmbh
node scripts/admin.js leads                       # contact requests from the Urban Web page (or: leads <slug> [count])
node scripts/admin.js reports                     # visitor reports
node scripts/admin.js kill on                     # global kill switch Setting by hand in Atlas: in the settings collection, create or edit a document { key: "killSwitch", value: true }
```
