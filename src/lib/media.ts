/**
 * Remote pictures on a letter (a Drive link, a hotlink) often arrive as a tiny preview or get blocked
 * in the browser. Everything that draws an image asks here for an address: our own files stay as they
 * are; any other http(s) URL is loaded through /api/media, which copies the full picture onto our origin.
 */
import { SITE_URL } from "./site";

export function isOwnImage(src: string) {
  if (src.startsWith("/api/file/")) return true;
  try {
    const u = new URL(src);
    return u.hostname === new URL(SITE_URL).hostname && u.pathname.startsWith("/api/file/");
  } catch {
    return false;
  }
}

/** Turn sharing-page and thumbnail links into a direct, full-size image URL. */
export function directImageUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return raw;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "images.weserv.nl" || host === "wsrv.nl") {
    const inner = u.searchParams.get("url");
    if (inner) return directImageUrl(/^https?:/i.test(inner) ? inner : `https://${inner}`);
  }
  if (host === "drive.google.com" || host === "docs.google.com") {
    const id = u.pathname.match(/\/d\/([^/]+)/)?.[1] ?? u.searchParams.get("id");
    if (id) return `https://lh3.googleusercontent.com/d/${id}=s0`;
  }
  if (host.endsWith("googleusercontent.com") || host.endsWith("ggpht.com")) {
    // =s220 and friends are thumbnails. =s0 asks for the original; a bare /d/<id> gets one too.
    if (/=(?:[swh]\d+|s0)(?:-[a-z0-9-]+)?(?=$|[?#])/i.test(raw))
      return raw.replace(/=(?:[swh]\d+|s0)(?:-[a-z0-9-]+)?(?=$|[?#])/i, "=s0");
    if (/\/d\/[^/=?#]+$/.test(u.pathname)) return `${u.origin}${u.pathname}=s0${u.search}`;
    return raw;
  }
  if (host === "upload.wikimedia.org") {
    const thumb = u.pathname.match(/^(.*\/)thumb\/(.+\.(?:jpe?g|png|gif|webp))\/\d+px-[^/]+$/i);
    if (thumb) return `${u.origin}${thumb[1]}${thumb[2]}`;
  }
  if (host.endsWith("dropbox.com")) {
    u.hostname = host.startsWith("dl.") ? u.hostname : "dl.dropboxusercontent.com";
    u.searchParams.set("dl", "1");
    u.searchParams.delete("raw");
    return u.href;
  }
  return u.href;
}

/** src for an <img>: same-origin, full size. */
export function displayImageSrc(src: string) {
  const s = src.trim();
  if (!s || isOwnImage(s) || s.startsWith("/")) return s;
  if (!/^https?:\/\//i.test(s)) return s;
  return `/api/media?url=${encodeURIComponent(s)}`;
}
