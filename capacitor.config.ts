import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The native apps are thin shells around the hosted web app (it needs its API
 * routes, so it can't be a static export). Point CAP_SERVER_URL at:
 *   - production:  https://magic-envelope.com
 *   - device dev:  http://<your-LAN-ip>:3000   (run `pnpm dev -H 0.0.0.0`)
 * `native-shell/` is only the offline fallback page.
 */
const url = process.env.CAP_SERVER_URL ?? "https://magic-envelope.com";

const config: CapacitorConfig = {
  appId: "app.magicenvelope",
  appName: "Magic Envelope",
  webDir: "native-shell",
  server: {
    url,
    cleartext: url.startsWith("http://"),
    errorPath: "index.html",
  },
  plugins: {
    SplashScreen: { launchShowDuration: 600, backgroundColor: "#fbf8f1", showSpinner: false },
  },
};

export default config;
