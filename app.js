  const overlay = document.getElementById('room-overlay');
  const dissolve = document.getElementById('dissolve-overlay');
  const heroSection = document.getElementById('hero');
  const zoomOverlay = document.getElementById('zoom-hero-overlay');

  function zoomIntoGallery(targetId) {
    const title  = heroSection.querySelector('.hero-title');
    const scroll = heroSection.querySelector('.hero-scroll');
    const rays   = heroSection.querySelector('.hero-rays');
    const lineV  = heroSection.querySelector('.hero-line-v');
    const floor  = heroSection.querySelector('.hero-floor');

    // 0. Schrift sofort ausblenden
    [title, scroll, rays, lineV, floor].forEach(el => {
      if (!el) return;
      el.style.animation = 'none';
      el.style.opacity   = window.getComputedStyle(el).opacity;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      [title, scroll, rays, lineV, floor].forEach(el => {
        if (!el) return;
        el.style.transition = 'opacity 0.5s ease';
        el.style.opacity    = '0';
      });
    }));

    // 1. Zoom-Overlay anzeigen und Zoom starten
    zoomOverlay.style.opacity = '1';
    zoomOverlay.style.transition = 'opacity 0s';
    zoomOverlay.classList.remove('fade-out');
    zoomOverlay.classList.add('active');

    requestAnimationFrame(() => requestAnimationFrame(() => {
      zoomOverlay.classList.add('zooming');
    }));

    // 2. Sofort zur neuen Seite scrollen (Overlay verdeckt alles)
    const target = document.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: 'instant' });

    // 3. Bei 1.2s: Overlay sanft ausblenden → neue Seite erscheint
    setTimeout(() => {
      zoomOverlay.classList.add('fade-out');

      setTimeout(() => {
        zoomOverlay.classList.remove('active', 'zooming', 'fade-out');
        zoomOverlay.style.transition = 'opacity 0s';
        zoomOverlay.style.opacity = '1';

        [title, scroll, rays, lineV, floor].forEach(el => {
          if (!el) return;
          el.style.animation = el.style.transition = el.style.opacity = '';
        });
      }, 450);
    }, 1200);
  }

  function roomTransition(targetId) {
    const sweep = document.getElementById('nav-sweep');
    sweep.classList.remove('out');
    sweep.classList.add('active');
    // Scroll während Overlay sichtbar ist
    setTimeout(() => {
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: 'instant' });
    }, 420);
    // Ausblenden nach Kometendurchflug
    setTimeout(() => {
      sweep.classList.add('out');
      setTimeout(() => sweep.classList.remove('active', 'out'), 500);
    }, 730);
  }

  // Scroll-Sperren: runter vom Hero + zurück zum Hero
  // sessionStorage hält den Zustand über Refreshes
  var _galleryEntered = sessionStorage.getItem('galleryEntered') === '1';
  var _hasEnteredOnce = sessionStorage.getItem('galleryEnteredOnce') === '1';
  var _touchStartY = 0;
  var _snapReady = _galleryEntered; // sofort aktiv wenn aus sessionStorage
  function _enterGallery() {
    _galleryEntered = true;
    _hasEnteredOnce = true;
    _snapReady = true;
    sessionStorage.setItem('galleryEntered', '1');
    sessionStorage.setItem('galleryEnteredOnce', '1');
  }
  function _goToHero() {
    _galleryEntered = false;
    _snapReady = false;
    sessionStorage.removeItem('galleryEntered');
    // _hasEnteredOnce bleibt true → Down-Sperre entfällt beim Zurückkehren
    roomTransition('hero');
  }
  // Snap-Fallback erst nach Scroll-Restaurierung des Browsers aktivieren
  if (!_snapReady) setTimeout(function() { _snapReady = true; }, 600);

  // Puffer: 250px über der Grenze abfangen (schnelle Trackpad-Gesten)
  window.addEventListener('wheel', function(e) {
    if (!_galleryEntered && !_hasEnteredOnce && window.scrollY <= 5 && e.deltaY > 0) { e.preventDefault(); return; }
    if (_galleryEntered && e.deltaY < 0 && window.scrollY <= window.innerHeight + 250) {
      e.preventDefault();
      if (window.scrollY < window.innerHeight) {
        window.scrollTo({ top: window.innerHeight, behavior: 'instant' });
      }
    }
  }, { passive: false });

  // Touch: Startposition merken, Richtung prüfen
  window.addEventListener('touchstart', function(e) {
    _touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', function(e) {
    if (!_galleryEntered && !_hasEnteredOnce && window.scrollY <= 5) { e.preventDefault(); return; }
    if (_galleryEntered && e.touches[0].clientY > _touchStartY && window.scrollY <= window.innerHeight + 250) {
      e.preventDefault();
    }
  }, { passive: false });

  window.addEventListener('keydown', function(e) {
    if (!_galleryEntered && !_hasEnteredOnce && window.scrollY <= 5 && ['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); return; }
    if (_galleryEntered && window.scrollY <= window.innerHeight + 250 && ['ArrowUp', 'PageUp'].includes(e.key)) e.preventDefault();
  });

  // Letzter Fallback: falls doch durchgescrollt wurde, sofort zurückschnappen
  window.addEventListener('scroll', function() {
    if (_snapReady && _galleryEntered && window.scrollY < window.innerHeight) {
      window.scrollTo({ top: window.innerHeight, behavior: 'instant' });
    }
  }, { passive: true });

  // Hero-Button: Zoom-In Effekt → scrollt zuerst zum Zitat
  const heroEnterBtn = document.querySelector('.hero-enter');
  if (heroEnterBtn) {
    heroEnterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      _enterGallery();
      const targetId = heroEnterBtn.getAttribute('href').slice(1);
      zoomIntoGallery(targetId);
      _showRundgangHint();
    });
  }

  // Rundgang-Button
  const heroGhostBtn = document.getElementById('hero-enter-ghost');
  if (heroGhostBtn) heroGhostBtn.addEventListener('click', _enterGallery);

  // Galerie-Link: zur Startseite navigieren (Hero, frisch geladen)
  document.querySelectorAll('.nav-reload').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('galleryEntered');
      window.location.href = window.location.pathname;
    });
  });

  // Alle anderen internen Links: normaler Raumübergang
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    if (link.classList.contains('hero-enter')) return;
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').slice(1);
      if (!targetId) return;
      e.preventDefault();
      roomTransition(targetId);
    });
  });

  /* ══ ARTWORK DATA ══ */
  const ARTWORKS = {
    'Komposition I':   { technique:'Acryl auf Leinwand', technique_en:'Acrylic on canvas', size:'120 × 90 cm', year:'2024', price:'4.750 – 7.200', cat:'Malerei', cat_en:'Painting', story:'Komposition I markiert einen Wendepunkt im Schaffen von Horst Schwab. In ruhigen Abendsitzungen entstanden, greift das Werk die Spannung zwischen geometrischer Strenge und freiem Ausdruck auf. Die überlagernden Farbschichten wurden in mehreren Wochen aufgebaut — jede Schicht durfte vollständig trocknen, bevor die nächste aufgetragen wurde. Das Ergebnis ist eine vibrierende Tiefe, die sich je nach Lichteinfall verändert.', story_en:'Komposition I marks a turning point in Horst Schwab\'s work. Created during quiet evening sessions, the painting explores the tension between geometric rigour and free expression. The overlapping colour layers were built up over several weeks — each layer left to dry completely before the next was applied. The result is a vibrant depth that shifts with the light.', svg:'<rect x="4" y="4" width="56" height="56" stroke="#C9A84C" stroke-width="0.8"/><line x1="4" y1="4" x2="60" y2="60" stroke="#C9A84C" stroke-width="0.8"/><line x1="60" y1="4" x2="4" y2="60" stroke="#C9A84C" stroke-width="0.8"/>' },
    'Stille II':       { technique:'Acryl auf Leinwand', technique_en:'Acrylic on canvas', size:'80 × 60 cm', year:'2023', price:'2.150 – 3.800', cat:'Malerei', cat_en:'Painting', story:'Stille II ist das zweite Werk einer Reihe, die sich dem Thema innerer Ruhe widmet. Schwab arbeitete hier mit ausgesprochen reduzierter Farbpalette — fast ausschließlich Weiß- und Grautöne, unterbrochen von einem einzigen warmen Akzent. Das Kreisformat innerhalb des rechteckigen Trägers erzeugt eine meditative Wirkung, die Betrachtende zum Innehalten einlädt.', story_en:'Stille II is the second work in a series dedicated to inner stillness. Schwab worked here with an exceptionally reduced palette — almost exclusively whites and greys, broken by a single warm accent. The circular form within the rectangular support creates a meditative effect, inviting the viewer to pause.', svg:'<circle cx="32" cy="32" r="24" stroke="#C9A84C" stroke-width="0.8"/><circle cx="32" cy="32" r="12" stroke="#C9A84C" stroke-width="0.8"/>' },
    'Aufbruch':        { technique:'Acryl auf Leinwand', technique_en:'Acrylic on canvas', size:'100 × 80 cm', year:'2024', price:'3.150 – 4.800', cat:'Malerei', cat_en:'Painting', story:'Aufbruch entstand in einer Phase intensiver Veränderung. Die nach oben strebende Dreiecksform ist bewusst gewählt — sie symbolisiert Bewegung, Entscheidung und den Mut zur Veränderung. Warme Ockertöne treffen auf kühle Blaugrau-Flächen; diese Spannung macht das Bild zu einem emotionalen Dokument seiner Entstehungszeit.', story_en:'Aufbruch (Departure) was created during a period of intense change. The upward-pointing triangular form is deliberate — it symbolises movement, decision and the courage to change. Warm ochres meet cool blue-grey fields; this tension makes the painting an emotional document of the time in which it was made.', svg:'<path d="M4 60 L32 4 L60 60Z" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Horizont':        { technique:'Acryl auf Papier', technique_en:'Acrylic on paper', size:'70 × 50 cm', year:'2023', price:'1.850 – 3.100', cat:'Malerei', cat_en:'Painting', story:'Eine schlichte, fast minimalistische Arbeit — und doch eine der persönlichsten. Die horizontale Linie, die das Bild in zwei nahezu gleiche Hälften teilt, steht für den Moment kurz vor dem Sonnenuntergang. Schwab malte diese Serie während eines längeren Aufenthalts im ländlichen Raum, täglich zur gleichen Stunde, mit dem Blick auf denselben Horizont.', story_en:'A simple, almost minimalist work — yet one of the most personal. The horizontal line dividing the canvas into two near-equal halves represents the moment just before sunset. Schwab painted this series during an extended stay in the countryside, at the same hour each day, looking out at the same horizon.', svg:'<line x1="4" y1="30" x2="60" y2="30" stroke="#C9A84C" stroke-width="0.8"/><line x1="4" y1="38" x2="60" y2="38" stroke="#C9A84C" stroke-width="0.5" opacity="0.5"/>' },
    'Tiefe':           { technique:'Öl auf Leinwand', technique_en:'Oil on canvas', size:'100 × 75 cm', year:'2024', price:'3.450 – 5.500', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Tiefe ist eines der technisch anspruchsvollsten Werke Schwabs. Die charakteristische Kurve wurde mit Ölfarbe in einem einzigen langen Pinselstrich gesetzt — ein Akt, der monatelange Vorbereitung und Konzentration erforderte. Die Schichten darunter, in Lasurtechnik aufgebaut, verleihen dem Werk eine Leuchtkraft, die erst beim längeren Betrachten vollständig sichtbar wird.', story_en:'Tiefe (Depth) is one of Schwab\'s most technically demanding works. The characteristic curve was set with oil paint in a single long brushstroke — an act requiring months of preparation and concentration. The layers beneath, built up in glazing technique, lend the work a luminosity that only becomes fully visible on prolonged viewing.', svg:'<path d="M8 56 Q32 8 56 56" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Stille I':        { technique:'Öl auf Leinwand', technique_en:'Oil on canvas', size:'120 × 90 cm', year:'2022', price:'4.150 – 6.500', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Das erste Werk der Stille-Serie und Ausgangspunkt einer mehrjährigen Auseinandersetzung mit dem Thema Reduktion. Schwab verzichtete hier bewusst auf jede narrative Botschaft — das Bild soll kein Thema transportieren, sondern einen Zustand erzeugen. Mehrfach übermalt und wieder freigelegt, trägt die Oberfläche die Geschichte seiner eigenen Entstehung in sich.', story_en:'The first work of the Stille series and the starting point of a multi-year exploration of reduction. Schwab deliberately renounced all narrative message — the painting is not intended to carry a theme, but to generate a state. Repeatedly painted over and uncovered again, the surface carries the history of its own making.', svg:'<rect x="12" y="12" width="40" height="40" stroke="#C9A84C" stroke-width="0.8"/><rect x="22" y="22" width="20" height="20" stroke="#C9A84C" stroke-width="0.4" opacity="0.5"/>' },
    'Dämmerung':       { technique:'Öl auf Leinwand', technique_en:'Oil on canvas', size:'90 × 70 cm', year:'2023', price:'2.750 – 4.200', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Die Tageszeit zwischen Tag und Nacht hat Schwab schon immer fasziniert. Dämmerung versucht, diesen flüchtigen Moment festzuhalten — nicht als Abbild, sondern als Stimmung. Der Halbkreis am unteren Bildrand ist kein Sonnen-Symbol, sondern das Ergebnis eines spontanen Eingriffs am späten Abend im Atelier, der das Bild aus seiner ursprünglichen Planung herausriss und in etwas Ungeplantes verwandelte.', story_en:'The hour between day and night has always fascinated Schwab. Dämmerung (Dusk) tries to capture this fleeting moment — not as an image, but as a mood. The semicircle at the lower edge is not a sun symbol; it arose from a spontaneous late-evening intervention in the studio that wrenched the painting out of its original plan into something unplanned.', svg:'<circle cx="32" cy="48" r="20" stroke="#C9A84C" stroke-width="0.8"/><line x1="4" y1="48" x2="60" y2="48" stroke="#C9A84C" stroke-width="0.4"/>' },
    'Landschaft I':    { technique:'Öl auf Leinwand', technique_en:'Oil on canvas', size:'140 × 100 cm', year:'2024', price:'4.950 – 8.000', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Das großformatigste Ölbild dieser Kollektion. Schwab kehrte hier zu seinen Wurzeln zurück — figurativ, landschaftsbezogen, aber ohne jemals konkret zu werden. Die geschwungene Linie, die das Bild diagonal durchzieht, ist gleichzeitig Horizont, Fluss und Geste. Entstanden über einen Zeitraum von vier Monaten, ist Landschaft I eine Meditation über das Vergehen von Zeit im Raum.', story_en:'The largest oil painting in this collection. Schwab returned here to his roots — figurative, landscape-related, yet never quite concrete. The sweeping line crossing the canvas diagonally is at once a horizon, a river and a gesture. Created over four months, Landschaft I is a meditation on the passing of time through space.', svg:'<path d="M4 48 Q20 20 32 32 Q44 44 60 16" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Vergänglichkeit': { technique:'Aquarell auf Papier', technique_en:'Watercolour on paper', size:'60 × 50 cm', year:'2023', price:'1.750 – 3.200', cat:'Grafik', cat_en:'Graphics', story:'Aquarell ist das Medium der Augenblicke — einmal gesetzt, lässt sich nichts zurücknehmen. Vergänglichkeit macht genau diese Eigenschaft zum Thema. Die rautenförmige Komposition im Zentrum scheint sich in die Ränder des Blattes aufzulösen, als ob die Form selbst im Begriff ist zu verschwinden. Ein Werk über Zeit, Erinnerung und das Loslassen.', story_en:'Watercolour is the medium of moments — once laid down, nothing can be taken back. Vergänglichkeit (Impermanence) makes this very quality its subject. The diamond-shaped composition at the centre appears to dissolve towards the edges of the sheet, as if the form itself is about to disappear. A work about time, memory and letting go.', svg:'<rect x="20" y="20" width="24" height="24" stroke="#C9A84C" stroke-width="0.8" transform="rotate(45 32 32)"/>' },
    'Morgenrot':       { technique:'Aquarell auf Papier', technique_en:'Watercolour on paper', size:'50 × 40 cm', year:'2023', price:'1.350 – 2.600', cat:'Grafik', cat_en:'Graphics', story:'Morgenrot entstand in den frühen Morgenstunden, unmittelbar nach dem Erwachen, als eine Art malerisches Tagebucheintrag. Die konzentrischen Kreise entstanden ohne Vorlage, nur aus der Erinnerung an einen Traum. Schwab beschreibt dieses Werk als eines seiner persönlichsten — klein im Format, aber groß in dem, was es für ihn bedeutet.', story_en:'Morgenrot (Dawn) was created in the early morning hours, immediately upon waking, as a kind of painted diary entry. The concentric circles were made without a sketch, purely from the memory of a dream. Schwab describes this work as one of his most personal — small in format, but large in what it means to him.', svg:'<circle cx="32" cy="32" r="16" stroke="#C9A84C" stroke-width="0.8" opacity="0.7"/><circle cx="32" cy="32" r="8" stroke="#C9A84C" stroke-width="0.8"/>' },
    'Nebel':           { technique:'Aquarell auf Papier', technique_en:'Watercolour on paper', size:'70 × 55 cm', year:'2024', price:'2.050 – 3.600', cat:'Grafik', cat_en:'Graphics', story:'Nebel ist das Ergebnis eines Experiments mit dem Nasstrocken-Verfahren. Das Papier wurde vollständig gewässert, bevor die ersten Pigmente aufgetragen wurden — das ließ die Farben ineinanderfließen auf eine Weise, die sich nicht planen lässt. Was als Versuch begann, wurde zu einem der ausdrucksstärksten Werke der Aquarell-Kollektion.', story_en:'Nebel (Fog) is the result of an experiment in wet-on-wet technique. The paper was fully saturated before the first pigments were applied — allowing the colours to bleed into one another in a way that cannot be planned. What began as an experiment became one of the most expressive works in the watercolour collection.', svg:'<line x1="8" y1="26" x2="56" y2="26" stroke="#C9A84C" stroke-width="0.8"/><line x1="12" y1="34" x2="52" y2="34" stroke="#C9A84C" stroke-width="0.6" opacity="0.6"/><line x1="18" y1="42" x2="46" y2="42" stroke="#C9A84C" stroke-width="0.4" opacity="0.35"/>' },
    'Fluss':           { technique:'Aquarell auf Papier', technique_en:'Watercolour on paper', size:'55 × 45 cm', year:'2023', price:'1.550 – 2.900', cat:'Grafik', cat_en:'Graphics', story:'Die geschwungene Linie, die Fluss durchzieht, ist von einem Spaziergang am Inn entlehnt. Schwab skizzierte die Kurve des Flusses in einem einzigen Zug ins nasse Papier. Entstanden in weniger als zwanzig Minuten, ist Fluss der Beweis, dass Authentizität keine Zeit braucht — nur Präsenz.', story_en:'The sweeping line running through Fluss (River) was borrowed from a walk along the Inn. Schwab sketched the curve of the river in a single stroke into wet paper. Completed in under twenty minutes, Fluss is proof that authenticity needs no time — only presence.', svg:'<path d="M4 40 Q20 24 32 36 Q44 48 60 24" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Licht & Schatten':{ technique:'Mischtechnik', technique_en:'Mixed media', size:'90 × 70 cm', year:'2024', price:'2.850 – 4.500', cat:'Plastik', cat_en:'Sculpture', story:'Das Kreuz aus horizontaler und vertikaler Linie teilt die Fläche in vier Felder, die trotz ihrer scheinbaren Gleichheit völlig unterschiedlich wirken — je nachdem, von wo aus das Licht auf das Bild fällt. Schwab arbeitete hier mit Acryl, Kreide und Sandpigment, um eine Oberfläche zu schaffen, die Licht buchstäblich anders reflektiert als ihre Umgebung.', story_en:'The cross of horizontal and vertical lines divides the surface into four fields that, despite their apparent equality, read completely differently depending on the angle of light. Schwab worked here with acrylic, chalk and sand pigment to create a surface that literally reflects light differently from its surroundings.', svg:'<line x1="32" y1="4" x2="32" y2="60" stroke="#C9A84C" stroke-width="0.8"/><line x1="4" y1="32" x2="60" y2="32" stroke="#C9A84C" stroke-width="0.8"/>' },
    'Struktur':        { technique:'Mischtechnik auf Leinwand', technique_en:'Mixed media on canvas', size:'100 × 80 cm', year:'2024', price:'3.050 – 4.800', cat:'Plastik', cat_en:'Sculpture', story:'Struktur ist eine Auseinandersetzung mit dem Raster als Ordnungsprinzip. Vier gleich große Felder — und doch ist jedes einzigartig. Schwab kombinierte Acrylfarbe mit aufgeklebten Materialien aus dem Alltag: Zeitungsfetzen, Sandpapier, Stoff. Erst aus der Distanz fügt sich alles zu einem kohärenten Bild zusammen.', story_en:'Struktur (Structure) is an engagement with the grid as an ordering principle. Four equal fields — yet each one unique. Schwab combined acrylic paint with everyday materials: scraps of newspaper, sandpaper, cloth. Only from a distance does everything come together into a coherent whole.', svg:'<rect x="8" y="8" width="20" height="20" stroke="#C9A84C" stroke-width="0.7"/><rect x="36" y="8" width="20" height="20" stroke="#C9A84C" stroke-width="0.7"/><rect x="8" y="36" width="20" height="20" stroke="#C9A84C" stroke-width="0.7"/><rect x="36" y="36" width="20" height="20" stroke="#C9A84C" stroke-width="0.7"/>' },
    'Fragment':        { technique:'Kohle & Acryl', technique_en:'Charcoal & Acrylic', size:'80 × 60 cm', year:'2023', price:'2.350 – 3.900', cat:'Plastik', cat_en:'Sculpture', story:'Fragment ist das einzige Werk in dieser Kollektion, das bewusst unvollendet gelassen wurde. Die zwei Winkelformen, die sich annähern ohne sich zu berühren, stehen für Gespräche, die nie zu Ende geführt wurden. Kohle auf grundierter Leinwand, partiell mit Acryl fixiert — die Oberfläche ist rau, fast verletzlich.', story_en:'Fragment is the only work in this collection deliberately left unfinished. The two angular forms approaching without touching stand for conversations never brought to a conclusion. Charcoal on primed canvas, partially fixed with acrylic — the surface is rough, almost vulnerable.', svg:'<path d="M4 4 L30 32 L4 60" stroke="#C9A84C" stroke-width="0.7" fill="none"/><path d="M34 4 L60 32 L34 60" stroke="#C9A84C" stroke-width="0.5" fill="none" opacity="0.5"/>' },
    'Zwei Figuren I':           { img:'Images/C-F-2001-1entzerrt.jpg', technique:'Mischtechnik', technique_en:'Mixed media', size:'28 × 40 cm', year:'2001', price:'400 – 700', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Zwei Figuren treten in einen stummen Dialog. Die hintere dem Betrachter abgewandt, im Rückenakt, während die vordere zu ahnen bleibt. Lila und Orange brechen die Dunkelheit auf — Farbe als Sprache des Unausgesprochenen. Signiert unten rechts.', story_en:'Two figures in silent dialogue. One turned away, seen from behind; the other only suggested. Lilac and orange pierce the darkness — colour as the language of the unspoken. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<line x1="20" y1="8" x2="20" y2="56" stroke="#C9A84C" stroke-width="0.8"/><line x1="44" y1="8" x2="44" y2="56" stroke="#C9A84C" stroke-width="0.8"/>' },
    'Badende':                  { img:'Images/C-F-2001-2entzerrt.JPG', technique:'Mischtechnik', technique_en:'Mixed media', size:'50 × 70 cm', year:'2001', price:'450 – 750', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Eine lichte Figur in Weiß, Grau und Gelb hebt sich von zwei dunklen Torsi ab. Die Collagetechnik schichtet Körper übereinander — ein Fragment menschlicher Präsenz, das aus der Dunkelheit heraustritt. Signiert unten mittig.', story_en:'A luminous figure in white, grey and yellow emerges against two dark torsos. The collage technique layers bodies one over another — a fragment of human presence stepping out of the dark. Signed lower centre.', signed:'unten mittig', signed_en:'lower centre', svg:'<ellipse cx="32" cy="32" rx="14" ry="22" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Zwei Badende':             { img:'Images/C-F-2002-1entzerrt.JPG', technique:'Mischtechnik auf Papier', technique_en:'Mixed media on paper', size:'60 × 80 cm', year:'2002', price:'500 – 800', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Violett durchzieht das Bild wie ein Stimmungston. Die Figuren sind gestreckt, fast gelöst von ihrer Form — begrenzt nur durch schwarze Konturen, die sie aus dem Farbstrom heraustreten lassen. Signiert unten rechts.', story_en:'Violet runs through the painting like an undertone. The figures are elongated, almost dissolved — held in place only by black contours that lift them out of the current of colour. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<line x1="22" y1="8" x2="22" y2="56" stroke="#C9A84C" stroke-width="0.8"/><line x1="42" y1="8" x2="42" y2="56" stroke="#C9A84C" stroke-width="0.6" opacity="0.6"/>' },
    'Figur und Torsi':          { img:'Images/C-F-2002-2entzerrt.JPG', technique:'Mischtechnik', technique_en:'Mixed media', size:'70 × 50 cm', year:'2002', price:'450 – 750', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Grau als Farbe der Körper, dahinter die volle Palette: Violett, Rot, Ocker. Die Torsi scheinen in einer anderen Zeitebene zu existieren als der Hintergrund — Schwabs Schichttechnik erzeugt Tiefe als zeitlichen Abstand. Signiert unten rechts.', story_en:'Grey as the colour of bodies, behind it the full palette: violet, red, ochre. The torsos seem to inhabit a different temporal layer from the background — Schwab\'s layering technique creates depth as temporal distance. Signed lower right.', hasFrame:true, signed:'unten rechts', signed_en:'lower right', svg:'<circle cx="24" cy="32" r="12" stroke="#C9A84C" stroke-width="0.8" fill="none"/><circle cx="44" cy="32" r="8" stroke="#C9A84C" stroke-width="0.6" fill="none" opacity="0.6"/>' },
    'Langgezogene Figurengruppe':{ img:'Images/C-F-2002-3entzerrt.JPG', technique:'Mischtechnik', technique_en:'Mixed media', size:'60 × 80 cm', year:'2002', price:'500 – 800', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Sind es Tanzende oder Skelette? Schwab lässt die Frage offen. Schwarze Umrisse bewegen sich gegen leuchtende Farben — ein Bild, das Energie und Vergänglichkeit in einem einzigen Atem vereint. Signiert unten rechts.', story_en:'Dancers, or skeletons? Schwab leaves the question open. Black outlines move against vivid colours — a single image holding energy and transience in the same breath. Signed lower right.', hasFrame:true, signed:'unten rechts', signed_en:'lower right', svg:'<path d="M16 56 L32 8 L48 56" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Totenkult':                { img:'Images/C-F-2003-1entzerrt.JPG', technique:'Acrylcollage', technique_en:'Acrylic collage', size:'45 × 72 cm', year:'2003', price:'450 – 750', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Der Titel deutet auf Ritual und Übergang. Zwei Frauenfiguren — eine dem Betrachter zugewandt, eine abgewandt — verbunden durch das Violett, das die Komposition durchpulst. Blau, Rot und Schwarz grundieren das Bild wie ein uraltes Zeremoniell. Signiert unten links.', story_en:'The title speaks of ritual and passage. Two female figures — one facing the viewer, one turned away — connected by the violet that pulses through the composition. Blue, red and black underpin the image like an ancient ceremony. Signed lower left.', signed:'unten links', signed_en:'lower left', svg:'<rect x="8" y="8" width="48" height="48" stroke="#C9A84C" stroke-width="0.8" fill="none"/><line x1="8" y1="32" x2="56" y2="32" stroke="#C9A84C" stroke-width="0.4" opacity="0.5"/>' },
    'Bunte Figur':              { img:'Images/C-F-2004-1entzerrt.JPG', technique:'Acrylcollage auf Pressspahn', technique_en:'Acrylic collage on hardboard', size:'48 × 60 cm', year:'2004', price:'400 – 700', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Gegen das Dunkel setzt Schwab die Figur als reines Farbereignis. Die Acrylcollage auf Pressspahn — ein grobes, unprätentiöses Trägermaterial — gibt dem Werk eine erdige Energie. Eine Figur, die sich aus dem Untergrund herausarbeitet. Signiert unten rechts.', story_en:'Against the dark, Schwab sets the figure as a pure event of colour. The acrylic collage on hardboard — a rough, unassuming support — gives the work an earthy energy. A figure working its way up from the ground. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<circle cx="32" cy="24" r="10" stroke="#C9A84C" stroke-width="0.8" fill="none"/><line x1="32" y1="34" x2="32" y2="56" stroke="#C9A84C" stroke-width="0.8"/>' },
    'Goldene Figur':            { img:'Images/C-F-2004-2entzerrt.JPG', technique:'Mischtechnik auf Leinwand', technique_en:'Mixed media on canvas', size:'48 × 68 cm', year:'2004', price:'500 – 800', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Gold krönt den Kopf — ob als Aureole, als Maske oder als Zeichen bleibt unentschieden. Die Figur steht aufrecht, von schwarzen und blauen Streifen gerahmt und zugleich fragmentiert. Schwab verleiht dem Körper eine sakrale Präsenz. Signiert unten rechts.', story_en:'Gold crowns the head — whether as aureole, mask or sign remains undecided. The figure stands upright, framed and at the same time fragmented by black and blue stripes. Schwab gives the body a sacral presence. Signed lower right.', hasFrame:true, signed:'unten rechts', signed_en:'lower right', svg:'<circle cx="32" cy="16" r="8" stroke="#C9A84C" stroke-width="0.9" fill="none"/><line x1="32" y1="24" x2="32" y2="56" stroke="#C9A84C" stroke-width="0.8"/><line x1="20" y1="36" x2="44" y2="36" stroke="#C9A84C" stroke-width="0.6"/>' },
    'Kopf im Profil':           { img:'Images/C-F-2004-3entzerrt.JPG', technique:'Deckfarben auf Papier', technique_en:'Gouache on paper', size:'25 × 33 cm', year:'2004', price:'350 – 650', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Das Profil — älteste Form des Porträts. Schwab kehrt zu ihr zurück und entzieht ihr das Individuelle: kein Name, keine Erkennung. Nur die Silhouette eines Kopfes gegen das Dunkel. Reduktion als Würde. Signiert unten rechts.', story_en:'The profile — oldest form of portraiture. Schwab returns to it and strips away the individual: no name, no recognition. Only the silhouette of a head against the dark. Reduction as dignity. Signed lower right.', hasFrame:true, signed:'unten rechts', signed_en:'lower right', svg:'<path d="M20 12 Q40 12 40 32 Q40 52 20 52 Q20 32 20 12Z" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Hockende Figur':           { img:'Images/C-F-2004-4entzerrt.JPG', technique:'Pastell auf Papier', technique_en:'Pastel on paper', size:'25 × 33 cm', year:'2004', price:'350 – 650', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Die Hocke — eine archaische Körperhaltung, die Schutz und Konzentration zugleich bedeutet. Farbe trifft auf Farbe: die Figur droht im Hintergrund aufzugehen, nur die Kontur trennt noch Innen von Außen. Signiert unten rechts.', story_en:'The crouch — an archaic posture, signifying shelter and concentration alike. Colour meets colour: the figure threatens to dissolve into the background; only the contour still separates inside from outside. Signed lower right.', hasFrame:true, signed:'unten rechts', signed_en:'lower right', svg:'<path d="M20 20 Q32 8 44 20 Q48 36 32 52 Q16 36 20 20Z" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Zwei Figuren II':          { img:'Images/C-F-2005-1entzerrt.JPG', technique:'Collage aus Drucken', technique_en:'Collage from prints', size:'50 × 70 cm', year:'2005', price:'450 – 750', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Zwei Umrisse, frontal, sich berührend — in einem bootsähnlichen Gefäß vereint. Schwab collagiert Drucke zu einem Bild der Nähe und des gemeinsamen Getragenseins. Zwei Körper, die gemeinsam einem Ziel entgegentreiben. Signiert unten rechts.', story_en:'Two outlines, frontal, touching — united within a boat-like vessel. Schwab assembles prints into an image of closeness and shared passage. Two bodies drifting together towards a common destination. Signed lower right.', hasFrame:true, signed:'unten rechts', signed_en:'lower right', svg:'<ellipse cx="24" cy="32" rx="10" ry="18" stroke="#C9A84C" stroke-width="0.8" fill="none"/><ellipse cx="40" cy="32" rx="10" ry="18" stroke="#C9A84C" stroke-width="0.6" fill="none" opacity="0.6"/>' },
    'Kuss':                     { img:'Images/C-F-2005-2entzerrt.JPG', technique:'Mischtechnik', technique_en:'Mixed media', size:'50 × 70 cm', year:'2005', price:'500 – 800', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Rot — die Farbe von Blut und Begehren. Zwei Figuren finden sich im Kuss und verschmelzen fast zur Einheit. Die Mischtechnik löst die Grenzen zwischen den Körpern auf: wo endet einer, wo beginnt der andere? Signiert unten rechts.', story_en:'Red — the colour of blood and desire. Two figures meet in a kiss and nearly merge into one. The mixed media dissolves the boundaries between the bodies: where does one end, where does the other begin? Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<path d="M8 32 Q32 4 56 32" stroke="#C9A84C" stroke-width="0.8" fill="none"/><path d="M8 32 Q32 60 56 32" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Badende in blau':          { img:'Images/C-F-2005-3entzerrt.JPG', technique:'Mischtechnik', technique_en:'Mixed media', size:'24 × 34 cm', year:'2005', price:'350 – 650', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Rückenakte — Körper, die sich entziehen. In Blau getaucht, zeigen die Figuren dem Betrachter das Schweigen ihrer Rücken. Eine Intimität, die nicht preisgibt. Das Blaue ist keine Farbe — es ist Atmosphäre. Signiert unten rechts.', story_en:'Figures seen from behind — bodies that withhold themselves. Steeped in blue, they show the viewer the silence of their backs. An intimacy that reveals nothing. The blue is not a colour — it is an atmosphere. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<path d="M16 12 Q24 8 32 12 Q40 8 48 12" stroke="#C9A84C" stroke-width="0.8" fill="none"/><path d="M12 40 Q32 28 52 40" stroke="#C9A84C" stroke-width="0.6" fill="none" opacity="0.7"/>' },
    'Paar':                     { img:'Images/C-F-2005-4.JPG', technique:'Collage aus Graphik', technique_en:'Collage from graphic prints', size:'–', year:'2005', price:'400 – 700', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Ein Paar — hintereinander, nicht nebeneinander. Die Brauntöne und das graphische Ausgangsmaterial verleihen den Figuren etwas Archaisches, fast Monumentales. Zweiheit als Einheit: der eine Körper als Schatten des anderen. Signiert unten rechts.', story_en:'A couple — one behind the other, not side by side. The brown tones and the graphic source material give the figures an archaic, almost monumental quality. Twoness as oneness: one body as the shadow of the other. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<line x1="28" y1="8" x2="28" y2="56" stroke="#C9A84C" stroke-width="0.9"/><line x1="36" y1="8" x2="36" y2="56" stroke="#C9A84C" stroke-width="0.5" opacity="0.5"/>' },
    'Zwei Frauen':              { img:'Images/C-F-2005-5.JPG', technique:'Mischtechnik', technique_en:'Mixed media', size:'65 × 50 cm', year:'2005', price:'450 – 750', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Das schwarze Quadrat im Hintergrund ist kein Zufall — eine bewusste Setzung. Zwei Frauenfiguren davor: eine vollständig, eine als Hüftfigur. Das Quadrat als Folie, als Spiegel, als Leerstelle, vor der der menschliche Körper umso mehr spricht. Signiert unten rechts.', story_en:'The black square in the background is no accident — a deliberate gesture. Two female figures before it: one complete, one cropped at the waist. The square as backdrop, as mirror, as void — against which the human body speaks all the more strongly. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<rect x="16" y="16" width="32" height="32" stroke="#C9A84C" stroke-width="0.8" fill="none"/><line x1="32" y1="8" x2="32" y2="16" stroke="#C9A84C" stroke-width="0.6"/>' },
    'Meer':                     { img:'Images/C-F-2005-6entzerrt.JPG', technique:'Grafikkollage', technique_en:'Graphic collage', size:'33 × 24 cm', year:'2005', price:'350 – 650', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Das einzige Landschaftsbild der Serie und zugleich eines der stillsten. Die Grafikkollage übersetzt das Meer in Schichten und Streifen — Wasser als Struktur, nicht als Abbild. Dahinter: ein schmaler Streifen Land, kaum mehr als eine Ahnung. Signiert unten rechts.', story_en:'The only landscape in the series, and one of its quietest works. The graphic collage translates the sea into layers and strips — water as structure, not as image. Beyond it: a narrow strip of land, little more than a suggestion. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<path d="M4 36 Q16 28 28 36 Q40 44 52 36 Q60 32 60 32" stroke="#C9A84C" stroke-width="0.8" fill="none"/><line x1="4" y1="24" x2="60" y2="24" stroke="#C9A84C" stroke-width="0.4" opacity="0.5"/>' },
    'Übergang':        { technique:'Mischtechnik', technique_en:'Mixed media', size:'110 × 85 cm', year:'2024', price:'3.450 – 5.200', cat:'Plastik', cat_en:'Sculpture', story:'Die Ellipsenform, die Übergang strukturiert, wurde von einem alten Handwerkswerkzeug abgeleitet — einer Schablone aus dem Nachlass von Schwabs Vater. Das Persönliche und das Formale verbinden sich hier auf ungewöhnliche Weise. Mehrere Schichten Öl und Acryl wurden mit einem Spachtel aufgetragen und wieder abgetragen, bis die heutige Textur entstanden war.', story_en:'The elliptical form structuring Übergang (Transition) was derived from an old craftsman\'s tool — a stencil from the estate of Schwab\'s father. The personal and the formal come together here in an unusual way. Several layers of oil and acrylic were applied with a palette knife and removed again, until the present texture emerged.', svg:'<path d="M4 32 Q32 4 60 32 Q32 60 4 32Z" stroke="#C9A84C" stroke-width="0.7" fill="none"/>' },
  };

  /* ══ LANGUAGE ══ */
  let _lang = localStorage.getItem('lang') || 'de';

  const I18N = {
    de: {
      'nav-galerie':'Galerie','nav-werke':'Werke','nav-bio':'Biographie','nav-rundgang':'Rundgang',
      'nav-socials':'Socials','nav-kontakt':'Kontakt','nav-favs-label':'Merkliste','nav-acc-label':'Anmelden',
      'hero-tagline':'Kunst  |  Leidenschaft  |  Zeitlos','hero-enter':'Galerie betreten','hero-enter-ghost':'→ Rundgang starten','hero-origin':'Kusel · Atelier · 1934','hero-scroll':'Entdecken',
      'intro-label':'Willkommen',
      'gal-label':'Aktuelle Werke','gal-heading':'Ausgewählte Kollektion',
      'cat-acryl':'Malerei','cat-oel':'Collage \u0026 Zeichnungen','cat-aquarell':'Grafik',
      'cat-view-1':'Kollektion ansehen','cat-view-2':'Kollektion ansehen','cat-view-3':'Kollektion ansehen','cat-view-4':'Kollektion ansehen',
      'coll-back-acryl-t':'Zurück','coll-back-oel-t':'Zurück','coll-back-aquarell-t':'Zurück','coll-back-mixed-t':'Zurück',
      'coll-head-acryl':'Malerei','coll-head-oel':'Collage &amp;<br>Zeichnungen','coll-head-aquarell':'Grafik','coll-head-mixed':'Plastik',
      'soc-label':'Folgen Sie uns','soc-heading':'Bleiben Sie in Verbindung','soc-sub':'Entdecken Sie neue Werke, Ausstellungen und Einblicke hinter die Kulissen.',
      'soc-cal-label':'Termin buchen','soc-cal-sub':'Besichtigung vereinbaren',
      'cal-success-text':'Anfrage gesendet.','cal-success-sub':'Wir bestätigen Ihren Termin per E-Mail.',
      'kon-label':'Kontakt','kon-heading':'Sprechen Sie mit uns','kon-sub':'Für Anfragen, private Besichtigungen oder Kooperationen.',
      'kon-email-label':'E-Mail','kon-phone-label':'Telefon','kon-studio-label':'Atelier','kon-studio-val':'Nach Vereinbarung',
      'kon-form-name-label':'Name','kon-form-email-label':'E-Mail','kon-form-msg-label':'Nachricht',
      'kon-submit-text':'Nachricht senden','kon-success-text':'Vielen Dank für Ihre Nachricht.','kon-success-sub':'Wir melden uns in Kürze bei Ihnen.',
      'ad-back-text':'Zurück','ad-story-head':'Über dieses Werk','ad-offer-btn':'Angebot abgeben','ad-rundgang-btn':'Im Rundgang entdecken',
      'fav-back-text':'Zurück','fav-heading':'Merkliste',
      'fav-empty-label':'Noch keine Werke gespeichert.',
      'ad-tech-label':'Technik','ad-size-label':'Format','ad-year-label':'Jahr','ad-cat-label':'Kategorie','ad-sign-label':'Signatur',
      'ad-sub-text':'Originalwerk  ·  Bild folgt in Kürze',
      'bio-label':'Biographie','bio-teaser-label':'Biographie',
      'bio-fl-1':'Geburtsjahr','bio-fl-2':'Ausbildung','bio-fl-3':'Tätig in','bio-fl-4':'Auszeichnung','bio-fl-5':'Techniken','bio-fl-6':'Publikation',
      'bio-fv-3':'Kusel · Pfalz','bio-fv-4':'Pfalzpreis für Malerei','bio-fv-5':'Malerei · Grafik · Plastik','bio-fv-6':'Gedichtband 2015',
      'cat-mixed':'Plastik',
    },
    en: {
      'nav-galerie':'Gallery','nav-werke':'Works','nav-bio':'Biography','nav-rundgang':'Tour',
      'nav-socials':'Socials','nav-kontakt':'Contact','nav-favs-label':'Wishlist','nav-acc-label':'Sign in',
      'hero-tagline':'Art  |  Passion  |  Timeless','hero-enter':'Enter Gallery','hero-enter-ghost':'→ Enter Tour','hero-origin':'Kusel · Studio · 1934','hero-scroll':'Discover',
      'intro-label':'Welcome',
      'gal-label':'Current Works','gal-heading':'Selected Collection',
      'cat-acryl':'Painting','cat-oel':'Collage \u0026 Drawings','cat-aquarell':'Graphics',
      'cat-view-1':'View Collection','cat-view-2':'View Collection','cat-view-3':'View Collection','cat-view-4':'View Collection',
      'coll-back-acryl-t':'Back','coll-back-oel-t':'Back','coll-back-aquarell-t':'Back','coll-back-mixed-t':'Back',
      'coll-head-acryl':'Painting','coll-head-oel':'Collage &amp;<br>Drawings','coll-head-aquarell':'Graphics','coll-head-mixed':'Sculpture',
      'soc-label':'Follow Us','soc-heading':'Stay Connected','soc-sub':'Discover new works, exhibitions and behind-the-scenes insights.',
      'soc-cal-label':'Book appointment','soc-cal-sub':'Schedule a viewing',
      'cal-success-text':'Request sent.','cal-success-sub':'We will confirm your appointment by e-mail.',
      'kon-label':'Contact','kon-heading':'Get in Touch','kon-sub':'For enquiries, private viewings or collaborations.',
      'kon-email-label':'E-Mail','kon-phone-label':'Phone','kon-studio-label':'Studio','kon-studio-val':'By appointment',
      'kon-form-name-label':'Name','kon-form-email-label':'E-Mail','kon-form-msg-label':'Message',
      'kon-submit-text':'Send message','kon-success-text':'Thank you for your message.','kon-success-sub':'We will get back to you shortly.',
      'ad-back-text':'Back','ad-story-head':'About This Work','ad-offer-btn':'Make an Offer','ad-rundgang-btn':'Discover in Virtual Tour',
      'fav-back-text':'Back','fav-heading':'Wishlist',
      'fav-empty-label':'No works saved yet.',
      'ad-tech-label':'Technique','ad-size-label':'Format','ad-year-label':'Year','ad-cat-label':'Category','ad-sign-label':'Signature',
      'ad-sub-text':'Original work  ·  Image coming soon',
      'bio-label':'Biography','bio-teaser-label':'Biography',
      'bio-fl-1':'Born','bio-fl-2':'Education','bio-fl-3':'Based in','bio-fl-4':'Award','bio-fl-5':'Techniques','bio-fl-6':'Publication',
      'bio-fv-3':'Kusel · Palatinate','bio-fv-4':'Pfalz Prize for Painting','bio-fv-5':'Painting · Graphics · Sculpture','bio-fv-6':'Poetry Collection 2015',
      'cat-mixed':'Sculpture',
    }
  };

  function setLang(lang) {
    _lang = lang;
    localStorage.setItem('lang', lang);
    const t = I18N[lang];
    // translate all labelled elements
    Object.keys(t).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = t[id];
    });
    // lang button highlight
    var lde = document.getElementById('l-de'), len2 = document.getElementById('l-en');
    if (lde && len2) {
      lde.className = lang === 'de' ? 'l-active' : '';
      len2.className = lang === 'en' ? 'l-active' : '';
    }
    // toggle all lang-de / lang-en elements (intro, bio paragraphs, quotes, timeline, etc.)
    document.querySelectorAll('.lang-de').forEach(function(el) { el.style.display = lang === 'de' ? '' : 'none'; });
    document.querySelectorAll('.lang-en').forEach(function(el) { el.style.display = lang === 'en' ? '' : 'none'; });
    // bio roles text contains HTML entities — must use innerHTML
    var bioRoles = document.getElementById('bio-roles');
    if (bioRoles) bioRoles.innerHTML = lang === 'en' ? 'PAINTER &nbsp;|&nbsp; GRAPHIC ARTIST &nbsp;|&nbsp; SCULPTOR' : 'MALER &nbsp;|&nbsp; GRAFIKER &nbsp;|&nbsp; BILDHAUER &nbsp;|&nbsp; LYRIKER';
    // update card metas
    document.querySelectorAll('.coll-card').forEach(function(card) {
      var titleEl = card.querySelector('.coll-card-title');
      if (!titleEl) return;
      var d = ARTWORKS[titleEl.textContent.trim()];
      if (!d) return;
      var meta = card.querySelector('.coll-card-meta');
      if (meta) meta.textContent = (lang === 'en' ? d.technique_en : d.technique) + '  ·  ' + d.size + '  ·  ' + d.year;
    });
    // re-render open artwork if any
    var adEl = document.getElementById('artwork-detail');
    if (_adCurrentTitle && adEl && adEl.classList.contains('active')) openArtwork(_adCurrentTitle, true);
    // re-render favs if open
    var favEl = document.getElementById('fav-overlay');
    if (favEl && favEl.classList.contains('active')) renderFavs();
  }

  function toggleLang() { setLang(_lang === 'de' ? 'en' : 'de'); }

  /* ══ FAVORITES ══ */
  let _favs = new Set(JSON.parse(localStorage.getItem('favs') || '[]'));

  function _saveFavs() { localStorage.setItem('favs', JSON.stringify([..._favs])); }

  function toggleFav(title) {
    if (!title) return;
    if (_favs.has(title)) { _favs.delete(title); } else { _favs.add(title); }
    _saveFavs();
    _updateFavBtns(title);
    _updateFavBadge();
    if (_favs.has(title)) {
      function _pulse(btn) {
        if (!btn) return;
        btn.classList.remove('fav-pulse');
        void btn.offsetWidth;
        btn.classList.add('fav-pulse');
        btn.addEventListener('animationend', function() { btn.classList.remove('fav-pulse'); }, { once: true });
      }
      document.querySelectorAll('.fav-btn[data-title="' + title + '"]').forEach(_pulse);
      if (_adCurrentTitle === title) _pulse(document.getElementById('ad-fav-btn'));
    }
  }

  function _updateFavBtns(title) {
    const active = _favs.has(title);
    // coll-card heart
    document.querySelectorAll('.fav-btn[data-title="' + title + '"]').forEach(function(btn) {
      btn.textContent = active ? '♥' : '♡';
      btn.classList.toggle('fav-active', active);
    });
    // ad heart
    if (_adCurrentTitle === title) {
      const adBtn = document.getElementById('ad-fav-btn');
      if (adBtn) { adBtn.textContent = active ? '♥' : '♡'; adBtn.classList.toggle('fav-active', active); }
    }
  }

  function _updateFavBadge() {
    const badge = document.getElementById('fav-badge');
    if (!badge) return;
    if (_favs.size > 0) { badge.textContent = _favs.size; badge.style.display = ''; }
    else { badge.style.display = 'none'; }
  }

  function openFavs() {
    renderFavs();
    document.getElementById('fav-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeFavs() {
    document.getElementById('fav-overlay').classList.remove('active');
    document.body.style.overflow = '';
  }

  function renderFavs() {
    const grid = document.getElementById('fav-grid');
    const emptyMsg = document.getElementById('fav-empty-msg');
    if (_favs.size === 0) {
      grid.innerHTML = '';
      if (emptyMsg) { emptyMsg.style.display = ''; grid.appendChild(emptyMsg); }
      return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';
    const t = I18N[_lang];
    grid.innerHTML = '';
    _favs.forEach(function(title) {
      const d = ARTWORKS[title]; if (!d) return;
      const tech = _lang === 'en' ? d.technique_en : d.technique;
      const cat  = _lang === 'en' ? d.cat_en : d.cat;
      const card = document.createElement('div');
      card.className = 'coll-card';
      card.style.cursor = 'pointer';
      card.onclick = function() { closeFavs(); openArtwork(title); };
      card.innerHTML =
        '<div class="coll-card-img"><svg width="56" height="56" viewBox="0 0 64 64" fill="none">' + d.svg + '</svg></div>' +
        '<div class="coll-card-body">' +
          '<p class="coll-card-title">' + title + '</p>' +
          '<p class="coll-card-meta">' + tech + '  ·  ' + d.size + '  ·  ' + d.year + '</p>' +
          '<p class="coll-card-price">€ ' + d.price + '</p>' +
        '</div>' +
        '<button class="fav-btn fav-active" data-title="' + title + '" onclick="event.stopPropagation();toggleFav(\'' + title + '\')">♥</button>';
      grid.appendChild(card);
    });
  }

  /* ══ ARTWORK DETAIL ══ */
  let _adCurrentTitle = '';
  let _adParentCol = null;
  let _adParentScrollTop = 0;
  let _adFromRundgang = false;

  function openArtwork(title, rerender, fromRundgang) {
    const d = ARTWORKS[title]; if (!d) return;
    _adCurrentTitle = title;
    if (!rerender) {
      const activeCol = document.querySelector('.coll-overlay.active:not(#fav-overlay)');
      _adParentCol = activeCol ? activeCol.id.replace('coll-', '') : null;
      _adParentScrollTop = activeCol ? activeCol.scrollTop : 0;
      _adFromRundgang = !!fromRundgang;
    }
    history.replaceState(null, '', '#artwork=' + encodeURIComponent(title));
    const isEN = _lang === 'en';
    const cat  = isEN ? d.cat_en : d.cat;
    const tech = isEN ? d.technique_en : d.technique;
    const story = isEN ? d.story_en : d.story;
    const t = I18N[_lang];
    document.getElementById('ad-topbar-title').textContent = cat + '  ·  ' + title;
    document.getElementById('ad-eyebrow').textContent = cat;
    document.getElementById('ad-title').textContent = title;
    document.getElementById('ad-meta-line').textContent = tech + '  ·  ' + d.size + '  ·  ' + d.year;
    document.getElementById('ad-price').textContent = d.price ? '€ ' + d.price : 'Preis auf Anfrage';
    document.getElementById('ad-story').textContent = story;
    if (document.getElementById('ad-story-head')) document.getElementById('ad-story-head').textContent = t['ad-story-head'];
    if (document.getElementById('ad-offer-btn')) document.getElementById('ad-offer-btn').textContent = t['ad-offer-btn'];
    if (document.getElementById('ad-rundgang-btn-text')) document.getElementById('ad-rundgang-btn-text').textContent = (_lang==='en' ? '▶  ' : '▶  ') + t['ad-rundgang-btn'];
    if (document.getElementById('ad-back-text')) document.getElementById('ad-back-text').textContent = _adFromRundgang ? (_lang==='en' ? 'Back to Tour' : 'Zurück zum Rundgang') : t['ad-back-text'];
    const subTxt = t['ad-sub-text'];
    const adImgEl = document.getElementById('ad-img-el');
    adImgEl.innerHTML = '';
    if (d.img) {
      const img = document.createElement('img');
      img.src = d.img; img.alt = title;
      adImgEl.appendChild(img);
    } else {
      const cv = _makeArtworkCanvas(title, 500, 620);
      cv.className = 'ad-placeholder-canvas';
      adImgEl.appendChild(cv);
    }
    document.getElementById('ad-details-grid').innerHTML =
      '<div class="ad-detail-item"><span class="ad-detail-label">' + t['ad-tech-label'] + '</span><span class="ad-detail-value">' + tech + '</span></div>' +
      '<div class="ad-detail-item"><span class="ad-detail-label">' + t['ad-size-label'] + '</span><span class="ad-detail-value">' + d.size + '</span></div>' +
      '<div class="ad-detail-item"><span class="ad-detail-label">' + t['ad-year-label'] + '</span><span class="ad-detail-value">' + d.year + '</span></div>' +
      '<div class="ad-detail-item"><span class="ad-detail-label">' + t['ad-cat-label'] + '</span><span class="ad-detail-value">' + cat + '</span></div>' +
      (d.signed ? '<div class="ad-detail-item"><span class="ad-detail-label">' + t['ad-sign-label'] + '</span><span class="ad-detail-value">' + (isEN ? d.signed_en : d.signed) + '</span></div>' : '');
    // fav heart
    const adBtn = document.getElementById('ad-fav-btn');
    if (adBtn) { adBtn.textContent = _favs.has(title) ? '♥' : '♡'; adBtn.classList.toggle('fav-active', _favs.has(title)); }
    // reset zoom
    _adScale = 1; _adTx = 0; _adTy = 0;
    _adApplyTransform();
    document.getElementById('artwork-detail').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeArtwork() {
    document.getElementById('artwork-detail').classList.remove('active');
    document.body.style.overflow = '';
    if (_adFromRundgang) {
      _adFromRundgang = false;
      history.replaceState(null, '', location.pathname);
      // gallery-vr bleibt sichtbar — kein weiterer Eingriff nötig
    } else if (_adParentCol) {
      history.replaceState(null, '', '#col=' + encodeURIComponent(_adParentCol));
      openCollection(_adParentCol, true);
      const colEl = document.getElementById('coll-' + _adParentCol);
      if (colEl) colEl.scrollTop = _adParentScrollTop;
    } else {
      history.replaceState(null, '', location.pathname);
    }
  }

  // Zoom + Pan
  let _adScale = 1, _adTx = 0, _adTy = 0;
  let _adDragging = false, _adDragX = 0, _adDragY = 0;

  function _adApplyTransform() {
    const el = document.getElementById('ad-img-el');
    const inner = document.getElementById('ad-img-inner');
    const hint = document.getElementById('ad-zoom-hint');
    if (!el) return;
    el.style.transform = 'translate(' + _adTx + 'px,' + _adTy + 'px) scale(' + _adScale + ')';
    inner.classList.toggle('zoomed', _adScale > 1);
    if (hint) hint.style.opacity = _adScale > 1.5 ? '0' : '1';
  }

  // Zoom + Pan — direkt anhängen (Script läuft nach DOM-Aufbau)
  const _adInner = document.getElementById('ad-img-inner');
  if (_adInner) {
    _adInner.addEventListener('wheel', e => {
      if (!document.getElementById('artwork-detail').classList.contains('active')) return; // only zoom when visible
      e.preventDefault();
      _adScale = Math.max(1, Math.min(5, _adScale + (e.deltaY < 0 ? 0.18 : -0.18)));
      if (_adScale === 1) { _adTx = 0; _adTy = 0; }
      _adApplyTransform();
    }, { passive: false });
    _adInner.addEventListener('dblclick', () => {
      _adScale = 1; _adTx = 0; _adTy = 0; _adApplyTransform();
    });
    _adInner.addEventListener('mousedown', e => {
      if (_adScale > 1) { _adDragging = true; _adDragX = e.clientX - _adTx; _adDragY = e.clientY - _adTy; _adInner.classList.add('dragging'); }
    });
  }
  window.addEventListener('mousemove', e => {
    if (!_adDragging) return;
    _adTx = e.clientX - _adDragX; _adTy = e.clientY - _adDragY; _adApplyTransform();
  });
  window.addEventListener('mouseup', () => {
    _adDragging = false;
    document.getElementById('ad-img-inner')?.classList.remove('dragging');
  });
  document.getElementById('ad-back-btn')?.addEventListener('click', closeArtwork);

  // Overlay-Zustand per URL-Hash wiederherstellen (z.B. nach Refresh)
  const _CAT_TO_COL = { 'Malerei':'acryl', 'Collage & Zeichnungen':'oel', 'Grafik':'aquarell', 'Plastik':'mixed' };
  (function() {
    const h = location.hash;
    if (h.startsWith('#artwork=')) {
      const title = decodeURIComponent(h.slice('#artwork='.length));
      if (ARTWORKS[title]) {
        openArtwork(title, true);
        _adParentCol = _CAT_TO_COL[ARTWORKS[title].cat] || null;
      }
    } else if (h.startsWith('#col=')) {
      const cat = decodeURIComponent(h.slice('#col='.length));
      if (document.getElementById('coll-' + cat)) {
        openCollection(cat);
        _showRundgangHint();
      }
    } else if (h === '#galerie') {
      _showRundgangHint();
    }
  })();
  document.getElementById('ad-offer-btn')?.addEventListener('click', () => {
    const d = ARTWORKS[_adCurrentTitle];
    if (d) openModal(_adCurrentTitle, d.price);
  });

  /* ══ MODAL ══ */
  let _frameChoice = '';

  function setFrameOpt(btn, value) {
    _frameChoice = value;
    document.querySelectorAll('.frame-opt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function openModal(title, range) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-range').textContent = '€ ' + range;
    document.getElementById('form-wrap').style.display = 'flex';
    document.getElementById('form-wrap').style.flexDirection = 'column';
    document.getElementById('form-wrap').style.gap = '1rem';
    document.getElementById('success-msg').classList.remove('show');
    // reset frame selection
    const d = ARTWORKS[title];
    document.querySelectorAll('.frame-opt-btn').forEach(b => b.classList.remove('active'));
    const hasFrame = d && d.hasFrame;
    document.getElementById('frame-opt-original').style.display = hasFrame ? 'flex' : 'none';
    if (hasFrame) {
      _frameChoice = 'Original Rahmen';
      document.getElementById('frame-opt-original').classList.add('active');
    } else {
      _frameChoice = '';
      document.getElementById('frame-opt-none').classList.add('active');
    }
    document.getElementById('modal').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(e) {
    if (!e || e.target === document.getElementById('modal')) {
      document.getElementById('modal').classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function openCollection(cat, noHash) {
    const el = document.getElementById('coll-' + cat);
    if (!el) return;
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
    el.scrollTop = 0;
    if (!noHash) history.replaceState(null, '', '#col=' + encodeURIComponent(cat));
  }
  function closeCollection(cat) {
    const el = document.getElementById('coll-' + cat);
    if (!el) return;
    el.classList.remove('active');
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname);
  }

  function wipNotify(cat) {
    const input = document.getElementById('wip-email-' + cat);
    if (!input || !input.value.trim() || !input.value.includes('@')) {
      input && input.focus();
      return;
    }
    input.parentElement.style.display = 'none';
    const thanks = document.getElementById('wip-thanks-' + cat);
    if (thanks) thanks.style.display = 'block';
  }

  function submitOffer() {
    const fname = document.getElementById('fname').value.trim();
    const email = document.getElementById('email').value.trim();
    const offer = document.getElementById('offer').value.trim();
    if (!fname || !email || !offer) {
      alert('Bitte füllen Sie Vorname, E-Mail und Ihr Angebot aus.');
      return;
    }
    document.getElementById('form-wrap').style.display = 'none';
    document.getElementById('success-msg').classList.add('show');
    setTimeout(() => {
      document.getElementById('modal').classList.remove('active');
      document.body.style.overflow = '';
    }, 3000);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal({ target: document.getElementById('modal') });
  });

  /* ══ SCROLL FADE-IN ══ */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07 });

  document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el));
  document.querySelectorAll('.gold-divider').forEach(el => observer.observe(el));


  /* ══ NAV – einblenden & aktiver Abschnitt ══ */
  const heroEl  = document.getElementById('hero');
  const navEl   = document.querySelector('nav');
  const navLinks = document.querySelectorAll('.nav-links a');
  const langSwitcher = document.getElementById('lang-switcher');

  // Nav + Sprachumschalter nach Hero einblenden
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        navEl.classList.add('visible');
        if (langSwitcher) langSwitcher.classList.add('visible');
      } else {
        navEl.classList.remove('visible');
        if (langSwitcher) langSwitcher.classList.remove('visible');
      }
    });
  }, { threshold: 0.05 });
  heroObserver.observe(heroEl);

  // Aktiven Abschnitt in Nav markieren
  const sections = ['galerie', 'ueber-uns', 'socials', 'kontakt'];
  const sectionEls = sections.map(id => document.getElementById(id));

  const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sectionEls.forEach(el => { if (el) activeObserver.observe(el); });


  // ══════════════════════════════════════════════════════════════
  //  VIRTUELLER GALERIE-RUNDGANG  — Three.js r128
  // ══════════════════════════════════════════════════════════════
  (function() {
    'use strict';


    const openBtn  = document.getElementById('nav-rundgang');
    const vrEl     = document.getElementById('gallery-vr');
    const closeBtn = document.getElementById('gallery-vr-close');
    if (!openBtn || !vrEl) return;

    function loadThree(cb) {
      if (window.THREE) { cb(); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js';
      s.onload = cb;
      document.head.appendChild(s);
    }
    openBtn.addEventListener('click', e => {
      e.preventDefault();
      vrEl.style.display='block';
      vrPaused = true;
      setTimeout(function(){
        var p = document.getElementById('vr-info-panel');
        if(p) p.classList.add('visible');
      }, 120);
      loadThree(initGallery);
    });
    // Skip-Button: zur nächsten Kameraposition springen
    document.getElementById('vr-skip').addEventListener('click', () => skipStep());

    // Info-Panel: ? Button, close button, backdrop click
    var infoPanel = document.getElementById('vr-info-panel');
    document.getElementById('vr-info-btn').addEventListener('click', function() {
      vrPaused = true;
      infoPanel.classList.add('visible');
    });
    infoPanel.addEventListener('click', function(e) {
      if (e.target === infoPanel) { window.closeVrInfo(); }
    });
    infoPanel.querySelector('.vr-info-close').addEventListener('click', function(){ window.closeVrInfo(); });
    document.addEventListener('keydown', function(e) {
      if (!vrEl || vrEl.style.display === 'none') return;
      if (freeNav) { navKeys.add(e.code); return; }
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); skipStep(); }
    });
    document.addEventListener('keyup', function(e) { navKeys.delete(e.code); });
    window.closeVrInfo = function() {
      var p = document.getElementById('vr-info-panel');
      if(p) p.classList.remove('visible');
      vrPaused = false;
    };
    function skipStep() {
      if (!seq) return;
      const s = seq[seqIdx];
      cam.position.copy(s.pos);
      cam.quaternion.copy(s.quat);
      fromPos.copy(s.pos); fromQuat.copy(s.quat);
      seqIdx++;
      if (seqIdx >= seq.length) { doLoop(performance.now()); return; }
      phase = 'trans'; t0 = performance.now();
    }

    closeBtn.addEventListener('click', () => {
      vrEl.style.display='none';
      teardown();
      const loader=document.getElementById('gallery-loader');
      if(loader){ loader.style.display='flex'; loader.classList.remove('fade-out'); }
    });

    let renderer, scene, cam, rafId, fadeDiv;
    let seq, seqIdx, phase, t0;
    let fromPos=null, fromQuat=null;
    let vrPaused = false;
    let freeNav = false;
    const navKeys = new Set();
    let navYaw=0, navPitch=0;
    let navDrag=false, navDragX=0, navDragY=0, navWasDragged=false;

    // ── Layout ────────────────────────────────────────────────────
    // Room 1 (Eingangssaal):  z:  0 → -14   width 10
    // Durchgang:              z: -14 → -18   width 3.6
    // Room 2 (Hauptgalerie):  z: -18 → -40  width 10
    const RW=10, RH=4.4, WALLX=4.82;   // room width/height, painting-wall x
    const PW=1.75, PH=2.15, PY=2.05;   // painting size & height
    const CAM_Y=1.70;
    const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;

    // Painting definitions: {x, y, z, rotY}
    // rotY: 0=faces+z, π=faces-z, -π/2=faces+x, π/2=faces-x
    const PICS = [
      // Room 1 – left wall (faces +x = rotY -π/2)
      {x:-WALLX, y:PY, z:-3,  rotY:-Math.PI/2},
      {x:-WALLX, y:PY, z:-7,  rotY:-Math.PI/2},
      {x:-WALLX, y:PY, z:-11, rotY:-Math.PI/2},
      // Room 1 – right wall (faces -x = rotY +π/2)
      {x: WALLX, y:PY, z:-3,  rotY: Math.PI/2},
      {x: WALLX, y:PY, z:-7,  rotY: Math.PI/2},
      {x: WALLX, y:PY, z:-11, rotY: Math.PI/2},
      // Room 1 – end wall, flanking archway (faces +z = rotY 0, but from Room1 side)
      {x:-3.2,   y:PY, z:-13.98, rotY:Math.PI},
      {x: 3.2,   y:PY, z:-13.98, rotY:Math.PI},
      // Room 2 – left wall
      {x:-WALLX, y:PY, z:-21, rotY:-Math.PI/2},
      {x:-WALLX, y:PY, z:-25, rotY:-Math.PI/2},
      {x:-WALLX, y:PY, z:-29, rotY:-Math.PI/2},
      {x:-WALLX, y:PY, z:-33, rotY:-Math.PI/2},
      // Room 2 – right wall
      {x: WALLX, y:PY, z:-21, rotY: Math.PI/2},
      {x: WALLX, y:PY, z:-25, rotY: Math.PI/2},
      {x: WALLX, y:PY, z:-29, rotY: Math.PI/2},
      {x: WALLX, y:PY, z:-33, rotY: Math.PI/2},
      // Room 2 – end wall (faces +z from room side = rotY Math.PI)
      {x:-2.2,   y:PY, z:-39.98, rotY:Math.PI},
      {x: 2.2,   y:PY, z:-39.98, rotY:Math.PI},
    ];

    // Artwork titles mapped to painting index (idx 0–15 = 16 artworks, 16–17 = leere Rückwand)
    // Artwork images embedded as base64 (works on file:// and https://)
    const IMG_0 = "Images/vr-0.jpg";
    const IMG_1 = "Images/vr-1.jpg";
    const IMG_2 = "Images/vr-2.jpg";
    const IMG_3 = "Images/vr-3.jpg";
    const IMG_4 = "Images/vr-4.jpg";
    const IMG_5 = "Images/vr-5.jpg";
    const IMG_6 = "Images/vr-6.jpg";
    const IMG_7 = "Images/vr-7.jpg";
    const IMG_8 = "Images/vr-8.jpg";
    const IMG_9 = "Images/vr-9.jpg";
    const IMG_10 = "Images/vr-10.jpg";
    const IMG_11 = "Images/vr-11.jpg";
    const IMG_12 = "Images/vr-12.jpg";
    const IMG_13 = "Images/vr-13.jpg";
    const IMG_14 = "Images/vr-14.jpg";
    const IMG_15 = "Images/vr-15.jpg";

    const PAINTING_TITLES = [
      'Zwei Figuren I','Badende','Zwei Badende','Figur und Torsi',
      'Langgezogene Figurengruppe','Totenkult','Bunte Figur','Goldene Figur',
      'Kopf im Profil','Hockende Figur','Zwei Figuren II','Kuss',
      'Badende in blau','Paar','Zwei Frauen','Meer',
    ];

    // ── Init ─────────────────────────────────────────────────────
    function initGallery() {
      const T = window.THREE;
      const cv = document.getElementById('gallery-canvas');
      renderer = new T.WebGLRenderer({canvas:cv, antialias:true});
      renderer.setSize(innerWidth, innerHeight);
      renderer.setPixelRatio(Math.min(devicePixelRatio,2));
      renderer.setClearColor(0x000000, 1);
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.LinearToneMapping;
      renderer.toneMappingExposure = 0.92;
      scene = new T.Scene();
      scene.background = new T.Color(0x000000);
      scene.fog = new T.Fog(0x000000, 32, 65);
      cam = new T.PerspectiveCamera(72, innerWidth/innerHeight, 0.05, 80);
      fromPos  = new T.Vector3();
      fromQuat = new T.Quaternion();
      buildRooms(T);
      buildWainscoting(T);
      buildMoldings(T, 14, -7);
      buildMoldings(T, 22, -29);
      buildPaintings(T);
      buildLights(T);
      buildPictureLights(T);
      buildFurniture(T);
      buildPlants(T);
      buildWallSigns(T);
      buildSeq(T);
      window.addEventListener('resize', onResize);

      // ── Freie-Navigation-Button ───────────────────────────────────
      const freeBtn = document.createElement('button');
      freeBtn.id = 'vr-free-btn';
      freeBtn.textContent = '↖ FREI ERKUNDEN';
      vrEl.appendChild(freeBtn);
      freeBtn.addEventListener('click', () => {
        freeNav = !freeNav;
        if (freeNav) {
          vrPaused = true;
          const euler = new T.Euler().setFromQuaternion(cam.quaternion, 'YXZ');
          navYaw = euler.y; navPitch = euler.x;
          freeBtn.textContent = '▶ TOUR FORTSETZEN';
          freeBtn.classList.add('active');
        } else {
          vrPaused = false;
          freeBtn.textContent = '↖ FREI ERKUNDEN';
          freeBtn.classList.remove('active');
          navKeys.clear();
        }
      });

      // ── Maus-Drag für freie Navigation ───────────────────────────
      cv.addEventListener('mousedown', e => {
        if (!freeNav) return;
        navDrag=true; navDragX=e.clientX; navDragY=e.clientY; navWasDragged=false;
      });
      cv.addEventListener('mousemove', e => {
        if (!freeNav || !navDrag) return;
        const dx=e.clientX-navDragX, dy=e.clientY-navDragY;
        navYaw   -= dx*0.0025; navPitch -= dy*0.0025;
        navPitch  = Math.max(-1.1, Math.min(0.9, navPitch));
        navDragX=e.clientX; navDragY=e.clientY;
        if (Math.abs(dx)+Math.abs(dy) > 3) navWasDragged=true;
      });
      document.addEventListener('mouseup', () => { navDrag=false; });

      // ── Touch-Drag für freie Navigation ──────────────────────────
      cv.addEventListener('touchstart', e => {
        if (!freeNav || e.touches.length!==1) return;
        navDrag=true; navDragX=e.touches[0].clientX; navDragY=e.touches[0].clientY; navWasDragged=false;
      }, {passive:true});
      cv.addEventListener('touchmove', e => {
        if (!freeNav || !navDrag || e.touches.length!==1) return;
        const dx=e.touches[0].clientX-navDragX, dy=e.touches[0].clientY-navDragY;
        navYaw -= dx*0.0025; navPitch -= dy*0.0025;
        navPitch = Math.max(-1.1, Math.min(0.9, navPitch));
        navDragX=e.touches[0].clientX; navDragY=e.touches[0].clientY;
        if (Math.abs(dx)+Math.abs(dy) > 3) navWasDragged=true;
      }, {passive:true});
      cv.addEventListener('touchend', () => { navDrag=false; });

      // ── Raycaster: Klick/Touch auf Gemälde öffnet Artwork-Detail ──
      const raycaster = new T.Raycaster();
      const mouse = new T.Vector2();
      const tooltip = document.getElementById('gallery-tooltip');

      function castAndOpen(clientX, clientY) {
        mouse.x =  (clientX / innerWidth)  * 2 - 1;
        mouse.y = -(clientY / innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, cam);
        const hits = raycaster.intersectObjects(_paintMeshes, false);
        for (const hit of hits) {
          const title = hit.object.userData.artworkTitle;
          if (title) { openArtwork(title, false, true); break; }
        }
      }

      cv.addEventListener('click', e => { if (navWasDragged) { navWasDragged=false; return; } castAndOpen(e.clientX, e.clientY); });

      cv.addEventListener('touchend', e => {
        if (e.changedTouches.length !== 1) return;
        e.preventDefault();
        const t = e.changedTouches[0];
        castAndOpen(t.clientX, t.clientY);
      }, {passive: false});

      cv.addEventListener('mousemove', e => {
        mouse.x =  (e.clientX / innerWidth)  * 2 - 1;
        mouse.y = -(e.clientY / innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, cam);
        const hits = raycaster.intersectObjects(_paintMeshes, false);
        const hitObj = hits[0];
        if (hitObj) {
          cv.style.cursor = 'pointer';
          const d = ARTWORKS[hitObj.object.userData.artworkTitle];
          tooltip.textContent = d ? hitObj.object.userData.artworkTitle + '  ·  ' + d.year : hitObj.object.userData.artworkTitle;
          tooltip.style.display = 'block';
          tooltip.style.left = (e.clientX + 18) + 'px';
          tooltip.style.top  = (e.clientY - 14) + 'px';
        } else {
          cv.style.cursor = 'default';
          tooltip.style.display = 'none';
        }
      });
      // Ladescreen ausblenden sobald erste Frames gerendert sind
      let loaderGone = false;
      function frame(ts){
        rafId=requestAnimationFrame(frame);
        tick(T,ts);
        renderer.render(scene,cam);
        if(!loaderGone){
          loaderGone=true;
          const loader=document.getElementById('gallery-loader');
          if(loader){ setTimeout(()=>{ loader.classList.add('fade-out'); setTimeout(()=>loader.style.display='none',1200); }, 2200); }
        }
      }
      requestAnimationFrame(frame);
    }

    // ── Rooms ─────────────────────────────────────────────────────
    function buildRooms(T) {
      const wW  = new T.MeshStandardMaterial({color:0xe8d5b0, roughness:0.95, side:T.FrontSide});
      const wF  = new T.MeshBasicMaterial({color:0xfafafa});
      const flTex = makeFloorTex(T);
      const wFl = new T.MeshStandardMaterial({map:flTex, roughness:0.72, metalness:0.03});
      const wAll= new T.MeshStandardMaterial({color:0xe8d5b0, roughness:0.95, side:T.DoubleSide});
      const wTrans = new T.MeshStandardMaterial({color:0x252525, roughness:0.88, side:T.DoubleSide});

      const aw=3.6, ah=3.2, lw=(RW-aw)/2, rw=lw;

      // ── Room 1 ──────────────────────────────────────────────────
      addPlane(T, RW, 14, wFl, [0,0,-7],        [-Math.PI/2,0,0]);
      addPlane(T, RW, 14, wF,  [0,RH,-7],       [ Math.PI/2,0,0]);
      addPlane(T, 14, RH, wW,  [-RW/2,RH/2,-7], [0, Math.PI/2,0]);
      addPlane(T, 14, RH, wW,  [ RW/2,RH/2,-7], [0,-Math.PI/2,0]);
      // Eingangswand mit Wandpaneelen als Canvas-Textur
      {
        const W=2048, H=896;
        const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
        const ctx=cv.getContext('2d');
        // Anthrazit-Hintergrund
        ctx.fillStyle='#252525';
        ctx.fillRect(0,0,W,H);
        // Paneellinien: creme-gold, halbtransparent
        ctx.strokeStyle='rgba(210,190,140,0.30)';
        ctx.lineWidth=5;
        const mX=W*0.040, mY=H*0.070; // Randabstand
        // Äußerer Rahmen
        ctx.strokeRect(mX, mY, W-2*mX, H-2*mY);
        // Zwei vertikale Teiler → 3 Paneele
        const p1x=mX+(W-2*mX)/3, p2x=mX+(W-2*mX)*2/3;
        ctx.beginPath(); ctx.moveTo(p1x, mY); ctx.lineTo(p1x, H-mY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p2x, mY); ctx.lineTo(p2x, H-mY); ctx.stroke();
        // Innere Panelrahmen (je Panel einen eingerückten Rahmen)
        ctx.strokeStyle='rgba(210,190,140,0.16)';
        ctx.lineWidth=3;
        const inset=W*0.018;
        [[mX, p1x],[p1x, p2x],[p2x, W-mX]].forEach(([x0,x1])=>{
          ctx.strokeRect(x0+inset, mY+inset*2.2, x1-x0-2*inset, H-2*mY-2*inset*2.2);
        });
        const tex=new T.CanvasTexture(cv);
        const entranceMat=new T.MeshStandardMaterial({map:tex, roughness:0.88, side:T.DoubleSide});
        addPlane(T, RW, RH, entranceMat, [0,RH/2, 0.05], [0, Math.PI,0]);
      }

      // Room 1 end wall + archway (anthracite transition)
      addBox(T, lw,     RH,    0.18, wTrans, [-(RW/2-lw/2), RH/2, -14]);
      addBox(T, rw,     RH,    0.18, wTrans, [ (RW/2-rw/2), RH/2, -14]);
      addBox(T, aw,  RH-ah,    0.18, wTrans, [0, ah+(RH-ah)/2, -14]);

      // ── Connector ───────────────────────────────────────────────
      const marbleTex = makeMarbleTex(T);
      const wMar = new T.MeshStandardMaterial({map:marbleTex, roughness:0.28, metalness:0.10});
      addPlane(T, 4, RH, wTrans, [-aw/2, RH/2,-16],[0, Math.PI/2,0]);
      addPlane(T, 4, RH, wTrans, [ aw/2, RH/2,-16],[0,-Math.PI/2,0]);
      addPlane(T, aw, RH, wF,  [0, RH,-16],      [ Math.PI/2,0,0]);
      addPlane(T, aw,  4, wMar, [0,  0,-16],      [-Math.PI/2,0,0]);

      // ── Room 2 ──────────────────────────────────────────────────
      const r2d=22, r2cz=-29;
      addPlane(T, RW, r2d, wFl, [0,0,r2cz],        [-Math.PI/2,0,0]);
      addPlane(T, RW, r2d, wF,  [0,RH,r2cz],       [ Math.PI/2,0,0]);
      addPlane(T, r2d, RH, wW,  [-RW/2,RH/2,r2cz], [0, Math.PI/2,0]);
      addPlane(T, r2d, RH, wW,  [ RW/2,RH/2,r2cz], [0,-Math.PI/2,0]);
      addPlane(T, RW,  RH, wTrans, [0,RH/2,-40],      [0,0,0]);

      // Room 2 entry wall (anthracite transition)
      addBox(T, lw,    RH,   0.18, wTrans, [-(RW/2-lw/2), RH/2, -18]);
      addBox(T, rw,    RH,   0.18, wTrans, [ (RW/2-rw/2), RH/2, -18]);
      addBox(T, aw, RH-ah,   0.18, wTrans, [0, ah+(RH-ah)/2, -18]);

      // ── Skylight grid + Track lighting (both rooms) ─────────────
      buildSkylightGrid(T, 14, -7);
      buildSkylightGrid(T, r2d, r2cz);
      buildTrackRails(T, 14, -7);
      buildTrackRails(T, r2d, r2cz);
    }

    // ── Skylight ceiling grid ─────────────────────────────────────
    function buildSkylightGrid(T, depth, cz) {
      // Bright frosted glass panels (always white)
      const glassMat = new T.MeshBasicMaterial({color:0xfff8ec});
      const gW=7.2, gD=depth*0.72;
      addPlane(T, gW, gD, glassMat, [0, RH-0.012, cz], [Math.PI/2,0,0]);

      // Dark metal structural frame grid
      const fMat = new T.MeshStandardMaterial({color:0x5c5c5c, roughness:0.55, metalness:0.75});
      const bw=0.055, bh=0.10;
      // Longitudinal beams (along z axis)
      const cols=6, colStep=gW/(cols);
      for(let i=0;i<=cols;i++){
        const x=-gW/2+i*colStep;
        addBox(T, bw, bh, gD, fMat, [x, RH, cz]);
      }
      // Cross beams (along x axis)
      const rows=Math.round(gD/1.25);
      for(let i=0;i<=rows;i++){
        const z=cz-gD/2+i*(gD/rows);
        addBox(T, gW, bh, bw, fMat, [0, RH, z]);
      }
      // Outer perimeter frame (thicker)
      const pf=0.09;
      addBox(T, pf, bh*1.4, gD+pf, fMat, [-gW/2, RH, cz]);
      addBox(T, pf, bh*1.4, gD+pf, fMat, [ gW/2, RH, cz]);
      addBox(T, gW+pf*2, bh*1.4, pf, fMat, [0, RH, cz-gD/2]);
      addBox(T, gW+pf*2, bh*1.4, pf, fMat, [0, RH, cz+gD/2]);
    }

    // ── Track lighting rails ──────────────────────────────────────
    function buildTrackRails(T, depth, cz) {
      const rMat = new T.MeshStandardMaterial({color:0x4a4a4a, roughness:0.45, metalness:0.85});
      const hMat = new T.MeshStandardMaterial({color:0x333333, roughness:0.40, metalness:0.90});
      const trackY = RH-0.07;

      // Two rails each side (parallel, 35cm apart)
      [[-2.2,-2.6],[2.2,2.6]].forEach(([xa,xb])=>{
        [xa,xb].forEach(rx=>{
          addBox(T, 0.038, 0.045, depth, rMat, [rx, trackY, cz]);
          // Spot heads every ~1.35m
          const startZ = cz-depth/2+0.7;
          const count  = Math.floor(depth/1.35);
          for(let i=0;i<count;i++){
            const sz=startZ+i*1.35;
            addBox(T, 0.075, 0.115, 0.075, hMat, [rx, trackY-0.09, sz]);
            addBox(T, 0.022, 0.065, 0.022, rMat, [rx, trackY-0.04, sz]);
          }
        });
      });
    }

    function buildMoldings(T, depth, cz) {
      const moldMat = new T.MeshStandardMaterial({color:0xdedad3, roughness:0.84});
      [[-RW/2+0.022],[RW/2-0.022]].forEach(([x])=>{
        // Kranzleiste oben: horizontale + vertikale Platte
        addBox(T, 0.10, 0.022, depth+0.01, moldMat, [x, RH-0.011, cz]);
        addBox(T, 0.022, 0.10, depth+0.01, moldMat, [x, RH-0.062, cz]);
        // Sockelleiste unten
        addBox(T, 0.055, 0.11, depth+0.01, moldMat, [x, 0.055, cz]);
        addBox(T, 0.022, 0.04, depth+0.01, moldMat, [x, 0.13,  cz]);
      });
    }

    // ── Wainscoting (Wandverkleidung) ─────────────────────────────
    function buildWainscoting(T) {
      const wH = 1.12;
      const panMat = new T.MeshStandardMaterial({color:0x272421, roughness:0.82, metalness:0.01});
      const railMat= new T.MeshStandardMaterial({color:0xb08828, roughness:0.38, metalness:0.72});
      const OFF = 0.013;

      [[14,-7],[22,-29]].forEach(([depth,cz])=>{
        [-RW/2+OFF, RW/2-OFF].forEach(x=>{
          const sign = x < 0 ? Math.PI/2 : -Math.PI/2;
          addPlane(T, depth, wH, panMat, [x, wH/2, cz], [0, sign, 0]);
          addBox(T, 0.024, 0.036, depth+0.01, railMat, [x, wH+0.018, cz]);
        });
      });

      // Connector Wände
      const aw2=3.6;
      [-aw2/2+OFF, aw2/2-OFF].forEach(x=>{
        const sign = x < 0 ? Math.PI/2 : -Math.PI/2;
        addPlane(T, 4, 1.12, panMat, [x, 0.56, -16], [0, sign, 0]);
        addBox(T, 0.024, 0.036, 4.01, railMat, [x, 1.138, -16]);
      });
    }

    function addPlane(T, w, h, mat, pos, rot) {
      const m = new T.Mesh(new T.PlaneGeometry(w,h), mat);
      m.position.set(...pos); m.rotation.set(...rot);
      scene.add(m); return m;
    }
    function addBox(T, w, h, d, mat, pos) {
      const m = new T.Mesh(new T.BoxGeometry(w,h,d), mat);
      m.position.set(...pos);
      scene.add(m); return m;
    }

    function makeWallTex(T) {
      const S=1024;
      const cv=document.createElement('canvas'); cv.width=S; cv.height=S;
      const ctx=cv.getContext('2d');

      // Basis: warmes Off-White
      ctx.fillStyle='#efefec';
      ctx.fillRect(0,0,S,S);

      // ── Große Putzflecken (deutlich sichtbar) ─────────────────
      const patches=[
        [120,140,260,0.13],[400,80,300,0.10],[700,220,240,0.12],
        [180,500,280,0.11],[550,450,320,0.09],[850,120,200,0.11],
        [80,820,240,0.10],[450,780,300,0.12],[780,700,260,0.09],
        [300,300,200,0.08],[650,600,220,0.10],[920,500,180,0.08],
      ];
      patches.forEach(([cx,cy,r,a])=>{
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0,`rgba(130,125,118,${a})`);
        g.addColorStop(0.5,`rgba(130,125,118,${a*0.4})`);
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.fillRect(0,0,S,S);
      });

      // ── Helle Reflexzonen (Lichtreflexion auf Putz) ───────────
      [[200,200,180,0.08],[600,350,200,0.07],[400,700,160,0.06]].forEach(([cx,cy,r,a])=>{
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0,`rgba(255,255,252,${a})`);
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.fillRect(0,0,S,S);
      });

      // ── Sichtbares Putz-Korn (mittlere Körnung) ───────────────
      for(let i=0;i<6000;i++){
        const x=((i*7919+i*i*3)%S), y=((i*6271+i*7)%S);
        const r=0.8+((i*1234)%8)*0.15;
        const dark=((i*2341)%3)===0;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fillStyle=dark ? `rgba(80,78,74,0.14)` : `rgba(255,253,250,0.16)`;
        ctx.fill();
      }

      // ── Farbroller-Spuren (horizontale Pinselstruktur) ────────
      for(let i=0;i<120;i++){
        const y=((i*97+i*i)%S);
        const x0=((i*233)%S);
        const len=60+((i*127)%200);
        ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x0+len,y);
        const a=0.06+((i*17)%12)*0.007;
        ctx.strokeStyle=`rgba(100,97,92,${a})`;
        ctx.lineWidth=0.6+((i*31)%4)*0.3; ctx.stroke();
      }

      // ── Leichte Wolkenstruktur (Wandschatten) ─────────────────
      [[0,0,500,0.06],[1024,0,500,0.05],[512,1024,400,0.05]].forEach(([cx,cy,r,a])=>{
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0,`rgba(100,96,90,${a})`);
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.fillRect(0,0,S,S);
      });

      const tex=new T.CanvasTexture(cv);
      tex.wrapS=tex.wrapT=T.RepeatWrapping;
      tex.repeat.set(2,1.5);
      return tex;
    }

    function makeFloorTex(T) {
      const S=1024;
      const cv=document.createElement('canvas'); cv.width=S; cv.height=S;
      const ctx=cv.getContext('2d');
      function pr(s){ return ((s*9301+49297)%233280)/233280; }

      const tw=256, th=256;
      const grout=72; // helleres Grau für Fugen

      // Fugen-Hintergrund
      ctx.fillStyle=`rgb(${grout},${grout},${grout})`;
      ctx.fillRect(0,0,S,S);

      // Anthrazit-Platten mit leichter Tonvariation (wie Wandfarbe 0x252525)
      for(let tx=0;tx<4;tx++){
        for(let ty=0;ty<4;ty++){
          const v=34+Math.floor(pr(tx*7+ty*13+1)*14); // 34–48, nahe #252525
          ctx.fillStyle=`rgb(${v},${v},${v})`;
          ctx.fillRect(tx*tw+4, ty*th+4, tw-8, th-8);
        }
      }

      // Minimaler Glanzreflex-Schimmer auf jeder Platte (heller Streifen oben-links)
      for(let tx=0;tx<4;tx++){
        for(let ty=0;ty<4;ty++){
          const grd=ctx.createLinearGradient(tx*tw+4,ty*th+4, tx*tw+tw/2,ty*th+th/2);
          grd.addColorStop(0,'rgba(255,255,255,0.04)');
          grd.addColorStop(1,'rgba(255,255,255,0)');
          ctx.fillStyle=grd;
          ctx.fillRect(tx*tw+4, ty*th+4, tw-8, th-8);
        }
      }

      const tex=new T.CanvasTexture(cv);
      tex.wrapS=tex.wrapT=T.RepeatWrapping;
      tex.repeat.set(3,5);
      return tex;
    }

    function makeMarbleTex(T) {
      const cv=document.createElement('canvas'); cv.width=1024; cv.height=1024;
      const ctx=cv.getContext('2d');

      // ── Basis: tiefes Anthrazit-Schwarz ──────────────────────
      ctx.fillStyle='#0e0e0e';
      ctx.fillRect(0,0,1024,1024);

      // Dunkelgraue Wolken-/Steinstruktur (wie im Referenzbild)
      const cloudSeeds=[
        [180,160,320,0.22],[450,80,400,0.18],[750,300,360,0.20],
        [120,520,280,0.16],[600,680,440,0.19],[300,820,300,0.15],
        [820,150,250,0.17],[50,700,350,0.14]
      ];
      cloudSeeds.forEach(([cx,cy,r,a])=>{
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0,`rgba(52,48,44,${a})`);
        g.addColorStop(0.5,`rgba(32,30,28,${a*0.5})`);
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.fillRect(0,0,1024,1024);
      });

      // Noch dunklere Einschlüsse für Tiefe
      [[260,400,120,0.35],[600,250,90,0.28],[780,720,110,0.30],[100,900,80,0.25]].forEach(([cx,cy,r,a])=>{
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0,`rgba(5,5,5,${a})`);
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.fillRect(0,0,1024,1024);
      });

      // ── Pseudo-random deterministic ───────────────────────────
      function pr(s){ return ((s*9301+49297)%233280)/233280; }

      // Ader mit mehreren Passes: weiter Glow + mittlerer Halo + scharfe Kern
      function vein(x0,y0,x1,y1,w,alpha,c1,c2,seed){
        const pts=[], steps=70;
        for(let i=0;i<=steps;i++){
          const t=i/steps, s=seed+i*3;
          const disp=(pr(s)-0.5)*48*(Math.sin(Math.PI*t)*2.0+0.3);
          const disp2=(pr(s+200)-0.5)*16;
          pts.push([x0+(x1-x0)*t+disp, y0+(y1-y0)*t+disp2]);
        }
        function drawPath(){
          ctx.beginPath();
          ctx.moveTo(pts[0][0],pts[0][1]);
          for(let i=1;i<pts.length-2;i++){
            ctx.quadraticCurveTo(pts[i][0],pts[i][1],
              (pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2);
          }
        }
        // Äußerer Glow (sehr breit, orange-warm)
        drawPath();
        ctx.strokeStyle=`rgba(${c2},${alpha*0.12})`; ctx.lineWidth=w*14; ctx.stroke();
        // Mittlerer Halo
        drawPath();
        ctx.strokeStyle=`rgba(${c2},${alpha*0.30})`; ctx.lineWidth=w*6; ctx.stroke();
        // Innerer Halo
        drawPath();
        ctx.strokeStyle=`rgba(${c1},${alpha*0.60})`; ctx.lineWidth=w*2.5; ctx.stroke();
        // Kern — helles Gold
        drawPath();
        ctx.strokeStyle=`rgba(${c1},${alpha})`; ctx.lineWidth=w; ctx.stroke();
        // Zentraler Highlight
        drawPath();
        ctx.strokeStyle=`rgba(255,230,120,${alpha*0.45})`; ctx.lineWidth=w*0.4; ctx.stroke();
      }

      // Farben wie im Referenzbild: orange-gold Kern, warmer Glow
      const gCore  = '245,185,55';   // helles gelb-gold
      const gGlow  = '200,110,10';   // tiefes orange (Glow-Halo)
      const gDeep  = '220,155,35';   // mittleres Gold

      // ── Haupt-Adern (dick, wie im Bild) ──────────────────────
      vein(  0, 180, 1024,  520, 9.0, 0.95, gCore, gGlow,  11);
      vein( 60,   0,  480, 1024, 7.5, 0.90, gCore, gGlow,  23);
      vein(350,   0,  900,  800, 6.0, 0.88, gDeep, gGlow,  37);
      vein(  0, 680,  650, 1024, 5.5, 0.85, gCore, gGlow,  47);
      vein(700,  40, 1024,  700, 5.0, 0.82, gDeep, gGlow,  59);

      // ── Mittlere Adern ────────────────────────────────────────
      vein(150,   0,  620,  700, 4.0, 0.80, gCore, gGlow,  71);
      vein(  0, 420,  480,  750, 3.5, 0.78, gDeep, gGlow,  83);
      vein(550, 300, 1024,  900, 3.8, 0.76, gCore, gGlow,  97);
      vein(250, 800,  800, 1024, 3.2, 0.74, gDeep, gGlow, 107);
      vein(820, 200, 1024,  580, 3.0, 0.72, gCore, gGlow, 117);

      // ── Feine Verzweigungen ───────────────────────────────────
      vein( 80, 300,  350,  580, 2.0, 0.68, gDeep, gGlow, 131);
      vein(400, 150,  700,  420, 1.8, 0.65, gCore, gGlow, 143);
      vein(600, 550,  950,  850, 2.2, 0.70, gDeep, gGlow, 157);
      vein(100, 750,  450,  950, 1.6, 0.62, gCore, gGlow, 169);
      vein(300, 450,  600,  650, 1.4, 0.58, gDeep, gGlow, 181);

      // ── Haarfeine Linien ──────────────────────────────────────
      for(let i=0;i<12;i++){
        const sx=pr(i*19)*1024, ex=pr(i*19+7)*1024;
        const sy=pr(i*13)*200, ey=pr(i*13+3)*1024;
        vein(sx,sy,ex,ey, 0.8, 0.50, gCore, gGlow, i*43+200);
      }

      // ── Fliesennetz ───────────────────────────────────────────
      const tile=256;
      ctx.strokeStyle='rgba(200,155,35,0.75)';
      ctx.lineWidth=2.5;
      for(let x=0;x<=1024;x+=tile){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();}
      for(let y=0;y<=1024;y+=tile){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}
      // Innere Fliesenrahmung
      ctx.strokeStyle='rgba(210,165,45,0.25)';
      ctx.lineWidth=1.0;
      for(let tx=0;tx<4;tx++) for(let ty=0;ty<4;ty++){
        ctx.strokeRect(tx*tile+8, ty*tile+8, tile-16, tile-16);
      }

      const tex=new T.CanvasTexture(cv);
      tex.wrapS=tex.wrapT=T.RepeatWrapping;
      tex.repeat.set(3,5);
      return tex;
    }

    // ── Paintings ────────────────────────────────────────────────
    const _paintMeshes = []; // nur Gemälde-Planes – für schnellen Raycaster

    function buildPaintings(T) {
      PICS.forEach((p,i) => addPainting(T, i, p.x, p.y, p.z, p.rotY));
    }

    function addPainting(T, idx, x, y, z, rotY) {
      const g = new T.Group();
      const tex = makeTex(T,idx);
      const mat = new T.MeshStandardMaterial({map:tex, roughness:0.88, metalness:0.0, side:T.DoubleSide});
      const paint = new T.Mesh(new T.PlaneGeometry(PW,PH), mat);
      paint.position.z=0.025;
      if (PAINTING_TITLES[idx]) paint.userData.artworkTitle = PAINTING_TITLES[idx];
      _paintMeshes.push(paint);
      g.add(paint);

      const artImg = [IMG_0,IMG_1,IMG_2,IMG_3,IMG_4,IMG_5,IMG_6,IMG_7,
        IMG_8,IMG_9,IMG_10,IMG_11,IMG_12,IMG_13,IMG_14,IMG_15][idx];
      if (artImg) {
        new T.TextureLoader().load(artImg, t => {
          t.encoding = T.sRGBEncoding;
          t.wrapS = T.RepeatWrapping;
          t.repeat.x = -1; t.offset.x = 1;
          t.needsUpdate = true;
          mat.map = t;
          mat.needsUpdate = true;
        });
      }

      // Thin minimal dark frame (like reference photo)
      const fm=new T.MeshStandardMaterial({color:0x1c1c1c, roughness:0.90, metalness:0.02});
      const fw=PW+0.05, fh=PH+0.05, fd=0.022, fb=0.028;
      [[fw,fb,fd, 0, fh/2,0],[fw,fb,fd, 0,-fh/2,0],
       [fb,fh,fd,-fw/2,0,0],[fb,fh,fd, fw/2,0,0]
      ].forEach(([w,h,d,px,py,pz])=>{
        const b=new T.Mesh(new T.BoxGeometry(w,h,d),fm);
        b.position.set(px,py,pz); g.add(b);
      });

      // Small label card below painting
      const lm=new T.MeshStandardMaterial({color:0xfafafa, roughness:0.95});
      const lb=new T.Mesh(new T.BoxGeometry(0.32,0.055,0.003),lm);
      lb.position.set(0,-(fh/2+0.07),0.01); g.add(lb);

      g.position.set(x,y,z); g.rotation.y=rotY;
      scene.add(g);
    }

    const ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII'];
    // Farben nach Technik: idx 0-3 Acryl, 4-7 Öl, 8-11 Aquarell, 12-15 Mixed, 16-17 Fallback
    const PAL=[['#5a3520','#8c5a34'],['#1a3a6a','#2e5e96'],['#1a5535','#2a7a50'],
               ['#5a1a1a','#8c2e2e'],['#3a2060','#5a3a8c'],['#3a3a10','#5a5a22']];
    const TECH_PAL=[
      ['#2a4020','#456830'],['#1e3828','#2e5840'],['#384a20','#5a7030'],['#203830','#305848'], // Acryl
      ['#4a2a08','#7a4a18'],['#3a1e0a','#6a3418'],['#4a3808','#786818'],['#3a2808','#604818'], // Öl
      ['#082048','#183878'],['#082038','#103560'],['#082838','#105860'],['#081838','#102858'], // Aquarell
      ['#28084a','#481578'],['#380848','#601570'],['#281040','#402060'],['#1e0838','#301058'], // Mixed
    ];

    function makeTex(T,idx){
      const cv=document.createElement('canvas'); cv.width=1024; cv.height=1280;
      const ctx=cv.getContext('2d');
      const [c1,c2]=TECH_PAL[idx]||PAL[idx%PAL.length];
      const gr=ctx.createLinearGradient(0,0,1024,1280);
      gr.addColorStop(0,c1); gr.addColorStop(1,c2);
      ctx.fillStyle=gr; ctx.fillRect(0,0,1024,1280);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=3;
      ctx.strokeRect(52,52,920,1176); ctx.strokeRect(60,60,904,1160);
      ctx.fillStyle='rgba(255,255,255,0.85)';
      ctx.font='300 160px "Georgia","Times New Roman",serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(ROMAN[idx]||String(idx+1),512,528);
      ctx.font='300 26px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.70)';
      ctx.fillText('HORST  SCHWAB',512,738);
      ctx.fillText('KUNSTWERK  ·  PLATZHALTER',512,786);
      ctx.strokeStyle='rgba(255,255,255,0.40)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(268,838); ctx.lineTo(756,838); ctx.stroke();
      const tex=new T.CanvasTexture(cv);
      tex.encoding=T.sRGBEncoding;
      tex.wrapS=T.RepeatWrapping;
      tex.repeat.x=-1; tex.offset.x=1; // all paintings render from back-face → pre-flip to correct mirroring
      return tex;
    }

    // ── Furniture ────────────────────────────────────────────────
    function buildFurniture(T) {
      // Cream/sand upholstered solid bench blocks (museum style)
      const topMat = new T.MeshStandardMaterial({color:0xd6cfbb, roughness:0.88, metalness:0.0});
      const sideMat= new T.MeshStandardMaterial({color:0xc8c0ab, roughness:0.90, metalness:0.0});
      const legMat = new T.MeshStandardMaterial({color:0xaaaaaa, roughness:0.42, metalness:0.65});

      [[-7],[-29]].forEach(([bz])=>{
        [[-0.95],[0.95]].forEach(([bx])=>{
          // Cushion body
          const body=new T.Mesh(new T.BoxGeometry(1.50, 0.36, 0.58), topMat);
          body.position.set(bx, 0.27, bz); scene.add(body);
          // Side face (slightly darker)
          const side=new T.Mesh(new T.BoxGeometry(1.50, 0.36, 0.58), sideMat);
          side.position.set(bx, 0.27, bz); scene.add(side);
          // Four slim metal legs
          [[-0.62,0.22],[0.62,0.22],[-0.62,-0.22],[0.62,-0.22]].forEach(([lx,lz])=>{
            const leg=new T.Mesh(new T.BoxGeometry(0.045,0.34,0.045),legMat);
            leg.position.set(bx+lx, 0.17, bz+lz); scene.add(leg);
          });
        });
      });

      // Two gallery chairs — one in each back corner
      buildChair(T, -3.8, -12.8, -0.55);   // Room 1, back-left corner
      buildChair(T,  3.8, -38.5,  Math.PI+0.55); // Room 2, back-right corner
    }

    function buildChair(T, cx, cz, rotY) {
      // LC2-inspirierter Sessel: sichtbarer Chromrahmen + helle Polster
      const chromeMat = new T.MeshStandardMaterial({color:0xd8d8d8, roughness:0.12, metalness:0.96});
      const cushMat   = new T.MeshStandardMaterial({color:0x8b4513, roughness:0.65, metalness:0.04});
      const g = new T.Group();

      const sW=0.74, sD=0.68, sH=0.40, fw=0.038;

      // ── Polster ───────────────────────────────────────────────
      // Sitz
      const seat = new T.Mesh(new T.BoxGeometry(sW-0.10, 0.16, sD-0.10), cushMat);
      seat.position.set(0, sH+0.08, 0); g.add(seat);
      // Rückenlehne
      const back = new T.Mesh(new T.BoxGeometry(sW-0.10, 0.62, 0.16), cushMat);
      back.position.set(0, sH+0.43, -sD/2+0.10); g.add(back);
      // Armlehnen
      [-sW/2+0.07, sW/2-0.07].forEach(ax => {
        const arm = new T.Mesh(new T.BoxGeometry(0.12, 0.10, sD-0.10), cushMat);
        arm.position.set(ax, sH+0.21, 0); g.add(arm);
      });

      // ── Außenrahmen (Chrom) ───────────────────────────────────
      const fd=sD+0.06, fh=sH+0.82;
      // Zwei seitliche U-Rahmen (jeder aus 3 Stäben)
      [-sW/2-0.01, sW/2+0.01].forEach(fx => {
        // Boden-Kufe
        const run = new T.Mesh(new T.BoxGeometry(fw, fw, fd), chromeMat);
        run.position.set(fx, fw/2, 0); g.add(run);
        // Vorderes Bein
        const fleg = new T.Mesh(new T.BoxGeometry(fw, sH+fw, fw), chromeMat);
        fleg.position.set(fx, (sH+fw)/2, fd/2-fw/2); g.add(fleg);
        // Hinteres Bein (bis Oberkante Rückenlehne)
        const bleg = new T.Mesh(new T.BoxGeometry(fw, fh, fw), chromeMat);
        bleg.position.set(fx, fh/2, -fd/2+fw/2); g.add(bleg);
      });
      // Querstreben: vorne unten, hinten unten, hinten oben
      [
        [sW+0.06, fw, fw,  0, fw/2,       fd/2-fw/2],
        [sW+0.06, fw, fw,  0, fw/2,      -fd/2+fw/2],
        [sW+0.06, fw, fw,  0, fh-fw/2,   -fd/2+fw/2],
        [sW+0.06, fw, fw,  0, sH+fw/2,    fd/2-fw/2],
      ].forEach(([w,h,d,x,y,z])=>{
        const bar = new T.Mesh(new T.BoxGeometry(w,h,d), chromeMat);
        bar.position.set(x,y,z); g.add(bar);
      });

      g.position.set(cx, 0, cz);
      g.rotation.y = rotY;
      scene.add(g);
    }

    // ── Plants ───────────────────────────────────────────────────
    function buildPlants(T) {
      buildPlant(T,  4.0, -1.5);
      buildPlant(T,  4.0, -13.2);
      buildPlant(T, -4.0, -19.5);
    }

    function makeLeafTex(T) {
      const W = 256, H = 512;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      // Ovale Blattform ausschneiden
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(W/2, H*0.48, W*0.42, H*0.46, 0, 0, Math.PI*2);
      ctx.clip();

      // Grundfarbe: sattes Strelitzia-Grün
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0,   '#3d7a2e');
      grad.addColorStop(0.4, '#4a8f36');
      grad.addColorStop(1,   '#2e6022');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Mittelrippe (hellgrün)
      ctx.strokeStyle = '#5aaa40';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(W/2, H*0.04);
      ctx.lineTo(W/2, H*0.94);
      ctx.stroke();

      // Seitenrippen
      ctx.strokeStyle = 'rgba(80,160,55,0.35)';
      ctx.lineWidth = 3;
      for (let i = 1; i <= 6; i++) {
        const y = H * (0.18 + i * 0.12);
        const spread = W * 0.34 * (1 - Math.abs(i-3.5)/5);
        ctx.beginPath();
        ctx.moveTo(W/2, y);
        ctx.lineTo(W/2 - spread, y + H*0.06);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(W/2, y);
        ctx.lineTo(W/2 + spread, y + H*0.06);
        ctx.stroke();
      }
      ctx.restore();

      const tex = new T.CanvasTexture(cv);
      return tex;
    }

    function buildPlant(T, cx, cz) {
      const potMat  = new T.MeshStandardMaterial({color:0x868686, roughness:0.87, metalness:0.02});
      const soilMat = new T.MeshStandardMaterial({color:0x1e1208, roughness:0.97});
      const stemMat = new T.MeshStandardMaterial({color:0x2e5a1e, roughness:0.92});
      const leafTex = makeLeafTex(T);
      const leafMat = new T.MeshStandardMaterial({
        map: leafTex, transparent: true, alphaTest: 0.4,
        roughness: 0.72, side: T.DoubleSide
      });

      // Betonkübel
      const pot = new T.Mesh(new T.CylinderGeometry(0.25, 0.23, 0.52, 32), potMat);
      pot.position.set(cx, 0.26, cz); scene.add(pot);
      const soil = new T.Mesh(new T.CylinderGeometry(0.238, 0.238, 0.03, 32), soilMat);
      soil.position.set(cx, 0.54, cz); scene.add(soil);

      // Strelitzia-Fächer: Stiele in einem Bogen, Blätter als ovale Canvas-Texturen
      // [rotY, tilt, Stiellänge, BlattBreite, BlattHöhe]
      [
        [-0.60, 0.10, 0.55, 0.38, 0.70],
        [-0.38, 0.07, 0.70, 0.42, 0.80],
        [-0.18, 0.04, 0.85, 0.44, 0.88],
        [ 0.00, 0.03, 0.95, 0.46, 0.92],
        [ 0.18, 0.04, 0.82, 0.44, 0.86],
        [ 0.38, 0.07, 0.68, 0.40, 0.78],
        [ 0.60, 0.10, 0.52, 0.36, 0.68],
        [-0.48, 0.08, 0.46, 0.34, 0.64],
        [ 0.48, 0.09, 0.44, 0.33, 0.62],
        [-0.25, 0.05, 0.60, 0.38, 0.72],
        [ 0.25, 0.06, 0.58, 0.37, 0.70],
      ].forEach(([ry, tilt, sLen, lW, lH]) => {
        const g = new T.Group();
        g.position.set(cx, 0.55, cz);
        g.rotation.y = ry;

        const sg = new T.Group();
        sg.rotation.z = -tilt;

        // Stiel — dicker Blattstiel wie Strelitzia
        const stem = new T.Mesh(new T.CylinderGeometry(0.012, 0.018, sLen, 6), stemMat);
        stem.position.y = sLen / 2;
        sg.add(stem);

        // Blatt oben mit ovaler Textur, leicht nach außen geneigt
        const leaf = new T.Mesh(new T.PlaneGeometry(lW, lH), leafMat);
        leaf.position.set(0, sLen + lH * 0.40, 0);
        leaf.rotation.x = 0.25;
        sg.add(leaf);

        g.add(sg);
        scene.add(g);
      });
    }

    // ── Lights ───────────────────────────────────────────────────
    function buildLights(T) {
      // Diffuses Deckenlicht — niedrig genug damit Wandfarbe + Schatten sichtbar werden
      scene.add(new T.AmbientLight(0xffffff, 0.95));

      // Overhead fill lights
      [[0,RH-0.2,-3],[0,RH-0.2,-7],[0,RH-0.2,-11],
       [0,RH-0.2,-20],[0,RH-0.2,-26],[0,RH-0.2,-32],[0,RH-0.2,-38]
      ].forEach(([x,y,z])=>{
        const pl=new T.PointLight(0xffffff, 0.60, 18, 1.1);
        pl.position.set(x,y,z); scene.add(pl);
      });

      // Track spotlights per painting
      PICS.forEach(p=>{
        const lx=p.x+Math.sin(p.rotY)*(-1.25);
        const lz=p.z+Math.cos(p.rotY)*(-1.25);
        const sl=new T.SpotLight(0xfff8f0, 1.4, 5.0, Math.PI/5.5, 0.55, 1.2);
        sl.position.set(lx, RH-0.10, lz);
        sl.target.position.set(p.x, p.y, p.z);
        scene.add(sl); scene.add(sl.target);
      });
    }

    // ── Picture Lights (decorative brass lamps above each frame) ─
    function buildPictureLights(T) {
      const bMat = new T.MeshStandardMaterial({color:0xb89520, roughness:0.35, metalness:0.82});
      const armLen = 0.22;
      const lampY = PY + PH/2 + 0.12;  // just above top of frame

      PICS.forEach(p => {
        const nx = -Math.sin(p.rotY);
        const nz = -Math.cos(p.rotY);

        // Small back plate flush against wall
        const plate = new T.Mesh(new T.BoxGeometry(0.08, 0.06, 0.012), bMat);
        plate.position.set(p.x - nx*0.02, lampY, p.z - nz*0.02);
        scene.add(plate);

        // Horizontal arm projecting outward from wall
        const arm = new T.Mesh(new T.BoxGeometry(armLen, 0.020, 0.020), bMat);
        arm.position.set(p.x + nx*(armLen/2 - 0.02), lampY, p.z + nz*(armLen/2 - 0.02));
        arm.rotation.y = -p.rotY - Math.PI/2;
        scene.add(arm);

        // Lamp head at tip of arm
        const head = new T.Mesh(new T.BoxGeometry(0.09, 0.028, 0.055), bMat);
        head.position.set(p.x + nx*(armLen - 0.025), lampY - 0.013, p.z + nz*(armLen - 0.025));
        scene.add(head);
      });
    }

    // ── Wall Signage ─────────────────────────────────────────────
    function makeWallSignTex(T, large) {
      const W=1024, H= large ? 640 : 480;
      const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
      const ctx=cv.getContext('2d');

      // Solider Anthrazit-Hintergrund — garantiert sichtbar, unabhängig von Font-Load
      ctx.fillStyle='#252525';
      ctx.fillRect(0,0,W,H);

      const ink='rgba(242,236,222,0.94)';
      ctx.fillStyle=ink;
      ctx.textAlign='center';
      ctx.textBaseline='alphabetic';

      const scriptSize = large ? 188 : 142;
      const capSize    = large ?  52 :  40;
      const midY       = large ? 310 : 238;
      const lineY      = large ? 346 : 268;
      const capY       = large ? 430 : 336;

      // Kalligrafisches Script
      ctx.font=`${scriptSize}px "Great Vibes", "Snell Roundhand", cursive`;
      ctx.fillText('Horst Schwab', W/2, midY);

      // Dünne Trennlinie
      ctx.strokeStyle=ink;
      ctx.lineWidth=1.0;
      ctx.beginPath(); ctx.moveTo(W/2-155,lineY); ctx.lineTo(W/2+155,lineY); ctx.stroke();

      // Gesperrte Versalien
      ctx.font=`300 ${capSize}px "Cormorant Garamond", serif`;
      ctx.fillText('G  A  L  L  E  R  I  E', W/2, capY);

      return new T.CanvasTexture(cv);
    }

    function buildWallSigns(T) {
      function sign(w,h,x,y,z,ry,large){
        const tex = makeWallSignTex(T, large);
        const mat = new T.MeshBasicMaterial({map:tex, side:T.DoubleSide});
        const m   = new T.Mesh(new T.PlaneGeometry(w,h), mat);
        m.position.set(x,y,z); m.rotation.y=ry; scene.add(m);
        // Font-Update sobald Great Vibes geladen
        document.fonts.load(`${large?188:142}px "Great Vibes"`).then(()=>{
          m.material.map = makeWallSignTex(T, large);
          m.material.needsUpdate = true;
        }).catch(()=>{});
      }

      // Rückwand Raum 2 z=-40 — groß, mittig, aus Raum 2 sichtbar
      sign(3.20, 2.00,  0,   2.10, -39.90, 0,        true);
      // Bogen z=-14 rechter Pfeiler — aus Raum 1 sichtbar
      sign(1.30, 0.82,  3.4, 2.50, -13.90, 0,        false);
      // Bogen z=-18 rechter Pfeiler — aus Raum 2 sichtbar
      sign(1.30, 0.82,  3.4, 2.50, -18.10, Math.PI,  false);
    }

    // ── Camera Sequence ──────────────────────────────────────────
    function buildSeq(T) {
      seq=[];
      function add(px,py,pz,lx,ly,lz,trans,hold){
        const pos=new T.Vector3(px,py,pz);
        const d=new T.Object3D(); d.position.copy(pos);
        d.lookAt(new T.Vector3(lx,ly,lz));
        seq.push({pos,quat:d.quaternion.clone(),trans,hold});
      }

      // LY_W = look-at y for walking shots (slightly above eye = ceiling visible)
      const LY_W = CAM_Y + 1.10;  // look upward — ceiling + skylight visible

      // ── Room 1 entrance ─────────────────────────────────────────
      add(0,CAM_Y, 1.2,  0, LY_W, -4,  0, 800);

      // Pair z=-3
      add(0,CAM_Y,-3,  -WALLX+0.05, PY, -3,  950,3800);
      add(0,CAM_Y,-3,   WALLX-0.05, PY, -3,  1700,3800);
      // Pair z=-7
      add(0,CAM_Y,-7,  0, LY_W, -10,  2000,400);
      add(0,CAM_Y,-7,  -WALLX+0.05, PY, -7,  1300,3800);
      add(0,CAM_Y,-7,   WALLX-0.05, PY, -7,  1700,3800);
      // Pair z=-11
      add(0,CAM_Y,-11, 0, LY_W, -13,  2000,400);
      add(0,CAM_Y,-11, -WALLX+0.05, PY,-11,  1300,3800);
      add(0,CAM_Y,-11,  WALLX-0.05, PY,-11,  1700,3800);
      // End wall paintings
      add(0,CAM_Y,-11,  -3.2, PY,-14,  1400,3200);
      add(0,CAM_Y,-11,   3.2, PY,-14,  1600,3200);

      // ── Walk through archway into Room 2 ─────────────────────────
      add(0,CAM_Y,-16,  0, LY_W,-21, 2200,600);

      // ── Room 2 ──────────────────────────────────────────────────
      // Pair z=-21
      add(0,CAM_Y,-21, -WALLX+0.05, PY,-21, 1300,3800);
      add(0,CAM_Y,-21,  WALLX-0.05, PY,-21, 1700,3800);
      // Pair z=-25
      add(0,CAM_Y,-25, 0, LY_W,-28,  2000,400);
      add(0,CAM_Y,-25, -WALLX+0.05, PY,-25, 1300,3800);
      add(0,CAM_Y,-25,  WALLX-0.05, PY,-25, 1700,3800);
      // Pair z=-29
      add(0,CAM_Y,-29, 0, LY_W,-32,  2000,400);
      add(0,CAM_Y,-29, -WALLX+0.05, PY,-29, 1300,3800);
      add(0,CAM_Y,-29,  WALLX-0.05, PY,-29, 1700,3800);
      // Pair z=-33
      add(0,CAM_Y,-33, 0, LY_W,-36,  2000,400);
      add(0,CAM_Y,-33, -WALLX+0.05, PY,-33, 1300,3800);
      add(0,CAM_Y,-33,  WALLX-0.05, PY,-33, 1700,3800);
      // End wall
      add(0,CAM_Y,-36, 0, LY_W,-40,  2200,600);

      // Abschluss: direkt berechneter Quaternion — frontal auf hintere graue Wand, kein Object3D-Flip
      {
        const fPos = new T.Vector3(0, CAM_Y, -36.5);
        // Pitch: leicht nach oben zum Schild (y=2.10, Kamera y=1.70, z-Abstand=3.5m)
        const pitch = Math.atan2(2.10 - CAM_Y, 3.5);
        const fQuat = new T.Quaternion().setFromEuler(new T.Euler(pitch, 0, 0, 'YXZ'));
        seq.push({pos: fPos, quat: fQuat, trans: 1800, hold: 3000});
      }

      cam.position.copy(seq[0].pos);
      cam.quaternion.copy(seq[0].quat);
      fromPos.copy(seq[0].pos); fromQuat.copy(seq[0].quat);
      seqIdx=0; phase='hold'; t0=performance.now();
    }

    // ── Freie Navigation Tick ─────────────────────────────────────
    function tickFreeNav(T) {
      cam.quaternion.setFromEuler(new T.Euler(navPitch, navYaw, 0, 'YXZ'));
      const spd = 0.055;
      const fwd = new T.Vector3(-Math.sin(navYaw), 0, -Math.cos(navYaw));
      const rgt = new T.Vector3( Math.cos(navYaw), 0, -Math.sin(navYaw));
      const p = cam.position.clone();
      if (navKeys.has('KeyW')||navKeys.has('ArrowUp'))    p.addScaledVector(fwd,  spd);
      if (navKeys.has('KeyS')||navKeys.has('ArrowDown'))  p.addScaledVector(fwd, -spd);
      if (navKeys.has('KeyA')||navKeys.has('ArrowLeft'))  p.addScaledVector(rgt, -spd);
      if (navKeys.has('KeyD')||navKeys.has('ArrowRight')) p.addScaledVector(rgt,  spd);
      p.x = Math.max(-RW/2+0.45, Math.min(RW/2-0.45, p.x));
      p.z = Math.max(-39.6, Math.min(0.9, p.z));
      p.y = CAM_Y;
      cam.position.copy(p);
    }

    // ── Tick ─────────────────────────────────────────────────────
    function tick(T,now){
      if(!seq) return;
      if(freeNav) { tickFreeNav(T); return; }
      if(vrPaused) return;
      const s=seq[seqIdx], dt=now-t0;
      if(phase==='trans'){
        const raw=Math.min(dt/Math.max(s.trans,1),1), et=ease(raw);
        cam.position.lerpVectors(fromPos,s.pos,et);
        cam.quaternion.slerpQuaternions(fromQuat,s.quat,et);
        if(raw>=1){phase='hold';t0=now;}
      } else {
        cam.position.y=s.pos.y+Math.sin(now*0.00065)*0.005;
        if(dt>=s.hold){
          fromPos.copy(cam.position); fromQuat.copy(cam.quaternion);
          seqIdx++;
          if(seqIdx>=seq.length){doLoop(now);return;}
          phase='trans'; t0=now;
        }
      }
    }

    function doLoop(now){
      if(!fadeDiv){
        fadeDiv=document.createElement('div');
        fadeDiv.style.cssText='position:absolute;inset:0;background:#080706;pointer-events:none;opacity:0;transition:opacity 1.2s ease;z-index:1;';
        document.getElementById('gallery-vr').appendChild(fadeDiv);
      }
      fadeDiv.style.opacity='1';
      setTimeout(()=>{
        cam.position.copy(seq[0].pos); cam.quaternion.copy(seq[0].quat);
        fromPos.copy(seq[0].pos); fromQuat.copy(seq[0].quat);
        seqIdx=0; phase='hold'; t0=performance.now();
        setTimeout(()=>{fadeDiv.style.opacity='0';},200);
      },1300);
    }

    function teardown(){
      if(rafId) cancelAnimationFrame(rafId);
      if(renderer){renderer.dispose();renderer=null;}
      scene=null;cam=null;seq=null;fadeDiv=null;
      freeNav=false; navKeys.clear();
      const fb=document.getElementById('vr-free-btn');
      if(fb) fb.remove();
      window.removeEventListener('resize',onResize);
    }
    function onResize(){
      if(!cam||!renderer) return;
      cam.aspect=innerWidth/innerHeight; cam.updateProjectionMatrix();
      renderer.setSize(innerWidth,innerHeight);
    }
  })();


  // ── Legal Overlays ──────────────────────────────────────────
  function openLegal(which) {
    const el = document.getElementById('overlay-' + which);
    if (!el) return;
    el.scrollTop = 0;
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeLegal(which) {
    const el = document.getElementById('overlay-' + which);
    if (!el) return;
    el.classList.remove('active');
    document.body.style.overflow = '';
  }
  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      ['impressum','datenschutz','lieferbedingungen'].forEach(closeLegal);
      closeFavs();
    }
  });

  /* ── INIT: add heart buttons to all coll-cards ── */
  document.querySelectorAll('.coll-card').forEach(function(card) {
    const titleEl = card.querySelector('.coll-card-title');
    if (!titleEl) return;
    const title = titleEl.textContent.trim();
    const btn = document.createElement('button');
    btn.className = 'fav-btn' + (_favs.has(title) ? ' fav-active' : '');
    btn.dataset.title = title;
    btn.textContent = _favs.has(title) ? '♥' : '♡';
    btn.title = 'Merkliste';
    btn.onclick = function(e) { e.stopPropagation(); toggleFav(title); };
    card.appendChild(btn);
  });

  /* ── INIT: apply saved language ── */
  setLang(_lang);
  _updateFavBadge();

  /* ══ FLOATING LABELS ══ */
  document.querySelectorAll('.field input, .field textarea, .cal-auth-field input').forEach(function(inp) {
    var parent = inp.closest('.field') || inp.closest('.cal-auth-field');
    function upd() { parent.classList.toggle('has-value', inp.value.length > 0); parent.classList.toggle('has-val', inp.value.length > 0); }
    inp.addEventListener('input', upd);
    inp.addEventListener('change', upd);
    upd();
  });

  /* ══ CUSTOM CURSOR ══ */
  (function() {
    const cur = document.getElementById('custom-cursor');
    if (!cur || window.matchMedia('(pointer: coarse)').matches) return;
    let mx = 0, my = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cur.style.left = mx + 'px';
      cur.style.top  = my + 'px';
      cur.classList.add('visible');
    });
    document.addEventListener('mouseleave', () => cur.classList.remove('visible'));
    const hoverEls = 'a, button, .artwork-card, .cat-tile, .coll-card, [onclick], label, input, textarea, select';
    document.querySelectorAll(hoverEls).forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('hovered'));
      el.addEventListener('mouseleave', () => cur.classList.remove('hovered'));
    });
  })();

  /* ══ SCROLL PROGRESS BAR ══ */
  (function() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max * 100) : 0) + '%';
    }, { passive: true });
  })();

  /* ══ 3D TILT ON ARTWORK CARDS ══ */
  (function() {
    document.querySelectorAll('.artwork-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 9}deg) scale(1.025) translateZ(0)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  })();

  /* ══ HERO PARALLAX ══ */
  (function() {
    const img = document.querySelector('.hero-scene img');
    const hero = document.getElementById('hero');
    if (!img || !hero) return;
    let heroH = hero.offsetHeight;
    let rafId = null;
    window.addEventListener('resize', () => { heroH = hero.offsetHeight; }, { passive: true });
    window.addEventListener('scroll', () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        if (window.scrollY < heroH) {
          img.style.transform = 'translateY(' + (window.scrollY * 0.38) + 'px)';
        }
        rafId = null;
      });
    }, { passive: true });
  })();

  /* ══ SCENE: intro → galerie → bio ══ */
  (function() {
    var scene      = document.getElementById('intro-scene');
    var intro      = document.getElementById('intro');
    var header     = document.querySelector('.gallery-header');
    var grid       = document.querySelector('.cat-grid');
    var tiles      = document.querySelectorAll('.cat-tile');
    var pinEl      = document.querySelector('.intro-scene-pin');
    if (!scene || !tiles.length) return;

    var OX = [-160,  160, -160,  160];
    var OY = [-110, -110,  110,  110];

    /* Startzustand: Tiles unsichtbar in Ecken */
    for (var i = 0; i < tiles.length; i++) {
      tiles[i].style.transition = 'none';
      tiles[i].style.opacity    = '0';
      tiles[i].style.transform  = 'translate('+OX[i]+'px,'+OY[i]+'px)';
    }

    var cur = 0, tgt = 0, rafId = null;

    function scrollP() {
      var r = scene.getBoundingClientRect();
      return Math.max(0, Math.min(1, -r.top / (scene.offsetHeight - window.innerHeight)));
    }
    function ss(t) { t = Math.max(0,Math.min(1,t)); return t*t*(3-2*t); }
    function band(p,a,b) { return ss(Math.max(0,Math.min(1,(p-a)/(b-a)))); }

    function render(p) {
      /* Phase 1 – Intro blendet aus (p 0→0.18) */
      var iOp = p < 0.1 ? 1 : p > 0.2 ? 0 : 1-(p-0.1)/0.1;
      intro.style.opacity   = iOp;
      intro.style.transform = 'translate(-50%,'+(-50-(1-iOp)*3)+'%)';

      /* Tiles: rein (p 0→0.32), stabil (0.32→0.6), raus (0.6→0.92) */
      var tileT;
      if      (p < 0.32) tileT = band(p, 0, 0.32);
      else if (p < 0.60) tileT = 1;
      else               tileT = 1 - band(p, 0.60, 0.92);

      var stable = tileT >= 0.995;
      grid.classList.toggle('tiles-settled', stable);
      for (var i = 0; i < tiles.length; i++) {
        if (!stable) tiles[i].style.transition = 'none';
        tiles[i].style.transform = 'translate('+(OX[i]*(1-tileT))+'px,'+(OY[i]*(1-tileT))+'px)';
        tiles[i].style.opacity   = tileT;
      }

      /* Galerie-Header: ein (p 0.18→0.36), aus (p 0.56→0.70) */
      if (header) {
        var hOp = p<0.18?0 : p<0.36?band(p,0.18,0.36) : p<0.56?1 : p<0.70?1-band(p,0.56,0.70) : 0;
        header.style.opacity   = hOp;
        header.style.transform = 'translateY('+(1-hOp)*10+'px)';
      }

      /* Pin-Transparenz: sobald Tiles weg sind → Biographie durchscheinen lassen */
      if (pinEl) {
        var pAlpha = p < 0.78 ? 1 : 1 - band(p, 0.78, 1.0);
        pinEl.style.opacity       = pAlpha;
        pinEl.style.pointerEvents = pAlpha < 0.05 ? 'none' : '';
      }
    }

    function tick() {
      var d = tgt - cur;
      if (Math.abs(d) < 0.0002) {
        cur = tgt; render(cur);
        for (var i = 0; i < tiles.length; i++) tiles[i].style.transition = '';
        rafId = null;
      } else {
        cur += d * 0.09; render(cur);
        rafId = requestAnimationFrame(tick);
      }
    }

    window.addEventListener('scroll', function() {
      tgt = scrollP();
      if (!rafId) rafId = requestAnimationFrame(tick);
    }, { passive: true });
    render(0);
  })();

  /* ══ KONTAKTFORMULAR ══ */
  function submitContact() {
    var name  = document.getElementById('kon-name').value.trim();
    var email = document.getElementById('kon-email-input').value.trim();
    var msg   = document.getElementById('kon-message').value.trim();
    if (!name || !email || !msg) {
      var lang = document.documentElement.lang || 'de';
      alert(lang === 'en'
        ? 'Please fill in all fields.'
        : 'Bitte alle Felder ausfüllen.');
      return;
    }
    document.getElementById('kon-form-wrap').style.opacity = '0';
    document.getElementById('kon-form-wrap').style.pointerEvents = 'none';
    setTimeout(function() {
      document.getElementById('kon-form-wrap').style.display = 'none';
      document.getElementById('kon-success-msg').classList.add('show');
    }, 300);
  }

  /* ══ KALENDER AUTH ══ */
  function calGetAccounts() {
    try { return JSON.parse(localStorage.getItem('_gal_accounts') || '{}'); } catch(e) { return {}; }
  }
  function calGetSession() {
    try { return JSON.parse(localStorage.getItem('_gal_session') || 'null'); } catch(e) { return null; }
  }
  function calSaveSession(user) {
    localStorage.setItem('_gal_session', JSON.stringify(user));
  }

  window.calSwitchTab = function(tab) {
    var isReg = tab === 'register';
    document.getElementById('tab-login').classList.toggle('active', !isReg);
    document.getElementById('tab-register').classList.toggle('active', isReg);
    document.getElementById('auth-field-name').style.display = isReg ? '' : 'none';
    document.getElementById('cal-auth-submit').textContent = isReg ? 'Konto erstellen' : 'Anmelden';
    document.getElementById('cal-auth-error').textContent = '';
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-name').value = '';
  };

  window.calSubmitAuth = function() {
    var isReg = document.getElementById('tab-register').classList.contains('active');
    var email = document.getElementById('auth-email').value.trim().toLowerCase();
    var name  = document.getElementById('auth-name').value.trim();
    var err   = document.getElementById('cal-auth-error');
    var lang  = document.documentElement.lang === 'en' ? 'en' : 'de';

    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      err.textContent = lang === 'en' ? 'Please enter a valid e-mail.' : 'Bitte gültige E-Mail eingeben.';
      return;
    }
    var accounts = calGetAccounts();
    if (isReg) {
      if (!name) { err.textContent = lang === 'en' ? 'Please enter your name.' : 'Bitte Namen eingeben.'; return; }
      if (accounts[email]) { err.textContent = lang === 'en' ? 'E-mail already registered.' : 'E-Mail bereits registriert.'; return; }
      accounts[email] = { name: name, email: email };
      localStorage.setItem('_gal_accounts', JSON.stringify(accounts));
      calSaveSession(accounts[email]);
    } else {
      if (!accounts[email]) { err.textContent = lang === 'en' ? 'No account found.' : 'Kein Konto gefunden.'; return; }
      calSaveSession(accounts[email]);
    }
    updateNavAccount();
    calShowLoggedIn(calGetSession());
  };

  function calShowLoggedIn(user) {
    document.getElementById('cal-auth-form').style.display = 'none';
    document.getElementById('cal-auth-logged').style.display = '';
    document.getElementById('cal-auth-sub').style.display = 'none';
    var lang = document.documentElement.lang === 'en' ? 'en' : 'de';
    document.getElementById('cal-auth-greeting').innerHTML =
      (lang === 'en' ? 'Welcome back, ' : 'Willkommen, ') +
      '<strong>' + user.name + '</strong>';
    setTimeout(function() {
      if (window.showCalMain) window.showCalMain();
    }, 1200);
  }

  function updateNavAccount() {
    var session = calGetSession();
    var btn = document.getElementById('nav-account');
    var label = document.getElementById('nav-acc-label');
    if (!btn || !label) return;
    if (session) {
      btn.classList.add('logged-in');
      label.textContent = session.name;
    } else {
      btn.classList.remove('logged-in');
      var lang = document.documentElement.lang === 'en' ? 'en' : 'de';
      label.textContent = lang === 'en' ? 'Sign in' : 'Anmelden';
    }
  }
  updateNavAccount();

  window.openNavAccount = function() {
    var session = calGetSession();
    if (session) {
      document.getElementById('cal-main').style.display = 'none';
      document.getElementById('cal-auth').style.display = '';
      document.getElementById('cal-auth-form').style.display = 'none';
      document.getElementById('cal-auth-sub').style.display = 'none';
      document.getElementById('cal-auth-logged').style.display = '';
      var lang = document.documentElement.lang === 'en' ? 'en' : 'de';
      document.getElementById('cal-auth-greeting').innerHTML =
        (lang === 'en' ? 'Signed in as ' : 'Angemeldet als ') +
        '<strong>' + session.name + '</strong>';
      document.getElementById('cal-overlay').classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      openCal();
    }
  };

  window.calLogout = function() {
    localStorage.removeItem('_gal_session');
    document.getElementById('cal-auth-logged').style.display = 'none';
    document.getElementById('cal-auth-form').style.display = '';
    document.getElementById('cal-auth-sub').style.display = '';
    calSwitchTab('login');
    updateNavAccount();
  };

  /* ══ KALENDER ══ */
  (function() {
    var MONTHS_DE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    var MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var today = new Date();
    var cur = { year: today.getFullYear(), month: today.getMonth() };
    var selectedDate = null;

    function getLang() { return document.documentElement.lang === 'en' ? 'en' : 'de'; }

    function renderCal() {
      var lang = getLang();
      var months = lang === 'en' ? MONTHS_EN : MONTHS_DE;
      document.getElementById('cal-month-label').textContent = months[cur.month] + ' ' + cur.year;
      var grid = document.getElementById('cal-days');
      grid.innerHTML = '';
      var firstDay = new Date(cur.year, cur.month, 1).getDay();
      var offset = (firstDay === 0) ? 6 : firstDay - 1;
      var daysInMonth = new Date(cur.year, cur.month + 1, 0).getDate();
      for (var i = 0; i < offset; i++) {
        var empty = document.createElement('div');
        empty.className = 'cal-day cal-empty';
        grid.appendChild(empty);
      }
      for (var d = 1; d <= daysInMonth; d++) {
        var btn = document.createElement('div');
        btn.className = 'cal-day';
        btn.textContent = d;
        var isPast = (cur.year < today.getFullYear()) ||
          (cur.year === today.getFullYear() && cur.month < today.getMonth()) ||
          (cur.year === today.getFullYear() && cur.month === today.getMonth() && d < today.getDate());
        var isToday = cur.year === today.getFullYear() && cur.month === today.getMonth() && d === today.getDate();
        if (isPast) btn.classList.add('cal-past');
        if (isToday) btn.classList.add('cal-today');
        if (selectedDate && selectedDate.d === d && selectedDate.m === cur.month && selectedDate.y === cur.year)
          btn.classList.add('cal-selected');
        if (!isPast) btn.addEventListener('click', (function(day) {
          return function() { selectDay(day); };
        })(d));
        grid.appendChild(btn);
      }
    }

    /* ── Roller ── */
    var HOURS = ['09','10','11','12','13','14','15','16','17','18'];
    var MINS  = ['00','15','30','45'];
    var ITEM_H = 44;

    function buildRoller(id, values, defaultIdx) {
      var roller = document.getElementById(id);
      roller.innerHTML = '';
      var ghost1 = document.createElement('div');
      ghost1.className = 'cal-roller-item';
      roller.appendChild(ghost1);
      values.forEach(function(v, i) {
        var el = document.createElement('div');
        el.className = 'cal-roller-item' + (i === defaultIdx ? ' r-active' : '');
        el.textContent = v;
        roller.appendChild(el);
      });
      var ghost2 = document.createElement('div');
      ghost2.className = 'cal-roller-item';
      roller.appendChild(ghost2);
      roller.scrollTop = defaultIdx * ITEM_H;
    }

    function getRollerValue(id, values) {
      var roller = document.getElementById(id);
      var idx = Math.min(Math.round(roller.scrollTop / ITEM_H), values.length - 1);
      return values[Math.max(0, idx)];
    }

    function updateRollerActive(id, values) {
      var roller = document.getElementById(id);
      var idx = Math.min(Math.round(roller.scrollTop / ITEM_H), values.length - 1);
      var items = roller.querySelectorAll('.cal-roller-item');
      items.forEach(function(el, i) { el.classList.toggle('r-active', i === idx + 1); });
    }

    function updateConfirmText() {
      if (!selectedDate) return;
      var lang = getLang();
      var months = lang === 'en' ? MONTHS_EN : MONTHS_DE;
      var h = getRollerValue('cal-roller-h', HOURS);
      var m = getRollerValue('cal-roller-m', MINS);
      var conf = document.getElementById('cal-confirm');
      conf.textContent = (lang === 'en' ? 'Selected: ' : 'Gewählt: ') +
        selectedDate.d + '. ' + months[selectedDate.m] + ' ' + selectedDate.y +
        ' · ' + h + ':' + m + ' Uhr';
      conf.classList.add('has-date');
      document.getElementById('cal-book-btn').classList.add('visible');
    }

    function attachRollerScroll(id, values) {
      var roller = document.getElementById(id);
      var t;
      roller.addEventListener('scroll', function() {
        clearTimeout(t);
        updateRollerActive(id, values);
        t = setTimeout(function() {
          var idx = Math.min(Math.round(roller.scrollTop / ITEM_H), values.length - 1);
          roller.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
          updateRollerActive(id, values);
          if (selectedDate) updateConfirmText();
        }, 120);
      }, { passive: true });
    }

    function selectDay(d) {
      selectedDate = { d: d, m: cur.month, y: cur.year };
      renderCal();
      document.getElementById('cal-time-wrap').classList.add('open');
      updateConfirmText();
    }

    window.showCalMain = function showCalMain() {
      selectedDate = null;
      cur = { year: today.getFullYear(), month: today.getMonth() };
      document.getElementById('cal-success').classList.remove('show');
      document.getElementById('cal-auth').style.display = 'none';
      document.getElementById('cal-main').style.display = '';
      document.getElementById('cal-time-wrap').classList.remove('open');
      buildRoller('cal-roller-h', HOURS, 0);
      buildRoller('cal-roller-m', MINS, 0);
      attachRollerScroll('cal-roller-h', HOURS);
      attachRollerScroll('cal-roller-m', MINS);
      renderCal();
      var conf = document.getElementById('cal-confirm');
      conf.textContent = getLang() === 'en' ? 'Select a date' : 'Datum wählen';
      conf.classList.remove('has-date');
      document.getElementById('cal-book-btn').classList.remove('visible');
    }

    window.openCal = function() {
      var session = calGetSession();
      document.getElementById('cal-overlay').classList.add('active');
      document.body.style.overflow = 'hidden';
      if (session) {
        showCalMain();
      } else {
        document.getElementById('cal-main').style.display = 'none';
        document.getElementById('cal-auth').style.display = '';
        document.getElementById('cal-auth-logged').style.display = 'none';
        document.getElementById('cal-auth-form').style.display = '';
        document.getElementById('cal-auth-sub').style.display = '';
        document.getElementById('cal-auth-error').textContent = '';
        calSwitchTab('login');
      }
    };

    window.closeCal = function() {
      document.getElementById('cal-overlay').classList.remove('active');
      document.body.style.overflow = '';
    };

    window.confirmBooking = function() {
      if (!selectedDate) return;
      document.getElementById('cal-main').style.display = 'none';
      document.getElementById('cal-success').classList.add('show');
      setTimeout(function() { closeCal(); }, 3200);
    };

    document.getElementById('cal-prev').addEventListener('click', function() {
      cur.month--; if (cur.month < 0) { cur.month = 11; cur.year--; }
      renderCal();
    });
    document.getElementById('cal-next').addEventListener('click', function() {
      cur.month++; if (cur.month > 11) { cur.month = 0; cur.year++; }
      renderCal();
    });
    document.getElementById('cal-overlay').addEventListener('click', function(e) {
      if (e.target === this) closeCal();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeCal();
    });
  })();

  /* ══ NACH-OBEN BUTTON ══ */
  (function() {
    var btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', function() {
      btn.classList.toggle('visible', window.scrollY > 420);
    }, { passive: true });
    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();

  // ── Hero Goldpartikel ────────────────────────────────────────
  (function() {
    const cv = document.getElementById('hero-particles');
    if (!cv) return;
    const hero = document.getElementById('hero');
    const ctx = cv.getContext('2d');
    let W, H, particles = [];
    function resize() { W = cv.width = hero.offsetWidth; H = cv.height = hero.offsetHeight; }
    resize();
    window.addEventListener('resize', resize);
    function mkP() {
      return { x: Math.random()*W, y: H + Math.random()*40,
        r: Math.random()*1.2+0.2, vy: Math.random()*0.35+0.1,
        vx: (Math.random()-0.5)*0.25, o: Math.random()*0.4+0.08 };
    }
    for (let i=0; i<40; i++) { const p=mkP(); p.y=Math.random()*H; particles.push(p); }
    function tick() {
      ctx.clearRect(0,0,W,H);
      particles.forEach(p => {
        p.y -= p.vy; p.x += p.vx;
        p.o += (Math.random()-0.5)*0.012;
        p.o = Math.max(0.04, Math.min(0.55, p.o));
        if (p.y < -8) Object.assign(p, mkP());
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(201,168,76,${p.o.toFixed(2)})`;
        ctx.fill();
      });
      requestAnimationFrame(tick);
    }
    tick();
  })();

  // ── Artwork-Platzhalter (geteilt zwischen Karten + Einzelansicht) ──
  const _AW_TITLES = [
    'Komposition I','Stille II','Aufbruch','Horizont',
    'Tiefe','Stille I','Dämmerung','Landschaft I',
    'Vergänglichkeit','Morgenrot','Nebel','Fluss',
    'Licht & Schatten','Struktur','Fragment','Übergang',
  ];
  const _AW_TECH_PAL = [
    ['#2a4020','#456830'],['#1e3828','#2e5840'],['#384a20','#5a7030'],['#203830','#305848'],
    ['#4a2a08','#7a4a18'],['#3a1e0a','#6a3418'],['#4a3808','#786818'],['#3a2808','#604818'],
    ['#082048','#183878'],['#082038','#103560'],['#082838','#105860'],['#081838','#102858'],
    ['#28084a','#481578'],['#380848','#601570'],['#281040','#402060'],['#1e0838','#301058'],
  ];
  const _AW_ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI'];
  const _AW_IMGS = {};

  function _makeArtworkCanvas(title, w, h) {
    w = w||400; h = h||300;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    const idx = _AW_TITLES.indexOf(title);
    const [c1,c2] = _AW_TECH_PAL[idx] || ['#2a2a22','#3a3a30'];
    const gr = ctx.createLinearGradient(0,0,w,h);
    gr.addColorStop(0,c1); gr.addColorStop(1,c2);
    ctx.fillStyle = gr; ctx.fillRect(0,0,w,h);
    const b = Math.min(w,h)*0.04;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.2;
    ctx.strokeRect(b,b,w-b*2,h-b*2);
    ctx.strokeRect(b+4,b+4,w-b*2-8,h-b*2-8);
    const rom = idx>=0 ? (_AW_ROMAN[idx]||String(idx+1)) : '—';
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.font = '300 ' + Math.round(h*0.18) + 'px "Georgia","Times New Roman",serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(rom, w/2, h*0.43);
    ctx.font = '300 ' + Math.round(h*0.038) + 'px Arial,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.fillText('HORST  SCHWAB', w/2, h*0.66);
    ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(w*0.3,h*0.73); ctx.lineTo(w*0.7,h*0.73); ctx.stroke();
    if (idx >= 0 && _AW_IMGS[idx]) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = '#f5f0e8'; ctx.fillRect(0,0,w,h);
        const s = Math.min((w-20)/img.width, (h-20)/img.height);
        const iw = img.width*s, ih = img.height*s;
        ctx.drawImage(img,(w-iw)/2,(h-ih)/2,iw,ih);
      };
      img.src = _AW_IMGS[idx];
    }
    return cv;
  }

  // Kollektion-Karten befüllen (nur wenn noch kein echtes Bild vorhanden)
  document.querySelectorAll('.coll-card-img').forEach(el => {
    if (el.querySelector('img')) return;
    const title = el.nextElementSibling?.querySelector('.coll-card-title')?.textContent?.trim();
    if (!title) return;
    el.innerHTML = '';
    el.appendChild(_makeArtworkCanvas(title, 400, 300));
  });

  // ── Rundgang-Hinweis-Popup ────────────────────────────────────
  function _showRundgangHint() {
    const isEN = localStorage.getItem('lang') === 'en';
    const hint = document.createElement('div');
    hint.id = 'rundgang-hint';
    hint.innerHTML =
      '<button class="rh-close" aria-label="Schließen">✕</button>' +
      '<span class="rh-icon">🎨</span>' +
      '<span class="rh-title">' + (isEN ? 'Virtual Tour' : 'Virtueller Rundgang') + '</span>' +
      '<span class="rh-text">' +
        (isEN
          ? 'Explore all artworks in a 3D gallery walk — click on any painting to learn more.'
          : 'Entdecken Sie alle Werke im virtuellen 3D-Rundgang — klicken Sie auf ein Gemälde für Details.') +
      '</span>' +
      '<button class="rh-btn">' + (isEN ? 'START TOUR' : 'RUNDGANG STARTEN') + '</button>';
    document.body.appendChild(hint);

    setTimeout(() => hint.classList.add('visible'), 3500);

    hint.querySelector('.rh-btn').addEventListener('click', () => {
      dismiss();
      document.getElementById('nav-rundgang')?.click();
    });
    hint.querySelector('.rh-close').addEventListener('click', dismiss);

    function dismiss() {
      hint.classList.remove('visible');
      setTimeout(() => hint.remove(), 500);
    }
  }

  // ── Bio Carousel ──────────────────────────────
  (function() {
    const slides   = document.querySelectorAll('#bio-carousel .bio-slide');
    const dots     = document.querySelectorAll('#bio-carousel .bio-dot');
    const cap      = document.getElementById('bio-cap');
    const captions = ['Portrait', '80. Geburtstag, 2015', 'Porträt', 'Selbstbildnis, 1982'];
    let idx = 0;

    function goTo(n) {
      slides[idx].classList.remove('active');
      dots[idx].classList.remove('active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('active');
      dots[idx].classList.add('active');
      if (cap) cap.textContent = captions[idx];
    }

    const prev = document.querySelector('#bio-carousel .bio-nav-prev');
    const next = document.querySelector('#bio-carousel .bio-nav-next');
    if (prev) prev.addEventListener('click', () => { goTo(idx - 1); restartTimer(); });
    if (next) next.addEventListener('click', () => { goTo(idx + 1); restartTimer(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); restartTimer(); }));

    // Auto-play: erstes Bild 5s, danach je 4s
    let timer = null;
    let firstShown = true;

    function scheduleNext() {
      clearTimeout(timer);
      const delay = firstShown ? 5000 : 4000;
      timer = setTimeout(() => {
        firstShown = false;
        goTo(idx + 1);
        scheduleNext();
      }, delay);
    }

    function restartTimer() {
      firstShown = false;
      scheduleNext();
    }

    // Nur starten wenn Bio-Bereich im Viewport sichtbar wird
    const carousel = document.getElementById('bio-carousel');
    if (carousel && 'IntersectionObserver' in window) {
      let started = false;
      new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true;
          scheduleNext();
        }
      }, { threshold: 0.4 }).observe(carousel);
    } else {
      scheduleNext();
    }
  })();


  /* ── PRELOADER JS ── */
  (function(){
    var pl = document.getElementById('preloader');
    if (!pl) return;
    var hide = function(){
      pl.classList.add('hidden');
      setTimeout(function(){ pl.remove(); }, 900);
    };
    if (document.readyState === 'complete') {
      setTimeout(hide, 1800);
    } else {
      window.addEventListener('load', function(){ setTimeout(hide, 400); });
    }
  })();
