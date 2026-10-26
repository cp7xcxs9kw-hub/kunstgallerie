  const overlay = document.getElementById('room-overlay');
  const heroSection = document.getElementById('hero');
  const zoomOverlay = document.getElementById('zoom-hero-overlay');

  function zoomIntoGallery(targetId) {
    // Ablauf: Wand dunkelt weich ab (DIM ms), gleichzeitig Flug ins gezeigte Werk (ZOOM ms);
    // schon während des Flugs blendet das Overlay ab FADE_AT weich aus – die Bewegung bleibt nie stehen.
    const ZOOM = 1500, DIM = 380, FADE_AT = 850, FADE = 650;
    if (document.body.classList.contains('hero-zooming')) return;   // läuft schon (Doppelklick)
    const title  = heroSection.querySelector('.hero-title');
    const label  = heroSection.querySelector('.hero-art-label');
    const floor  = heroSection.querySelector('.hero-floor');

    // 0. Schrift ausblenden
    [title, label, floor].forEach(el => {
      if (!el) return;
      el.style.animation = 'none';
      el.style.opacity   = window.getComputedStyle(el).opacity;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      [title, label, floor].forEach(el => {
        if (!el) return;
        el.style.transition = 'opacity 0.4s ease';
        el.style.opacity    = '0';
      });
    }));

    // 1. Overlay-Bild exakt auf das gezeigte Werk legen – von dort aus wird hineingezoomt
    //    (das Bild ist bereits vorgeladen und dekodiert, siehe HERO-WERK)
    const oImg   = zoomOverlay.querySelector('img');
    const artImg = document.getElementById('hero-art-img');
    let zoomTo = '';
    if (oImg && artImg) {
      const r = artImg.getBoundingClientRect();
      const src = artImg.currentSrc || artImg.src;
      if (oImg.src !== src) oImg.src = src;
      Object.assign(oImg.style, {
        position: 'absolute', left: r.left + 'px', top: r.top + 'px',
        width: r.width + 'px', height: r.height + 'px',
        objectFit: 'cover', transformOrigin: '50% 50%', filter: 'none',
        transform: 'translate3d(0,0,0) scale(1)', willChange: 'transform',
        // falls gerade ein Werkwechsel überblendet: mit derselben Helligkeit starten
        opacity: getComputedStyle(artImg).opacity,
        transition: 'transform ' + ZOOM + 'ms cubic-bezier(0.45, 0, 0.2, 1), opacity ' + DIM + 'ms ease'
      });
      const sc = Math.max(innerWidth / r.width, innerHeight / r.height) * 2.2;
      const tx = innerWidth / 2 - (r.left + r.width / 2);
      const ty = innerHeight / 2 - (r.top + r.height / 2);
      zoomTo = 'translate3d(' + tx + 'px,' + ty + 'px,0) scale(' + sc + ')';
    }

    // 2. Overlay mit durchsichtigem Hintergrund einblenden – Leuchte, Rahmen und Schrift
    //    bleiben zunächst sichtbar; Navigation während des Flugs ruhig halten
    zoomOverlay.classList.remove('zooming');
    zoomOverlay.style.transition = 'none';
    zoomOverlay.style.opacity = '1';
    zoomOverlay.style.background = 'rgba(11,10,9,0)';
    zoomOverlay.classList.add('active');
    document.body.classList.add('hero-zooming');
    if (oImg) void oImg.offsetWidth;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      zoomOverlay.style.transition = 'background-color ' + DIM + 'ms ease';
      zoomOverlay.style.background = 'rgba(11,10,9,1)';
      if (oImg && zoomTo) { oImg.style.opacity = '1'; oImg.style.transform = zoomTo; }
      else zoomOverlay.classList.add('zooming');   // Fallback: alter Zoom
    }));

    // 3. Erst wenn die Wand ganz abgedunkelt ist, unter dem Overlay zur neuen Seite springen
    //    (Puffer für die zwei Frames bis zum Start des Abdunkelns)
    setTimeout(() => {
      _syncHero();
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: 'instant' });
    }, DIM + 120);

    // 4. Noch während der Bewegung weich ausblenden → neue Seite erscheint
    setTimeout(() => {
      zoomOverlay.style.transition = 'opacity ' + FADE + 'ms ease';
      zoomOverlay.style.opacity = '0';
      zoomOverlay.addEventListener('transitionend', function onEnd(e) {
        if (e.target !== zoomOverlay || e.propertyName !== 'opacity') return;
        zoomOverlay.removeEventListener('transitionend', onEnd);
        cleanup();
      });
    }, FADE_AT);

    // 5. Aufräumen – nach dem Ausblenden, mit Sicherheitsnetz falls transitionend ausbleibt
    let cleaned = false;
    const fallback = setTimeout(cleanup, FADE_AT + FADE + 500);
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      clearTimeout(fallback);
      zoomOverlay.classList.remove('active', 'zooming');
      zoomOverlay.style.transition = 'none';
      zoomOverlay.style.opacity = '1';
      zoomOverlay.style.background = '';
      if (oImg) oImg.removeAttribute('style');
      document.body.classList.remove('hero-zooming');

      [title, label, floor].forEach(el => {
        if (!el) return;
        el.style.animation = el.style.transition = el.style.opacity = '';
      });
      if (window._heroZoomSync) window._heroZoomSync();
    }
  }

  function roomTransition(targetId) {
    const sweep = document.getElementById('nav-sweep');
    sweep.classList.remove('out');
    sweep.classList.add('active');
    // Scroll während Overlay sichtbar ist (Hero dabei ein-/ausblenden, siehe _syncHero)
    setTimeout(() => {
      _syncHero();
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: 'instant' });
    }, 420);
    // Ausblenden nach Kometendurchflug
    setTimeout(() => {
      sweep.classList.add('out');
      setTimeout(() => sweep.classList.remove('active', 'out'), 500);
    }, 730);
  }

  // Hero ↔ Galerie: vor dem Betreten sperrt der Hero das Runterscrollen; danach ist der Hero
  // ausgeblendet (Klasse gallery-entered an <html>, nach Neuladen schon im <head> gesetzt).
  // Hochscrollen endet so von selbst am Galerie-Anfang – kein Zurückschnappen, das bei
  // Wisch-Schwung oder der ein-/ausklappenden iPhone-Adressleiste die Seite springen ließ.
  // sessionStorage hält den Zustand über Refreshes
  var _galleryEntered = sessionStorage.getItem('galleryEntered') === '1';
  var _hasEnteredOnce = sessionStorage.getItem('galleryEnteredOnce') === '1';
  document.documentElement.classList.toggle('gallery-entered', _galleryEntered);
  // Hero passend zum Zustand zeigen/ausblenden – nur unter einer Abdeckung aufrufen
  // (Raumübergang, Zoom, Rundgang), danach springt der Aufrufer an sein Ziel
  function _syncHero() {
    var root = document.documentElement;
    if (root.classList.contains('gallery-entered') === _galleryEntered) return;
    var h = heroSection.offsetHeight, y = window.scrollY;
    root.classList.toggle('gallery-entered', _galleryEntered);
    // Inhalt unterhalb des Heros bleibt an seiner Stelle
    if (!_galleryEntered) window.scrollTo({ top: y + heroSection.offsetHeight, behavior: 'instant' });
    else if (y >= h) window.scrollTo({ top: y - h, behavior: 'instant' });
  }
  // Wischen/Scrollen in einer offenen Ebene (Kollektion, Werk, Rechtliches …) oder in der
  // Navigationsleiste gehört dieser Ebene – die Hero-Sperre greift dort nicht
  function _inLayer(t) {
    if (document.body.style.overflow === 'hidden') return true;
    return !!(t && t.closest && t.closest('.coll-overlay, #artwork-detail, .legal-overlay, #cal-overlay, #gallery-vr, .nav-links, #rundgang-hint'));
  }
  /* ══ BROWSER-ZURÜCK: jede geöffnete Ebene ist ein Schritt im Browserverlauf ══
     Jeder Verlaufseintrag speichert den kompletten Ebenen-Stapel (z. B. ['gallery','col:mixed','art:Meer']).
     Bei Zurück/Vorwärts wird die Seite an den Stapel des Eintrags angeglichen. */
  var _nav = { stack: [], applying: false, pending: false, queue: [] };
  function _navUrl(stack) {
    for (var i = stack.length - 1; i >= 0; i--) {
      if (stack[i].indexOf('art:') === 0) return '#artwork=' + encodeURIComponent(stack[i].slice(4));
      if (stack[i].indexOf('col:') === 0) return '#col=' + encodeURIComponent(stack[i].slice(4));
    }
    return location.pathname + location.search;
  }
  // Ebene wurde geöffnet → neuer Verlaufsschritt
  function _navOpen(item) {
    if (_nav.applying) return;
    var push = function() {
      if (_nav.stack.indexOf(item) !== -1) return;
      _nav.stack = _nav.stack.concat(item);
      history.pushState({ navStack: _nav.stack, pushed: true }, '', _navUrl(_nav.stack));
    };
    if (_nav.pending) _nav.queue.push(push); else push();
  }
  // Ebene wurde über die Website geschlossen → Verlauf mitziehen
  function _navClosed(item) {
    if (_nav.applying) return;
    // läuft gerade noch ein Zurück-Schritt: erst danach verbuchen
    if (_nav.pending) { _nav.queue.push(function() { _navClosed(item); }); return; }
    var i = _nav.stack.lastIndexOf(item);
    if (i === -1) return;
    var wasTop = i === _nav.stack.length - 1;
    // nur diese Ebene austragen – darüberliegende, noch offene Ebenen bleiben im Stapel
    _nav.stack = _nav.stack.filter(function(x, k) { return k !== i; });
    var st = history.state;
    if (wasTop && st && st.pushed && st.navStack && st.navStack[st.navStack.length - 1] === item) {
      // vorheriger Eintrag ist genau dieser Zustand → einen Schritt zurück statt Leereintrag
      _nav.pending = true;
      history.back();
    } else {
      history.replaceState({ navStack: _nav.stack, pushed: !!(st && st.pushed) }, '', _navUrl(_nav.stack));
    }
  }
  function _navOpenItem(item) {
    if (item === 'gallery') { _enterGallery(); roomTransition('intro-scene'); }
    else if (item === 'vr') document.getElementById('nav-rundgang')?.click();
    else if (item === 'favs') openFavs();
    else if (item === 'cal') window.openCal && window.openCal();
    else if (item.indexOf('col:') === 0) openCollection(item.slice(4));
    else if (item.indexOf('art:') === 0) openArtwork(item.slice(4));
    else if (item.indexOf('legal:') === 0) openLegal(item.slice(6));
  }
  function _navCloseItem(item) {
    if (item === 'gallery') _goToHero();
    else if (item === 'vr') document.getElementById('gallery-vr-close')?.click();
    else if (item === 'favs') closeFavs();
    else if (item === 'cal') window.closeCal && window.closeCal();
    else if (item.indexOf('col:') === 0) closeCollection(item.slice(4));
    else if (item.indexOf('art:') === 0) closeArtwork();
    else if (item.indexOf('legal:') === 0) closeLegal(item.slice(6));
  }
  window.addEventListener('popstate', function(e) {
    var target = (e.state && e.state.navStack) || [];
    var cur = _nav.stack;
    _nav.applying = true;
    try {
      for (var i = cur.length - 1; i >= 0; i--) if (target.indexOf(cur[i]) === -1) _navCloseItem(cur[i]);
      for (var j = 0; j < target.length; j++) if (cur.indexOf(target[j]) === -1) _navOpenItem(target[j]);
    } finally {
      _nav.applying = false;
    }
    _nav.stack = target.slice();
    _nav.pending = false;
    var q = _nav.queue; _nav.queue = [];
    q.forEach(function(f) { f(); });
  });

  function _enterGallery() {
    _galleryEntered = true;
    _hasEnteredOnce = true;
    sessionStorage.setItem('galleryEntered', '1');
    sessionStorage.setItem('galleryEnteredOnce', '1');
    _unlockHero();
  }
  function _goToHero() {
    _galleryEntered = false;
    sessionStorage.removeItem('galleryEntered');
    // _hasEnteredOnce bleibt true → Down-Sperre entfällt beim Zurückkehren
    _hideRundgangHint();
    _navClosed('gallery');
    roomTransition('hero');
  }

  // Hero-Sperre: vor dem ersten Betreten nicht vom Hero nach unten scrollen. Die Listener sind nur
  // bis zum ersten Betreten angemeldet – danach muss iOS beim Wischen nicht mehr auf Skripte warten.
  function _heroLocked() { return !_galleryEntered && !_hasEnteredOnce && window.scrollY <= 5; }
  function _lockWheel(e) {
    if (_heroLocked() && e.deltaY > 0 && !_inLayer(e.target)) e.preventDefault();
  }
  function _lockTouch(e) {
    if (_heroLocked() && !_inLayer(e.target)) e.preventDefault();
  }
  function _lockKeys(e) {
    if (_heroLocked() && !_inLayer(e.target) && ['ArrowDown', 'PageDown', ' '].includes(e.key)) e.preventDefault();
  }
  function _unlockHero() {
    window.removeEventListener('wheel', _lockWheel, { passive: false });
    window.removeEventListener('touchmove', _lockTouch, { passive: false });
    window.removeEventListener('keydown', _lockKeys);
  }
  if (!_hasEnteredOnce) {
    window.addEventListener('wheel', _lockWheel, { passive: false });
    window.addEventListener('touchmove', _lockTouch, { passive: false });
    window.addEventListener('keydown', _lockKeys);
  }

  // Hero-Button: Zoom-In Effekt → scrollt zuerst zum Zitat
  const heroEnterBtn = document.querySelector('.hero-enter');
  if (heroEnterBtn) {
    heroEnterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (document.body.classList.contains('hero-zooming')) return;   // Doppelklick ignorieren
      _enterGallery();
      _navOpen('gallery');
      const targetId = heroEnterBtn.getAttribute('href').slice(1);
      zoomIntoGallery(targetId);
      _showRundgangHint();
    });
  }

  // Hinweis auf die Dauerausstellung: betritt die Galerie (Verlauf, Sperren) und springt zu den Ausstellungen
  const heroDauer = document.querySelector('.hero-dauer');
  if (heroDauer) heroDauer.addEventListener('click', (e) => {
    e.preventDefault(); e.stopImmediatePropagation();
    _enterGallery();
    _navOpen('gallery');
    roomTransition('ausstellungen');
  });

  // Rundgang-Button
  const heroGhostBtn = document.getElementById('hero-enter-ghost');
  // (der Rundgang liegt dann schon deckend darüber – Hero darunter ausblenden, nach dem
  //  Beenden steht man am Galerie-Anfang)
  if (heroGhostBtn) heroGhostBtn.addEventListener('click', function() { _enterGallery(); _syncHero(); });

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
    'Komposition I':   { technique:'Acryl auf Leinwand', technique_en:'Acrylic on canvas', size:'120 × 90 cm', year:'2024', cat:'Malerei', cat_en:'Painting', story:'Komposition I markiert einen Wendepunkt im Schaffen von Horst Schwab. In ruhigen Abendsitzungen entstanden, greift das Werk die Spannung zwischen geometrischer Strenge und freiem Ausdruck auf. Die überlagernden Farbschichten wurden in mehreren Wochen aufgebaut — jede Schicht durfte vollständig trocknen, bevor die nächste aufgetragen wurde. Das Ergebnis ist eine vibrierende Tiefe, die sich je nach Lichteinfall verändert.', story_en:'Komposition I marks a turning point in Horst Schwab\'s work. Created during quiet evening sessions, the painting explores the tension between geometric rigour and free expression. The overlapping colour layers were built up over several weeks — each layer left to dry completely before the next was applied. The result is a vibrant depth that shifts with the light.', svg:'<rect x="4" y="4" width="56" height="56" stroke="#C9A84C" stroke-width="0.8"/><line x1="4" y1="4" x2="60" y2="60" stroke="#C9A84C" stroke-width="0.8"/><line x1="60" y1="4" x2="4" y2="60" stroke="#C9A84C" stroke-width="0.8"/>' },
    'Stille II':       { technique:'Acryl auf Leinwand', technique_en:'Acrylic on canvas', size:'80 × 60 cm', year:'2023', cat:'Malerei', cat_en:'Painting', story:'Stille II ist das zweite Werk einer Reihe, die sich dem Thema innerer Ruhe widmet. Schwab arbeitete hier mit ausgesprochen reduzierter Farbpalette — fast ausschließlich Weiß- und Grautöne, unterbrochen von einem einzigen warmen Akzent. Das Kreisformat innerhalb des rechteckigen Trägers erzeugt eine meditative Wirkung, die Betrachtende zum Innehalten einlädt.', story_en:'Stille II is the second work in a series dedicated to inner stillness. Schwab worked here with an exceptionally reduced palette — almost exclusively whites and greys, broken by a single warm accent. The circular form within the rectangular support creates a meditative effect, inviting the viewer to pause.', svg:'<circle cx="32" cy="32" r="24" stroke="#C9A84C" stroke-width="0.8"/><circle cx="32" cy="32" r="12" stroke="#C9A84C" stroke-width="0.8"/>' },
    'Aufbruch':        { technique:'Acryl auf Leinwand', technique_en:'Acrylic on canvas', size:'100 × 80 cm', year:'2024', cat:'Malerei', cat_en:'Painting', story:'Aufbruch entstand in einer Phase intensiver Veränderung. Die nach oben strebende Dreiecksform ist bewusst gewählt — sie symbolisiert Bewegung, Entscheidung und den Mut zur Veränderung. Warme Ockertöne treffen auf kühle Blaugrau-Flächen; diese Spannung macht das Bild zu einem emotionalen Dokument seiner Entstehungszeit.', story_en:'Aufbruch (Departure) was created during a period of intense change. The upward-pointing triangular form is deliberate — it symbolises movement, decision and the courage to change. Warm ochres meet cool blue-grey fields; this tension makes the painting an emotional document of the time in which it was made.', svg:'<path d="M4 60 L32 4 L60 60Z" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Horizont':        { technique:'Acryl auf Papier', technique_en:'Acrylic on paper', size:'70 × 50 cm', year:'2023', cat:'Malerei', cat_en:'Painting', story:'Eine schlichte, fast minimalistische Arbeit — und doch eine der persönlichsten. Die horizontale Linie, die das Bild in zwei nahezu gleiche Hälften teilt, steht für den Moment kurz vor dem Sonnenuntergang. Schwab malte diese Serie während eines längeren Aufenthalts im ländlichen Raum, täglich zur gleichen Stunde, mit dem Blick auf denselben Horizont.', story_en:'A simple, almost minimalist work — yet one of the most personal. The horizontal line dividing the canvas into two near-equal halves represents the moment just before sunset. Schwab painted this series during an extended stay in the countryside, at the same hour each day, looking out at the same horizon.', svg:'<line x1="4" y1="30" x2="60" y2="30" stroke="#C9A84C" stroke-width="0.8"/><line x1="4" y1="38" x2="60" y2="38" stroke="#C9A84C" stroke-width="0.5" opacity="0.5"/>' },
    'Tiefe':           { technique:'Öl auf Leinwand', technique_en:'Oil on canvas', size:'100 × 75 cm', year:'2024', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Tiefe ist eines der technisch anspruchsvollsten Werke Schwabs. Die charakteristische Kurve wurde mit Ölfarbe in einem einzigen langen Pinselstrich gesetzt — ein Akt, der monatelange Vorbereitung und Konzentration erforderte. Die Schichten darunter, in Lasurtechnik aufgebaut, verleihen dem Werk eine Leuchtkraft, die erst beim längeren Betrachten vollständig sichtbar wird.', story_en:'Tiefe (Depth) is one of Schwab\'s most technically demanding works. The characteristic curve was set with oil paint in a single long brushstroke — an act requiring months of preparation and concentration. The layers beneath, built up in glazing technique, lend the work a luminosity that only becomes fully visible on prolonged viewing.', svg:'<path d="M8 56 Q32 8 56 56" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Stille I':        { technique:'Öl auf Leinwand', technique_en:'Oil on canvas', size:'120 × 90 cm', year:'2022', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Das erste Werk der Stille-Serie und Ausgangspunkt einer mehrjährigen Auseinandersetzung mit dem Thema Reduktion. Schwab verzichtete hier bewusst auf jede narrative Botschaft — das Bild soll kein Thema transportieren, sondern einen Zustand erzeugen. Mehrfach übermalt und wieder freigelegt, trägt die Oberfläche die Geschichte seiner eigenen Entstehung in sich.', story_en:'The first work of the Stille series and the starting point of a multi-year exploration of reduction. Schwab deliberately renounced all narrative message — the painting is not intended to carry a theme, but to generate a state. Repeatedly painted over and uncovered again, the surface carries the history of its own making.', svg:'<rect x="12" y="12" width="40" height="40" stroke="#C9A84C" stroke-width="0.8"/><rect x="22" y="22" width="20" height="20" stroke="#C9A84C" stroke-width="0.4" opacity="0.5"/>' },
    'Dämmerung':       { technique:'Öl auf Leinwand', technique_en:'Oil on canvas', size:'90 × 70 cm', year:'2023', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Die Tageszeit zwischen Tag und Nacht hat Schwab schon immer fasziniert. Dämmerung versucht, diesen flüchtigen Moment festzuhalten — nicht als Abbild, sondern als Stimmung. Der Halbkreis am unteren Bildrand ist kein Sonnen-Symbol, sondern das Ergebnis eines spontanen Eingriffs am späten Abend im Atelier, der das Bild aus seiner ursprünglichen Planung herausriss und in etwas Ungeplantes verwandelte.', story_en:'The hour between day and night has always fascinated Schwab. Dämmerung (Dusk) tries to capture this fleeting moment — not as an image, but as a mood. The semicircle at the lower edge is not a sun symbol; it arose from a spontaneous late-evening intervention in the studio that wrenched the painting out of its original plan into something unplanned.', svg:'<circle cx="32" cy="48" r="20" stroke="#C9A84C" stroke-width="0.8"/><line x1="4" y1="48" x2="60" y2="48" stroke="#C9A84C" stroke-width="0.4"/>' },
    'Landschaft I':    { technique:'Öl auf Leinwand', technique_en:'Oil on canvas', size:'140 × 100 cm', year:'2024', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Das großformatigste Ölbild dieser Kollektion. Schwab kehrte hier zu seinen Wurzeln zurück — figurativ, landschaftsbezogen, aber ohne jemals konkret zu werden. Die geschwungene Linie, die das Bild diagonal durchzieht, ist gleichzeitig Horizont, Fluss und Geste. Entstanden über einen Zeitraum von vier Monaten, ist Landschaft I eine Meditation über das Vergehen von Zeit im Raum.', story_en:'The largest oil painting in this collection. Schwab returned here to his roots — figurative, landscape-related, yet never quite concrete. The sweeping line crossing the canvas diagonally is at once a horizon, a river and a gesture. Created over four months, Landschaft I is a meditation on the passing of time through space.', svg:'<path d="M4 48 Q20 20 32 32 Q44 44 60 16" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Vergänglichkeit': { technique:'Aquarell auf Papier', technique_en:'Watercolour on paper', size:'60 × 50 cm', year:'2023', cat:'Grafik', cat_en:'Graphics', story:'Aquarell ist das Medium der Augenblicke — einmal gesetzt, lässt sich nichts zurücknehmen. Vergänglichkeit macht genau diese Eigenschaft zum Thema. Die rautenförmige Komposition im Zentrum scheint sich in die Ränder des Blattes aufzulösen, als ob die Form selbst im Begriff ist zu verschwinden. Ein Werk über Zeit, Erinnerung und das Loslassen.', story_en:'Watercolour is the medium of moments — once laid down, nothing can be taken back. Vergänglichkeit (Impermanence) makes this very quality its subject. The diamond-shaped composition at the centre appears to dissolve towards the edges of the sheet, as if the form itself is about to disappear. A work about time, memory and letting go.', svg:'<rect x="20" y="20" width="24" height="24" stroke="#C9A84C" stroke-width="0.8" transform="rotate(45 32 32)"/>' },
    'Morgenrot':       { technique:'Aquarell auf Papier', technique_en:'Watercolour on paper', size:'50 × 40 cm', year:'2023', cat:'Grafik', cat_en:'Graphics', story:'Morgenrot entstand in den frühen Morgenstunden, unmittelbar nach dem Erwachen, als eine Art malerisches Tagebucheintrag. Die konzentrischen Kreise entstanden ohne Vorlage, nur aus der Erinnerung an einen Traum. Schwab beschreibt dieses Werk als eines seiner persönlichsten — klein im Format, aber groß in dem, was es für ihn bedeutet.', story_en:'Morgenrot (Dawn) was created in the early morning hours, immediately upon waking, as a kind of painted diary entry. The concentric circles were made without a sketch, purely from the memory of a dream. Schwab describes this work as one of his most personal — small in format, but large in what it means to him.', svg:'<circle cx="32" cy="32" r="16" stroke="#C9A84C" stroke-width="0.8" opacity="0.7"/><circle cx="32" cy="32" r="8" stroke="#C9A84C" stroke-width="0.8"/>' },
    'Nebel':           { technique:'Aquarell auf Papier', technique_en:'Watercolour on paper', size:'70 × 55 cm', year:'2024', cat:'Grafik', cat_en:'Graphics', story:'Nebel ist das Ergebnis eines Experiments mit dem Nasstrocken-Verfahren. Das Papier wurde vollständig gewässert, bevor die ersten Pigmente aufgetragen wurden — das ließ die Farben ineinanderfließen auf eine Weise, die sich nicht planen lässt. Was als Versuch begann, wurde zu einem der ausdrucksstärksten Werke der Aquarell-Kollektion.', story_en:'Nebel (Fog) is the result of an experiment in wet-on-wet technique. The paper was fully saturated before the first pigments were applied — allowing the colours to bleed into one another in a way that cannot be planned. What began as an experiment became one of the most expressive works in the watercolour collection.', svg:'<line x1="8" y1="26" x2="56" y2="26" stroke="#C9A84C" stroke-width="0.8"/><line x1="12" y1="34" x2="52" y2="34" stroke="#C9A84C" stroke-width="0.6" opacity="0.6"/><line x1="18" y1="42" x2="46" y2="42" stroke="#C9A84C" stroke-width="0.4" opacity="0.35"/>' },
    'Fluss':           { technique:'Aquarell auf Papier', technique_en:'Watercolour on paper', size:'55 × 45 cm', year:'2023', cat:'Grafik', cat_en:'Graphics', story:'Die geschwungene Linie, die Fluss durchzieht, ist von einem Spaziergang am Inn entlehnt. Schwab skizzierte die Kurve des Flusses in einem einzigen Zug ins nasse Papier. Entstanden in weniger als zwanzig Minuten, ist Fluss der Beweis, dass Authentizität keine Zeit braucht — nur Präsenz.', story_en:'The sweeping line running through Fluss (River) was borrowed from a walk along the Inn. Schwab sketched the curve of the river in a single stroke into wet paper. Completed in under twenty minutes, Fluss is proof that authenticity needs no time — only presence.', svg:'<path d="M4 40 Q20 24 32 36 Q44 48 60 24" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Zwei Figuren I':           { img:'Images/C-F-2001-1entzerrt.jpg', technique:'Mischtechnik', technique_en:'Mixed media', size:'28 × 40 cm', year:'2001', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Zwei Figuren treten in einen stummen Dialog. Die hintere dem Betrachter abgewandt, im Rückenakt, während die vordere zu ahnen bleibt. Lila und Orange brechen die Dunkelheit auf — Farbe als Sprache des Unausgesprochenen. Signiert unten rechts.', story_en:'Two figures in silent dialogue. One turned away, seen from behind; the other only suggested. Lilac and orange pierce the darkness — colour as the language of the unspoken. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<line x1="20" y1="8" x2="20" y2="56" stroke="#C9A84C" stroke-width="0.8"/><line x1="44" y1="8" x2="44" y2="56" stroke="#C9A84C" stroke-width="0.8"/>' },
    'Badende':                  { img:'Images/C-F-2001-2entzerrt.JPG', technique:'Mischtechnik', technique_en:'Mixed media', size:'50 × 70 cm', year:'2001', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Eine lichte Figur in Weiß, Grau und Gelb hebt sich von zwei dunklen Torsi ab. Die Collagetechnik schichtet Körper übereinander — ein Fragment menschlicher Präsenz, das aus der Dunkelheit heraustritt. Signiert unten mittig.', story_en:'A luminous figure in white, grey and yellow emerges against two dark torsos. The collage technique layers bodies one over another — a fragment of human presence stepping out of the dark. Signed lower centre.', signed:'unten mittig', signed_en:'lower centre', svg:'<ellipse cx="32" cy="32" rx="14" ry="22" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Zwei Badende':             { img:'Images/C-F-2002-1entzerrt.JPG', technique:'Mischtechnik auf Papier', technique_en:'Mixed media on paper', size:'60 × 80 cm', year:'2002', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Violett durchzieht das Bild wie ein Stimmungston. Die Figuren sind gestreckt, fast gelöst von ihrer Form — begrenzt nur durch schwarze Konturen, die sie aus dem Farbstrom heraustreten lassen. Signiert unten rechts.', story_en:'Violet runs through the painting like an undertone. The figures are elongated, almost dissolved — held in place only by black contours that lift them out of the current of colour. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<line x1="22" y1="8" x2="22" y2="56" stroke="#C9A84C" stroke-width="0.8"/><line x1="42" y1="8" x2="42" y2="56" stroke="#C9A84C" stroke-width="0.6" opacity="0.6"/>' },
    'Figur und Torsi':          { img:'Images/C-F-2002-2entzerrt.JPG', technique:'Mischtechnik', technique_en:'Mixed media', size:'70 × 50 cm', year:'2002', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Grau als Farbe der Körper, dahinter die volle Palette: Violett, Rot, Ocker. Die Torsi scheinen in einer anderen Zeitebene zu existieren als der Hintergrund — Schwabs Schichttechnik erzeugt Tiefe als zeitlichen Abstand. Signiert unten rechts.', story_en:'Grey as the colour of bodies, behind it the full palette: violet, red, ochre. The torsos seem to inhabit a different temporal layer from the background — Schwab\'s layering technique creates depth as temporal distance. Signed lower right.', hasFrame:true, signed:'unten rechts', signed_en:'lower right', svg:'<circle cx="24" cy="32" r="12" stroke="#C9A84C" stroke-width="0.8" fill="none"/><circle cx="44" cy="32" r="8" stroke="#C9A84C" stroke-width="0.6" fill="none" opacity="0.6"/>' },
    'Langgezogene Figurengruppe':{ img:'Images/C-F-2002-3entzerrt.JPG', technique:'Mischtechnik', technique_en:'Mixed media', size:'60 × 80 cm', year:'2002', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Sind es Tanzende oder Skelette? Schwab lässt die Frage offen. Schwarze Umrisse bewegen sich gegen leuchtende Farben — ein Bild, das Energie und Vergänglichkeit in einem einzigen Atem vereint. Signiert unten rechts.', story_en:'Dancers, or skeletons? Schwab leaves the question open. Black outlines move against vivid colours — a single image holding energy and transience in the same breath. Signed lower right.', hasFrame:true, signed:'unten rechts', signed_en:'lower right', svg:'<path d="M16 56 L32 8 L48 56" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Totenkult':                { img:'Images/C-F-2003-1entzerrt.JPG', technique:'Acrylcollage', technique_en:'Acrylic collage', size:'45 × 72 cm', year:'2003', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Der Titel deutet auf Ritual und Übergang. Zwei Frauenfiguren — eine dem Betrachter zugewandt, eine abgewandt — verbunden durch das Violett, das die Komposition durchpulst. Blau, Rot und Schwarz grundieren das Bild wie ein uraltes Zeremoniell. Signiert unten links.', story_en:'The title speaks of ritual and passage. Two female figures — one facing the viewer, one turned away — connected by the violet that pulses through the composition. Blue, red and black underpin the image like an ancient ceremony. Signed lower left.', signed:'unten links', signed_en:'lower left', svg:'<rect x="8" y="8" width="48" height="48" stroke="#C9A84C" stroke-width="0.8" fill="none"/><line x1="8" y1="32" x2="56" y2="32" stroke="#C9A84C" stroke-width="0.4" opacity="0.5"/>' },
    'Bunte Figur':              { img:'Images/C-F-2004-1entzerrt.JPG', technique:'Acrylcollage auf Pressspahn', technique_en:'Acrylic collage on hardboard', size:'48 × 60 cm', year:'2004', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Gegen das Dunkel setzt Schwab die Figur als reines Farbereignis. Die Acrylcollage auf Pressspahn — ein grobes, unprätentiöses Trägermaterial — gibt dem Werk eine erdige Energie. Eine Figur, die sich aus dem Untergrund herausarbeitet. Signiert unten rechts.', story_en:'Against the dark, Schwab sets the figure as a pure event of colour. The acrylic collage on hardboard — a rough, unassuming support — gives the work an earthy energy. A figure working its way up from the ground. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<circle cx="32" cy="24" r="10" stroke="#C9A84C" stroke-width="0.8" fill="none"/><line x1="32" y1="34" x2="32" y2="56" stroke="#C9A84C" stroke-width="0.8"/>' },
    'Goldene Figur':            { img:'Images/C-F-2004-2entzerrt.JPG', technique:'Mischtechnik auf Leinwand', technique_en:'Mixed media on canvas', size:'48 × 68 cm', year:'2004', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Gold krönt den Kopf — ob als Aureole, als Maske oder als Zeichen bleibt unentschieden. Die Figur steht aufrecht, von schwarzen und blauen Streifen gerahmt und zugleich fragmentiert. Schwab verleiht dem Körper eine sakrale Präsenz. Signiert unten rechts.', story_en:'Gold crowns the head — whether as aureole, mask or sign remains undecided. The figure stands upright, framed and at the same time fragmented by black and blue stripes. Schwab gives the body a sacral presence. Signed lower right.', hasFrame:true, signed:'unten rechts', signed_en:'lower right', svg:'<circle cx="32" cy="16" r="8" stroke="#C9A84C" stroke-width="0.9" fill="none"/><line x1="32" y1="24" x2="32" y2="56" stroke="#C9A84C" stroke-width="0.8"/><line x1="20" y1="36" x2="44" y2="36" stroke="#C9A84C" stroke-width="0.6"/>' },
    'Kopf im Profil':           { img:'Images/C-F-2004-3entzerrt.JPG', technique:'Deckfarben auf Papier', technique_en:'Gouache on paper', size:'25 × 33 cm', year:'2004', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Das Profil — älteste Form des Porträts. Schwab kehrt zu ihr zurück und entzieht ihr das Individuelle: kein Name, keine Erkennung. Nur die Silhouette eines Kopfes gegen das Dunkel. Reduktion als Würde. Signiert unten rechts.', story_en:'The profile — oldest form of portraiture. Schwab returns to it and strips away the individual: no name, no recognition. Only the silhouette of a head against the dark. Reduction as dignity. Signed lower right.', hasFrame:true, signed:'unten rechts', signed_en:'lower right', svg:'<path d="M20 12 Q40 12 40 32 Q40 52 20 52 Q20 32 20 12Z" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Hockende Figur':           { img:'Images/C-F-2004-4entzerrt.JPG', technique:'Pastell auf Papier', technique_en:'Pastel on paper', size:'25 × 33 cm', year:'2004', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Die Hocke — eine archaische Körperhaltung, die Schutz und Konzentration zugleich bedeutet. Farbe trifft auf Farbe: die Figur droht im Hintergrund aufzugehen, nur die Kontur trennt noch Innen von Außen. Signiert unten rechts.', story_en:'The crouch — an archaic posture, signifying shelter and concentration alike. Colour meets colour: the figure threatens to dissolve into the background; only the contour still separates inside from outside. Signed lower right.', hasFrame:true, signed:'unten rechts', signed_en:'lower right', svg:'<path d="M20 20 Q32 8 44 20 Q48 36 32 52 Q16 36 20 20Z" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Zwei Figuren II':          { img:'Images/C-F-2005-1entzerrt.JPG', technique:'Collage aus Drucken', technique_en:'Collage from prints', size:'50 × 70 cm', year:'2005', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Zwei Umrisse, frontal, sich berührend — in einem bootsähnlichen Gefäß vereint. Schwab collagiert Drucke zu einem Bild der Nähe und des gemeinsamen Getragenseins. Zwei Körper, die gemeinsam einem Ziel entgegentreiben. Signiert unten rechts.', story_en:'Two outlines, frontal, touching — united within a boat-like vessel. Schwab assembles prints into an image of closeness and shared passage. Two bodies drifting together towards a common destination. Signed lower right.', hasFrame:true, signed:'unten rechts', signed_en:'lower right', svg:'<ellipse cx="24" cy="32" rx="10" ry="18" stroke="#C9A84C" stroke-width="0.8" fill="none"/><ellipse cx="40" cy="32" rx="10" ry="18" stroke="#C9A84C" stroke-width="0.6" fill="none" opacity="0.6"/>' },
    'Kuss':                     { img:'Images/C-F-2005-2entzerrt.JPG', technique:'Mischtechnik', technique_en:'Mixed media', size:'50 × 70 cm', year:'2005', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Rot — die Farbe von Blut und Begehren. Zwei Figuren finden sich im Kuss und verschmelzen fast zur Einheit. Die Mischtechnik löst die Grenzen zwischen den Körpern auf: wo endet einer, wo beginnt der andere? Signiert unten rechts.', story_en:'Red — the colour of blood and desire. Two figures meet in a kiss and nearly merge into one. The mixed media dissolves the boundaries between the bodies: where does one end, where does the other begin? Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<path d="M8 32 Q32 4 56 32" stroke="#C9A84C" stroke-width="0.8" fill="none"/><path d="M8 32 Q32 60 56 32" stroke="#C9A84C" stroke-width="0.8" fill="none"/>' },
    'Badende in blau':          { img:'Images/C-F-2005-3entzerrt.JPG', technique:'Mischtechnik', technique_en:'Mixed media', size:'24 × 34 cm', year:'2005', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Rückenakte — Körper, die sich entziehen. In Blau getaucht, zeigen die Figuren dem Betrachter das Schweigen ihrer Rücken. Eine Intimität, die nicht preisgibt. Das Blaue ist keine Farbe — es ist Atmosphäre. Signiert unten rechts.', story_en:'Figures seen from behind — bodies that withhold themselves. Steeped in blue, they show the viewer the silence of their backs. An intimacy that reveals nothing. The blue is not a colour — it is an atmosphere. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<path d="M16 12 Q24 8 32 12 Q40 8 48 12" stroke="#C9A84C" stroke-width="0.8" fill="none"/><path d="M12 40 Q32 28 52 40" stroke="#C9A84C" stroke-width="0.6" fill="none" opacity="0.7"/>' },
    'Paar':                     { img:'Images/C-F-2005-4.JPG', technique:'Collage aus Graphik', technique_en:'Collage from graphic prints', size:'–', year:'2005', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Ein Paar — hintereinander, nicht nebeneinander. Die Brauntöne und das graphische Ausgangsmaterial verleihen den Figuren etwas Archaisches, fast Monumentales. Zweiheit als Einheit: der eine Körper als Schatten des anderen. Signiert unten rechts.', story_en:'A couple — one behind the other, not side by side. The brown tones and the graphic source material give the figures an archaic, almost monumental quality. Twoness as oneness: one body as the shadow of the other. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<line x1="28" y1="8" x2="28" y2="56" stroke="#C9A84C" stroke-width="0.9"/><line x1="36" y1="8" x2="36" y2="56" stroke="#C9A84C" stroke-width="0.5" opacity="0.5"/>' },
    'Zwei Frauen':              { img:'Images/C-F-2005-5.JPG', technique:'Mischtechnik', technique_en:'Mixed media', size:'65 × 50 cm', year:'2005', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Das schwarze Quadrat im Hintergrund ist kein Zufall — eine bewusste Setzung. Zwei Frauenfiguren davor: eine vollständig, eine als Hüftfigur. Das Quadrat als Folie, als Spiegel, als Leerstelle, vor der der menschliche Körper umso mehr spricht. Signiert unten rechts.', story_en:'The black square in the background is no accident — a deliberate gesture. Two female figures before it: one complete, one cropped at the waist. The square as backdrop, as mirror, as void — against which the human body speaks all the more strongly. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<rect x="16" y="16" width="32" height="32" stroke="#C9A84C" stroke-width="0.8" fill="none"/><line x1="32" y1="8" x2="32" y2="16" stroke="#C9A84C" stroke-width="0.6"/>' },
    'Meer':                     { img:'Images/C-F-2005-6entzerrt.JPG', technique:'Grafikkollage', technique_en:'Graphic collage', size:'33 × 24 cm', year:'2005', cat:'Collage & Zeichnungen', cat_en:'Collage & Drawings', story:'Das einzige Landschaftsbild der Serie und zugleich eines der stillsten. Die Grafikkollage übersetzt das Meer in Schichten und Streifen — Wasser als Struktur, nicht als Abbild. Dahinter: ein schmaler Streifen Land, kaum mehr als eine Ahnung. Signiert unten rechts.', story_en:'The only landscape in the series, and one of its quietest works. The graphic collage translates the sea into layers and strips — water as structure, not as image. Beyond it: a narrow strip of land, little more than a suggestion. Signed lower right.', signed:'unten rechts', signed_en:'lower right', svg:'<path d="M4 36 Q16 28 28 36 Q40 44 52 36 Q60 32 60 32" stroke="#C9A84C" stroke-width="0.8" fill="none"/><line x1="4" y1="24" x2="60" y2="24" stroke="#C9A84C" stroke-width="0.4" opacity="0.5"/>' },
    'Kniende Figur':            { img:'Images/Plastik-1-a.jpg', views:['Images/Plastik-1-a.jpg','Images/Plastik-1-b.jpg'], technique:'Plastik, goldfarben gefasst', technique_en:'Sculpture, gold-patinated', size:'', year:'', cat:'Plastik', cat_en:'Sculpture', story:'Eine kniende Figur, auf das Wesentliche reduziert: Schenkel, Hüfte, ein aufstrebender Oberkörper, der in einer offenen Form endet. Feine, parallel gezogene Rillen folgen den Rundungen und lassen das Licht über die goldene Oberfläche wandern.', story_en:'A kneeling figure reduced to its essentials: thigh, hip and a rising torso that ends in an open form. Fine parallel grooves follow the curves and let the light travel across the golden surface.', svg:'' },
    'Weiblicher Torso':         { img:'Images/Plastik-2-a.jpg', views:['Images/Plastik-2-a.jpg','Images/Plastik-2-b.jpg'], technique:'Plastik, goldfarben gefasst', technique_en:'Sculpture, gold-patinated', size:'', year:'', cat:'Plastik', cat_en:'Sculpture', story:'Von vorne fast ein Gefäß, von der Seite eine kniende Gestalt — der Torso verändert sich mit jedem Blickwinkel. Die dunkle Patina zwischen dem Gold betont die Spuren der Bearbeitung und gibt der Form Tiefe.', story_en:'From the front almost a vessel, from the side a kneeling figure — the torso changes with every viewpoint. The dark patina between the gold accentuates the traces of the working process and gives the form depth.', svg:'' },
    'Verhüllte Figur':          { img:'Images/Plastik-3-a.jpg', views:['Images/Plastik-3-a.jpg','Images/Plastik-3-b.jpg'], technique:'Plastik, goldfarben gefasst', technique_en:'Sculpture, gold-patinated', size:'', year:'', cat:'Plastik', cat_en:'Sculpture', story:'Eine sitzende Gestalt, wie in einen weiten Umhang gehüllt. Der Stoff fällt in großen, geriefelten Flächen, aus denen sich Kopf und Schulter herausschieben. Risse und Unebenheiten in der Fassung sind Teil des Ausdrucks.', story_en:'A seated figure, as if wrapped in a wide cloak. The drapery falls in broad, ribbed planes from which head and shoulder emerge. Cracks and irregularities in the surface are part of its expression.', svg:'' },
    'Torso mit Rillen':         { img:'Images/Plastik-4-a.jpg', views:['Images/Plastik-4-a.jpg','Images/Plastik-4-b.jpg'], technique:'Plastik, goldfarben gefasst', technique_en:'Sculpture, gold-patinated', size:'', year:'', cat:'Plastik', cat_en:'Sculpture', story:'Dichte, senkrecht und bogenförmig geführte Rillen überziehen den ganzen Körper wie eine zweite Haut. Von hinten ruhig und symmetrisch, von der Seite in Bewegung: Die Plastik lebt vom Wechsel der Ansichten.', story_en:'Dense grooves, running vertically and in arcs, cover the whole body like a second skin. Calm and symmetrical from behind, full of movement from the side: the sculpture lives from its changing views.', svg:'' },
    'Stehender Torso':          { img:'Images/Plastik-5-a.jpg', views:['Images/Plastik-5-a.jpg','Images/Plastik-5-b.jpg'], technique:'Plastik, goldfarben gefasst', technique_en:'Sculpture, gold-patinated', size:'', year:'', cat:'Plastik', cat_en:'Sculpture', story:'Ein schlanker Torso, der auf einem schmalen Fuß balanciert. Die ausladende Rundung zur Seite und die feinen Kratzspuren im Gold geben der kleinen Form eine erstaunliche Spannung.', story_en:'A slender torso balancing on a narrow base. The swelling curve to one side and the fine scratch marks in the gold give the small form a remarkable tension.', svg:'' },
    'Sitzende Figur':           { img:'Images/Plastik-6-a.jpg', views:['Images/Plastik-6-a.jpg','Images/Plastik-6-b.jpg'], technique:'Plastik, goldfarben gefasst', technique_en:'Sculpture, gold-patinated', size:'', year:'', cat:'Plastik', cat_en:'Sculpture', story:'Eine sitzende Figur, die Arme um die angezogenen Knie gelegt — in sich gekehrt, ohne Kopf, ganz Körperhaltung. Die durchbrochenen Zwischenräume und die tief eingeritzten Linien machen die Plastik von allen Seiten lesbar.', story_en:'A seated figure with arms wrapped around drawn-up knees — turned inward, headless, pure posture. The open spaces and deeply incised lines make the sculpture legible from every side.', svg:'' },
  };

  // ══ Rundgang: Werke in Raum 4 (Malerei) und Raum 5 (Grafik) ══
  // Je 8 Plätze, gehängt wie in Raum 1 (Reihe für Reihe: linke Wand, dann rechte Wand).
  // • Platzhalter: ein Titel, der (noch) nicht mit Bild in ARTWORKS steht
  //   → dunkle Platzhalter-Fläche, Hover „Werk folgt".
  // • Echtes Werk: Werk in ARTWORKS eintragen (img, technique, size, year, cat …)
  //   und seinen Titel hier an die Stelle des Platzhalters setzen
  //   → Bild hängt im Rundgang, Hover/Klick/Werkansicht wie bei allen Werken.
  const VR_ROOM_WORKS = {
    malerei: ['Malerei I','Malerei II','Malerei III','Malerei IV','Malerei V','Malerei VI','Malerei VII','Malerei VIII'],
    grafik:  ['Grafik I','Grafik II','Grafik III','Grafik IV','Grafik V','Grafik VI','Grafik VII','Grafik VIII'],
  };
  // Anzeigename eines Platzhalters („Malerei I") – im englischen Modus übersetzt; der deutsche Name bleibt Schlüssel
  function _roomWorkLabel(t) {
    return _lang === 'en' ? t.replace(/^Malerei /, 'Painting ').replace(/^Grafik /, 'Graphic Work ') : t;
  }

  // Meta-Zeile "Technik · Maße · Jahr" – leere Angaben (z.B. bei Plastiken) werden ausgelassen
  function _artMeta(d, isEN) {
    return [isEN ? d.technique_en : d.technique, d.size, d.year].filter(Boolean).join('  ·  ');
  }
  // Die Website verkauft nichts: „Besichtigung anfragen“ öffnet nur das E-Mail-Programm des Besuchers
  // mit vorausgefülltem Betreff – über die Website selbst werden keine Daten übertragen
  const CONTACT_MAIL = 'info@horstschwab.de';
  function _viewingMail(title) {
    return 'mailto:' + CONTACT_MAIL + '?subject=' + encodeURIComponent((_lang === 'en' ? 'Viewing request: ' : 'Besichtigungsanfrage: ') + title);
  }

  /* ══ LANGUAGE ══ */
  let _lang = localStorage.getItem('lang') || 'de';

  const I18N = {
    de: {
      'nav-werke':'Werke','nav-bio':'Leben','nav-werk':'Das Werk','nav-ausst':'Ausstellungen','nav-rundgang':'Rundgang',
      'nav-socials':'Socials','nav-kontakt':'Kontakt',
      'hero-label':'Malerei · Grafik · Plastik','hero-enter':'Werke entdecken','hero-enter-ghost':'→ Rundgang starten',
      'intro-label':'Willkommen',
      'gal-label':'Ausgewählte Werke','gal-heading':'Werke aus sechs Jahrzehnten',
      'cat-acryl':'Malerei','cat-oel':'Collage \u0026 Zeichnungen','cat-aquarell':'Grafik',
      'cat-view-1':'Kollektion ansehen','cat-view-2':'Kollektion ansehen','cat-view-3':'Kollektion ansehen','cat-view-4':'Kollektion ansehen',
      'coll-back-acryl-t':'Zurück','coll-back-oel-t':'Zurück','coll-back-aquarell-t':'Zurück','coll-back-mixed-t':'Zurück',
      'coll-head-acryl':'Malerei','coll-head-oel':'Collage &amp;<br>Zeichnungen','coll-head-aquarell':'Grafik','coll-head-mixed':'Plastik',
      'soc-label':'Folgen Sie uns','soc-heading':'Bleiben Sie in Verbindung','soc-sub':'Neuigkeiten zu Ausstellungen und zum Werk von Horst Schwab.',
      'soc-cal-label':'Termin buchen','soc-cal-sub':'Besichtigung vereinbaren',
      'cal-success-text':'Ihr E-Mail-Programm öffnet sich.','cal-success-sub':'Bitte senden Sie die vorbereitete E-Mail ab – wir bestätigen den Termin. Falls sich nichts öffnet: info@horstschwab.de',
      'kon-label':'Kontakt','kon-heading':'Fragen zum Werk','kon-sub':'Schreiben Sie uns bei Fragen zum Werk oder um eine private Besichtigung zu vereinbaren.',
      'kon-email-label':'E-Mail','kon-studio-label':'Atelier','kon-studio-val':'Nach Vereinbarung',
      'ad-back-text':'Zurück','ad-story-head':'Über dieses Werk','ad-offer-btn':'Besichtigung anfragen','ad-rundgang-btn':'Im Rundgang entdecken',
      'fav-back-text':'Zurück','fav-heading':'Merkliste',
      'fav-empty-label':'Noch keine Werke gespeichert.',
      'ad-tech-label':'Technik','ad-size-label':'Format','ad-year-label':'Jahr','ad-cat-label':'Kategorie','ad-sign-label':'Signatur',
      'ad-sub-text':'Originalwerk  ·  Bild folgt in Kürze',
      'bio-label':'Leben','bio-teaser-label':'Leben',
      'cat-mixed':'Plastik',
    },
    en: {
      'nav-werke':'Works','nav-bio':'Life','nav-werk':'The Work','nav-ausst':'Exhibitions','nav-rundgang':'Tour',
      'nav-socials':'Socials','nav-kontakt':'Contact',
      'hero-label':'Painting · Graphic Art · Sculpture','hero-enter':'Discover the Works','hero-enter-ghost':'→ Enter Tour',
      'intro-label':'Welcome',
      'gal-label':'Selected Works','gal-heading':'Works from Six Decades',
      'cat-acryl':'Painting','cat-oel':'Collage \u0026 Drawings','cat-aquarell':'Graphics',
      'cat-view-1':'View Collection','cat-view-2':'View Collection','cat-view-3':'View Collection','cat-view-4':'View Collection',
      'coll-back-acryl-t':'Back','coll-back-oel-t':'Back','coll-back-aquarell-t':'Back','coll-back-mixed-t':'Back',
      'coll-head-acryl':'Painting','coll-head-oel':'Collage &amp;<br>Drawings','coll-head-aquarell':'Graphics','coll-head-mixed':'Sculpture',
      'soc-label':'Follow Us','soc-heading':'Stay Connected','soc-sub':'News about exhibitions and the work of Horst Schwab.',
      'soc-cal-label':'Book appointment','soc-cal-sub':'Schedule a viewing',
      'cal-success-text':'Your e-mail program is opening.','cal-success-sub':'Please send the prepared e-mail – we will confirm the appointment. If nothing opens: info@horstschwab.de',
      'kon-label':'Contact','kon-heading':'Questions about the Work','kon-sub':'Write to us with questions about the work or to arrange a private viewing.',
      'kon-email-label':'E-Mail','kon-studio-label':'Studio','kon-studio-val':'By appointment',
      'ad-back-text':'Back','ad-story-head':'About This Work','ad-offer-btn':'Request a Viewing','ad-rundgang-btn':'Discover in Virtual Tour',
      'fav-back-text':'Back','fav-heading':'Wishlist',
      'fav-empty-label':'No works saved yet.',
      'ad-tech-label':'Technique','ad-size-label':'Format','ad-year-label':'Year','ad-cat-label':'Category','ad-sign-label':'Signature',
      'ad-sub-text':'Original work  ·  Image coming soon',
      'bio-label':'Life','bio-teaser-label':'Life',
      'cat-mixed':'Sculpture',
    }
  };

  function setLang(lang) {
    _lang = lang;
    document.documentElement.lang = lang;   // auch Kalender und Meldungen richten sich danach
    document.title = lang === 'en' ? 'Horst Schwab (1935–2017) – Painting, Graphic Art, Sculpture' : 'Horst Schwab (1935–2017) – Malerei, Grafik, Plastik';
    const t = I18N[lang];
    // Statische Texte ohne eigene ID: Englisch steht in data-en (bzw. data-en-<Attribut>),
    // das Deutsche wird beim ersten Umschalten in data-de gemerkt
    document.querySelectorAll('[data-en]').forEach(function(el) {
      if (el.dataset.de == null) el.dataset.de = el.innerHTML;
      el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.de;
    });
    ['placeholder', 'aria-label', 'title', 'alt'].forEach(function(a) {
      document.querySelectorAll('[data-en-' + a + ']').forEach(function(el) {
        if (!el.hasAttribute('data-de-' + a)) el.setAttribute('data-de-' + a, el.getAttribute(a) || '');
        el.setAttribute(a, el.getAttribute(lang === 'en' ? 'data-en-' + a : 'data-de-' + a));
      });
    });
    document.querySelectorAll('.fav-btn[data-title]').forEach(function(b) { b.title = lang === 'en' ? 'Wishlist' : 'Merkliste'; });
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
    if (bioRoles) bioRoles.innerHTML = lang === 'en'
      ? '<span class="nw">PAINTER &nbsp;|&nbsp; GRAPHIC ARTIST</span><span class="kat-sep"> &nbsp;|&nbsp; </span><span class="nw">SCULPTOR &nbsp;|&nbsp; POET</span>'
      : '<span class="nw">MALER &nbsp;|&nbsp; GRAFIKER</span><span class="kat-sep"> &nbsp;|&nbsp; </span><span class="nw">BILDHAUER &nbsp;|&nbsp; LYRIKER</span>';
    // update card metas
    document.querySelectorAll('.coll-card').forEach(function(card) {
      var titleEl = card.querySelector('.coll-card-title');
      if (!titleEl) return;
      var d = ARTWORKS[titleEl.textContent.trim()];
      if (!d) return;
      var meta = card.querySelector('.coll-card-meta');
      if (meta) meta.textContent = _artMeta(d, lang === 'en');
    });
    // Besichtigungs-Links: Betreff in der eingestellten Sprache
    document.querySelectorAll('a.coll-offer-btn[data-title]').forEach(function(a) { a.href = _viewingMail(a.dataset.title); });
    if (window._heroArtRelabel) window._heroArtRelabel();
    if (window._bioCapRelabel) window._bioCapRelabel();
    // re-render open artwork if any
    var adEl = document.getElementById('artwork-detail');
    if (_adCurrentTitle && adEl && adEl.classList.contains('active')) openArtwork(_adCurrentTitle, true);
    // re-render favs if open
    var favEl = document.getElementById('fav-overlay');
    if (favEl && favEl.classList.contains('active')) renderFavs();
  }

  // Sprache nur speichern, wenn der Besucher selbst umschaltet (siehe Datenschutz: lokale Speicherung)
  function toggleLang() { setLang(_lang === 'de' ? 'en' : 'de'); try { localStorage.setItem('lang', _lang); } catch (e) {} }

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
    _navOpen('favs');
  }

  function closeFavs() {
    document.getElementById('fav-overlay').classList.remove('active');
    document.body.style.overflow = '';
    _navClosed('favs');
  }

  let _favEmptyMsg = null;
  function renderFavs() {
    const grid = document.getElementById('fav-grid');
    const emptyMsg = _favEmptyMsg = _favEmptyMsg || document.getElementById('fav-empty-msg');
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
      // Merkliste offen lassen, damit man nach dem Zurück wieder hierher kommt
      card.onclick = function() { openArtwork(title); };
      card.innerHTML =
        '<div class="coll-card-body">' +
          '<p class="coll-card-title">' + title + '</p>' +
          '<p class="coll-card-meta">' + _artMeta(d, _lang === 'en') + '</p>' +
        '</div>' +
        '<button class="fav-btn fav-active" data-title="' + title + '" onclick="event.stopPropagation();toggleFav(\'' + title + '\')">♥</button>';
      // Echtes Bild verwenden (falls vorhanden), sonst Platzhalter-Canvas
      const imgWrap = document.createElement('div');
      imgWrap.className = 'coll-card-img';
      if (d.img) {
        const img = document.createElement('img');
        // verkleinerte Fassung (Images/web, lange Kante 1200 px) – das Original nur in der Werkansicht
        img.loading = 'lazy'; img.decoding = 'async'; img.src = d.img.replace('Images/', 'Images/web/'); img.alt = title;
        imgWrap.appendChild(img);
      } else {
        imgWrap.appendChild(_makeArtworkCanvas(title, 400, 300));
      }
      card.insertBefore(imgWrap, card.firstChild);
      grid.appendChild(card);
    });
  }

  /* ══ ARTWORK DETAIL ══ */
  let _adCurrentTitle = '';
  let _adParentCol = null;
  let _adParentScrollTop = 0;
  let _adFromRundgang = false;
  let _adFromFavs = false;

  function openArtwork(title, rerender, fromRundgang) {
    const d = ARTWORKS[title]; if (!d) return;
    _adCurrentTitle = title;
    if (!rerender) {
      const favEl = document.getElementById('fav-overlay');
      _adFromFavs = !!(favEl && favEl.classList.contains('active'));
      const activeCol = document.querySelector('.coll-overlay.active:not(#fav-overlay)');
      _adParentCol = activeCol ? activeCol.id.replace('coll-', '') : null;
      _adParentScrollTop = activeCol ? activeCol.scrollTop : 0;
      _adFromRundgang = !!fromRundgang;
    }
    if (!rerender) _navOpen('art:' + title);
    const isEN = _lang === 'en';
    const cat  = isEN ? d.cat_en : d.cat;
    const tech = isEN ? d.technique_en : d.technique;
    const story = isEN ? d.story_en : d.story;
    const t = I18N[_lang];
    document.getElementById('ad-topbar-title').textContent = cat + '  ·  ' + title;
    document.getElementById('ad-eyebrow').textContent = cat;
    document.getElementById('ad-title').textContent = title;
    document.getElementById('ad-meta-line').textContent = _artMeta(d, isEN);
    document.getElementById('ad-story').textContent = story;
    if (document.getElementById('ad-story-head')) document.getElementById('ad-story-head').textContent = t['ad-story-head'];
    const _offer = document.getElementById('ad-offer-btn');
    if (_offer) { _offer.textContent = t['ad-offer-btn']; _offer.href = _viewingMail(title); }
    // nur bei Werken mit Bild – bei Platzhaltern entfällt der ganze Fußbereich
    const _adFoot = document.getElementById('ad-info-footer');
    if (_adFoot) _adFoot.style.display = d.img ? '' : 'none';
    if (document.getElementById('ad-rundgang-btn-text')) document.getElementById('ad-rundgang-btn-text').textContent = (_lang==='en' ? '▶  ' : '▶  ') + t['ad-rundgang-btn'];
    if (document.getElementById('ad-back-text')) document.getElementById('ad-back-text').textContent = _adFromRundgang ? (_lang==='en' ? 'Back to Tour' : 'Zurück zum Rundgang') : t['ad-back-text'];
    // "Im Rundgang entdecken"-Button ausblenden, wenn die Detailansicht aus dem
    // Rundgang heraus geöffnet wurde (der obere "Zurück zum Rundgang"-Button bleibt).
    const _rundgangBtn = document.getElementById('ad-rundgang-btn');
    if (_rundgangBtn) _rundgangBtn.style.display = _adFromRundgang ? 'none' : '';
    const subTxt = t['ad-sub-text'];
    const adImgEl = document.getElementById('ad-img-el');
    adImgEl.innerHTML = '';
    _adViews = d.views || null; _adViewIdx = 0;
    if (d.img) {
      const img = document.createElement('img');
      img.src = d.img; img.alt = title;
      adImgEl.appendChild(img);
      // Vorladen der weiteren Ansichten, damit der Wechsel ohne Flackern passiert
      if (_adViews) _adViews.slice(1).forEach(src => { const p = new Image(); p.src = src; });
    } else {
      const cv = _makeArtworkCanvas(title, 500, 620);
      cv.className = 'ad-placeholder-canvas';
      adImgEl.appendChild(cv);
    }
    document.getElementById('ad-details-grid').innerHTML =
      '<div class="ad-detail-item"><span class="ad-detail-label">' + t['ad-tech-label'] + '</span><span class="ad-detail-value">' + tech + '</span></div>' +
      (d.size ? '<div class="ad-detail-item"><span class="ad-detail-label">' + t['ad-size-label'] + '</span><span class="ad-detail-value">' + d.size + '</span></div>' : '') +
      (d.year ? '<div class="ad-detail-item"><span class="ad-detail-label">' + t['ad-year-label'] + '</span><span class="ad-detail-value">' + d.year + '</span></div>' : '') +
      '<div class="ad-detail-item"><span class="ad-detail-label">' + t['ad-cat-label'] + '</span><span class="ad-detail-value">' + cat + '</span></div>' +
      (d.signed ? '<div class="ad-detail-item"><span class="ad-detail-label">' + t['ad-sign-label'] + '</span><span class="ad-detail-value">' + (isEN ? d.signed_en : d.signed) + '</span></div>' : '');
    // fav heart
    const adBtn = document.getElementById('ad-fav-btn');
    if (adBtn) { adBtn.textContent = _favs.has(title) ? '♥' : '♡'; adBtn.classList.toggle('fav-active', _favs.has(title)); }
    _adRenderViewsNav();
    // reset zoom
    _adScale = 1; _adTx = 0; _adTy = 0;
    _adApplyTransform();
    document.getElementById('artwork-detail').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /* Mehrere Ansichten (Plastiken): Slider in der Detailansicht */
  let _adViews = null;
  let _adViewIdx = 0;
  function _adRenderViewsNav() {
    const nav = document.getElementById('ad-views-nav');
    if (!nav) return;
    const n = _adViews ? _adViews.length : 0;
    nav.style.display = n > 1 ? '' : 'none';
    document.getElementById('artwork-detail').classList.toggle('has-views', n > 1);
    if (n < 2) return;
    const lbl = _lang === 'en' ? 'View' : 'Ansicht';
    nav.querySelector('.views-dots').innerHTML = _adViews.map((_, i) =>
      '<button class="views-dot' + (i === _adViewIdx ? ' active' : '') + '" aria-label="' + lbl + ' ' + (i + 1) + '" onclick="adShowView(' + i + ')"></button>'
    ).join('');
    nav.querySelector('.views-count').textContent = lbl + ' ' + (_adViewIdx + 1) + ' / ' + n;
  }
  function adShowView(i) {
    if (!_adViews) return;
    const n = _adViews.length;
    _adViewIdx = (i + n) % n;
    const img = document.querySelector('#ad-img-el img');
    if (img) img.src = _adViews[_adViewIdx];
    _adScale = 1; _adTx = 0; _adTy = 0;
    _adApplyTransform();
    _adRenderViewsNav();
  }
  document.addEventListener('keydown', function(e) {
    if (!_adViews || _adViews.length < 2) return;
    if (!document.getElementById('artwork-detail').classList.contains('active')) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); adShowView(_adViewIdx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); adShowView(_adViewIdx + 1); }
  });
  // Wischen auf Touch-Geräten
  (function() {
    const panel = document.getElementById('ad-img-panel');
    if (!panel) return;
    let sx = null, sy = 0;
    panel.addEventListener('touchstart', e => {
      if (e.touches.length !== 1 || _adScale > 1) { sx = null; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    panel.addEventListener('touchend', e => {
      if (sx === null || !_adViews || _adViews.length < 2) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) adShowView(_adViewIdx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  })();

  /* Mehrere Ansichten: Slider auf den Kollektionskarten */
  function cardSetView(btn, idx) {
    const wrap = btn.closest('.coll-card-views');
    const imgs = wrap.querySelectorAll('img');
    const next = (idx + imgs.length) % imgs.length;
    imgs.forEach((im, i) => im.classList.toggle('active', i === next));
    wrap.querySelectorAll('.views-dot').forEach((d, i) => d.classList.toggle('active', i === next));
  }
  function cardShowView(btn, dir) {
    const imgs = btn.closest('.coll-card-views').querySelectorAll('img');
    const cur = [...imgs].findIndex(im => im.classList.contains('active'));
    cardSetView(btn, cur + dir);
  }

  function closeArtwork() {
    _navClosed('art:' + _adCurrentTitle);
    document.getElementById('artwork-detail').classList.remove('active');
    document.body.style.overflow = '';
    if (_adFromRundgang) {
      _adFromRundgang = false;
      // gallery-vr bleibt sichtbar — kein weiterer Eingriff nötig
    } else if (_adFromFavs) {
      _adFromFavs = false;
      // Merkliste liegt noch darunter — wieder aktiv halten + auffrischen
      const favOv = document.getElementById('fav-overlay');
      if (favOv) favOv.classList.add('active');
      document.body.style.overflow = 'hidden';
      renderFavs();
    } else if (_adParentCol) {
      openCollection(_adParentCol, true);
      const colEl = document.getElementById('coll-' + _adParentCol);
      if (colEl) colEl.scrollTop = _adParentScrollTop;
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
    _nav.applying = true;
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
    _nav.applying = false;
    // Aktuellen Zustand als Ausgangspunkt im Verlauf hinterlegen
    const st = [];
    if (_galleryEntered) st.push('gallery');
    const col = document.querySelector('.coll-overlay.active:not(#fav-overlay)');
    if (col) st.push('col:' + col.id.slice(5));
    const artOpen = document.getElementById('artwork-detail').classList.contains('active');
    // Werk per URL wiederhergestellt: die Kollektion, zu der „Zurück" führt, gehört mit in den Stapel
    if (artOpen && !col && _adParentCol) st.push('col:' + _adParentCol);
    if (artOpen) st.push('art:' + _adCurrentTitle);
    _nav.stack = st;
    // Nach einem Neuladen bleibt der Verlaufseintrag erhalten – stimmt er mit dem Zustand
    // überein, darf „Zurück" weiterhin einen echten Schritt zurückgehen
    const old = history.state;
    const same = !!(old && old.navStack && old.navStack.join('|') === st.join('|'));
    const lostTop = !!(old && old.pushed && old.navStack && old.navStack.length === st.length + 1 &&
                       old.navStack.slice(0, st.length).join('|') === st.join('|'));
    if (lostTop) {
      // eine Ebene ohne eigene URL (Merkliste, Impressum …) war offen und ist nach dem Neuladen zu:
      // still auf den passenden vorherigen Eintrag zurückgehen, sonst wäre der nächste Zurück-Klick wirkungslos
      _nav.pending = true;
      history.back();
    } else {
      history.replaceState({ navStack: st, pushed: same && !!old.pushed }, '', location.href);
    }
  })();

  function openCollection(cat, noHash) {
    const el = document.getElementById('coll-' + cat);
    if (!el) return;
    // Bilder erst jetzt laden: die unsichtbaren Ebenen liegen über dem Bildschirm, „lazy“ allein
    // würde sonst beim Seitenaufruf alle Kollektionen (rund 10 MB) sofort mitladen
    el.querySelectorAll('img[data-src]').forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
    el.scrollTop = 0;
    if (!noHash) _navOpen('col:' + cat);
  }
  function closeCollection(cat) {
    const el = document.getElementById('coll-' + cat);
    if (!el) return;
    el.classList.remove('active');
    document.body.style.overflow = '';
    _navClosed('col:' + cat);
  }

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
  const sections = ['galerie', 'ueber-uns', 'das-werk', 'ausstellungen', 'socials', 'kontakt'];
  const sectionEls = sections.map(id => document.getElementById(id));

  const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

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
      s.src = 'vendor/three.min.js';   // Three.js r128 (MIT), lokal statt vom CDN – keine externe Verbindung
      s.onload = cb;
      document.head.appendChild(s);
    }
    openBtn.addEventListener('click', e => {
      e.preventDefault();
      _navOpen('vr');
      vrEl.style.display='block';
      vrPaused = true;
      setTimeout(function(){
        var p = document.getElementById('vr-info-panel');
        if(p) p.classList.add('visible');
      }, 120);
      loadThree(initGallery);
    });
    // Skip-Button: zur nächsten Kameraposition springen
    document.getElementById('vr-skip').addEventListener('click', () => skipStep(1));
    document.getElementById('vr-back')?.addEventListener('click', () => skipStep(-1));

    // Info-Panel: ? Button, close button, backdrop click
    var infoPanel = document.getElementById('vr-info-panel');
    let pausedAt = 0;
    document.getElementById('vr-info-btn').addEventListener('click', function() {
      if (!vrPaused) pausedAt = performance.now();
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
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); skipStep(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); skipStep(-1); }
    });
    document.addEventListener('keyup', function(e) { navKeys.delete(e.code); });
    // Fenster verliert den Fokus: das keyup käme nie an – sonst liefe man endlos weiter
    window.addEventListener('blur', function() { navKeys.clear(); });
    window.closeVrInfo = function() {
      var p = document.getElementById('vr-info-panel');
      if(p) p.classList.remove('visible');
      // laufende Rückkehr-Animation dort fortsetzen, wo sie pausiert wurde (kein Sprung)
      if (pausedAt) t0 += performance.now() - pausedAt;
      pausedAt = 0;
      vrPaused = false;
    };
    // Weiter (+1) / Zurück (−1): sofort zur nächsten Station in dieser Richtung,
    // weich aus der aktuellen Kameralage (auch mitten in einem Übergang)
    function skipStep(dir) {
      if (!seq || phase === 'fading' || !seq[seqIdx]) return;
      if (resumeFov !== null) { cam.fov = FOV_BASE; cam.updateProjectionMatrix(); resumeFov = null; }
      if (dir) tourDir = dir;
      advance(performance.now());
    }

    closeBtn.addEventListener('click', () => {
      _navClosed('vr');
      vrEl.style.display='none';
      teardown();
      const loader=document.getElementById('gallery-loader');
      if(loader){ loader.style.display='flex'; loader.classList.remove('fade-out'); }
    });

    let renderer, scene, cam, rafId, fadeDiv;
    let _vrSession = 0;
    let _inputBound = false;   // Canvas-/Dokument-Listener des Rundgangs sind gebunden   // wird beim Schließen erhöht – verspätete Timer erkennen daran, dass sie veraltet sind
    let seq, seqIdx, phase, t0;
    let tourDir = 1;          // +1 vorwärts (Linksdrehungen), −1 rückwärts (Rechtsdrehungen)
    let transDur = 1500;      // Dauer des laufenden Übergangs (aus Weg und Drehwinkel)
    let fromPos=null, fromQuat=null;
    let vrPaused = false;
    let _texPending = 0, _buildDone = false, _loaderHidden = false, _warmedUp = false;
    function _texDone() { _texPending = Math.max(0, _texPending - 1); if (_buildDone && !_texPending) _maybeHideLoader(); }
    // GPU-Warmup: kompiliert alle Shader und lädt Texturen/Geometrie einmal hoch,
    // SOLANGE der Ladescreen noch alles verdeckt. Sonst passiert das erst beim
    // ersten Sichtbarwerden jedes Objekts → Ruckeln bei den ersten Drehungen.
    function _warmupGPU() {
      if (_warmedUp || !renderer || !scene || !cam) return;
      _warmedUp = true;
      const T = window.THREE; if (!T) return;
      // 1) Alle Shader-Programme vorab kompilieren (auch nicht-sichtbare)
      setAllZonesVisible();
      // auch die gerade nicht gezeigte Ansicht jeder Plastik einmal rendern (Textur-Upload jetzt,
      // nicht erst beim ersten Seitenblick)
      _sculpts.forEach(sc => sc.planes.forEach(pl => { if (pl.userData.ready) { pl.visible = true; pl.material.opacity = 1; } }));
      try { renderer.compile(scene, cam); } catch (e) {}
      // 2) Szene aus mehreren Blickwinkeln rendern → erzwingt Textur- und
      //    Geometrie-Upload für praktisch jedes Objekt beider Räume.
      try {
        const sp = cam.position.clone(), sq = cam.quaternion.clone(), sf = cam.fov;
        cam.fov = 100; cam.updateProjectionMatrix();   // weites FOV erfasst mehr pro Frame
        setAllZonesVisible();
        const pts = [];
        ZONE_ORDER.forEach(k => { const r = ZONES[k]; pts.push([(r.x0 + r.x1)/2, CAM_Y, (r.z0 + r.z1)/2]); });
        const yaws = [0, Math.PI/2, Math.PI, -Math.PI/2];
        for (const p of pts) {
          cam.position.set(p[0], p[1], p[2]);
          for (const y of yaws) {
            cam.quaternion.setFromEuler(new T.Euler(0, y, 0, 'YXZ'));
            cam.updateMatrixWorld();
            renderer.render(scene, cam);
          }
        }
        cam.fov = sf; cam.updateProjectionMatrix();
        cam.position.copy(sp); cam.quaternion.copy(sq); cam.updateMatrixWorld();
      } catch (e) {}
      updateZone(true);
    }
    function _maybeHideLoader() {
      if (_loaderHidden) return;
      _loaderHidden = true;
      _warmupGPU();   // läuft synchron, noch unter dem opaken Ladescreen versteckt
      const loader = document.getElementById('gallery-loader');
      if (loader) { setTimeout(() => { loader.classList.add('fade-out'); setTimeout(() => loader.style.display='none', 1200); }, 300); }
    }
    let freeNav = false;
    const navKeys = new Set();
    let navYaw=0, navPitch=0;          // aktuelle Blickrichtung (folgt dem Ziel weich)
    let navYawT=0, navPitchT=0;        // Ziel-Blickrichtung aus Ziehen / Wischen
    const _navVel = { x: 0, z: 0 };    // Gehgeschwindigkeit in m/s
    let _glideV = 0, _glideStall = 0;  // Klick-Gleiten: Tempo und Blockade-Zeit
    let _wheelWalk = 0;                // noch zu gehender Weg aus Trackpad-/Mausrad-Wischen (m)
    const WHEEL_STEP = 0.006, WHEEL_TURN = 0.0035;   // m bzw. rad pro Wisch-Pixel
    let _frameDt = 16;                 // Dauer des letzten Bildes in ms
    let navDrag=false, navDragX=0, navDragY=0, navWasDragged=false;
    let navMovedDist=0;       // Gesamt-Zeigerbewegung seit Drücken (Klick vs. Ziehen)
    let navMoveTarget=null;   // Klick-zum-Gehen Ziel (Street-View-Stil)
    // Zoom über das Sichtfeld: 72° = normal, 40° ≈ 2-fach (Grenze); gleitet weich zum Ziel
    const FOV_BASE=72, FOV_MIN=40;
    let navFov=FOV_BASE;      // Ziel-Sichtfeld (Trackpad-/Mausrad-/Pinch-Zoom)
    let navPinch=false, navPinchDist=0, navPinchFov=FOV_BASE;  // Zwei-Finger-Pinch (Mobile)
    let resumeFov=null;       // „Tour fortsetzen": Sichtfeld beim Start der Rückkehr

    // ── Renderauflösung ──────────────────────────────────────────
    // Volle Schärfe (Retina: Pixelfaktor 2) – möglich, weil der Licht-Pool klein gehalten ist.
    // Nur als Sicherheitsnetz für schwache Geräte senkt _watchFps die Auflösung, höchstens
    // auf 75 % (darunter wirken die Räume milchig und unscharf).
    let _resScale = 1, _resProbe = 0, _resLocked = false, _fpsSum = 0, _fpsN = 0, _fpsWarm = 0, _adEl = null, _infoEl = null;
    function _pixelRatio() {
      const full = Math.min(devicePixelRatio || 1, 2);
      // nie unter die echte Bildschirmauflösung bis 1,5: PCs mit 125/150 % Skalierung würden sonst
      // hochgerechnet und unscharf; nur Retina (2) darf bei Last bis 1,5 sinken
      return Math.max(Math.min(full, 1.5), full * Math.max(0.75, _resScale));
    }
    function _watchFps(raw) {
      if (!_loaderHidden || raw > 250 || document.hidden) return;   // Ladephase, Tab-Wechsel
      if (_fpsWarm < 150) { _fpsWarm++; return; }                    // Ausblenden des Ladescreens abwarten
      _adEl = _adEl || document.getElementById('artwork-detail');
      _infoEl = _infoEl || document.getElementById('vr-info-panel');
      // Über der Galerie liegende Fenster kosten selbst Leistung – dann nicht messen
      if ((_adEl && _adEl.classList.contains('active')) || (_infoEl && _infoEl.classList.contains('visible'))) { _fpsSum = 0; _fpsN = 0; return; }
      _fpsSum += raw; _fpsN++;
      if (_fpsN < 90) return;
      const avg = _fpsSum / _fpsN; _fpsSum = 0; _fpsN = 0;
      if (_resProbe) {
        // Hat die letzte Absenkung geholfen? Wenn nicht (Engpass ist nicht die Grafik):
        // zurück zur schärferen Stufe und nicht weiter senken.
        if (avg > _resProbe * 0.9) { _resScale /= 0.85; _resLocked = true; _applyRes(); }
        _resProbe = 0;
      } else if (!_resLocked && avg > 19.5 && _resScale > 0.76) {   // unter ~50 Bilder/s: eine Stufe senken
        _resProbe = avg; _resScale *= 0.85; _applyRes();
      }
    }
    function _applyRes() { renderer.setPixelRatio(_pixelRatio()); renderer.setSize(innerWidth, innerHeight); }

    // ── Layout ────────────────────────────────────────────────────
    // Room 1 (Eingangssaal):  z:   0 → -18    width 10
    // Durchgang:              z: -18 → -22    width 3.6
    // Room 2 (Hauptgalerie):  z: -22 → BACK_Z (−41,8)  width 10; weitere Räume siehe R3, ROW2, GANG
    const RW=10, RH=4.4, WALLX=4.82;   // room width/height, painting-wall x
    const PW=1.75, PH=2.15, PY=2.05;   // painting size & height
    const CAM_Y=1.70;
    const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;

    // ══ Grundriss: geschlossenes Rechteck ══════════════════════════════
    //     ┌──── Raum 5 ────┬──── Raum 4 ────┐   Draufsicht. Laufrichtung: R1 → R2 → R3 → R4 → R5
    //   Gang                              Raum 3   → Gang → R1, an jeder Ecke eine 90°-Linksdrehung.
    //     └──── Raum 1 ────┴──── Raum 2 ────┘
    // Raum 1+2 auf x=0 (Laufrichtung −z), Raum 4+5 gegenüber auf x=−ROW_GAP (Laufrichtung +z),
    // Raum 3 an der hinteren kurzen Seite (Laufrichtung −x), der Gang an der vorderen (+x).
    // Jeder weitere Raum wird in eine gedrehte Gruppe mit denselben lokalen Koordinaten wie
    // Raum 1/2 gebaut (lokal −z = Laufrichtung) – derselbe Code für alle Räume.
    const ROW_GAP  = 26;              // Abstand der Mittellinien der beiden langen Seiten
    const CW       = 3.0;             // Breite der Eckdurchgänge, des Gangs und seiner Durchgänge
    const BACK_Z   = -41.8;           // Rückwand von Raum 2 = Startwand von Raum 4
    // Mittellinie der hinteren Ecke (Durchgänge Raum 2 → 3 → 4): das Marmorportal (3 m + Pilaster)
    // sitzt zwischen dem letzten Bild der linken Wand (bis z −37,9) und der Rückwand
    const CORNER_Z = BACK_Z + 1.93;
    const GANG_Z   = CW/2;            // Mittellinie des Gangs = Startposition vor Raum 1 (Gang beginnt bei z = 0)
    // Marmorportale der kleinen Durchgänge: Öffnung bis zum Bogenscheitel, Bogen setzt bei spring an
    const PORTAL = { spring: 3.0, crown: 3.6, pil: 0.30, d: 0.12, top: 4.26 };   // top: Oberkante unter der Kranzleiste

    // Raum 3: Plastiken – Inhalt aus derselben Quelle wie die Kollektion „Plastik" (ARTWORKS)
    const SCULPTURE_TITLES = Object.keys(ARTWORKS).filter(t => ARTWORKS[t].cat === 'Plastik' && ARTWORKS[t].views && ARTWORKS[t].views.length);
    // Gruppe um +90° gedreht: lokal z=0 liegt in der linken Wand von Raum 2 (x=−5), lokal −z zeigt nach −x.
    const R3 = (() => {
      const r = { ox: -RW/2, oz: CORNER_Z, aw: CW, conn: 2 };
      const rowCount = Math.max(1, Math.ceil(SCULPTURE_TITLES.length / 2));
      r.entry = -r.conn;                                  // Eingangswand (lokal)
      r.depth = (ROW_GAP - RW) - 2*r.conn;                // kurze Seite – kürzer als Raum 1/2
      r.end   = r.entry - r.depth;                        // Ausgangswand mit Torbogen zu Raum 4
      r.exit  = r.end - r.conn;                           // linke Wand von Raum 4
      r.cz    = r.entry - r.depth/2;
      const first = 2.5, span = r.depth - 2*first;        // Podest-Reihen gleichmäßig verteilt
      r.rows  = Array.from({length: rowCount}, (_, i) => r.entry - first - (rowCount > 1 ? span * i/(rowCount-1) : span/2));
      return r;
    })();
    // Obere lange Seite: Gruppe um 180° gedreht; lokal z=0 = Startwand von Raum 4 (Welt z = BACK_Z).
    const ROW2 = (() => {
      const r = { ox: -ROW_GAP, oz: BACK_Z, r4Depth: -22 - BACK_Z, conn: 4 };
      r.r5Start = -(r.r4Depth + r.conn);                  // Welt z=−18 (gegenüber Raum 1)
      r.r5End   = r.oz - (GANG_Z + CW/2 + 0.7);           // Endwand von Raum 5, mit Platz für den Portal-Pilaster
      r.r4Rows  = [-37, -33, -29, -25].map(z => r.oz - z);   // gegenüber den Bildern von Raum 2
      r.r5Rows  = [-15, -11, -7, -3].map(z => r.oz - z);     // gegenüber den Bildern von Raum 1
      // Durchgänge in der linken Wand: Raum 4 am Anfang (von Raum 3), Raum 5 am Ende (zum Gang)
      r.r4Open  = { side:-1, z0: r.oz - (CORNER_Z - CW/2), z1: r.oz - (CORNER_Z + CW/2), h:PORTAL.crown };
      r.r5Open  = { side:-1, z0: r.oz - (GANG_Z - CW/2),   z1: r.oz - (GANG_Z + CW/2),   h:PORTAL.crown };
      return r;
    })();
    function rw2(xl, zl) { return { x: ROW2.ox - xl, z: ROW2.oz - zl }; }
    // Gang: Gruppe um −90° gedreht; lokal z=0 liegt in der linken Wand von Raum 5, lokal −z zeigt nach +x.
    const GANG = (() => {
      const r = { ox: ROW2.ox + RW/2, oz: GANG_Z, w: CW };
      r.depth = (CW/2 + 0.5) - r.ox;                      // endet einen halben Meter hinter dem Torbogen zu Raum 1
      r.r1Open = { side:-1, z0: r.ox + CW/2, z1: r.ox - CW/2, h:PORTAL.crown };   // Durchgang in Raum 1
      return r;
    })();
    function gw(xl, zl) { return { x: GANG.ox - zl, z: GANG.oz + xl }; }
    // lokale Raum-3-Koordinaten → Welt
    function r3w(xl, zl) { return { x: R3.ox + zl, z: R3.oz - xl }; }
    // Podest: offener Metallrahmen, Breite : Höhe = 1 : 3,5, Oberkante etwa Hüft-/Brusthöhe
    const PED = { w: 0.40, h: 1.40, x: RW/2 - 1.2 };

    // Painting definitions: {x, y, z, rotY}
    // rotY: 0=faces+z, π=faces-z, -π/2=faces+x, π/2=faces-x
    const PICS = [
      // Room 1 – left wall (faces +x = rotY -π/2) — jetzt 4 Bilder
      {x:-WALLX, y:PY, z:-3,  rotY:-Math.PI/2},
      {x:-WALLX, y:PY, z:-7,  rotY:-Math.PI/2},
      {x:-WALLX, y:PY, z:-11, rotY:-Math.PI/2},
      // Room 1 – right wall (faces -x = rotY +π/2) — jetzt 4 Bilder
      {x: WALLX, y:PY, z:-3,  rotY: Math.PI/2},
      {x: WALLX, y:PY, z:-7,  rotY: Math.PI/2},
      {x: WALLX, y:PY, z:-11, rotY: Math.PI/2},
      // idx 6/7 (Bunte/Goldene Figur): von der Endwand auf die Seitenwände
      // verschoben (4. Bild je Seite), Raum 1 dafür verlängert
      {x:-WALLX, y:PY, z:-15, rotY:-Math.PI/2},
      {x: WALLX, y:PY, z:-15, rotY: Math.PI/2},
      // Room 2 – left wall (um 4 nach hinten verschoben)
      {x:-WALLX, y:PY, z:-25, rotY:-Math.PI/2},
      {x:-WALLX, y:PY, z:-29, rotY:-Math.PI/2},
      {x:-WALLX, y:PY, z:-33, rotY:-Math.PI/2},
      {x:-WALLX, y:PY, z:-37, rotY:-Math.PI/2},
      // Room 2 – right wall
      {x: WALLX, y:PY, z:-25, rotY: Math.PI/2},
      {x: WALLX, y:PY, z:-29, rotY: Math.PI/2},
      {x: WALLX, y:PY, z:-33, rotY: Math.PI/2},
      {x: WALLX, y:PY, z:-37, rotY: Math.PI/2},
      // (Die zwei leeren Platzhalter-Rahmen an der Rückwand wurden entfernt –
      //  sie rahmten unschön den „Horst Schwab"-Schriftzug ein.)
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
      renderer = new T.WebGLRenderer({canvas:cv, antialias: true, powerPreference:'high-performance'});
      renderer.setPixelRatio(_pixelRatio());
      renderer.setSize(innerWidth, innerHeight);
      renderer.setClearColor(0x000000, 1);
      renderer.outputEncoding = T.sRGBEncoding;
      // Lineares Tonemapping — kräftige, gesättigte Farben (kein ACES-Washout)
      renderer.toneMapping = T.LinearToneMapping;
      renderer.toneMappingExposure = 0.92;
      scene = new T.Scene();
      scene.background = new T.Color(0x000000);
      scene.fog = new T.Fog(0x000000, 32, 65);
      cam = new T.PerspectiveCamera(72, innerWidth/innerHeight, 0.05, 80);
      fromPos  = new T.Vector3();
      fromQuat = new T.Quaternion();
      buildRooms(T);
      buildPaintings(T);
      buildLights(T);
      buildPictureLights(T);
      buildFurniture(T);
      buildPlants(T);
      buildColumns(T);
      buildWallSigns(T);
      buildSculptureRoom(T);
      buildRow2(T);
      buildGang(T);
      partitionZones(T);
      buildLightPool(T);
      // buildFloorReflection(T);  // entfernt: erzeugte den weißen Lichtstreifen in der Bodenmitte
      buildSeq(T);
      window.addEventListener('resize', onResize);

      // ── Freie-Navigation-Button ───────────────────────────────────
      const freeBtn = document.createElement('button');
      freeBtn.id = 'vr-free-btn';
      const _en = _lang === 'en';
      const FREE_TXT = _en ? '↖ EXPLORE FREELY' : '↖ FREI ERKUNDEN', RESUME_TXT = _en ? '▶ RESUME TOUR' : '▶ TOUR FORTSETZEN';
      freeBtn.textContent = FREE_TXT;
      vrEl.appendChild(freeBtn);

      // Bedien-Hinweis, nur im Frei-Modus sichtbar
      const _touchDevice = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      const navHint = document.createElement('div');
      navHint.id = 'vr-nav-hint';
      // sitzt über dem Knopf „Tour fortsetzen“ (Abstand wird beim Einblenden gesetzt), so breit wie nötig
      navHint.style.cssText = 'position:absolute;left:50%;bottom:16px;transform:translateX(-50%);'
        + 'width:max-content;max-width:90vw;text-align:center;'
        + 'background:rgba(8,7,6,0.72);color:#e9e2d2;font:500 0.75rem/1.35 Montserrat,sans-serif;'
        + 'letter-spacing:0.03em;padding:0.5rem 1rem;border:1px solid rgba(201,168,76,0.35);'
        + 'border-radius:16px;pointer-events:none;opacity:0;transition:opacity 0.4s ease;'
        + 'z-index:6;backdrop-filter:blur(4px);';
      navHint.textContent = _touchDevice
        ? (_en ? 'Drag: look around · Tap: walk there · 2 fingers: zoom' : 'Ziehen: umschauen · Tippen: hingehen · 2 Finger: Zoom')
        : (_en ? 'Swipe: walk & turn · Pinch / Ctrl + wheel: zoom · Click: walk there · Drag: look around'
               : 'Wischen: gehen & drehen · Kneifen / Strg + Rad: Zoom · Klick: hingehen · Ziehen: umschauen');
      vrEl.appendChild(navHint);

      freeBtn.addEventListener('click', () => {
        freeNav = !freeNav;
        if (freeNav) {
          vrPaused = true;
          const euler = new T.Euler().setFromQuaternion(cam.quaternion, 'YXZ');
          navYaw = navYawT = euler.y; navPitch = navPitchT = euler.x;
          _navVel.x = _navVel.z = 0; _glideV = 0; _wheelWalk = 0;
          freeBtn.textContent = RESUME_TXT;
          freeBtn.classList.add('active');
          // knapp über dem Knopf, egal wo er gerade sitzt (Handy/Desktop, Fensterbreite)
          const br = freeBtn.getBoundingClientRect();
          navHint.style.bottom = Math.max(16, Math.round(vrEl.getBoundingClientRect().bottom - br.top + 10)) + 'px';
          navHint.style.opacity = '1';
        } else {
          vrPaused = false;
          freeBtn.textContent = FREE_TXT;
          freeBtn.classList.remove('active');
          navKeys.clear();
          navMoveTarget = null;
          _navVel.x = _navVel.z = 0; _glideV = 0; _wheelWalk = 0;
          navHint.style.opacity = '0';
          // Zurück zur aktuellen Tour-Station, Zoom dabei auf 1×. Im selben (oder direkt
          // angrenzenden) Raum weich gleiten; liegt die Station in einem anderen Raum,
          // überblenden – sonst ginge die gerade Linie durch Wände.
          const st = seq && seq[seqIdx];
          if (st) {
            const glide = zoneAt(cam.position.x, cam.position.z) === zoneAt(st.pos.x, st.pos.z);
            navFov = FOV_BASE;
            if (glide && !_reducedMotion()) {
              fromPos.copy(cam.position); fromQuat.copy(cam.quaternion);
              resumeFov = cam.fov;
              transDur = _transDur(fromPos, fromQuat, st.pos, _stQuat(seqIdx));
              phase = 'resume'; t0 = performance.now();
            } else {
              fadeJump(() => {
                cam.position.copy(st.pos); cam.quaternion.copy(_stQuat(seqIdx));
                fromPos.copy(st.pos); fromQuat.copy(_stQuat(seqIdx));
                cam.fov = FOV_BASE; cam.updateProjectionMatrix(); resumeFov = null;
                phase = 'hold'; t0 = performance.now();
              });
            }
          }
        }
      });

      // Eingaben nur beim ersten Öffnen binden – keine doppelten Listener nach mehreren Runden
      if (!_inputBound) {
      _inputBound = true;
        // ── Maus-Drag für freie Navigation ───────────────────────────
        cv.addEventListener('mousedown', e => {
          navMovedDist = 0;
          if (!freeNav) return;
          navDrag=true; navDragX=e.clientX; navDragY=e.clientY;
        });
        cv.addEventListener('mousemove', e => {
          if (!freeNav || !navDrag) return;
          const dx=e.clientX-navDragX, dy=e.clientY-navDragY;
          navYawT   -= dx*0.0025; navPitchT -= dy*0.0025;
          navPitchT  = Math.max(-1.1, Math.min(0.9, navPitchT));
          navDragX=e.clientX; navDragY=e.clientY;
          navMovedDist += Math.abs(dx)+Math.abs(dy);
        });
        document.addEventListener('mouseup', () => { navDrag=false; });

        // Abstand zwischen zwei Fingern (für Pinch-Zoom)
        function _touchDist(e){
          const a=e.touches[0], b=e.touches[1];
          return Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
        }

        // ── Touch-Drag (Umschauen) + Zwei-Finger-Pinch (Zoom) ───────────
        cv.addEventListener('touchstart', e => {
          if (e.touches.length === 2) {            // Pinch beginnt
            if (!freeNav) return;                  // Zoom nur beim freien Erkunden
            navPinch=true; navDrag=false;
            navPinchDist=_touchDist(e); navPinchFov=navFov;
            return;
          }
          navMovedDist = 0;
          if (!freeNav || e.touches.length!==1) return;
          navDrag=true; navDragX=e.touches[0].clientX; navDragY=e.touches[0].clientY;
        }, {passive:true});
        cv.addEventListener('touchmove', e => {
          if (e.touches.length === 2) e.preventDefault();   // nie die ganze Seite zoomen
          if (navPinch && e.touches.length === 2) {   // Pinch-Zoom (verändert FOV)
            e.preventDefault();
            const d=_touchDist(e);
            if (d>0 && navPinchDist>0) {
              navFov = Math.max(FOV_MIN, Math.min(FOV_BASE, navPinchFov * (navPinchDist / d)));
            }
            return;
          }
          if (!freeNav || !navDrag || e.touches.length!==1) return;
          e.preventDefault();
          const dx=e.touches[0].clientX-navDragX, dy=e.touches[0].clientY-navDragY;
          navYawT -= dx*0.0025; navPitchT -= dy*0.0025;
          navPitchT = Math.max(-1.1, Math.min(0.9, navPitchT));
          navDragX=e.touches[0].clientX; navDragY=e.touches[0].clientY;
          navMovedDist += Math.abs(dx)+Math.abs(dy);
        }, {passive:false});

        // ── Raycaster: Klick/Touch auf Gemälde öffnet Artwork-Detail ──
        const raycaster = new T.Raycaster();
        const mouse = new T.Vector2();
        const tooltip = document.getElementById('gallery-tooltip');

        function castAndOpen(clientX, clientY) {
          mouse.x =  (clientX / innerWidth)  * 2 - 1;
          mouse.y = -(clientY / innerHeight) * 2 + 1;
          raycaster.setFromCamera(mouse, cam);
          const o = pickArt(raycaster);
          if (!o) return false;
          if (!o.userData.placeholder) openArtwork(o.userData.artworkTitle, false, true);
          return true;   // auch Platzhalter „fangen" den Klick (kein Gehen dorthin)
        }

        // ── Klick-zum-Gehen (Street-View-Stil) ───────────────────────
        // Strahl auf die Bodenebene (y=0) schneiden – sehr günstig, keine Geometrie nötig.
        const _floorPlane = new T.Plane(new T.Vector3(0,1,0), 0);
        const _floorHit = new T.Vector3();
        function moveToFloor(clientX, clientY) {
          mouse.x =  (clientX / innerWidth)  * 2 - 1;
          mouse.y = -(clientY / innerHeight) * 2 + 1;
          raycaster.setFromCamera(mouse, cam);
          const dir = raycaster.ray.direction;
          // Schnittpunkt mit dem Boden (y=0). Bei Klick Richtung Horizont liefert
          // intersectPlane null oder einen sehr fernen Punkt – dann stattdessen
          // einfach in die horizontale Blickrichtung vorwärts projizieren.
          const hit = raycaster.ray.intersectPlane(_floorPlane, _floorHit);
          const floorDist = hit ? raycaster.ray.origin.distanceTo(_floorHit) : Infinity;
          // Liegt eine Wand (oder ein Bild) vor dem Bodenpunkt, nur bis kurz davor gehen –
          // die Bodenebene allein kennt keine Wände. Beidseitig, wie bei der Klick-Verdeckung.
          const wall = _rm && _rm.wall, wallSide = wall ? wall.side : null;
          if (wall) wall.side = T.DoubleSide;
          const wh = raycaster.intersectObjects(_hitList, false)[0];
          if (wall) wall.side = wallSide;
          const horiz = new T.Vector3(dir.x, 0, dir.z);
          if (horiz.lengthSq() < 1e-5) return;
          horiz.normalize();
          if (wh && wh.distance < floorDist) _floorHit.copy(wh.point).addScaledVector(horiz, -0.4);
          else if (!hit) return;   // Klick an die Decke / ins Leere: nicht losgehen
          const tgt = _floorHit.clone(); tgt.y = CAM_Y;
          // Ohne Weitengrenze: das Gleiten führt über die Durchgänge bis zum Ziel (walkWaypoint).
          // Liegt der Punkt im Wandabstand, gilt der nächste begehbare Punkt – auch im Nachbarraum.
          clampToRoom(tgt, null);
          navMoveTarget = tgt; _glideStall = 0; _wheelWalk = 0;
        }

        // Einheitliche Tap-Behandlung: Bild öffnen – oder im Frei-Modus hingehen.
        function handleTap(x, y) {
          const opened = castAndOpen(x, y);
          if (!opened && freeNav) moveToFloor(x, y);
        }

        // Klick/Tap wird über die Gesamt-Bewegung erkannt (zuverlässiger als das
        // click-Event und unempfindlich gegen leichtes Zittern beim Drücken).
        cv.addEventListener('mouseup', e => {
          if (e.button !== 0) return;
          if (navMovedDist > 8) return;          // war Umschauen (Ziehen)
          handleTap(e.clientX, e.clientY);
        });

        cv.addEventListener('touchend', e => {
          navDrag = false;
          if (navPinch) {                        // war ein Pinch/Zoom – kein Tap
            if (e.touches.length === 0) navPinch = false;
            return;
          }
          if (e.changedTouches.length !== 1) return;
          if (navMovedDist > 12) return;         // war ein Wisch (Umschauen)
          e.preventDefault();
          const t = e.changedTouches[0];
          handleTap(t.clientX, t.clientY);
        }, {passive: false});

        // ── Trackpad / Mausrad ───────────────────────────────────────
        // Zwei-Finger-Wischen: hoch/runter = vor/zurück gehen, links/rechts = drehen
        // (auch der Nachlauf des Trackpads wirkt mit – man rollt sanft aus).
        // Kneifen = Zoom: Chrome/Firefox melden es als wheel mit ctrlKey (ebenso Strg + Mausrad),
        // Safari als gesture-Ereignisse.
        let _gestureFov = FOV_BASE, _gestureActive = false;
        cv.addEventListener('wheel', e => {
          e.preventDefault();
          if (!freeNav) return;                    // nur beim freien Erkunden
          const k = e.deltaMode === 1 ? 33 : (e.deltaMode === 2 ? 400 : 1);   // Zeilen/Seiten → Pixel
          const dy = Math.max(-80, Math.min(80, e.deltaY * k)), dx = Math.max(-80, Math.min(80, e.deltaX * k));
          if (e.ctrlKey) {
            if (!_gestureActive) navFov = Math.max(FOV_MIN, Math.min(FOV_BASE, navFov + Math.max(-40, Math.min(40, dy)) * 0.12));
            return;
          }
          _wheelWalk += dy * WHEEL_STEP;
          navYawT += dx * WHEEL_TURN;
          if (navMoveTarget) { navMoveTarget = null; _glideV = 0; _navVel.x = _navVel.z = 0; }   // Wischen beendet das Klick-Gleiten ohne Nachrollen
        }, {passive:false});
        cv.addEventListener('gesturestart', e => { e.preventDefault(); _gestureActive = true; _gestureFov = navFov; });
        cv.addEventListener('gesturechange', e => {
          e.preventDefault();
          if (freeNav && e.scale > 0) navFov = Math.max(FOV_MIN, Math.min(FOV_BASE, _gestureFov / e.scale));
        });
        cv.addEventListener('gestureend', e => { e.preventDefault(); _gestureActive = false; });

        // Hover: höchstens ein Strahl pro Bild (requestAnimationFrame), Tooltip per transform
        let _hoverX = 0, _hoverY = 0, _hoverQueued = false;
        function _hoverFrame() {
          _hoverQueued = false;
          if (!cam) return;
          mouse.x =  (_hoverX / innerWidth)  * 2 - 1;
          mouse.y = -(_hoverY / innerHeight) * 2 + 1;
          raycaster.setFromCamera(mouse, cam);
          const o = pickArt(raycaster);
          if (o) {
            const t = o.userData.artworkTitle, d = ARTWORKS[t];
            cv.style.cursor = o.userData.placeholder ? 'default' : 'pointer';
            tooltip.textContent = o.userData.placeholder ? _roomWorkLabel(t) + (_lang === 'en' ? '  ·  Coming soon' : '  ·  Werk folgt') : (d && d.year ? t + '  ·  ' + d.year : t);
            tooltip.style.display = 'block';
            tooltip.style.left = '0px'; tooltip.style.top = '0px';
            tooltip.style.transform = 'translate(' + (_hoverX + 18) + 'px,' + (_hoverY - 14) + 'px)';
          } else {
            cv.style.cursor = 'default';
            tooltip.style.display = 'none';
          }
        }
        cv.addEventListener('mousemove', e => {
          _hoverX = e.clientX; _hoverY = e.clientY;
          if (!_hoverQueued) { _hoverQueued = true; requestAnimationFrame(_hoverFrame); }
        });
      }
      // Ladescreen erst ausblenden wenn alle Texturen geladen sind (max. 10 Sek. Fallback)
      _buildDone = true;
      if (!_texPending) _maybeHideLoader();
      setTimeout(_maybeHideLoader, 10000);
      let _lastTs = 0;
      function frame(ts){
        rafId=requestAnimationFrame(frame);
        const raw = _lastTs ? ts - _lastTs : 16, dt = Math.min(100, raw); _lastTs = ts;
        _frameDt = dt;
        _watchFps(raw);
        tick(T,ts);
        updateZone();
        updateLights(dt);
        if (_sculpts.length && _zoneGroups && _zoneGroups.R3.visible) updateSculptures();
        renderer.render(scene,cam);
      }
      requestAnimationFrame(frame);
    }

    // ── Rooms ─────────────────────────────────────────────────────
    // ══ Wiederverwendbarer Raumaufbau ═══════════════════════════════
    // Alle Galerieräume (Raum 1, Raum 2 und der Plastik-Raum) entstehen aus denselben
    // Bausteinen. Gebaut wird in lokalen Raumkoordinaten: der Raum läuft entlang −z,
    // ist RW breit und RH hoch. Ein gedrehter Raum (Plastik-Raum) wird einfach in eine
    // gedrehte Gruppe gebaut (siehe _buildTarget).

    // Gemeinsame Materialien – einmal erzeugt, von allen Räumen genutzt
    let _rm = null;
    function roomMats(T) {
      if (_rm) return _rm;
      function aoTex(darkOnLeft) {
        const cv=document.createElement('canvas'); cv.width=128; cv.height=4;
        const ctx=cv.getContext('2d');
        const gr=ctx.createLinearGradient(0,0,128,0);
        if(darkOnLeft){gr.addColorStop(0,'rgba(0,0,0,0.54)');gr.addColorStop(0.5,'rgba(0,0,0,0.10)');gr.addColorStop(1,'rgba(0,0,0,0)');}
        else           {gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(0.5,'rgba(0,0,0,0.10)');gr.addColorStop(1,'rgba(0,0,0,0.54)');}
        ctx.fillStyle=gr; ctx.fillRect(0,0,128,4);
        return new T.CanvasTexture(cv);
      }
      _rm = {
        wall:   new T.MeshStandardMaterial({color:0xe9e2d6, roughness:0.95, side:T.FrontSide}),   // warmes Gebrochen-Weiß (kräftigeres Beige wirkte bei wenig Licht gelblich)
        ceil:   new T.MeshBasicMaterial({map: makeCeilingTex(T)}),
        ceilC:  new T.MeshBasicMaterial({color:0xf0efe9}),
        floor:  new T.MeshStandardMaterial({map:makeFloorTex(T), roughness:0.72, metalness:0.03}),
        trans:  new T.MeshStandardMaterial({color:0x252525, roughness:0.88, side:T.DoubleSide}),
        marble: new T.MeshStandardMaterial({map:makeMarbleTex(T), roughness:0.20, metalness:0.14}),
        mold:   new T.MeshStandardMaterial({color:0xdedad3, roughness:0.84}),
        panel:  new T.MeshStandardMaterial({color:0x272421, roughness:0.82, metalness:0.01}),
        rail:   new T.MeshStandardMaterial({color:0xb08828, roughness:0.38, metalness:0.72}),
        gold:   new T.MeshBasicMaterial({color:0xb08828}),
        aoL:    new T.MeshBasicMaterial({map:aoTex(true),  transparent:true, depthWrite:false}),
        aoR:    new T.MeshBasicMaterial({map:aoTex(false), transparent:true, depthWrite:false}),
      };
      return _rm;
    }

    // Wandabschnitte zwischen Durchgängen: [[zVorne, zHinten], …]
    function wallSpans(zFront, zBack, cuts) {
      const spans = []; let cur = zFront;
      cuts.slice().sort((a, b) => b.z0 - a.z0).forEach(c => {
        if (c.z0 < cur) spans.push([cur, c.z0]);
        cur = Math.min(cur, c.z1);
      });
      if (cur > zBack) spans.push([cur, zBack]);
      return spans;
    }

    // Raumhülle: Boden, Oberlicht-Decke, Seitenwände (mit optionalen Durchgängen),
    // Wandverkleidung, Leisten, Kontaktschatten, Schienen und Deckenlicht.
    // o = { depth, cz, width, openings:[{side:-1|1, z0, z1, h}], fillRows, lightRows, extraLights }
    function buildRoomShell(T, o) {
      const M = roomMats(T);
      const depth = o.depth, cz = o.cz, zFront = cz + depth/2, zBack = cz - depth/2;
      const W = o.width || RW;
      const openings = o.openings || [];
      const OFF = 0.013, wH = 1.12, sw = Math.min(0.44, W * 0.18);

      // Bodenplatten nach Raumgröße: quadratisch (~0,85 m) und ganze Platten über die Breite –
      // auch im schmalen Gang (eine feste Wiederholung pro Fläche würde sie dort zu Streifen ziehen)
      const floor = addPlane(T, W, depth, M.floor, [0, 0,  cz], [-Math.PI/2, 0, 0]);
      const tile = W / Math.max(1, Math.round(W / 0.85)), fuv = floor.geometry.attributes.uv;
      for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * W / (4*tile), fuv.getY(i) * depth / (4*tile));   // Textur = 4×4 Platten
      addPlane(T, W, depth, M.ceil,  [0, RH, cz], [ Math.PI/2, 0, 0]);

      [-1, 1].forEach(side => {
        const cuts = openings.filter(op => op.side === side);
        const ry = side < 0 ? Math.PI/2 : -Math.PI/2;
        const xWall = side * W/2, xPan = side * (W/2 - OFF), xMold = side * (W/2 - 0.022);
        wallSpans(zFront, zBack, cuts).forEach(([za, zb]) => {
          const len = za - zb, mz = (za + zb) / 2;
          _occ(addPlane(T, len, RH, M.wall, [xWall, RH/2, mz], [0, ry, 0]));          // Wand
          addPlane(T, len, wH, M.panel, [xPan, wH/2, mz], [0, ry, 0]);                // Wandverkleidung
          addBox(T, 0.024, 0.036, len + 0.01, M.rail, [xPan, wH + 0.018, mz]);         // Goldleiste
          addBox(T, 0.055, 0.11, len + 0.01, M.mold, [xMold, 0.055, mz]);              // Sockelleiste
          addBox(T, 0.022, 0.04, len + 0.01, M.mold, [xMold, 0.13,  mz]);
          const ao = new T.Mesh(new T.PlaneGeometry(sw, len), side < 0 ? M.aoL : M.aoR); // Kontaktschatten
          ao.rotation.x = -Math.PI/2; ao.position.set(side * (W/2 - sw/2), 0.005, mz); _add(ao);
        });
        // Sturz über jedem Durchgang
        cuts.forEach(c => _occ(addPlane(T, c.z0 - c.z1, RH - c.h, M.wall, [xWall, c.h + (RH - c.h)/2, (c.z0 + c.z1)/2], [0, ry, 0])));
        // Kranzleiste läuft über die ganze Länge (auch über Durchgängen)
        addBox(T, 0.10, 0.022, depth + 0.01, M.mold, [xMold, RH - 0.011, cz]);
        addBox(T, 0.022, 0.10, depth + 0.01, M.mold, [xMold, RH - 0.062, cz]);
      });

      buildSkylightGrid(T, depth, cz, W);
      buildTrackRails(T, depth, cz, W);

      // Deckenlicht: Füll-Lichter, ein Licht pro Bild-/Objektreihe, Lichter an Bögen/Rückwand
      const fillI = o.fillIntensity != null ? o.fillIntensity : 0.60;   // schmaler Gang: Wände näher am Licht
      (o.fillRows || []).forEach(z => _lightDef(0, RH - 0.2,  z, 0xffffff, fillI, 18,  1.1));
      (o.lightRows || []).forEach(z => _lightDef(0, RH - 0.15, z, 0xfff8f0, 1.6,  5.5, 1.3));
      (o.extraLights || []).forEach(z => _lightDef(0, RH - 0.15, z, 0xfff8f0, 1.5,  5.0, 1.3));
    }

    // Anthrazit-Trennwand mit Torbogen (Breite aw, Höhe ah) bei z
    function buildArchWall(T, z, aw, ah) {
      const M = roomMats(T), lw = (RW - aw) / 2;
      ah = ah || 3.2;
      _occ(addBox(T, lw,     RH, 0.18, M.trans, [-(RW/2 - lw/2), RH/2, z]));
      _occ(addBox(T, lw,     RH, 0.18, M.trans, [ (RW/2 - lw/2), RH/2, z]));
      _occ(addBox(T, aw, RH - ah, 0.18, M.trans, [0, ah + (RH - ah)/2, z]));
    }

    // Verbindungsgang (Länge len, Breite aw) mit Marmorboden und Wandverkleidung, Mitte cz
    function buildConnector(T, cz, aw, len) {
      const M = roomMats(T), OFF = 0.013;
      _occ(addPlane(T, len, RH, M.trans,  [-aw/2, RH/2, cz], [0,  Math.PI/2, 0]));
      _occ(addPlane(T, len, RH, M.trans,  [ aw/2, RH/2, cz], [0, -Math.PI/2, 0]));
      addPlane(T, aw, len + 0.4, M.ceilC, [0, RH, cz],     [ Math.PI/2, 0, 0]);   // Decke (leicht überlappend)
      addPlane(T, aw, len, M.marble, [0,  0, cz],       [-Math.PI/2, 0, 0]);
      [-aw/2 + OFF, aw/2 - OFF].forEach(x => {
        const sign = x < 0 ? Math.PI/2 : -Math.PI/2;
        addPlane(T, len, 1.12, M.panel, [x, 0.56, cz], [0, sign, 0]);
        addBox(T, 0.024, 0.036, len + 0.01, M.rail, [x, 1.138, cz]);
      });
    }

    // ══ Marmorportal für die kleinen Durchgänge (Breite aw) ═══════════
    // Steht in der Wandebene z, Schauseite in Richtung dir (+1 / −1). Kannelierte Pilaster mit Sockel
    // und Kapitell; ein flacher Bogen füllt die oberen Ecken der rechteckigen Öffnung – massiv, darum
    // auch von der Rückseite als Bogen zu sehen. Dazu Bogenprofil, feine Goldkante und Schlussstein,
    // bei benannten Durchgängen stattdessen ein Schild über dem Bogen.
    let _pilMat = null;
    function addPortal(T, z, aw, dir, sign) {
      const M = roomMats(T), cm = columnMats(T), P = PORTAL;
      if (!_pilMat) {
        const tex = makeColumnTex(T); tex.repeat.set(0.3, 1.4);          // wenige breite Kanneluren statt 24 feiner
        _pilMat = new T.MeshStandardMaterial({ map: tex, color: 0xf2ede2, roughness: 0.58, metalness: 0.03 });
      }
      const hw = aw/2, pw = P.pil, rise = P.crown - P.spring;
      const R = (hw*hw + rise*rise) / (2*rise), cy = P.crown - R;        // Kreisbogen durch Kämpfer und Scheitel
      const a0 = Math.atan2(P.spring - cy, hw), top = P.top, D = P.d;
      const g = new T.Group(); g.position.set(0, 0, z + dir*0.004);
      if (dir < 0) g.rotation.y = Math.PI;
      _add(g);
      const box = (w, h, d, mat, x, y, zz) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, zz); g.add(m); return m; };
      // Platte: außen Rechteck, innen Öffnung mit Bogen
      const sh = new T.Shape();
      sh.moveTo(-hw - pw, 0); sh.lineTo(-hw - pw, top); sh.lineTo(hw + pw, top); sh.lineTo(hw + pw, 0);
      sh.lineTo(hw, 0); sh.lineTo(hw, P.spring);
      sh.absarc(0, cy, R, a0, Math.PI - a0, false);
      sh.lineTo(-hw, 0); sh.lineTo(-hw - pw, 0);
      const slab = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false, curveSegments: 24 }), cm.stone);
      g.add(slab); _occluders.push(slab);
      [-1, 1].forEach(sx => {
        const x = sx * (hw + pw/2);
        box(pw + 0.06, 0.2, D + 0.1, cm.stone, x, 0.1, (D + 0.1)/2);                       // Sockel
        box(pw - 0.08, P.spring - 0.36, 0.05, _pilMat, x, 0.2 + (P.spring - 0.36)/2, D + 0.025);   // Pilaster
        box(pw + 0.08, 0.16, D + 0.1, cm.stone, x, P.spring - 0.08, (D + 0.1)/2);           // Kapitell / Kämpfer
        box(0.016, P.spring - 0.2, 0.012, M.rail, sx * (hw + 0.014), 0.2 + (P.spring - 0.2)/2, D + 0.006);   // Goldkante
      });
      const arc = Math.PI - 2*a0;
      const prof = new T.Mesh(new T.TorusGeometry(R + 0.07, 0.035, 6, 40, arc), cm.stone);    // Bogenprofil
      prof.rotation.z = a0; prof.position.set(0, cy, D + 0.01); g.add(prof);
      const gold = new T.Mesh(new T.TorusGeometry(R + 0.014, 0.008, 4, 40, arc), M.rail);     // Goldkante am Bogen
      gold.rotation.z = a0; gold.position.set(0, cy, D + 0.006); g.add(gold);
      box(aw + 2*pw + 0.14, 0.09, D + 0.1, cm.stone, 0, top - 0.045, (D + 0.1)/2);         // Gesims
      // Schriftfeld zwischen Bogenprofil (bis Scheitel + 0,1) und Gesims: Schild im Seitenverhältnis der
      // Schild-Textur (1024 × 480), damit die Schrift nicht verzerrt
      if (sign) addWallSign(T, 0.85, 0.40, 0, (P.crown + 0.12 + top - 0.1) / 2, z + dir*(D + 0.012), dir < 0 ? Math.PI : 0, false, sign, '');
      else box(0.2, 0.46, D + 0.08, cm.stone, 0, P.crown + 0.17, (D + 0.08)/2);           // Schlussstein
    }

    // Goldener Dekorrahmen an einem Torbogen (Breite aw) bei z; d = Tiefe (Standard fw),
    // tiefer, wenn der Rahmen zwei hintereinanderliegende Wände überbrücken soll
    function addArchFrame(T, z, aw, d) {
      const gMat = roomMats(T).gold, ah = 3.2, fw = 0.055;
      d = d || fw;
      addBox(T, aw + 2*fw, fw,    d, gMat, [0, ah + fw/2, z]);
      addBox(T, fw,        ah+fw, d, gMat, [-aw/2 - fw/2, (ah + fw)/2, z]);
      addBox(T, fw,        ah+fw, d, gMat, [ aw/2 + fw/2, (ah + fw)/2, z]);
      const od = fw * 1.9;
      [[-aw/2 - fw/2, ah + fw], [aw/2 + fw/2, ah + fw], [-aw/2 - fw/2, 0], [aw/2 + fw/2, 0]].forEach(([x, y]) => {
        addBox(T, od, od, d + fw * 0.4, gMat, [x, y, z]);
      });
    }

    // Anthrazit-Wandpaneele (Eingangswand Raum 1, Endwand Raum 5)
    let _panelTex = null;
    function makePanelTex(T) {
      if (_panelTex) return _panelTex;
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
      _panelTex = new T.CanvasTexture(cv);
      return _panelTex;
    }
    // Paneelwand (RW × RH) bei z, Blickseite ry; optional mit Durchgang (Breite aw, Höhe ah, Standard 3,2).
    // Die Teilflächen übernehmen die Texturkoordinaten der ganzen Wand → Paneele laufen durch.
    function addPanelWall(T, z, ry, aw, ah) {
      const mat = new T.MeshStandardMaterial({map:makePanelTex(T), roughness:0.88, side:T.DoubleSide});
      ah = ah || 3.2;
      const pieces = aw ? [[-RW/2, -aw/2, 0, RH], [aw/2, RW/2, 0, RH], [-aw/2, aw/2, ah, RH]] : [[-RW/2, RW/2, 0, RH]];
      const g = new T.Group(); g.position.set(0, 0, z); g.rotation.y = ry;
      pieces.forEach(([x0, x1, y0, y1]) => {
        const geo = new T.PlaneGeometry(x1 - x0, y1 - y0), uv = geo.attributes.uv;
        for (let i = 0; i < uv.count; i++) {
          uv.setXY(i, (x0 + uv.getX(i) * (x1 - x0) + RW/2) / RW, (y0 + uv.getY(i) * (y1 - y0)) / RH);
        }
        const m = new T.Mesh(geo, mat);
        m.position.set((x0 + x1)/2, (y0 + y1)/2, 0);
        g.add(m); _occluders.push(m);
      });
      _add(g);
      return g;
    }

    function buildRooms(T) {
      const M = roomMats(T);
      const aw = 3.6;

      // ── Room 1 (Tiefe 18, Mitte -9, je 4 Bilder pro Wand) ──
      buildRoomShell(T, { depth:18, cz:-9, fillRows:[-3,-7,-11,-15], lightRows:[-3,-7,-11,-15], extraLights:[-18] });
      // Eingangswand mit Wandpaneelen – jetzt mit Torbogen zum Gang (Rundgang schließt sich)
      // knapp innerhalb von Raum 1: Gangwand (z=0) und Paneelwand dürfen sich nicht durchdringen
      addPanelWall(T, -0.03, Math.PI, CW, PORTAL.crown);
      addPortal(T, -0.035, CW, -1);         // Marmorportal zur Raum-1-Seite (auch aus dem Gang als Bogen sichtbar)
      // Room 1 end wall + archway (anthracite transition) — bei z=-18
      buildArchWall(T, -18, aw);

      // ── Connector ─────────────────────────────────────────────── (Mitte z=-20)
      buildConnector(T, -20, aw, 4);

      // ── Room 2 ── (Rückwand bei BACK_Z; links am Ende der Durchgang zum Plastik-Raum)
      buildRoomShell(T, { depth:-22 - BACK_Z, cz:(-22 + BACK_Z)/2, fillRows:[-24,-30,-36,BACK_Z + 2], lightRows:[-25,-29,-33,-37], extraLights:[-22,BACK_Z],
        openings:[{ side:-1, z0:R3.oz + R3.aw/2, z1:R3.oz - R3.aw/2, h:PORTAL.crown }] });
      _occ(addPlane(T, RW, RH, M.trans, [0,RH/2,BACK_Z], [0,0,0]));
      // Room 2 entry wall (anthracite transition) — bei z=-22
      buildArchWall(T, -22, aw);

      addArchFrame(T, -18, aw);
      addArchFrame(T, -22, aw);
    }

    // ── Skylight ceiling grid ─────────────────────────────────────
    function buildSkylightGrid(T, depth, cz, width) {
      // Bright frosted glass panels (always white)
      const glassMat = new T.MeshBasicMaterial({color:0xfff8ec});
      const gW=7.2 * (width || RW) / RW, gD=depth*0.72;
      addPlane(T, gW, gD, glassMat, [0, RH-0.012, cz], [Math.PI/2,0,0]);

      // Deckenbalken als BasicMaterial – kein PBR nötig, spart viele Shader-Berechnungen
      const fMat = new T.MeshBasicMaterial({color:0x484848});
      const bw=0.055, bh=0.10;
      // Longitudinal beams (along z axis)
      const cols=Math.max(2, Math.round(6 * gW / 7.2)), colStep=gW/(cols);
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
    function buildTrackRails(T, depth, cz, width) {
      // Nur Schienen, keine Spot-Köpfe – spart ~200 Mesh-Objekte pro Aufruf
      const rMat = new T.MeshBasicMaterial({color:0x3a3a3a});
      const trackY = RH-0.07, k = (width || RW) / RW;
      [[-2.2*k,-2.6*k],[2.2*k,2.6*k]].forEach(([xa,xb])=>{
        [xa,xb].forEach(rx=>{
          addBox(T, 0.038, 0.045, depth, rMat, [rx, trackY, cz]);
        });
      });
    }

    // Bauziel: normalerweise die Szene; bei gedrehten Räumen eine gedrehte Gruppe
    let _buildTarget = null;
    function _add(m) { (_buildTarget || scene).add(m); return m; }
    // Wände, die Klicks/Hover auf Werke dahinter verdecken
    const _occluders = [];
    function _occ(m) { _occluders.push(m); return m; }
    // Raumlichter werden nur als Daten gesammelt; ein fester Pool echter Lichter bedient
    // jeweils die nächstgelegenen (konstante Lichtanzahl → keine Shader-Neukompilierung).
    const _lightDefs = [];
    function _lightDef(x, y, z, color, intensity, distance, decay) {
      const t = _buildTarget || scene;
      t.updateMatrixWorld(true);
      const pos = new THREE.Vector3(x, y, z).applyMatrix4(t.matrixWorld);
      _lightDefs.push({ pos, color, intensity, distance, decay, w: 0, zone: null });
    }
    function addPlane(T, w, h, mat, pos, rot) {
      const m = new T.Mesh(new T.PlaneGeometry(w,h), mat);
      m.position.set(...pos); m.rotation.set(...rot);
      return _add(m);
    }
    function addBox(T, w, h, d, mat, pos) {
      const m = new T.Mesh(new T.BoxGeometry(w,h,d), mat);
      m.position.set(...pos);
      return _add(m);
    }

    // ── Weiche Kontaktschatten (gefälschte Bodenschatten, sehr günstig) ──
    let _shadowTex = null;
    function getShadowTex(T) {
      if (_shadowTex) return _shadowTex;
      const s = 128;
      const cv = document.createElement('canvas'); cv.width = cv.height = s;
      const ctx = cv.getContext('2d');
      const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
      g.addColorStop(0,   'rgba(0,0,0,0.55)');
      g.addColorStop(0.55,'rgba(0,0,0,0.22)');
      g.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
      _shadowTex = new T.CanvasTexture(cv);
      return _shadowTex;
    }
    function addGroundShadow(T, x, z, sx, sz, op) {
      const mat = new T.MeshBasicMaterial({map:getShadowTex(T), transparent:true, opacity:op==null?0.8:op, depthWrite:false});
      const m = new T.Mesh(new T.PlaneGeometry(sx, sz), mat);
      m.rotation.x = -Math.PI/2; m.position.set(x, 0.006, z);
      return _add(m);
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
      tex.wrapS=tex.wrapT=T.RepeatWrapping;   // Plattengröße kommt aus den UVs (buildRoomShell)
      return tex;
    }

    function makeMarbleTex(T) {
      // Nero Portoro: tiefschwarzer Stein mit gedämpft-goldenen UND kühlen
      // weißen Calcit-Adern, kristallinem Korn und großformatigen Plattenfugen.
      const S=2048;  // POT für RepeatWrapping in WebGL1
      const cv=document.createElement('canvas'); cv.width=S; cv.height=S;
      const ctx=cv.getContext('2d');
      function pr(s){ return ((s*9301+49297)%233280)/233280; }

      // ── Basis: tiefes, leicht warmes Schwarz mit Tonverlauf ──────
      const base=ctx.createLinearGradient(0,0,S,S);
      base.addColorStop(0,'#0c0b0a');
      base.addColorStop(0.5,'#100f0d');
      base.addColorStop(1,'#0a0908');
      ctx.fillStyle=base; ctx.fillRect(0,0,S,S);

      // weiche Graphit-Wolken → unregelmäßige Steinmasse
      [[360,320,640,0.16],[900,160,800,0.12],[1500,600,720,0.14],
       [240,1040,560,0.11],[1200,1360,880,0.13],[600,1640,600,0.10],
       [1640,300,500,0.12],[100,1400,700,0.10],[1750,1500,650,0.11]
      ].forEach(([cx,cy,r,a])=>{
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0,`rgba(46,43,39,${a})`);
        g.addColorStop(0.55,`rgba(26,24,22,${a*0.5})`);
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.fillRect(0,0,S,S);
      });
      // dunklere Einschlüsse für Tiefe
      [[520,800,240,0.34],[1200,500,180,0.26],[1560,1440,220,0.30],
       [200,1800,160,0.24],[1400,1000,150,0.22]].forEach(([cx,cy,r,a])=>{
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0,`rgba(4,4,4,${a})`);
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.fillRect(0,0,S,S);
      });

      // ── Kristalliner Korn-/Sprenkel-Noise (fein, dunkel + hell) ──
      for(let i=0;i<14000;i++){
        const x=pr(i*3.17)*S, y=pr(i*5.71+1)*S, b=pr(i*2.39+2);
        if(b<0.55){ ctx.fillStyle=`rgba(0,0,0,${0.05+b*0.06})`; }
        else      { ctx.fillStyle=`rgba(190,180,165,${(b-0.55)*0.10})`; }
        const s=0.8+pr(i*1.7)*1.4;
        ctx.fillRect(x,y,s,s);
      }

      // ── Ader-Generator: Glow → Halo → Kern (weiche, runde Strokes) ─
      function vein(x0,y0,x1,y1,w,alpha,core,glow,seed,wobble){
        const pts=[], steps=80, amp=(wobble||1);
        for(let i=0;i<=steps;i++){
          const t=i/steps, s=seed+i*3;
          const disp =(pr(s)-0.5)*96*amp*(Math.sin(Math.PI*t)*1.8+0.3);
          const disp2=(pr(s+200)-0.5)*32*amp;
          pts.push([x0+(x1-x0)*t+disp, y0+(y1-y0)*t+disp2]);
        }
        function path(){
          ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
          for(let i=1;i<pts.length-2;i++){
            ctx.quadraticCurveTo(pts[i][0],pts[i][1],
              (pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2);
          }
        }
        ctx.lineCap='round'; ctx.lineJoin='round';
        path(); ctx.strokeStyle=`rgba(${glow},${alpha*0.10})`; ctx.lineWidth=w*16;  ctx.stroke();
        path(); ctx.strokeStyle=`rgba(${glow},${alpha*0.24})`; ctx.lineWidth=w*7;   ctx.stroke();
        path(); ctx.strokeStyle=`rgba(${core},${alpha*0.55})`; ctx.lineWidth=w*2.6; ctx.stroke();
        path(); ctx.strokeStyle=`rgba(${core},${alpha})`;      ctx.lineWidth=w;     ctx.stroke();
      }

      const gCore='224,170,66', gGlow='150,92,18';   // gedämpftes Messing-Gold
      const wCore='225,222,212', wGlow='120,118,110'; // kühles Calcit-Weiß

      // ── Gold-Hauptadern (breit, diagonal) ────────────────────────
      vein(   0, 360, 2048,1040, 7.5,0.92, gCore,gGlow, 11,1.0);
      vein( 120,   0,  960,2048, 6.0,0.86, gCore,gGlow, 23,1.1);
      vein( 700,   0, 1800,1600, 5.0,0.82, gCore,gGlow, 37,0.9);
      vein(   0,1360, 1300,2048, 4.6,0.80, gCore,gGlow, 47,1.0);
      // ── Weiße Calcit-Adern (Kontrast, dünner, krummer) ───────────
      vein( 300,   0, 1500,1700, 3.0,0.55, wCore,wGlow, 53,1.3);
      vein(   0, 820, 1700, 300, 2.4,0.50, wCore,wGlow, 67,1.4);
      vein( 900,1900, 2048, 600, 2.2,0.46, wCore,wGlow, 79,1.2);
      // ── Mittlere Gold-Verzweigungen ──────────────────────────────
      vein( 300,   0, 1240,1400, 3.2,0.74, gCore,gGlow, 71,1.0);
      vein(1100, 600, 2048,1800, 3.0,0.70, gCore,gGlow, 97,1.1);
      vein( 500,1600, 1600,2048, 2.6,0.66, gCore,gGlow,107,0.9);
      vein(1640, 400, 2048,1160, 2.4,0.64, gCore,gGlow,117,1.0);
      // ── Haarfeine Adern (gold + weiß gemischt) ───────────────────
      for(let i=0;i<16;i++){
        const sx=pr(i*19)*S, ex=pr(i*19+7)*S;
        const sy=pr(i*13)*S*0.3, ey=pr(i*13+3)*S;
        const white=(i%3===0);
        vein(sx,sy,ex,ey, 0.9, white?0.34:0.46, white?wCore:gCore, white?wGlow:gGlow, i*43+200, 1.5);
      }

      // ── Großformat-Plattenfugen (2×2, dezent & dunkel statt Gold) ─
      const half=S/2;
      ctx.lineCap='butt';
      ctx.strokeStyle='rgba(0,0,0,0.42)'; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(half,0); ctx.lineTo(half,S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,half); ctx.lineTo(S,half); ctx.stroke();
      ctx.strokeStyle='rgba(170,160,140,0.10)'; ctx.lineWidth=1.5; // hauchfeiner Fasen-Glanz
      [half-3,half+3].forEach(p=>{
        ctx.beginPath(); ctx.moveTo(p,0); ctx.lineTo(p,S); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,p); ctx.lineTo(S,p); ctx.stroke();
      });

      // ── Polierter Sheen: weicher diagonaler Lichtgradient ────────
      const sheen=ctx.createLinearGradient(0,0,S,S*0.6);
      sheen.addColorStop(0,   'rgba(255,250,240,0.05)');
      sheen.addColorStop(0.4, 'rgba(255,250,240,0)');
      sheen.addColorStop(0.7, 'rgba(255,250,240,0.03)');
      sheen.addColorStop(1,   'rgba(255,250,240,0)');
      ctx.fillStyle=sheen; ctx.fillRect(0,0,S,S);

      const tex=new T.CanvasTexture(cv);
      tex.wrapS=tex.wrapT=T.RepeatWrapping;
      tex.repeat.set(1.5,1.6);   // große Platten, kaum sichtbare Wiederholung
      if (renderer) tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
      tex.needsUpdate=true;
      return tex;
    }

    // ── Paintings ────────────────────────────────────────────────
    const _paintMeshes = []; // nur Gemälde-Planes – für schnellen Raycaster

    function buildPaintings(T) {
      const imgs = [IMG_0,IMG_1,IMG_2,IMG_3,IMG_4,IMG_5,IMG_6,IMG_7,IMG_8,IMG_9,IMG_10,IMG_11,IMG_12,IMG_13,IMG_14,IMG_15];
      PICS.forEach((p,i) => addPainting(T, { title: PAINTING_TITLES[i], img: imgs[i], texIdx: i }, p.x, p.y, p.z, p.rotY));
    }

    // Werk für einen Platz in Raum 4/5: echtes Werk, wenn der Titel mit Bild in ARTWORKS steht,
    // sonst Platzhalter („Werk folgt").
    function roomWork(title, n, label) {
      const a = ARTWORKS[title];
      if (a && a.img) return { title, img: a.img };
      return { title, placeholder: true, roman: ROMAN[n] || String(n + 1), label };
    }

    // Platzhalter-Fläche: dezent dunkel mit feinen goldenen Linien
    function makePlaceholderTex(T, art) {
      const cv=document.createElement('canvas'); cv.width=1024; cv.height=1280;
      const ctx=cv.getContext('2d');
      const gr=ctx.createLinearGradient(0,0,1024,1280);
      gr.addColorStop(0,'#1d1b18'); gr.addColorStop(1,'#2a2722');
      ctx.fillStyle=gr; ctx.fillRect(0,0,1024,1280);
      ctx.strokeStyle='rgba(201,168,76,0.55)'; ctx.lineWidth=3;  ctx.strokeRect(52,52,920,1176);
      ctx.strokeStyle='rgba(201,168,76,0.28)'; ctx.lineWidth=2;  ctx.strokeRect(68,68,888,1144);
      ctx.fillStyle='rgba(201,168,76,0.85)';
      ctx.font='300 150px "Georgia","Times New Roman",serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(art.roman, 512, 540);
      ctx.strokeStyle='rgba(201,168,76,0.45)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(352,680); ctx.lineTo(672,680); ctx.stroke();
      ctx.font='300 26px Arial,sans-serif'; ctx.fillStyle='rgba(222,200,150,0.75)';
      ctx.fillText('HORST  SCHWAB', 512, 740);
      ctx.fillText(art.label + (_lang === 'en' ? '  ·  COMING  SOON' : '  ·  WERK  FOLGT'), 512, 788);
      const tex=new T.CanvasTexture(cv);
      tex.encoding=T.sRGBEncoding;
      tex.wrapS=T.RepeatWrapping;
      tex.repeat.x=-1; tex.offset.x=1; // Bilder rendern von der Rückseite → vorab spiegeln
      return tex;
    }

    // art = { title, img?, texIdx?, placeholder?, roman?, label? }
    function addPainting(T, art, x, y, z, rotY) {
      const g = new T.Group();
      const tex = art.placeholder ? makePlaceholderTex(T, art) : makeTex(T, art.texIdx != null ? art.texIdx : 16);
      const mat = new T.MeshStandardMaterial({map:tex, roughness:0.88, metalness:0.0, side:T.DoubleSide});
      const paint = new T.Mesh(new T.PlaneGeometry(1,1), mat); // Einheitsfläche, per scale dimensioniert
      paint.position.z=0.025;
      if (art.title) paint.userData.artworkTitle = art.title;
      if (art.placeholder) paint.userData.placeholder = true;
      _paintMeshes.push(paint);
      g.add(paint);

      // Rahmen-Untergruppe (wird bei Bildladung an das echte Seitenverhältnis angepasst)
      const fm=new T.MeshStandardMaterial({color:0x1c1c1c, roughness:0.90, metalness:0.02});
      const frameG=new T.Group(); g.add(frameG);

      // Freistehender Schilderständer vor dem Bild (wie im echten Museum):
      // schlanker Pfosten mit Fuß und ein angewinkeltes Goldrahmen-Schild oben.
      // Das Schild wird vom Besucher von der Rückseite der Plane betrachtet,
      // daher wird das Canvas horizontal gespiegelt gezeichnet (wie die Gemälde).
      const _t=art.title||''; const _a=art.placeholder ? null : ARTWORKS[_t];
      if (_t) {
        const _tech=_a ? [_lang === 'en' ? _a.technique_en : _a.technique, _a.year].filter(Boolean).join('  ·  ') : (art.placeholder ? (_lang === 'en' ? 'Coming soon' : 'Werk folgt') : '');
        const F_ARTIST='italic 600 46px "Times New Roman",Georgia,serif';
        const F_TITLE ='700 70px "Times New Roman",Georgia,serif';
        const F_TECH  ='500 44px "Times New Roman",Georgia,serif';
        const _m=document.createElement('canvas').getContext('2d');
        _m.font=F_ARTIST; const _wA=_m.measureText('Horst Schwab').width;
        const _tShow=art.placeholder ? _roomWorkLabel(_t) : _t;   // Platzhalter im englischen Modus übersetzt
        _m.font=F_TITLE;  const _wT=_m.measureText(_tShow).width;
        _m.font=F_TECH;   const _wC=_tech? _m.measureText(_tech).width : 0;
        const LH=360, padX=96;
        const LW=Math.ceil(Math.max(_wA,_wT,_wC)+padX*2);
        const lCv=document.createElement('canvas'); lCv.width=LW; lCv.height=LH;
        const lCtx=lCv.getContext('2d');
        lCtx.translate(LW,0); lCtx.scale(-1,1); // Rückseiten-Spiegelung
        const _bg=lCtx.createLinearGradient(0,0,0,LH);
        _bg.addColorStop(0,'#f8f2e6'); _bg.addColorStop(1,'#ebe1cd');
        lCtx.fillStyle=_bg; lCtx.fillRect(0,0,LW,LH);
        // Goldrahmen: kräftige Außenleiste + feine Innenlinie (Passepartout-Optik)
        lCtx.strokeStyle='#a87f2a'; lCtx.lineWidth=11; lCtx.strokeRect(15,15,LW-30,LH-30);
        lCtx.strokeStyle='#dcbb5e'; lCtx.lineWidth=3;  lCtx.strokeRect(28,28,LW-56,LH-56);
        lCtx.textAlign='center'; const _cx=LW/2;
        lCtx.fillStyle='#8a6a28'; lCtx.font=F_ARTIST; lCtx.fillText('Horst Schwab',_cx,96);
        lCtx.strokeStyle='#c9a84c'; lCtx.lineWidth=2;
        lCtx.beginPath(); lCtx.moveTo(_cx-78,122); lCtx.lineTo(_cx+78,122); lCtx.stroke();
        lCtx.fillStyle='#161410'; lCtx.font=F_TITLE; lCtx.fillText(_tShow,_cx,204);
        if(_tech){lCtx.fillStyle='#5c564a'; lCtx.font=F_TECH; lCtx.fillText(_tech,_cx,288);}
        const lTex=new T.CanvasTexture(lCv);
        lTex.minFilter=T.LinearFilter; lTex.magFilter=T.LinearFilter; lTex.generateMipmaps=false;
        if (renderer) lTex.anisotropy=renderer.capabilities.getMaxAnisotropy();

        const SZ=-0.52;             // Abstand vor der Wand (zum Raum hin)
        const FLOOR=-PY;            // Bodenhöhe in lokalen Koordinaten
        const POSTH=0.97;           // Pfostenhöhe
        const metal=new T.MeshBasicMaterial({color:0x2b2b2b});
        // Schild (A5) – leicht zum Betrachter gekippt, auf dunklem Träger
        const LPLH=0.18, LPLW=LPLH*LW/LH;
        const signG=new T.Group();
        signG.position.set(0, FLOOR+POSTH+0.10, SZ);
        signG.rotation.x=0.34;
        // Schwarzer Snap-Frame-Halter, ringsum etwas größer als das Schild
        const FB=0.026;                                   // Rahmenbreite
        const holder=new T.Mesh(new T.BoxGeometry(LPLW+2*FB, LPLH+2*FB, 0.022), metal);
        holder.position.z=0.012; signG.add(holder);
        // Vordere Rahmenlippe (4 Leisten) – wie ein echter Klapprahmen
        const HW=LPLW/2+FB/2, HH=LPLH/2+FB/2;
        [[LPLW+2*FB, FB, 0,  HH],[LPLW+2*FB, FB, 0, -HH],
         [FB, LPLH,  HW, 0],[FB, LPLH, -HW, 0]
        ].forEach(([w,h,px,py])=>{
          const bar=new T.Mesh(new T.BoxGeometry(w,h,0.012), metal);
          bar.position.set(px,py,0.002); signG.add(bar);
        });
        const lb=new T.Mesh(new T.PlaneGeometry(LPLW,LPLH), new T.MeshBasicMaterial({map:lTex, side:T.DoubleSide}));
        lb.position.z=-0.002; signG.add(lb);
        g.add(signG);
        // Gerader Pfosten + flacher rechteckiger Standfuß (dunkles Metall)
        const post=new T.Mesh(new T.CylinderGeometry(0.017,0.017,POSTH,12), metal);
        post.position.set(0, FLOOR+POSTH/2, SZ); g.add(post);
        const base=new T.Mesh(new T.BoxGeometry(0.36,0.022,0.27), metal);
        base.position.set(0, FLOOR+0.011, SZ); g.add(base);
        const base2=new T.Mesh(new T.BoxGeometry(0.30,0.020,0.22), metal); // leichte Stufe
        base2.position.set(0, FLOOR+0.031, SZ); g.add(base2);
      }

      // Legt Bildfläche, Rahmen und Schild auf eine gegebene Größe (pw×ph) aus.
      function layout(pw, ph){
        paint.scale.set(pw, ph, 1);
        while(frameG.children.length) frameG.remove(frameG.children[0]);
        const fb=0.030, fd=0.030;        // Rahmen-Leistenbreite & -tiefe (flach)
        const overlap=0.010;             // Falz: Rahmen liegt direkt auf der Bildkante (kein Spalt)
        const cx=pw/2-overlap+fb/2, cy=ph/2-overlap+fb/2; // Leisten-Mittelpunkte → Innenkante = Bildkante
        const fw=2*cx+fb, fh=2*cy+fb;    // Außenmaße (Quer-/Längsleisten stoßen bündig)
        // Lokal zeigt +z zur Wand, −z zum Betrachter (Bild liegt bei z=0.025). Die Rahmenfront
        // sitzt daher 3 mm vor der Bildfläche (z=0.022), die Tiefe läuft zur Wand hin (+z)
        // → Rahmen schließt direkt ans Bild an und schwebt nicht davor.
        const fz=0.022+fd/2;
        [[fw,fb,fd, 0, cy,fz],[fw,fb,fd, 0,-cy,fz],
         [fb,fh,fd,-cx,0,fz],[fb,fh,fd, cx,0,fz]
        ].forEach(([w,h,d,px,py,pz])=>{
          const b=new T.Mesh(new T.BoxGeometry(w,h,d),fm);
          b.position.set(px,py,pz); frameG.add(b);
        });
      }
      layout(PW, PH); // Startgröße bis das Foto geladen ist

      const artImg = art.img;
      if (artImg) {
        _texPending++;
        new T.TextureLoader().load(artImg, t => {
          t.encoding = T.sRGBEncoding;
          t.wrapS = T.RepeatWrapping;
          // Texturkante leicht einrücken: schneidet den hellen Papier-/Scanrand der
          // Vorlagen weg, der sonst als weißer Streifen zwischen Bild und Rahmen sichtbar ist.
          // (x bleibt zusätzlich gespiegelt – Bilder rendern von der Rückseite.)
          const m = 0.03;
          t.repeat.set(-(1 - 2*m), 1 - 2*m);
          t.offset.set(1 - m, m);
          t.needsUpdate = true;
          mat.map = t;
          mat.needsUpdate = true;
          // Rahmen/Fläche an das echte Bild-Seitenverhältnis anpassen
          const iw=(t.image&&(t.image.naturalWidth||t.image.width))||0;
          const ih=(t.image&&(t.image.naturalHeight||t.image.height))||0;
          if (iw && ih){
            const a=iw/ih, MAXW=1.95, MAXH=2.30;
            let ph=MAXH, pw=MAXH*a;
            if (pw>MAXW){ pw=MAXW; ph=MAXW/a; }
            layout(pw, ph);
          }
          _texDone();
        }, undefined, _texDone);
      }

      g.position.set(x,y,z); g.rotation.y=rotY;
      _add(g);
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
    function buildFurniture(T, benchZs, chairs) {
      benchZs = benchZs || [-9, -33];
      chairs  = chairs  || [[-3.8, -16.6, 0.55], [3.8, BACK_Z + 1.3, -0.55]];   // Raum 1 hinten links, Raum 2 hinten rechts
      // Cream/sand upholstered solid bench blocks (museum style)
      const topMat = new T.MeshStandardMaterial({color:0xd6cfbb, roughness:0.88, metalness:0.0});
      const sideMat= new T.MeshStandardMaterial({color:0xc8c0ab, roughness:0.90, metalness:0.0});
      const legMat = new T.MeshStandardMaterial({color:0xaaaaaa, roughness:0.42, metalness:0.65});

      benchZs.forEach(bz=>{
        [[-0.95],[0.95]].forEach(([bx])=>{
          // Weicher Kontaktschatten unter der Bank
          addGroundShadow(T, bx, bz, 1.95, 1.02, 0.82);
          // Cushion body
          const body=new T.Mesh(new T.BoxGeometry(1.50, 0.36, 0.58), topMat);
          body.position.set(bx, 0.27, bz); _add(body);
          // Side face (slightly darker)
          const side=new T.Mesh(new T.BoxGeometry(1.50, 0.36, 0.58), sideMat);
          side.position.set(bx, 0.27, bz); _add(side);
          // Four slim metal legs
          [[-0.62,0.22],[0.62,0.22],[-0.62,-0.22],[0.62,-0.22]].forEach(([lx,lz])=>{
            const leg=new T.Mesh(new T.BoxGeometry(0.045,0.34,0.045),legMat);
            leg.position.set(bx+lx, 0.17, bz+lz); _add(leg);
          });
        });
      });

      // Galerie-Sessel in den Ecken – blicken zur Raummitte
      chairs.forEach(([cx, cz, ry]) => {
        addGroundShadow(T, cx, cz, 0.95, 0.95, 0.7);
        buildChair(T, cx, cz, ry);
      });
    }

    function buildChair(T, cx, cz, rotY) {
      // LC2-inspirierter Sessel: sichtbarer Chromrahmen + helle Polster
      const chromeMat = new T.MeshBasicMaterial({color:0xc0c0c0});
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
      _add(g);
    }

    // ── Plants ───────────────────────────────────────────────────
    function buildPlants(T, list) {
      (list || [[4.0,-1.5],[4.0,-16.5],[-4.0,-23.5]]).forEach(([px,pz]) => {
        addGroundShadow(T, px, pz, 0.95, 0.95, 0.75);
        buildPlant(T, px, pz);
      });
    }

    // ── Klassische Marmorsäulen ──────────────────────────────────
    // Kannelierter Schaft via Canvas-Textur (günstig statt aufwändiger Geometrie).
    function makeColumnTex(T) {
      const W=512, H=512;
      const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
      const ctx=cv.getContext('2d');
      const flutes=24;
      for(let x=0;x<W;x++){
        const shade=0.5+0.5*Math.cos((x/W)*flutes*Math.PI*2); // 1=Grat, 0=Rille
        const v=182+Math.round(shade*66);                     // kräftigerer Kontrast
        ctx.fillStyle='rgb('+v+','+(v-8)+','+(v-20)+')';
        ctx.fillRect(x,0,1,H);
        // dunkle Linie in der Rillenmitte für mehr Tiefe
        if(shade<0.06){ ctx.fillStyle='rgba(70,60,44,0.30)'; ctx.fillRect(x,0,1,H); }
      }
      ctx.globalAlpha=0.06; ctx.strokeStyle='#8c7f64'; ctx.lineWidth=1;
      for(let i=0;i<12;i++){ const y=Math.random()*H; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W, y+(Math.random()*24-12)); ctx.stroke(); }
      ctx.globalAlpha=1;
      const tex=new T.CanvasTexture(cv);
      tex.wrapS=tex.wrapT=T.RepeatWrapping; tex.repeat.set(1,3);
      return tex;
    }

    function buildColumn(T, x, z, shaftMat, stoneMat) {
      const g=new T.Group();
      const R=0.205, Rt=0.17;
      const TOP=RH-0.15;                 // Kapitell endet knapp UNTER den Lichtschienen
      let y=0;
      function ring(rt,rb,h){ const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,24),stoneMat); m.position.y=y+h/2; g.add(m); y+=h; }
      // Plinthe (quadratischer Sockel)
      const pl=new T.Mesh(new T.BoxGeometry(0.66,0.16,0.66),stoneMat); pl.position.y=0.08; g.add(pl); y=0.16;
      // Basis: Wulst – Wulst – Hohlkehle – Wulst – Fillet (mehr Konturen)
      ring(0.36,0.38,0.05);
      ring(0.33,0.36,0.05);
      ring(0.27,0.33,0.06);              // Hohlkehle (Scotia)
      ring(0.31,0.27,0.05);              // oberer Wulst
      ring(R+0.02,0.31,0.04);            // Fillet/Apophyge
      const baseTop=y;
      const capH=0.50;
      const shaftH=TOP-baseTop-capH;
      // Schaft (verjüngt, kanneliert)
      const sh=new T.Mesh(new T.CylinderGeometry(Rt,R,shaftH,30),shaftMat); sh.position.y=baseTop+shaftH/2; g.add(sh); y=baseTop+shaftH;
      // Kapitell: Astragal – Hals – Ring – Echinus – Annulet – Abakus
      ring(Rt+0.02,Rt,0.04);             // Astragal
      ring(Rt+0.015,Rt+0.02,0.10);       // Hals (necking)
      ring(0.25,Rt+0.015,0.05);          // Ring
      ring(0.31,0.25,0.14);              // Echinus (Wulst)
      ring(0.33,0.31,0.04);              // Annulet
      const ab=new T.Mesh(new T.BoxGeometry(0.62,0.13,0.62),stoneMat); ab.position.y=y+0.065; g.add(ab);
      g.position.set(x,0,z); _add(g);
    }

    let _colMats = null;
    function columnMats(T) {
      if (!_colMats) _colMats = {
        shaft: new T.MeshStandardMaterial({map:makeColumnTex(T), color:0xf2ede2, roughness:0.58, metalness:0.03}),
        stone: new T.MeshStandardMaterial({color:0xece6d6, roughness:0.6, metalness:0.02}),
      };
      return _colMats;
    }
    function buildColumns(T) {
      const cm = columnMats(T);
      // x=+/-2.5: Schaft bleibt frei vom Pfeilerschild; Höhe endet unter den Schienen
      [[-2.5,-17.6],[2.5,-17.6], [-2.5,-22.4],[2.5,-22.4], [-2.5,BACK_Z + 0.4],[2.5,BACK_Z + 0.4]]
        .forEach(([x,z])=>buildColumn(T,x,z,cm.shaft,cm.stone));
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
        map: leafTex, alphaTest: 0.4,
        roughness: 0.72, side: T.DoubleSide
      });

      // Betonkübel
      const pot = new T.Mesh(new T.CylinderGeometry(0.25, 0.23, 0.52, 12), potMat);
      pot.position.set(cx, 0.26, cz); _add(pot);
      const soil = new T.Mesh(new T.CylinderGeometry(0.238, 0.238, 0.03, 12), soilMat);
      soil.position.set(cx, 0.54, cz); _add(soil);

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
        _add(g);
      });
    }

    // ── Lights ───────────────────────────────────────────────────
    function buildLights(T) {
      // Diffuses neutrales Deckenlicht (wie im bevorzugten Original);
      // die Raumlichter setzt buildRoomShell je Raum
      scene.add(new T.AmbientLight(0xffffff, 0.95));
    }

    // ── Picture Lights (decorative brass lamps above each frame) ─
    let _plRes = null;
    function addPictureLight(T, p) {
      if (!_plRes) {
        // Gebürstetes Messing – reagiert auf das vorhandene Deckenlicht und zeigt so die
        // Rundung der Röhre (kein zusätzliches Licht, nur realistischere Struktur).
        const armCurve = new T.QuadraticBezierCurve3(   // Schwanenhals-Arm (klassische Bilderleuchte)
          new T.Vector3(0, 0.0,   0.012),               // Ansatz an der Rosette
          new T.Vector3(0, 0.085, 0.020),               // Bogen steigt nah an der Wand auf
          new T.Vector3(0, 0.072, 0.108)                // mündet hinten in die Röhre
        );
        _plRes = {
          brass:  new T.MeshStandardMaterial({color:0xa9842f, metalness:0.9, roughness:0.26}),
          gPlate: new T.CylinderGeometry(0.020, 0.020, 0.010, 20),   // kleine runde Rosette
          gArm:   new T.TubeGeometry(armCurve, 32, 0.0055, 8, false),// dünner Messingbogen
          gTube:  new T.CylinderGeometry(0.015, 0.015, 0.58, 24),    // sehr schlanke Röhre
          gCap:   new T.CylinderGeometry(0.009, 0.015, 0.016, 24),   // gewölbte Endkappe
        };
      }
      const R = _plRes, lampY = PY + PH/2 + 0.12;  // knapp über dem Rahmen
      const lamp = new T.Group();
      lamp.position.set(p.x, lampY, p.z);
      lamp.rotation.y = p.rotY + Math.PI;   // lokal: +z = in den Raum, +x = entlang der Wand
      const plate = new T.Mesh(R.gPlate, R.brass);
      plate.rotation.x = Math.PI/2; plate.position.set(0, 0, 0.005); lamp.add(plate);
      lamp.add(new T.Mesh(R.gArm, R.brass));
      const tube = new T.Mesh(R.gTube, R.brass);
      tube.rotation.z = Math.PI/2; tube.position.set(0, 0.072, 0.125); lamp.add(tube);
      [-0.295, 0.295].forEach(ex => {
        const cap = new T.Mesh(R.gCap, R.brass);
        cap.rotation.z = ex < 0 ? Math.PI/2 : -Math.PI/2;
        cap.position.set(ex, 0.072, 0.125);
        lamp.add(cap);
      });
      _add(lamp);
    }
    function buildPictureLights(T) {
      PICS.forEach(p => addPictureLight(T, p));
    }

    // ── Wall Signage ─────────────────────────────────────────────
    function makeWallSignTex(T, large, script, caption) {
      if (script == null) script = 'Horst Schwab';
      if (caption == null) caption = _lang === 'en' ? 'G  A  L  L  E  R  Y' : 'G  A  L  E  R  I  E';
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
      ctx.fillText(script, W/2, caption ? midY : (midY + capY) / 2 + scriptSize * 0.12);

      if (caption) {
        // Dünne Trennlinie
        ctx.strokeStyle=ink;
        ctx.lineWidth=1.0;
        ctx.beginPath(); ctx.moveTo(W/2-155,lineY); ctx.lineTo(W/2+155,lineY); ctx.stroke();

        // Gesperrte Versalien
        ctx.font=`300 ${capSize}px "Cormorant Garamond", serif`;
        ctx.fillText(caption, W/2, capY);
      }

      return new T.CanvasTexture(cv);
    }

    function addWallSign(T, w, h, x, y, z, ry, large, script, caption) {
      const tex = makeWallSignTex(T, large, script, caption);
      const mat = new T.MeshBasicMaterial({map:tex, side:T.DoubleSide});
      const m   = new T.Mesh(new T.PlaneGeometry(w,h), mat);
      m.position.set(x,y,z); m.rotation.y=ry; _add(m);
      // Font-Update sobald Great Vibes geladen
      document.fonts.load(`${large?188:142}px "Great Vibes"`).then(()=>{
        m.material.map = makeWallSignTex(T, large, script, caption);
        m.material.needsUpdate = true;
      }).catch(()=>{});
      return m;
    }
    function buildWallSigns(T) {
      const sign = (w,h,x,y,z,ry,large) => addWallSign(T, w, h, x, y, z, ry, large);

      // Rückwand Raum 2 (BACK_Z) — groß, mittig, aus Raum 2 sichtbar (Galerie-Hauptschild)
      sign(3.20, 2.00,  0,   2.10, BACK_Z + 0.10, 0, true);
      // Horst-Schwab-Schild am Torbogen-Pfeiler (Bogen jetzt bei z=-18)
      sign(1.30, 0.82,  3.4, 2.50, -17.90, 0,        false);   // aus Raum 1 sichtbar
      sign(1.30, 0.82,  3.4, 2.50, -22.10, Math.PI,  false);   // aus Raum 2 sichtbar
    }

    // ══ Raum 3: Plastik-Raum ═════════════════════════════════════════
    const _sculpts = [];   // Plastiken (Billboards), werden pro Frame zum Betrachter gedreht

    // Weicher, warmer Lichtfleck (für Spot-Licht auf Wand und Boden)
    let _glowTex = null;
    function getGlowTex(T) {
      if (_glowTex) return _glowTex;
      const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s;
      const ctx = cv.getContext('2d');
      const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
      g.addColorStop(0,    'rgba(255,226,170,0.95)');
      g.addColorStop(0.35, 'rgba(255,214,150,0.45)');
      g.addColorStop(1,    'rgba(255,205,140,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
      _glowTex = new T.CanvasTexture(cv);
      return _glowTex;
    }

    let _pedMats = null;
    function pedestalMats(T) {
      if (!_pedMats) _pedMats = {
        rod:   new T.MeshBasicMaterial({color: new T.Color(0x2a2a26).convertSRGBToLinear()}),   // Anthrazit, unabhängig vom Licht
        // obere Kanten: feiner Goldschimmer durch das Spotlight
        rodTop:new T.MeshStandardMaterial({color:0x8B6E2E, roughness:0.32, metalness:0.55, emissive:0x3a2a0c}),
        plate: new T.MeshStandardMaterial({color:0x34322d, roughness:0.92, metalness:0.05}),
        head:  new T.MeshStandardMaterial({color:0x1e1e1c, roughness:0.5, metalness:0.4}),
        lens:  new T.MeshBasicMaterial({color:0xfff1d6}),
        glow:  new T.MeshBasicMaterial({map:getGlowTex(T), transparent:true, depthWrite:false, blending:T.AdditiveBlending, opacity:0.30}),
        glowF: new T.MeshBasicMaterial({map:getGlowTex(T), transparent:true, depthWrite:false, blending:T.AdditiveBlending, opacity:0.22}),
        shadow:new T.MeshBasicMaterial({map:getShadowTex(T), transparent:true, depthWrite:false, opacity:0.55}),
      };
      return _pedMats;
    }

    // Offener Metallrahmen-Sockel: 12 dünne Kanten, matte Deckplatte, Spot von der Decke.
    // Lokale Raum-3-Koordinaten; side = −1 linke / +1 rechte Wand.
    function buildPedestal(T, x, z, side) {
      const PM = pedestalMats(T), w = PED.w, h = PED.h, t = 0.014, e = w/2 - t/2;
      const g = new T.Group(); g.position.set(x, 0, z);
      const rod = (sx, sy, sz, px, py, pz, mat) => { const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), mat); m.position.set(px, py, pz); g.add(m); };
      [[-e,-e],[e,-e],[-e,e],[e,e]].forEach(([px, pz]) => rod(t, h, t, px, h/2, pz, PM.rod));     // 4 senkrechte Kanten
      [-e, e].forEach(p => {
        rod(w, t, t, 0, t/2, p, PM.rod);   rod(t, t, w, p, t/2, 0, PM.rod);                         // 4 untere Kanten
        rod(w, t, t, 0, h - t/2, p, PM.rodTop); rod(t, t, w, p, h - t/2, 0, PM.rodTop);             // 4 obere Kanten (Gold)
      });
      const plate = new T.Mesh(new T.BoxGeometry(w + 0.012, 0.012, w + 0.012), PM.plate);          // dünne, matte Deckplatte
      plate.position.y = h + 0.006; g.add(plate);
      const ps = new T.Mesh(new T.PlaneGeometry(w * 0.78, w * 0.78), PM.shadow);                   // Schatten der Plastik auf der Platte
      ps.rotation.x = -Math.PI/2; ps.position.y = h + 0.0125; g.add(ps);
      _add(g);
      addGroundShadow(T, x, z, w * 2.0, w * 2.0, 0.75);                                          // weicher Bodenschatten

      // Spot von oben: Strahlerkopf an der äußeren Schiene, auf die Plastik gerichtet
      const hx = side * 2.6, hy = RH - 0.16, ty = h + 0.30;
      const head = new T.Mesh(new T.CylinderGeometry(0.045, 0.055, 0.16, 18), PM.head);
      head.position.set(hx, hy, z); head.rotation.z = Math.atan2(x - hx, -(ty - hy)); _add(head);
      const lens = new T.Mesh(new T.CircleGeometry(0.04, 18), PM.lens);
      const dx = x - hx, dy = ty - hy, dl = Math.hypot(dx, dy);
      lens.position.set(hx + dx/dl * 0.085, hy + dy/dl * 0.085, z);
      lens.lookAt(new T.Vector3(x, ty, z));   // noch ohne Elternobjekt → lokale Ausrichtung
      _add(lens);
      // Lichtkegel als weicher Schein auf Wand und Boden
      const wallGlow = new T.Mesh(new T.PlaneGeometry(1.7, 2.6), PM.glow);
      wallGlow.position.set(side * (RW/2 - 0.03), 1.95, z); wallGlow.rotation.y = side < 0 ? Math.PI/2 : -Math.PI/2; _add(wallGlow);
      const floorGlow = new T.Mesh(new T.PlaneGeometry(1.6, 1.6), PM.glowF);
      floorGlow.rotation.x = -Math.PI/2; floorGlow.position.set(x, 0.008, z); _add(floorGlow);
    }

    // Plastik als freigestelltes Foto (Billboard) auf dem Podest; zeigt je nach Blickseite
    // Ansicht 1 oder 2 (weiche Überblendung). Daten aus ARTWORKS (Quelle der Kollektion).
    function addSculpture(T, title, xl, zl, side) {
      const d = ARTWORKS[title], wp = r3w(xl, zl);
      const g = new T.Group(); g.position.set(wp.x, PED.h + 0.012, wp.z); scene.add(g);
      const planes = d.views.slice(0, 2).map((src, i) => {
        const mat = new T.MeshBasicMaterial({color:0xf3eee6, transparent:true, alphaTest:0.03, side:T.DoubleSide, opacity: i ? 0 : 1});
        const geo = new T.PlaneGeometry(1, 1); geo.translate(0, 0.5, 0);
        const m = new T.Mesh(geo, mat);
        m.position.z = i * 0.003; m.renderOrder = 2 + i; m.visible = false;
        g.add(m);
        const base = src.replace('Images/', 'Images/vr-plastik/');
        const loader = new T.TextureLoader();
        let col = null, msk = null;
        const done = () => {
          if (!col || !msk) return;
          col.encoding = T.sRGBEncoding;
          mat.map = col; mat.alphaMap = msk; mat.needsUpdate = true;
          const a = (col.image.naturalWidth || col.image.width) / (col.image.naturalHeight || col.image.height);
          const pw = Math.min(PED.w * 1.0, 0.62 * a);               // Größe passend zur Plattenbreite
          m.scale.set(pw, pw / a, 1);
          m.visible = mat.opacity > 0.01;
          m.userData.ready = true;
        };
        _texPending += 2;
        loader.load(base, t => { col = t; done(); _texDone(); }, undefined, _texDone);
        loader.load(base.replace(/\.jpg$/i, '-mask.jpg'), t => { msk = t; done(); _texDone(); }, undefined, _texDone);
        return m;
      });
      // Unsichtbare Trefferfläche für Hover/Klick (wie bei den Bildern)
      const hit = new T.Mesh(new T.BoxGeometry(PED.w + 0.06, 0.68, PED.w + 0.06), new T.MeshBasicMaterial({visible:false}));
      hit.position.y = 0.33; hit.userData.artworkTitle = title; g.add(hit);
      _paintMeshes.push(hit);
      // Blickrichtung des Podests (zur Raummitte) in Weltkoordinaten
      const f = r3w(-side, 0), o = r3w(0, 0);
      _sculpts.push({ g, planes, fx: f.x - o.x, fz: f.z - o.z });
    }

    // Wandschild hinter der Plastik: Gestaltung wie die Bildschilder (creme, Goldrahmen), nur größer.
    // Lokale Raum-3-Koordinaten; side = −1 linke / +1 rechte Wand. Klick öffnet das Werk.
    let _signHolderMat = null;   // dunkler Träger, von allen Plastik-Schildern geteilt
    function addSculptureSign(T, title, z, side) {
      if (!_signHolderMat) _signHolderMat = new T.MeshBasicMaterial({color:0x2b2b2b});
      const d = ARTWORKS[title], tech = [_lang === 'en' ? d.technique_en : d.technique, d.year].filter(Boolean).join('  ·  ');
      const W = 1024, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#f8f2e6'); bg.addColorStop(1, '#ebe1cd');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // Goldrahmen: kräftige Außenleiste + feine Innenlinie (wie die Bildschilder)
      ctx.strokeStyle = '#a87f2a'; ctx.lineWidth = 16; ctx.strokeRect(20, 20, W - 40, H - 40);
      ctx.strokeStyle = '#dcbb5e'; ctx.lineWidth = 4;  ctx.strokeRect(40, 40, W - 80, H - 80);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8a6a28'; ctx.font = 'italic 600 64px "Times New Roman",Georgia,serif';
      ctx.fillText('Horst Schwab', W/2, 146);
      ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(W/2 - 110, 180); ctx.lineTo(W/2 + 110, 180); ctx.stroke();
      // Titel und Technik notfalls schmaler setzen, damit sie im Rahmen bleiben
      const fit = (txt, font, size, y) => {
        ctx.font = font.replace('$', size);
        const w = ctx.measureText(txt).width, max = W - 170;
        if (w > max) ctx.font = font.replace('$', Math.floor(size * max / w));
        ctx.fillText(txt, W/2, y);
      };
      ctx.fillStyle = '#161410'; fit(title, '700 $px "Times New Roman",Georgia,serif', 100, 300);
      if (tech) { ctx.fillStyle = '#5c564a'; fit(tech, '500 $px "Times New Roman",Georgia,serif', 64, 400); }
      const tex = new T.CanvasTexture(cv);
      if (renderer) tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

      // 90 × 45 cm, Unterkante über der Plastik (auch von der Tour-Station aus darüber zu sehen);
      // vor dem Lichtschein des Spots, auf einem dunklen Träger
      const SW = 0.90, SH = 0.45, y = 2.45, ry = side < 0 ? Math.PI/2 : -Math.PI/2;
      const holder = new T.Mesh(new T.BoxGeometry(0.035, SH + 0.04, SW + 0.04), _signHolderMat);
      holder.position.set(side * (RW/2 - 0.0175), y, z); _add(holder);
      const sign = new T.Mesh(new T.PlaneGeometry(SW, SH), new T.MeshBasicMaterial({map:tex}));
      sign.position.set(side * (RW/2 - 0.037), y, z); sign.rotation.y = ry;
      sign.userData.artworkTitle = title;
      _paintMeshes.push(sign);
      _add(sign);
    }

    function updateSculptures() {
      if (!cam) return;
      for (const s of _sculpts) {
        const dx = cam.position.x - s.g.position.x, dz = cam.position.z - s.g.position.z;
        const dl = Math.hypot(dx, dz) || 1;
        s.g.rotation.y = Math.atan2(dx, dz);                          // dem Betrachter zuwenden
        const side = (s.fz * dx - s.fx * dz) / dl;                    // −1 … 1: von welcher Seite man schaut
        // frontal und von links: Ansicht 1; erst deutlich von rechts (> ca. 15–35°): Ansicht 2
        const k = Math.max(0, Math.min(1, (side - 0.25) / 0.32));
        const wB = k * k * (3 - 2 * k);                               // weiche Überblendung
        const [a, b] = s.planes;
        a.material.opacity = 1 - wB; a.visible = !!a.userData.ready && a.material.opacity > 0.01;
        if (b) { b.material.opacity = wB; b.visible = !!b.userData.ready && wB > 0.01; }
      }
    }

    function buildSculptureRoom(T) {
      const M = roomMats(T), cm = columnMats(T);
      const g = new T.Group();
      g.position.set(R3.ox, 0, R3.oz); g.rotation.y = Math.PI/2; g.userData.container = true;
      scene.add(g); g.updateMatrixWorld(true);
      _buildTarget = g;
      try {
        // Durchgang in Raum 2: Goldrahmen + Schild „Plastik" darüber (schon aus Raum 2 sichtbar)
        addPortal(T, 0, R3.aw, 1, _lang === 'en' ? 'Sculpture' : 'Plastik');
        // Rückseite des Sturzes (vom Gang aus gesehen) – verdeckt auch die Schild-Rückseite
        _occ(addPlane(T, R3.aw + 0.02, RH - PORTAL.crown, M.trans, [0, PORTAL.crown + (RH - PORTAL.crown)/2, -0.012], [0, Math.PI, 0]));
        buildConnector(T, -R3.conn/2, R3.aw, R3.conn);
        // Eingangswand des Plastik-Raums mit Torbogen – gleicher Aufbau wie die Bögen zwischen Raum 1 und 2
        buildArchWall(T, R3.entry, R3.aw, PORTAL.crown);
        addPortal(T, R3.entry - 0.09, R3.aw, -1);
        // Raum selbst: derselbe Aufbau wie Raum 1 und 2
        buildRoomShell(T, { depth:R3.depth, cz:R3.cz, fillRows:[R3.rows[0], R3.rows[R3.rows.length - 1]], lightRows:R3.rows, extraLights:[R3.entry, R3.end] });
        // Ausgang: Torbogen und kurzer Gang in die linke Wand von Raum 4 (gleicher Aufbau wie der Eingang)
        buildArchWall(T, R3.end, R3.aw, PORTAL.crown);
        addPortal(T, R3.end + 0.09, R3.aw, 1, _lang === 'en' ? 'Painting' : 'Malerei');
        buildConnector(T, R3.end - R3.conn/2, R3.aw, R3.conn);
        addPortal(T, R3.exit, R3.aw, -1);                                                         // Marmorportal am Durchgang in Raum 4
        _occ(addPlane(T, R3.aw + 0.02, RH - PORTAL.crown, M.trans, [0, PORTAL.crown + (RH - PORTAL.crown)/2, R3.exit + 0.012], [0, 0, 0]));  // Sturz-Rückseite
        [[-2.5, R3.entry - 0.4], [2.5, R3.entry - 0.4], [-2.5, R3.end + 0.4], [2.5, R3.end + 0.4]]
          .forEach(([x, z]) => buildColumn(T, x, z, cm.shaft, cm.stone));
        // Podeste im Rhythmus der Bilder: je Reihe links, dann rechts
        SCULPTURE_TITLES.forEach((title, i) => {
          const side = i % 2 === 0 ? -1 : 1, zl = R3.rows[Math.floor(i / 2)];
          buildPedestal(T, side * PED.x, zl, side);
          addSculptureSign(T, title, zl, side);
        });
        // Zierelemente: Rundbogennischen zwischen den Podesten, zwei Bänke davor (Blick auf die
        // gegenüberliegenden Plastiken), Pflanzen in den vier Ecken – der Mittelgang bleibt frei
        const gaps = R3.rows.slice(1).map((z, i) => (z + R3.rows[i]) / 2);
        gaps.forEach(z => [-1, 1].forEach(side => addNiche(T, side, z, RW)));
        [-1, 1].forEach(side => addWallBench(T, side, gaps[gaps.length - 1], RW));
        buildPlants(T, [[-4.2, R3.entry - 0.75], [4.2, R3.entry - 0.75], [-4.2, R3.end + 0.75], [4.2, R3.end + 0.75]]);
      } finally {
        _buildTarget = null;
      }
      SCULPTURE_TITLES.forEach((title, i) => {
        const side = i % 2 === 0 ? -1 : 1, zl = R3.rows[Math.floor(i / 2)];
        addSculpture(T, title, side * PED.x, zl, side);
      });
    }

    // ══ Obere lange Seite: Raum 4 (Malerei) + Raum 5 (Grafik) ═════════
    // Spiegelbild von Raum 2 + 1: gleiche Bausteine, gleiche Hängung, gleiche Möblierung.
    function buildRow2(T) {
      const M = roomMats(T), cm = columnMats(T), aw = 3.6;
      const g = new T.Group();
      g.position.set(ROW2.ox, 0, ROW2.oz); g.rotation.y = Math.PI; g.userData.container = true;
      scene.add(g); g.updateMatrixWorld(true);
      _buildTarget = g;
      try {
        // Raum 4: Startwand (wie Rückwand Raum 2) mit Schild; Durchgang von Raum 3 links am Anfang
        buildRoomShell(T, { depth:ROW2.r4Depth, cz:-ROW2.r4Depth/2, fillRows:[-2,-5,-11,-17], lightRows:ROW2.r4Rows, extraLights:[-ROW2.r4Depth, 0],
          openings:[ROW2.r4Open] });
        _occ(addPlane(T, RW, RH, M.trans, [0, RH/2, 0], [0, Math.PI, 0]));
        addWallSign(T, 3.20, 2.00, 0, 2.10, -0.10, Math.PI, true, 'Horst Schwab', _lang === 'en' ? 'P  A  I  N  T  I  N  G' : 'M  A  L  E  R  E  I');
        // Torbögen + Verbindung Raum 4 → 5 (wie Raum 1 → 2)
        buildArchWall(T, -ROW2.r4Depth, aw);
        buildConnector(T, -ROW2.r4Depth - ROW2.conn/2, aw, ROW2.conn);
        buildArchWall(T, ROW2.r5Start, aw);
        addArchFrame(T, -ROW2.r4Depth, aw);
        addArchFrame(T, ROW2.r5Start, aw);
        addWallSign(T, 1.30, 0.82, 3.4, 2.50, -ROW2.r4Depth + 0.10, 0,       false);   // aus Raum 4 sichtbar
        addWallSign(T, 1.30, 0.82, 3.4, 2.50, ROW2.r5Start - 0.10,  Math.PI, false);   // aus Raum 5 sichtbar
        // Raum 5: Endwand mit Paneelen (wie Eingangswand Raum 1); Durchgang zum Gang links am Ende
        const r5Depth = ROW2.r5Start - ROW2.r5End;
        buildRoomShell(T, { depth:r5Depth, cz:ROW2.r5Start - r5Depth/2, fillRows:ROW2.r5Rows.concat(ROW2.r5End + 1.2), lightRows:ROW2.r5Rows, extraLights:[ROW2.r5Start],
          openings:[ROW2.r5Open] });
        addPanelWall(T, ROW2.r5End, 0);
        // Werke: je Reihe linke, dann rechte Wand – Hängung, Rahmen und Leuchten wie Raum 1
        const hang = (rows, list, label) => rows.forEach((z, i) => {
          [[-WALLX, -Math.PI/2], [WALLX, Math.PI/2]].forEach(([x, rotY], k) => {
            const n = 2*i + k, title = list[n];
            if (!title) return;
            addPainting(T, roomWork(title, n, label), x, PY, z, rotY);
            addPictureLight(T, { x, z, rotY });
          });
        });
        hang(ROW2.r4Rows, VR_ROOM_WORKS.malerei, _lang === 'en' ? 'PAINTING' : 'MALEREI');
        hang(ROW2.r5Rows, VR_ROOM_WORKS.grafik,  _lang === 'en' ? 'GRAPHICS' : 'GRAFIK');
        // Säulen, Bänke, Pflanzen, Sessel – gespiegelte Positionen von Raum 1/2
        [[-2.5,-0.4],[2.5,-0.4],[-2.5,-ROW2.r4Depth+0.4],[2.5,-ROW2.r4Depth+0.4],[-2.5,ROW2.r5Start-0.4],[2.5,ROW2.r5Start-0.4]]
          .forEach(([x, z]) => buildColumn(T, x, z, cm.shaft, cm.stone));
        // Sessel vorn in Raum 5: blickt in den Raum zur Mitte. Die Gruppe ist um 180° gedreht,
        // darum lokal π − 0,55 (wie der Sessel in Raum 1, nur gespiegelt)
        buildFurniture(T, [ROW2.oz + 33, ROW2.oz + 9], [[-3.8, ROW2.oz + 16.6, Math.PI - 0.55]]);
        buildPlants(T, [[4.0, ROW2.oz + 1.5], [4.0, ROW2.oz + 16.5], [-4.0, ROW2.oz + 23.5]]);
      } finally {
        _buildTarget = null;
      }
    }

    // ══ Zierelemente (Raum 3 und Gang) ══════════════════════════════
    // Alle Bausteine werden an eine Seitenwand gesetzt: side −1 = linke Wand (x = −W/2),
    // +1 = rechte Wand; lokal liegt x entlang der Wand, y nach oben, z aus der Wand heraus.
    function _onWall(T, side, W, z) {
      const g = new T.Group();
      g.position.set(side * W/2, 0, z); g.rotation.y = side < 0 ? Math.PI/2 : -Math.PI/2;
      _add(g);
      return g;
    }
    // Nischen-Innenfläche in Anthrazit (wie Sockelverkleidung und Stirnwände) – hebt sich von der hell
    // ausgeleuchteten Wand ab. Die Tiefe ist eingemalt (Schatten unter dem Bogen, dunklere Ränder),
    // so braucht die Nische weder echte Vertiefung noch eigenes Licht
    let _nicheMat = null;
    function nicheMat(T) {
      if (_nicheMat) return _nicheMat;
      const W = 256, H = 512, r = W/2;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, r); ctx.arc(r, r, r, Math.PI, 0); ctx.lineTo(W, H); ctx.closePath();
      ctx.save(); ctx.clip();
      const v = ctx.createLinearGradient(0, 0, 0, H);
      v.addColorStop(0, '#1d1b19'); v.addColorStop(0.35, '#34312d'); v.addColorStop(1, '#45413c');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
      const h = ctx.createLinearGradient(0, 0, W, 0);
      h.addColorStop(0, 'rgba(0,0,0,0.35)'); h.addColorStop(0.22, 'rgba(0,0,0,0)');
      h.addColorStop(0.78, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = h; ctx.fillRect(0, 0, W, H);
      ctx.restore();
      _nicheMat = new T.MeshStandardMaterial({ map: new T.CanvasTexture(cv), roughness: 0.95, alphaTest: 0.5 });
      return _nicheMat;
    }
    // Rundbogennische mit Stuckrahmung, Schlussstein und Gesims (Breite w, Unterkante y0)
    function addNiche(T, side, z, W) {
      const M = roomMats(T), g = _onWall(T, side, W, z);
      const w = 1.1, h = 2.2, y0 = 1.38, r = w/2, fw = 0.06, yr = y0 + h - r;   // yr: Bogenansatz
      const inner = new T.Mesh(new T.PlaneGeometry(w, h), nicheMat(T));
      inner.position.set(0, y0 + h/2, 0.012); g.add(inner);
      [-1, 1].forEach(sx => {
        const post = new T.Mesh(new T.BoxGeometry(fw, yr - y0, 0.04), M.mold);
        post.position.set(sx * (r + fw/2), (y0 + yr)/2, 0.03); g.add(post);
      });
      const arch = new T.Mesh(new T.TorusGeometry(r + fw/2, fw/2, 6, 28, Math.PI), M.mold);
      arch.position.set(0, yr, 0.03); g.add(arch);
      // feine Goldkante innen entlang von Pfosten und Bogen (wie die Goldleisten der Wände)
      const gl = 0.016;
      [-1, 1].forEach(sx => {
        const e = new T.Mesh(new T.BoxGeometry(gl, yr - y0, 0.02), M.rail);
        e.position.set(sx * (r - gl/2), (y0 + yr)/2, 0.02); g.add(e);
      });
      const garc = new T.Mesh(new T.TorusGeometry(r - gl/2, gl/2, 4, 28, Math.PI), M.rail);
      garc.position.set(0, yr, 0.02); g.add(garc);
      const key = new T.Mesh(new T.BoxGeometry(0.11, 0.15, 0.06), M.mold);
      key.position.set(0, yr + r + fw * 0.6, 0.035); g.add(key);
      const sill = new T.Mesh(new T.BoxGeometry(w + 0.22, 0.05, 0.12), M.mold);
      sill.position.set(0, y0 - 0.025, 0.06); g.add(sill);
    }
    // Gerahmtes Stuck-Wandfeld (Breite w, Höhe h, Unterkante y0): Stuckrahmen außen, feiner Goldrahmen innen
    function addStuccoPanel(T, side, z, W, w, h, y0) {
      const M = roomMats(T), g = _onWall(T, side, W, z);
      [[0, 0.045, 0.03, M.mold], [0.1, 0.016, 0.018, M.rail]].forEach(([inset, fw, d, mat]) => {
        const pw = w - 2*inset, ph = h - 2*inset, cy = y0 + h/2;
        [[0, cy + ph/2 - fw/2, pw, fw], [0, cy - ph/2 + fw/2, pw, fw],
         [-pw/2 + fw/2, cy, fw, ph - 2*fw], [pw/2 - fw/2, cy, fw, ph - 2*fw]].forEach(([x, y, bw, bh]) => {
          const b = new T.Mesh(new T.BoxGeometry(bw, bh, d), mat);
          b.position.set(x, y, 0.015 + d/2); g.add(b);
        });
      });
    }
    // Goldene Wandleuchte (Applike) mit Milchglas-Schirm und sanftem Lichtkegel an der Wand
    let _sconceGlass = null;
    function addSconce(T, side, z, W) {
      const M = roomMats(T), g = _onWall(T, side, W, z), y = 2.45;
      _sconceGlass = _sconceGlass || new T.MeshBasicMaterial({ color: 0xfff6ea });
      const plate = new T.Mesh(new T.BoxGeometry(0.11, 0.22, 0.02), M.rail);
      plate.position.set(0, y, 0.02); g.add(plate);
      const arm = new T.Mesh(new T.BoxGeometry(0.024, 0.024, 0.16), M.rail);
      arm.position.set(0, y, 0.1); g.add(arm);
      const cup = new T.Mesh(new T.CylinderGeometry(0.035, 0.028, 0.05, 12), M.rail);
      cup.position.set(0, y + 0.03, 0.18); g.add(cup);
      const shade = new T.Mesh(new T.CylinderGeometry(0.045, 0.07, 0.15, 14), _sconceGlass);
      shade.position.set(0, y + 0.13, 0.18); g.add(shade);
      // Lichtschein an der Wand nur gemalt – ein echtes Licht würde im Licht-Pool (feste Anzahl)
      // den Nachbarräumen Lichter wegnehmen und sie dunkler machen
      const glow = new T.Mesh(new T.PlaneGeometry(1.1, 1.1), sconceGlowMat(T));
      glow.position.set(0, y + 0.18, 0.006); g.add(glow);
    }
    let _sconceGlow = null;
    function sconceGlowMat(T) {
      if (_sconceGlow) return _sconceGlow;
      const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
      const ctx = cv.getContext('2d'), gr = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
      gr.addColorStop(0, 'rgba(255,250,242,0.55)'); gr.addColorStop(0.35, 'rgba(255,250,242,0.18)'); gr.addColorStop(1, 'rgba(255,250,242,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, S, S);
      _sconceGlow = new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false });
      return _sconceGlow;
    }
    // Sitzbank längs zur Wand (Polster wie in Raum 1/2), Blick in den Raum
    function addWallBench(T, side, z, W) {
      const x = side * (W/2 - 0.55);
      const top = new T.MeshStandardMaterial({ color: 0xd6cfbb, roughness: 0.88 });
      const leg = new T.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.42, metalness: 0.65 });
      addGroundShadow(T, x, z, 1.02, 1.95, 0.82);
      const body = new T.Mesh(new T.BoxGeometry(0.58, 0.36, 1.5), top);
      body.position.set(x, 0.27, z); _add(body);
      [[-0.22, -0.62], [0.22, -0.62], [-0.22, 0.62], [0.22, 0.62]].forEach(([lx, lz]) => {
        const l = new T.Mesh(new T.BoxGeometry(0.045, 0.34, 0.045), leg);
        l.position.set(x + lx, 0.17, z + lz); _add(l);
      });
    }

    // Stirnwand (Breite W, Blickseite +z) mit derselben Verkleidung wie die Seitenwände:
    // Wandfläche, dunkles Paneel, Goldleiste, Sockel- und Kranzleiste
    function addFinishedEndWall(T, z, W) {
      const M = roomMats(T), wH = 1.12, L = W + 0.01;
      _occ(addPlane(T, W, RH, M.wall, [0, RH/2, z], [0, 0, 0]));
      addPlane(T, W, wH, M.panel, [0, wH/2, z + 0.013], [0, 0, 0]);
      addBox(T, L, 0.036, 0.024, M.rail, [0, wH + 0.018, z + 0.013]);
      addBox(T, L, 0.11,  0.055, M.mold, [0, 0.055, z + 0.022]);
      addBox(T, L, 0.04,  0.022, M.mold, [0, 0.13,  z + 0.022]);
      addBox(T, L, 0.022, 0.10,  M.mold, [0, RH - 0.011, z + 0.022]);
      addBox(T, L, 0.10,  0.022, M.mold, [0, RH - 0.062, z + 0.022]);
    }

    // ══ Linke kurze Seite: schmaler Verbindungsgang (Raum 5 → Raum 1) ═══
    // Gleicher Aufbau wie die Räume, nur schmaler; keine Werke.
    function buildGang(T) {
      const M = roomMats(T);
      const g = new T.Group();
      g.position.set(GANG.ox, 0, GANG.oz); g.rotation.y = -Math.PI/2; g.userData.container = true;
      scene.add(g); g.updateMatrixWorld(true);
      _buildTarget = g;
      try {
        const fills = []; for (let z = -4; z > -GANG.depth; z -= 7) fills.push(z);
        buildRoomShell(T, { width:GANG.w, depth:GANG.depth, cz:-GANG.depth/2, fillRows:fills, fillIntensity:0.22, extraLights:[],
          openings:[GANG.r1Open] });
        addFinishedEndWall(T, -GANG.depth, GANG.w);                                              // Stirnwand hinter Raum-1-Eingang
        addPortal(T, 0, GANG.w, 1);                                                              // Marmorportal zum Durchgang in Raum 5
        // Zierelemente: Stuck-Wandfelder im Rhythmus, dazwischen goldene Wandleuchten mit sanftem Licht
        [-4, -8, -12, -16].forEach(z => [-1, 1].forEach(side => addStuccoPanel(T, side, z, GANG.w, 2.0, 2.1, 1.4)));
        addStuccoPanel(T, 1, GANG.ox, GANG.w, 2.0, 2.1, 1.4);                                    // mittig gegenüber dem Torbogen zu Raum 1
        [-2, -6, -10, -14, -18].forEach(z => [-1, 1].forEach(side => addSconce(T, side, z, GANG.w)));
        _occ(addPlane(T, GANG.w + 0.02, RH - PORTAL.crown, M.wall, [0, PORTAL.crown + (RH - PORTAL.crown)/2, -0.012], [0, Math.PI, 0]));   // Sturz-Rückseite, hell wie die Gangwände
      } finally {
        _buildTarget = null;
      }
    }

    // ── Kassetten-Decke ──────────────────────────────────────────
    function makeCeilingTex(T) {
      const S=1024;
      const cv=document.createElement('canvas'); cv.width=S; cv.height=S;
      const ctx=cv.getContext('2d');
      ctx.fillStyle='#f4f1ea'; ctx.fillRect(0,0,S,S);
      const cols=3,rows=3,cw=S/cols,ch=S/rows,f1=S*0.032,f2=S*0.058;
      ctx.strokeStyle='rgba(128,120,105,0.48)'; ctx.lineWidth=7;
      for(let i=0;i<=cols;i++){ctx.beginPath();ctx.moveTo(i*cw,0);ctx.lineTo(i*cw,S);ctx.stroke();}
      for(let i=0;i<=rows;i++){ctx.beginPath();ctx.moveTo(0,i*ch);ctx.lineTo(S,i*ch);ctx.stroke();}
      ctx.strokeStyle='rgba(148,138,118,0.28)'; ctx.lineWidth=3.5;
      for(let c=0;c<cols;c++) for(let r=0;r<rows;r++) ctx.strokeRect(c*cw+f1,r*ch+f1,cw-2*f1,ch-2*f1);
      ctx.strokeStyle='rgba(155,145,125,0.16)'; ctx.lineWidth=2;
      for(let c=0;c<cols;c++) for(let r=0;r<rows;r++) ctx.strokeRect(c*cw+f2,r*ch+f2,cw-2*f2,ch-2*f2);
      for(let c=0;c<cols;c++) for(let r=0;r<rows;r++){
        const cx=c*cw+cw/2,cy=r*ch+ch/2,ro=S*0.024;
        ctx.fillStyle='rgba(182,152,62,0.20)'; ctx.beginPath(); ctx.arc(cx,cy,ro,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(182,152,62,0.32)'; ctx.beginPath(); ctx.arc(cx,cy,ro*0.5,0,Math.PI*2); ctx.fill();
      }
      ctx.fillStyle='rgba(178,148,55,0.28)'; const ds=S*0.022;
      for(let i=0;i<=cols;i++) for(let j=0;j<=rows;j++) ctx.fillRect(i*cw-ds/2,j*ch-ds/2,ds,ds);
      const tex=new T.CanvasTexture(cv);
      tex.wrapS=tex.wrapT=T.RepeatWrapping; tex.repeat.set(3,4);
      return tex;
    }

    // ── Ambient-Occlusion-Streifen an Wandfüßen ──────────────────
    // ── Boden-Schimmer unter Oberlicht ───────────────────────────
    function buildFloorReflection(T) {
      const mat=new T.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.055, depthWrite:false});
      [[18,-9],[22,-33]].forEach(([depth,cz])=>{
        const p=new T.Mesh(new T.PlaneGeometry(7.0,depth),mat);
        p.rotation.x=-Math.PI/2; p.position.set(0,0.004,cz); scene.add(p);
      });
    }

    // ══ Räume als Gruppen: nur sichtbare Räume werden gerendert ═══════
    // Bereiche in Weltkoordinaten (Reihenfolge = Priorität an Grenzen)
    const ZONES = {
      R1:  { x0:-5,    x1:5,    z0:-18,    z1:0.05 },
      C12: { x0:-1.8,  x1:1.8,  z0:-22,    z1:-18 },
      R2:  { x0:-5,    x1:5,    z0:BACK_Z - 0.2, z1:-22 },
      C23: { x0:-7,    x1:-5,   z0:CORNER_Z - CW/2, z1:CORNER_Z + CW/2 },
      R3:  { x0:-19,   x1:-7,   z0:CORNER_Z - RW/2, z1:CORNER_Z + RW/2 },
      C34: { x0:-21,   x1:-19,  z0:CORNER_Z - CW/2, z1:CORNER_Z + CW/2 },
      R4:  { x0:-31,   x1:-21,  z0:BACK_Z - 0.2, z1:-22 },
      C45: { x0:-27.8, x1:-24.2,z0:-22,    z1:-18 },
      R5:  { x0:-31,   x1:-21,  z0:-18,    z1:ROW2.oz - ROW2.r5End + 0.05 },
      G:   { x0:-21,   x1:CW/2 + 0.7, z0:-0.05, z1:GANG_Z + CW/2 + 0.05 },
    };
    const ZONE_ORDER = Object.keys(ZONES);
    // Von welchem Bereich aus ist welcher sichtbar (durch Torbögen und Durchgänge)
    const ZONE_VIS = {
      R1:  ['R1','C12','R2','C23','G'],
      C12: ['C12','R1','R2','C23','G'],
      // Die Ecken-Durchgänge liegen auf einer Linie: von Raum 2 sieht man durch Raum 3 bis in Raum 4
      R2:  ['R2','C12','R1','C23','R3','C34','R4','G'],
      C23: ['C23','R2','R3','C34','R4','C12'],
      R3:  ['R3','C23','C34','R2','R4'],
      C34: ['C34','R3','R4','C23','R2','C45','R5'],
      R4:  ['R4','C34','R3','C23','R2','C45','R5','G'],
      C45: ['C45','R4','C34','R3','R5','G'],
      R5:  ['R5','C45','R4','C34','R3','G','R1'],
      G:   ['G','R5','R1','C12','R2'],
    };
    Object.keys(ZONE_VIS).forEach(k => ZONE_VIS[k] = new Set(ZONE_VIS[k]));
    let _zoneGroups = null, _curZone = null, _hitList = [];
    function zoneAt(x, z) {
      for (const k of ZONE_ORDER) { const r = ZONES[k]; if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return k; }
      return null;
    }
    function nearestZone(x, z) {
      let best = 'R1', bd = Infinity;
      for (const k of ZONE_ORDER) {
        const r = ZONES[k], dx = Math.max(r.x0 - x, 0, x - r.x1), dz = Math.max(r.z0 - z, 0, z - r.z1), d = dx*dx + dz*dz;
        if (d < bd) { bd = d; best = k; }
      }
      return best;
    }
    // Nach dem Bau: jedes Objekt der Raum-Gruppe zuordnen, in der sein Mittelpunkt liegt
    function partitionZones(T) {
      _zoneGroups = {};
      ZONE_ORDER.forEach(k => { const g = new T.Group(); g.name = 'zone-' + k; _zoneGroups[k] = g; });
      scene.updateMatrixWorld(true);
      const items = [];
      scene.children.slice().forEach(o => {
        if (o.isLight || o.isCamera) return;
        if (o.userData.container) o.children.slice().forEach(ch => items.push(ch)); else items.push(o);
      });
      const box = new T.Box3(), c = new T.Vector3();
      items.forEach(o => {
        box.setFromObject(o);
        if (box.isEmpty()) o.getWorldPosition(c); else box.getCenter(c);
        _zoneGroups[zoneAt(c.x, c.z) || nearestZone(c.x, c.z)].attach(o);
      });
      scene.children.slice().forEach(o => { if (o.userData.container) scene.remove(o); });
      ZONE_ORDER.forEach(k => { _zoneGroups[k].userData.zone = k; scene.add(_zoneGroups[k]); });
      const zoneOfObj = o => { while (o && !(o.userData && o.userData.zone)) o = o.parent; return o ? o.userData.zone : null; };
      _paintMeshes.concat(_occluders).forEach(m => m.userData.zone = zoneOfObj(m));
      _lightDefs.forEach(d => d.zone = zoneAt(d.pos.x, d.pos.z) || nearestZone(d.pos.x, d.pos.z));
    }
    function setAllZonesVisible() { if (_zoneGroups) ZONE_ORDER.forEach(k => _zoneGroups[k].visible = true); }
    // Knapp hinter einer Zonengrenze sieht man noch, was nur aus der Nachbarzone sichtbar ist
    // (z. B. aus dem Durchgang Raum 2 → 3 schräg zurück bis in Raum 1). Darum gelten die
    // Sichtmengen aller Zonen im Umkreis von VIS_NEAR zusammen. Ohne Speicher-Allokation pro Bild:
    // Zonen als Bitmaske, vereinigte Mengen werden einmal gebildet und wiederverwendet.
    const VIS_NEAR = 1.5;
    const _visByMask = new Map();
    let _curMask = -1, _curVis = null;
    function updateZone(force) {
      if (!_zoneGroups || !cam) return;
      const x = cam.position.x, z = cam.position.z;
      const k = zoneAt(x, z) || _curZone || nearestZone(x, z);
      let mask = 1 << ZONE_ORDER.indexOf(k);
      for (let i = 0; i < ZONE_ORDER.length; i++) {
        const r = ZONES[ZONE_ORDER[i]], dx = Math.max(r.x0 - x, 0, x - r.x1), dz = Math.max(r.z0 - z, 0, z - r.z1);
        if (dx*dx + dz*dz < VIS_NEAR*VIS_NEAR) mask |= 1 << i;
      }
      _curZone = k;
      if (mask === _curMask && !force) return;
      _curMask = mask;
      let vis = _visByMask.get(mask);
      if (!vis) {
        vis = new Set();
        ZONE_ORDER.forEach((zk, i) => { if (mask & (1 << i)) ZONE_VIS[zk].forEach(v => vis.add(v)); });
        _visByMask.set(mask, vis);
      }
      _curVis = vis;
      ZONE_ORDER.forEach(zk => _zoneGroups[zk].visible = vis.has(zk));
      _hitList = _paintMeshes.concat(_occluders).filter(m => vis.has(m.userData.zone));
    }

    // ── Licht-Pool: feste Anzahl echter Punktlichter, die jeweils die nächsten Raumlichter
    //    der sichtbaren Räume übernehmen; Wechsel werden weich überblendet (kein Aufpoppen).
    //    14 Lichter: wirken nahezu wie 22, kosten bei voller Retina-Auflösung aber nur ~6 ms pro Bild
    //    (ab 16 springt die Grafikzeit auf über 11 ms, bei 22 auf ~26 ms); weniger als 14 lassen
    //    entferntere Wände zu dunkel und gelblich wirken. 2 Plätze bleiben frei für ausblendende Lichter.
    const LIGHT_POOL = 14, LIGHT_NEAR = 12;
    const _pool = [], _lpCand = [], _lpActive = [];
    let _lpFirst = true;
    function buildLightPool(T) {
      for (let i = 0; i < LIGHT_POOL; i++) { const pl = new T.PointLight(0xffffff, 0, 1, 1); scene.add(pl); _pool.push(pl); }
    }
    function updateLights(dt) {
      if (!_pool.length || !_curVis) return;
      const vis = _curVis, cp = cam.position;
      _lpCand.length = 0;
      for (const d of _lightDefs) { d.want = 0; d.dist = d.pos.distanceToSquared(cp); if (vis.has(d.zone)) _lpCand.push(d); }
      _lpCand.sort((a, b) => a.dist - b.dist);
      for (let i = 0; i < _lpCand.length && i < LIGHT_NEAR; i++) _lpCand[i].want = 1;
      const step = _lpFirst ? 1 : Math.min(1, dt / 350);
      _lpFirst = false;
      _lpActive.length = 0;
      for (const d of _lightDefs) {
        d.w += Math.max(-step, Math.min(step, d.want - d.w));
        if (d.w > 0.002) _lpActive.push(d);
      }
      _lpActive.sort((a, b) => (b.w - a.w) || (a.dist - b.dist));
      for (let i = 0; i < LIGHT_POOL; i++) {
        const pl = _pool[i], d = _lpActive[i];
        if (d) { pl.position.copy(d.pos); pl.color.setHex(d.color); pl.distance = d.distance; pl.decay = d.decay; pl.intensity = d.intensity * d.w; }
        else pl.intensity = 0;
      }
    }

    // ── Treffer unter dem Mauszeiger: erstes Objekt entlang des Strahls; Wände verdecken
    //    (beidseitig, auch von der Rückseite) die Werke dahinter.
    function pickArt(raycaster) {
      const wall = _rm && _rm.wall, side = wall ? wall.side : null;
      if (wall) wall.side = THREE.DoubleSide;
      const hits = raycaster.intersectObjects(_hitList, false);
      if (wall) wall.side = side;
      const h = hits[0];
      return h && h.object.userData.artworkTitle ? h.object : null;
    }

    // ── Kamerafahrt: geschlossene Runde ──────────────────────────
    // R1 → R2 → (Ecke, 90° links) → R3 → (Ecke) → R4 → R5 → (Ecke) → Gang → (Ecke) → R1.
    // Jede Station kennt ihre Blickrichtung vorwärts und rückwärts; Bild-/Plastik-Ansichten
    // sind in beiden Richtungen gleich. Nach der letzten Station folgt wieder Station 0 –
    // das ist exakt die Startposition vor Raum 1 (kein Sprung, kein Neuladen).
    function buildSeq(T) {
      seq = [];
      const m4 = new T.Matrix4(), up = new T.Vector3(0, 1, 0);
      const camQuat = (pos, look) => { m4.lookAt(pos, look, up); return new T.Quaternion().setFromRotationMatrix(m4); };
      const LY_WALK = CAM_Y + 0.35;                       // beim Gehen leicht nach oben (Oberlicht)
      const HOLD = { walk: 250, turn: 250, view: 3800, start: 600 };
      // l = Blickziel vorwärts; rev = eigenes Blickziel rückwärts (sonst Gegenrichtung von l)
      function add(p, l, ly, kind, hold, rev) {
        const pos = new T.Vector3(p.x, CAM_Y, p.z);
        const quat = camQuat(pos, new T.Vector3(l.x, ly, l.z));
        const r = rev || { x: 2*p.x - l.x, z: 2*p.z - l.z };
        const quatRev = camQuat(pos, new T.Vector3(r.x, ly, r.z));                  // gleiche Neigung
        seq.push({ pos, quat, quatRev, kind, hold: hold != null ? hold : HOLD[kind] });
      }
      // Ecke: schräger Blick zum Durchgang – die 90°-Drehung verteilt sich weich auf zwei Schritte
      function corner(p, ahead, side) { add(p, { x: p.x + ahead.x*2 + side.x*4, z: p.z + ahead.z*2 + side.z*4 }, LY_WALK, 'turn'); }
      // Ein Raum der Runde: map(xl, zl) → Welt (lokal −z = Laufrichtung)
      function walk(map, zl, kind, hold) { add(map(0, zl), map(0, zl - 4), LY_WALK, kind || 'walk', hold); }
      function turn(map, zl, lookMap, lzl) { add(map(0, zl), lookMap(0, lzl), LY_WALK, 'turn'); }
      function rows(map, list, wallX, lookY, has) {
        list.forEach((zl, i) => {
          walk(map, zl);
          if (!has || has(2*i))     add(map(0, zl), map(-wallX, zl), lookY, 'view');   // linke Wand
          if (!has || has(2*i + 1)) add(map(0, zl), map( wallX, zl), lookY, 'view');   // rechte Wand
        });
      }
      const r1 = (x, z) => ({ x, z });
      const LY_PIC = PY, LY_SCULPT = PED.h + 0.28;

      // Start vor Raum 1 (im Gang), Blick in Raum 1; rückwärts: Blick den Gang entlang
      add({ x: 0, z: GANG_Z }, { x: 0, z: GANG_Z - 4 }, LY_WALK, 'walk', HOLD.start, { x: -4, z: GANG_Z });
      // Raum 1 → Durchgang → Raum 2
      rows(r1, [-3, -7, -11, -15], WALLX, LY_PIC);
      walk(r1, -20);
      rows(r1, [-25, -29, -33, -37], WALLX, LY_PIC);
      // Ecke Raum 2 → 3: bis zur Ecke gehen (Blick schräg zum Durchgang), 90° links, hindurch
      corner({ x: 0, z: CORNER_Z }, { x: 0, z: -1 }, { x: -1, z: 0 });
      turn(r1, CORNER_Z, r3w, -4);
      walk(r3w, -R3.conn/2);
      // Raum 3: Plastiken
      rows(r3w, R3.rows, PED.x, LY_SCULPT, i => !!SCULPTURE_TITLES[i]);
      walk(r3w, R3.end + 1.2);
      walk(r3w, R3.end - R3.conn/2);
      // Ecke Raum 3 → 4
      walk(r3w, R3.exit - RW/2);
      turn(r3w, R3.exit - RW/2, rw2, -4);
      // Raum 4 → Durchgang → Raum 5
      rows(rw2, ROW2.r4Rows, WALLX, LY_PIC);
      walk(rw2, -ROW2.r4Depth - ROW2.conn/2);
      rows(rw2, ROW2.r5Rows, WALLX, LY_PIC);
      // Ecke Raum 5 → Gang
      corner({ x: ROW2.ox, z: GANG_Z }, { x: 0, z: 1 }, { x: 1, z: 0 });
      turn(rw2, ROW2.oz - GANG_Z, gw, -6);
      // Gang (Stationen etwa alle 6 m), bis vor den Eingang von Raum 1 – die Linksdrehung
      // dort führt zurück zu Station 0
      for (let zl = -3; zl > GANG.ox + 2; zl -= 6) walk(gw, zl);
      corner({ x: 0, z: GANG_Z }, { x: 1, z: 0 }, { x: 0, z: -1 });

      tourDir = 1;
      cam.position.copy(seq[0].pos);
      cam.quaternion.copy(seq[0].quat);
      fromPos.copy(seq[0].pos); fromQuat.copy(seq[0].quat);
      seqIdx=0; phase='hold'; t0=performance.now();
    }

    // ── Begehbarer Bereich beim freien Erkunden ─────────────────
    // Überall ca. 1,8 m Abstand zu Wänden und Bildern/Podesten. Der Bereich besteht aus
    // sich überlappenden Rechtecken (Räume und Durchgänge); Bänke sind Hindernisse.
    const WALK_GAP = 1.8;
    const WALK_RECTS = (() => {
      const g = WALK_GAP, xMax = WALLX - g, ch = CW/2 - 0.3;           // Durchgänge: 0,3 m Abstand zu den Wänden
      const r3a = r3w(-(RW/2 - g), R3.entry - g), r3b = r3w(RW/2 - g, R3.end + g);
      const x4 = ROW2.ox;                                               // Mittellinie Raum 4/5
      return [
        { x0:-xMax, x1:xMax, z0:-18 + g,  z1:0.05 - g },                // Raum 1
        { x0:-ch,   x1:ch,   z0:-g - 0.2, z1:GANG_Z + 0.3 },            // Torbogen Gang ↔ Raum 1
        { x0:-1.5,  x1:1.5,  z0:-22 - g,  z1:-18 + g },                 // Durchgang Raum 1 ↔ 2
        { x0:-xMax, x1:xMax, z0:BACK_Z + g, z1:-22 - g },               // Raum 2
        { x0:Math.max(r3a.x, r3b.x) - 0.2, x1:-xMax + 0.15, z0:CORNER_Z - ch, z1:CORNER_Z + ch },   // Raum 2 ↔ 3
        { x0:Math.min(r3a.x, r3b.x), x1:Math.max(r3a.x, r3b.x), z0:Math.min(r3a.z, r3b.z), z1:Math.max(r3a.z, r3b.z) }, // Raum 3
        { x0:x4 + xMax - 0.15, x1:Math.min(r3a.x, r3b.x) + 0.2, z0:CORNER_Z - ch, z1:CORNER_Z + ch }, // Raum 3 ↔ 4
        { x0:x4 - xMax, x1:x4 + xMax, z0:BACK_Z + g, z1:-22 - g },      // Raum 4
        { x0:x4 - 1.5,  x1:x4 + 1.5,  z0:-22 - g, z1:-18 + g },         // Durchgang Raum 4 ↔ 5
        { x0:x4 - xMax, x1:x4 + xMax, z0:-18 + g, z1:ROW2.oz - ROW2.r5End - g }, // Raum 5
        { x0:x4 + xMax - 0.15, x1:GANG.ox + GANG.depth - 0.3, z0:GANG_Z - ch, z1:GANG_Z + ch },   // Gang (bis 0,3 m vor die Stirnwand)
      ];
    })();
    const BENCHES = [-9, -33].map(z => ({ x0:-2.15, x1:2.15, z0:z-0.7, z1:z+0.7 }))         // inkl. Puffer
      .concat([-9, -33].map(z => ({ x0:ROW2.ox - 2.15, x1:ROW2.ox + 2.15, z0:z-0.7, z1:z+0.7 })));
    function inRect(p, r) { return p.x >= r.x0 && p.x <= r.x1 && p.z >= r.z0 && p.z <= r.z1; }
    function clampIntoRect(p, r) { return { x: Math.max(r.x0, Math.min(r.x1, p.x)), z: Math.max(r.z0, Math.min(r.z1, p.z)) }; }

    // Hält p im begehbaren Bereich; prev = letzte gültige Position. Liegt p außerhalb,
    // wird es in das Rechteck zurückgeholt, in dem man gerade steht (wirkt wie eine Wand).
    function clampToRoom(p, prev) {
      if (!WALK_RECTS.some(r => inRect(p, r))) {
        let cands = prev ? WALK_RECTS.filter(r => inRect(prev, r)) : [];
        if (!cands.length) cands = WALK_RECTS;
        let best = null, bd = Infinity;
        cands.forEach(r => { const c = clampIntoRect(p, r), d = Math.hypot(c.x - p.x, c.z - p.z); if (d < bd) { bd = d; best = c; } });
        p.x = best.x; p.z = best.z;
      }
      // Bänke: zur nächstgelegenen Kante hinausschieben
      BENCHES.forEach(b => {
        if (p.x > b.x0 && p.x < b.x1 && p.z > b.z0 && p.z < b.z1) {
          const d = [p.x - b.x0, b.x1 - p.x, p.z - b.z0, b.z1 - p.z];
          const m = Math.min.apply(null, d);
          if (m === d[0]) p.x = b.x0; else if (m === d[1]) p.x = b.x1;
          else if (m === d[2]) p.z = b.z0; else p.z = b.z1;
        }
      });
      return p;
    }
    function isWalkable(p) {
      const c = clampToRoom(p.clone(), p);
      return Math.abs(c.x - p.x) < 1e-4 && Math.abs(c.z - p.z) < 1e-4;
    }
    // Liegt eine Bank auf der direkten Linie p → q? Dann seitlich daran vorbei.
    function benchDetour(p, q) {
      for (const b of BENCHES) {
        // Strecke gegen das Rechteck der Bank prüfen (Slab-Verfahren)
        let t0 = 0, t1 = 1; const dx = q.x - p.x, dz = q.z - p.z;
        const clip = (d, a, lo, hi) => {
          if (Math.abs(d) < 1e-9) return a >= lo && a <= hi;
          let ta = (lo - a) / d, tb = (hi - a) / d; if (ta > tb) { const t = ta; ta = tb; tb = t; }
          t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); return t0 <= t1;
        };
        if (clip(dx, p.x, b.x0, b.x1) && clip(dz, p.z, b.z0, b.z1) && t1 > 0.001) {
          const left = b.x0 - 0.35, right = b.x1 + 0.35;
          const x = Math.abs(left - q.x) + Math.abs(left - p.x) < Math.abs(right - q.x) + Math.abs(right - p.x) ? left : right;
          // erst seitlich neben die Bank, dann an ihr entlang bis hinter ihre Kante
          if (Math.abs(p.x - x) > 0.05) return { x, z: p.z };
          return { x, z: q.z < b.z0 ? b.z0 - 0.15 : q.z > b.z1 ? b.z1 + 0.15 : q.z };
        }
      }
      return null;
    }
    // Nächster Zwischenpunkt auf dem Weg zum Klickziel (durch die Durchgänge statt durch Wände)
    function walkWaypoint(p, tgt) {
      const w = walkWaypointRooms(p, tgt);
      return benchDetour(p, w) || w;
    }
    function walkWaypointRooms(p, tgt) {
      const cur = WALK_RECTS.filter(r => inRect(p, r));
      const goal = WALK_RECTS.findIndex(r => inRect(tgt, r));
      if (!cur.length || goal < 0 || cur.some(r => inRect(tgt, r))) return tgt;
      // Breitensuche über überlappende Rechtecke
      const ov = (a, b) => a.x0 <= b.x1 && b.x0 <= a.x1 && a.z0 <= b.z1 && b.z0 <= a.z1;
      const start = cur.map(r => WALK_RECTS.indexOf(r));
      const prevOf = {}; const queue = start.slice(); start.forEach(i => prevOf[i] = -1);
      while (queue.length) {
        const i = queue.shift();
        if (i === goal) break;
        WALK_RECTS.forEach((r, j) => { if (!(j in prevOf) && ov(WALK_RECTS[i], r)) { prevOf[j] = i; queue.push(j); } });
      }
      if (!(goal in prevOf)) return tgt;
      let n = goal; while (prevOf[n] !== -1 && start.indexOf(prevOf[n]) === -1) n = prevOf[n];
      // in das nächste Rechteck hinein (etwas vom Rand weg, damit man es sicher erreicht)
      const r = WALK_RECTS[n], m = 0.15;
      const inner = { x0: r.x0 + Math.min(m, (r.x1 - r.x0)/2), x1: r.x1 - Math.min(m, (r.x1 - r.x0)/2),
                      z0: r.z0 + Math.min(m, (r.z1 - r.z0)/2), z1: r.z1 - Math.min(m, (r.z1 - r.z0)/2) };
      return clampIntoRect(p, inner);
    }

    // ── Freie Navigation Tick ─────────────────────────────────────
    // Alles zeitbasiert (Meter pro Sekunde statt pro Bild): gleiches Tempo bei 30, 60 oder
    // 120 Bildern/s. Gehen fährt weich an und rollt aus; der Blick folgt dem Ziehen leicht
    // geglättet, weil Maus- und Touch-Ereignisse nicht im Bildtakt eintreffen.
    const WALK_SPEED = 5.6, GLIDE_SPEED = 8.0, GLIDE_ACC = 9.0, WHEEL_MAX = 9.0;   // m/s, m/s, m/s², m/s
    let _fnEuler = null, _fnP = null;
    function tickFreeNav(T) {
      const s = Math.min(_frameDt, 50) / 1000;               // Sekunden; nach einem Ruckler nicht springen
      const kLook = 1 - Math.exp(-s / 0.05);
      navYaw += (navYawT - navYaw) * kLook; navPitch += (navPitchT - navPitch) * kLook;
      if (!_fnEuler) { _fnEuler = new T.Euler(0, 0, 0, 'YXZ'); _fnP = new T.Vector3(); }
      _fnEuler.set(navPitch, navYaw, 0, 'YXZ');
      cam.quaternion.setFromEuler(_fnEuler);
      const fx = -Math.sin(navYaw), fz = -Math.cos(navYaw), rx = Math.cos(navYaw), rz = -Math.sin(navYaw);
      let ix = 0, iz = 0, manual = false;
      if (navKeys.has('KeyW')||navKeys.has('ArrowUp'))    { ix += fx; iz += fz; manual=true; }
      if (navKeys.has('KeyS')||navKeys.has('ArrowDown'))  { ix -= fx; iz -= fz; manual=true; }
      if (navKeys.has('KeyA')||navKeys.has('ArrowLeft'))  { ix -= rx; iz -= rz; manual=true; }
      if (navKeys.has('KeyD')||navKeys.has('ArrowRight')) { ix += rx; iz += rz; manual=true; }
      const p = _fnP.copy(cam.position);
      if (manual) {
        navMoveTarget = null; _glideV = 0;    // Tastatur unterbricht das Klick-Gleiten
        const l = Math.hypot(ix, iz), kv = 1 - Math.exp(-s / 0.12);   // weich anfahren / ausrollen
        const tvx = l > 1e-6 ? ix / l * WALK_SPEED : 0, tvz = l > 1e-6 ? iz / l * WALK_SPEED : 0;
        _navVel.x += (tvx - _navVel.x) * kv; _navVel.z += (tvz - _navVel.z) * kv;
        p.x += _navVel.x * s; p.z += _navVel.z * s;
      } else if (navMoveTarget) {
        // Ziel in einem anderen Raum: über die Durchgänge gehen statt in die Wand
        const w = walkWaypoint(p, navMoveTarget);
        let dx = w.x - p.x, dz = w.z - p.z, d = Math.hypot(dx, dz);
        const rest = d + Math.hypot(navMoveTarget.x - w.x, navMoveTarget.z - w.z);   // restlicher Weg
        if (d < 1e-4) { dx = navMoveTarget.x - p.x; dz = navMoveTarget.z - p.z; d = Math.hypot(dx, dz); }
        if (rest < 0.02 || d < 1e-4) {
          navMoveTarget = null; _glideV = 0; _navVel.x = _navVel.z = 0;
        } else {
          // Anfahren mit fester Beschleunigung, rechtzeitig bremsen: kommt genau am Ziel zum Stehen
          const vBrake = Math.max(0.25, Math.sqrt(2 * GLIDE_ACC * rest));
          _glideV = Math.min(GLIDE_SPEED, vBrake, Math.max(_glideV, Math.hypot(_navVel.x, _navVel.z)) + GLIDE_ACC * s);
          const step = Math.min(d, _glideV * s);
          p.x += dx / d * step; p.z += dz / d * step;
          _navVel.x = dx / d * _glideV; _navVel.z = dz / d * _glideV;
        }
      } else if (_navVel.x || _navVel.z) {
        // Ausrollen nach dem Loslassen der Taste
        const kv = Math.exp(-s / 0.12);
        _navVel.x *= kv; _navVel.z *= kv;
        if (Math.hypot(_navVel.x, _navVel.z) < 0.02) _navVel.x = _navVel.z = 0;
        p.x += _navVel.x * s; p.z += _navVel.z * s;
      }
      const prev = cam.position;
      if (isWalkable(prev)) {
        const wantX = p.x - prev.x, wantZ = p.z - prev.z;
        clampToRoom(p, prev);
        // An Wänden entlanggleiten: Tempo auf die tatsächlich gegangene Bewegung kürzen
        if (s > 0 && (wantX || wantZ)) {
          const gotX = p.x - prev.x, gotZ = p.z - prev.z;
          if (Math.abs(gotX - wantX) > 1e-5) _navVel.x = gotX / s;
          if (Math.abs(gotZ - wantZ) > 1e-5) _navVel.z = gotZ / s;
          const vl = Math.hypot(_navVel.x, _navVel.z);
          if (vl > GLIDE_SPEED) { _navVel.x *= GLIDE_SPEED / vl; _navVel.z *= GLIDE_SPEED / vl; }
          // Klickziel nicht erreichbar (Wand/Bank im Weg): nach kurzer Zeit aufgeben
          if (navMoveTarget && Math.hypot(gotX, gotZ) < 0.25 * Math.hypot(wantX, wantZ)) {
            if ((_glideStall += s) > 0.35) { navMoveTarget = null; _glideV = 0; _navVel.x = _navVel.z = 0; }
          } else _glideStall = 0;
        }
        // Wischen: gesammelten Weg weich abtragen (getrennt von der Geschwindigkeit, damit an
        // Wänden nichts nachrollt); läuft man auf eine Wand zu, verfällt der Rest
        if (_wheelWalk) {
          const lim = WHEEL_MAX * s;
          const step = Math.max(-lim, Math.min(lim, _wheelWalk * (1 - Math.exp(-s / 0.09))));
          _wheelWalk -= step;
          if (Math.abs(_wheelWalk) < 0.002) _wheelWalk = 0;
          const bx = p.x, bz = p.z, tx = p.x + fx * step, tz = p.z + fz * step;
          p.x = tx; p.z = tz;
          clampToRoom(p, prev);
          if (Math.hypot(p.x - bx, p.z - bz) < 0.3 * Math.abs(step)) {
            // Steht eine Bank im Weg: seitlich an ihr vorbeigleiten (quer zur Laufrichtung)
            const b = BENCHES.find(r => tx > r.x0 && tx < r.x1 && tz > r.z0 && tz < r.z1);
            if (b) {
              const ax = Math.abs(fz) >= Math.abs(fx);   // Querachse: x, wenn man vor allem längs z läuft
              const c = ax ? bx : bz, lo = ax ? b.x0 : b.z0, hi = ax ? b.x1 : b.z1;
              const edge = (c - lo < hi - c) ? lo - 0.02 : hi + 0.02, d = edge - c;
              const sl = Math.sign(d) * Math.min(Math.abs(d), Math.abs(step));
              p.x = bx + (ax ? sl : 0); p.z = bz + (ax ? 0 : sl);
              clampToRoom(p, prev);
              if (Math.hypot(p.x - bx, p.z - bz) < 1e-4) _wheelWalk = 0;
            } else _wheelWalk = 0;
          }
        }
      } else {
        _wheelWalk = 0;
        // z. B. Start an der Eingangsstation außerhalb des Bereichs: sanft hineingleiten statt springen.
        // Bewegungen, die weiter nach außen führen würden, werden dabei verworfen.
        const cPrev = clampToRoom(prev.clone(), prev);
        let c = clampToRoom(p.clone(), p);
        if (Math.hypot(p.x - c.x, p.z - c.z) > Math.hypot(prev.x - cPrev.x, prev.z - cPrev.z)) {
          p.x = prev.x; p.z = prev.z; c = cPrev;
        }
        const dx = c.x - p.x, dz = c.z - p.z, d = Math.hypot(dx, dz);
        const step = Math.min(d, Math.max(d * (1 - Math.exp(-s / 0.13)), 1.2 * s), 4.2 * s);   // weich, aber gedeckelt
        if (d > 0) { p.x += dx / d * step; p.z += dz / d * step; }
      }
      p.y = CAM_Y;
      cam.position.copy(p);
      // Zoom weich zum Ziel-Sichtfeld
      if (Math.abs(cam.fov - navFov) > 0.05) {
        cam.fov += (navFov - cam.fov) * (1 - Math.exp(-s / 0.1));
        cam.updateProjectionMatrix();
      }
    }

    // ── Tick ─────────────────────────────────────────────────────
    // Blickrichtung einer Station in der aktuellen Laufrichtung
    function _stQuat(i) { const s = seq[i]; return (tourDir < 0 && s.kind !== 'view') ? s.quatRev : s.quat; }
    // Einheitliches Tempo: Dauer aus Weg und Drehwinkel, eine Easing-Kurve für alles
    function _transDur(p0, q0, p1, q1) {
      const dist = Math.hypot(p1.x - p0.x, p1.z - p0.z), ang = q0.angleTo(q1);
      return Math.max(700, Math.min(5000, 350 + Math.max(dist * 430, ang * 760)));
    }
    function _nextIdx() { return (seqIdx + tourDir + seq.length) % seq.length; }
    // Zur nächsten Station (in Laufrichtung) – aus der aktuellen Kameralage heraus, ohne Ruck
    function advance(now) {
      fromPos.copy(cam.position); fromQuat.copy(cam.quaternion);
      const n = _nextIdx();
      if (_reducedMotion()) { fadeTo(n); return; }
      seqIdx = n;
      transDur = _transDur(fromPos, fromQuat, seq[n].pos, _stQuat(n));
      phase = 'trans'; t0 = now;
    }
    function tick(T,now){
      if(!seq) return;
      if(freeNav) { tickFreeNav(T); return; }
      if(vrPaused || phase==='fading') return;
      const s=seq[seqIdx], dt=now-t0;
      if(!s) return;
      const q=_stQuat(seqIdx);
      if(phase==='resume'){
        // Rückkehr aus dem freien Erkunden: weich zur aktuellen Station, Zoom zurück auf 1×
        const raw=Math.min(dt/transDur,1), et=ease(raw);
        cam.position.lerpVectors(fromPos,s.pos,et);
        cam.quaternion.slerpQuaternions(fromQuat,q,et);
        cam.fov = resumeFov + (FOV_BASE - resumeFov) * et; cam.updateProjectionMatrix();
        if(raw>=1){phase='hold';t0=now;resumeFov=null;}
        return;
      }
      if(phase==='trans'){
        const raw=Math.min(dt/transDur,1), et=ease(raw);
        cam.position.lerpVectors(fromPos,s.pos,et);
        cam.quaternion.slerpQuaternions(fromQuat,q,et);
        if(raw>=1){phase='hold';t0=now;}
      } else {
        cam.position.y=s.pos.y+Math.sin(now*0.00065)*0.005;
        if(dt>=s.hold) advance(now);
      }
    }

    function ensureFadeDiv(){
      if(!fadeDiv){
        fadeDiv=document.createElement('div');
        fadeDiv.className='vr-fade';
        fadeDiv.style.cssText='position:absolute;inset:0;background:#080706;pointer-events:none;opacity:0;transition:opacity 0.4s ease;z-index:1;';
        document.getElementById('gallery-vr').appendChild(fadeDiv);
      }
      return fadeDiv;
    }
    function _reducedMotion(){
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    // Kurz abblenden, unter der Blende umsetzen (apply), wieder aufblenden
    function fadeJump(apply){
      const sess=_vrSession, fd=ensureFadeDiv();
      fd.style.transition='opacity 0.4s ease'; fd.style.opacity='1';
      phase='fading';
      setTimeout(()=>{
        if(sess!==_vrSession||!cam||!seq) return;
        apply();
        fd.style.opacity='0';
      },450);
    }
    // Reduzierte Bewegung: statt Kamerafahrt mit Blende zur Station n
    function fadeTo(n){
      fadeJump(()=>{
        seqIdx=n;
        if(!freeNav){
          cam.position.copy(seq[n].pos); cam.quaternion.copy(_stQuat(n));
          fromPos.copy(seq[n].pos); fromQuat.copy(_stQuat(n));
        }
        phase='hold'; t0=performance.now();
      });
    }

    function teardown(){
      if(rafId) cancelAnimationFrame(rafId);
      if(renderer){renderer.dispose();renderer=null;}
      _vrSession++;
      if(fadeDiv) fadeDiv.remove();   // keine stehengebliebene Blende beim nächsten Öffnen
      scene=null;cam=null;seq=null;fadeDiv=null;
      _paintMeshes.length=0; _sculpts.length=0; _signHolderMat=null; _rm=null; _colMats=null; _pedMats=null; _buildTarget=null;
      _occluders.length=0; _lightDefs.length=0; _pool.length=0; _lpFirst=true; _zoneGroups=null; _curZone=null; _curMask=-1; _curVis=null; _hitList=[];
      _plRes=null; _panelTex=null; _pilMat=null; _nicheMat=null; _sconceGlass=null; _sconceGlow=null;
      freeNav=false; navKeys.clear(); navMoveTarget=null; navFov=FOV_BASE; navPinch=false; resumeFov=null;
      _navVel.x=_navVel.z=0; _glideV=0; _glideStall=0; _wheelWalk=0; _fpsSum=0; _fpsN=0; _fpsWarm=0;
      if(_resProbe){ _resScale/=0.85; _resProbe=0; }   // ungeprüfte Absenkung nicht mitnehmen
      _texPending=0; _buildDone=false; _loaderHidden=false; _warmedUp=false;
      const fb=document.getElementById('vr-free-btn');
      if(fb) fb.remove();
      const nh=document.getElementById('vr-nav-hint');
      if(nh) nh.remove();
      window.removeEventListener('resize',onResize);
    }
    function onResize(){
      if(!cam||!renderer) return;
      cam.aspect=innerWidth/innerHeight; cam.updateProjectionMatrix();
      renderer.setPixelRatio(_pixelRatio());
      renderer.setSize(innerWidth,innerHeight);
      // Bedien-Hinweis wieder über den Knopf setzen (der Knopf rückt bei schmalen Fenstern höher)
      const nh=document.getElementById('vr-nav-hint'), fb=document.getElementById('vr-free-btn'), ve=document.getElementById('gallery-vr');
      if(nh&&fb&&ve&&freeNav) nh.style.bottom=Math.max(16, Math.round(ve.getBoundingClientRect().bottom - fb.getBoundingClientRect().top + 10))+'px';
    }
  })();


  // ── Legal Overlays ──────────────────────────────────────────
  function openLegal(which) {
    const el = document.getElementById('overlay-' + which);
    if (!el) return;
    el.scrollTop = 0;
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
    _navOpen('legal:' + which);
  }
  function closeLegal(which) {
    const el = document.getElementById('overlay-' + which);
    if (!el) return;
    el.classList.remove('active');
    document.body.style.overflow = '';
    _navClosed('legal:' + which);
  }
  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      // nur die oberste Ebene schließen (der Kalender hat einen eigenen Handler)
      if (e._escHandled) return;
      if (document.getElementById('cal-overlay')?.classList.contains('active')) return;
      const legal = ['impressum','datenschutz'].filter(w => document.getElementById('overlay-' + w)?.classList.contains('active'));
      if (legal.length) legal.forEach(closeLegal);
      else if (document.getElementById('artwork-detail').classList.contains('active')) closeArtwork();
      else if (document.getElementById('fav-overlay')?.classList.contains('active')) closeFavs();
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
    btn.title = _lang === 'en' ? 'Wishlist' : 'Merkliste';
    btn.onclick = function(e) { e.stopPropagation(); toggleFav(title); };
    card.appendChild(btn);
  });

  /* ── INIT: apply saved language ── */
  setLang(_lang);
  _updateFavBadge();

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

    var cur = 0, tgt = 0, rafId = null, lastT = 0;

    function scrollP() {
      // Strecke, über die der angeheftete Bildschirm steht – mit seiner festen Höhe statt innerHeight,
      // das sich beim Ein-/Ausklappen der iPhone-Adressleiste ändert und den Fortschritt springen ließ
      var r = scene.getBoundingClientRect();
      return Math.max(0, Math.min(1, -r.top / (scene.offsetHeight - (pinEl ? pinEl.offsetHeight : window.innerHeight))));
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
      // Kacheln im Bild: auf dem Handy treten Hinweiszeile und Nach-oben-Knopf zurück (styles.css)
      document.body.classList.toggle('scene-tiles', tileT > 0.05);
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

    function tick(t) {
      var d = tgt - cur;
      // Nachziehen pro Zeit statt pro Bild (gleich schnell bei 60 und 120 Hz): 9 % je 1/60 s
      var dt = Math.min(64, lastT ? t - lastT : 16.7); lastT = t;
      if (Math.abs(d) < 0.0002) {
        cur = tgt; render(cur);
        for (var i = 0; i < tiles.length; i++) tiles[i].style.transition = '';
        rafId = null; lastT = 0;
      } else {
        cur += d * (1 - Math.pow(1 - 0.09, dt / 16.7)); render(cur);
        rafId = requestAnimationFrame(tick);
      }
    }

    window.addEventListener('scroll', function() {
      tgt = scrollP();
      if (!rafId) rafId = requestAnimationFrame(tick);
    }, { passive: true });
    render(0);
  })();

  /* ══ KALENDER ══ */
  // Wunschtermin auswählen → das E-Mail-Programm öffnet sich mit vorbereiteter Anfrage. Es gibt kein Konto
  // und keine Datenübertragung über die Website; früher lokal gespeicherte Kontodaten werden entfernt.
  try { localStorage.removeItem('_gal_accounts'); localStorage.removeItem('_gal_session'); } catch (e) {}
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
      conf.textContent = lang === 'en'
        ? 'Selected: ' + selectedDate.d + ' ' + months[selectedDate.m] + ' ' + selectedDate.y + ' · ' + h + ':' + m
        : 'Gewählt: ' + selectedDate.d + '. ' + months[selectedDate.m] + ' ' + selectedDate.y + ' · ' + h + ':' + m + ' Uhr';
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
      document.getElementById('cal-overlay').classList.add('active');
      document.body.style.overflow = 'hidden';
      _navOpen('cal');
      showCalMain();
    };

    window.closeCal = function() {
      document.getElementById('cal-overlay').classList.remove('active');
      document.body.style.overflow = '';
      _navClosed('cal');
    };

    window.confirmBooking = function() {
      if (!selectedDate) return;
      var en = getLang() === 'en';
      var when = document.getElementById('cal-confirm').textContent.replace(/^(Gewählt|Selected):\s*/, '');
      var subject = en ? 'Viewing appointment request' : 'Anfrage Besichtigungstermin';
      var body = en
        ? 'Hello,\n\nI would like to arrange a private viewing of the works of Horst Schwab.\nPreferred date: ' + when + '\n\nName:\nPhone (optional):\n\nKind regards'
        : 'Guten Tag,\n\nich möchte gern eine private Besichtigung der Werke von Horst Schwab vereinbaren.\nWunschtermin: ' + when + '\n\nName:\nTelefon (optional):\n\nViele Grüße';
      window.location.href = 'mailto:' + CONTACT_MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body.replace(/\n/g, '\r\n'));
      document.getElementById('cal-main').style.display = 'none';
      document.getElementById('cal-success').classList.add('show');
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
      if (e.key === 'Escape' && document.getElementById('cal-overlay').classList.contains('active')) {
        e._escHandled = true;
        closeCal();
      }
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

  /* ══ HERO-WERK: Collagen im Licht, wechseln automatisch ══ */
  (function() {
    const hero  = document.getElementById('hero');
    const frame = document.getElementById('hero-art-frame');
    const img   = document.getElementById('hero-art-img');
    const label = document.getElementById('hero-art-label');
    if (!hero || !frame || !img || !label) return;
    const WORKS = [
      { title: 'Meer',                       src: 'assets/hero/C-F-2005-6.jpg' },
      { title: 'Langgezogene Figurengruppe', src: 'assets/hero/C-F-2002-3.jpg' },
      { title: 'Goldene Figur',              src: 'assets/hero/C-F-2004-2.jpg' },
      { title: 'Zwei Frauen',                src: 'assets/hero/C-F-2005-5.jpg' },
      { title: 'Bunte Figur',                src: 'assets/hero/C-F-2004-1.jpg' },
    ];
    const INTERVAL = 8000, FADE = 900;
    let idx = 0, timer = null, hovering = false, inView = true;

    function setLabel(w) {
      const d = ARTWORKS[w.title] || {};
      label.querySelector('.hero-art-title').textContent = w.title;
      label.querySelector('.hero-art-year').textContent = d.year || '';
      img.alt = 'Horst Schwab – ' + w.title + (d.year ? ', ' + d.year : '');
      frame.setAttribute('aria-label', (_lang === 'en' ? 'View work: ' : 'Werk ansehen: ') + w.title);
    }

    function next() {
      timer = null;
      if (hovering || !inView || document.hidden) { schedule(); return; }
      const n = (idx + 1) % WORKS.length;
      const pre = new Image();
      pre.onload = () => {
        frame.classList.add('is-changing');
        label.classList.add('is-changing');
        setTimeout(() => {
          idx = n;
          img.src = WORKS[n].src;
          setLabel(WORKS[n]);
          syncZoomImg();
          setTimeout(() => {
            frame.classList.remove('is-changing');
            label.classList.remove('is-changing');
          }, 60);
          schedule();
        }, FADE);
      };
      pre.onerror = schedule;
      pre.src = WORKS[n].src;
    }
    function schedule() { if (!timer) timer = setTimeout(next, INTERVAL); }
    // Zoom-Overlay (Übergang „Galerie betreten") immer mit dem aktuellen Werk vorbereiten,
    // damit beim Klick nichts mehr geladen oder dekodiert werden muss
    function syncZoomImg() {
      const z = document.querySelector('#zoom-hero-overlay img');
      // während des Übergangs nicht das Bild im Flug austauschen – wird danach nachgeholt
      if (!z || document.body.classList.contains('hero-zooming')) return;
      z.src = WORKS[idx].src;
      if (z.decode) z.decode().catch(() => {});
    }

    frame.addEventListener('click', () => openArtwork(WORKS[idx].title));
    frame.addEventListener('mouseenter', () => { hovering = true; });
    frame.addEventListener('mouseleave', () => { hovering = false; });
    new IntersectionObserver(es => { inView = es[0].isIntersecting; }, { threshold: 0.3 }).observe(hero);

    setLabel(WORKS[0]);
    syncZoomImg();
    window._heroZoomSync = syncZoomImg;
    // Sprachwechsel: Screenreader-Beschriftung des Werks sofort mitziehen
    window._heroArtRelabel = function() { setLabel(WORKS[idx]); };
    // Wechsel erst starten, wenn der Startbildschirm sichtbar ist (nach dem Ladebildschirm)
    window._heroArtStart = function() { setTimeout(schedule, 2500); };
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
  function _hideRundgangHint() {
    const hint = document.getElementById('rundgang-hint');
    if (!hint) return;
    hint.classList.remove('visible');
    setTimeout(() => hint.remove(), 500);
  }
  function _showRundgangHint() {
    if (document.getElementById('rundgang-hint')) return;   // nur ein Hinweis gleichzeitig
    const hint = document.createElement('div');
    hint.id = 'rundgang-hint';
    // deutsch angelegt mit data-en – setLang schaltet die Texte wie alle anderen um
    hint.innerHTML =
      '<button class="rh-close" aria-label="Schließen" data-en-aria-label="Close">✕</button>' +
      '<span class="rh-icon">🎨</span>' +
      '<span class="rh-title" data-en="Virtual Tour">Virtueller Rundgang</span>' +
      '<span class="rh-text" data-en="Explore all artworks in a 3D gallery walk — click on any painting to learn more.">Entdecken Sie alle Werke im virtuellen 3D-Rundgang — klicken Sie auf ein Gemälde für Details.</span>' +
      '<button class="rh-btn" data-en="START TOUR">RUNDGANG STARTEN</button>';
    document.body.appendChild(hint);
    if (_lang === 'en') setLang('en');

    setTimeout(() => hint.classList.add('visible'), 3500);
    // Handy: nach einer Weile von selbst ausblenden – der Platz unten ist dort knapp
    if (window.matchMedia('(max-width: 480px), (max-height: 500px) and (orientation: landscape)').matches) setTimeout(dismiss, 3500 + 9000);

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
    const captions = { de: ['Portrait', '80. Geburtstag, 2015', 'Porträt', 'Selbstbildnis, 1982'],
                       en: ['Portrait', '80th birthday, 2015', 'Portrait', 'Self-portrait, 1982'] };
    let idx = 0;

    function goTo(n) {
      slides[idx].classList.remove('active');
      dots[idx].classList.remove('active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('active');
      dots[idx].classList.add('active');
      if (cap) cap.textContent = captions[_lang === 'en' ? 'en' : 'de'][idx];
    }
    // Sprachwechsel: Bildunterschrift sofort mitziehen
    window._bioCapRelabel = function() { if (cap) cap.textContent = captions[_lang === 'en' ? 'en' : 'de'][idx]; };

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
  // Den Ladeschirm steuert ein kleines Skript direkt in index.html (erscheint und verschwindet
  // unabhängig davon, wann diese Datei geladen ist). Hier nur: Werk-Rotation starten, sobald er weg ist.
  (function(){
    var heroReady = function(){
      var h = document.getElementById('hero');
      if (h) h.classList.add('hero-ready');
      if (window._heroArtStart) window._heroArtStart();
    };
    if (window._preloaderHidden || !document.getElementById('preloader')) heroReady();
    else document.addEventListener('preloader:hidden', heroReady, { once: true });
  })();
