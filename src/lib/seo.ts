/**
 * Search/agent-facing copy. One place for the words that describe Magic Envelope and each occasion,
 * used by metadata, the /for/<occasion> landing pages, the sitemap and structured data.
 */
import type { Kind } from "./model";
import type { StyleId } from "./styles";

export const SITE_NAME = "Magic Envelope";
export const TAGLINE = "Free invitations that arrive in a sealed envelope";
export const DESCRIPTION =
  "Create beautiful invitations and letters for free — weddings, birthdays, parties, baby showers and more. Each guest gets their own link with their name on the envelope, one-tap RSVP, map and calendar. Or download them as images. No account.";

export const OCCASIONS: Record<Kind, { title: string; h1: string; intro: string; styles: StyleId[]; points: string[] }> = {
  wedding: {
    title: "Free wedding invitations online",
    h1: "Wedding invitations, sealed with wax",
    intro: "Send each guest their own wedding invitation: their name on the envelope, the ceremony and reception times, a map, a dress code moodboard, your gift list and one-tap RSVP.",
    styles: ["parchment", "romance", "deco"],
    points: ["Personal link for every guest", "RSVP by WhatsApp, SMS or email", "Schedule, dress code and gift list", "Download as images to print or share"],
  },
  birthday: {
    title: "Free birthday invitations online",
    h1: "Birthday invitations they'll actually open",
    intro: "A birthday invitation that arrives in an envelope with the guest's name, a countdown to the party, the place on a map and one-tap replies.",
    styles: ["notebook", "bubblegum", "confetti"],
    points: ["Live countdown to the party", "Add to calendar in one tap", "Personal link per friend", "Free, no account"],
  },
  party: {
    title: "Free party invitations online",
    h1: "Party invitations with style",
    intro: "From a dinner with friends to a night out: pick a look, add the place, the music and a dress code, and send everyone their own invitation.",
    styles: ["groovy", "launch", "midnight"],
    points: ["Playlist and dress code", "Map and directions", "One-tap RSVP", "Share as a link or an image"],
  },
  baby: {
    title: "Free baby shower invitations online",
    h1: "Baby shower invitations",
    intro: "Soft, warm baby shower invitations with the date, the place, a gift list and replies straight to your phone.",
    styles: ["bubblegum", "romance", "botanical"],
    points: ["Gift list or bank details", "Personal link per guest", "RSVP to your phone", "Download as images"],
  },
  dinner: {
    title: "Free dinner invitations online",
    h1: "Dinner invitations",
    intro: "Invite people to your table with a letter: the menu or schedule, the address and a simple way to say yes.",
    styles: ["botanical", "ivory", "minimal"],
    points: ["Schedule or menu", "Address with map", "One-tap RSVP", "Free, no account"],
  },
  graduation: {
    title: "Free graduation party invitations online",
    h1: "Graduation invitations",
    intro: "Celebrate the milestone: a graduation invitation with a countdown, the place and replies from everyone you want there.",
    styles: ["midnight", "parchment", "launch"],
    points: ["Countdown to the day", "Map and calendar", "Personal link per guest", "Download as images"],
  },
  event: {
    title: "Free event invitations online",
    h1: "Event invitations",
    intro: "Launches, meetups, talks: a clean invitation with the agenda, the place, links and a QR code to check in.",
    styles: ["launch", "minimal", "brutal"],
    points: ["Agenda and links", "QR code", "Personal invitation per attendee", "API for agents and automations"],
  },
  letter: {
    title: "Write a letter online, sealed in an envelope",
    h1: "A letter, sealed in an envelope",
    intro: "Some things only fit in a letter. Write it, seal it with wax, and send it — it opens like real mail.",
    styles: ["parchment", "typewriter", "ivory"],
    points: ["Opens like real mail", "Wax seal with your initials", "Printable", "Free, no account"],
  },
};
