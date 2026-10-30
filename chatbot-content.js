/* ══════════════════════════════════════════════════════════════════
   BESUCHER-ASSISTENT – ALLE TEXTE, KNÖPFE UND STICHWÖRTER
   (keine KI: nur diese vorgefertigten Antworten; die Logik steht in chatbot.js)

   SO PFLEGEN SIE DIESE DATEI
   • Nur Texte zwischen Anführungszeichen ändern – Namen links vom Doppelpunkt (z. B. text:, frage:) nie umbenennen.
   • Antwort ändern: unter `antworten` den Eintrag suchen (z. B. `wer:`) und `text` anpassen.
     Jeder Eintrag in `text: [ … ]` wird ein eigener Absatz.
   • Ein TODO ersetzen: Bei Antworten mit `todo: true` fehlt eine verlässliche Angabe. Text in `text` eintragen,
     dann `todo: true` auf `todo: false` setzen. Solange todo:true gilt, zeigt der Assistent nur
     „Dazu kann ich leider nichts Verlässliches sagen …“ mit E-Mail-Knopf.
   • Neue Antwort: einen Eintrag nach dem Muster der anderen anlegen (eindeutiger Name, frage, text, stichwoerter)
     und seinen Namen in einer Gruppe unter `gruppen` bei `antworten: [ … ]` eintragen (sonst nur über die Suche erreichbar).
   • stichwoerter: Wörter oder Wortgruppen, nach denen die Freitext-Suche sucht (Groß-/Kleinschreibung und Umlaute egal).
     Wortgruppen mit Leerzeichen müssen als Ganzes vorkommen. Tippfehler werden teilweise automatisch erkannt.
   • Platzhalter {werke_mit_bild}, {collagen}, {plastiken}, {platzhalter} werden automatisch aus den Werkdaten gezählt.
   • aktionen: Knöpfe unter einer Antwort. art: termin (Besichtigungs-Dialog), mail (E-Mail-Entwurf; betreff/geruest optional),
     impressum, datenschutz, rundgang, merkliste, sprache (DE/EN umschalten), abschnitt (ziel: galerie, ueber-uns,
     das-werk, ausstellungen, socials, kontakt).
   • weiter: Namen anderer Antworten, die als Folgefragen angeboten werden.
   • Hinter jeder Antwort steht als Kommentar die Quelle (Datei › Abschnitt) zur Überprüfung.
   ══════════════════════════════════════════════════════════════════ */
window.ASSISTENT_INHALT = {

  titel: 'Besucher-Assistent',
  hinweis: 'Automatischer Assistent mit vorgefertigten Antworten, keine KI und keine persönliche Beratung.',
  begruessung: 'Guten Tag! Ich beantworte häufige Fragen zu Horst Schwab, seinem Werk und dieser Website.',
  menue_text: 'Wählen Sie ein Thema oder schreiben Sie Ihre Frage unten in das Feld.',
  todo_text: 'Dazu kann ich leider nichts Verlässliches sagen. Bitte fragen Sie per E-Mail.',
  unklar_text: 'Dazu habe ich leider keine passende Antwort gefunden. Vielleicht hilft eines dieser Themen – oder fragen Sie per E-Mail.',
  mehrdeutig_text: 'Meinen Sie eine dieser Fragen?',
  unklar_themen: ['person', 'besuch', 'website'],          // Themen, die bei unverständlichen Eingaben angeboten werden
  eingabe_label: 'Ihre Frage',
  eingabe_platzhalter: 'Frage eingeben …',
  knoepfe: { zurueck: '‹ Zurück', neustart: 'Neu starten', mail: 'Per E-Mail fragen', senden: 'Fragen' },

  // Kontakt: Adresse aus dem Impressum (index.html › Impressum › Kontakt)
  mail: {
    adresse: 'info@horstschwab.de',
    betreff: 'Frage über die Website',
    geruest: 'Guten Tag,\n\nich habe eine Frage zu Horst Schwab bzw. seinem Werk:\n\n\nViele Grüße\n'
  },

  // Englischer Modus: der Assistent ist bewusst nur deutsch (siehe CLAUDE.md, Gelernte Regeln)
  englisch: {
    titel: 'Visitor Assistant',
    hinweis_ki: 'Automated assistant with prepared answers – not AI, no personal advice.',
    text: 'This assistant is available in German only. For questions in English, please write to us by e-mail.',
    mail_label: 'Ask by e-mail',
    betreff: 'Question via the website',
    geruest: 'Hello,\n\nI have a question about Horst Schwab or his work:\n\n\nKind regards\n'
  },

  // Hauptmenü: fünf Themengruppen (Daten und Datenschutz gehören zu „Website und Datenschutz“)
  gruppen: [
    { id: 'person',  titel: 'Über Horst Schwab',          einleitung: 'Was möchten Sie über Horst Schwab wissen?',
      antworten: ['wer', 'herkunft', 'ausbildung', 'anliegen', 'ausstellungen', 'zitate'] },
    { id: 'werke',   titel: 'Werke und Technik',          einleitung: 'Fragen zu den Werken:',
      antworten: ['werkarten', 'techniken', 'anzahl', 'entstehung', 'titel', 'offline', 'originale'] },
    { id: 'recht',   titel: 'Kaufen und Rechtliches',     einleitung: 'Fragen zu Kauf, Leihe und Rechten:',
      antworten: ['kaufen', 'leihen', 'bildnutzung', 'rechte', 'betreiber', 'wert'] },
    { id: 'besuch',  titel: 'Besichtigung und Kontakt',   einleitung: 'Fragen zu Besichtigung und Kontakt:',
      antworten: ['ansehen', 'besichtigung', 'ort', 'kontakt', 'presse', 'werkbesitz', 'hinweise'] },
    { id: 'website', titel: 'Website und Datenschutz',    einleitung: 'Fragen zur Bedienung und zum Datenschutz:',
      antworten: ['rundgang', 'handy', 'werkfinden', 'englisch', 'probleme', 'zoom', 'barrierefrei', 'daten', 'ki', 'rechtstexte'] }
  ],

  antworten: {

    // Quelle: index.html › Leben (Z. 634–637, 646); Seitentitel (Z. 9); facts.md Frage 1
    wer: {
      frage: 'Wer war Horst Schwab?',
      todo: false,
      text: [
        'Horst Schwab (1935–2017) war ein Pfälzer Künstler: Maler, Grafiker, Bildhauer und Lyriker. Seine Werke umfassen Malerei, Grafik und Plastik.',
        'Er wurde 1935 in Kirchheimbolanden geboren und starb am 31. Juli 2017 in Kusel.'
      ],
      aktionen: [{ art: 'abschnitt', ziel: 'ueber-uns', label: 'Zum Abschnitt „Leben“' }],
      weiter: ['herkunft', 'anliegen', 'ausstellungen'],
      stichwoerter: ['wer war', 'wer ist horst schwab', 'wer war horst schwab', 'kuenstler', 'biografie', 'biographie', 'lebenslauf', 'leben', 'person', 'ueber horst schwab', 'kunstler', 'pfaelzer kuenstler']
    },

    // Quelle: index.html › Leben (Z. 634–637); Lebensstationen (Z. 655); facts.md Frage 2 (TEILWEISE)
    herkunft: {
      frage: 'Wo wurde er geboren, wo lebte und arbeitete er?',
      todo: false,
      text: [
        'Horst Schwab wurde 1935 in Kirchheimbolanden geboren und wuchs auf dem Weierhof in der Gemeinde Bolanden auf. Von 1961 bis 1966 unterrichtete er als Lehrer in Kirchheimbolanden, von 1966 bis 1995 am Gymnasium in Kusel. Er starb am 31. Juli 2017 in Kusel.',
        'Zum Ort seines Ateliers und zu weiteren Lebens- und Arbeitsorten macht die Website keine Angaben. Bitte fragen Sie dazu per E-Mail.'
      ],
      aktionen: [{ art: 'mail', label: 'Per E-Mail fragen', betreff: 'Frage zu Lebens- und Arbeitsorten' }],
      weiter: ['ausbildung', 'wer', 'ort'],
      stichwoerter: ['geboren', 'geburtsort', 'geburtstag', 'wo geboren', 'wo lebte', 'wo wohnte', 'wohnort', 'arbeitsort', 'kirchheimbolanden', 'weierhof', 'bolanden', 'gestorben', 'todesort', 'lehrer', 'gymnasium kusel', 'geburt', 'gelebt', 'gearbeitet', 'lebte', 'wohnte']
    },

    // Quelle: index.html › Leben (Z. 634); Lebensstationen (Z. 665, 670); facts.md Frage 3
    ausbildung: {
      frage: 'Wo hat er gelernt und studiert?',
      todo: false,
      text: [
        '1955 legte Horst Schwab in Kirchheimbolanden das Abitur ab. Von 1956 bis 1960 studierte er an der Universität und der Landeskunstschule in Mainz Kunst und Germanistik.',
        '1961 schloss er sein Studium mit dem zweiten Staatsexamen ab.'
      ],
      aktionen: [{ art: 'abschnitt', ziel: 'ueber-uns', label: 'Zum Abschnitt „Leben“' }],
      weiter: ['herkunft', 'anliegen'],
      stichwoerter: ['ausbildung', 'studium', 'studiert', 'studierte', 'abitur', 'landeskunstschule', 'staatsexamen', 'germanistik', 'universitaet mainz', 'mainz', 'wo gelernt', 'gelernt', 'austbildung']
    },

    // Quelle: index.html › Das Werk (Z. 730–731); facts.md Frage 4 (Aussagen der Website, keine Zitate)
    anliegen: {
      frage: 'Was war ihm in seiner Kunst wichtig?',
      todo: false,
      text: [
        'Nach den Texten dieser Website steht seine Kunst dem Expressionismus nahe: Sie lebt von kraftvoller Abstraktion, von Farbflächen und der Lust am Experiment, bleibt dabei aber ruhig und meditativ. Im Zentrum steht die menschliche Figur – einzelne Gestalten, Figurengruppen, Beziehungen, Torsi.',
        'Schwab arbeitete ohne festes Konzept, aus dem Prozess heraus. Später verwendete er Elemente früherer Blätter als „Bildbausteine“ für neue Collagen.'
      ],
      aktionen: [{ art: 'abschnitt', ziel: 'das-werk', label: 'Zum Abschnitt „Das Werk“' }],
      weiter: ['werkarten', 'zitate'],
      stichwoerter: ['wichtig', 'anliegen', 'kunststil', 'stil', 'expressionismus', 'expressionistisch', 'abstraktion', 'thema seiner kunst', 'motive', 'menschliche figur', 'bildbausteine', 'arbeitsweise', 'was wollte er', 'kunstrichtung']
    },

    // Quelle: index.html › Leben (Z. 636); Lebensstationen (Z. 685, 690, 695); Ausstellungen (Z. 816–840); facts.md Frage 5
    ausstellungen: {
      frage: 'Ausstellungen und Auszeichnungen',
      todo: false,
      text: [
        'Für sein Schaffen erhielt Horst Schwab 1973 den Pfalzpreis für Malerei, 1980 den ersten Preis im Gestaltungswettbewerb für die Peter-Altmeier-Gedenkstätte in Koblenz und 1995 die Picasso-Medaille, den Preis der Vereinigung Pfälzer Kunstfreunde.',
        'Die Website führt zudem Einzelausstellungen (von 1972 bis zur Dauerausstellung im Rathaus Kusel) und eine Auswahl an Gruppenausstellungen auf, etwa in der Pfalzgalerie Kaiserslautern.'
      ],
      aktionen: [{ art: 'abschnitt', ziel: 'ausstellungen', label: 'Zum Abschnitt „Ausstellungen“' }],
      weiter: ['ansehen', 'wer'],
      stichwoerter: ['auszeichnung', 'auszeichnungen', 'preistraeger', 'preise gewonnen', 'pfalzpreis', 'picasso medaille', 'picasso-medaille', 'ausgezeichnet', 'einzelausstellung', 'gruppenausstellung', 'ausstellungsliste', 'ausstellungen', 'auszeichnnug', 'preise oder auszeichnungen', 'gewonnen', 'erhalten', 'verliehen']
    },

    // Quelle: index.html › Leben (Z. 635–636); Lebensstationen 2015 (Z. 700); Das Werk (Z. 741–742); facts.md Frage 6
    zitate: {
      frage: 'Gibt es Zitate von ihm?',
      todo: false,
      text: [
        'Auf der Website sind keine wörtlichen Zitate von Horst Schwab veröffentlicht. Er schrieb jedoch Gedichte und veröffentlichte 2015 den Gedichtband „Ich unn moi Fraa und andere Gedichte“ in Pfälzer Mundart.',
        'Im Abschnitt „Das Werk“ steht ein Zitat über ihn, nicht von ihm: Thomas Behnke schrieb in der Rheinpfalz (2019), die Bildsprache des Expressionismus sei nie fern, doch hänge über diesen malerischen Welten eine auffällige Stille.'
      ],
      aktionen: [{ art: 'abschnitt', ziel: 'das-werk', label: 'Zum Abschnitt „Das Werk“' }],
      weiter: ['anliegen', 'werkarten'],
      stichwoerter: ['zitat', 'zitate', 'zitieren', 'aussage von ihm', 'sagte er', 'was sagte', 'gedicht', 'gedichte', 'gedichtband', 'lyrik', 'mundart', 'ich unn moi fraa', 'behnke', 'spruch', 'aussage', 'aussagen', 'gesagt']
    },

    // Quelle: index.html › Das Werk (Z. 730, 752–757); Kollektionen (Z. 347–371); facts.md Frage 7
    werkarten: {
      frage: 'Welche Arten von Werken gibt es?',
      todo: false,
      text: [
        'Horst Schwab arbeitete in Malerei, Grafik und Collage ebenso wie in Holz und Bronze, schuf Glasfenster und schrieb Gedichte.',
        'Die Online-Galerie ist in die Kollektionen „Collage & Zeichnungen“, „Malerei“, „Grafik“ und „Plastik“ gegliedert. Im öffentlichen Raum nennt die Website unter anderem Kirchenfenster in Altenglan und Nanzdietschweiler sowie die Holzplastik „Hoffnungsgruppe“ in Leltschizy (Belarus).'
      ],
      aktionen: [{ art: 'abschnitt', ziel: 'galerie', label: 'Zur Werkübersicht' }],
      weiter: ['techniken', 'anzahl'],
      stichwoerter: ['werkarten', 'arten von werken', 'welche werke', 'kollektionen', 'kategorien', 'malerei', 'grafik', 'collagen', 'plastik', 'plastiken', 'skulptur', 'skulpturen', 'glasfenster', 'kirchenfenster', 'hoffnungsgruppe']
    },

    // Quelle: app.js › ARTWORKS (Z. 324–345); index.html › Das Werk (Z. 730); facts.md Frage 8 (TEILWEISE)
    techniken: {
      frage: 'Materialien und Techniken',
      todo: false,
      text: [
        'Bei den online gezeigten Collagen und Zeichnungen sind unter anderem Mischtechnik (auch auf Papier oder Leinwand), Acrylcollage (auch auf Pressspahn), Deckfarben auf Papier, Pastell auf Papier sowie Collagen aus Drucken und aus Grafik angegeben. Die Plastiken sind als „Plastik, goldfarben gefasst“ bezeichnet.',
        'Allgemein nennt die Website auch Holz, Bronze und Glasfenster. Zu Malerei und Grafik liegen online noch keine Angaben vor; bitte fragen Sie dazu per E-Mail.'
      ],
      aktionen: [{ art: 'mail', label: 'Per E-Mail fragen', betreff: 'Frage zu Materialien und Techniken' }],
      weiter: ['entstehung', 'werkarten'],
      stichwoerter: ['technik', 'techniken', 'material', 'materialien', 'mischtechnik', 'acryl', 'acrylcollage', 'pastell', 'deckfarben', 'leinwand', 'pressspahn', 'bronze', 'holz', 'womit gemalt', 'techniek']
    },

    // Quelle: app.js › ARTWORKS (Z. 311–345, Zählung); index.html Z. 337–338; facts.md Frage 9
    anzahl: {
      frage: 'Wie viele Werke zeigt die Galerie?',
      todo: false,
      text: [
        'Die Online-Galerie zeigt derzeit {werke_mit_bild} Werke mit Abbildung: {collagen} Collagen und Zeichnungen sowie {plastiken} Plastiken. Für Malerei und Grafik sind weitere Werke angekündigt.',
        'Zusätzlich sind {platzhalter} Plätze als „Werk folgt in Kürze“ vorgemerkt.'
      ],
      aktionen: [{ art: 'abschnitt', ziel: 'galerie', label: 'Zur Werkübersicht' }],
      weiter: ['offline', 'werkarten'],
      stichwoerter: ['wie viele', 'anzahl', 'wieviele', 'wie viele werke', 'gesamtzahl', 'umfang', 'wie gross ist die galerie', 'zahl der werke', 'platzhalter', 'wie vile', 'bilder insgesamt']
    },

    // Quelle: app.js › ARTWORKS (year, Z. 324–345); index.html (Z. 322, 731); facts.md Frage 10 (TEILWEISE)
    entstehung: {
      frage: 'Wann sind die Werke entstanden?',
      todo: false,
      text: [
        'Die online gezeigten Collagen und Zeichnungen stammen aus den Jahren 2001 bis 2005. Für die Plastiken ist keine Jahresangabe hinterlegt.',
        'Die Website spricht insgesamt von sechs Jahrzehnten künstlerischen Schaffens; in den 1970er und 1980er Jahren entstanden grafische und experimentelle Mischtechniken. Diese älteren Werke sind online noch nicht zu sehen.'
      ],
      aktionen: [{ art: 'abschnitt', ziel: 'galerie', label: 'Zur Werkübersicht' }],
      weiter: ['techniken', 'offline'],
      stichwoerter: ['wann entstanden', 'entstehung', 'entstehungsjahr', 'entstehungszeit', 'jahr des werks', 'aus welchem jahr', 'datierung', 'sechs jahrzehnte', 'schaffensperiode', 'wann gemacht', 'wann gemalt', 'enstanden', 'entstanden', 'datiert']
    },

    // Quelle: facts.md Frage 11 (KEINE QUELLE)
    titel: {
      frage: 'Was bedeuten die Werktitel?',
      todo: true,
      text: ['TODO: Angabe von Familie Schwab nötig – Bedeutung der Werktitel (auf der Website nicht erläutert)'],
      aktionen: [],
      weiter: ['anliegen', 'werkarten'],
      stichwoerter: ['titel', 'werktitel', 'bedeutung des titels', 'was bedeutet der titel', 'titel bedeutung', 'urmuetter', 'urmutter', 'name des bildes', 'warum heisst', 'bildtitel']
    },

    // Quelle: index.html › Malerei/Grafik (Z. 392–396, 502–506); app.js (Z. 312–323); facts.md Frage 12
    offline: {
      frage: 'Gibt es Werke, die nicht online sind?',
      todo: false,
      text: [
        'Ja. Die Bereiche Malerei und Grafik sind noch im Aufbau, hier stehen „Neue Werke folgen in Kürze“. Die Website nennt dazu keine Gesamtzahl und nicht, welche Werke fehlen.',
        'Der Bereich wird stetig erweitert; ein regelmäßiger Besuch lohnt sich.'
      ],
      aktionen: [{ art: 'abschnitt', ziel: 'galerie', label: 'Zur Werkübersicht' }],
      weiter: ['anzahl', 'originale'],
      stichwoerter: ['nicht online', 'nicht gezeigt', 'weitere werke', 'mehr werke', 'fehlen', 'werk folgt', 'im aufbau', 'neue werke', 'noch nicht', 'unveroeffentlicht', 'weitere bilder']
    },

    // Quelle: index.html › Startseite (Z. 264); Ausstellungen (Z. 807–809); Kontakt (Z. 906–907); facts.md Frage 13 (TEILWEISE)
    originale: {
      frage: 'Wo befinden sich die Originale?',
      todo: false,
      text: [
        'Im Rathaus Kusel zeigt eine Dauerausstellung Malerei, Grafik und Plastik von Horst Schwab. Arbeiten im öffentlichen Raum, etwa Kirchenfenster, nennt die Website im Abschnitt „Das Werk“.',
        'Wo sich die übrigen Originale befinden, ist auf der Website nicht angegeben. Bitte fragen Sie dazu per E-Mail.'
      ],
      aktionen: [{ art: 'mail', label: 'Per E-Mail fragen', betreff: 'Frage zum Verbleib von Originalen' }],
      weiter: ['ansehen', 'offline'],
      stichwoerter: ['originale', 'original', 'wo sind die originale', 'wo hangen', 'wo haengen', 'verbleib', 'aufbewahrt', 'standort der werke', 'wo sind die bilder', 'originalwerke', 'wo ist das original', 'originalen']
    },

    // Quelle: facts.md Frage 14 (KEINE QUELLE; feste Haltung laut Auftrag); index.html › Besichtigung (Z. 898)
    kaufen: {
      frage: 'Kann ich ein Werk kaufen?',
      todo: false,
      gewicht: 1.3,
      text: [
        'Auf dieser Website wird nichts verkauft, und es werden keine Preise genannt. Die Seite wird vom Nachlass (Familie Schwab) betrieben und stellt das Werk von Horst Schwab aus.',
        'Wenn Sie Werke persönlich sehen möchten, können Sie eine Besichtigung anfragen.'
      ],
      aktionen: [{ art: 'termin', label: 'Besichtigung anfragen' }],
      weiter: ['besichtigung', 'wert'],
      stichwoerter: ['kaufen', 'kauf', 'preis', 'preise', 'kosten', 'verkaufen', 'erwerben', 'angebot', 'wieviel kostet', 'wie viel kostet', 'kaufpreis', 'preisliste', 'kaufn', 'zu verkaufen', 'bestellen', 'kostet']
    },

    // Quelle: facts.md Frage 15 (KEINE QUELLE)
    leihen: {
      frage: 'Kann ich Werke leihen oder ausstellen?',
      todo: true,
      gewicht: 1.3,
      text: ['TODO: Angabe von Familie Schwab nötig – ob und wie Werke verliehen oder für Ausstellungen angefragt werden können'],
      aktionen: [],
      weiter: ['presse', 'kontakt'],
      stichwoerter: ['leihen', 'leihgabe', 'leihgaben', 'ausleihen', 'verleihen', 'leihanfrage', 'fuer ausstellung', 'werke ausstellen', 'ausstellung organisieren', 'leihgabe anfragen', 'lehen']
    },

    // Quelle: index.html › Impressum › Urheberrecht (Z. 1028, 1031); facts.md Frage 16
    bildnutzung: {
      frage: 'Darf ich Bilder verwenden oder drucken?',
      todo: false,
      text: [
        'Laut Impressum unterliegen alle Abbildungen von Kunstwerken, Fotografien und Texte dem deutschen Urheberrecht. Downloads und Kopien sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.',
        'Jede darüber hinausgehende Vervielfältigung, Bearbeitung, Verbreitung oder Verwertung bedarf der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.'
      ],
      aktionen: [{ art: 'impressum', label: 'Impressum öffnen' }],
      weiter: ['rechte', 'kontakt'],
      stichwoerter: ['bilder verwenden', 'bild verwenden', 'bilder nutzen', 'bildnutzung', 'drucken', 'abdrucken', 'download', 'herunterladen', 'kopieren', 'veroeffentlichen', 'publizieren', 'foto verwenden', 'bildrechte', 'bildverwendung', 'verwenden', 'ausdrucken', 'foto drucken', 'nutzen']
    },

    // Quelle: index.html › Impressum › Urheberrecht (Z. 1028, 1031); Betreiber (Z. 935); facts.md Frage 17 (TEILWEISE)
    rechte: {
      frage: 'Wem gehören die Rechte?',
      todo: false,
      text: [
        'Die Website wird vom Nachlass Familie Schwab betrieben. Laut Impressum unterliegen die vom Seitenbetreiber erstellten Inhalte und Werke dem deutschen Urheberrecht; soweit Inhalte nicht vom Betreiber stammen, werden die Urheberrechte Dritter beachtet.',
        'Wer im Einzelnen die Rechte an den Werken hält, sagt die Website nicht ausdrücklich. Das Impressum enthält dazu keine weitere Auslegung.'
      ],
      aktionen: [{ art: 'impressum', label: 'Impressum öffnen' }],
      weiter: ['bildnutzung', 'betreiber'],
      stichwoerter: ['rechte', 'urheberrecht', 'urheber', 'copyright', 'wem gehoeren', 'wem gehoert', 'rechteinhaber', 'erben', 'nutzungsrechte', 'lizenz', 'urheberrechte', 'urhebrrecht']
    },

    // Quelle: index.html › Impressum (Z. 935–939, 962–967, 1496); facts.md Frage 18
    betreiber: {
      frage: 'Wer betreibt diese Seite?',
      todo: false,
      text: [
        'Betreiber ist laut Impressum der Nachlass Familie Schwab, vertreten durch Arndt Schwab, Schlosshöhe 10, 66869 Kusel. Arndt Schwab ist dort auch als verantwortlich für den Inhalt genannt.'
      ],
      aktionen: [{ art: 'impressum', label: 'Impressum öffnen' }],
      weiter: ['kontakt', 'rechte'],
      stichwoerter: ['betreiber', 'wer betreibt', 'wer steckt dahinter', 'verantwortlich', 'verantwortlicher', 'seitenbetreiber', 'herausgeber', 'wer macht die seite', 'arndt schwab', 'nachlass', 'anbieter']
    },

    // Quelle: facts.md Frage 36 (KEINE QUELLE; feste Haltung laut Auftrag)
    wert: {
      frage: 'Was ist ein Werk wert? Ist es echt?',
      todo: false,
      gewicht: 1.3,
      text: [
        'Die Galerie macht keine Aussagen zu Wert oder Echtheit von Werken und gibt keine Schätzungen ab.',
        'Auf der Website finden Sie die Werke von Horst Schwab zur Ansicht; Preise oder Gutachten gibt es hier nicht.'
      ],
      aktionen: [],
      weiter: ['kaufen', 'werkbesitz'],
      stichwoerter: ['wert', 'wertvoll', 'schaetzung', 'schaetzen', 'gutachten', 'echt', 'echtheit', 'faelschung', 'original pruefen', 'expertise', 'wertermittlung', 'was ist es wert', 'authentisch']
    },

    // Quelle: index.html › Startseite (Z. 264); Ausstellungen (Z. 800–809); Kontakt (Z. 898, 907); Termin-Dialog (Z. 1520); facts.md Frage 19
    ansehen: {
      frage: 'Wo kann ich Originale ansehen?',
      todo: false,
      text: [
        'Im Rathaus Kusel gibt es seit dem 16. September 2023 eine Dauerausstellung mit Malerei, Grafik und Plastik von Horst Schwab. Eine weitere Ausstellung in Kaiserslautern ist ab dem 13. November 2026 angekündigt; Näheres folgt.',
        'Außerdem ist eine private Besichtigung nach Vereinbarung möglich, samstags und sonntags.'
      ],
      aktionen: [{ art: 'termin', label: 'Besichtigung anfragen' }, { art: 'abschnitt', ziel: 'ausstellungen', label: 'Zum Abschnitt „Ausstellungen“' }],
      weiter: ['besichtigung', 'ort'],
      stichwoerter: ['ansehen', 'originale ansehen', 'live sehen', 'persoenlich sehen', 'dauerausstellung', 'rathaus kusel', 'kaiserslautern', 'ausstellung besuchen', 'wo sehen', 'aktuelle ausstellung', 'ausstelung']
    },

    // Quelle: index.html › Termin-Dialog (Z. 1520–1585); app.js (Z. 3949–4186); facts.md Frage 20
    besichtigung: {
      frage: 'Wie frage ich eine Besichtigung an?',
      todo: false,
      text: [
        'Im Dialog „Besichtigung anfragen“ wählen Sie bis zu drei Wunschtermine. Besichtigungen finden samstags und sonntags statt, Beginn zwischen 10:00 und 17:30 Uhr im Halbstundentakt.',
        'Im zweiten Schritt geben Sie Ihren Namen an (Pflicht); Telefonnummer und Nachricht sind freiwillig. Danach öffnet sich Ihr eigenes E-Mail-Programm mit der fertigen Anfrage, die Sie nur noch absenden müssen. Über die Website wird nichts übertragen.'
      ],
      aktionen: [{ art: 'termin', label: 'Besichtigung anfragen' }],
      weiter: ['ansehen', 'kontakt'],
      stichwoerter: ['besichtigung', 'besichtigung anfragen', 'besichtgung', 'termin', 'termin anfragen', 'terminanfrage', 'wunschtermin', 'termin vereinbaren', 'anmelden', 'wie anfragen', 'besichtigen', 'termin buchen']
    },

    // Quelle: index.html › Startseite (Z. 264); Ausstellungen (Z. 800–809); Kontakt (Z. 906–907); facts.md Frage 21 (TEILWEISE)
    ort: {
      frage: 'Wo ist die Galerie, wann ist geöffnet?',
      todo: false,
      text: [
        'Die Dauerausstellung befindet sich im Rathaus Kusel. Für das Atelier gilt laut Kontaktbereich: nach Vereinbarung.',
        'Eine genaue Adresse der Ausstellung und Öffnungszeiten sind auf der Website nicht angegeben; für Kaiserslautern folgen Ort und Zeiten in Kürze. Bitte fragen Sie dazu per E-Mail.'
      ],
      aktionen: [{ art: 'mail', label: 'Per E-Mail fragen', betreff: 'Frage zu Ort und Öffnungszeiten' }],
      weiter: ['ansehen', 'besichtigung'],
      stichwoerter: ['wo ist die galerie', 'adresse', 'anfahrt', 'oeffnungszeiten', 'offnungszeiten', 'wann geoeffnet', 'geoeffnet', 'standort', 'wo findet', 'atelier', 'wegbeschreibung', 'oeffnungszeit', 'oefnungszeiten']
    },

    // Quelle: index.html › Kontakt (Z. 898, 903, 914); Impressum (Z. 935–939, 953); facts.md Frage 22
    kontakt: {
      frage: 'Wie erreiche ich die Familie?',
      todo: false,
      text: [
        'Sie erreichen die Familie per E-Mail unter info@horstschwab.de. Eine Telefonnummer wird auf der Website nicht genannt.',
        'Die Postanschrift laut Impressum lautet: Nachlass Familie Schwab, vertreten durch Arndt Schwab, Schlosshöhe 10, 66869 Kusel.'
      ],
      aktionen: [{ art: 'mail', label: 'E-Mail schreiben', betreff: 'Nachricht an die Familie Schwab' }, { art: 'impressum', label: 'Impressum öffnen' }],
      weiter: ['besichtigung', 'betreiber'],
      stichwoerter: ['kontakt', 'kontaktieren', 'erreichen', 'email', 'e-mail', 'mailadresse', 'telefon', 'telefonnummer', 'anrufen', 'postanschrift', 'anschrift', 'familie erreichen', 'kontak', 'email adresse', 'e mail adresse', 'erreiche']
    },

    // Quelle: index.html › Kontakt (Z. 898, 903); Impressum (Z. 962–967); facts.md Frage 23 (TEILWEISE)
    presse: {
      frage: 'Ich bin Journalist, Kurator oder Forscher',
      todo: false,
      text: [
        'Die Website nennt keinen eigenen Ansprechpartner für Presse, Kuratoren oder Forschung. Belegt ist der allgemeine Kontakt: Bei Fragen zum Werk können Sie der Familie per E-Mail schreiben.'
      ],
      aktionen: [{ art: 'mail', label: 'Per E-Mail schreiben', betreff: 'Presse-/Forschungsanfrage' }],
      weiter: ['kontakt', 'leihen'],
      stichwoerter: ['journalist', 'journalistin', 'presse', 'pressekontakt', 'pressematerial', 'kurator', 'kuratorin', 'forscher', 'forschung', 'wissenschaft', 'recherche', 'artikel schreiben', 'interview', 'pressanfrage']
    },

    // Quelle: facts.md Frage 24 (KEINE QUELLE)
    werkbesitz: {
      frage: 'Ich besitze ein Werk – was tun?',
      todo: true,
      text: ['TODO: Angabe von Familie Schwab nötig – Vorgehen bei Werken in Privatbesitz (Meldung, Begutachtung, Verbleib)'],
      aktionen: [],
      weiter: ['wert', 'kontakt'],
      stichwoerter: ['ich besitze', 'besitze ein werk', 'habe ein bild', 'habe ein werk', 'zu hause', 'in meinem besitz', 'privatbesitz', 'geerbt', 'bild von horst schwab', 'werk melden', 'dachboden', 'ich habe ein']
    },

    // Quelle: facts.md Frage 25 (TEILWEISE, Folge nicht beschrieben)
    hinweise: {
      frage: 'Ich habe einen Hinweis zu einem Werk',
      todo: true,
      text: ['TODO: Angabe von Familie Schwab nötig – ob und wie Hinweise zu Werken erwünscht sind und was danach geschieht'],
      aktionen: [],
      weiter: ['kontakt', 'werkbesitz'],
      stichwoerter: ['hinweis', 'hinweise', 'hinweis zu einem werk', 'informationen beitragen', 'ich weiss etwas', 'ich weiß etwas', 'wissen beitragen', 'korrektur melden', 'ergaenzung', 'info zu einem bild', 'hinweiss']
    },

    // Quelle: index.html › Hilfefenster Rundgang (Z. 207–229); app.js (Z. 1036–1049, 1359–1361, 3537–3540); facts.md Frage 26
    rundgang: {
      frage: 'Wie funktioniert der virtuelle Rundgang?',
      todo: false,
      text: [
        'Der Rundgang ist eine geführte Tour durch ausgewählte Werke. Mit der Leertaste, dem Pfeil nach rechts oder dem Knopf „Weiter“ gelangen Sie zur nächsten Station, mit dem Pfeil nach links oder „Zurück“ in die Gegenrichtung. Ein Klick auf ein Gemälde öffnet die Details zum Werk.',
        'Im freien Erkunden gehen Sie mit W, A, S, D oder den Pfeiltasten; per Trackpad oder Maus wischen Sie zum Gehen und Drehen, Kneifen oder Strg + Rad zoomt, ein Klick führt Sie an die Stelle. Beenden können Sie mit dem Knopf „Beenden“ oder mit Esc.'
      ],
      aktionen: [{ art: 'rundgang', label: 'Rundgang starten' }],
      weiter: ['handy', 'probleme'],
      stichwoerter: ['rundgang', 'virtueller rundgang', '3d rundgang', '3d', 'tour', 'rundgang bedienen', 'tastatur rundgang', 'freies erkunden', 'frei erkunden', 'wie bewege ich mich', 'rundgnag', 'bedienung']
    },

    // Quelle: app.js (Z. 1359, 1435–1461, 1513–1545, 729–745); facts.md Frage 27
    handy: {
      frage: 'Wie bewege ich mich am Handy?',
      todo: false,
      text: [
        'Am Handy gilt im Rundgang: Ziehen zum Umschauen, Tippen zum Hingehen, mit zwei Fingern zoomen Sie (im freien Erkunden). Ein Tipp auf ein Gemälde öffnet das Werk.',
        'In der Werkansicht wechseln Sie bei Plastiken durch Wischen zwischen den Ansichten.'
      ],
      aktionen: [{ art: 'rundgang', label: 'Rundgang starten' }],
      weiter: ['rundgang', 'zoom'],
      stichwoerter: ['handy', 'smartphone', 'mobil', 'mobiltelefon', 'tablet', 'touch', 'touchscreen', 'wischen', 'iphone', 'android', 'am handy', 'handi', 'steuerung']
    },

    // Quelle: index.html › Navigation (Z. 187–194), Kollektionen (Z. 344–374), Werkansicht (Z. 1614–1628); app.js (Z. 485–487); facts.md Frage 28
    werkfinden: {
      frage: 'Wie finde ich ein bestimmtes Werk?',
      todo: false,
      text: [
        'Wählen Sie in der Navigation „Werke“, dann eine Kategorie (Collage & Zeichnungen, Malerei, Grafik oder Plastik) und anschließend die Werkkarte; sie öffnet die Werkansicht. Dort führt „Im Rundgang entdecken“ zum Werk im Rundgang.',
        'Über das Herz (♡) können Sie Werke auf Ihre Merkliste setzen. Die Merkliste wird nur lokal in Ihrem Browser gespeichert.'
      ],
      aktionen: [{ art: 'abschnitt', ziel: 'galerie', label: 'Zu den Werken' }, { art: 'merkliste', label: 'Merkliste öffnen' }],
      weiter: ['rundgang', 'zoom'],
      stichwoerter: ['bestimmtes werk', 'werk finden', 'finden', 'suchen', 'suche', 'navigation', 'merkliste', 'merken', 'favoriten', 'herz', 'werkkarte', 'kategorie', 'werk suchen', 'bestimmt', 'bestimmten', 'bestimmtes']
    },

    // Quelle: index.html › Navigation (Z. 198); app.js (Z. 373, 482); facts.md Frage 29
    englisch: {
      frage: 'Gibt es die Seite auf Englisch?',
      todo: false,
      text: [
        'Ja. Mit dem Schalter „DE · EN“ oben rechts wechseln Sie zwischen Deutsch und Englisch. Ihre Wahl wird lokal in Ihrem Browser gespeichert.',
        'Dieser Assistent ist nur auf Deutsch verfügbar.'
      ],
      aktionen: [{ art: 'sprache', label: 'Auf Englisch umschalten' }],
      weiter: ['rechtstexte', 'kontakt'],
      stichwoerter: ['englisch', 'english', 'sprache', 'sprache wechseln', 'umschalten', 'uebersetzung', 'in english', 'do you speak english', 'deutsch englisch', 'engisch', 'language']
    },

    // Quelle: app.js (Z. 971–1014); index.html (Z. 229); facts.md Frage 30 (TEILWEISE)
    probleme: {
      frage: 'Der Rundgang lädt nicht oder funktioniert nicht',
      todo: false,
      gewicht: 1.4,
      text: [
        'Der Rundgang benötigt die 3D-Grafik-Funktion WebGL im Browser. Kann Ihr Browser sie nicht darstellen, erscheint ein Hinweis „Rundgang nicht verfügbar“ mit dem Knopf „Zur Werkübersicht“.',
        'Alle Werke können Sie auch ohne 3D in der Übersicht ansehen („Ohne 3D: Werke in der Übersicht ansehen“).'
      ],
      aktionen: [{ art: 'abschnitt', ziel: 'galerie', label: 'Zur Werkübersicht' }],
      weiter: ['rundgang', 'handy'],
      stichwoerter: ['laedt nicht', 'ladet nicht', 'funktioniert nicht', 'ruckelt', 'langsam', 'haengt', 'fehler', 'webgl', 'schwarzer bildschirm', 'geht nicht', 'problem', 'probleme', 'rundgang geht nicht', 'ohne 3d']
    },

    // Quelle: index.html › Werkansicht (Z. 1630); app.js (Z. 792–812); facts.md Frage 31
    zoom: {
      frage: 'Kann ich ein Bild vergrößern?',
      todo: false,
      text: [
        'In der Werkansicht vergrößern Sie das Bild durch Scrollen bzw. mit dem Mausrad, bis auf das Fünffache. Ein Doppelklick setzt die Ansicht zurück.',
        'Ist das Bild vergrößert, lässt es sich mit der Maus verschieben.'
      ],
      aktionen: [],
      weiter: ['werkfinden', 'handy'],
      stichwoerter: ['vergroessern', 'vergrössern', 'bild vergroessern', 'zoomen', 'heranzoomen', 'lupe', 'detail ansehen', 'naeher ansehen', 'bild groesser', 'mausrad', 'doppelklick', 'vergrosern', 'vergroessere']
    },

    // Quelle: index.html (Z. 200, 386, 922, 1156, 1528–1575); app.js (Z. 4036–4108, 4630–4636, 3764–3775); facts.md Frage 32
    barrierefrei: {
      frage: 'Ist die Seite barrierefrei bedienbar?',
      todo: false,
      text: [
        'Die Seite lässt sich per Tastatur bedienen: Tab wechselt zwischen Elementen, Enter oder Leertaste aktivieren sie, Esc schließt geöffnete Ebenen; der Fokus bleibt dabei in der obersten geöffneten Ebene. Der Rundgang ist mit Pfeiltasten, Leertaste und Esc bedienbar, im freien Erkunden zusätzlich mit + und −.',
        'Schaltflächen sind beschriftet, Bilder haben Alternativtexte. Mit Screenreadern wurde die Seite nicht systematisch getestet.'
      ],
      aktionen: [],
      weiter: ['rundgang', 'zoom'],
      stichwoerter: ['barrierefrei', 'barrierefreiheit', 'screenreader', 'screen reader', 'tastatur', 'tastaturbedienung', 'blind', 'sehbehindert', 'alternativtext', 'behindert', 'assistive technik', 'barrierfrei']
    },

    // Quelle: index.html › Datenschutz Abschnitte 3–7 (Z. 1198–1270); app.js (Speicherschlüssel); facts.md Frage 33
    daten: {
      frage: 'Werden meine Daten gespeichert?',
      todo: false,
      text: [
        'Die Website wird bei GitHub Pages gehostet; dabei fallen übliche Server-Logs an (u. a. IP-Adresse, Zeitpunkt, aufgerufene Seite). Sie setzt keine Cookies und keine Tracking- oder Analysedienste ein. Alle Inhalte werden vom eigenen Server geladen.',
        'Lokal in Ihrem Browser gespeichert werden nur die Merkliste, die gewählte Sprache und die Information, ob Sie die Galerie in dieser Sitzung betreten haben. Eingaben im Besichtigungsdialog und im Assistenten werden weder gespeichert noch über die Website übertragen.'
      ],
      aktionen: [{ art: 'datenschutz', label: 'Datenschutzerklärung öffnen' }],
      weiter: ['ki', 'rechtstexte'],
      stichwoerter: ['daten', 'datenschutz', 'dsgvo', 'cookies', 'cookie', 'tracking', 'speichern', 'gespeichert', 'localstorage', 'github pages', 'hosting', 'persoenliche daten', 'datenspeicherung', 'datenschutzt']
    },

    // Quelle: index.html › Datenschutz Abschnitt 7 (Z. 1266); facts.md Frage 34
    ki: {
      frage: 'Ist der Assistent eine KI?',
      todo: false,
      text: [
        'Nein. Dies ist ein automatischer Assistent mit vorgefertigten Antworten, der ausschließlich lokal in Ihrem Browser läuft. Er speichert und überträgt nichts und bietet keine persönliche Beratung.'
      ],
      aktionen: [{ art: 'mail', label: 'Per E-Mail fragen' }],
      weiter: ['daten', 'kontakt'],
      stichwoerter: ['ki', 'kuenstliche intelligenz', 'chatgpt', 'bot', 'chatbot', 'roboter', 'bist du ein mensch', 'sind sie ein mensch', 'automatisch', 'wer antwortet', 'mensch oder maschine', 'ai', 'assistent']
    },

    // Quelle: index.html › Footer (Z. 1493–1494); Rechtstexte (Z. 922–928, 1156–1162); facts.md Frage 35
    rechtstexte: {
      frage: 'Wo finde ich Impressum und Datenschutz?',
      todo: false,
      text: [
        'Ganz unten auf der Seite, im Fußbereich, stehen die Links „Impressum“ und „Datenschutz“. Beide öffnen sich als Ebene mit dem Titel „Rechtliche Angaben“.'
      ],
      aktionen: [{ art: 'impressum', label: 'Impressum öffnen' }, { art: 'datenschutz', label: 'Datenschutz öffnen' }],
      weiter: ['daten', 'betreiber'],
      stichwoerter: ['impressum', 'imressum', 'datenschutzerklaerung', 'rechtliches', 'rechtliche angaben', 'rechtstexte', 'footer', 'fusszeile', 'agb', 'wo finde ich das impressum', 'haftung', 'disclaimer']
    },

    // Quelle: keine Fakten nötig (feste Haltung); Kontakt index.html (Z. 903)
    feedback: {
      frage: 'Lob, Kritik oder Anteilnahme',
      todo: false,
      text: [
        'Vielen Dank für Ihre Worte. Lob, Kritik, Hinweise auf Fehler oder Worte der Anteilnahme richten Sie bitte per E-Mail an die Familie Schwab.'
      ],
      aktionen: [{ art: 'mail', label: 'Nachricht schreiben', betreff: 'Nachricht an die Familie Schwab' }],
      weiter: ['kontakt'],
      stichwoerter: ['beschwerde', 'beschweren', 'lob', 'loben', 'danke fuer', 'beileid', 'anteilnahme', 'kondolenz', 'toll', 'schoen', 'kritik', 'fehler gefunden', 'verbesserung', 'gefaellt mir']
    },

    // Quelle: keine Fakten nötig (feste Haltung)
    andere: {
      frage: 'Fragen zu anderen Künstlern oder Galerien',
      todo: false,
      text: [
        'Auskunft kann ich nur zu Horst Schwab und zu dieser Galerie geben. Zu anderen Künstlern, Museen oder Galerien kann ich leider nichts sagen.'
      ],
      aktionen: [],
      weiter: ['wer', 'werkarten'],
      stichwoerter: ['andere kuenstler', 'andere galerie', 'andere galerien', 'museum empfehlung', 'galerien in der naehe', 'kuenstler empfehlen', 'anderer kuenstler', 'museen', 'vergleichbare kuenstler', 'empfehlung']
    },

    // Quelle: keine Fakten nötig
    gruss: {
      frage: 'Begrüßung',
      todo: false,
      text: [
        'Guten Tag! Schön, dass Sie hier sind. Sie können mich zu Horst Schwab, seinem Werk, zur Besichtigung oder zur Bedienung der Website fragen.'
      ],
      aktionen: [],
      weiter: ['wer', 'ansehen', 'rundgang'],
      stichwoerter: ['hallo', 'hi', 'guten tag', 'servus', 'moin', 'gruess gott', 'hey', 'guten morgen', 'guten abend', 'hallöchen', 'halo']
    },

    // Quelle: keine Fakten nötig
    danke: {
      frage: 'Danke',
      todo: false,
      text: [
        'Gern geschehen! Wenn Sie noch eine Frage haben, helfe ich Ihnen gern weiter.'
      ],
      aktionen: [],
      weiter: ['wer', 'ansehen'],
      stichwoerter: ['danke', 'dankeschoen', 'vielen dank', 'merci', 'thx', 'danke sehr', 'besten dank', 'dankeschön', 'danke dir', 'dake']
    },

    // Quelle: keine Fakten nötig
    abschied: {
      frage: 'Tschüss',
      todo: false,
      text: [
        'Vielen Dank für Ihren Besuch und auf Wiedersehen! Sie sind jederzeit willkommen wiederzukommen.'
      ],
      aktionen: [],
      weiter: [],
      stichwoerter: ['tschuess', 'tschuss', 'auf wiedersehen', 'ciao', 'bye', 'bis bald', 'schoenen tag', 'auf wiederschauen', 'tschau', 'adieu', 'tschues']
    }

  }
};
