const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const root = path.resolve(__dirname, "..");
const dir = path.join(root, "build-lock");
const parts = fs.readdirSync(dir).filter((name) => name.startsWith("pnpm-lock.br.part")).sort();
if (!parts.length) throw new Error("Missing pnpm lockfile chunks");
const compressed = Buffer.concat(parts.map((name) => fs.readFileSync(path.join(dir, name))));
fs.writeFileSync(path.join(root, "pnpm-lock.yaml"), zlib.brotliDecompressSync(compressed));
const payloadDir = path.join(root, "build-payload");
const payloadManifest = JSON.parse(fs.readFileSync(path.join(payloadDir, "manifest.json"), "utf8"));
for (const entry of payloadManifest) {
  const compressedPayload = Buffer.concat(entry.parts.map((name) => fs.readFileSync(path.join(payloadDir, name))));
  const target = path.join(root, entry.target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, zlib.brotliDecompressSync(compressedPayload));
}
console.log("Restored pnpm lockfile and EAS build payload");
