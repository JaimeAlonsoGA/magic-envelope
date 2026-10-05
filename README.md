# ✉ Magic Envelope

Free invitations and letters: birthdays, weddings, parties, dinners, letters…
Pick a ready-made template or build one from typed blocks. Send a link and the guest opens a sealed envelope.

Not an editor. Everything is typed and modular.

## Run

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Locally, without any keys, published cards and uploaded images are saved under `.data/`. Only AI images need a key.


## For agents

Everything the app does is available without a browser:

- **MCP** — `https://magic-envelope.com/api/mcp` (tools: `get_catalog`, `create_letter`, `get_letter`, `update_letter`)
- **REST** — `POST /api/v1/letters`, `GET|PATCH /api/v1/letters/:id` (`Authorization: Bearer <editKey>`), `GET /api/v1/catalog`
- **Specs** — `/api/v1/openapi.json`, `/api/v1/schema`, `/llms.txt`, docs at `/developers`

The REST and MCP adapters share one service layer (`src/lib/api.server.ts`) and validate with the same Zod schemas as the editor.

## Native apps (Capacitor 8)

The iOS/Android apps are thin shells around the hosted web app (it needs API routes, so no static export).
`capacitor.config.ts` points the WebView at `CAP_SERVER_URL` (default `https://magic-envelope.com`); `native-shell/` is only the offline page.

```bash
pnpm dev:lan                                   # dev server reachable from your phone
CAP_SERVER_URL=http://192.168.1.20:3000 pnpm cap:android   # or cap:ios (opens Android Studio / Xcode)
```

`src/lib/native.ts` is the single bridge: each function uses the Capacitor plugin in the app and the web API in the browser.

| Function | Native | Browser |
| --- | --- | --- |
| `share()` | system share sheet | Web Share, falls back to copying the link |
| `haptic()` | Taptic/vibration | `navigator.vibrate` |
| `copy()` | native clipboard | Clipboard API |
| `pickPhoto()` | camera / photo library | file input (`capture` opens the camera on mobile) |
| `saveFile()` | write to cache, then share (Files, Calendar…) | download |
| `onBack()` | Android back button closes sheets / wizard steps | – |
| deep links | `appUrlOpen` opens `/c/…` inside the app | – |

## Environment

| Variable | Purpose |
| --- | --- |
| `AI_GATEWAY_API_KEY` | AI image generation via Vercel AI Gateway (on Vercel, OIDC works without it) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store for published cards (private) and images (public) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL, e.g. `https://magic-envelope.com` (QR codes, OG images) |
| `IMAGE_MODEL` | Optional override, default `bfl/flux-2-klein-4b` (cheap and fast) |

## Architecture

```
src/lib/model.ts        Zod schemas: Card, 15 Block types, kinds, themes, languages
src/lib/blocks.ts       block registry (icons, palette, factories) + 24 templates (8 kinds × 3)
src/lib/ui.ts           app UI copy (always English)
src/lib/styles.ts       letter styles = design-system tokens (fonts, colors, background, frame, control shape, envelope) + per-letter overrides
src/lib/i18n.ts         letter languages es · en · fr · pt · it · de (guest-facing copy + presets)
src/lib/fields.ts       field kinds (phone, email, url, date…): one validator for editor + renderer
src/lib/craft.ts        seal shapes/marks & envelope geometry/palettes (shared by app and OG image)
src/lib/color.ts        opaque shading helpers
src/lib/themes.ts       6 themes (parchment, midnight, rose, forest, sky, ink)
src/lib/actions.ts      calendar (.ics / Google), maps, RSVP deep links, music embeds
src/lib/drafts.ts       drafts in localStorage (no account needed)
src/lib/store.server.ts Vercel Blob storage, or .data/ in local dev

src/components/sketch.tsx         Excalidraw-style rough.js frames and buttons
src/components/card/blocks.tsx    renderer per block type
src/components/craft.tsx          wax seal, envelope art, envelope opener
src/components/editor/            tap-a-block editor, "+" palette, theme, share sheet
src/components/wizard.tsx         language → kind → template

/                 home (drafts)
/new              wizard (?kind=wedding jumps to templates)
/edit/[id]        editor (local draft)
/c/[id]           public envelope (+ OG image for WhatsApp/iMessage previews)
/e/[id]#key       "edit on another device": imports the card into local drafts
/api/publish      save/overwrite a card (id + secret edit key)
/api/upload       image upload (resized client-side)
/api/imagine      AI image → stored → URL
/api/card/[id]    card JSON for holders of the edit key

src/lib/personalize.ts            {name} token: resolution and fallbacks
src/lib/mail.ts                   envelope slots (fixed block types), stamps, per-style envelope defaults
src/components/editor/envelope-editor.tsx  envelope canvas + slot/seal editors
src/components/export-stage.tsx   flat PNG/ZIP rendering (fonts embedded per style)
src/components/editor/guests-panel.tsx, send-panel.tsx
```

### Adding a block type

1. Add a schema in `lib/model.ts` and include it in the `Block` union (add a migration there if you change an existing shape).
2. Add an icon, a palette entry and a factory in `lib/blocks.ts`, and its label in `lib/ui.ts`.
3. Add a renderer case and an `isEmpty` rule in `components/card/blocks.tsx`.
4. Add an editor case in `components/editor/block-editor.tsx`, using `Field` with the right field kind.
5. Add any guest-facing words to `lib/i18n.ts`.

TypeScript's exhaustive switches flag every step you missed.

## Features

- Wizard: letter language → style (15 styles: Classic, Elegant, Modern, Playful, Retro) → blank letter (default) or an occasion preset
- Style panel in the editor: switch style, customize accent/paper/text colors and title/text fonts, seal (symbol, initials or none), text written on the envelope (supports the guest name)
- Preview page mirrors the editor's Link/Image choice and "preview as" guest, and can send directly
- App UI is English; each letter has its own language (changeable from the Style panel)
- 15 blocks: title, text, image, date, place + map, countdown, RSVP (WhatsApp/SMS/email), QR, link, schedule, dress code moodboard (colors, emojis, words, pictures), gifts (IBAN copy / registry), music (Spotify/YouTube/SoundCloud), signature, divider
- AI images in 4 styles (storybook, medieval, sketch, photo) and photo upload
- Six themes, custom wax-seal glyph, an envelope addressed "To: …"
- Guest list: add, paste a list ("Name, phone/email") or pick from contacts; `{name}` in any text addresses each guest
  - every guest gets their own link (`/c/<id>?g=<guest>`) — only *their* name is ever sent to their browser
  - send per guest via their channel (WhatsApp / email / share sheet), track who was sent, copy all links, CSV
  - RSVP replies carry the guest's name; the envelope is addressed to them
- Envelope (link letters): fixed slots holding real blocks — Title (recipient), Text (sender, note, under the seal) and Stamp (postage, 14 perforated stamps) — edited with the same editor, placeholders and rules as the letter; seal in 4 shapes (scalloped, round, flower, octagon) with a vector mark (12 icons, 1–3 initials, a couple "A ♥ J", plain or none), always legible on any wax colour. Styles ship their own envelope (trim + stamp). Guests receive the front, turn it over with a tap, open it with a second; the real letter slides out.
- Preview shows exactly what a guest receives: the envelope (replayable) for links, the actual exported PNG for images.
- Two outputs from one letter: the interactive link, or flat images (PNG per guest, ZIP for all, print/PDF).
  Blocks with actions render flat automatically in images, and each can turn its buttons off for the link too.
- Share: link, native share sheet, WhatsApp, downloadable QR, print/PDF
- Guests get "add to calendar", directions, a live countdown and one-tap RSVP
- Installable PWA (iOS/Android home screen), dark-mode chrome, reduced-motion support
- Published links are `noindex`; each card can be re-published from the device that created it
