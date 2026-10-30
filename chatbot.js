/* ══════════════════════════════════════════════════════════════════
   BESUCHER-ASSISTENT – Logik (keine KI, kein Server, keine Speicherung)
   Alle Texte, Buttons und Stichwörter stehen in chatbot-content.js –
   hier nur ändern, wenn sich die Funktionsweise ändern soll.
   Wird erst beim ersten Öffnen geladen (siehe app.js, „Besucher-Assistent: Laden bei Bedarf“).
   Sicherheit: Eingaben und Antworten werden ausschließlich mit textContent ausgegeben.
   ══════════════════════════════════════════════════════════════════ */
(function() {
  'use strict';
  const C = window.ASSISTENT_INHALT;
  if (!C) return;
  const MAXLEN = 200;
  const STOP = new Set(('ich du sie er es wir ihr man mir mich dir dich uns ihnen der die das den dem des ein eine einen einem einer ' +
    'und oder aber ist sind war waren bin bist sein kann kannst koennen koennte konnte wie was wo wann wer wen wem warum welche welcher welches ' +
    'zu zum zur von vom mit auf in im ins fuer bei an am als auch noch nur so da dass ob gibt gab hat haben hatte wird werden wurde ' +
    'nicht kein keine bitte mal ja nein denn doch hier dort etwas mehr sehr gerne gern einfach mein meine meinen dein ihre ihr eure').split(' '));

  /* ── Text-Normalisierung und Stichwortsuche ── */
  function norm(s) {
    return String(s).toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    const d = [];
    for (let i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return d[a.length][b.length];
  }
  // vorbereitete Stichwörter je Antwort
  const INDEX = Object.keys(C.antworten).map(id => ({
    id, keys: (C.antworten[id].stichwoerter || []).map(norm).filter(Boolean)
  }));
  // einfacher Wortstamm: „kostet“/„kosten“ → „kost“, „erreiche“/„erreichen“ → „erreich“
  function stem(w) {
    return w.length > 5 ? w.replace(/(en|er|es|et|em|e|n|s|t)$/, '') : w;
  }
  function score(input) {
    const full = ' ' + norm(input) + ' ';
    const toks = norm(input).split(' ').filter(t => t.length >= 2 && !STOP.has(t));
    return INDEX.map(({ id, keys }) => {
      let s = 0;
      const words = [];
      keys.forEach(k => {
        if (k.indexOf(' ') >= 0) {                       // Wortgruppe: muss als Ganzes vorkommen
          if (full.indexOf(' ' + k + ' ') >= 0) s += 3 + k.split(' ').length;
        } else words.push(k);
      });
      // jedes Eingabewort zählt pro Antwort nur einmal (bester Treffer), damit ähnliche Stichwörter nicht aufaddieren
      toks.forEach(t => {
        let best = 0;
        words.forEach(k => {
          if (t === k) best = Math.max(best, 3);
          else if (k.length >= 4 && t.length >= 4 && stem(t) === stem(k)) best = Math.max(best, 3);      // gleicher Wortstamm
          else if (k.length >= 4 && t.startsWith(k)) best = Math.max(best, 2.2);       // „bildern“ → „bild“
          else if (t.length >= 5 && k.startsWith(t)) best = Math.max(best, 2);
          else if (k.length >= 5 && t.length >= 4 && lev(t, k) <= (k.length >= 8 ? 2 : 1)) best = Math.max(best, 1.5);   // Tippfehler
        });
        s += best;
      });
      return { id, s: s * (C.antworten[id].gewicht || 1) };
    }).filter(r => r.s > 0).sort((a, b) => b.s - a.s);
  }
  const SCHWELLE = 3;            // darunter: keine sichere Antwort → Themen anbieten
  const ABSTAND = 0.75;          // zwei Antworten fast gleich gut → beide als Auswahl anbieten

  /* ── Zahlen aus den Werkdaten (nicht geschätzt, sondern gezählt) ── */
  function werkzahlen() {
    const A = (typeof ARTWORKS !== 'undefined') ? ARTWORKS : {};
    const echt = Object.values(A).filter(d => d.img);
    return {
      werke_mit_bild: echt.length,
      collagen: echt.filter(d => d.cat === 'Collage & Zeichnungen').length,
      plastiken: echt.filter(d => d.cat === 'Plastik').length,
      platzhalter: Object.values(A).filter(d => d.placeholder).length
    };
  }
  function fuelle(t) {
    const z = werkzahlen();
    return t.replace(/\{(\w+)\}/g, (m, k) => (k in z ? String(z[k]) : m));
  }

  /* ── Oberfläche ── */
  const toggle = document.getElementById('assist-toggle');
  const panel = document.createElement('div');
  panel.id = 'assist-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', 'as-title');
  panel.hidden = true;
  panel.innerHTML =   // fester Rahmen ohne Nutzertexte
    '<div class="as-head"><p class="as-title" id="as-title"></p>' +
    '<button type="button" class="as-close"><span aria-hidden="true">&#x2715;</span></button></div>' +
    '<div class="as-body"><p class="as-note"></p><div class="as-log" role="log" aria-live="polite" aria-relevant="additions"></div></div>' +
    '<div class="as-input"><label class="as-sr" for="as-q"></label>' +
    '<input id="as-q" type="text" autocomplete="off" maxlength="' + MAXLEN + '">' +
    '<button type="button" class="as-send"></button></div>';
  document.body.appendChild(panel);
  const $ = sel => panel.querySelector(sel);
  const log = $('.as-log'), input = $('#as-q'), body = $('.as-body');

  function en() { return document.documentElement.lang === 'en'; }
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function scrollDown() { body.scrollTop = body.scrollHeight; }
  function clearButtons() { log.querySelectorAll('.as-actions').forEach(n => n.remove()); }

  function mailHref(betreff, geruest) {
    return 'mailto:' + C.mail.adresse + '?subject=' + encodeURIComponent(betreff || C.mail.betreff) +
      '&body=' + encodeURIComponent((geruest || C.mail.geruest).replace(/\n/g, '\r\n'));
  }

  // Bot-Nachricht: Absätze + Knöpfe (Aktionen, Folgefragen, Zurück/Neu starten)
  function say(paras, buttons, focusFirst) {
    clearButtons();
    const msg = el('div', 'as-msg as-bot');
    paras.forEach(p => msg.appendChild(el('p', null, fuelle(p))));
    log.appendChild(msg);
    if (buttons && buttons.length) {
      const row = el('div', 'as-actions');
      buttons.forEach(b => row.appendChild(b));
      log.appendChild(row);
      if (focusFirst) row.querySelector('button, a').focus({ preventScroll: true });
    }
    scrollDown();
  }
  function userSays(text) {
    log.appendChild(el('div', 'as-msg as-user', text));   // Nutzereingabe nur als Text
    scrollDown();
  }
  function btn(label, onClick, cls) {
    const b = el('button', 'as-btn' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }
  function mailLink(label, betreff, geruest) {
    const a = el('a', 'as-btn as-mail', label);
    a.href = mailHref(betreff, geruest);
    return a;
  }

  // Aktionen aus chatbot-content.js (art: termin | mail | impressum | datenschutz | abschnitt | rundgang | sprache | merkliste)
  const NAV = { galerie: 'nav-werke', 'ueber-uns': 'nav-bio', 'das-werk': 'nav-werk', ausstellungen: 'nav-ausst', socials: 'nav-socials', kontakt: 'nav-kontakt' };
  function aktion(a) {
    if (a.art === 'mail') return mailLink(a.label, a.betreff, a.geruest);
    return btn(a.label, () => {
      if (a.art === 'sprache') { if (typeof toggleLang === 'function') toggleLang(); return; }
      close(false);
      if (a.art === 'termin') window.openCal && window.openCal();
      else if (a.art === 'impressum' || a.art === 'datenschutz') openLegal(a.art);
      else if (a.art === 'rundgang') document.getElementById('nav-rundgang').click();
      else if (a.art === 'merkliste') openFavs();
      else if (a.art === 'abschnitt') document.getElementById(NAV[a.ziel] || 'nav-werke').click();
    }, 'as-act');
  }

  let lastGroup = null;
  function nav() {   // Zurück / Neu starten
    const out = [];
    if (lastGroup) out.push(btn(C.knoepfe.zurueck, () => showGroup(lastGroup), 'as-nav'));
    out.push(btn(C.knoepfe.neustart, restart, 'as-nav'));
    return out;
  }
  function showMenu(focus) {
    lastGroup = null;
    say([C.menue_text], C.gruppen.map(g => btn(g.titel, () => showGroup(g.id))).concat([mailLink(C.knoepfe.mail)]), focus);
  }
  function showGroup(gid, focus = true) {
    const g = C.gruppen.find(x => x.id === gid);
    lastGroup = gid;
    say([g.einleitung || g.titel], g.antworten.map(id => btn(C.antworten[id].frage, () => answer(id))).concat([btn(C.knoepfe.neustart, restart, 'as-nav')]), focus);
  }
  function answer(id, fromText) {
    const a = C.antworten[id];
    if (!a) return;
    const g = C.gruppen.find(x => x.antworten.indexOf(id) >= 0);
    if (g) lastGroup = g.id;
    const texte = a.todo ? [C.todo_text] : a.text;
    const b = (a.aktionen || []).map(aktion);
    if (a.todo) b.push(mailLink(C.knoepfe.mail, C.mail.betreff));
    (a.weiter || []).forEach(w => { if (C.antworten[w]) b.push(btn(C.antworten[w].frage, () => answer(w))); });
    say(texte, b.concat(nav()), !fromText);
  }
  function unclear(cands) {
    // nie raten: passende oder allgemeine Themen anbieten + E-Mail
    const ids = (cands || []).slice(0, 3);
    const b = ids.length ? ids.map(id => btn(C.antworten[id].frage, () => answer(id)))
                         : C.unklar_themen.map(gid => btn(C.gruppen.find(g => g.id === gid).titel, () => showGroup(gid)));
    b.push(mailLink(C.knoepfe.mail));
    b.push(btn(C.knoepfe.neustart, restart, 'as-nav'));
    say([ids.length ? C.mehrdeutig_text : C.unklar_text], b, false);
  }
  // Entscheidung: sichere Antwort, Auswahl zweier fast gleich guter Antworten oder „unklar“ – nie raten
  function decide(q) {
    const r = score(q);
    if (!r.length || r[0].s < SCHWELLE) return { art: 'unklar', ids: r.filter(x => x.s >= 1.5).map(x => x.id) };
    if (r[1] && r[0].s - r[1].s < ABSTAND) return { art: 'auswahl', ids: [r[0].id, r[1].id] };
    return { art: 'antwort', id: r[0].id };
  }
  function ask() {
    const q = input.value.slice(0, MAXLEN).trim();
    if (!q) return;
    input.value = '';
    userSays(q);
    const d = decide(q);
    if (d.art === 'antwort') answer(d.id, true); else unclear(d.ids);
  }
  function restart() {
    log.textContent = '';
    say([C.begruessung]);
    showMenu(true);
  }

  // Englischer Modus: Assistent nur auf Deutsch – kurzer Hinweis mit englischem E-Mail-Link
  function render() {
    const E = en();
    $('.as-title').textContent = E ? C.englisch.titel : C.titel;
    $('.as-close').setAttribute('aria-label', E ? 'Close assistant' : 'Assistent schließen');
    panel.classList.toggle('as-en', E);
    $('.as-input').hidden = E;
    log.textContent = '';
    if (E) {
      $('.as-note').textContent = C.englisch.hinweis_ki;
      say([C.englisch.text], [mailLink(C.englisch.mail_label, C.englisch.betreff, C.englisch.geruest)]);
      return;
    }
    $('.as-note').textContent = C.hinweis;
    $('.as-sr').textContent = C.eingabe_label;
    input.placeholder = C.eingabe_platzhalter;
    $('.as-send').textContent = C.knoepfe.senden;
    say([C.begruessung]);
    showMenu(false);
  }

  function open() {
    if (!panel.hidden) return;
    render();
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('assist-open');
    const first = panel.querySelector(en() ? '.as-actions a, .as-close' : '.as-actions button');
    (first || $('.as-close')).focus({ preventScroll: true });
  }
  function close(returnFocus = true) {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('assist-open');
    if (returnFocus) toggle.focus({ preventScroll: true });
  }

  $('.as-close').addEventListener('click', () => close());
  $('.as-send').addEventListener('click', ask);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ask(); } });
  panel.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); e._escHandled = true; close(); }
  });
  // Sprachwechsel bei offenem Panel
  new MutationObserver(() => { if (!panel.hidden) render(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  window.Assistent = { open, close, toggle: () => (panel.hidden ? open() : close()),
    _decide: decide, _score: score };   // nur für Tests
})();
