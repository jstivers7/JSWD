# Deploy notes — Jeannie Stivers Web Design

This is a plain static site (hand-coded HTML/CSS/JS). No build step, no framework.

## Hosting: Cloudflare Pages (git-connected)

Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick this repo.

**Build settings:**
- Framework preset: **None**
- Build command: **(leave blank — there is no build step)**
- Build output directory: **/** (the repository root, where index.html lives)
- Root directory: **/** (leave as default)

After it's connected, every `git push` to the main branch auto-deploys. Preview deploys are created for other branches/PRs. Rollbacks are available under the project's "Deployments" tab.

## Custom domain

Project → **Custom domains → Set up a domain** → add `jeanniestiverswebdesign.com` and `www.jeanniestiverswebdesign.com`. Follow the DNS instructions Cloudflare shows; HTTPS is provisioned automatically. Use one as the primary and redirect the other (www → apex or apex → www).

## Contact form (host-independent)

The contact form posts to **Web3Forms** (https://web3forms.com), so it works on any host.
- The access key lives in `contact.html`:
  `<input type="hidden" name="access_key" value="...">`
- Submissions are emailed to the address tied to that key.
- On success the visitor is redirected to `/thanks.html`.
- If submissions ever stop arriving, first re-check that the access key is present and correct.

## Files
- `index.html`, `services.html`, `about.html`, `work.html`, `contact.html`, `thanks.html` — pages
- `styles.css` — all styles
- `water.js` — rippling-water background + wake effects
- `images/` — project screenshots (originals backed up in `images/originals/`)
- `og-image.png`, `favicon.png`, `apple-touch-icon.png` — social/icon assets
- logo PNGs

## Notes
- No server-side code anywhere; everything is static + the third-party form endpoint.
- Images are web-optimized (~1200px wide); keep new screenshots similar to stay light.
