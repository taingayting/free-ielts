/* Reading test as real text: passage on the left (highlight + notes), interactive questions on the right.
   Practice mode (tips, check each passage) or Exam mode (60 min, results at the end), then personal advice. */
(window.APP_MODULES = window.APP_MODULES || []).push(function (App) {
  const { pages, D, main, esc, $, $$, pdfUrl, fmtTime, testLabel, toast, attemptsFor, bestFor } = App;
  // highlight palette (name -> colour). Highlights can also use any custom colour ("#rrggbb").
  const PALETTE = { yellow: "#ffd84d", orange: "#ffa94d", red: "#ff6b6b", pink: "#ff8fb8", purple: "#b197fc",
    blue: "#74b0ff", cyan: "#4dd6e0", green: "#69db7c", lime: "#c0eb75", gray: "#adb5bd" };
  const COLORS = Object.keys(PALETTE);
  const hex = (c) => PALETTE[c] || (/^#[0-9a-f]{6}$/i.test(c || "") ? c : PALETTE.yellow);
  const hlBg = (c) => { const h = hex(c); const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},.45)`; };
  const dot = (c, extra = "") => `<button class="hl-dot" style="background:${hex(c)}" ${extra} title="${/^#/.test(c) ? "custom" : c}"></button>`;

  const TYPE = {
    tfng: { name: "True / False / Not Given", tip: "TRUE = the passage says the same thing in other words. FALSE = it says the opposite. NOT GIVEN = it says nothing about it. Find the exact sentence and watch small words: all, some, only, always, never, most." },
    ynng: { name: "Yes / No / Not Given", tip: "Same as True/False/Not Given, but about the WRITER'S opinion. YES = the writer agrees; NO = the writer disagrees; NOT GIVEN = the writer doesn't say what they think." },
    mcq: { name: "Multiple choice", tip: "Find the right place in the passage first, then check EVERY option against it. Wrong options often use words from the passage but change the meaning." },
    multi: { name: "Choose TWO / THREE", tip: "Each correct letter must be clearly stated in the passage. The other options are often mentioned too, but not in the way the question asks. Order doesn't matter." },
    headings: { name: "Matching headings", tip: "Read the whole paragraph and choose the MAIN idea, not one detail. Do the easy paragraphs first and cross off headings you have used. There are extra headings." },
    match: { name: "Matching (paragraphs / features / endings)", tip: "Answers are NOT in passage order. Scan for names and key words. If it says 'NB you may use any letter more than once', some letters repeat." },
    complete: { name: "Completion (notes / summary / sentences / table)", tip: "Check the word limit (e.g. ONE WORD ONLY). Copy the words exactly from the passage, spelling too. Decide what type of word fits (noun? number? plural?). Answers are usually in passage order." },
    complete_letter: { name: "Summary with a word list", tip: "The words in the box are usually synonyms of words in the passage. Read around the gap and check the word fits the grammar." },
    short: { name: "Short answers", tip: "Answer with words from the passage, within the word limit. Look for the question's key words (names, dates, numbers) to find the place quickly." },
  };
  const REASONS = [
    ["find", "I couldn't find it in the passage"],
    ["word", "I didn't know a word"],
    ["ng", "Not Given vs False confusion"],
    ["trap", "A similar word tricked me"],
    ["spell", "Spelling / word limit"],
    ["time", "I ran out of time / guessed"],
  ];

  /* ---------------- data loading ---------------- */
  function loadTest(key) {
    window.READING_DATA = window.READING_DATA || {};
    if (READING_DATA[key]) return Promise.resolve(READING_DATA[key]);
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `reading/data/${key}.js`;
      s.onload = () => (READING_DATA[key] ? resolve(READING_DATA[key]) : reject(new Error("empty")));
      s.onerror = () => reject(new Error("missing"));
      document.head.appendChild(s);
    });
  }
  App.loadReading = loadTest;
  App.READING_TYPES = TYPE;

  /* ---------------- highlights ---------------- */
  const hlList = (pk) => (Store.get().highlights || {})[pk] || [];
  const saveHl = (pk, list) => Store.update((s) => { s.highlights = s.highlights || {}; s.highlights[pk] = list; });
  // skip(textNode) -> true for text that must not be counted or highlighted (buttons, answer boxes...)
  const textWalker = (root, skip) => document.createTreeWalker(root, NodeFilter.SHOW_TEXT,
    skip ? { acceptNode: (n) => (skip(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) } : null);
  function textPos(root, node, off, skip) {
    const r = document.createRange();
    r.setStart(root, 0);
    r.setEnd(node, off);
    if (!skip) return r.toString().length;
    let pos = 0;
    const w = textWalker(root, skip);
    while (w.nextNode()) {
      const n = w.currentNode;
      if (n === node) return pos + off;
      if (!r.intersectsNode(n)) break;
      pos += n.data.length;
    }
    return pos;
  }
  function surfaceText(root, skip) {
    if (!skip) return root.textContent;
    let s = "";
    const w = textWalker(root, skip);
    while (w.nextNode()) s += w.currentNode.data;
    return s;
  }
  function unwrapMarks(root, selector) {
    $$(selector, root).forEach((m) => { const p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); });
  }
  function wrapRange(root, s, e, attrs, skip) {
    const walker = textWalker(root, skip);
    const nodes = [];
    let pos = 0;
    while (walker.nextNode()) {
      const n = walker.currentNode, len = n.data.length;
      if (pos + len > s && pos < e) nodes.push([n, Math.max(0, s - pos), Math.min(len, e - pos)]);
      pos += len;
      if (pos >= e) break;
    }
    nodes.forEach(([n, a, b]) => {
      if (b <= a) return;
      let mid = n;
      if (a > 0) mid = n.splitText(a);
      if (b - a < mid.data.length) mid.splitText(b - a);
      const m = document.createElement("mark");
      Object.entries(attrs).forEach(([k, v]) => m.setAttribute(k, v));
      mid.parentNode.insertBefore(m, mid);
      m.appendChild(mid);
    });
  }

  /* ---------------- page ---------------- */
  pages.read = (b, t) => {
    b = +b; t = +t;
    const book = D.books[b];
    const test = book && book.tests[t];
    if (!test || !test.keys.R) { main.innerHTML = `<div class="page"><div class="card empty">This test was not found.</div></div>`; return; }
    main.innerHTML = `<div class="page"><div class="card empty">Opening the test…</div></div>`;
    loadTest(`${b}-${t}`).then((data) => render(b, t, book, test, data)).catch(() => {
      main.innerHTML = `<div class="page"><div class="card empty">The text for this test is not ready.</div></div>`;
    });
  };

  function render(b, t, book, test, data) {
    const keys = test.keys.R;
    const P = data.passages;
    const st = Store.get();
    const draftKey = `R-${b}-${t}`;
    const draft = st.drafts[draftKey] || {};
    const ans = (draft.answers || Array(40).fill("")).slice();
    let mode = draft.mode || null;
    const checked = draft.checked || []; // passages already checked (practice mode)
    const ptime = draft.ptime || [0, 0, 0];
    const reasons = draft.reasons || {};
    const marks = {}; // question number -> true/false once checked
    let cur = 0, elapsed = draft.elapsed || 0, ticking = null, submitted = null, saveTimer;
    let shownPassage = -1, keepScroll = 0; // keep the reading position when the passage is redrawn
    const limit = 60 * 60;
    const fontSize = () => +Store.get().settings.readerFont || 17;
    const typeOf = {};
    P.forEach((p) => p.groups.forEach((g) => { for (let n = g.a; n <= g.b; n++) typeOf[n] = g.type; g.fallback.forEach((n) => (typeOf[n] = typeOf[n] || g.type)); }));
    const inP = (n, i) => n >= P[i].q[0] && n <= P[i].q[1];
    const range = (a, z) => Array.from({ length: z - a + 1 }, (_, i) => a + i);

    main.innerHTML = `<div class="page wide"><div class="reader">
      <header class="rd-top">
        <a class="btn sm" href="#/reading">← Tests</a>
        <div class="rd-name"><div class="small muted">Reading · <span id="modeName"></span></div><strong>${testLabel(b, t)}</strong></div>
        <div class="rd-tabs" id="tabs">${P.map((p, i) => `<button class="btn sm" data-p="${i}">Passage ${i + 1}<small id="cnt${i}"></small></button>`).join("")}</div>
        <span class="spacer"></span>
        <div class="row" style="gap:4px"><button class="btn sm" id="fontDown" title="Smaller text">A−</button><button class="btn sm" id="fontUp" title="Bigger text">A+</button></div>
        <div class="rd-timer"><span class="timer" id="timer"></span><button class="btn sm" id="timerBtn">Start</button></div>
        <button class="btn sm primary" id="submitBtn">Finish test</button>
      </header>
      <div class="rd-switch"><button class="btn sm active" data-view="text">Passage</button><button class="btn sm" data-view="q">Questions <small id="qcount"></small></button></div>
      <div class="rd-body" id="rdBody">
        <section class="rd-passage" id="paneText">
          <article class="rd-text" id="rdText" style="font-size:${fontSize()}px"></article>
          <div class="rd-notes" id="rdNotes"></div>
          <p class="small muted rd-foot">The text was read automatically from your book, so there may be a few small typing errors.
            <a id="origLink" target="_blank">Original page</a></p>
        </section>
        <aside class="rd-q" id="paneQ">
          <div class="qnav" id="qnav"></div>
          <div id="result"></div>
          <div id="qArea"></div>
          <div class="row" style="margin-top:16px" id="qFoot"></div>
        </aside>
      </div>
    </div></div>
    <div class="hl-bar hidden" id="hlBar">
      ${COLORS.map((c) => dot(c, `data-c="${c}"`)).join("")}
      <label class="hl-dot hl-custom" title="Choose any colour">🎨<input type="color" id="hlCustom" value="#ff9f43"></label>
      <span class="hl-sep"></span>
      <button class="btn sm" data-act="note">✎ Note</button>
      <button class="btn sm" data-act="word">＋ Word</button>
      <button class="btn sm" data-act="km" title="Translate to Khmer (Google Translate)">Khmer</button>
      <button class="btn sm" data-act="dict" title="English dictionary">Dict</button>
    </div>
    <div class="hl-pop card hidden" id="hlPop"></div>`;

    const textEl = $("#rdText"), bar = $("#hlBar"), pop = $("#hlPop");
    const pk = () => `${b}-${t}-${cur + 1}`;

    /* =============== passage =============== */
    // Spelling fixes in the text change its length; move highlights made on the old text so they stay on the same words.
    function moveOldHighlights(p) {
      const rev = data.rev || 0, list = hlList(pk());
      if (!rev || !list.some((h) => (h.rev || 0) < rev)) return;
      // each shift is [old position, length change, revision]; positions are in the text of the revision before it
      const at = (pos, r) => pos + (p.shifts || []).reduce((n, [a, d, sr]) => n + (sr === r && a < pos ? d : 0), 0);
      list.forEach((h) => {
        for (let r = (h.rev || 0) + 1; r <= rev; r++) { h.s = at(h.s, r); h.e = Math.max(at(h.e, r), h.s + 1); }
        h.rev = rev;
      });
      saveHl(pk(), list);
    }

    function renderPassage() {
      const p = P[cur];
      keepScroll = $("#paneText").scrollTop;
      const winScroll = window.scrollY; // phone layout scrolls the whole page
      requestAnimationFrame(() => { if (shownPassage === cur && window.scrollY !== winScroll) window.scrollTo(0, winScroll); });
      textEl.innerHTML = `${p.title ? `<h2 class="rd-title">${esc(p.title)}</h2>` : ""}` +
        p.paras.map((x) => `<p class="${x.note ? "rd-footnote" : ""}" ${x.label ? `data-label="${esc(x.label)}"` : ""}>${esc(x.text)}</p>`).join("");
      moveOldHighlights(p);
      repairWordPassages();
      highlightMyWords();
      hlList(pk()).forEach((h) => wrapRange(textEl, h.s, h.e, { class: "hl", style: `background:${hlBg(h.c)}`, "data-id": h.id, ...(h.note ? { "data-note": "1" } : {}) }));
      // notes you wrote earlier on single words also go to My words
      const hls = hlList(pk());
      if (hls.filter((h) => !h.vid && h.note && isWordHl(h)).map((h) => syncWord(h)).some(Boolean)) saveHl(pk(), hls);
      underlineWords();
      underlineKeywords();
      renderNotes();
      $("#origLink").href = pdfUrl(book.pdf, p.pages[0]);
      $$("#tabs [data-p]").forEach((x) => x.classList.toggle("active", +x.dataset.p === cur));
      // keep your place after highlighting; only go to the top when you open another passage
      const pane = $("#paneText");
      if (shownPassage !== cur) pane.scrollTop = 0;
      else pane.scrollTop = keepScroll;
      shownPassage = cur;
      hideBar(); hidePop();
    }
    function renderNotes() {
      const list = hlList(pk()).slice().sort((x, y) => x.s - y.s);
      const full = textEl.textContent;
      $("#rdNotes").innerHTML = list.length ? `<h3>My highlights &amp; notes (${list.length})</h3>` + list.map((h) =>
        `<div class="rd-note" data-go="${h.id}"><span class="hl" style="background:${hlBg(h.c)}">${esc(full.slice(h.s, h.e).slice(0, 140))}</span>
          ${h.note ? `<div class="small">✎ ${esc(h.note)}</div>` : ""}</div>`).join("") : "";
      $$("[data-go]").forEach((el) => (el.onclick = () => {
        const m = textEl.querySelector(`mark[data-id="${el.dataset.go}"]`);
        if (m) { m.scrollIntoView({ block: "center" }); m.classList.add("goflash"); setTimeout(() => m.classList.remove("goflash"), 1200); }
      }));
      renderWords();
      renderKeywords();
      renderAi();
    }

    /* ---------- my words in this passage ---------- */
    const passageWords = () => Store.get().vocab.filter((v) => v.pk === pk());
    /* ---------- auto vocabulary: the key words of this passage (reading/keywords.js) ---------- */
    const keyWords = () => ((window.KEYWORDS || {})[pk()] || []).map(([w, b]) => ({ w, b, m: (window.KEYWORD_MEANINGS || {})[b] })).filter((k) => k.m);
    const kwHidden = () => (mode === "exam" && !submitted); // no dictionary in the real exam
    const showKw = () => Store.get().settings.showKeywords !== false && !kwHidden();
    const kwMeaning = (k) => `${k.m[2]} – ${k.m[1]}`; // Khmer – simple English
    const kwMine = (k) => Store.get().vocab.find((v) => [k.w.toLowerCase(), k.b].includes(v.word.toLowerCase()));
    function underlineKeywords() {
      if (!showKw()) return;
      const low = textEl.textContent.toLowerCase();
      keyWords().forEach((k) => {
        if (kwMine(k)) return; // already one of My words (shown with its own underline)
        const m = new RegExp(`(^|[^a-z])(${k.w.toLowerCase()})(?![a-z])`).exec(low);
        if (m) wrapRange(textEl, m.index + m[1].length, m.index + m[1].length + k.w.length, { class: "kw", "data-kw": k.b, title: k.m[1] });
      });
    }
    function addKeyword(k) {
      const at = new RegExp(`(^|[^a-z])(${k.w.toLowerCase()})(?![a-z])`).exec(textEl.textContent.toLowerCase());
      saveWord(k.w.toLowerCase(), kwMeaning(k), at ? sentenceAround(at.index + at[1].length) : "", undefined, pk());
    }
    function openKeyPop(b, anchor) {
      const k = keyWords().find((x) => x.b === b);
      if (!k) return;
      resetPop();
      pop.innerHTML = `<div class="row between"><span><b>${esc(k.w)}</b> <button class="btn sm" id="kwSay" title="Listen">🔊</button> ${window.Pron ? Pron.tag(k.w) : ""}</span><button class="btn sm" id="kwClose">✕</button></div>
        <div class="small muted">${esc(k.m[0])}</div><div style="margin:4px 0">${esc(k.m[1])}</div><div class="km">${esc(k.m[2])}</div>
        <div class="row" style="margin-top:8px">${kwMine(k) ? `<span class="small">✓ In My words</span>` : `<button class="btn sm primary" id="kwAdd">＋ Add to My words</button>`}
          <a class="small" target="_blank" href="https://translate.google.com/?sl=en&tl=km&op=translate&text=${encodeURIComponent(k.w)}">Translate</a></div>`;
      place(pop, anchor.getBoundingClientRect());
      if (window.Pron) Pron.fill(pop);
      $("#kwSay").onclick = () => (window.Pron ? Pron.say(k.w) : null);
      $("#kwClose").onclick = hidePop;
      if ($("#kwAdd")) $("#kwAdd").onclick = () => { addKeyword(k); hidePop(); renderPassage(); toast("Saved to My words"); };
    }
    function renderKeywords() {
      let box = $("#rdKw");
      if (!box) { box = document.createElement("div"); box.id = "rdKw"; box.className = "rd-notes"; $("#rdWords").after(box); }
      const ks = keyWords();
      if (!ks.length || kwHidden()) { box.innerHTML = kwHidden() && ks.length ? `<h3>🔑 Key words</h3><p class="small muted">Hidden during the exam (no dictionary in the real test). They come back when you finish.</p>` : ""; return; }
      box.innerHTML = `<h3>🔑 Key words in this passage (${ks.length})</h3>
        <p class="small muted" style="margin-top:0">Hard words picked for you, with a simple English and a Khmer meaning. Tap a word to find it in the passage.</p>
        <div class="kwlist">${ks.map((k) => `<div class="kwrow">
          <button class="btn sm" data-kwsay="${esc(k.w)}" title="Listen">🔊</button>
          <span class="wcol"><b class="wgo" data-kwgo="${esc(k.b)}">${esc(k.w)}</b>${window.Pron ? Pron.tag(k.w) : ""}</span>
          <span class="kwm"><i class="muted">${esc(k.m[0])}</i> ${esc(k.m[1])}<br><span class="km">${esc(k.m[2])}</span></span>
          ${kwMine(k) ? `<span class="pill good" title="In My words">✓</span>` : `<button class="btn sm" data-kwadd="${esc(k.b)}" title="Add to My words">＋</button>`}</div>`).join("")}</div>
        <div class="row" style="margin-top:10px"><a class="btn sm primary" href="#/vocab/study/k:${pk()}">🃏 Practise these key words</a>
          ${ks.some((k) => !kwMine(k)) ? `<button class="btn sm" id="kwAll">＋ Add all to My words</button>` : ""}
          <label class="small row" style="gap:4px"><input type="checkbox" id="kwShow" ${showKw() ? "checked" : ""}> Underline them in the passage</label></div>`;
      if (window.Pron) Pron.fill(box);
      $$("[data-kwsay]", box).forEach((x) => (x.onclick = () => (window.Pron ? Pron.say(x.dataset.kwsay) : null)));
      $$("[data-kwgo]", box).forEach((x) => (x.onclick = () => {
        const m = textEl.querySelector(`mark.kw[data-kw="${x.dataset.kwgo}"]`) || textEl.querySelector(`mark.vw[data-v="${(kwMine(ks.find((k) => k.b === x.dataset.kwgo)) || {}).id}"]`);
        if (!m) return toast("Turn on “Underline them in the passage” to find it");
        const sw = $(`.rd-switch [data-view="text"]`);
        if (sw && $("#rdBody").dataset.view === "q") sw.click();
        m.scrollIntoView({ block: "center" });
        m.classList.add("goflash");
        setTimeout(() => m.classList.remove("goflash"), 1500);
      }));
      $$("[data-kwadd]", box).forEach((x) => (x.onclick = () => { addKeyword(ks.find((k) => k.b === x.dataset.kwadd)); renderPassage(); toast("Saved to My words"); }));
      if ($("#kwAll")) $("#kwAll").onclick = () => { ks.filter((k) => !kwMine(k)).forEach(addKeyword); renderPassage(); toast("All key words saved to My words and highlighted"); };
      $("#kwShow").onchange = (e) => { Store.update((s) => (s.settings.showKeywords = e.target.checked)); renderPassage(); };
    }
    function underlineWords() {
      const full = textEl.textContent.toLowerCase();
      passageWords().forEach((v) => {
        const w = v.word.toLowerCase();
        if (!w) return;
        let at = 0, count = 0, i;
        while ((i = full.indexOf(w, at)) >= 0 && count < 5) {
          const before = full[i - 1] || " ", after = full[i + w.length] || " ";
          if (!/[a-z]/.test(before) && !/[a-z]/.test(after)) { wrapRange(textEl, i, i + w.length, { class: "vw", "data-v": v.id }); count++; }
          at = i + w.length;
        }
      });
    }
    function renderWords() {
      let box = $("#rdWords");
      if (!box) { box = document.createElement("div"); box.id = "rdWords"; box.className = "rd-notes"; $("#rdNotes").after(box); }
      const list = passageWords();
      box.innerHTML = `<h3>📒 My words in this passage (${list.length})</h3>
        ${list.length ? `<div class="wordlist">${list.map((v) => `<div class="wrow" data-v="${v.id}">
            <button class="btn sm" data-say="${esc(v.word)}" title="Listen">🔊</button><span class="wcol"><b class="wgo" data-wgo="${v.id}" title="Show it in the passage">${esc(v.word)}</b>${window.Pron ? Pron.tag(v.word) : ""}</span>
            <input type="text" data-mean="${v.id}" value="${esc(v.meaning || "")}" placeholder="Meaning (Khmer or English)">
            ${(v.lapses || 0) >= 2 ? `<span class="pill warn" title="You got it wrong ${v.lapses} times">🔥</span>` : ""}
            <button class="btn sm thumbbtn" data-wpic="${v.id}" title="Picture">🖼</button>
            <button class="btn sm" data-del="${v.id}" title="Remove">✕</button></div>`).join("")}</div>
          <div class="row" style="margin-top:10px"><a class="btn sm primary" href="#/vocab/study/p:${pk()}" data-style-go="word">🃏 Practise these words</a>
            <a class="btn sm" href="#/vocab/study/p:${pk()}" data-style-go="type">✍️ Spelling practice</a></div>`
          : `<p class="small muted">Don't know a word? Select it in the passage and press <b>＋ Word</b>. Write its meaning, then practise it with flashcards. Words you keep getting wrong will keep coming back.</p>`}`;
      $$("[data-say]", box).forEach((x) => (x.onclick = () => {
        if (window.Pron) return Pron.say(x.dataset.say);
        try { const u = new SpeechSynthesisUtterance(x.dataset.say); u.lang = "en-GB"; speechSynthesis.speak(u); } catch (e) {}
      }));
      if (window.Pron) Pron.fill(box);
      $$("[data-mean]", box).forEach((inp) => inp.addEventListener("change", () => Store.update((s) => { const v = s.vocab.find((x) => x.id === inp.dataset.mean); if (v) { v.meaning = inp.value.trim(); v.meaningHtml = undefined; } })));
      $$("[data-del]", box).forEach((x) => (x.onclick = () => { Store.update((s) => (s.vocab = s.vocab.filter((v) => v.id !== x.dataset.del))); renderPassage(); }));
      $$("[data-wgo]", box).forEach((x) => (x.onclick = () => goToWord(x.dataset.wgo)));
      $$("[data-wpic]", box).forEach(async (btn) => {
        const id = btn.dataset.wpic;
        const u = window.Pics && (await Pics.url(vocabImg(id)));
        if (u) btn.innerHTML = `<img src="${u}" alt="" class="thumb">`;
        btn.onclick = () => {
          const row = btn.closest(".wrow");
          const open = row.nextElementSibling && row.nextElementSibling.classList.contains("picslot");
          $$(".picslot", box).forEach((x) => x.remove());
          if (open) return;
          row.insertAdjacentHTML("afterend", `<div class="picslot"></div>`);
          Pics.picker(row.nextElementSibling, (Store.get().vocab.find((x) => x.id === id) || {}).word || "", () => vocabImg(id), async (pic) => {
            setVocabImg(id, pic);
            const nu = await Pics.url(pic);
            btn.innerHTML = nu ? `<img src="${nu}" alt="" class="thumb">` : "🖼";
          });
        };
      });
      $$("[data-style-go]", box).forEach((a) => a.addEventListener("click", () => Store.update((s) => (s.settings.cardStyle = a.dataset.styleGo))));
    }
    /* ---------- Ask AI about this passage ----------
       Free: the app writes the question (+ the whole passage) for you to paste into Gemini / ChatGPT / Claude.
       You paste the answer back: it is kept with its formatting, and its **bold words** can go to My words + highlights. */
    const AI_ASKS = {
      vocab: { name: "Key vocabulary by theme", text: "Make a breakdown of the key vocabulary from this IELTS reading passage, organised into thematic categories (a heading for each category) to make it easy to study. Under each heading, make a bullet list. Write every word in exactly this format: **word** (part of speech): Khmer meaning – simple English meaning. Write each word exactly as it appears in the passage. Choose words that are useful for IELTS band 6–7." },
      summary: { name: "Explain the passage simply", text: "Explain this IELTS reading passage in simple English for a band 5–6 learner. First give the main idea in 2 sentences, then one short line for each paragraph. Do not answer any test questions." },
      hard: { name: "Hard sentences", text: "Find the 6 most difficult sentences in this IELTS reading passage. For each one, quote it, then explain it in very simple English and give the Khmer meaning." },
      para: { name: "Paraphrases for the questions", text: "IELTS questions often use different words from the passage. For 10 key words or phrases in this passage, give 2–3 synonyms or paraphrases. Write each one in exactly this format: **word from the passage** (part of speech): Khmer meaning – synonyms." },
    };
    let aiKind = "vocab", aiOpen = {};
    const aiNotes = () => (Store.get().aiNotes || {})[pk()] || [];
    const setAiNotes = (list) => Store.update((s) => { s.aiNotes = s.aiNotes || {}; if (list.length) s.aiNotes[pk()] = list; else delete s.aiNotes[pk()]; });
    function aiPrompt(ask) {
      const p = P[cur];
      return `${ask}\n\n${p.title ? `Passage title: ${p.title}\n\n` : ""}${p.paras.filter((x) => !x.note).map((x) => (x.label ? `${x.label}. ` : "") + x.text).join("\n\n")}`;
    }
    async function copyText(text) {
      try { await navigator.clipboard.writeText(text); return true; } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        const ok = document.execCommand("copy"); ta.remove(); return ok;
      }
    }
    /* Read an AI answer. AIs write words in different layouts; all of these are understood:
         A) "**word** (noun): meaning" lines, under category headings
         B) a heading per word ("1. Verbal") with label lines under it ("**Simple Meaning:** …", "**Everyday Example:** …")
         C) a table: Term | Grammatical Role | Definition | Example
       Labels ("Simple Meaning", "Example"…) are never words. Adds a colour dot to each category heading. */
    const AI_LABEL = /^(grammatical role|grammar|part of speech|word class|type|simple meaning|meaning|definition|core definition|khmer( meaning| translation)?|translation|deep context|context|in the passage|in context|everyday example|example( sentence)?s?|synonyms?|antonyms?|pronunciation|collocations?|word family|word forms?|usage|usage & nuance|nuance|etymology|word origin|origin|register|formality|common mistakes?|related words?|note|tip|level|ielts tip|paraphrases?)[.:]?$/i;
    function aiParse(html) {
      const box = document.createElement("div");
      box.innerHTML = Rich.sanitize(html);
      const ok = COLORS.filter((c) => c !== "gray");
      const clean = (s) => s.replace(/\s+/g, " ").replace(/^\s*\d+[.)]\s*/, "").replace(/["“”‘’*]/g, "").replace(/[:.\s]+$/, "").trim();
      const ownText = (el) => { const c = el.cloneNode(true); c.querySelectorAll("ul, ol, table").forEach((x) => x.remove()); return c.textContent.replace(/\s+/g, " ").trim(); };
      // "**Label:** value" -> [label, value]
      const asField = (el) => {
        const b = el.querySelector("b"), text = ownText(el);
        if (!b || !text.startsWith(b.textContent.trim())) return null;
        const label = clean(b.textContent), rest = text.slice(b.textContent.trim().length);
        // "Label:" or "Label." (some AIs end the label with a full stop)
        if (!/^\s*[:.]/.test(rest) && !/[:.]\s*$/.test(b.textContent)) return null;
        if (/\.\s*$/.test(b.textContent) && !/^\s*:/.test(rest) && !AI_LABEL.test(label)) return null; // a sentence, not a label
        return [label, rest.replace(/^\s*[:.]\s*/, "").trim()];
      };
      const els = [...box.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li")].filter((el) => !(el.tagName === "LI" && el.querySelector(":scope > p")));
      // labels: known label names, or bold names used again and again ("Simple Meaning:" under every word)
      const seen = {};
      els.forEach((el) => { const f = asField(el); if (f) seen[f[0].toLowerCase()] = (seen[f[0].toLowerCase()] || 0) + 1; });
      const isLabel = (s) => AI_LABEL.test(s) || (seen[s.toLowerCase()] || 0) >= 3;
      // pass 1: label lines belong to the short line just before them (the word)
      const owners = new Map();
      let owner = null;
      els.forEach((el) => {
        const f = asField(el);
        if (f && isLabel(f[0])) { if (owner) owners.get(owner).push([f[0], f[1], el]); return; }
        const t = ownText(el);
        if (t && clean(t).split(" ").length <= 5 && !f) { owner = el; owners.set(el, []); } else if (t) owner = null;
      });
      // pass 2: categories and words, in order
      const words = [], have = new Set();
      let cats = 0;
      const color = () => (cats ? ok[(cats - 1) % ok.length] : "green");
      const add = (w) => { const k = w.term.toLowerCase(); if (!w.term || !w.meaning || have.has(k) || isLabel(w.term) || !/[a-z]/i.test(w.term)) return; have.add(k); words.push(w); };
      els.forEach((el) => {
        const fields = owners.get(el);
        if (fields && fields.length) { // layout B
          const get = (re) => (fields.find(([l]) => re.test(l)) || [])[1] || "";
          const pos = get(/role|grammar|part of speech|class|type/i);
          const meaning = get(/khmer|translation/i) ? `${get(/khmer|translation/i)} – ${get(/meaning|defin/i)}` : get(/meaning|defin/i) || fields[0][1];
          add({ term: clean(ownText(el)), meaning: (pos ? `(${pos}) ` : "") + meaning, color: color(),
            html: fields.map(([l, v]) => `<p><b>${esc(l)}:</b> ${esc(v)}</p>`).join("") });
          return;
        }
        const text = ownText(el), b = el.querySelector("b");
        const head = /^H\d$/.test(el.tagName) || (el.tagName === "P" && b && b.textContent.trim() === text && text.split(" ").length <= 8 && !/:$/.test(text));
        if (head && !el.closest("li")) {
          cats++;
          el.insertAdjacentHTML("afterbegin", `<span class="hl-dot ai-dot" style="background:${hex(color())}"></span>`);
          return;
        }
        if (!b || el.querySelector("li, p") || !text.startsWith(b.textContent.trim())) return; // layout A
        const term = clean(b.textContent);
        if (isLabel(term) || term.split(/\s+/).length > 5) return;
        const meaning = text.slice(b.textContent.trim().length).replace(/^[\s"“”'’]*/, "").replace(/^\(([^)]*)\)\s*[:\-–—]?\s*/, "($1) ").replace(/^[:\-–—]\s*/, "").trim();
        add({ term, meaning, color: color() });
      });
      // layout C: tables with a definition / meaning column
      box.querySelectorAll("table").forEach((tb) => {
        const rows = [...tb.querySelectorAll("tr")].map((r) => [...r.children].map((c) => c.textContent.replace(/\s+/g, " ").trim()));
        if (rows.length < 2) return;
        const hd = rows[0], col = (re) => hd.findIndex((h) => re.test(h));
        const mi = col(/meaning|defin|khmer/i), pi = col(/role|part of speech|grammar|class/i);
        if (mi <= 0) return;
        rows.slice(1).forEach((r) => add({ term: clean(r[0] || ""), meaning: (pi > 0 && r[pi] ? `(${r[pi]}) ` : "") + (r[mi] || ""), color: color() }));
      });
      const labels = Object.keys(seen).filter(isLabel);
      return { box, words, labels };
    }
    // an earlier version saved label names ("Simple Meaning", "Deep Context"…) as words: remove them
    function aiCleanLabels() {
      const labels = new Set(aiNotes().flatMap((n) => aiParse(n.html).labels));
      const bad = Store.get().vocab.filter((v) => v.pk === pk() && (labels.has(v.word.toLowerCase().replace(/[:.]+$/, "")) || AI_LABEL.test(v.word.trim()))).map((v) => v.id);
      if (bad.length) Store.update((s) => (s.vocab = s.vocab.filter((v) => !bad.includes(v.id))));
      return bad.length;
    }
    // the word in the passage: exact first, then another form of it (deceiving -> deceive, deceived)
    // copied text can hide invisible characters and use different spaces/dashes: compare letters only
    const passText = (i) => (P[i].title || "") + P[i].paras.map((x) => x.text).join(""); // = the text on screen
    function findInPassage(term, i = cur) {
      const full = passText(i), low = full.toLowerCase();
      const parts = String(term || "").normalize("NFKC").toLowerCase().replace(/[^a-z0-9'’\s\-–—]/g, "").split(/[\s\-–—]+/).filter(Boolean);
      if (!parts.length) return null;
      const escp = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const at = (body) => {
        const m = new RegExp(`(^|[^a-z])(${body})(?![a-z])`).exec(low);
        return m ? { s: m.index + m[1].length, e: m.index + m[1].length + m[2].length } : null;
      };
      let hit = at(parts.map(escp).join("[\\s\\-–—]+"));
      // another form of the word: deceiving -> deceive, deceived; looms larger -> loom larger
      if (!hit) {
        const stems = parts.map((p) => (p.length > 4 ? escp(p.replace(/(ing|ed|es|s|e|y|ly)$/, "")) + "[a-z]{0,4}" : escp(p)));
        hit = at(stems.join("[\\s\\-–—]+"));
      }
      return hit ? { ...hit, text: full.slice(hit.s, hit.e) } : null;
    }
    // words saved under the wrong passage (e.g. an AI answer about passage 3 pasted into passage 1's box):
    // move each one to the passage where it really is, so it can be highlighted there
    function repairWordPassages() {
      const prefix = `${b}-${t}-`, move = {};
      Store.get().vocab.forEach((v) => {
        if (!v.pk || !v.pk.startsWith(prefix)) return;
        const own = +v.pk.slice(prefix.length) - 1;
        if (!P[own] || hlList(v.pk).some((h) => h.vid === v.id) || findInPassage(v.word, own)) return;
        const other = P.findIndex((_, i) => i !== own && findInPassage(v.word, i));
        if (other >= 0) move[v.id] = prefix + (other + 1);
      });
      if (!Object.keys(move).length) return;
      Store.update((s) => s.vocab.forEach((v) => {
        if (!move[v.id]) return;
        v.pk = move[v.id];
        v.from = `${testLabel(b, t)} · Passage ${+v.pk.split("-").pop()}`;
        delete v.autoHl; // let it be highlighted in its real passage
      }));
    }
    // every word in "My words in this passage" gets a highlight (with its meaning as the note), once
    function highlightMyWords() {
      const list = hlList(pk());
      const todo = passageWords().filter((v) => !v.autoHl && !list.some((h) => h.vid === v.id));
      if (!todo.length) return;
      todo.forEach((v) => {
        const hit = findInPassage(v.word);
        if (!hit) return;
        const old = list.find((h) => h.s < hit.e && h.e > hit.s);
        if (old) { old.vid = old.vid || v.id; return; } // already highlighted (e.g. with ＋ Word): just link it
        list.push({ id: Store.uid(), s: hit.s, e: hit.e, c: "green", note: v.meaning || "", noteHtml: v.meaningHtml || undefined, vid: v.id, rev: data.rev || 0 });
      });
      saveHl(pk(), list);
      Store.update((s) => s.vocab.forEach((v) => { if (todo.some((x) => x.id === v.id)) v.autoHl = 1; }));
    }
    // click a word in the list -> go to it in the passage
    function goToWord(id) {
      const h = hlList(pk()).find((x) => x.vid === id);
      const m = (h && textEl.querySelector(`mark[data-id="${h.id}"]`)) || textEl.querySelector(`.vw[data-v="${id}"]`);
      if (!m) return toast("This word was not found in the passage text");
      const sw = $(`.rd-switch [data-view="text"]`);
      if (sw && $("#rdBody").dataset.view === "q") sw.click();
      m.scrollIntoView({ block: "center" });
      m.classList.add("goflash");
      setTimeout(() => m.classList.remove("goflash"), 1500);
    }
    function aiAddWords(note) {
      if (!note) return renderAi();
      const { words } = aiParse(note.html);
      aiCleanLabels();
      const lists = P.map((_, i) => hlList(`${b}-${t}-${i + 1}`));
      let added = 0, marked = 0, elsewhere = 0;
      words.forEach((x) => {
        // this passage first; if the word isn't here, the answer was probably about another passage of this test
        let pi = cur, hit = findInPassage(x.term, cur);
        if (!hit) P.forEach((_, i) => { if (!hit && i !== cur) { const h2 = findInPassage(x.term, i); if (h2) { hit = h2; pi = i; } } });
        const acronym = /^[A-Z0-9\s-]+$/.test(x.term); // "AI", "DNA": keep capitals
        const word = hit ? (acronym ? hit.text : hit.text.toLowerCase()) : acronym ? x.term : x.term.toLowerCase();
        const vid = saveWord(word, x.meaning, hit ? sentenceAround(hit.s, pi) : "", x.html, hit ? `${b}-${t}-${pi + 1}` : undefined);
        added++;
        if (hit && !lists[pi].some((h) => h.s < hit.e && h.e > hit.s)) {
          lists[pi].push({ id: Store.uid(), s: hit.s, e: hit.e, c: x.color, note: x.meaning, noteHtml: x.html, vid, rev: data.rev || 0 });
          marked++;
          if (pi !== cur) elsewhere++;
        }
      });
      lists.forEach((l, i) => saveHl(`${b}-${t}-${i + 1}`, l));
      setAiNotes(aiNotes().map((n) => (n.id === note.id ? { ...n, added: true } : n)));
      renderPassage();
      toast(`${added} words saved to My words · ${marked} highlighted${elsewhere ? ` (${elsewhere} of them are in another passage of this test)` : " in the passage"}`);
    }
    function renderAi() {
      let box = $("#rdAi");
      if (!box) { box = document.createElement("div"); box.id = "rdAi"; box.className = "rd-notes ai-box"; ($("#rdKw") || $("#rdWords")).after(box); }
      if (aiCleanLabels()) return renderWords(), renderAi();
      const notes = aiNotes();
      box.innerHTML = `<h3>🤖 Ask AI about this passage</h3>
        <div class="row ai-kinds">${Object.entries(AI_ASKS).map(([k, a]) => `<button class="btn sm ${k === aiKind ? "active" : ""}" data-ai-kind="${k}">${a.name}</button>`).join("")}
          <button class="btn sm ${aiKind === "own" ? "active" : ""}" data-ai-kind="own">My own question</button></div>
        ${aiKind === "own" ? `<input type="text" id="aiOwn" placeholder="Type your question about this passage…" style="margin-top:8px">` : ""}
        ${window.AI && AI.ready() ? `<div class="row" style="margin-top:10px"><button class="btn primary" id="aiNow">✨ Ask ${esc(AI.name())} now</button>
            <a href="#" class="small" id="aiManualShow">or copy &amp; paste into another AI</a></div>
          <div id="aiLive" class="rich ai-answer ai-live hidden"></div>` : `<p class="small muted" style="margin:8px 0 0">Tip: set up the <a href="#/settings">AI helper in Settings</a> to get answers right here.</p>`}
        <div id="aiManual" class="${window.AI && AI.ready() ? "hidden" : ""}">
        <ol class="small ai-steps">
          <li><button class="btn sm primary" id="aiCopy">📋 Copy the question + passage</button></li>
          <li>Open an AI, paste (Ctrl+V) and send:
            <a target="_blank" href="https://gemini.google.com/app">Gemini</a> ·
            <a target="_blank" href="https://chatgpt.com/">ChatGPT</a> ·
            <a target="_blank" href="https://claude.ai/new">Claude</a></li>
          <li>Copy the AI's answer and paste it here. It is saved with this passage.</li>
        </ol>
        <div id="aiPaste" data-placeholder="Paste the AI answer here (Ctrl+V)…"></div></div>
        ${notes.map((n) => {
          const { box: nb, words } = aiParse(n.html);
          return `<details class="ai-note" data-ai="${n.id}" ${aiOpen[n.id] ? "open" : ""}>
            <summary><b>${esc(n.title)}</b> <span class="small muted">· ${esc(n.date)}${n.by ? ` · ${esc(n.by)}` : ""}${words.length ? ` · ${words.length} words` : ""}</span></summary>
            <div class="row" style="margin:8px 0">
              ${words.length ? `<button class="btn sm primary" data-ai-add="${n.id}">${n.added ? "✓ Words added · add again" : `＋ Add ${words.length} words to My words &amp; highlight them`}</button>` : ""}
              <button class="btn sm danger" data-ai-del="${n.id}">Delete</button></div>
            <div class="rich ai-answer">${nb.innerHTML}</div></details>`;
        }).join("")}`;
      $$("[data-ai-kind]", box).forEach((x) => (x.onclick = () => { aiKind = x.dataset.aiKind; renderAi(); if ($("#aiOwn")) $("#aiOwn").focus(); }));
      const askText = () => {
        const own = $("#aiOwn") && $("#aiOwn").value.trim();
        if (aiKind === "own" && !own) { toast("Type your question first"); $("#aiOwn").focus(); return null; }
        return aiKind === "own" ? `${own}\n(Answer in simple English for an IELTS band 5–6 learner, and give Khmer meanings for difficult words.)` : AI_ASKS[aiKind].text;
      };
      $("#aiCopy", box).onclick = async () => {
        const ask = askText();
        if (ask) toast((await copyText(aiPrompt(ask))) ? "Copied! Now paste it into the AI (Ctrl+V)" : "Could not copy. Please try again.");
      };
      if ($("#aiManualShow", box)) $("#aiManualShow", box).onclick = (e) => { e.preventDefault(); $("#aiManual", box).classList.toggle("hidden"); };
      // built-in AI (ai.js): the answer appears here as it is written, then is saved like a pasted answer
      if ($("#aiNow", box)) $("#aiNow", box).onclick = async () => {
        const ask = askText();
        if (!ask) return;
        const title = aiKind === "own" ? $("#aiOwn").value.trim().slice(0, 80) : AI_ASKS[aiKind].name;
        const key = pk(), btn = $("#aiNow", box), live = $("#aiLive", box);
        btn.disabled = true; btn.textContent = "✨ Writing…";
        live.classList.remove("hidden"); live.innerHTML = `<p class="muted">Thinking…</p>`;
        try {
          const text = await AI.ask(aiPrompt(ask), (x) => { const el = $("#aiLive"); if (el && pk() === key) el.innerHTML = AI.md(x); });
          if (!text.trim()) throw new Error("The AI gave an empty answer. Try again.");
          const n = { id: Store.uid(), title, html: AI.md(text), date: App.todayStr(), by: AI.name() };
          Store.update((s) => { s.aiNotes = s.aiNotes || {}; s.aiNotes[key] = [n, ...(s.aiNotes[key] || [])]; });
          if (pk() === key) { aiOpen = { [n.id]: true }; renderAi(); }
          toast("AI answer saved with this passage");
        } catch (err) {
          const el = $("#aiLive");
          if (el) el.innerHTML = `<p style="color:var(--bad)">✗ ${esc(err.message)}</p>`;
          const b2 = $("#aiNow");
          if (b2) { b2.disabled = false; b2.textContent = `✨ Ask ${AI.name()} now`; }
        }
      };
      const paste = $("#aiPaste", box);
      Rich.editor(paste, "", () => {});
      paste.addEventListener("paste", () => setTimeout(() => {
        const html = Rich.sanitize(paste.innerHTML);
        if (!Rich.toText(html).trim()) return;
        const title = aiKind === "own" ? (($("#aiOwn") && $("#aiOwn").value.trim()) || "My question").slice(0, 80) : AI_ASKS[aiKind].name;
        const n = { id: Store.uid(), title, html, date: App.todayStr() };
        setAiNotes([n, ...aiNotes()]);
        aiOpen = { [n.id]: true };
        renderAi();
        toast("AI answer saved with this passage");
      }, 50));
      $$("details[data-ai]", box).forEach((d) => d.addEventListener("toggle", () => (aiOpen[d.dataset.ai] = d.open)));
      $$("[data-ai-add]", box).forEach((x) => (x.onclick = () => aiAddWords(aiNotes().find((n) => n.id === x.dataset.aiAdd))));
      $$("[data-ai-del]", box).forEach((x) => (x.onclick = () => {
        if (!confirm("Delete this AI answer? (Words already added stay in My words.)")) return;
        setAiNotes(aiNotes().filter((n) => n.id !== x.dataset.aiDel));
        renderAi();
      }));
    }

    // pictures for My words (see pictures.js)
    const vocabImg = (id) => (Store.get().vocab.find((x) => x.id === id) || {}).img || null;
    const setVocabImg = (id, pic) => Store.update((s) => { const v = s.vocab.find((x) => x.id === id); if (v) v.img = pic || undefined; });
    function openWordPop(id, anchor) {
      const v = Store.get().vocab.find((x) => x.id === id);
      if (!v) return;
      resetPop();
      pop.innerHTML = `<div class="row between"><span><b>${esc(v.word)}</b> ${window.Pron ? `<button class="btn sm" id="wpSay" title="Listen">🔊</button> ${Pron.tag(v.word)}` : ""}</span><button class="btn sm" id="wpClose">✕</button></div>
        <input type="text" id="wpMean" value="${esc(v.meaning || "")}" placeholder="Meaning (Khmer or English)" style="margin:6px 0">
        <div class="row small"><a target="_blank" href="https://translate.google.com/?sl=en&tl=km&op=translate&text=${encodeURIComponent(v.word)}">Translate</a>
          <a href="#/vocab/study/p:${pk()}">Practise my words</a></div>
        <div id="wpPic" style="margin-top:8px"></div>`;
      place(pop, anchor.getBoundingClientRect());
      if (window.Pics) Pics.picker($("#wpPic"), v.word, () => vocabImg(id), (pic) => { setVocabImg(id, pic); renderWords(); });
      const inp = $("#wpMean");
      inp.addEventListener("change", () => { Store.update((s) => { const x = s.vocab.find((y) => y.id === id); if (x) { x.meaning = inp.value.trim(); x.meaningHtml = undefined; } }); renderWords(); });
      inp.onkeydown = (e) => { if (e.key === "Enter") { inp.blur(); hidePop(); } };
      $("#wpClose").onclick = hidePop;
      if (window.Pron) { Pron.fill(pop); $("#wpSay").onclick = () => Pron.say(v.word); }
    }

    /* =============== questions =============== */
    const choiceBtns = (n, opts) => `<div class="choices" data-q="${n}">${opts.map(([v, label]) =>
      `<button type="button" class="chip" data-v="${esc(v)}">${esc(label)}</button>`).join("")}</div>`;
    const letterSelect = (n, letters, wide) => `<select class="gap ${wide ? "wide" : ""}" data-q="${n}"><option value="">${wide ? "Choose…" : n}</option>${letters.map((l) => `<option>${esc(l)}</option>`).join("")}</select>`;
    const gapInput = (n, g) => g.type === "complete_letter"
      ? letterSelect(n, g.letters.length ? g.letters : "ABCDEFGHIJ".split(""))
      : `<input type="text" class="gap" data-q="${n}" placeholder="${n}" autocomplete="off" spellcheck="false">`;
    const listBox = (g) => g.list.length ? `<div class="qlist">${g.list_title ? `<div class="qlist-title">${esc(g.list_title)}</div>` : ""}
      ${g.list.map((x) => `<div><b>${esc(x.k)}</b> ${esc(x.t)}</div>`).join("")}</div>` : "";
    const TF = { tfng: ["TRUE", "FALSE", "NOT GIVEN"], ynng: ["YES", "NO", "NOT GIVEN"] };

    function groupHtml(g) {
      const tp = TYPE[g.type] || TYPE.complete;
      const letters = g.letters.length ? g.letters : "ABCDEFG".split("");
      let body = "";
      if (TF[g.type]) {
        body = g.items.map((it) => `<div class="qi" id="qi${it.n}"><div class="qstem"><span class="qn">${it.n}</span>${esc(it.t)}</div>${choiceBtns(it.n, TF[g.type].map((v) => [v, v]))}<div class="fix"></div></div>`).join("");
      } else if (g.type === "mcq") {
        body = g.items.map((it) => `<div class="qi" id="qi${it.n}"><div class="qstem"><span class="qn">${it.n}</span>${esc(it.t)}</div>
          <div class="choices col" data-q="${it.n}">${(it.opts.length ? it.opts : letters.map((k) => ({ k, t: "" }))).map((o) =>
            `<button type="button" class="chip opt" data-v="${esc(o.k)}"><b>${esc(o.k)}</b> ${esc(o.t)}</button>`).join("")}</div><div class="fix"></div></div>`).join("");
      } else if (g.type === "multi") {
        // options may be split between the list and the item (an option that wraps onto a 2nd line)
        const listCopy = g.list.map((o) => ({ ...o }));
        let stem = g.items[0] && g.items[0].t ? g.items[0].t : "";
        if (stem && /^[a-z]/.test(stem) && listCopy.length) { listCopy[listCopy.length - 1].t += " " + stem; stem = ""; }
        if (!stem) stem = g.instr.filter((x) => !/^(Choose|Write)/i.test(x)).join(" ");
        const seen = new Set();
        const opts = listCopy.concat(g.items[0] ? g.items[0].opts : []).filter((o) => !seen.has(o.k) && seen.add(o.k)).sort((x, y) => x.k.localeCompare(y.k));
        const howMany = g.b - g.a + 1;
        body = `<div class="qi" id="qi${g.a}"><div class="qstem"><span class="qn">${g.a}${howMany > 1 ? "–" + g.b : ""}</span>${esc(stem)} <span class="small muted">(choose ${howMany})</span></div>
          <div class="choices col multi" data-multi="${g.a}-${g.b}">${(opts.length ? opts : letters.map((k) => ({ k, t: "" }))).map((o) =>
            `<button type="button" class="chip opt" data-v="${esc(o.k)}"><b>${esc(o.k)}</b> ${esc(o.t)}</button>`).join("")}</div><div class="fix"></div></div>`;
      } else if (g.type === "headings" || g.type === "match") {
        body = listBox(g) + g.items.map((it) => `<div class="qi" id="qi${it.n}"><div class="qstem"><span class="qn">${it.n}</span>${esc(it.t)}</div>
          ${g.type === "headings" || letters.length > 9 ? letterSelect(it.n, letters, true) : choiceBtns(it.n, letters.map((l) => [l, l]))}<div class="fix"></div></div>`).join("");
      } else if (g.type === "short") {
        body = g.items.map((it) => `<div class="qi" id="qi${it.n}"><div class="qstem"><span class="qn">${it.n}</span>${esc(it.t)}</div>
          <input type="text" class="gap wide" data-q="${it.n}" autocomplete="off" spellcheck="false"><div class="fix"></div></div>`).join("");
      } else {
        body = listBox(g) + (g.img ? `<img class="q-img" src="${g.img.src}" width="${g.img.w}" height="${g.img.h}" alt="Table / diagram from the book">` : "");
        if (g.layout !== "image") {
          // join printed lines back into sentences; start a new paragraph after a full stop + new item / bullet
          const paras = [];
          g.rows.forEach((row, i) => {
            const parts = row.flat();
            const html = parts.map((x) => typeof x === "string" ? esc(x)
              : x.g ? `<span class="gapwrap" id="qi${x.g}">${gapInput(x.g, g)}<span class="fix"></span></span>` : `<b class="qn">${x.label}</b>`).join("");
            const first = parts[0], last = parts[parts.length - 1];
            const startsNew = typeof first !== "string" ? !!first.label : /^\s*[•●▪\-–]|^\s*[A-Z0-9‘'"]/.test(first);
            const prevText = paras.length ? paras[paras.length - 1].lastText : "";
            const heading = i === 0 && parts.length === 1 && typeof first === "string" && first.split(/\s+/).length <= 8 && !/[.?!]$/.test(first.trim());
            if (!paras.length || paras[paras.length - 1].heading || heading || (startsNew && /[.?!:]\s*$|^$/.test(prevText) && (typeof first !== "string" || /^\s*[•●▪]/.test(first) || prevText.length < 70))) {
              paras.push({ html, heading, lastText: typeof last === "string" ? last : "" });
            } else {
              const p = paras[paras.length - 1];
              p.html += " " + html;
              p.lastText = typeof last === "string" ? last : "";
            }
          });
          body += `<div class="qtext">${paras.map((p) => p.heading ? `<h5>${p.html}</h5>` : `<p>${p.html}</p>`).join("")}</div>`;
        }
      }
      // questions not placed inside the text get their own answer box under the group
      // (tables / diagrams are shown as a picture, so every question in them needs its own box)
      const fb = g.layout === "image" ? range(g.a, g.b).concat(g.fallback.filter((n) => n < g.a || n > g.b)) : g.fallback;
      if (fb.length && g.type !== "multi") {
        body += `<div class="qfallback">${g.layout === "image" ? `<div class="small muted">Write your answers for the ${/table/i.test(g.instr.join(" ")) ? "table" : "diagram"} here:</div>` : ""}
          ${fb.map((n) => `<div class="qi inline" id="qi${n}"><span class="qn">${n}</span>${
            TF[g.type] ? choiceBtns(n, TF[g.type].map((v) => [v, v]))
            : ["match", "headings", "mcq", "complete_letter"].includes(g.type) ? letterSelect(n, g.letters.length ? g.letters : "ABCDEFGHIJ".split(""))
            : `<input type="text" class="gap" data-q="${n}" autocomplete="off" spellcheck="false">`}<span class="fix"></span></div>`).join("")}</div>`;
      }
      return `<section class="qg" data-type="${g.type}">
        <div class="row between"><h4>Questions ${g.a}${g.b > g.a ? "–" + g.b : ""} · <span class="muted">${esc(tp.name)}</span></h4>
          <button class="btn sm tipbtn" type="button">💡 Tip</button></div>
        <div class="qtip ${mode === "practice" ? "" : "hidden"}">${esc(tp.tip)}</div>
        <div class="qinstr">${(g.type === "multi" ? g.instr.filter((x) => /^(Choose|Write|NB)/i.test(x)) : g.instr).map((x) => esc(x)).join("<br>")}</div>
        ${body}</section>`;
    }

    function renderQuestions() {
      const p = P[cur];
      $("#qArea").innerHTML = `<h3 style="margin:0 0 6px">Passage ${cur + 1} · Questions ${p.q[0]}–${p.q[1]}</h3>` + p.groups.map(groupHtml).join("") +
        `<details class="small muted" style="margin-top:14px"><summary>Questions look wrong? Show the original questions</summary>
          ${p.questions.map((q) => `<img class="q-img" loading="lazy" src="${q.src}" width="${q.w}" height="${q.h}" alt="Original questions">`).join("")}</details>`;
      $$("#qArea [data-q]").forEach((el) => {
        const n = +el.dataset.q;
        if (el.classList.contains("choices")) {
          $$(".chip", el).forEach((c) => {
            c.classList.toggle("on", c.dataset.v === ans[n - 1]);
            c.onclick = () => {
              if (locked(n)) return;
              setAns(n, ans[n - 1] === c.dataset.v ? "" : c.dataset.v);
              $$(".chip", el).forEach((x) => x.classList.toggle("on", x.dataset.v === ans[n - 1]));
            };
          });
        } else {
          el.value = ans[n - 1] || "";
          el.addEventListener("input", () => setAns(n, el.value));
          el.addEventListener("change", () => setAns(n, el.value));
          el.addEventListener("keydown", (e) => {
            if (e.key !== "Enter") return;
            const all = $$("#qArea input.gap, #qArea select.gap");
            const i = all.indexOf(el);
            if (all[i + 1]) all[i + 1].focus();
          });
        }
      });
      $$("#qArea [data-multi]").forEach((el) => {
        const [a, z] = el.dataset.multi.split("-").map(Number);
        const nums = range(a, z);
        const chosen = () => nums.map((n) => ans[n - 1]).filter(Boolean);
        const paint = () => $$(".chip", el).forEach((c) => c.classList.toggle("on", chosen().includes(c.dataset.v)));
        paint();
        $$(".chip", el).forEach((c) => (c.onclick = () => {
          if (locked(a)) return;
          let sel = chosen();
          sel = sel.includes(c.dataset.v) ? sel.filter((x) => x !== c.dataset.v) : sel.length < nums.length ? sel.concat(c.dataset.v) : sel.slice(1).concat(c.dataset.v);
          sel.sort();
          nums.forEach((n, i) => (ans[n - 1] = sel[i] || ""));
          changed();
          paint();
        }));
      });
      $$(".tipbtn").forEach((btn) => (btn.onclick = () => btn.closest(".qg").querySelector(".qtip").classList.toggle("hidden")));
      $("#qFoot").innerHTML = `<button class="btn ${cur === 0 ? "hidden" : ""}" id="prevP">← Passage ${cur}</button>
        ${mode === "practice" && !submitted && !checked.includes(cur) ? `<button class="btn primary" id="checkP">✓ Check passage ${cur + 1}</button>` : ""}
        <button class="btn ${cur === P.length - 1 ? "hidden" : ""}" id="nextP">Passage ${cur + 2} →</button>`;
      $("#prevP").onclick = () => go(cur - 1);
      $("#nextP").onclick = () => go(cur + 1);
      if ($("#checkP")) $("#checkP").onclick = checkPassage;
      $("#paneQ").scrollTop = 0;
      paintMarks();
      applyQHighlights();
      renderNav();
    }

    const locked = (n) => !!submitted || checked.some((i) => inP(n, i));
    function setAns(n, v) { ans[n - 1] = v; changed(); }
    function changed() {
      saveDraft();
      counts();
      renderNav();
      startTimer();
    }
    function counts() {
      P.forEach((p, i) => { const el = $("#cnt" + i); if (el) el.textContent = ` ${ans.slice(p.q[0] - 1, p.q[1]).filter((v) => v.trim()).length}/${p.q[1] - p.q[0] + 1}`; });
      if ($("#qcount")) $("#qcount").textContent = $("#cnt" + cur) ? $("#cnt" + cur).textContent : "";
    }
    function renderNav() {
      const [a, z] = P[cur].q;
      $("#qnav").innerHTML = range(a, z).map((n) => {
        const cls = marks[n] === true ? "right" : marks[n] === false ? "wrong" : ans[n - 1] ? "done" : "";
        return `<button class="qdot ${cls}" data-jump="${n}" title="Question ${n}">${n}</button>`;
      }).join("");
      $$("#qnav [data-jump]").forEach((x) => (x.onclick = () => {
        const el = $("#qi" + x.dataset.jump);
        if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 900); }
      }));
    }

    /* ---------- marking ---------- */
    function grade(nums) {
      const res = Grade.gradeSection(keys, ans);
      nums.forEach((n) => (marks[n] = res.results[n - 1].ok));
      return res;
    }
    function paintMarks() {
      if (!Object.keys(marks).length) return;
      const res = Grade.gradeSection(keys, ans);
      Object.entries(marks).forEach(([n, ok]) => {
        n = +n;
        const box = $("#qi" + n);
        if (!box || box.querySelector("[data-multi]")) return;
        box.classList.toggle("right", ok);
        box.classList.toggle("wrong", !ok);
        const fix = box.querySelector(".fix");
        if (fix) fix.innerHTML = ok ? "✓" : `✗ <b>${esc(res.results[n - 1].shown)}</b> <button type="button" class="btn sm locbtn" data-loc="${n}">📍 Where &amp; why</button>`;
        $$("input, select", box).forEach((x) => (x.disabled = true));
      });
      $$("#qArea [data-multi]").forEach((el) => {
        const [a, z] = el.dataset.multi.split("-").map(Number);
        if (marks[a] === undefined) return;
        const box = el.closest(".qi");
        const okAll = range(a, z).every((n) => marks[n]);
        box.classList.toggle("right", okAll);
        box.classList.toggle("wrong", !okAll);
        box.querySelector(".fix").innerHTML = okAll ? "✓" : `Answer: <b>${esc(res.results[a - 1].shown)}</b> <button type="button" class="btn sm locbtn" data-loc="${a}">📍 Where &amp; why</button>`;
      });
      $$("#qArea [data-loc]").forEach((btn) => (btn.onclick = (e) => { e.preventDefault(); openReview(+btn.dataset.loc); }));
    }

    /* ---------- where is the answer, and why ---------- */
    const passageOf = (n) => P.findIndex((p) => n >= p.q[0] && n <= p.q[1]);
    const exCache = {};
    function explanations(i, nums) {
      const missing = nums.filter((n) => !exCache[n]);
      if (missing.length && App.explain) App.explain(data, i, keys, range(P[i].q[0], P[i].q[1]), ans).forEach((e) => (exCache[e.n] = e));
      return nums.map((n) => exCache[n]).filter(Boolean);
    }
    function reviewRows(wrong) {
      const byP = {};
      wrong.forEach((n) => (byP[passageOf(n)] = byP[passageOf(n)] || []).push(n));
      return Object.entries(byP).map(([i, nums]) => explanations(+i, nums).map((e) => {
        const p = P[+i];
        const quote = e.loc.length ? e.loc.map((s) => `<blockquote class="ex-quote">${s.label ? `<b>${esc(s.label)}</b> ` : ""}${esc(s.text)}</blockquote>`).join("")
          : `<p class="small muted">I couldn't find the sentence automatically. Look for the key words of the question in the passage.</p>`;
        return `<div class="ex-item" id="ex${e.n}" data-n="${e.n}">
          <div class="row" style="gap:8px"><span class="qn">${e.n}</span>
            <span class="small">Your answer: <s>${esc(ans[e.n - 1] || "(empty)")}</s> → <b>${esc(e.answer)}</b></span>
            <span class="spacer"></span>${e.loc.length ? `<button type="button" class="btn sm" data-show="${e.n}">📍 Show in passage ${+i + 1}</button>` : ""}</div>
          <div class="small muted" style="margin-top:6px">📍 Where the answer is${p && P.length > 1 ? ` (passage ${+i + 1})` : ""}:</div>${quote}
          <div class="ex-why">💡 ${e.why}</div>
          <div class="row" style="margin:4px 0 2px"><button type="button" class="btn sm" data-ask="${e.n}">🤖 Still not clear? Ask AI to explain</button></div>
          <div class="ex-ai rich" id="exai${e.n}">${(Store.get().aiExplain || {})[`${b}-${t}-${e.n}`] || ""}</div>
          <div class="reason" data-n="${e.n}"><span class="small muted">Why did you miss it?</span>
            ${REASONS.map(([k, label]) => `<button type="button" class="chip sm ${reasons[e.n] === k ? "on" : ""}" data-r="${k}">${esc(label)}</button>`).join("")}</div>
        </div>`;
      }).join("")).join("");
    }
    // copy a ready question about one answer, for Gemini / ChatGPT / Claude
    async function askAiWhy(n) {
      const i = passageOf(n), e = explanations(i, [n])[0], p = P[i];
      if (!e) return;
      const text = `I am practising for the IELTS Academic Reading test. My English is about band 5–6, so please explain in very simple English, with short sentences. Give the Khmer meaning of difficult words.

Question ${n} (${TYPE[e.type] ? TYPE[e.type].name : e.type}): ${e.question}
My answer: ${ans[n - 1] || "(empty)"}
Correct answer: ${e.answer}
${e.loc.length ? `The answer is probably in this part of the passage:
"${e.loc.map((s) => s.text).join(" ")}"
` : ""}
Please explain:
1. Which words in the question match which words in the passage (synonyms / paraphrases).
2. Why the correct answer is ${e.answer}${ans[n - 1] ? ` and why my answer ${ans[n - 1]} is wrong` : ""}.
3. A tip so I don't make this mistake again.

The whole passage:
${p.title ? p.title + "\n" : ""}${p.paras.filter((x) => !x.note).map((x) => (x.label ? x.label + ". " : "") + x.text).join("\n\n")}`;
      if (window.AI && AI.ready()) {
        const box = $("#exai" + n), btn = $(`[data-ask="${n}"]`);
        if (btn) { btn.disabled = true; btn.textContent = `🤖 ${AI.name()} is explaining…`; }
        box.innerHTML = `<p class="muted">Thinking…</p>`;
        try {
          const answer = await AI.ask(text, (x) => (box.innerHTML = AI.md(x)));
          const html = AI.md(answer);
          box.innerHTML = html;
          Store.update((s) => { s.aiExplain = s.aiExplain || {}; s.aiExplain[`${b}-${t}-${n}`] = html; });
        } catch (err) { box.innerHTML = `<p style="color:var(--bad)">✗ ${esc(err.message)}</p>`; }
        if (btn) { btn.disabled = false; btn.textContent = "🤖 Ask AI again"; }
        return;
      }
      toast((await copyText(text)) ? "Copied! Open Gemini or ChatGPT and paste it (Ctrl+V)" : "Could not copy. Please try again.");
      window.open("https://gemini.google.com/app", "_blank");
    }
    function showInPassage(n) {
      const i = passageOf(n);
      const e = explanations(i, [n])[0];
      if (!e || !e.loc.length) return;
      if (cur !== i) {
        cur = i;
        renderPassage();
        renderQuestions();
      }
      $$("mark.loc", textEl).forEach((m) => { const parent = m.parentNode; while (m.firstChild) parent.insertBefore(m.firstChild, m); parent.removeChild(m); parent.normalize(); });
      e.loc.forEach((s) => wrapRange(textEl, s.start, s.end, { class: "loc" }));
      const first = textEl.querySelector("mark.loc");
      $("#rdBody").dataset.view = "text";
      $$(".rd-switch [data-view]").forEach((y) => y.classList.toggle("active", y.dataset.view === "text"));
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function openReview(n) {
      const el = $("#ex" + n);
      if (!el) {
        // not listed yet (e.g. reviewing a correct passage): show this one on its own
        $("#result").insertAdjacentHTML("afterbegin", `<div class="card fb-card">${reviewRows([n])}</div>`);
        wireReasons();
      }
      const item = $("#ex" + n);
      if (item) { item.scrollIntoView({ behavior: "smooth", block: "center" }); item.classList.add("flash"); setTimeout(() => item.classList.remove("flash"), 1200); }
      showInPassage(n);
    }

    function checkPassage() {
      const nums = range(P[cur].q[0], P[cur].q[1]);
      const empty = nums.filter((n) => !ans[n - 1].trim()).length;
      if (empty && !confirm(`${empty} answers on this passage are empty. Check anyway?`)) return;
      grade(nums);
      checked.push(cur);
      saveDraft();
      renderQuestions();
      if (checked.length === P.length) return finish(true);
      $("#result").innerHTML = passageFeedback(cur, nums.filter((n) => marks[n]).length, nums.length);
      wireReasons();
      $("#paneQ").scrollTop = 0;
    }
    function passageFeedback(i, ok, total) {
      const wrong = range(P[i].q[0], P[i].q[1]).filter((n) => marks[n] === false);
      return `<div class="card fb-card"><b>Passage ${i + 1}: ${ok}/${total} correct</b>
        ${wrong.length ? `<p class="small" style="margin:6px 0">Here is where each answer is and why. Click <b>📍 Show in passage</b> to see the sentence, then tell me why you missed it. I use that for your advice.</p><p class="small muted" style="margin:0 0 6px">The sentence is found automatically and is right most of the time. If it doesn&rsquo;t seem to match, read the sentences just before and after it.</p>${reviewRows(wrong)}` : `<p class="small">🎉 All correct!</p>`}
        ${i < P.length - 1 ? `<button class="btn sm primary" id="goNext">Go to passage ${i + 2} →</button>` : ""}</div>`;
    }
    function wireReasons() {
      $$("#result [data-show]").forEach((btn) => (btn.onclick = () => showInPassage(+btn.dataset.show)));
      $$("#result [data-ask]").forEach((btn) => (btn.onclick = () => askAiWhy(+btn.dataset.ask)));
      $$("#result .ex-quote").forEach((q) => (q.onclick = () => showInPassage(+q.closest(".ex-item").dataset.n)));
      $$(".reason").forEach((row) => $$("[data-r]", row).forEach((btn) => (btn.onclick = () => {
        $$("[data-r]", row).forEach((x) => x.classList.toggle("on", x === btn));
        const n = +row.dataset.n;
        reasons[n] = btn.dataset.r;
        saveDraft();
        if (submitted) Store.update((s) => {
          const m = s.mistakes.slice().reverse().find((x) => x.skill === "R" && x.book === b && x.test === t && x.q === n);
          if (m) m.reason = btn.dataset.r;
        });
      })));
      if ($("#goNext")) $("#goNext").onclick = () => go(cur + 1);
    }

    /* ---------- finish + advice ---------- */
    function finish(auto) {
      if (!auto) {
        const empty = ans.filter((a) => !a.trim()).length;
        if (empty && !confirm(`${empty} answers are empty. In the real exam, always guess. Finish anyway?`)) return;
      }
      clearTimeout(saveTimer);
      stopTimer();
      const all = range(1, 40);
      const res = grade(all);
      const types = {};
      all.forEach((n) => { const k = typeOf[n] || "complete"; types[k] = types[k] || [0, 0]; types[k][1]++; if (res.results[n - 1].ok) types[k][0]++; });
      const attempt = { id: Store.uid(), skill: "R", book: b, test: t, date: new Date().toISOString(), answers: ans.slice(), score: res.score,
        band: Grade.band("R", res.score), seconds: elapsed, mode, types, ptime: ptime.slice() };
      Store.update((s) => {
        s.attempts.push(attempt);
        delete s.drafts[draftKey];
        res.results.forEach((r, i) => { if (!r.ok) s.mistakes.push({ id: Store.uid(), skill: "R", book: b, test: t, q: i + 1, yours: ans[i], correct: r.shown, date: attempt.date, note: "", reason: reasons[i + 1] || "", type: typeOf[i + 1] || "" }); });
      });
      submitted = attempt;
      $("#modeName").textContent = "Results";
      renderQuestions();
      showAdvice(attempt, res);
    }

    function showAdvice(attempt, res) {
      const target = +Store.get().settings.targetBand || 6.5;
      const need = Grade.needed("R", target);
      const wrong = res.results.filter((r) => !r.ok).map((r) => r.q);
      const typeRows = Object.entries(attempt.types || {}).sort((x, y) => x[1][0] / x[1][1] - y[1][0] / y[1][1]);
      const color = (f) => (f >= 0.75 ? "var(--good)" : f >= 0.5 ? "var(--warn)" : "var(--bad)");
      $("#result").innerHTML = `<div class="card advice">
        <div class="row"><div class="band-big">${attempt.band}</div><div><b>${attempt.score}/40 correct</b>
          <div class="small muted">${P.map((p, i) => `Passage ${i + 1}: ${res.results.slice(p.q[0] - 1, p.q[1]).filter((r) => r.ok).length}/${p.q[1] - p.q[0] + 1}`).join(" · ")}</div>
          <div class="small muted">Time ${fmtTime(attempt.seconds)}${attempt.ptime ? ` (${attempt.ptime.map((s, i) => `P${i + 1} ${fmtTime(s)}`).join(", ")})` : ""}</div></div></div>
        <p class="small">${attempt.score >= need ? `🎉 At or above your target (${target}).` : `For band ${target} you need about ${need}/40, so ${need - attempt.score} more correct answers.`}</p>
        ${typeRows.length ? `<h4>Your score by question type</h4>
        <table class="tbl">${typeRows.map(([k, [ok, tot]]) => `<tr><td>${esc((TYPE[k] || TYPE.complete).name)}</td><td style="width:70px">${ok}/${tot}</td>
          <td style="width:38%"><div class="progress"><i style="width:${Math.round((ok / tot) * 100)}%;background:${color(ok / tot)}"></i></div></td></tr>`).join("")}</table>` : ""}
        <h4>My advice for you</h4><ul class="tips">${advice(attempt, res).map((x) => `<li>${x}</li>`).join("")}</ul>
        ${wrong.length ? `<h4>Your mistakes: where the answer is, and why</h4>
          <p class="small muted">Click 📍 to see the sentence in the passage. Tap a reason for each one; I use it for your advice.</p><p class="small muted" style="margin:0 0 6px">The sentence is found automatically and is right most of the time. If it doesn&rsquo;t seem to match, read the sentences just before and after it.</p>${reviewRows(wrong)}` : ""}
        <div class="row" style="margin-top:10px"><a class="btn sm" href="#/progress">All my results &amp; advice</a><button class="btn sm" id="retry">Try this test again</button></div>
      </div>`;
      wireReasons();
      $("#retry").onclick = () => { Store.update((s) => delete s.drafts[draftKey]); App.route(); };
      $("#paneQ").scrollTop = 0;
      renderNav();
    }

    function advice(attempt, res) {
      const out = [];
      const tt = attempt.types || {};
      Object.entries(tt).filter(([, [ok, tot]]) => tot >= 2 && ok / tot < 0.7).sort((x, y) => x[1][0] / x[1][1] - y[1][0] / y[1][1]).slice(0, 3)
        .forEach(([k, [ok, tot]]) => out.push(`<b>${esc((TYPE[k] || TYPE.complete).name)}</b> (${ok}/${tot}): ${esc((TYPE[k] || TYPE.complete).tip)}`));
      const empty = attempt.answers.filter((a) => !a.trim()).length;
      if (empty) out.push(`You left <b>${empty}</b> answers empty. There is no penalty for wrong answers, so <b>always guess</b>.`);
      const near = res.results.filter((r, i) => !r.ok && attempt.answers[i] && attempt.answers[i].length > 3 &&
        r.shown.split(/ \/ | or | \+ /).some((x) => lev(Grade.norm(attempt.answers[i]), Grade.norm(x.replace(/\(any order\)|\(both needed\)|[()]/g, ""))) <= 2)).length;
      if (near) out.push(`<b>${near}</b> answers were almost right (spelling or a missing letter, e.g. plural -s). Check spelling and singular/plural before you finish.`);
      const pt = attempt.ptime || [];
      if (pt[0] > 22 * 60) out.push(`You spent ${fmtTime(pt[0])} on Passage 1. Try to finish it in about <b>17–20 minutes</b> so you have more time for Passage 3.`);
      if (attempt.mode === "exam" && attempt.seconds > 60 * 60) out.push("You went over 60 minutes. In the real test you must stop at 60, so practise moving on when one question takes more than 2 minutes.");
      if (attempt.mode === "practice" && attempt.score >= 25) out.push("Good score in Practice mode. Next time try <b>Exam mode</b> (60 minutes, no tips) to get used to real test pressure.");
      const rc = {};
      Store.get().mistakes.filter((m) => m.skill === "R" && m.reason).forEach((m) => (rc[m.reason] = (rc[m.reason] || 0) + 1));
      Object.values(reasons).forEach((r) => (rc[r] = (rc[r] || 0) + 1));
      const topR = Object.entries(rc).sort((x, y) => y[1] - x[1])[0];
      if (topR && topR[1] >= 3) out.push(`<b>Your most common reason:</b> ${REASON_ADVICE[topR[0]]}`);
      if (!out.length) out.push("Excellent work! Keep doing one test every two days and review the few mistakes carefully.");
      out.push("Next: go back to the passage, find the sentence for each wrong answer and <b>highlight</b> it with a note. That review is how you improve fastest.");
      return out;
    }
    function lev(a, c) {
      if (Math.abs(a.length - c.length) > 2) return 9;
      const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
      for (let j = 1; j <= c.length; j++) d[0][j] = j;
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= c.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === c[j - 1] ? 0 : 1));
      return d[a.length][c.length];
    }

    /* =============== selection toolbar (passage AND questions) =============== */
    // Two places you can highlight: the passage, and the question area. In the question area,
    // buttons, answer boxes, ✓/✗ marks and tips are skipped so highlighting never breaks answering.
    const QSKIP = (n) => !!(n.parentElement && n.parentElement.closest("select, option, button, .fix, .qnav, .tipbtn, .qtip, details, h3, .locbtn"));
    const SURF = {
      p: { id: "p", el: () => textEl, key: () => pk(), skip: null },
      q: { id: "q", el: () => $("#qArea"), key: () => pk() + "-q", skip: QSKIP },
    };
    const surfOf = (node) => (textEl.contains(node) ? SURF.p : $("#qArea") && $("#qArea").contains(node) ? SURF.q : null);
    function refresh(surf) {
      if (surf.id === "p") return renderPassage();
      applyQHighlights();
    }
    function applyQHighlights() {
      const el = $("#qArea");
      if (!el) return;
      unwrapMarks(el, "mark.hl");
      hlList(SURF.q.key()).forEach((h) => wrapRange(el, h.s, h.e, { class: "hl", style: `background:${hlBg(h.c)}`, "data-id": h.id, ...(h.note ? { "data-note": "1" } : {}) }, QSKIP));
    }

    let selRange = null;
    function hideBar() { bar.classList.add("hidden"); selRange = null; }
    function hidePop() { pop.classList.add("hidden"); resetPop(); }
    function resetPop() { pop.classList.remove("note-pop", "big"); pop.style.width = pop.style.height = ""; }
    const touch = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    function place(el, rect) {
      el.classList.remove("hidden");
      const w = el.offsetWidth, h = el.offsetHeight;
      let x = rect.left + rect.width / 2 - w / 2 + window.scrollX;
      x = Math.max(8, Math.min(x, window.innerWidth - w - 8));
      let y = rect.top + window.scrollY - h - 8;
      if (rect.top < h + 16) y = rect.bottom + window.scrollY + 8;
      // phones show their own Copy / Look Up menu above a selection: put the colour bar under it
      if (touch && el === bar && rect.bottom + h + 60 < window.innerHeight) y = rect.bottom + window.scrollY + 14;
      // big boxes: keep them inside the screen
      y = Math.max(window.scrollY + 8, Math.min(y, window.scrollY + window.innerHeight - h - 8));
      el.style.left = x + "px";
      el.style.top = y + "px";
    }
    function onSelect() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return hideBar();
      const r = sel.getRangeAt(0);
      const surf = surfOf(r.commonAncestorContainer);
      if (!surf) return hideBar();
      const anc = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement;
      if (anc.closest("input, select, textarea, button")) return hideBar();
      const root = surf.el();
      const s = textPos(root, r.startContainer, r.startOffset, surf.skip), e = textPos(root, r.endContainer, r.endOffset, surf.skip);
      const text = r.toString().trim();
      if (!text || e <= s) return hideBar();
      selRange = { s, e, text, surf };
      hidePop();
      place(bar, r.getBoundingClientRect());
    }
    [textEl, $("#qArea")].forEach((el) => {
      el.addEventListener("mouseup", () => setTimeout(onSelect, 10));
      el.addEventListener("touchend", () => setTimeout(onSelect, 300));
    });
    const onSelChange = () => { const s = window.getSelection(); if (s && s.isCollapsed && !bar.matches(":hover")) setTimeout(() => { if (window.getSelection().isCollapsed) hideBar(); }, 200); };
    document.addEventListener("selectionchange", onSelChange);

    function addHighlight(c, note = "") {
      if (!selRange) return null;
      const { s, e, surf } = selRange;
      const list = hlList(surf.key());
      const overlap = list.filter((h) => h.s < e && h.e > s);
      const h = { id: Store.uid(), s: Math.min(s, ...overlap.map((x) => x.s)), e: Math.max(e, ...overlap.map((x) => x.e)), c,
        note: [...overlap.map((x) => x.note).filter(Boolean), note].filter(Boolean).join(" · "), rev: data.rev || 0 };
      saveHl(surf.key(), list.filter((x) => !overlap.includes(x)).concat(h));
      window.getSelection().removeAllRanges();
      hideBar();
      refresh(surf);
      return h;
    }
    $$("[data-c]", bar).forEach((d) => d.addEventListener("mousedown", (ev) => { ev.preventDefault(); addHighlight(d.dataset.c); }));
    // custom colour: opening the colour picker clears the text selection, so remember it first
    let pendingSel = null;
    const custom = $("#hlCustom");
    custom.parentNode.addEventListener("mousedown", () => (pendingSel = selRange));
    custom.addEventListener("change", () => {
      if (!selRange && pendingSel) selRange = pendingSel;
      addHighlight(custom.value);
      pendingSel = null;
    });
    $$("[data-act]", bar).forEach((btn) => btn.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      if (!selRange) return;
      const word = selRange.text.replace(/\s+/g, " ").slice(0, 80);
      const act = btn.dataset.act;
      if (act === "km") return window.open(`https://translate.google.com/?sl=en&tl=km&op=translate&text=${encodeURIComponent(word)}`, "_blank");
      if (act === "dict") return window.open(`https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word.toLowerCase())}`, "_blank");
      const rect = bar.getBoundingClientRect();
      if (act === "note") { const h = addHighlight("yellow"); if (h) openPop(h.id, true); return; }
      const surf = selRange.surf;
      const sentence = surf.id === "p" ? sentenceAround(selRange.s) : questionLineAround();
      addHighlight("green");
      resetPop();
      pop.innerHTML = `<div class="small muted">Add to my vocabulary</div><b>${esc(word)}</b>
        <input type="text" id="wMean" placeholder="Meaning (Khmer or English)" style="margin:6px 0">
        <div class="row"><button class="btn sm primary" id="wSave">Save word</button><button class="btn sm" id="wClose">Cancel</button>
        <a class="small" target="_blank" href="https://translate.google.com/?sl=en&tl=km&op=translate&text=${encodeURIComponent(word)}">Translate</a></div>
        <div id="wPic" style="margin-top:8px"></div>`;
      place(pop, rect);
      let wid = null; // the word is created as soon as you add a picture or press Save
      if (window.Pics) Pics.picker($("#wPic"), word, () => (wid ? vocabImg(wid) : null), (pic) => {
        wid = wid || saveWord(word, $("#wMean").value.trim(), sentence);
        setVocabImg(wid, pic);
        renderWords();
      });
      $("#wMean").focus();
      $("#wSave").onclick = () => {
        saveWord(word, $("#wMean").value.trim(), sentence);
        renderPassage();
        hidePop();
        toast("Saved to My words");
      };
      $("#wMean").onkeydown = (e) => { if (e.key === "Enter") $("#wSave").click(); };
      $("#wClose").onclick = hidePop;
    }));
    function saveWord(word, meaning, example, meaningHtml, key) { // key: the passage it belongs to (default: this one)
      const today = App.todayStr();
      let id = null;
      Store.update((s) => {
        let v = s.vocab.find((x) => x.word.toLowerCase() === word.toLowerCase());
        if (v) { if (meaning) { v.meaning = meaning; v.meaningHtml = meaningHtml || undefined; } v.pk = key || v.pk || pk(); v.example = v.example || example; }
        else {
          v = { id: Store.uid(), word, meaning, meaningHtml: meaningHtml || undefined, example, box: 0, due: today, added: today, lapses: 0, from: `${testLabel(b, t)} · Passage ${key ? +key.split("-").pop() : cur + 1}`, pk: key || pk() };
          s.vocab.push(v);
        }
        id = v.id;
      });
      return id;
    }
    // the question line around the current selection (used as the example sentence for words found in questions)
    function questionLineAround(node) {
      const sel = window.getSelection();
      const n = node || (sel && sel.rangeCount ? sel.getRangeAt(0).startContainer : null);
      const el = n && (n.nodeType === 1 ? n : n.parentElement);
      const line = el && el.closest(".qstem, .qtext p, .qlist > div, .chip, .qinstr");
      return line ? surfaceText(line, QSKIP).replace(/\s+/g, " ").trim().slice(0, 260) : "";
    }
    function sentenceAround(pos, pi = cur) {
      // find the paragraph that contains this position (the title is rendered first), then the sentence inside it
      const p = P[pi];
      let start = (p.title || "").length;
      for (const para of p.paras) {
        const t = para.text;
        if (pos < start + t.length) {
          const i = pos - start;
          const a = Math.max(0, ...[". ", "? ", "! "].map((x) => t.lastIndexOf(x, i)).filter((x) => x >= 0).map((x) => x + 2));
          const ends = [". ", "? ", "! "].map((x) => t.indexOf(x, i)).filter((x) => x >= 0);
          const z = ends.length ? Math.min(...ends) + 1 : t.length;
          return t.slice(a, Math.min(z, a + 260)).trim();
        }
        start += t.length;
      }
      return "";
    }
    // a highlighted word / short phrase with a note = a word you are learning -> keep it in My words
    const hlText = (h, surf = SURF.p) => surfaceText(surf.el(), surf.skip).slice(h.s, h.e).replace(/\s+/g, " ").trim().replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
    const isWordHl = (h, surf = SURF.p) => { const t = hlText(h, surf); return t && t.split(" ").length <= 5; };
    function syncWord(h, surf = SURF.p) {
      if (!h.note || !h.note.trim() || !isWordHl(h, surf)) return false;
      const word = hlText(h, surf);
      const m = surf.el().querySelector(`mark[data-id="${h.id}"]`);
      const example = surf.id === "p" ? sentenceAround(h.s) : questionLineAround(m);
      const old = h.vid && Store.get().vocab.find((x) => x.id === h.vid);
      if (old) Store.update((s) => { const v = s.vocab.find((x) => x.id === h.vid); v.meaning = h.note.trim(); v.meaningHtml = h.noteHtml || undefined; });
      else h.vid = saveWord(word, h.note.trim(), example, h.noteHtml);
      return true;
    }
    // the note box: drag its corner to resize, or ⤢ for a big box. Your size is remembered.
    function sizePop(anchor) {
      const st = Store.get().settings;
      pop.classList.add("note-pop");
      pop.classList.toggle("big", !!st.notePopBig);
      pop.style.width = st.notePopW && !st.notePopBig ? st.notePopW + "px" : "";
      pop.style.height = st.notePopH && !st.notePopBig ? st.notePopH + "px" : "";
      place(pop, anchor.getBoundingClientRect());
      $("#popBig").onclick = () => {
        Store.update((x) => { x.settings.notePopBig = !x.settings.notePopBig; });
        sizePop(anchor);
      };
    }
    // remember the size when you drag the corner
    pop.addEventListener("mouseup", () => {
      if (!pop.classList.contains("note-pop") || pop.classList.contains("big") || !pop.style.width) return;
      Store.update((x) => { x.settings.notePopW = Math.round(pop.offsetWidth); x.settings.notePopH = Math.round(pop.offsetHeight); });
    });
    function openPop(id, focus) {
      const m = textEl.querySelector(`mark[data-id="${id}"]`) || $("#qArea").querySelector(`mark[data-id="${id}"]`);
      if (!m) return;
      const surf = surfOf(m);
      const list = hlList(surf.key());
      const h = list.find((x) => x.id === id);
      if (!h) return;
      pop.innerHTML = `<div class="row" style="gap:6px;margin-bottom:6px">${COLORS.map((c) => dot(c, `data-pc="${c}" ${c === h.c ? 'data-on="1"' : ""}`)).join("")}<label class="hl-dot hl-custom" title="Any colour">🎨<input type="color" id="pcCustom" value="${hex(h.c)}"></label>
          <span class="spacer"></span><button class="btn sm danger" id="hlDel">Remove</button><button class="btn sm" id="hlClose">✕</button></div>
        ${isWordHl(h, surf) && window.Pron ? `<div class="row" style="gap:8px;margin-bottom:6px"><b>${esc(hlText(h, surf))}</b><button class="btn sm" id="hlSay" title="Listen">🔊</button>${Pron.tag(hlText(h, surf))}</div>` : ""}
        <div class="row note-tools"><button class="btn sm" data-fmt="bold" title="Bold (Ctrl+B)"><b>B</b></button><button class="btn sm" data-fmt="italic" title="Italic (Ctrl+I)"><i>I</i></button>
          <button class="btn sm" data-fmt="insertUnorderedList" title="Bullet list">• List</button><span class="spacer"></span>
          <span class="small muted">Paste keeps bold, lists &amp; tables</span><button class="btn sm" id="popBig" title="Make the note box bigger / smaller">⤢</button></div>
        <div id="hlNote" data-placeholder="Write a note… (for a word: its meaning, e.g. Khmer). You can paste from an AI or a dictionary."></div>
        <div class="small muted" id="hlWordState">${isWordHl(h, surf) ? (h.vid ? "✓ In My words. Practise it with flashcards." : "A note on a word is saved to My words automatically.") : ""}</div>
        ${isWordHl(h, surf) ? `<div id="hlPic" style="margin-top:8px"></div>` : ""}`;
      if ($("#hlSay")) { Pron.fill(pop); $("#hlSay").onclick = () => Pron.say(hlText(h, surf)); }
      place(pop, m.getBoundingClientRect());
      if (isWordHl(h, surf) && window.Pics) Pics.picker($("#hlPic"), hlText(h, surf), () => (h.vid ? vocabImg(h.vid) : null), (pic) => {
        if (!h.vid || !Store.get().vocab.some((x) => x.id === h.vid)) {
          h.vid = saveWord(hlText(h, surf), (h.note || "").trim(), surf.id === "p" ? sentenceAround(h.s) : questionLineAround(m));
          saveHl(surf.key(), list);
          $("#hlWordState").textContent = "✓ In My words. Practise it with flashcards.";
        }
        setVocabImg(h.vid, pic);
        renderWords();
      });
      const ta = $("#hlNote");
      Rich.editor(ta, h.noteHtml || Rich.fromText(h.note || ""), (html, text) => {
        h.noteHtml = html;
        h.note = text;
        saveHl(surf.key(), list);
        surf.el().querySelectorAll(`mark[data-id="${id}"]`).forEach((x) => (h.note ? x.setAttribute("data-note", "1") : x.removeAttribute("data-note")));
        if (surf.id === "p") renderNotes();
      });
      if (focus) ta.focus();
      $$("[data-fmt]", pop).forEach((btn) => btn.addEventListener("mousedown", (e) => { e.preventDefault(); document.execCommand(btn.dataset.fmt); ta.dispatchEvent(new Event("input")); }));
      ta.addEventListener("focusout", () => {
        if (syncWord(h, surf)) { saveHl(surf.key(), list); $("#hlWordState").textContent = "✓ Saved to My words. Practise it with flashcards."; renderWords(); }
      });
      sizePop(m);
      $$("[data-pc]", pop).forEach((d) => (d.onclick = () => { h.c = d.dataset.pc; saveHl(surf.key(), list); refresh(surf); openPop(id); }));
      $("#pcCustom").addEventListener("change", (e) => { h.c = e.target.value; saveHl(surf.key(), list); refresh(surf); openPop(id); });
      $("#hlDel").onclick = () => { saveHl(surf.key(), list.filter((x) => x.id !== id)); hidePop(); refresh(surf); };
      $("#hlClose").onclick = hidePop;
    }
    const onMarkClick = (e) => {
      if (!window.getSelection().isCollapsed) return;
      const v = e.target.closest("mark.vw");
      if (v) return openWordPop(v.dataset.v, v);
      const m = e.target.closest("mark.hl");
      if (m) return openPop(m.dataset.id);
      const k = e.target.closest("mark.kw");
      if (k) openKeyPop(k.dataset.kw, k);
    };
    textEl.addEventListener("click", onMarkClick);
    $("#qArea").addEventListener("click", onMarkClick);
    const outside = (e) => { if (!pop.contains(e.target) && !e.target.closest("mark.hl") && !bar.contains(e.target)) hidePop(); };
    document.addEventListener("mousedown", outside);

    /* =============== navigation, timer, mode =============== */
    function go(i) {
      if (i < 0 || i >= P.length) return;
      cur = i;
      renderPassage();
      if (!mode) return;
      renderQuestions();
      if (!submitted) $("#result").innerHTML = "";
    }
    $$("#tabs [data-p]").forEach((x) => (x.onclick = () => go(+x.dataset.p)));
    const setFont = (d) => { const f = Math.max(13, Math.min(26, fontSize() + d)); Store.update((s) => (s.settings.readerFont = f)); textEl.style.fontSize = f + "px"; };
    $("#fontDown").onclick = () => setFont(-1);
    $("#fontUp").onclick = () => setFont(1);
    $$(".rd-switch [data-view]").forEach((x) => (x.onclick = () => {
      $$(".rd-switch [data-view]").forEach((y) => y.classList.toggle("active", y === x));
      $("#rdBody").dataset.view = x.dataset.view;
    }));

    function saveDraft() {
      clearTimeout(saveTimer);
      if (submitted) return;
      saveTimer = setTimeout(() => Store.update((s) => (s.drafts[draftKey] = { answers: ans, elapsed, mode, checked, ptime, reasons })), 300);
    }
    const timerEl = $("#timer");
    function renderTimer() {
      if (mode !== "exam") { timerEl.textContent = fmtTime(elapsed); timerEl.classList.remove("low"); return; }
      const r = limit - elapsed;
      timerEl.textContent = r >= 0 ? fmtTime(r) : "+" + fmtTime(-r);
      timerEl.classList.toggle("low", r < 5 * 60);
    }
    function startTimer() {
      if (ticking || submitted || !mode) return;
      ticking = setInterval(() => {
        elapsed++;
        ptime[cur] = (ptime[cur] || 0) + 1;
        renderTimer();
        if (elapsed % 15 === 0) saveDraft();
        if (mode === "exam" && elapsed === limit) toast("Time is up! Finish your answers.");
        if (mode === "exam" && elapsed === 20 * 60 && cur === 0) toast("20 minutes gone. Time to move to Passage 2.");
        if (mode === "exam" && elapsed === 40 * 60 && cur < 2) toast("40 minutes gone. Move to Passage 3 soon.");
      }, 1000);
      $("#timerBtn").textContent = "Pause";
    }
    function stopTimer() { clearInterval(ticking); ticking = null; $("#timerBtn").textContent = "Resume"; }
    $("#timerBtn").onclick = () => (ticking ? stopTimer() : startTimer());
    $("#submitBtn").onclick = () => { if (mode && !submitted) finish(false); };

    function chooseMode(m) {
      mode = m;
      $("#modeName").textContent = mode === "practice" ? "Practice mode" : "Exam mode";
      $("#result").innerHTML = "";
      saveDraft();
      renderTimer();
      renderQuestions();
      startTimer();
    }
    function askMode() {
      $("#qArea").innerHTML = "";
      $("#qFoot").innerHTML = "";
      $("#qnav").innerHTML = "";
      const past = attemptsFor("R", b, t);
      const best = bestFor("R", b, t);
      $("#result").innerHTML = `<div class="card mode-ask">
        <h3 style="margin-top:0">How do you want to do this test?</h3>
        ${past.length ? `<p class="small muted">You have done this test ${past.length}× · best ${best.score}/40 (band ${best.band}).</p>` : ""}
        <button class="mode-card" id="mPractice"><b>📝 Practice mode</b><span>Tips are shown for each question type. Check each passage as soon as you finish it and see the right answers. The clock just counts up.</span></button>
        <button class="mode-card" id="mExam"><b>⏱ Exam mode</b><span>Like the real test: 60 minutes, no tips, results only at the end. I'll remind you about time.</span></button>
        <p class="small muted">Either way, at the end I'll show your score by question type, ask why you missed questions, and give you advice.</p>
        ${past.length ? `<button class="btn sm" id="reviewLast">Review my last attempt</button>` : ""}
      </div>`;
      $("#mPractice").onclick = () => chooseMode("practice");
      $("#mExam").onclick = () => chooseMode("exam");
      if ($("#reviewLast")) $("#reviewLast").onclick = () => {
        const last = past[past.length - 1];
        last.answers.forEach((v, i) => (ans[i] = v));
        submitted = last;
        mode = last.mode || "exam";
        $("#modeName").textContent = "Review";
        const res = grade(range(1, 40));
        renderQuestions();
        showAdvice(last, res);
      };
    }

    renderPassage();
    counts();
    renderTimer();
    if (mode) {
      $("#modeName").textContent = mode === "practice" ? "Practice mode" : "Exam mode";
      checked.forEach((i) => grade(range(P[i].q[0], P[i].q[1])));
      renderQuestions();
    } else {
      $("#modeName").textContent = "choose a mode";
      askMode();
    }

    App.setCleanup(() => {
      stopTimer();
      clearTimeout(saveTimer);
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("selectionchange", onSelChange);
      bar.remove(); pop.remove();
      if (submitted) return;
      Store.update((s) => {
        if (mode && (ans.some((x) => x.trim()) || elapsed > 0)) s.drafts[draftKey] = { answers: ans, elapsed, mode, checked, ptime, reasons };
        else delete s.drafts[draftKey];
      });
    });
  }

  const REASON_ADVICE = {
    find: "you often can't find the answer. Underline 2–3 key words in each question (names, numbers, unusual words) and scan the passage for them or their synonyms.",
    word: "unknown words. Save them with ＋ Word while reading and review the Vocabulary flashcards every day.",
    ng: "Not Given vs False. FALSE needs the passage to say the OPPOSITE; if it just doesn't say, it's NOT GIVEN.",
    trap: "options that repeat words from the passage trick you. Check that the MEANING matches, not just the words.",
    spell: "spelling and word limits. Copy words exactly from the passage and count the words.",
    time: "time. Skim each passage in 2–3 minutes first, and don't spend more than 2 minutes on one question.",
  };
  App.REASON_ADVICE = REASON_ADVICE;
});

/* Progress page: what to work on, from all Reading attempts */
(window.APP_MODULES = window.APP_MODULES || []).push(function (App) {
  const { pages, main, esc } = App;
  const base = pages.progress;
  pages.progress = (...args) => {
    base(...args);
    const TYPE = App.READING_TYPES;
    const tot = {};
    Store.get().attempts.filter((a) => a.skill === "R" && a.types).forEach((a) =>
      Object.entries(a.types).forEach(([k, [ok, n]]) => { tot[k] = tot[k] || [0, 0]; tot[k][0] += ok; tot[k][1] += n; }));
    const rc = {};
    Store.get().mistakes.filter((m) => m.skill === "R" && m.reason).forEach((m) => (rc[m.reason] = (rc[m.reason] || 0) + 1));
    if (!Object.keys(tot).length) return;
    const rows = Object.entries(tot).sort((x, y) => x[1][0] / x[1][1] - y[1][0] / y[1][1]);
    const weakest = rows.filter(([, [ok, n]]) => n >= 4 && ok / n < 0.7).slice(0, 2);
    const topR = Object.entries(rc).sort((x, y) => y[1] - x[1])[0];
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h2>Reading: what to work on</h2>
      <table class="tbl">${rows.map(([k, [ok, n]]) => `<tr><td>${esc((TYPE[k] || TYPE.complete).name)}</td><td style="width:90px">${ok}/${n} (${Math.round((ok / n) * 100)}%)</td>
        <td style="width:35%"><div class="progress"><i style="width:${Math.round((ok / n) * 100)}%;background:${ok / n >= 0.75 ? "var(--good)" : ok / n >= 0.5 ? "var(--warn)" : "var(--bad)"}"></i></div></td></tr>`).join("")}</table>
      <ul class="tips">${weakest.map(([k]) => `<li><b>${esc(TYPE[k].name)}</b> is one of your weakest types. ${esc(TYPE[k].tip)}</li>`).join("")}
        ${topR && topR[1] >= 3 ? `<li><b>Your most common reason for mistakes:</b> ${App.REASON_ADVICE[topR[0]]}</li>` : ""}
        ${!weakest.length ? "<li>No weak question type yet. Keep practising in Exam mode.</li>" : ""}</ul>`;
    const page = main.querySelector(".page");
    page.insertBefore(card, page.children[2] || null);
  };
});
