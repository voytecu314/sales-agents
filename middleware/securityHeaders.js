// Second line of defence behind the HTML sanitizer: even if markup slipped through,
// the browser would refuse to run scripts or talk to other servers.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // inline: theme variables of the agent page
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'"
].join('; ');

function securityHeaders(req, res, next) {
  res.set('Content-Security-Policy', CSP);
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

// Owner pages: never cached, never framed, never leak the page address (the owner key is in it).
function ownerPageHeaders(req, res, next) {
  res.set('Cache-Control', 'no-store');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('X-Frame-Options', 'DENY');
  next();
}

module.exports = { securityHeaders, ownerPageHeaders };
