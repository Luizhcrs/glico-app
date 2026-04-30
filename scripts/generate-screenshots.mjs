// scripts/generate-screenshots.mjs
// Renderiza HTML mockups via puppeteer em PNG 390x844 (iPhone-like).
// Output em screenshots/ no root (versionado pra README).

import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync, readdirSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MOCKUPS_DIR = path.join(__dirname, 'mockups');
const OUT = path.join(ROOT, 'screenshots');
mkdirSync(OUT, { recursive: true });

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };

async function build() {
  const files = readdirSync(MOCKUPS_DIR).filter((f) => f.endsWith('.html'));
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    for (const f of files) {
      const inUrl = pathToFileURL(path.join(MOCKUPS_DIR, f)).href;
      const outName = f.replace(/\.html$/, '.png');
      const outPath = path.join(OUT, outName);
      const page = await browser.newPage();
      await page.setViewport(VIEWPORT);
      await page.goto(inUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      // Aguarda font carregar
      await page.evaluate(() => document.fonts.ready);
      await new Promise((r) => setTimeout(r, 200));
      await page.screenshot({ path: outPath, type: 'png', omitBackground: false });
      await page.close();
      console.log(`[ok] ${outName}`);
    }
  } finally {
    await browser.close();
  }
  console.log(`\nDone. PNGs em ${OUT}`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
