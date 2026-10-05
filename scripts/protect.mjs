// Builds a password-protected case study page.
//
// The readable source lives in private/ (git-ignored, never published). This
// script encrypts its <main> content with AES-GCM, using a key derived from
// the password with PBKDF2, and writes the published page with only the
// encrypted data plus an unlock form (assets/js/unlock.js decrypts it in the
// browser).
//
// Usage: node scripts/protect.mjs <password> [slug]
//   slug defaults to "intaker": reads private/<slug>.html,
//   writes projects/<slug>/index.html
//
// Edit the text in private/<slug>.html, then run this again.

import { readFileSync, writeFileSync } from "node:fs";

const [password, slug = "intaker"] = process.argv.slice(2);
if (!password) {
  console.error("Usage: node scripts/protect.mjs <password> [slug]");
  process.exit(1);
}

const ITERATIONS = 600000;
const source = readFileSync(`private/${slug}.html`, "utf8");

const open = source.match(/<main class="([^"]*)">/);
const close = source.lastIndexOf("</main>");
if (!open || close < 0) throw new Error("No <main> found in source");
const start = open.index + open[0].length;
const content = source.slice(start, close);

const { subtle } = globalThis.crypto;
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const baseKey = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  baseKey,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"]
);
const data = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(content)));

const b64 = (bytes) => Buffer.from(bytes).toString("base64");
const payload = JSON.stringify({ iterations: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(data) });

const form = `
    <section class="locked">
      <a class="back" href="/"><span aria-hidden="true">←</span> Work</a>
      <h1 class="locked__title">This case study is password protected</h1>
      <p class="locked__text">Enter the password you were given to read it.</p>
      <form class="locked__form" data-unlock>
        <label class="visually-hidden" for="locked-password">Password</label>
        <input class="locked__input" id="locked-password" type="password" autocomplete="current-password" required>
        <button class="pill locked__submit" type="submit" aria-label="Unlock"><span aria-hidden="true">→</span></button>
      </form>
      <p class="locked__error" role="alert" hidden>That password didn't work. Try again.</p>
    </section>
    <script type="application/json" id="locked-data">${payload}</script>
  `;

let page = source.slice(0, start) + form + source.slice(close);
// The lightbox loads after unlocking (unlock.js), once the images exist
page = page.replace('  <script src="/assets/js/lightbox.js" defer></script>\n', "");
page = page.replace(
  '  <script src="/assets/js/menu.js" defer></script>\n',
  '  <script src="/assets/js/menu.js" defer></script>\n  <script src="/assets/js/unlock.js" defer></script>\n'
);
page = page.replace(`<main class="${open[1]}">`, `<main class="${open[1]}" data-locked>`);

writeFileSync(`projects/${slug}/index.html`, page);
console.log(`Wrote projects/${slug}/index.html (${content.length} chars encrypted)`);
