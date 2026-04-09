/**
 * Remove white/near-white background from logo PNGs using sharp.
 * Converts each file to RGBA and sets pixels with R,G,B all > 240 to transparent.
 * Overwrites the originals in place.
 */
import sharp from "sharp";
import path from "path";

const LOGOS = ["logo-blue.png", "logo-gold.png", "logo-silver.png"];
const PUBLIC_DIR = path.join(process.cwd(), "public");

async function removeWhiteBackground(filename: string): Promise<void> {
  const filePath = path.join(PUBLIC_DIR, filename);

  const image = sharp(filePath);
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error(`${filename}: could not read dimensions`);

  // Extract raw RGBA pixels
  const { data } = await image
    .ensureAlpha()          // adds alpha channel if missing
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data.buffer);
  let changed = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    // Knock out white and very near-white (accounts for JPEG-ish compression fringing)
    if (r > 240 && g > 240 && b > 240) {
      pixels[i + 3] = 0; // set alpha to transparent
      changed++;
    }
  }

  console.log(`${filename}: ${changed} white pixels → transparent (of ${width * height} total)`);

  await sharp(Buffer.from(pixels), {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toFile(filePath);

  console.log(`  ✓ saved ${filePath}`);
}

(async () => {
  for (const logo of LOGOS) {
    await removeWhiteBackground(logo);
  }
  console.log("\nAll logos fixed.");
})();
