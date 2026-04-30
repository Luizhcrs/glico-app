// scripts/generate-icons.mjs
// Lê SVGs em assets/branding/ e gera PNGs prontos pra Expo em assets/.
// Uso: node scripts/generate-icons.mjs
// Requer: sharp (devDependency)

import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BRANDING = path.join(ROOT, 'assets', 'branding');
const OUT = path.join(ROOT, 'assets');

mkdirSync(OUT, { recursive: true });

const targets = [
  { src: 'icon.svg',                 out: 'icon.png',           size: 1024 },
  { src: 'adaptive-foreground.svg',  out: 'adaptive-icon.png',  size: 1024 },
  { src: 'icon.svg',                 out: 'favicon.png',        size: 48  },
  { src: 'splash.svg',               out: 'splash-icon.png',    size: 1024, square: true, fromSplash: true },
];

async function build() {
  for (const t of targets) {
    const inPath = path.join(BRANDING, t.src);
    const outPath = path.join(OUT, t.out);
    let pipeline = sharp(inPath, { density: 300 });
    if (t.fromSplash) {
      // Recorta o miolo (logo + label) num quadrado central
      const meta = await pipeline.metadata();
      const w = meta.width ?? 1242;
      const size = Math.min(w, 1024);
      const left = Math.round((w - size) / 2);
      // recortar centro vertical alto onde está o logo
      const top = 800;
      pipeline = pipeline.extract({ left, top, width: size, height: size });
    }
    await pipeline.resize(t.size, t.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPath);
    console.log(`✓ ${path.basename(outPath)} (${t.size}x${t.size})`);
  }
  console.log('\nDone. Update app.json icon paths if not already pointing to assets/*.png');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
