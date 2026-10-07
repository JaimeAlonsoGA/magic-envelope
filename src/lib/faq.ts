/**
 * The questions people type into a search box. One page per language, with the same FAQPage
 * structured data, so the answers can show up under the result and an agent can quote them.
 */
import type { Lang } from "./model";

export type Faq = { q: string; a: string };
type FaqPage = { title: string; intro: string; items: Faq[] };

const en: FaqPage = {
  title: "Questions about free online invitations",
  intro: "Magic Envelope is a free invitation you seal and send. No account, no ads. Each guest gets their own letter.",
  items: [
    { q: "Can I make a free invitation online without an account?", a: "Yes. Open Magic Envelope, describe the occasion or start from a blank letter, and publish. There is no sign-up and no watermark." },
    { q: "Does each guest get their own name on the invitation?", a: "Yes. Add your guests and write {name} in the title or the text. Each person gets a link and an image with their own name, and their RSVP comes back to you." },
    { q: "How do I send invitations to a lot of people?", a: "For links: copy every link at once, or download a CSV and use it in your mail. For pictures: one ZIP holds every guest's image, named after the letter. Send next walks the list one person at a time when you want WhatsApp or email." },
    { q: "Can I download the invitation instead of printing it?", a: "Yes. Download is the main way out: one PNG per guest, or a ZIP of all of them. A guest can download their own letter after they open the envelope." },
    { q: "Can an AI agent create the invitation for me?", a: "Yes. The REST API and the MCP server create, update and export letters without opening the website. Docs and copy-ready examples are at /developers, and llms.txt describes the whole thing." },
    { q: "Can I make an invitation for a house party tonight?", a: "Yes. A house party, a get-together or a hangout is a party invitation: the place, the music and a reply. A film club, a workshop or an activity is an event invitation, with an agenda and a QR code. The date can be today. It is free, there is no account, and an agent can create it through the API." },
  ],
};

const es: FaqPage = {
  title: "Preguntas sobre invitaciones online gratis",
  intro: "Magic Envelope es una invitación gratis que se lacrá y se envía. Sin cuenta y sin anuncios. Cada invitado recibe su propia carta.",
  items: [
    { q: "¿Puedo hacer una invitación gratis online sin registrarme?", a: "Sí. Abre Magic Envelope, describe la ocasión o empieza por una carta en blanco, y publícala. No hay registro ni marca de agua." },
    { q: "¿Cada invitado ve su propio nombre?", a: "Sí. Añade a tus invitados y escribe {name} en el título o en el texto. Cada persona recibe un enlace y una imagen con su nombre, y su confirmación vuelve a ti." },
    { q: "¿Cómo envío invitaciones a mucha gente?", a: "Enlaces: cópialos todos de una vez, o descarga un CSV para tu correo. Imágenes: un ZIP con la de cada invitado, con el nombre de la carta. «Enviar el siguiente» recorre la lista de uno en uno si quieres WhatsApp o email." },
    { q: "¿Puedo descargar la invitación en vez de imprimirla?", a: "Sí. Descargar es la salida principal: un PNG por invitado, o un ZIP con todos. Quien abre el sobre también puede descargar su carta." },
    { q: "¿Puede un agente de IA crear la invitación?", a: "Sí. La API REST y el servidor MCP crean, actualizan y exportan cartas sin abrir la web. La documentación y los ejemplos están en /developers, y llms.txt lo resume." },
    { q: "¿Puedo hacer una invitación para una fiesta en casa esta noche?", a: "Sí. Una house party, una fiesta en casa o una quedada es una invitación de fiesta: el sitio, la música y la confirmación. Un cinefórum, un taller o una actividad es una invitación de evento, con agenda y un código QR. La fecha puede ser hoy. Es gratis, sin registro, y un agente puede crearla con la API." },
  ],
};

const fr: FaqPage = {
  title: "Questions sur les invitations en ligne gratuites",
  intro: "Magic Envelope est une invitation gratuite, cachetée et envoyée. Sans compte, sans publicité. Chaque invité a sa propre lettre.",
  items: [
    { q: "Puis-je créer une invitation gratuite sans compte ?", a: "Oui. Ouvrez Magic Envelope, décrivez l'occasion ou partez d'une lettre vide, puis publiez. Pas d'inscription, pas de filigrane." },
    { q: "Chaque invité a-t-il son propre nom ?", a: "Oui. Ajoutez vos invités et écrivez {name} dans le titre ou le texte. Chacun reçoit un lien et une image à son nom, et sa réponse vous revient." },
    { q: "Comment envoyer beaucoup d'invitations ?", a: "Liens : copiez-les tous, ou téléchargez un CSV pour votre messagerie. Images : un ZIP avec celle de chaque invité, au nom de la lettre. « Envoyer le suivant » parcourt la liste un par un pour WhatsApp ou l'e-mail." },
    { q: "Puis-je télécharger l'invitation au lieu de l'imprimer ?", a: "Oui. Le téléchargement est la sortie principale : un PNG par invité, ou un ZIP. L'invité peut aussi télécharger sa lettre après avoir ouvert l'enveloppe." },
    { q: "Un agent IA peut-il créer l'invitation ?", a: "Oui. L'API REST et le serveur MCP créent, modifient et exportent les lettres sans ouvrir le site. La documentation est sur /developers, et llms.txt résume le tout." },
    { q: "Puis-je faire une invitation pour une fête à la maison, ce soir ?", a: "Oui. Une fête à la maison ou une soirée entre amis est une invitation de fête : le lieu, la musique et une réponse. Un ciné-club, un atelier ou une activité est une invitation d’événement, avec un programme et un code QR. La date peut être aujourd’hui. C’est gratuit, sans compte, et un agent peut la créer via l’API." },
  ],
};

const pt: FaqPage = {
  title: "Perguntas sobre convites online grátis",
  intro: "Magic Envelope é um convite grátis, lacrado e enviado. Sem conta e sem anúncios. Cada convidado recebe a própria carta.",
  items: [
    { q: "Posso fazer um convite grátis online sem cadastro?", a: "Sim. Abra o Magic Envelope, descreva a ocasião ou comece de uma carta em branco e publique. Sem registro e sem marca d'água." },
    { q: "Cada convidado vê o próprio nome?", a: "Sim. Adicione os convidados e escreva {name} no título ou no texto. Cada pessoa recebe um link e uma imagem com o seu nome, e a confirmação volta para você." },
    { q: "Como envio convites para muita gente?", a: "Links: copie todos de uma vez, ou baixe um CSV para o seu e-mail. Imagens: um ZIP com a de cada convidado, com o nome da carta. «Enviar o próximo» percorre a lista um a um no WhatsApp ou e-mail." },
    { q: "Posso baixar o convite em vez de imprimir?", a: "Sim. Baixar é o caminho principal: um PNG por convidado, ou um ZIP com todos. Quem abre o envelope também pode baixar a própria carta." },
    { q: "Um agente de IA pode criar o convite?", a: "Sim. A API REST e o servidor MCP criam, atualizam e exportam cartas sem abrir o site. A documentação está em /developers, e o llms.txt resume tudo." },
    { q: "Posso fazer um convite para uma festa em casa hoje à noite?", a: "Sim. Uma festa em casa ou um encontro é um convite de festa: o local, a música e a confirmação. Um cineclube, uma oficina ou uma atividade é um convite de evento, com agenda e um código QR. A data pode ser hoje. É grátis, sem cadastro, e um agente pode criar pela API." },
  ],
};

const it: FaqPage = {
  title: "Domande sugli inviti online gratis",
  intro: "Magic Envelope è un invito gratis, sigillato e inviato. Senza account e senza pubblicità. Ogni ospite riceve la propria lettera.",
  items: [
    { q: "Posso fare un invito gratis online senza registrarmi?", a: "Sì. Apri Magic Envelope, descrivi l'occasione o parti da una lettera vuota, e pubblica. Nessuna iscrizione, nessuna filigrana." },
    { q: "Ogni ospite vede il proprio nome?", a: "Sì. Aggiungi gli ospiti e scrivi {name} nel titolo o nel testo. Ognuno riceve un link e un'immagine col suo nome, e la conferma torna a te." },
    { q: "Come invio tanti inviti?", a: "Link: copiali tutti insieme, oppure scarica un CSV per la posta. Immagini: uno ZIP con quella di ogni ospite, col nome della lettera. «Invia il prossimo» scorre la lista uno per uno su WhatsApp o email." },
    { q: "Posso scaricare l'invito invece di stamparlo?", a: "Sì. Scaricare è la via principale: un PNG per ospite, o uno ZIP. Chi apre la busta può anche scaricare la propria lettera." },
    { q: "Un agente IA può creare l'invito?", a: "Sì. L'API REST e il server MCP creano, aggiornano ed esportano le lettere senza aprire il sito. La documentazione è su /developers, e llms.txt riassume tutto." },
    { q: "Posso fare un invito per una festa a casa, stasera?", a: "Sì. Una festa a casa o una serata tra amici è un invito per una festa: il luogo, la musica e la conferma. Un cineforum, un laboratorio o un’attività è un invito per un evento, con agenda e codice QR. La data può essere oggi. È gratis, senza account, e un agente può crearlo con l’API." },
  ],
};

const de: FaqPage = {
  title: "Fragen zu kostenlosen Online-Einladungen",
  intro: "Magic Envelope ist eine kostenlose Einladung, versiegelt und verschickt. Ohne Konto, ohne Werbung. Jeder Gast bekommt seinen eigenen Brief.",
  items: [
    { q: "Kann ich eine kostenlose Einladung ohne Konto machen?", a: "Ja. Öffne Magic Envelope, beschreibe den Anlass oder fang mit einem leeren Brief an, und veröffentliche ihn. Keine Anmeldung, kein Wasserzeichen." },
    { q: "Sieht jeder Gast seinen eigenen Namen?", a: "Ja. Füge deine Gäste hinzu und schreibe {name} in den Titel oder den Text. Jede Person bekommt einen Link und ein Bild mit ihrem Namen, und die Antwort kommt zu dir zurück." },
    { q: "Wie verschicke ich viele Einladungen?", a: "Links: alle auf einmal kopieren, oder eine CSV für deine Mail herunterladen. Bilder: ein ZIP mit dem Bild jedes Gastes, benannt nach dem Brief. «Nächsten senden» geht die Liste einzeln durch, für WhatsApp oder E-Mail." },
    { q: "Kann ich die Einladung herunterladen statt drucken?", a: "Ja. Herunterladen ist der Hauptweg: ein PNG pro Gast, oder ein ZIP mit allen. Wer den Umschlag öffnet, kann den eigenen Brief auch herunterladen." },
    { q: "Kann ein KI-Agent die Einladung erstellen?", a: "Ja. Die REST-API und der MCP-Server erstellen, ändern und exportieren Briefe, ohne die Website zu öffnen. Die Doku steht unter /developers, und llms.txt fasst alles zusammen." },
    { q: "Kann ich eine Einladung für eine Houseparty heute Abend machen?", a: "Ja. Eine Houseparty oder ein Treffen ist eine Partyeinladung: Ort, Musik und eine Antwort. Ein Filmclub, ein Workshop oder eine Aktivität ist eine Event-Einladung, mit Agenda und QR-Code. Das Datum kann heute sein. Kostenlos, ohne Konto, und ein Agent kann sie über die API erstellen." },
  ],
};

export const FAQ: Record<Lang, FaqPage> = { en, es, fr, pt, it, de };

export const faqJsonLd = (lang: Lang, url: string) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: lang,
  url,
  mainEntity: FAQ[lang].items.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
});
