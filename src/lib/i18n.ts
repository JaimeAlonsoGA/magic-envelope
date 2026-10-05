/**
 * Letter languages: everything a *guest* reads (template copy, action buttons on the card, the envelope).
 * App UI copy lives in lib/ui.ts and is always English.
 */
import { detectLang } from "./lang";
import type { Kind, Lang } from "./model";

type Guest = {
  to: string; open: string; tapToOpen: string; share: string; copied: string; print: string;
  calendar: string; map: string; attending: string; notAttending: string; maybe: string; deadline: string;
  days: string; hours: string; minutes: string; seconds: string; scan: string; makeYourOwn: string; today: string;
  friend: string; // default {name} when there's no guest
  rsvpFlat: string; // printed RSVP line, e.g. "Please confirm"
};
type Dict = {
  langName: string;
  kinds: Record<Kind, string>; // fallback title when a letter has no heading
  guest: Guest;
  tpl: Record<Kind, { h: string; t: string; sign: string }>;
};

const es: Dict = {
  langName: "Español",
  kinds: { birthday: "Cumpleaños", wedding: "Boda", party: "Fiesta", baby: "Baby shower", dinner: "Cena", graduation: "Graduación", event: "Evento", letter: "Carta" },
  guest: {
    to: "Para", open: "Abrir", tapToOpen: "Toca el sobre", share: "Compartir", copied: "¡Copiado!", print: "Imprimir",
    calendar: "Añadir al calendario", map: "Cómo llegar", attending: "Allí estaré", notAttending: "No podré", maybe: "Quizás",
    deadline: "Responde antes del", days: "días", hours: "horas", minutes: "min", seconds: "seg", scan: "Escanéame",
    makeYourOwn: "Crea tu sobre mágico", today: "¡Es hoy!",
    friend: "Querido Invitado", rsvpFlat: "Confirma tu asistencia",
  },
  tpl: {
    birthday: { h: "¡Cumplo años!", t: "Ven a celebrarlo conmigo. Habrá tarta, música y magia.", sign: "Con cariño" },
    wedding: { h: "Nos casamos", t: "Queremos compartir este día tan especial contigo.", sign: "Con amor" },
    party: { h: "¡Fiesta!", t: "Trae tus mejores pasos de baile.", sign: "¡Te esperamos!" },
    baby: { h: "Baby shower", t: "Un pequeño gran milagro está en camino.", sign: "Con ilusión" },
    dinner: { h: "Cena en casa", t: "Una mesa, buena comida y mejor compañía.", sign: "Hasta pronto" },
    graduation: { h: "¡Me gradúo!", t: "Lo logré. Celebrémoslo juntos.", sign: "Gracias por estar" },
    event: { h: "Estás invitado", t: "Nos encantaría contar contigo.", sign: "El equipo" },
    letter: { h: "Querida persona,", t: "Hay cosas que solo caben en una carta…", sign: "Siempre tuyo" },
  },
};

const en: Dict = {
  langName: "English",
  kinds: { birthday: "Birthday", wedding: "Wedding", party: "Party", baby: "Baby shower", dinner: "Dinner", graduation: "Graduation", event: "Event", letter: "Letter" },
  guest: {
    to: "To", open: "Open", tapToOpen: "Tap the envelope", share: "Share", copied: "Copied!", print: "Print",
    calendar: "Add to calendar", map: "Directions", attending: "I'll be there", notAttending: "Can't make it", maybe: "Maybe",
    deadline: "Please reply by", days: "days", hours: "hours", minutes: "min", seconds: "sec", scan: "Scan me",
    makeYourOwn: "Make your own magic envelope", today: "It's today!",
    friend: "Dear Guest", rsvpFlat: "Please RSVP",
  },
  tpl: {
    birthday: { h: "It's my birthday!", t: "Come celebrate with me. There will be cake, music and magic.", sign: "With love" },
    wedding: { h: "We're getting married", t: "We'd love to share this special day with you.", sign: "With love" },
    party: { h: "Party time!", t: "Bring your best dance moves.", sign: "See you there!" },
    baby: { h: "Baby shower", t: "A tiny miracle is on the way.", sign: "With joy" },
    dinner: { h: "Dinner at ours", t: "One table, good food, better company.", sign: "See you soon" },
    graduation: { h: "I graduated!", t: "I made it. Let's celebrate together.", sign: "Thanks for being there" },
    event: { h: "You're invited", t: "We'd love to have you with us.", sign: "The team" },
    letter: { h: "Dear you,", t: "Some things only fit in a letter…", sign: "Always yours" },
  },
};

const fr: Dict = {
  langName: "Français",
  kinds: { birthday: "Anniversaire", wedding: "Mariage", party: "Fête", baby: "Baby shower", dinner: "Dîner", graduation: "Diplôme", event: "Événement", letter: "Lettre" },
  guest: {
    to: "Pour", open: "Ouvrir", tapToOpen: "Touchez l'enveloppe", share: "Partager", copied: "Copié !", print: "Imprimer",
    calendar: "Ajouter au calendrier", map: "Itinéraire", attending: "J'y serai", notAttending: "Je ne pourrai pas", maybe: "Peut-être",
    deadline: "Répondez avant le", days: "jours", hours: "heures", minutes: "min", seconds: "s", scan: "Scannez-moi",
    makeYourOwn: "Créez votre enveloppe magique", today: "C'est aujourd'hui !",
    friend: "Cher Invité", rsvpFlat: "Merci de confirmer",
  },
  tpl: {
    birthday: { h: "C'est mon anniversaire !", t: "Viens fêter ça avec moi. Gâteau, musique et magie.", sign: "Bises" },
    wedding: { h: "Nous nous marions", t: "Nous aimerions partager ce jour unique avec vous.", sign: "Avec amour" },
    party: { h: "C'est la fête !", t: "Apporte tes meilleurs pas de danse.", sign: "À bientôt !" },
    baby: { h: "Baby shower", t: "Un petit miracle arrive.", sign: "Avec joie" },
    dinner: { h: "Dîner à la maison", t: "Une table, de bons plats, une belle compagnie.", sign: "À très vite" },
    graduation: { h: "Diplômé·e !", t: "J'ai réussi. Fêtons-le ensemble.", sign: "Merci d'être là" },
    event: { h: "Vous êtes invité·e", t: "Nous serions ravis de vous compter parmi nous.", sign: "L'équipe" },
    letter: { h: "Cher toi,", t: "Certaines choses ne tiennent que dans une lettre…", sign: "Pour toujours" },
  },
};

const pt: Dict = {
  langName: "Português",
  kinds: { birthday: "Aniversário", wedding: "Casamento", party: "Festa", baby: "Chá de bebê", dinner: "Jantar", graduation: "Formatura", event: "Evento", letter: "Carta" },
  guest: {
    to: "Para", open: "Abrir", tapToOpen: "Toque no envelope", share: "Compartilhar", copied: "Copiado!", print: "Imprimir",
    calendar: "Adicionar à agenda", map: "Como chegar", attending: "Estarei lá", notAttending: "Não poderei", maybe: "Talvez",
    deadline: "Responda até", days: "dias", hours: "horas", minutes: "min", seconds: "seg", scan: "Escaneie",
    makeYourOwn: "Crie seu envelope mágico", today: "É hoje!",
    friend: "Querido Convidado", rsvpFlat: "Confirme presença",
  },
  tpl: {
    birthday: { h: "É meu aniversário!", t: "Vem comemorar comigo. Bolo, música e magia.", sign: "Com carinho" },
    wedding: { h: "Vamos casar", t: "Queremos compartilhar este dia especial com você.", sign: "Com amor" },
    party: { h: "Festa!", t: "Traga seus melhores passos de dança.", sign: "Te esperamos!" },
    baby: { h: "Chá de bebê", t: "Um pequeno milagre está a caminho.", sign: "Com alegria" },
    dinner: { h: "Jantar em casa", t: "Uma mesa, boa comida e ótima companhia.", sign: "Até breve" },
    graduation: { h: "Me formei!", t: "Consegui. Vamos comemorar juntos.", sign: "Obrigado por estar aqui" },
    event: { h: "Você está convidado", t: "Adoraríamos contar com você.", sign: "A equipe" },
    letter: { h: "Querida pessoa,", t: "Há coisas que só cabem numa carta…", sign: "Sempre seu" },
  },
};

const it: Dict = {
  langName: "Italiano",
  kinds: { birthday: "Compleanno", wedding: "Matrimonio", party: "Festa", baby: "Baby shower", dinner: "Cena", graduation: "Laurea", event: "Evento", letter: "Lettera" },
  guest: {
    to: "Per", open: "Apri", tapToOpen: "Tocca la busta", share: "Condividi", copied: "Copiato!", print: "Stampa",
    calendar: "Aggiungi al calendario", map: "Indicazioni", attending: "Ci sarò", notAttending: "Non potrò", maybe: "Forse",
    deadline: "Rispondi entro il", days: "giorni", hours: "ore", minutes: "min", seconds: "sec", scan: "Scansionami",
    makeYourOwn: "Crea la tua busta magica", today: "È oggi!",
    friend: "Caro Ospite", rsvpFlat: "Conferma la tua presenza",
  },
  tpl: {
    birthday: { h: "È il mio compleanno!", t: "Vieni a festeggiare con me. Torta, musica e magia.", sign: "Con affetto" },
    wedding: { h: "Ci sposiamo", t: "Vorremmo condividere questo giorno speciale con te.", sign: "Con amore" },
    party: { h: "Festa!", t: "Porta i tuoi passi di danza migliori.", sign: "Ti aspettiamo!" },
    baby: { h: "Baby shower", t: "Un piccolo miracolo è in arrivo.", sign: "Con gioia" },
    dinner: { h: "Cena a casa", t: "Una tavola, buon cibo e ottima compagnia.", sign: "A presto" },
    graduation: { h: "Mi sono laureato/a!", t: "Ce l'ho fatta. Festeggiamo insieme.", sign: "Grazie di esserci" },
    event: { h: "Sei invitato", t: "Ci farebbe piacere averti con noi.", sign: "Il team" },
    letter: { h: "Cara persona,", t: "Certe cose stanno solo in una lettera…", sign: "Per sempre tuo" },
  },
};

const de: Dict = {
  langName: "Deutsch",
  kinds: { birthday: "Geburtstag", wedding: "Hochzeit", party: "Party", baby: "Babyparty", dinner: "Abendessen", graduation: "Abschluss", event: "Event", letter: "Brief" },
  guest: {
    to: "An", open: "Öffnen", tapToOpen: "Umschlag antippen", share: "Teilen", copied: "Kopiert!", print: "Drucken",
    calendar: "Zum Kalender", map: "Route", attending: "Ich komme", notAttending: "Ich kann nicht", maybe: "Vielleicht",
    deadline: "Bitte antworte bis", days: "Tage", hours: "Std", minutes: "Min", seconds: "Sek", scan: "Scan mich",
    makeYourOwn: "Erstelle deinen magischen Umschlag", today: "Heute ist es so weit!",
    friend: "Lieber Gast", rsvpFlat: "Bitte gib Bescheid",
  },
  tpl: {
    birthday: { h: "Ich habe Geburtstag!", t: "Feier mit mir. Es gibt Kuchen, Musik und Magie.", sign: "Alles Liebe" },
    wedding: { h: "Wir heiraten", t: "Wir möchten diesen besonderen Tag mit dir teilen.", sign: "In Liebe" },
    party: { h: "Party!", t: "Bring deine besten Tanzschritte mit.", sign: "Bis bald!" },
    baby: { h: "Babyparty", t: "Ein kleines Wunder ist unterwegs.", sign: "Voller Vorfreude" },
    dinner: { h: "Abendessen bei uns", t: "Ein Tisch, gutes Essen, noch bessere Gesellschaft.", sign: "Bis bald" },
    graduation: { h: "Geschafft!", t: "Ich habe meinen Abschluss. Lass uns feiern.", sign: "Danke, dass du da bist" },
    event: { h: "Du bist eingeladen", t: "Wir würden uns freuen, dich dabei zu haben.", sign: "Das Team" },
    letter: { h: "Liebe Person,", t: "Manche Dinge passen nur in einen Brief…", sign: "Für immer deins" },
  },
};

export const DICTS: Record<Lang, Dict> = { es, en, fr, pt, it, de };
export const t = (lang: Lang) => DICTS[lang];

export const FLAGS: Record<Lang, string> = { es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", pt: "🇧🇷", it: "🇮🇹", de: "🇩🇪" };

/** Best default letter language for this device. */
/** Default letter language for a new letter: the language this person reads the app in. */
export const guessLang = (): Lang => detectLang();
