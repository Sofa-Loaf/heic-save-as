# GitHub Pages

HEIC Save As is a static site: `index.html`, `css/`, and `js/` at the repository root.

## Enable Pages

1. Open the repo **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Merge this workflow (`.github/workflows/pages.yml`) to the default branch.
4. The site publishes at `https://sofa-loaf.github.io/heic-save-as/`.

If Pages is not enabled, the deploy job will not have an environment to write to. The tool still works by opening `index.html` through a local static server or copying it to [28to3.me/apps/heic-save-as.html](https://28to3.me/apps/heic-save-as.html).

## What the workflow uploads

Only the files needed to run the converter:

- `index.html`
- `css/`
- `js/`
- `LICENSE`
- `README.md`

heic2any and JSZip load from jsDelivr. No backend, no tokens in the page, no account flow.
