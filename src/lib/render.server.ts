import "server-only";
import type { Browser } from "puppeteer-core";
import { SITE_URL } from "./site";

/**
 * Letters as images on the server, drawn by a real browser from the same page the app shows, so an
 * agent's PNG/JPEG matches the editor's export exactly. Vercel uses the packaged Chromium; local
 * development uses the installed Chrome (CHROME_PATH to override).
 */
export type ImageFormat = "png" | "jpeg";

const LOCAL_CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function launch(): Promise<Browser> {
  const puppeteer = (await import("puppeteer-core")).default;
  if (!process.env.VERCEL) return puppeteer.launch({ executablePath: LOCAL_CHROME, headless: true });
  const chromium = (await import("@sparticuz/chromium")).default;
  return puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    executablePath: await chromium.executablePath(),
    headless: "shell",
  });
}

/** The renderer reads the published letter from this deployment's own public site. */
const origin = () => (process.env.VERCEL && process.env.VERCEL_ENV !== "production" && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : SITE_URL);

/** Render one image per guest (null = the letter without a name), in one browser session. */
export async function renderLetters(id: string, guests: (string | null)[], format: ImageFormat, onEach?: (i: number, img: Uint8Array) => void) {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 640, height: 900, deviceScaleFactor: 2 });
    const out: Uint8Array[] = [];
    for (const [i, g] of guests.entries()) {
      await page.goto(`${origin()}/render/${id}${g ? `?g=${encodeURIComponent(g)}` : ""}`, { waitUntil: "networkidle0", timeout: 30_000 });
      await page.evaluate(() => document.fonts.ready);
      const el = await page.$("#letter");
      if (!el) throw new Error("letter not found");
      // PNG keeps the corners outside the letter's radius transparent; JPEG has no alpha, so they take the page colour
      if (format === "jpeg") await page.evaluate(() => { document.documentElement.style.background = document.body.style.background = "#fbf8f1"; });
      const img = await el.screenshot(format === "jpeg" ? { type: "jpeg", quality: 88 } : { type: "png", omitBackground: true });
      out.push(img);
      onEach?.(i, img);
    }
    return out;
  } finally {
    await browser.close();
  }
}
