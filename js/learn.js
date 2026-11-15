/* Vocabulary decks + flashcards + quiz, grammar lessons, and writing task types. */
(window.APP_MODULES = window.APP_MODULES || []).push(function (App) {
  const { pages, main, esc, $, $$, toast, todayStr, addDays } = App;
  const BOX_DAYS = [0, 1, 2, 4, 7, 15, 30];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* =================================================================== */
  /* Vocabulary                                                           */
  /* =================================================================== */
  const parsed = {};
  const mineWords = () => Store.get().vocab.map((v) => ({ key: "mine|" + v.id, id: v.id, word: v.word, pos: "", meaning: v.meaning, meaningHtml: v.meaningHtml, example: v.example, mine: true, pk: v.pk, from: v.from }));
  // key words of the reading passages (reading/keywords.js): "k:19-1-3" one passage, "kb:19" one book, "k:all" every passage
  function keyDeck(filter) {
    const K = window.KEYWORDS || {}, M = window.KEYWORD_MEANINGS || {}, seen = new Set(), out = [];
    Object.keys(K).filter(filter).forEach((pk) => K[pk].forEach(([w, b]) => {
      if (seen.has(b) || !M[b]) return;
      seen.add(b);
      out.push({ key: "kw|" + b, word: b, pos: M[b][0], meaning: `${M[b][2]} – ${M[b][1]}`, example: "", from: pk });
    }));
    return out;
  }
  function deckWords(id) {
    if (id === "mine") return mineWords();
    if (id === "k:all") return keyDeck(() => true);
    if (id && id.startsWith("k:")) return keyDeck((pk) => pk === id.slice(2));
    if (id && id.startsWith("kb:")) return keyDeck((pk) => pk.split("-")[0] === id.slice(3));
    if (id && id.startsWith("p:")) return mineWords().filter((w) => w.pk === id.slice(2)); // words saved from one passage
    if (id === "hard") {
      // words you keep getting wrong, from every deck
      const all = mineWords().concat(...VOCAB_DECKS.map((d) => deckWords(d.id)), deckWords("k:all"));
      return all.filter((w) => prog(w).lapses >= 2 && prog(w).box < 4);
    }
    if (!parsed[id]) {
      const d = VOCAB_DECKS.find((x) => x.id === id);
      parsed[id] = d.words.trim().split("\n").map((line) => {
        const [word, pos, meaning, example] = line.split("|").map((x) => (x || "").trim());
        return { key: id + "|" + word, word, pos, meaning, example };
      });
    }
    return parsed[id];
  }
  function deckInfo(id) {
    if (id === "mine") return { id, name: "My words", desc: "Words you added yourself or saved from the reading passages." };
    if (id === "hard") return { id, name: "🔥 Hard words", desc: "Words you got wrong 2 or more times. They stay here until you know them well." };
    if (id === "k:all") return { id, name: "🔑 All key words", desc: "The hard words of every reading passage, with English and Khmer meanings" };
    if (id && id.startsWith("kb:")) return { id, name: `🔑 Key words · Cambridge ${id.slice(3)}`, desc: "Hard words from this book's reading passages" };
    if (id && id.startsWith("k:")) {
      const [b, t, n] = id.slice(2).split("-");
      return { id, name: `🔑 Key words · Cambridge ${b} · Test ${t} · Passage ${n}`, desc: "The hard words of this passage, with English and Khmer meanings" };
    }
    if (id && id.startsWith("p:")) {
      const [b, t, n] = id.slice(2).split("-");
      return { id, name: `Words from Cambridge ${b} · Test ${+t + (App.D.books[b] && App.D.books[b].label || 0)} · Passage ${n}`, desc: "The words you saved while reading this passage." };
    }
    return VOCAB_DECKS.find((x) => x.id === id);
  }

  // progress for one word: {box 0-6, due date, lapses = how many times you got it wrong}
  function prog(w) {
    if (w.mine) { const v = Store.get().vocab.find((x) => x.id === w.id) || {}; return { box: v.box || 0, due: v.due, lapses: v.lapses || 0 }; }
    const p = (Store.get().deckProgress || {})[w.key];
    return Object.assign({ box: 0, due: null, lapses: 0 }, p);
  }
  function setProg(w, ok) {
    const p = prog(w);
    const box = ok ? Math.min(p.box + 1, BOX_DAYS.length - 1) : 0;
    const lapses = p.lapses + (ok ? 0 : 1);
    // words you often get wrong come back sooner
    let days = ok ? BOX_DAYS[box] : 0;
    if (ok && lapses >= 2) days = Math.max(1, Math.round(days / 2));
    const due = addDays(todayStr(), days);
    Store.update((s) => {
      if (w.mine) { const v = s.vocab.find((x) => x.id === w.id); if (v) { v.box = box; v.due = due; v.lapses = lapses; } }
      else { s.deckProgress = s.deckProgress || {}; s.deckProgress[w.key] = { box, due, lapses }; }
    });
  }
  // pictures for a word (id or list of ids in the Pics store): My words keep it on the word, deck words in wordImages
  const imgOf = (w) => (w.mine ? (Store.get().vocab.find((x) => x.id === w.id) || {}).img : (Store.get().wordImages || {})[w.key]) || null;
  const setImgOf = (w, id) => Store.update((s) => {
    if (w.mine) { const v = s.vocab.find((x) => x.id === w.id); if (v) v.img = id || undefined; }
    else { s.wordImages = s.wordImages || {}; if (id) s.wordImages[w.key] = id; else delete s.wordImages[w.key]; }
  });
  const showPic = async (el, w) => {
    const us = window.Pics ? await Pics.urls(imgOf(w)) : [];
    if (el && us.length) el.innerHTML = `<div class="card-pics">${us.map((u) => `<img class="card-pic" src="${u}" alt="">`).join("")}</div>`;
  };
  const myMeaning = (w) => (w.mine ? "" : ((Store.get().wordNotes || {})[w.key] || ""));
  const setMyMeaning = (w, text) => Store.update((s) => { s.wordNotes = s.wordNotes || {}; s.wordNotes[w.key] = text; });
  const isDue = (w) => { const p = prog(w); return p.box > 0 && (!p.due || p.due <= todayStr()); };
  const isNew = (w) => prog(w).box === 0;

  function speak(text) {
    if (window.Pron) return Pron.say(text); // real recording if there is one (pron.js)
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-GB";
      u.rate = 0.9;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) { toast("Speech is not available in this browser"); }
  }
  const kmLink = (w) => `https://translate.google.com/?sl=en&tl=km&op=translate&text=${encodeURIComponent(w)}`;

  pages.vocab = (mode, id) => {
    if (mode === "study") return study(id);
    if (mode === "quiz") return quiz(id);
    if (mode === "list") return list(id);
    deckList();
  };

  function deckList() {
    const groups = {};
    VOCAB_DECKS.forEach((d) => (groups[d.group] = groups[d.group] || []).push(d));
    const card = (d) => {
      const ws = deckWords(d.id);
      const learned = ws.filter((w) => prog(w).box >= 3).length;
      const due = ws.filter(isDue).length;
      const pct = ws.length ? Math.round((learned / ws.length) * 100) : 0;
      return `<div class="card deck">
        <div class="row between"><h3 style="margin:0">${esc(d.name)}</h3>${due ? `<span class="pill warn">${due} to review</span>` : ""}</div>
        <p class="small muted" style="margin:4px 0 8px">${esc(d.desc)} · ${ws.length} words</p>
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="small muted" style="margin:4px 0 10px">${learned} learned (${pct}%)</div>
        <div class="row"><a class="btn sm primary" href="#/vocab/study/${d.id}">Flashcards</a><a class="btn sm" href="#/vocab/quiz/${d.id}">Quiz</a><a class="btn sm" href="#/vocab/list/${d.id}">Word list</a></div>
      </div>`;
    };
    main.innerHTML = `<div class="page stack">
      <h1>Vocabulary</h1>
      <div class="card"><p>Start with <b>Level 1</b>, then Level 2. Study 10–20 new words a day, and review the cards that are due. Each word comes back after 1, 2, 4, 7, 15 and 30 days, so it moves into long-term memory.</p>
      <p class="small muted">On every card you can hear the word (🔊), see an example, and write your own Khmer meaning. Words you save while reading go into <b>My words</b>.</p></div>
      <h2>My words</h2><div class="grid c2">${card(deckInfo("mine"))}${deckWords("hard").length ? card(deckInfo("hard")) : ""}</div>
      ${window.KEYWORDS ? `<h2>🔑 Key words from the reading passages</h2>
        <div class="grid c2">${card(deckInfo("k:all"))}<div class="card"><h3 style="margin-top:0">By book</h3>
          <p class="small muted">Practise the key words of one Cambridge book (or open a passage and press “Practise these key words”).</p>
          <div class="row" style="flex-wrap:wrap;gap:6px">${[...new Set(Object.keys(window.KEYWORDS).map((k) => +k.split("-")[0]))].sort((a, b) => b - a)
            .map((b) => { const n = deckWords("kb:" + b).filter(isDue).length; return `<a class="btn sm" href="#/vocab/study/kb:${b}">Book ${b}${n ? ` <span class="pill warn">${n}</span>` : ""}</a>`; }).join("")}</div></div></div>` : ""}
      ${Object.entries(groups).map(([g, ds]) => `<h2>${esc(g)}</h2><div class="grid c2">${ds.map(card).join("")}</div>`).join("")}
    </div>`;
  }

  function study(id) {
    const info = deckInfo(id);
    if (!info) return deckList();
    const all = deckWords(id);
    const practiceAll = id === "hard" || id.startsWith("p:") || id.startsWith("k:") && id !== "k:all"; // small personal decks: practise every word
    const due = all.filter(isDue);
    const fresh = shuffle(all.filter(isNew)).slice(0, 15);
    // hard words first, then due reviews, then new words
    const queue = practiceAll ? shuffle(all) : shuffle(due).sort((a, b) => prog(b).lapses - prog(a).lapses).concat(fresh);
    const need = {}; // words missed in this session must be right twice before they leave
    let shown = 0, wrongNow = 0;
    let style = Store.get().settings.cardStyle || "word";
    main.innerHTML = `<div class="page stack" style="max-width:720px">
      <div class="row between"><a class="btn sm" href="#/vocab">← Decks</a><span class="muted small" id="left"></span></div>
      <h1 style="margin-bottom:0">${esc(info.name)}</h1>
      <div class="row small"><span class="muted">Card style:</span>
        <button class="btn sm" data-style="word">See the word → meaning</button>
        <button class="btn sm" data-style="type">See the meaning → type the word</button></div>
      <div id="cardArea"></div>
      <p class="small muted" id="keysHelp"></p>
    </div>`;
    const paintStyle = () => {
      $$("[data-style]").forEach((x) => x.classList.toggle("primary", x.dataset.style === style));
      $("#keysHelp").innerHTML = style === "word"
        ? `Keys: <span class="kbd">Space</span> show answer · <span class="kbd">1</span> not yet · <span class="kbd">2</span> I knew it · <span class="kbd">S</span> speak`
        : `Type the English word and press <span class="kbd">Enter</span>. Good for spelling practice.`;
    };
    $$("[data-style]").forEach((x) => (x.onclick = () => { style = x.dataset.style; Store.update((s) => (s.settings.cardStyle = style)); paintStyle(); next(); }));
    paintStyle();

    function finishCard(w, ok) {
      queue.shift();
      if (!ok) {
        wrongNow++;
        need[w.key] = 2;
        setProg(w, false);
        queue.splice(Math.min(2, queue.length), 0, w); // see it again very soon
      } else if (need[w.key] > 1) {
        need[w.key]--;
        queue.splice(Math.min(4, queue.length), 0, w); // one more time before it leaves
      } else {
        delete need[w.key];
        setProg(w, true);
      }
      shown++;
      next();
    }

    function next() {
      const again = Object.keys(need).length;
      $("#left").textContent = queue.length ? `${queue.length} cards left${again ? ` · ${again} to get right again` : ""}` : "";
      if (!queue.length) {
        $("#cardArea").innerHTML = `<div class="card empty">🎉 ${shown ? `Session finished!${wrongNow ? ` You practised the words you missed until you got them right. They will come back soon so you remember them.` : " Come back tomorrow for the next review."}` : "Nothing to study right now: all cards are learned or not due yet."}
          <div class="row" style="justify-content:center;margin-top:12px"><button class="btn primary" id="again">Practise again</button><a class="btn" href="#/vocab/quiz/${id}">Take a quiz</a><a class="btn" href="#/vocab">Back to decks</a></div></div>`;
        $("#again").onclick = () => App.route();
        return;
      }
      const w = queue[0];
      const p = prog(w);
      const tag = need[w.key] ? `<span class="pill bad">Again: get it right ${need[w.key]}×</span>`
        : p.lapses >= 2 ? `<span class="pill warn">🔥 Hard word</span>`
        : isNew(w) ? `<span class="pill">New word</span>` : `<span class="pill">Review · level ${p.box}/6</span>`;
      const meaning = w.meaning || myMeaning(w);
      if (style === "type" && (meaning || imgOf(w))) return typeCard(w, tag, meaning || "What is this in English?");
      $("#cardArea").innerHTML = `<div class="flash" id="card">
        <div style="width:100%">
          <div>${tag}</div>
          <div class="w">${esc(w.word)}</div>${window.Pron ? `<div class="ipa-line">${Pron.tag(w.word)}</div>` : ""}${w.pos ? `<div class="muted">${esc(w.pos)}</div>` : ""}
          <div id="back" class="hidden" style="margin-top:14px">
            <div id="cardPic"></div>
            ${w.meaningHtml && window.Rich ? `<div class="m rich">${Rich.sanitize(w.meaningHtml)}</div>` : `<div class="m">${esc(w.meaning || "(no meaning yet: add one in My words)")}</div>`}
            ${w.example ? `<div class="small" style="margin-top:8px"><i>${esc(w.example)}</i></div>` : ""}
            ${w.mine ? "" : `<input type="text" id="mine" placeholder="My meaning (Khmer)…" value="${esc(myMeaning(w))}" style="margin-top:12px;text-align:center">`}
            <div class="small" style="margin-top:8px"><a target="_blank" href="${kmLink(w.word)}">Translate to Khmer ↗</a> ·
              <a href="#" id="picToggle">🖼 ${imgOf(w) ? "Add or remove pictures" : "Add a picture"}</a></div>
            <div id="picEdit" class="hidden" style="margin-top:8px"></div>
          </div>
          <div class="small muted" id="tap" style="margin-top:14px">Tap the card to see the meaning</div>
        </div></div>
      <div class="row" style="justify-content:center;margin-top:12px">
        <button class="btn" id="say">🔊 Listen</button><button class="btn" id="no">✗ Not yet</button><button class="btn primary" id="yes">✓ I knew it</button></div>`;
      const reveal = () => { $("#back").classList.remove("hidden"); $("#tap").classList.add("hidden"); };
      $("#card").onclick = (e) => { if (!e.target.closest("input, a, label, button, #picEdit")) reveal(); };
      showPic($("#cardPic"), w);
      if (window.Pron) Pron.fill($("#cardArea"));
      $("#picToggle").onclick = (e) => {
        e.preventDefault();
        const box = $("#picEdit");
        box.classList.toggle("hidden");
        if (!box.classList.contains("hidden") && window.Pics) Pics.picker(box, w.word, () => imgOf(w), (id) => { setImgOf(w, id); $("#cardPic").innerHTML = ""; showPic($("#cardPic"), w); });
      };
      const mine = $("#mine");
      if (mine) mine.addEventListener("change", () => setMyMeaning(w, mine.value.trim()));
      $("#say").onclick = () => speak(w.word);
      const answer = (ok) => { if (mine) setMyMeaning(w, mine.value.trim()); finishCard(w, ok); };
      $("#no").onclick = () => answer(false);
      $("#yes").onclick = () => answer(true);
      speak(w.word);
    }

    function typeCard(w, tag, meaning) {
      // show the meaning; hide the word inside its example sentence
      const re = new RegExp(w.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
      const example = w.example ? esc(w.example).replace(re, "_____") : "";
      const extra = !w.mine && myMeaning(w) ? `<div class="small muted">${esc(myMeaning(w))}</div>` : "";
      $("#cardArea").innerHTML = `<div class="flash" id="card" style="cursor:default">
        <div style="width:100%">
          <div>${tag}</div>
          <div id="cardPic"></div>
          ${w.meaningHtml && window.Rich ? `<div class="m rich" style="margin-top:10px">${Rich.mask(w.meaningHtml, w.word)}</div>`
            : `<div class="m" style="margin-top:10px">${esc(meaning).replace(re, "_____")}</div>`}${extra}
          ${example ? `<div class="small" style="margin-top:8px"><i>${example}</i></div>` : ""}
          <div class="small muted" style="margin-top:6px">Starts with “${esc(w.word[0])}” · ${w.word.length} letters</div>
          <input type="text" id="typed" placeholder="Type the English word" autocomplete="off" spellcheck="false" style="margin-top:14px;text-align:center;font-size:1.2rem;max-width:360px">
          <div id="typeFb" style="margin-top:10px"></div>
        </div></div>
      <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" id="say">🔊 Hint: listen</button><button class="btn primary" id="checkT">Check</button></div>`;
      const inp = $("#typed");
      showPic($("#cardPic"), w); // the picture is a clue
      inp.focus();
      $("#say").onclick = () => speak(w.word);
      let result = null;
      const check = () => {
        if (result !== null) return finishCard(w, result);
        result = Grade.norm(inp.value) === Grade.norm(w.word);
        inp.disabled = true;
        $("#typeFb").innerHTML = result ? `<b style="color:var(--good)">✓ Correct!</b>`
          : `<b style="color:var(--bad)">✗ It's “${esc(w.word)}”</b> <span class="small muted">You wrote “${esc(inp.value || "…")}”. It will come back soon.</span>`;
        if (window.Pron) { $("#typeFb").insertAdjacentHTML("beforeend", `<div class="ipa-line">${Pron.tag(w.word)}</div>`); Pron.fill($("#typeFb")); }
        speak(w.word);
        $("#checkT").textContent = "Next →";
        $("#checkT").focus();
      };
      $("#checkT").onclick = check;
      inp.onkeydown = (e) => { if (e.key === "Enter") check(); };
    }

    const keys = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === " " && $("#back")) { e.preventDefault(); $("#back").classList.remove("hidden"); $("#tap").classList.add("hidden"); }
      if (e.key === "1" && $("#no")) $("#no").click();
      if (e.key === "2" && $("#yes")) $("#yes").click();
      if ((e.key === "s" || e.key === "S") && $("#say")) $("#say").click();
    };
    document.addEventListener("keydown", keys);
    App.setCleanup(() => { document.removeEventListener("keydown", keys); try { speechSynthesis.cancel(); } catch (e) {} });
    next();
  }

  // The quiz needs a short meaning, not a whole note: the first sentence (Khmer + English),
  // without (brackets), and with the word itself hidden so the question does not give the answer away.
  function shortMeaning(w) {
    const lines = (w.meaning || "").replace(/\([^)]*\)/g, "").split(/\n+/).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);
    let out = "";
    for (const line of lines) { out = out ? `${out} · ${line}` : line; if (out.length >= 40) break; }
    const m = out.match(/^.{20,}?[.!?](?=\s|$)/);
    if (m) out = m[0].slice(0, -1); // without the full stop: the quiz adds "?"
    if (out.length > 170) out = out.slice(0, out.lastIndexOf(" ", 170)) + "…";
    const word = w.word.trim().toLowerCase();
    const stem = word.length > 4 ? word.replace(/(ing|ed|es|s|e|y)$/, "") : word;
    return out.replace(new RegExp(`\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[a-z]*`, "gi"), "_____");
  }

  function quiz(id) {
    const info = deckInfo(id);
    const all = deckWords(id).filter((w) => w.meaning);
    if (all.length < 4) { main.innerHTML = `<div class="page"><div class="card empty">Add at least 4 words with meanings to take a quiz. <a href="#/vocab">Back</a></div></div>`; return; }
    const qs = shuffle(all).slice(0, 10).map((w, i) => {
      const wrong = shuffle(all.filter((x) => x.word !== w.word)).slice(0, 3);
      const type = i % 2 ? "meaning" : "word"; // alternate: choose the word / choose the meaning
      return { w, type, opts: shuffle([w, ...wrong]) };
    });
    let i = 0, score = 0;
    main.innerHTML = `<div class="page stack" style="max-width:720px"><div class="row between"><a class="btn sm" href="#/vocab">← Decks</a><span class="muted small" id="qn"></span></div>
      <h1 style="margin-bottom:0">Quiz · ${esc(info.name)}</h1><div id="qArea"></div></div>`;
    function show() {
      if (i >= qs.length) {
        $("#qArea").innerHTML = `<div class="card empty"><div class="band-big">${score}/${qs.length}</div><p>${score >= 8 ? "Excellent! 🎉" : score >= 5 ? "Good work. Keep reviewing." : "Keep going. Study the flashcards, then try again."}</p>
          <div class="row" style="justify-content:center"><button class="btn primary" id="again">New quiz</button><a class="btn" href="#/vocab/study/${id}">Flashcards</a></div></div>`;
        $("#qn").textContent = "";
        $("#again").onclick = () => App.route();
        return;
      }
      const q = qs[i];
      $("#qn").textContent = `Question ${i + 1} of ${qs.length} · score ${score}`;
      const prompt = q.type === "word" ? `Which word means: <b>${esc(shortMeaning(q.w))}</b>?` : `What does <b>${esc(q.w.word)}</b> mean?`;
      $("#qArea").innerHTML = `<div class="card"><p style="font-size:1.1rem">${prompt}</p>
        ${q.w.example && q.type === "meaning" ? `<p class="small muted"><i>${esc(q.w.example)}</i></p>` : ""}
        <div class="stack" id="opts">${q.opts.map((o, k) => `<button class="btn quiz-opt" data-k="${k}" style="justify-content:flex-start;white-space:normal;text-align:left">${esc(q.type === "word" ? o.word : shortMeaning(o))}</button>`).join("")}</div>
        <div id="fb" style="margin-top:10px"></div></div>`;
      $$("#opts [data-k]").forEach((btn) => (btn.onclick = () => {
        const picked = q.opts[+btn.dataset.k];
        const ok = picked.word === q.w.word;
        if (ok) score++;
        setProg(q.w, ok);
        $$("#opts [data-k]").forEach((b2) => {
          b2.disabled = true;
          if (q.opts[+b2.dataset.k].word === q.w.word) b2.classList.add("right");
        });
        if (!ok) btn.classList.add("wrong");
        $("#fb").innerHTML = `<p>${ok ? "✓ Correct!" : `✗ The answer is <b>${esc(q.w.word)}</b>: ${esc(shortMeaning(q.w).replace(/_____/g, q.w.word))}`}</p><button class="btn primary" id="nextQ">Next →</button>`;
        $("#nextQ").onclick = () => { i++; show(); };
        $("#nextQ").focus();
      }));
    }
    show();
  }

  function list(id) {
    const info = deckInfo(id);
    let query = "";
    main.innerHTML = `<div class="page stack">
      <div class="row between"><a class="btn sm" href="#/vocab">← Decks</a><input type="text" id="vs" placeholder="Search…" style="max-width:220px"></div>
      <h1 style="margin-bottom:0">${esc(info.name)}</h1>
      ${id === "mine" ? `<div class="card"><h3>Add a word</h3><div class="grid c3">
        <input type="text" id="vw" placeholder="Word or phrase"><input type="text" id="vm" placeholder="Meaning (Khmer or English)"><input type="text" id="ve" placeholder="Example (optional)"></div>
        <button class="btn primary" id="addW" style="margin-top:8px">Add word</button></div>` : ""}
      <div class="card"><div id="vl"></div></div></div>`;
    function render() {
      const ws = deckWords(id).filter((w) => !query || (w.word + " " + w.meaning + " " + myMeaning(w)).toLowerCase().includes(query));
      $("#vl").innerHTML = ws.length ? `<div class="table-wrap"><table class="tbl"><tr><th></th><th>Word</th><th>Meaning</th><th>${id === "mine" ? "Example" : "My meaning (Khmer)"}</th><th>Level</th>${id === "mine" ? "<th></th>" : ""}</tr>
        ${ws.map((w, i) => `<tr><td style="white-space:nowrap"><button class="btn sm" data-say="${esc(w.word)}" title="Listen">🔊</button>
            <button class="btn sm thumbbtn" data-pic="${i}" title="Picture">🖼</button></td>
          <td><b>${esc(w.word)}</b> <span class="small muted">${esc(w.pos)}</span>${window.Pron ? `<div>${Pron.tag(w.word)}</div>` : ""}</td>
          <td>${id === "mine" ? `<input type="text" data-m="${w.id}" value="${esc(w.meaning)}">` : `${esc(w.meaning)}<div class="small muted"><i>${esc(w.example)}</i></div>`}</td>
          <td>${id === "mine" ? `<span class="small">${esc(w.example)}</span>` : `<input type="text" data-mine="${esc(w.key)}" value="${esc(myMeaning(w))}" placeholder="…">`}</td>
          <td><span class="pill ${prog(w).box >= 3 ? "good" : ""}">${prog(w).box}/6</span></td>
          ${id === "mine" ? `<td><button class="btn sm" data-del="${w.id}">✕</button></td>` : ""}</tr>`).join("")}</table></div>` : `<p class="empty">No words yet.</p>`;
      $$("[data-say]").forEach((b) => (b.onclick = () => speak(b.dataset.say)));
      if (window.Pron) Pron.fill($("#vl"));
      // pictures: small thumbnail on the button; click opens the picture box under that word
      $$("[data-pic]").forEach(async (btn) => {
        const w = ws[+btn.dataset.pic];
        const u = window.Pics && (await Pics.url(imgOf(w)));
        if (u) btn.innerHTML = `<img src="${u}" alt="" class="thumb">`;
        btn.onclick = () => {
          const tr = btn.closest("tr");
          const open = tr.nextElementSibling && tr.nextElementSibling.classList.contains("picrow");
          $$(".picrow", $("#vl")).forEach((r) => r.remove());
          if (open) return;
          tr.insertAdjacentHTML("afterend", `<tr class="picrow"><td colspan="6"><div class="picslot"></div></td></tr>`);
          Pics.picker($(".picslot", tr.nextElementSibling), w.word, () => imgOf(w), async (id) => {
            setImgOf(w, id);
            const nu = await Pics.url(id);
            btn.innerHTML = nu ? `<img src="${nu}" alt="" class="thumb">` : "🖼";
          });
        };
      });
      $$("[data-mine]").forEach((inp) => inp.addEventListener("change", () => setMyMeaning({ key: inp.dataset.mine }, inp.value.trim())));
      $$("[data-m]").forEach((inp) => inp.addEventListener("change", () => Store.update((s) => { const v = s.vocab.find((x) => x.id === inp.dataset.m); v.meaning = inp.value; v.meaningHtml = undefined; })));
      $$("[data-del]").forEach((b) => (b.onclick = () => { Store.update((s) => (s.vocab = s.vocab.filter((x) => x.id !== b.dataset.del))); render(); }));
    }
    $("#vs").oninput = (e) => { query = e.target.value.toLowerCase(); render(); };
    if (id === "mine") {
      $("#addW").onclick = () => {
        const w = $("#vw").value.trim();
        if (!w) return toast("Type a word first");
        const today = todayStr();
        Store.update((s) => s.vocab.push({ id: Store.uid(), word: w, meaning: $("#vm").value.trim(), example: $("#ve").value.trim(), box: 0, due: null, added: today }));
        ["#vw", "#vm", "#ve"].forEach((x) => ($(x).value = ""));
        $("#vw").focus();
        render();
      };
    }
    render();
  }

  /* =================================================================== */
  /* Grammar                                                              */
  /* =================================================================== */
  const gScore = (id) => (Store.get().grammar || {})[id];

  pages.grammar = (id) => {
    if (id) return lesson(id);
    main.innerHTML = `<div class="page stack">
      <h1>Grammar for IELTS</h1>
      <div class="card"><p>Grammar is 25% of your Writing and Speaking score. These are the points that cause the most mistakes in IELTS. Each lesson takes about 10 minutes: read, then do the exercises.</p>
      <p class="small muted">Start with the <b>Must know</b> lessons. Articles and subject–verb agreement are the most common errors for Khmer speakers.</p></div>
      <div class="grid c2">${GRAMMAR.map((g, i) => { const sc = gScore(g.id);
        return `<a class="card lesson-card" href="#/grammar/${g.id}">
          <div class="row between"><span class="pill ${g.level === "Must know" ? "accent" : ""}">${esc(g.level)}</span>${sc ? `<span class="pill ${sc.best === sc.total ? "good" : "warn"}">${sc.best}/${sc.total}</span>` : ""}</div>
          <h3 style="margin:8px 0 4px">${i + 1}. ${esc(g.title)}</h3><p class="small muted" style="margin:0">${esc(g.why)}</p></a>`; }).join("")}</div>
    </div>`;
  };

  function lesson(id) {
    const i = GRAMMAR.findIndex((g) => g.id === id);
    const g = GRAMMAR[i];
    if (!g) return pages.grammar();
    const nextG = GRAMMAR[i + 1];
    main.innerHTML = `<div class="page stack" style="max-width:860px">
      <a class="btn sm" href="#/grammar" style="align-self:flex-start">← All lessons</a>
      <div class="card guide">
        <span class="pill accent">${esc(g.level)}</span>
        <h1 style="margin-top:8px">${esc(g.title)}</h1>
        <p class="notice info"><b>Why it matters in IELTS:</b> ${esc(g.why)}</p>
        ${g.html}
        <h3>Common mistakes</h3><ul>${g.mistakes.map((m) => `<li>${m}</li>`).join("")}</ul>
      </div>
      <div class="card">
        <h2>Practice</h2>
        <div id="ex">${g.ex.map((x, k) => `<div class="ex" data-k="${k}">
          <p><b>${k + 1}.</b> ${esc(x.q)}</p>
          ${x.opts ? `<div class="row">${x.opts.map((o) => `<button class="btn sm" data-opt="${esc(o)}">${esc(o)}</button>`).join("")}</div>`
            : `<input type="text" placeholder="Type your answer" style="max-width:320px">`}
          <div class="small fb"></div></div>`).join("")}</div>
        <div class="row" style="margin-top:12px"><button class="btn primary" id="check">Check answers</button><button class="btn" id="reset">Try again</button>
          ${nextG ? `<a class="btn" href="#/grammar/${nextG.id}">Next lesson →</a>` : ""}</div>
        <div id="score" style="margin-top:10px"></div>
      </div>
    </div>`;
    const chosen = {};
    $$("[data-opt]").forEach((b) => (b.onclick = () => {
      const k = b.closest(".ex").dataset.k;
      chosen[k] = b.dataset.opt;
      $$("[data-opt]", b.parentNode).forEach((x) => x.classList.toggle("primary", x === b));
    }));
    const norm = (v) => String(v || "").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
    $("#check").onclick = () => {
      let score = 0;
      g.ex.forEach((x, k) => {
        const box = $(`.ex[data-k="${k}"]`);
        const val = x.opts ? chosen[k] : $("input", box).value;
        const ok = x.a.some((a) => norm(a) === norm(val) || (norm(a) === "–" && norm(val) === "-"));
        if (ok) score++;
        box.classList.toggle("right", ok);
        box.classList.toggle("wrong", !ok);
        $(".fb", box).textContent = ok ? "✓ Correct" : `✗ Answer: ${x.a[0] === "–" ? "no article (–)" : x.a[0]}`;
      });
      Store.update((s) => { s.grammar = s.grammar || {}; const prev = s.grammar[id] || { best: 0 }; s.grammar[id] = { best: Math.max(prev.best, score), total: g.ex.length, last: score }; });
      $("#score").innerHTML = `<b>${score}/${g.ex.length}</b> ${score === g.ex.length ? "🎉 Perfect!" : "Read the rule again for the ones you missed."}`;
    };
    $("#reset").onclick = () => App.route();
  }

  /* =================================================================== */
  /* Writing task types                                                  */
  /* =================================================================== */
  const COLORS = ["var(--listen)", "var(--write)", "var(--read)", "var(--speak)", "var(--muted)"];

  function drawChart(c) {
    if (!c) return "";
    if (c.kind === "table") {
      return `<div class="table-wrap"><table class="tbl"><tr>${c.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>${c.rows.map((r) => `<tr>${r.map((x) => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</table></div>`;
    }
    if (c.kind === "steps") {
      return `<div class="steps">${c.steps.map((s, i) => `<div class="step"><span>${i + 1}</span>${esc(s)}</div>`).join('<div class="arrow">→</div>')}</div>`;
    }
    if (c.kind === "compare") {
      return `<div class="grid c2"><div class="card"><h4>Before (2000)</h4><ul>${c.before.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="card"><h4>Now</h4><ul>${c.after.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div>`;
    }
    const legend = (names) => `<div class="row small" style="gap:14px">${names.map((n, i) => `<span><i class="lg" style="background:${COLORS[i]}"></i>${esc(n)}</span>`).join("")}</div>`;
    if (c.kind === "pie") {
      const cats = c.series[0].data.map((d) => d[0]);
      const pie = (s) => {
        let a0 = -Math.PI / 2;
        const arcs = s.data.map(([name, v], i) => {
          const a1 = a0 + (v / 100) * Math.PI * 2;
          const p = (a) => `${60 + 55 * Math.cos(a)},${60 + 55 * Math.sin(a)}`;
          const mid = (a0 + a1) / 2;
          const path = `<path d="M60,60 L${p(a0)} A55,55 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)} Z" fill="${COLORS[i]}" stroke="var(--surface)" stroke-width="1.5"/>
            <text x="${60 + 36 * Math.cos(mid)}" y="${63 + 36 * Math.sin(mid)}" font-size="9" text-anchor="middle" fill="#fff">${v}%</text>`;
          a0 = a1;
          return path;
        });
        return `<div style="text-align:center"><svg viewBox="0 0 120 120" width="170">${arcs.join("")}</svg><div class="small"><b>${esc(s.name)}</b></div></div>`;
      };
      return `<div class="row" style="justify-content:center;gap:30px">${c.series.map(pie).join("")}</div>${legend(cats)}`;
    }
    const W = 520, H = 220, L = 34, B = 26, T = 10;
    const raw = Math.max(...c.series.flatMap((s) => s.data));
    const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500].find((st) => raw / st <= 5) || 1000;
    const max = Math.ceil(raw / step) * step;
    const y = (v) => H - B - (v / max) * (H - B - T);
    const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
    let body = ticks.map((v) => `<line x1="${L}" x2="${W - 6}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)"/><text x="${L - 5}" y="${y(v) + 3}" font-size="9" text-anchor="end" fill="var(--muted)">${v}</text>`).join("");
    const n = c.x.length;
    if (c.kind === "line") {
      const x = (i) => L + 10 + (i * (W - L - 30)) / (n - 1);
      body += c.x.map((lab, i) => `<text x="${x(i)}" y="${H - 8}" font-size="10" text-anchor="middle" fill="var(--muted)">${esc(lab)}</text>`).join("");
      body += c.series.map((s, k) => `<polyline fill="none" stroke="${COLORS[k]}" stroke-width="2.5" points="${s.data.map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/>` +
        s.data.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${COLORS[k]}"><title>${esc(s.name)} ${c.x[i]}: ${v}${c.unit === "%" ? "%" : ""}</title></circle>`).join("")).join("");
    } else {
      const gw = (W - L - 16) / n, bw = Math.min(26, (gw - 14) / c.series.length);
      body += c.x.map((lab, i) => `<text x="${L + 8 + gw * i + gw / 2}" y="${H - 8}" font-size="10" text-anchor="middle" fill="var(--muted)">${esc(lab)}</text>`).join("");
      body += c.series.map((s, k) => s.data.map((v, i) => {
        const x0 = L + 8 + gw * i + (gw - bw * c.series.length) / 2 + k * bw;
        return `<rect x="${x0}" y="${y(v)}" width="${bw - 3}" height="${H - B - y(v)}" rx="2" fill="${COLORS[k]}"><title>${esc(s.name)}: ${v}</title></rect>`;
      }).join("")).join("");
    }
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:620px;height:auto" role="img" aria-label="Chart">${body}</svg>${legend(c.series.map((s) => s.name))}<div class="small muted">Unit: ${esc(c.unit || "")}</div>`;
  }

  pages.writetypes = (id) => {
    if (id) return typePage(id);
    const block = (task) => WRITING_TYPES.filter((x) => x.task === task).map((x) => `<a class="card lesson-card" href="#/writetypes/${x.id}">
      <h3 style="margin:0 0 4px">${esc(x.name)}</h3><p class="small muted" style="margin:0">${x.spot}</p></a>`).join("");
    main.innerHTML = `<div class="page stack">
      <h1>Writing task types</h1>
      <div class="card"><p>Every IELTS writing question is one of these types. Learn to <b>recognise the type</b> in the first 30 seconds, then use its paragraph plan. Each type has a model answer written for this site.</p>
      <p class="small muted">After reading a type, click <b>Practise this type</b> to write your own answer with a timer, then find more real questions in your books on the <a href="#/writing">Writing</a> page.</p></div>
      <h2>Task 1 · describe a visual (20 min, 150+ words)</h2><div class="grid c3">${block(1)}</div>
      <h2>Task 2 · essay (40 min, 250+ words)</h2><div class="grid c3">${block(2)}</div>
    </div>`;
  };

  function typePage(id) {
    const x = WRITING_TYPES.find((w) => w.id === id);
    if (!x) return pages.writetypes();
    const words = x.model.split(/\s+/).length;
    main.innerHTML = `<div class="page stack" style="max-width:900px">
      <a class="btn sm" href="#/writetypes" style="align-self:flex-start">← All types</a>
      <div class="card guide">
        <span class="pill accent">Task ${x.task}</span>
        <h1 style="margin-top:8px">${esc(x.name)}</h1>
        <p><b>How to recognise it:</b> ${x.spot}</p>
        <div class="card" style="background:var(--surface-2)"><p style="margin:0"><b>Example question:</b> ${esc(x.question)}</p>
          ${x.chart ? `<div style="margin-top:12px">${drawChart(x.chart)}</div>` : ""}</div>
        <h3>Paragraph plan</h3><ol>${x.plan.map((p) => `<li>${esc(p)}</li>`).join("")}</ol>
        <h3>Useful language</h3><div class="row">${x.language.map((l) => `<span class="pill">${esc(l)}</span>`).join("")}</div>
        <h3>Model answer <span class="small muted">(${words} words)</span></h3>
        <p class="small muted">Try planning your own answer first, then compare.</p>
        <button class="btn" id="showModel">Show model answer</button>
        <div id="model" class="hidden model">${x.model.split(/\n\s*\n/).map((p) => `<p>${esc(p.trim())}</p>`).join("")}</div>
        <div class="row" style="margin-top:16px"><button class="btn primary" id="practise">✍️ Practise this type</button></div>
      </div>
    </div>`;
    $("#showModel").onclick = () => { $("#model").classList.toggle("hidden"); $("#showModel").textContent = $("#model").classList.contains("hidden") ? "Show model answer" : "Hide model answer"; };
    $("#practise").onclick = () => {
      Store.update((s) => (s.drafts[`W-${x.task}-free-`] = { text: "", prompt: x.question, elapsed: 0 }));
      location.hash = `#/write/${x.task}/free`;
    };
  }
});
