import { cp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outputDirectory = fileURLToPath(new URL("../out/", import.meta.url));
const pagesDirectory = fileURLToPath(new URL("../docs/", import.meta.url));

await rm(pagesDirectory, { recursive: true, force: true });
await cp(outputDirectory, pagesDirectory, { recursive: true });

console.log("GitHub Pages snapshot refreshed in docs/");
