# HEIC Save As

Free, client-side HEIC → JPG/PNG converter.

Drop one or more iPhone `.heic` / `.heif` photos, pick JPG or PNG, then **Save as**. Runs in the browser with [heic2any](https://github.com/alexcorvi/heic2any) from a CDN. No account. No backend. No Stripe. No upload.

**ICP:** iPhone Camera HEIC. That is the file people cannot open on Windows, Slack, or a cheap Chromebook.

**Live:** [https://28to3.me/apps/heic-save-as.html](https://28to3.me/apps/heic-save-as.html)

**GitHub Pages:** [https://sofa-loaf.github.io/heic-save-as/](https://sofa-loaf.github.io/heic-save-as/) (after Pages is enabled — see [docs/github-pages.md](docs/github-pages.md))

Soft next steps: [28to3.me](https://28to3.me)

## How to use

1. Open `index.html` via a local static server, the Pages URL, or the 28to3 app URL. A first load needs the network so the browser can cache **heic2any** (and JSZip for batch zip) from jsDelivr. After that, the page can keep working from cache.
2. Drop `.heic` / `.heif` files on the big zone, or click it to pick. Multiple files are fine.
3. Toggle **JPG** or **PNG**. For JPG, drag the quality slider if you want a smaller file.
4. Wait for **Ready**, then **Save as** on a row. With more than one file, **Save all** builds a zip when JSZip loaded, otherwise it downloads each file.
5. On iPhone, choose from **Files** so the original HEIC is used. The Photos picker often already converts to JPEG.

Nothing leaves the device. If WebAssembly is missing or the CDN script failed, the page says so instead of failing silently.

### Demo

Provide a real iPhone HEIC to prove conversion. This repo does not ship a sample photo. Take one on an iPhone (Settings → Camera → Formats → High Efficiency) and drop it here.

## Copy into 28to3

The 28to3 site can ship this as `apps/heic-save-as.html`:

- Copy `index.html` → `apps/heic-save-as.html`
- Copy `css/app.css` and `js/lib.js` + `js/app.js` next to it (keep the relative `css/` and `js/` paths), **or** inline those files into the single HTML page.

No build step. No npm install. Do not invent Stripe for this tool.

## GitHub Pages

This repo is static from the root (`index.html`). A workflow lives at `.github/workflows/pages.yml`. Enable Pages (Settings → Pages → GitHub Actions) so the workflow can publish. Details: [docs/github-pages.md](docs/github-pages.md).

## Develop / test

```bash
python3 -m http.server 4173
# open http://127.0.0.1:4173
node --test tests/lib.test.js
```

`js/lib.js` is the small filename / browser-support helper. Conversion itself is heic2any in the page.

## License

MIT. Keep the existing [LICENSE](LICENSE).
