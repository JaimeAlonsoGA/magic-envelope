// Tells IndexNow engines (Bing, Yandex, Naver, Seznam…) about every URL in the sitemap.
// Run after deploying content changes: node scripts/indexnow.mjs
const HOST = "magic-envelope.com";
const KEY = "4b9bef5f91d6e157412fb9869c90b638"; // also served at /4b9bef5f91d6e157412fb9869c90b638.txt (public/)

const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});
console.log(res.status, res.statusText, `— ${urlList.length} URLs`);
