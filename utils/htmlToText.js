// Compact text version of an HTML reply. Used as the assistant side of the
// history, so tokens stay low and the free tiers do not choke.
function htmlToText(html) {
  return String(html || '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<option[^>]*>([\s\S]*?)<\/option>/gi, ' [option: $1] ')
    .replace(/<\/(p|div|li|h\d|tr|section|label|legend|summary)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
    .slice(0, 2000);
}

module.exports = htmlToText;
