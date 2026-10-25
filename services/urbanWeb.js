// The Urban Web site itself: its public config (same shape as a stored agent), brand colors and the logo.
// The system prompt is NOT here: it lives in prompts/urban_web.txt (see services/prompt.js).

// Brand colors: primary blue, secondary blue, panel/surface and white background.
// Deep text (#212529) and neutral grey (#6c757d) are set exactly in public/urbanweb.css.
const PALETTE = { accent: '#0d6efd', accent2: '#4b8ef1', accent3: '#0d6efd', bg: '#ffffff', panel: '#f8f9fa' };

const URBAN_WEB = {
  slug: 'urban-web',
  name: 'Urban Web',
  emoji: '',
  hasLogo: false,
  language: 'en',
  palette: PALETTE,
  locales: {
    en: {
      tagline: 'Websites, apps and AI sales agents for your business',
      welcome: "Hi! I'm the AI assistant of Urban Web. I'll help you find the right solution for your business: a website, a web app, a mobile app or an AI sales agent. What are you planning?",
      quickReplies: [
        { label: 'Free AI website', send: 'Tell me about the free AI-generated website.' },
        { label: 'Services & prices', send: 'What services do you offer and what do they cost?' },
        { label: 'Help me choose', send: 'Help me choose the right solution for my business.' }
      ]
    },
    de: {
      tagline: 'Websites, Apps und KI-Verkaufsagenten für Ihr Unternehmen',
      welcome: 'Hallo! Ich bin der KI-Assistent von Urban Web. Ich helfe Ihnen, die passende Lösung für Ihr Unternehmen zu finden: Website, Web-App, mobile App oder KI-Verkaufsagent. Was haben Sie vor?',
      quickReplies: [
        { label: 'Kostenlose KI-Website', send: 'Erzählen Sie mir mehr über die kostenlose KI-generierte Website.' },
        { label: 'Leistungen & Preise', send: 'Welche Leistungen bieten Sie an und was kosten sie?' },
        { label: 'Bei der Wahl helfen', send: 'Helfen Sie mir, die richtige Lösung für mein Unternehmen zu finden.' }
      ]
    },
    pl: {
      tagline: 'Strony, aplikacje i agenci sprzedaży AI dla Twojej firmy',
      welcome: 'Cześć! Jestem asystentem AI firmy Urban Web. Pomogę Ci wybrać rozwiązanie dla Twojej firmy: stronę internetową, aplikację webową, aplikację mobilną lub agenta sprzedaży AI. Co planujesz?',
      quickReplies: [
        { label: 'Darmowa strona AI', send: 'Opowiedz mi o darmowej stronie generowanej przez AI.' },
        { label: 'Usługi i ceny', send: 'Jakie usługi oferujecie i ile kosztują?' },
        { label: 'Pomóż mi wybrać', send: 'Pomóż mi wybrać odpowiednie rozwiązanie dla mojej firmy.' }
      ]
    }
  }
};

// Animated logo (markup only; the CSS is in public/urbanweb.css). Trusted constant, never built from user input.
const LOGO_HTML = '<a href="/" class="uw-logo" aria-label="Urban Web"><h3>Urban</h3>'
  + '<div id="globe" aria-hidden="true"><div class="inner"></div><div class="inner"></div><div class="inner"></div><div class="inner"></div>'
  + '<div class="outer"><div class="satelite"></div><div class="satelite"></div></div><hr><hr></div>'
  + '<h3>Web</h3></a>';

// What renderAgentPage needs on top of the config to turn the shared agent page into the Urban Web page.
const siteOptions = (baseUrl = '') => ({
  ogUrl: `${baseUrl}/`,
  topRight: LOGO_HTML,
  headExtra: '<link rel="stylesheet" href="/urbanweb.css">', // after the theme style, so it has the last word
  endpoints: { chatUrl: '/api/chat', leadUrl: '/api/lead' },  // the site uses its own endpoints, not /api/agents/:slug/...
  noReport: true                                              // "report this assistant" makes no sense on our own site
});

module.exports = { URBAN_WEB, PALETTE, LOGO_HTML, siteOptions };
