const { createHash } = require("node:crypto");
const { readdir, readFile, stat, writeFile } = require("node:fs/promises");
const path = require("node:path");

const BIN_FILES = ["chromium.br", "al2023.tar.br", "fonts.tar.br", "swiftshader.tar.br"];

/** Turbopack writes the traces and does not apply outputFileTracingIncludes. Patch them before the Vercel adapter reads them. */
async function tightenServerTraces(distDir) {
  const serverDir = path.join(distDir, "server");
  const nfts = await walk(serverDir);
  if (nfts.length === 0) return;
  const chromiumBin = await findChromiumBin(path.join(process.cwd(), "node_modules", ".pnpm"));
  let renderers = 0;
  let stripped = 0;
  for (const nftPath of nfts) {
    const raw = JSON.parse(await readFile(nftPath, "utf8"));
    const dir = path.dirname(nftPath);
    const keep = isRenderer(nftPath);
    const next = [];
    const hashes = [];
    for (let i = 0; i < raw.files.length; i++) {
      const file = raw.files[i];
      if (isData(file) || (!keep && isBrowserPackage(file)) || (keep && isChromiumBin(file))) {
        stripped++;
        continue;
      }
      next.push(file);
      hashes.push(raw.fileHashes?.[i] ?? (await hashFile(path.resolve(dir, file))));
    }
    if (keep && chromiumBin) {
      renderers++;
      for (const name of BIN_FILES) {
        const abs = path.join(chromiumBin, name);
        const rel = path.relative(dir, abs).split(path.sep).join("/");
        if (next.includes(rel)) continue;
        next.push(rel);
        hashes.push(await hashFile(abs));
      }
    }
    raw.files = next;
    if (raw.fileHashes) raw.fileHashes = hashes;
    await writeFile(nftPath, JSON.stringify(raw));
  }
  console.log(`Server traces: Chromium binary on ${renderers} render routes, ${stripped} extra files removed.`);
}

function isRenderer(nftPath) {
  const n = nftPath.split(path.sep).join("/");
  return n.endsWith("/app/api/v1/letters/[id]/image/route.js.nft.json") || n.endsWith("/app/api/v1/letters/[id]/images.zip/route.js.nft.json");
}

function isData(file) {
  return file.split("\\").join("/").includes("/.data/");
}

function isBrowserPackage(file) {
  const n = file.split("\\").join("/");
  return n.includes("/@sparticuz/chromium") || n.includes("/@sparticuz+chromium") || n.includes("/puppeteer-core") || n.includes("/@puppeteer/") || n.includes("puppeteer-core@");
}

function isChromiumBin(file) {
  const n = file.split("\\").join("/");
  return n.includes("/chromium/bin/");
}

async function hashFile(abs) {
  const buf = await readFile(abs);
  return createHash("sha256").update(buf).digest("hex").slice(0, 32);
}

async function findChromiumBin(pnpmDir) {
  let entries = [];
  try {
    entries = await readdir(pnpmDir);
  } catch {
    return null;
  }
  const name = entries.find((e) => e.startsWith("@sparticuz+chromium@"));
  if (!name) return null;
  const bin = path.join(pnpmDir, name, "node_modules", "@sparticuz", "chromium", "bin");
  try {
    if (!(await stat(path.join(bin, "chromium.br"))).isFile()) return null;
  } catch {
    return null;
  }
  return bin;
}

async function walk(dir, out = []) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(p, out);
    else if (entry.name.endsWith(".nft.json")) out.push(p);
  }
  return out;
}

module.exports = { tightenServerTraces };
