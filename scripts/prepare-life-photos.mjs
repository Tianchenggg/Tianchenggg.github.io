import { mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

// Web derivatives only: original user-supplied photographs remain untouched.
// Usage: node scripts/prepare-life-photos.mjs <directory containing the uploads>
const sourceDirectory = process.argv[2];
if (!sourceDirectory) throw new Error("Provide the directory containing the ten uploaded photographs.");
const photos = [
  ["white-blossoms", "bc8d5f6c-a784-473a-a63c-9fa9b9a6647f"],
  ["willow-pavilion", "adcbda7f-a169-4fa7-b8f3-6c220ab61838"],
  ["golden-water", "67ee8be2-1c00-448c-96e8-b8254673cade"],
  ["fireworks", "fd72b0a1-6e12-4786-86a3-036266261e6a"],
  ["willow-bridge", "d1803a50-62aa-4633-ab43-59f0f36d2bae"],
  ["stained-glass", "799a3f75-c82e-4c68-a5c2-47dc0c6608f4"],
  ["lake-town", "250f420c-6d14-4bec-9d91-d610cb78aba4"],
  ["tower-at-dusk", "e34ddc24-857e-4cbd-9dc3-875cda3f3b5e"],
  ["night-market", "038a49cf-cb67-4643-9803-3f6e6bb1d464"],
  ["city-blue-hour", "4bc746eb-92bd-46bd-8297-6eef972a610d"],
];
const outputDirectory = resolve("public/life");
await mkdir(outputDirectory, { recursive: true });
let totalBytes = 0;
for (const [id, upload] of photos) {
  const source = resolve(sourceDirectory, `codex-clipboard-${upload}.jpg`);
  const original = await sharp(source).metadata();
  const sizes = [];
  for (const width of [480, 960, null]) {
    const output = resolve(outputDirectory, `${id}${width ? `-${width}` : ""}.webp`);
    const pipeline = sharp(source).autoOrient();
    if (width) pipeline.resize({ width, withoutEnlargement: true });
    // The default metadata stripping also prevents embedded GPS/EXIF disclosure.
    const result = await pipeline.webp({ quality: width ? 84 : 92, effort: 5 }).toFile(output);
    totalBytes += (await stat(output)).size;
    sizes.push(`${result.width}×${result.height}: ${Math.round(result.size / 1024)} KB`);
  }
  console.log(`${id} (${original.width}×${original.height}) → ${sizes.join(", ")}`);
}
console.log(`Total web derivatives: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
