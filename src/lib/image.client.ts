/** Downscale a picked photo to ≤1600px JPEG before upload. */
export async function shrink(file: File, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.85));
}

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  // Some formats (e.g. HEIC on Chrome) can't be decoded in-browser: send the original if it's small enough.
  fd.append("file", await shrink(file).catch(() => file));
  const r = await fetch("/api/upload", { method: "POST", body: fd });
  if (!r.ok) throw new Error(String(r.status));
  return (await r.json()).src;
}

export async function imagine(prompt: string, style: string, shape: string): Promise<string> {
  const r = await fetch("/api/imagine", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt, style, shape }),
  });
  if (!r.ok) throw new Error(String(r.status));
  return (await r.json()).src;
}
