# Self-hosted fonts

The pages use two variable fonts (SIL Open Font License 1.1, free to host yourself):
Bricolage Grotesque (headings) and Figtree (body text). `public/style.css` expects these four files in this folder:

| File | Font | Characters |
|---|---|---|
| `bricolage-latin.woff2` | Bricolage Grotesque | basic Latin (English, German) |
| `bricolage-latin-ext.woff2` | Bricolage Grotesque | Latin extended (Polish ą ę ł ś ż ...) |
| `figtree-latin.woff2` | Figtree | basic Latin |
| `figtree-latin-ext.woff2` | Figtree | Latin extended |

Where to get them (one way): `npm install --no-save @fontsource-variable/bricolage-grotesque @fontsource-variable/figtree`,
then copy from `node_modules/@fontsource-variable/<font>/files/` the files named `...-latin-wght-normal.woff2` and
`...-latin-ext-wght-normal.woff2` into this folder under the names above. Copy the license file of each package as well
(`OFL-bricolage-grotesque.txt`, `OFL-figtree.txt`), as the license asks.
Without the files the pages still work and show the fallback fonts (Segoe UI / system-ui).
