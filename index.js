require('dotenv').config();
const express = require('express');
const path = require('path');
const chatRoutes = require('./routes/chat');
const agentRoutes = require('./routes/agents');
const pageRoutes = require('./routes/pages');
const { securityHeaders } = require('./middleware/securityHeaders');

const PORT = process.env.PORT || 3000;

const app = express();
app.set('trust proxy', 1); // behind Vercel's proxy: req.ip is the real client IP
app.use(securityHeaders);
app.use(express.json({ limit: '100kb' }));
// Locally this serves /public. On Vercel the public/ folder is served by the CDN and this line is ignored.
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', chatRoutes);   // demo chat (prompts/company.txt)
app.use('/api', agentRoutes);  // multi-tenant agents
app.use(pageRoutes);           // /create and /a/:slug

// bad JSON etc. -> JSON error instead of an HTML stack trace
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
  if (err.status === 400 || err instanceof SyntaxError) return res.status(400).json({ error: 'Invalid request.' });
  console.error(err);
  res.status(500).json({ error: 'Server error.' });
});

module.exports = app; // Vercel picks the exported app up

if (require.main === module) {
  app.listen(PORT, () => console.log(`Sales assistant running on http://localhost:${PORT}`));
}
