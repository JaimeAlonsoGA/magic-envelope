/**
 * Localized search copy: the site's title/description and every occasion landing page, written
 * for how people search in each language (slugs are the search terms, not translations of ids).
 */
import type { Kind, Lang } from "./model";
import type { Occasion, SiteCopy } from "./seo";

type Localized = { site: SiteCopy; slugs: Record<Kind, string>; occasions: Record<Kind, Occasion> };

export const LOCALIZED: Record<Exclude<Lang, "en">, Localized> = {
  es: {
    site: {
      title: "Magic Envelope — Invitaciones gratis en un sobre lacrado",
      description: "Crea invitaciones y cartas preciosas gratis: bodas, cumpleaños, fiestas, baby showers y más. Cada invitado recibe su propio enlace con su nombre en el sobre, confirmación con un toque, mapa y calendario. O descárgalas como imagen. Sin registro.",
    },
    slugs: {
      wedding: "invitaciones-de-boda", birthday: "invitaciones-de-cumpleanos", party: "invitaciones-de-fiesta", baby: "invitaciones-baby-shower",
      dinner: "invitaciones-para-cena", graduation: "invitaciones-de-graduacion", event: "invitaciones-para-eventos", letter: "carta-online",
    },
    occasions: {
      wedding: {
        title: "Invitaciones de boda gratis online", h1: "Invitaciones de boda, selladas con lacre",
        intro: "Envía a cada invitado su propia invitación de boda: su nombre en el sobre, la hora de la ceremonia y del banquete, un mapa, un moodboard de dress code, vuestra lista de regalos y confirmación con un toque.",
        styles: ["parchment", "romance", "deco"],
        points: ["Un enlace para cada invitado", "Confirmación por WhatsApp, SMS o email", "Programa, dress code y lista de regalos", "Descárgalas como imagen para imprimir o compartir"],
      },
      birthday: {
        title: "Invitaciones de cumpleaños gratis online", h1: "Invitaciones de cumpleaños que sí se abren",
        intro: "Una invitación de cumpleaños que llega en un sobre con el nombre del invitado, una cuenta atrás hasta la fiesta, el sitio en el mapa y respuestas con un toque.",
        styles: ["notebook", "bubblegum", "confetti"],
        points: ["Cuenta atrás hasta la fiesta", "Al calendario con un toque", "Un enlace para cada amigo", "Gratis, sin registro"],
      },
      party: {
        title: "Invitaciones de fiesta gratis online", h1: "Invitaciones de fiesta con estilo",
        intro: "De una cena con amigos a una noche de fiesta: elige un estilo, añade el sitio, la música y el dress code, y envía a cada uno su propia invitación.",
        styles: ["groovy", "launch", "midnight"],
        points: ["Playlist y dress code", "Mapa y cómo llegar", "Confirmación con un toque", "Como enlace o como imagen"],
      },
      baby: {
        title: "Invitaciones de baby shower gratis online", h1: "Invitaciones de baby shower",
        intro: "Invitaciones de baby shower suaves y cálidas, con la fecha, el lugar, una lista de regalos y las respuestas directas a tu móvil.",
        styles: ["bubblegum", "romance", "botanical"],
        points: ["Lista de regalos o Bizum", "Un enlace para cada invitado", "Respuestas a tu móvil", "Descárgalas como imagen"],
      },
      dinner: {
        title: "Invitaciones para cena gratis online", h1: "Invitaciones para una cena",
        intro: "Invita a tu mesa con una carta: el menú o el programa, la dirección y una forma sencilla de decir que sí.",
        styles: ["botanical", "ivory", "minimal"],
        points: ["Menú o programa", "Dirección con mapa", "Confirmación con un toque", "Gratis, sin registro"],
      },
      graduation: {
        title: "Invitaciones de graduación gratis online", h1: "Invitaciones de graduación",
        intro: "Celebra el logro: una invitación de graduación con cuenta atrás, el lugar y las respuestas de todos los que quieres que estén.",
        styles: ["midnight", "parchment", "launch"],
        points: ["Cuenta atrás hasta el día", "Mapa y calendario", "Un enlace para cada invitado", "Descárgalas como imagen"],
      },
      event: {
        title: "Invitaciones para eventos gratis online", h1: "Invitaciones para eventos",
        intro: "Lanzamientos, quedadas, charlas: una invitación limpia con la agenda, el lugar, enlaces y un código QR para el acceso.",
        styles: ["launch", "minimal", "brutal"],
        points: ["Agenda y enlaces", "Código QR", "Una invitación para cada asistente", "API para agentes y automatizaciones"],
      },
      letter: {
        title: "Escribe una carta online, en un sobre lacrado", h1: "Una carta, sellada en un sobre",
        intro: "Hay cosas que solo caben en una carta. Escríbela, séllala con lacre y envíala: se abre como el correo de verdad.",
        styles: ["parchment", "typewriter", "ivory"],
        points: ["Se abre como una carta de verdad", "Lacre con tus iniciales", "Para imprimir", "Gratis, sin registro"],
      },
    },
  },
  fr: {
    site: {
      title: "Magic Envelope — Invitations gratuites dans une enveloppe scellée",
      description: "Créez gratuitement de belles invitations et lettres : mariages, anniversaires, fêtes, baby showers et plus. Chaque invité reçoit son propre lien avec son nom sur l’enveloppe, une réponse en un geste, la carte et le calendrier. Ou téléchargez-les en image. Sans compte.",
    },
    slugs: {
      wedding: "faire-part-mariage", birthday: "invitation-anniversaire", party: "invitation-fete", baby: "invitation-baby-shower",
      dinner: "invitation-diner", graduation: "invitation-remise-diplome", event: "invitation-evenement", letter: "lettre-en-ligne",
    },
    occasions: {
      wedding: {
        title: "Faire-part de mariage gratuit en ligne", h1: "Faire-part de mariage, scellés à la cire",
        intro: "Envoyez à chaque invité son propre faire-part : son nom sur l’enveloppe, les horaires de la cérémonie et de la réception, une carte, un moodboard de dress code, votre liste de mariage et une réponse en un geste.",
        styles: ["parchment", "romance", "deco"],
        points: ["Un lien pour chaque invité", "Réponse par WhatsApp, SMS ou e-mail", "Programme, dress code et liste de mariage", "Téléchargeables en image pour imprimer ou partager"],
      },
      birthday: {
        title: "Invitation d’anniversaire gratuite en ligne", h1: "Des invitations d’anniversaire qu’on ouvre vraiment",
        intro: "Une invitation d’anniversaire qui arrive dans une enveloppe au nom de l’invité, avec un compte à rebours, le lieu sur la carte et des réponses en un geste.",
        styles: ["notebook", "bubblegum", "confetti"],
        points: ["Compte à rebours jusqu’à la fête", "Ajout au calendrier en un geste", "Un lien pour chaque ami", "Gratuit, sans compte"],
      },
      party: {
        title: "Invitation de fête gratuite en ligne", h1: "Des invitations de fête qui ont du style",
        intro: "D’un dîner entre amis à une soirée : choisissez un style, ajoutez le lieu, la musique et le dress code, et envoyez à chacun sa propre invitation.",
        styles: ["groovy", "launch", "midnight"],
        points: ["Playlist et dress code", "Carte et itinéraire", "Réponse en un geste", "En lien ou en image"],
      },
      baby: {
        title: "Invitation baby shower gratuite en ligne", h1: "Invitations de baby shower",
        intro: "Des invitations de baby shower douces et chaleureuses, avec la date, le lieu, une liste de cadeaux et les réponses directement sur votre téléphone.",
        styles: ["bubblegum", "romance", "botanical"],
        points: ["Liste de cadeaux ou RIB", "Un lien pour chaque invité", "Réponses sur votre téléphone", "Téléchargeables en image"],
      },
      dinner: {
        title: "Invitation à dîner gratuite en ligne", h1: "Invitations à dîner",
        intro: "Invitez à votre table avec une lettre : le menu ou le programme, l’adresse et une façon simple de dire oui.",
        styles: ["botanical", "ivory", "minimal"],
        points: ["Menu ou programme", "Adresse avec carte", "Réponse en un geste", "Gratuit, sans compte"],
      },
      graduation: {
        title: "Invitation remise de diplôme gratuite", h1: "Invitations de remise de diplôme",
        intro: "Fêtez l’étape : une invitation avec compte à rebours, le lieu et les réponses de tous ceux que vous voulez voir.",
        styles: ["midnight", "parchment", "launch"],
        points: ["Compte à rebours jusqu’au jour J", "Carte et calendrier", "Un lien pour chaque invité", "Téléchargeables en image"],
      },
      event: {
        title: "Invitation d’événement gratuite en ligne", h1: "Invitations d’événement",
        intro: "Lancements, meetups, conférences : une invitation nette avec le programme, le lieu, des liens et un code QR pour l’accueil.",
        styles: ["launch", "minimal", "brutal"],
        points: ["Programme et liens", "Code QR", "Une invitation par participant", "API pour agents et automatisations"],
      },
      letter: {
        title: "Écrire une lettre en ligne, scellée à la cire", h1: "Une lettre, scellée dans une enveloppe",
        intro: "Certaines choses ne tiennent que dans une lettre. Écrivez-la, scellez-la à la cire et envoyez-la : elle s’ouvre comme du vrai courrier.",
        styles: ["parchment", "typewriter", "ivory"],
        points: ["S’ouvre comme du vrai courrier", "Cachet de cire à vos initiales", "Imprimable", "Gratuit, sans compte"],
      },
    },
  },
  pt: {
    site: {
      title: "Magic Envelope — Convites grátis num envelope lacrado",
      description: "Crie convites e cartas lindos de graça: casamentos, aniversários, festas, chás de bebê e muito mais. Cada convidado recebe seu próprio link com o nome no envelope, confirmação com um toque, mapa e calendário. Ou baixe como imagem. Sem cadastro.",
    },
    slugs: {
      wedding: "convites-de-casamento", birthday: "convites-de-aniversario", party: "convites-de-festa", baby: "convites-cha-de-bebe",
      dinner: "convites-para-jantar", graduation: "convites-de-formatura", event: "convites-para-eventos", letter: "carta-online",
    },
    occasions: {
      wedding: {
        title: "Convites de casamento grátis online", h1: "Convites de casamento, lacrados com cera",
        intro: "Envie a cada convidado seu próprio convite de casamento: o nome no envelope, os horários da cerimônia e da festa, um mapa, um moodboard de traje, a lista de presentes e confirmação com um toque.",
        styles: ["parchment", "romance", "deco"],
        points: ["Um link para cada convidado", "Confirmação por WhatsApp, SMS ou e-mail", "Programa, traje e lista de presentes", "Baixe como imagem para imprimir ou compartilhar"],
      },
      birthday: {
        title: "Convites de aniversário grátis online", h1: "Convites de aniversário que todo mundo abre",
        intro: "Um convite de aniversário que chega num envelope com o nome do convidado, uma contagem regressiva para a festa, o local no mapa e respostas com um toque.",
        styles: ["notebook", "bubblegum", "confetti"],
        points: ["Contagem regressiva para a festa", "Na agenda com um toque", "Um link para cada amigo", "Grátis, sem cadastro"],
      },
      party: {
        title: "Convites de festa grátis online", h1: "Convites de festa com estilo",
        intro: "De um jantar com amigos a uma noitada: escolha um estilo, adicione o local, a música e o traje, e envie a cada um seu próprio convite.",
        styles: ["groovy", "launch", "midnight"],
        points: ["Playlist e traje", "Mapa e rotas", "Confirmação com um toque", "Como link ou imagem"],
      },
      baby: {
        title: "Convites de chá de bebê grátis online", h1: "Convites de chá de bebê",
        intro: "Convites de chá de bebê delicados e acolhedores, com a data, o local, a lista de presentes e as respostas direto no seu celular.",
        styles: ["bubblegum", "romance", "botanical"],
        points: ["Lista de presentes ou Pix", "Um link para cada convidado", "Respostas no seu celular", "Baixe como imagem"],
      },
      dinner: {
        title: "Convites para jantar grátis online", h1: "Convites para jantar",
        intro: "Convide para a sua mesa com uma carta: o cardápio ou o programa, o endereço e um jeito simples de dizer sim.",
        styles: ["botanical", "ivory", "minimal"],
        points: ["Cardápio ou programa", "Endereço com mapa", "Confirmação com um toque", "Grátis, sem cadastro"],
      },
      graduation: {
        title: "Convites de formatura grátis online", h1: "Convites de formatura",
        intro: "Comemore a conquista: um convite de formatura com contagem regressiva, o local e as respostas de todos que você quer por perto.",
        styles: ["midnight", "parchment", "launch"],
        points: ["Contagem regressiva para o dia", "Mapa e agenda", "Um link para cada convidado", "Baixe como imagem"],
      },
      event: {
        title: "Convites para eventos grátis online", h1: "Convites para eventos",
        intro: "Lançamentos, encontros, palestras: um convite limpo com a agenda, o local, links e um código QR para o credenciamento.",
        styles: ["launch", "minimal", "brutal"],
        points: ["Agenda e links", "Código QR", "Um convite para cada participante", "API para agentes e automações"],
      },
      letter: {
        title: "Escreva uma carta online, lacrada num envelope", h1: "Uma carta, lacrada num envelope",
        intro: "Algumas coisas só cabem numa carta. Escreva, lacre com cera e envie: ela abre como correspondência de verdade.",
        styles: ["parchment", "typewriter", "ivory"],
        points: ["Abre como carta de verdade", "Lacre com suas iniciais", "Para imprimir", "Grátis, sem cadastro"],
      },
    },
  },
  it: {
    site: {
      title: "Magic Envelope — Inviti gratuiti in una busta sigillata",
      description: "Crea gratis inviti e lettere bellissimi: matrimoni, compleanni, feste, baby shower e altro. Ogni ospite riceve il suo link con il nome sulla busta, conferma con un tocco, mappa e calendario. Oppure scaricali come immagine. Senza registrazione.",
    },
    slugs: {
      wedding: "partecipazioni-matrimonio", birthday: "inviti-compleanno", party: "inviti-festa", baby: "inviti-baby-shower",
      dinner: "inviti-cena", graduation: "inviti-laurea", event: "inviti-eventi", letter: "lettera-online",
    },
    occasions: {
      wedding: {
        title: "Partecipazioni di matrimonio gratis online", h1: "Partecipazioni di matrimonio, sigillate con ceralacca",
        intro: "Invia a ogni ospite la sua partecipazione: il nome sulla busta, gli orari di cerimonia e ricevimento, una mappa, un moodboard del dress code, la lista nozze e la conferma con un tocco.",
        styles: ["parchment", "romance", "deco"],
        points: ["Un link per ogni ospite", "Conferma via WhatsApp, SMS o email", "Programma, dress code e lista nozze", "Scaricabili come immagine da stampare o condividere"],
      },
      birthday: {
        title: "Inviti di compleanno gratis online", h1: "Inviti di compleanno che vengono aperti davvero",
        intro: "Un invito di compleanno che arriva in una busta con il nome dell’ospite, il conto alla rovescia per la festa, il luogo sulla mappa e risposte con un tocco.",
        styles: ["notebook", "bubblegum", "confetti"],
        points: ["Conto alla rovescia per la festa", "In calendario con un tocco", "Un link per ogni amico", "Gratis, senza registrazione"],
      },
      party: {
        title: "Inviti per feste gratis online", h1: "Inviti per feste con stile",
        intro: "Da una cena tra amici a una serata: scegli uno stile, aggiungi il luogo, la musica e il dress code, e invia a ognuno il suo invito.",
        styles: ["groovy", "launch", "midnight"],
        points: ["Playlist e dress code", "Mappa e indicazioni", "Conferma con un tocco", "Come link o immagine"],
      },
      baby: {
        title: "Inviti baby shower gratis online", h1: "Inviti per baby shower",
        intro: "Inviti per baby shower delicati e calorosi, con la data, il luogo, una lista regali e le risposte direttamente sul tuo telefono.",
        styles: ["bubblegum", "romance", "botanical"],
        points: ["Lista regali o IBAN", "Un link per ogni ospite", "Risposte sul tuo telefono", "Scaricabili come immagine"],
      },
      dinner: {
        title: "Inviti a cena gratis online", h1: "Inviti a cena",
        intro: "Invita alla tua tavola con una lettera: il menù o il programma, l’indirizzo e un modo semplice per dire di sì.",
        styles: ["botanical", "ivory", "minimal"],
        points: ["Menù o programma", "Indirizzo con mappa", "Conferma con un tocco", "Gratis, senza registrazione"],
      },
      graduation: {
        title: "Inviti di laurea gratis online", h1: "Inviti di laurea",
        intro: "Festeggia il traguardo: un invito di laurea con conto alla rovescia, il luogo e le risposte di tutti quelli che vuoi accanto.",
        styles: ["midnight", "parchment", "launch"],
        points: ["Conto alla rovescia per il giorno", "Mappa e calendario", "Un link per ogni ospite", "Scaricabili come immagine"],
      },
      event: {
        title: "Inviti per eventi gratis online", h1: "Inviti per eventi",
        intro: "Lanci, meetup, talk: un invito pulito con l’agenda, il luogo, i link e un codice QR per l’accoglienza.",
        styles: ["launch", "minimal", "brutal"],
        points: ["Agenda e link", "Codice QR", "Un invito per ogni partecipante", "API per agenti e automazioni"],
      },
      letter: {
        title: "Scrivi una lettera online, sigillata con ceralacca", h1: "Una lettera, sigillata in una busta",
        intro: "Certe cose stanno solo in una lettera. Scrivila, sigillala con la ceralacca e inviala: si apre come la posta vera.",
        styles: ["parchment", "typewriter", "ivory"],
        points: ["Si apre come posta vera", "Sigillo con le tue iniziali", "Stampabile", "Gratis, senza registrazione"],
      },
    },
  },
  de: {
    site: {
      title: "Magic Envelope — Kostenlose Einladungen im versiegelten Umschlag",
      description: "Erstelle kostenlos schöne Einladungen und Briefe: Hochzeiten, Geburtstage, Partys, Babypartys und mehr. Jeder Gast bekommt seinen eigenen Link mit seinem Namen auf dem Umschlag, Zusage mit einem Tipp, Karte und Kalender. Oder lade sie als Bild herunter. Ohne Konto.",
    },
    slugs: {
      wedding: "hochzeitseinladungen", birthday: "geburtstagseinladungen", party: "partyeinladungen", baby: "babyparty-einladungen",
      dinner: "einladung-zum-essen", graduation: "einladung-abschlussfeier", event: "event-einladungen", letter: "brief-online",
    },
    occasions: {
      wedding: {
        title: "Kostenlose Hochzeitseinladungen online", h1: "Hochzeitseinladungen, mit Wachs versiegelt",
        intro: "Schick jedem Gast seine eigene Hochzeitseinladung: sein Name auf dem Umschlag, die Zeiten von Trauung und Feier, eine Karte, ein Dresscode-Moodboard, eure Wunschliste und Zusage mit einem Tipp.",
        styles: ["parchment", "romance", "deco"],
        points: ["Ein eigener Link für jeden Gast", "Zusage per WhatsApp, SMS oder E-Mail", "Ablauf, Dresscode und Wunschliste", "Als Bild zum Drucken oder Teilen"],
      },
      birthday: {
        title: "Kostenlose Geburtstagseinladungen online", h1: "Geburtstagseinladungen, die wirklich geöffnet werden",
        intro: "Eine Geburtstagseinladung, die im Umschlag mit dem Namen des Gasts ankommt: mit Countdown zur Party, dem Ort auf der Karte und Antworten mit einem Tipp.",
        styles: ["notebook", "bubblegum", "confetti"],
        points: ["Countdown zur Party", "Mit einem Tipp in den Kalender", "Ein Link für jeden Freund", "Kostenlos, ohne Konto"],
      },
      party: {
        title: "Kostenlose Partyeinladungen online", h1: "Partyeinladungen mit Stil",
        intro: "Vom Essen mit Freunden bis zur langen Nacht: Wähle einen Stil, füge Ort, Musik und Dresscode hinzu und schick allen ihre eigene Einladung.",
        styles: ["groovy", "launch", "midnight"],
        points: ["Playlist und Dresscode", "Karte und Route", "Zusage mit einem Tipp", "Als Link oder als Bild"],
      },
      baby: {
        title: "Kostenlose Babyparty-Einladungen online", h1: "Einladungen zur Babyparty",
        intro: "Sanfte, herzliche Einladungen zur Babyparty mit Datum, Ort, Wunschliste und Antworten direkt auf dein Handy.",
        styles: ["bubblegum", "romance", "botanical"],
        points: ["Wunschliste oder IBAN", "Ein Link für jeden Gast", "Antworten aufs Handy", "Als Bild herunterladen"],
      },
      dinner: {
        title: "Kostenlose Einladungen zum Essen online", h1: "Einladungen zum Essen",
        intro: "Lade mit einem Brief an deinen Tisch ein: Menü oder Ablauf, die Adresse und ein einfacher Weg, Ja zu sagen.",
        styles: ["botanical", "ivory", "minimal"],
        points: ["Menü oder Ablauf", "Adresse mit Karte", "Zusage mit einem Tipp", "Kostenlos, ohne Konto"],
      },
      graduation: {
        title: "Kostenlose Einladungen zur Abschlussfeier", h1: "Einladungen zur Abschlussfeier",
        intro: "Feier den Abschluss: eine Einladung mit Countdown, dem Ort und den Antworten von allen, die dabei sein sollen.",
        styles: ["midnight", "parchment", "launch"],
        points: ["Countdown zum großen Tag", "Karte und Kalender", "Ein Link für jeden Gast", "Als Bild herunterladen"],
      },
      event: {
        title: "Kostenlose Event-Einladungen online", h1: "Einladungen für Events",
        intro: "Launches, Meetups, Vorträge: eine klare Einladung mit Agenda, Ort, Links und QR-Code für den Einlass.",
        styles: ["launch", "minimal", "brutal"],
        points: ["Agenda und Links", "QR-Code", "Eine Einladung pro Gast", "API für Agenten und Automationen"],
      },
      letter: {
        title: "Einen Brief online schreiben, mit Wachs versiegelt", h1: "Ein Brief, versiegelt im Umschlag",
        intro: "Manches passt nur in einen Brief. Schreib ihn, versiegle ihn mit Wachs und verschick ihn: Er öffnet sich wie echte Post.",
        styles: ["parchment", "typewriter", "ivory"],
        points: ["Öffnet sich wie echte Post", "Wachssiegel mit deinen Initialen", "Druckbar", "Kostenlos, ohne Konto"],
      },
    },
  },
};
