import sharp from "sharp";
import path from "path";

const PUBLIC = path.join(process.cwd(), "public");
const FILES = ["logo-blue.png", "logo-black.png", "logo-silver.png", "logo-gold.png"];

async function recut(filename: string) {
  const src = path.join(PUBLIC, filename);
  const image = sharp(src);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const buf = Buffer.from(data);

  // Apply alpha threshold: any pixel with alpha < 128 → fully transparent; else keep color
  // Also apply 1px border erosion: if any of the 4 neighbours is transparent, set this pixel transparent too
  const out = Buffer.from(buf);

  // Pass 1: threshold
  for (let i = 0; i < width * height; i++) {
    const a = buf[i * channels + 3];
    if (a < 128) {
      out[i * channels + 0] = 0;
      out[i * channels + 1] = 0;
      out[i * channels + 2] = 0;
      out[i * channels + 3] = 0;
    }
  }

  // Pass 2: 1px erosion (clear any pixel where at least one orthogonal neighbour is fully transparent)
  const eroded = Buffer.from(out);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (out[idx + 3] === 0) continue; // already transparent

      const neighbours = [
        y > 0            ? out[((y-1)*width + x)*channels + 3] : 0,
        y < height - 1   ? out[((y+1)*width + x)*channels + 3] : 0,
        x > 0            ? out[(y*width + (x-1))*channels + 3] : 0,
        x < width - 1    ? out[(y*width + (x+1))*channels + 3] : 0,
      ];

      if (neighbours.some(a => a === 0)) {
        eroded[idx + 0] = 0;
        eroded[idx + 1] = 0;
        eroded[idx + 2] = 0;
        eroded[idx + 3] = 0;
      }
    }
  }

  await sharp(eroded, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(src);

  console.log(`recut: ${filename} (${width}×${height})`);
}

async function run() {
  for (const f of FILES) {
    try {
      await recut(f);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`skip ${f}: ${msg}`);
    }
  }
  console.log("done");
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
