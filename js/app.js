/* My IELTS Prep: single-page app. Pages are chosen by the part of the URL after "#/". */
(function () {
  const D = window.IELTS_DATA;
  const C = window.CONTENT;
  const main = document.getElementById("main");
  const BOOK_ORDER = Object.keys(D.books).map(Number).sort((a, b) => b - a); // newest first
  const SKILL = { L: "Listening", R: "Reading", W: "Writing", S: "Speaking" };
  let cleanup = null; // called when leaving a page (stops timers / audio)

  /* ---------------- helpers ---------------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const fileUrl = (path) => encodeURI(path).replace(/#/g, "%23");
  const pdfUrl = (path, page) => fileUrl(path) + (page ? `#page=${page}&view=FitH&navpanes=0&pagemode=none` : "");
  const todayStr = (d = new Date()) => {
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  };
  const parseDay = (s) => new Date(s + "T00:00:00");
  const addDays = (s, n) => { const d = parseDay(s); d.setDate(d.getDate() + n); return todayStr(d); };
  const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400000);
  const fmtDate = (s, opts = { weekday: "short", day: "numeric", month: "short" }) => parseDay(s).toLocaleDateString("en-GB", opts);
  const fmtTime = (sec) => { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`; };
  const testLabel = (b, t) => (D.books[b] ? `Cambridge ${b} · Test ${t + (D.books[b].label || 0)}` : "Practice test");
  const wordCount = (s) => (s.trim().match(/[A-Za-z0-9'’-]+/g) || []).length;
  const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const half = (x) => (x == null ? null : Math.round(x * 2) / 2);

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  function download(name, text, type = "application/json") {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function attemptsFor(skill, b, t) {
    return Store.get().attempts.filter((a) => a.skill === skill && (b == null || a.book === b) && (t == null || a.test === t));
  }
  function bestFor(skill, b, t) {
    const xs = attemptsFor(skill, b, t);
    return xs.length ? xs.reduce((m, a) => (a.score > m.score ? a : m)) : null;
  }
  function estBand(skill) {
    const xs = attemptsFor(skill).slice(-3);
    return half(avg(xs.map((a) => a.band)));
  }

  /* ---------------- theme ---------------- */
  function applyTheme() {
    const th = Store.get().settings.theme;
    if (th) document.documentElement.setAttribute("data-theme", th);
    else document.documentElement.removeAttribute("data-theme");
  }
  document.getElementById("themeBtn").onclick = () => {
    const order = ["", "light", "dark"];
    Store.update((s) => (s.settings.theme = order[(order.indexOf(s.settings.theme || "") + 1) % 3]));
    applyTheme();
    toast("Theme: " + (Store.get().settings.theme || "follow system"));
  };
  document.getElementById("menuBtn").onclick = () => document.getElementById("sidebar").classList.toggle("open");

  /* =================================================================== */
  /* Study plan                                                           */
  /* =================================================================== */
  function testQueue() {
    const q = [];
    BOOK_ORDER.forEach((b) => [1, 2, 3, 4].forEach((t) => q.push([b, t])));
    return q;
  }

  function buildPlan() {
    const s = Store.get().settings;
    if (!s.examDate) return null;
    const start = s.planStart || todayStr();
    const total = daysBetween(start, s.examDate);
    if (total < 0) return { past: true, days: [] };
    const intense = total <= 21;
    const q = testQueue();
    let li = 0, ri = 0, intro = 0, gi = 0;
    const wi = { 1: 0, 2: 0 };
    const days = [];
    for (let i = 0; i <= total; i++) {
      const date = addDays(start, i);
      const left = total - i;
      const tasks = [];
      if (left === 0) {
        tasks.push({ text: "Exam day. Eat breakfast, arrive early, stay calm. You've prepared!", link: "#/guide/testday" });
      } else if (left === 1) {
        tasks.push({ text: "Light review: go over your flashcards and the exam guide", link: "#/vocab" });
        tasks.push({ text: "Read the test day checklist", link: "#/guide/testday" });
        tasks.push({ text: "15 min speaking warm-up, then rest early", link: "#/speaking" });
      } else {
        let learning = false; // first days: read the guides, so only one test that day
        if (intro < C.planIntro.length && total > 4) {
          tasks.push(C.planIntro[intro++]);
          if (intense && intro < C.planIntro.length) tasks.push(C.planIntro[intro++]);
          learning = true;
        }
        const review = i % 7 === 6;
        const doL = (intense && !learning) || i % 2 === 0;
        const doR = (intense && !learning) || i % 2 === 1;
        if (review) tasks.push({ text: "Review day: read back your essays and redo the grammar exercises you missed", link: "#/writing" });
        if (doL) tasks.push({ text: "Listening: one free official practice test, then log your score", link: "#/listening" });
        if (doR) tasks.push({ text: "Reading: one free official practice test, then log your score", link: "#/reading" });
        const task = intense ? (i % 2 ? 2 : 1) : (doL ? 1 : 2);
        tasks.push({ text: `Writing Task ${task}: practise one task type (${task === 1 ? 20 : 40} min)`, link: "#/writetypes" });
        if (window.GRAMMAR && gi < GRAMMAR.length) { const g = GRAMMAR[gi++]; tasks.push({ text: `Grammar lesson: ${g.title}`, link: `#/grammar/${g.id}` }); }
        tasks.push({ text: "Speaking: 15 minutes, record and listen back", link: "#/speaking" });
        tasks.push({ text: "Vocabulary: flashcards (review + 15 new words)", link: "#/vocab" });
      }
      tasks.forEach((tk, k) => (tk.id = `${date}#${k}`));
      days.push({ date, left, tasks });
    }
    return { days, total, intense, start };
  }

  function taskDone(tk) {
    if (Store.get().planDone[tk.id]) return true;
    if (tk.auto) return attemptsFor(tk.auto[0], tk.auto[1], tk.auto[2]).length > 0;
    return false;
  }

  function taskHtml(tk) {
    const done = taskDone(tk);
    return `<label class="task ${done ? "done" : ""}">
      <input type="checkbox" data-task="${esc(tk.id)}" ${done ? "checked" : ""}>
      <span class="task-text">${tk.link ? `<a href="${tk.link}">${esc(tk.text)}</a>` : esc(tk.text)}</span>
    </label>`;
  }

  function bindTasks(root) {
    $$("input[data-task]", root).forEach((cb) =>
      cb.addEventListener("change", () => {
        Store.update((s) => { if (cb.checked) s.planDone[cb.dataset.task] = true; else delete s.planDone[cb.dataset.task]; });
        cb.closest(".task").classList.toggle("done", cb.checked);
      })
    );
  }

  function examDateForm() {
    const s = Store.get().settings;
    return `<div class="row">
      <label class="field" style="max-width:200px"><span>Exam date</span><input type="date" id="examDate" value="${esc(s.examDate)}"></label>
      <label class="field" style="max-width:140px"><span>Target band</span>
        <select id="targetBand">${[5, 5.5, 6, 6.5, 7, 7.5, 8].map((b) => `<option ${+s.targetBand === b ? "selected" : ""}>${b}</option>`).join("")}</select></label>
      <button class="btn primary" id="saveExam" style="align-self:flex-end">Save &amp; make my plan</button>
    </div>`;
  }
  function bindExamForm(after) {
    $("#saveExam").onclick = () => {
      const d = $("#examDate").value;
      if (!d) return toast("Choose your exam date first");
      Store.update((s) => {
        if (s.settings.examDate !== d || !s.settings.planStart) s.settings.planStart = todayStr();
        s.settings.examDate = d;
        s.settings.targetBand = +$("#targetBand").value;
      });
      toast("Saved. Your plan is ready");
      after();
    };
  }

  /* =================================================================== */
  /* Pages                                                                */
  /* =================================================================== */
  const pages = {};

  /* ---------- Dashboard ---------- */
  pages[""] = () => {
    const st = Store.get();
    const s = st.settings;
    const plan = buildPlan();
    const today = todayStr();
    const left = s.examDate ? daysBetween(today, s.examDate) : null;
    const todayPlan = plan && plan.days ? plan.days.find((d) => d.date === today) : null;
    const lB = estBand("L"), rB = estBand("R");
    const dueWords = st.vocab.filter((v) => !v.due || v.due <= today).length;
    const target = +s.targetBand || 6.5;

    main.innerHTML = `<div class="page stack">
      <div class="row between">
        <div><h1>Hello! Let's prepare for IELTS 👋</h1>
        <p class="muted">${s.examDate ? `Exam on <b>${fmtDate(s.examDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</b>. Target band <b>${target}</b>.` : "Start by entering your exam date. I'll build a free day-by-day plan for you."}</p></div>
      </div>

      ${!s.examDate ? `<div class="card"><h2>When is your exam?</h2>${examDateForm()}</div>` : ""}

      <div class="grid c4">
        <div class="card stat"><div class="num">${left == null ? "–" : left < 0 ? "Done" : left}</div><div class="lbl">days until the exam</div></div>
        <div class="card stat skill-L"><div class="num" style="color:var(--listen)">${lB ?? "–"}</div><div class="lbl">Listening band (last 3 tests)</div></div>
        <div class="card stat skill-R"><div class="num" style="color:var(--read)">${rB ?? "–"}</div><div class="lbl">Reading band (last 3 tests)</div></div>
        <div class="card stat"><div class="num">${st.attempts.length}</div><div class="lbl">tests done · ${st.essays.length} essays</div></div>
      </div>

      <div class="grid c2">
        <div class="card">
          <div class="row between"><h2>Today</h2><a href="#/plan" class="small">Full plan →</a></div>
          ${todayPlan ? todayPlan.tasks.map(taskHtml).join("") : s.examDate ? `<p class="muted">No plan for today. Check <a href="#/plan">your plan</a> or <a href="#/settings">exam date</a>.</p>` : `<p class="muted">Your daily tasks will appear here after you set the exam date.</p>`}
        </div>
        <div class="card">
          <h2>Quick start</h2>
          <div class="grid c2">
            <a class="btn skill-L" href="#/listening" style="border-left:4px solid var(--listen)">🎧 Listening test</a>
            <a class="btn" href="#/reading" style="border-left:4px solid var(--read)">📖 Reading test</a>
            <a class="btn" href="#/writing" style="border-left:4px solid var(--write)">✍️ Writing</a>
            <a class="btn" href="#/speaking" style="border-left:4px solid var(--speak)">🗣️ Speaking</a>
            <a class="btn" href="#/vocab">🃏 Flashcards ${dueWords ? `<span class="pill warn">${dueWords} due</span>` : ""}</a>
            <a class="btn" href="#/guide">📘 Exam guide</a>
            <a class="btn" href="#/grammar">📐 Grammar</a>
            <a class="btn" href="#/writetypes">🧭 Writing types</a>
          </div>
          <p class="small muted" style="margin-top:12px">New here? Read the <a href="#/guide">exam guide</a> first (about 20 minutes). It explains every part of the test.</p>
        </div>
      </div>

      ${(lB || rB) ? `<div class="card"><h2>Where you are vs your target (${target})</h2>
        ${["L", "R"].map((k) => { const b = estBand(k); if (b == null) return ""; const need = Grade.needed(k, target);
          return `<p><span class="skill-tag skill-${k}">${SKILL[k]}</span>: band ${b}. For ${target} you need about <b>${need}/40</b> correct. ${b >= target ? "✅ On target. Keep it steady." : "Keep practising and review every mistake."}</p>`; }).join("")}
      </div>` : ""}

      ${st.attempts.length ? `<div class="card"><h2>Recent tests</h2>${attemptsTable(st.attempts.slice(-5).reverse())}</div>` : ""}
    </div>`;
    if (!s.examDate) bindExamForm(() => route());
    bindTasks(main);
  };

  function attemptsTable(list) {
    return `<div class="table-wrap"><table class="tbl"><tr><th>Date</th><th>Test</th><th>Skill</th><th>Score</th><th>Band</th><th></th></tr>
      ${list.map((a) => `<tr><td>${fmtDate(a.date.slice(0, 10))}</td><td>${testLabel(a.book, a.test)}</td>
        <td><span class="skill-tag skill-${a.skill}">${SKILL[a.skill]}</span></td><td>${a.score}/40</td><td><b>${a.band}</b></td>
        <td>${D.books[a.book] ? `<a href="#/test/${a.skill}/${a.book}/${a.test}">Open</a>` : esc(a.source || "")}</td></tr>`).join("")}</table></div>`;
  }

  /* ---------- Study plan ---------- */
  pages.plan = () => {
    const s = Store.get().settings;
    const plan = buildPlan();
    const today = todayStr();
    main.innerHTML = `<div class="page stack">
      <h1>Study plan</h1>
      <div class="card">${examDateForm()}
        <p class="small muted" style="margin-top:10px">Each day mixes free official practice tests, writing, grammar, speaking and vocabulary. Tick each task when you finish it.</p></div>
      ${!plan ? `<div class="card empty">Set your exam date above to get a plan.</div>` : plan.past ? `<div class="card empty">Your exam date has passed. Set a new date if you're taking it again.</div>` : `
      <div class="card">
        <div class="row between"><h2>${plan.total} days · ${plan.intense ? "intensive plan (exam is soon: one Listening + one Reading test every day)" : "steady plan (alternating Listening and Reading days)"}</h2>
        <button class="btn sm" id="jumpToday">Jump to today</button></div>
        ${plan.days.map((d) => `<div class="day ${d.date === today ? "today" : ""}" ${d.date === today ? 'id="todayRow"' : ""}>
          <div><div class="date">${fmtDate(d.date)}</div><div class="small muted">${d.left === 0 ? "EXAM" : d.left + " days left"}</div></div>
          <div>${d.tasks.map(taskHtml).join("")}</div></div>`).join("")}
      </div>`}
    </div>`;
    bindExamForm(() => route());
    bindTasks(main);
    const j = $("#jumpToday");
    if (j) j.onclick = () => { const r = $("#todayRow"); if (r) r.scrollIntoView({ behavior: "smooth", block: "center" }); };
  };

  /* ---------- Listening / Reading pickers ---------- */
  function picker(skill) {
    const title = skill === "L" ? "Listening" : "Reading";
    main.innerHTML = `<div class="page stack skill-${skill}">
      <h1>${title} practice</h1>
      <div class="card">
        <p>${skill === "L"
          ? "The real test has 4 parts and 40 questions (about 30 minutes). Do a free official practice test, check your answers there, then log your score here."
          : "The real Academic test has 3 passages and 40 questions in 60 minutes. Do a free official practice test, check your answers there, then log your score here."}</p>
        <h2>Free official practice</h2>
        <ul>${'<li><a href="https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test" target="_blank" rel="noopener">IELTS.org sample test questions (Academic)</a></li><li><a href="https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-listening-practice-tests" target="_blank" rel="noopener">British Council free Listening practice</a></li><li><a href="https://ielts.idp.com/prepare/article-free-practice-tests" target="_blank" rel="noopener">IDP free practice tests</a></li>'}</ul>
        <p class="small muted">These sites are free and made by the organisations that run IELTS. This app does not include book tests.</p>
      </div>
      <div class="card">
        <h2>Log my score</h2>
        <div class="row">
          <label class="field" style="max-width:160px"><span>Correct answers (out of 40)</span><input type="number" id="logScore" min="0" max="40" inputmode="numeric"></label>
          <label class="field" style="max-width:260px"><span>Which test? (optional)</span><input type="text" id="logSource" maxlength="60" placeholder="e.g. British Council test 1"></label>
          <button class="btn primary" id="logSave" style="align-self:flex-end">Save score</button>
        </div>
        <p class="small muted" id="logBand">Your band appears on the dashboard and the Progress page.</p>
      </div>
      ${attemptsFor(skill).length ? `<div class="card"><h2>My ${title} scores</h2>${attemptsTable(attemptsFor(skill).slice().reverse())}</div>` : ""}
    </div>`;
    $("#logSave").onclick = () => {
      const n = Math.round(+$("#logScore").value);
      if (!$("#logScore").value || n < 0 || n > 40) return toast("Type a number from 0 to 40");
      const band = Grade.band(skill, n);
      Store.update((st) => st.attempts.push({ id: "free-" + Date.now(), skill, book: null, test: null, score: n, band, date: new Date().toISOString(), source: $("#logSource").value.trim() }));
      toast(`Saved: ${n}/40 = band ${band}`);
      picker(skill);
    };
  }
  pages.listening = () => picker("L");
  pages.reading = () => picker("R");

  /* ---------- Test workspace ---------- */
  pages.test = (skill, b, t) => {
    if (skill === "R" && pages.read) return pages.read(b, t); // text reader (reader.js)
    b = +b; t = +t;
    const book = D.books[b];
    const test = book && book.tests[t];
    if (!test || !test.keys[skill]) { main.innerHTML = `<div class="page"><div class="card empty">This test was not found.</div></div>`; return; }
    const keys = test.keys[skill];
    const pg = test.pages || {};
    const startPage = skill === "L" ? pg.L : pg.R;
    const draftKey = `${skill}-${b}-${t}`;
    const st = Store.get();
    const draft = st.drafts[draftKey] || { answers: Array(40).fill(""), elapsed: 0 };
    const limit = skill === "L" ? 40 * 60 : 60 * 60;
    const groups = skill === "L"
      ? [[1, 10, "Part 1", pg.L], [11, 20, "Part 2", pg.L2], [21, 30, "Part 3", pg.L3], [31, 40, "Part 4", pg.L4]]
      : [[1, 13, "Passage 1", pg.R], [14, 26, "Passage 2", pg.R2], [27, 40, "Passage 3", pg.R3]];
    let submitted = null;

    main.innerHTML = `<div class="page wide"><div class="workspace">
      <section class="ws-doc">
        <div class="doc-bar">
          <a class="btn sm" href="#/${skill === "L" ? "listening" : "reading"}">← All tests</a>
          ${groups.filter((g) => g[3]).map((g) => `<button class="btn sm" data-goto="${g[3]}">${g[2]}</button>`).join("")}
          <span class="spacer"></span>
          <input type="number" id="pageNo" min="1" style="width:76px" placeholder="page" title="Go to PDF page">
          <button class="btn sm" id="goPage">Go</button>
          <a class="btn sm" id="newTab" target="_blank" href="${pdfUrl(book.pdf, startPage)}">Open in new tab</a>
        </div>
        <iframe id="doc" title="Book"></iframe>
      </section>
      <aside class="ws-side">
        <div class="ws-head">
          <div class="row between">
            <div><div class="small muted">${SKILL[skill]}</div><strong>${testLabel(b, t)}</strong></div>
            <div style="text-align:right"><div class="timer" id="timer">${fmtTime(limit - draft.elapsed)}</div>
              <button class="btn sm" id="timerBtn">Start timer</button></div>
          </div>
          ${skill === "L" ? `<div class="audio-box" style="margin-top:10px">
            <div class="part-tabs">${[1, 2, 3, 4].map((p) => `<button class="btn sm" data-part="${p}">Part ${p}</button>`).join("")}</div>
            <audio id="audio" controls preload="none"></audio>
            <div class="row small" style="margin-top:6px">
              <label><input type="checkbox" id="autoNext" checked> Play next part automatically</label>
              <span class="spacer"></span>
              <label>Speed <select id="speed" style="width:auto;padding:2px 6px"><option>0.75</option><option selected>1</option><option>1.25</option></select></label>
            </div>
            <div class="small muted" id="audioNote"></div>
          </div>` : ""}
        </div>
        <div class="ws-body">
          <div id="result"></div>
          <form id="sheet" autocomplete="off" spellcheck="false">
            ${groups.map(([a, z, name, page]) => `<div class="qgroup"><h4>${name} · Questions ${a}–${z}${page ? ` · <a href="#" data-goto="${page}">show in book</a>` : ""}</h4>
              ${Array.from({ length: z - a + 1 }, (_, k) => a + k).map((n) => `<div class="q" id="q${n}"><span class="n">${n}</span>
                <input type="text" name="a${n}" value="${esc(draft.answers[n - 1])}" aria-label="Answer ${n}"><div class="fix"></div></div>`).join("")}
            </div>`).join("")}
          </form>
          <div class="row" style="margin-top:14px">
            <button class="btn primary" id="submitBtn">Submit &amp; check answers</button>
            <button class="btn" id="clearBtn">Clear</button>
          </div>
          <p class="small muted" style="margin-top:12px">Spelling counts. Capitals don't matter. For True/False/Not Given you can type T, F or NG.
          Letters like <span class="kbd">B</span> or roman numerals like <span class="kbd">iv</span> are fine.</p>
          ${book.explain ? `<p class="small"><a target="_blank" href="${fileUrl(book.explain)}">Detailed explanations for this book (Chinese, 剑桥雅思真题精讲)</a></p>` : ""}
        </div>
      </aside>
    </div></div>`;

    const iframe = $("#doc");
    function goto(page) {
      if (!page) return;
      iframe.src = "about:blank";
      setTimeout(() => (iframe.src = pdfUrl(book.pdf, page)), 30);
      $("#newTab").href = pdfUrl(book.pdf, page);
    }
    goto(startPage || 1);
    $$("[data-goto]").forEach((el) => el.addEventListener("click", (e) => { e.preventDefault(); goto(+el.dataset.goto); }));
    $("#goPage").onclick = () => goto(+$("#pageNo").value);
    $("#pageNo").onkeydown = (e) => { if (e.key === "Enter") goto(+e.target.value); };

    // --- answers + draft ---
    const inputs = $$("#sheet input");
    const answers = () => inputs.map((i) => i.value);
    let saveTimer;
    function saveDraft() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => Store.update((s) => (s.drafts[draftKey] = { answers: answers(), elapsed })), 400);
    }
    $("#sheet").addEventListener("input", saveDraft);
    $("#sheet").addEventListener("submit", (e) => e.preventDefault());
    inputs.forEach((inp, i) => inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && inputs[i + 1]) inputs[i + 1].focus(); }));

    // --- timer ---
    let elapsed = draft.elapsed || 0, ticking = null;
    const timerEl = $("#timer");
    function renderTimer() {
      const rem = limit - elapsed;
      timerEl.textContent = rem >= 0 ? fmtTime(rem) : "+" + fmtTime(-rem);
      timerEl.classList.toggle("low", rem < 5 * 60);
    }
    function startTimer() {
      if (ticking) return;
      ticking = setInterval(() => { elapsed++; renderTimer(); if (elapsed % 15 === 0) saveDraft(); if (elapsed === limit) toast("Time is up! Finish your answers and submit."); }, 1000);
      $("#timerBtn").textContent = "Pause";
    }
    function stopTimer() { clearInterval(ticking); ticking = null; $("#timerBtn").textContent = "Resume"; }
    $("#timerBtn").onclick = () => (ticking ? stopTimer() : startTimer());
    renderTimer();

    // --- audio ---
    let audio = null;
    if (skill === "L") {
      audio = $("#audio");
      let part = 1;
      const setPart = (p, play) => {
        part = p;
        $$("[data-part]").forEach((x) => x.classList.toggle("active", +x.dataset.part === p));
        const src = test.audio[p - 1];
        $("#audioNote").textContent = src ? "" : "Audio file for this part was not found in your audio folder.";
        if (src) { audio.src = fileUrl(src); audio.playbackRate = +$("#speed").value; if (play) audio.play().catch(() => {}); }
        const g = groups[p - 1];
        if (g && g[3] && play) goto(g[3]);
      };
      $$("[data-part]").forEach((x) => (x.onclick = () => setPart(+x.dataset.part, true)));
      audio.addEventListener("play", () => startTimer());
      audio.addEventListener("ended", () => { if ($("#autoNext").checked && part < 4) setPart(part + 1, true); });
      $("#speed").onchange = () => (audio.playbackRate = +$("#speed").value);
      setPart(1, false);
    }

    // --- marking ---
    function showResult(res, score, band, attempt) {
      res.results.forEach((r, i) => {
        const row = $("#q" + (i + 1));
        row.classList.toggle("right", r.ok);
        row.classList.toggle("wrong", !r.ok);
        $(".fix", row).textContent = r.ok ? "✓ " + r.shown : "✗ Answer: " + r.shown;
      });
      const target = +Store.get().settings.targetBand || 6.5;
      const parts = groups.map(([a, z, name]) => `${name}: ${res.results.slice(a - 1, z).filter((r) => r.ok).length}/${z - a + 1}`).join(" · ");
      $("#result").innerHTML = `<div class="card" style="margin-bottom:14px">
        <div class="row"><div class="band-big">${band}</div><div><b>${score}/40 correct</b><div class="small muted">${parts}</div>
        <div class="small muted">Time: ${fmtTime(attempt.seconds)}</div></div></div>
        <p class="small" style="margin-top:10px">${score >= Grade.needed(skill, target) ? `🎉 That's at or above your target of ${target}.` : `For band ${target} you need about ${Grade.needed(skill, target)}/40.`}
        ${40 - score ? `${40 - score} mistakes were added to your <a href="#/mistakes">mistake notebook</a>.` : ""}</p>
        <div class="row">
          ${pg.AS ? `<button class="btn sm" data-goto2="${pg.AS}">${skill === "L" ? "Read the audioscript" : ""}</button>` : ""}
          ${pg.KEY ? `<button class="btn sm" data-goto2="${pg.KEY}">Answer key page</button>` : ""}
          <button class="btn sm" id="retry">Try again</button>
        </div>
        ${skill === "L" ? `<p class="small muted" style="margin-top:8px">Now replay each part while reading the audioscript. Find where each missed answer was said.</p>` : `<p class="small muted" style="margin-top:8px">For each mistake, find the sentence in the passage that gives the answer. Write in your notebook why you missed it.</p>`}
      </div>`;
      $$("[data-goto2]").forEach((el) => { if (!el.textContent) el.remove(); else el.onclick = () => goto(+el.dataset.goto2); });
      $("#retry").onclick = () => {
        Store.update((s) => delete s.drafts[draftKey]);
        route();
      };
      $("#result").scrollIntoView({ behavior: "smooth" });
    }

    $("#submitBtn").onclick = () => {
      const ans = answers();
      const empty = ans.filter((a) => !a.trim()).length;
      if (empty && !confirm(`${empty} answers are empty. In the real exam, always guess. Submit anyway?`)) return;
      clearTimeout(saveTimer); // a pending autosave must not bring the draft back
      stopTimer();
      if (audio) audio.pause();
      const res = Grade.gradeSection(keys, ans);
      const band = Grade.band(skill, res.score);
      const attempt = { id: Store.uid(), skill, book: b, test: t, date: new Date().toISOString(), answers: ans, score: res.score, band, seconds: elapsed };
      Store.update((s) => {
        s.attempts.push(attempt);
        delete s.drafts[draftKey];
        res.results.forEach((r, i) => {
          if (r.ok) return;
          s.mistakes.push({ id: Store.uid(), skill, book: b, test: t, q: i + 1, yours: ans[i], correct: r.shown, date: attempt.date, note: "" });
        });
      });
      submitted = attempt;
      inputs.forEach((i) => (i.readOnly = true));
      $("#submitBtn").disabled = true;
      showResult(res, res.score, band, attempt);
    };
    // Coming back to a finished test: offer to review the last attempt.
    const past = attemptsFor(skill, b, t);
    if (past.length && !st.drafts[draftKey]) {
      const last = past[past.length - 1];
      const best = bestFor(skill, b, t);
      $("#result").innerHTML = `<div class="notice info" style="margin-bottom:12px">You have done this test ${past.length}× · best ${best.score}/40 (band ${best.band}).
        <div class="row" style="margin-top:8px"><button class="btn sm" id="reviewLast">Review last attempt (${last.score}/40)</button></div></div>`;
      $("#reviewLast").onclick = () => {
        inputs.forEach((inp, i) => { inp.value = last.answers[i] || ""; inp.readOnly = true; });
        submitted = last;
        $("#submitBtn").disabled = true;
        showResult(Grade.gradeSection(keys, last.answers), last.score, last.band, last);
      };
    }

    $("#clearBtn").onclick = () => {
      if (!confirm("Clear all answers and the timer?")) return;
      Store.update((s) => delete s.drafts[draftKey]);
      route();
    };

    cleanup = () => {
      stopTimer();
      if (audio) { audio.pause(); audio.src = ""; }
      clearTimeout(saveTimer);
      const a = answers();
      Store.update((s) => {
        if (!submitted && (a.some((x) => x.trim()) || elapsed > 0)) s.drafts[draftKey] = { answers: a, elapsed };
        else delete s.drafts[draftKey];
      });
    };
  };

  /* ---------- Writing ---------- */
  function writingPage(b, t, task) {
    const pg = D.books[b].tests[t].pages || {};
    return task === 1 ? pg.W : pg.W2 || (pg.W ? pg.W + 1 : null);
  }

  pages.writing = () => {
    const st = Store.get();
    main.innerHTML = `<div class="page stack skill-W">
      <h1>Writing</h1>
      <div class="card">
        <p><b>Task 1</b> (20 min, 150+ words): describe a chart, table, map or process. <b>Task 2</b> (40 min, 250+ words): essay. Task 2 is worth twice as much.</p>
        <p class="small muted">Type a question (from a free official practice test, or one from <a href="#/writetypes">Writing task types</a>), then write with a timer and word count. After writing, check yourself with the checklist. Read the <a href="#/guide/writing1">Task 1</a> and <a href="#/guide/writing2">Task 2</a> guides first.</p>
        <div class="row"><a class="btn" href="#/write/1/free">Write a Task 1</a> <a class="btn" href="#/write/2/free">Write a Task 2</a></div>
      </div>
      ${st.essays.length ? `<div class="card"><h2>My essays (${st.essays.length})</h2><div class="table-wrap"><table class="tbl">
        <tr><th>Date</th><th>Task</th><th>Question</th><th>Words</th><th>Self-check</th><th></th></tr>
        ${st.essays.slice().reverse().map((e) => `<tr><td>${fmtDate(e.date.slice(0, 10))}</td><td>Task ${e.task}</td>
          <td>${e.book ? testLabel(e.book, e.test) : esc((e.prompt || "Own question").slice(0, 60))}</td><td>${e.words}</td>
          <td>${e.check ? `${Object.values(e.check).filter(Boolean).length}/${C.writingChecklist[e.task].length}` : "–"}${e.selfBand ? ` · band ${e.selfBand}` : ""}</td>
          <td><a href="#/essay/${e.id}">Open</a></td></tr>`).join("")}</table></div></div>` : ""}
    </div>`;
  };

  function writingEditor({ task, b, t, essay }) {
    const free = !b;
    const book = b ? D.books[b] : null;
    const page = b ? writingPage(b, t, task) : null;
    const draftKey = essay ? `essay-${essay.id}` : `W-${task}-${b || "free"}-${t || ""}`;
    const st = Store.get();
    const draft = essay ? { text: essay.text, prompt: essay.prompt, elapsed: essay.seconds || 0 } : st.drafts[draftKey] || { text: "", prompt: "", elapsed: 0 };
    const limit = task === 1 ? 20 * 60 : 40 * 60;
    const minWords = task === 1 ? 150 : 250;
    let elapsed = draft.elapsed || 0, ticking = null;
    let finished = false; // set once a new essay is saved, so leaving the page doesn't re-create the draft

    const side = `<aside class="ws-side" style="flex-basis:${free ? "100%" : "520px"}">
      <div class="ws-head"><div class="row between">
        <div><div class="small muted">Writing Task ${task}</div><strong>${b ? testLabel(b, t) : "My own question"}</strong></div>
        <div style="text-align:right"><div class="timer" id="timer"></div><button class="btn sm" id="timerBtn">Start timer</button></div>
      </div></div>
      <div class="ws-body">
        ${free ? `<label class="field"><span>The question</span><textarea id="prompt" rows="3" placeholder="Paste or type the essay question here">${esc(draft.prompt)}</textarea></label>
          <div class="row small" style="margin:6px 0 10px">Task: <a href="#/write/1/free" class="${task === 1 ? "pill accent" : ""}">Task 1</a> <a href="#/write/2/free" class="${task === 2 ? "pill accent" : ""}">Task 2</a></div>` : ""}
        <textarea class="writing-area" id="essay" spellcheck="false" placeholder="Start writing here... (spell-check is off, like the real exam)">${esc(draft.text)}</textarea>
        <div class="row between small" style="margin:6px 0 12px"><span id="wc"></span><span class="muted">Autosaved</span></div>
        <div class="row"><button class="btn primary" id="saveEssay">${essay ? "Save changes" : "Finish & save"}</button>
          ${book && book.samples ? `<button class="btn" id="samplesBtn">Sample answers in the book</button>` : ""}
          ${essay ? `<button class="btn danger" id="delEssay">Delete</button>` : ""}</div>
        <div class="card" style="margin-top:16px">
          <h3>Self-check before you finish</h3>
          <div class="checklist" id="checklist">${C.writingChecklist[task].map((c, i) => `<label><input type="checkbox" data-i="${i}" ${essay && essay.check && essay.check[i] ? "checked" : ""}> ${esc(c)}</label>`).join("")}</div>
          <label class="field" style="max-width:220px;margin-top:10px"><span>My own band guess</span>
            <select id="selfBand"><option value="">–</option>${[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8].map((x) => `<option ${essay && +essay.selfBand === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
          <p class="small muted">Tip: read the examiner comments next to the sample answers in your book. They show what each band looks like.</p>
        </div>
      </div>
    </aside>`;

    main.innerHTML = `<div class="page wide"><div class="workspace">
      ${free ? "" : `<section class="ws-doc"><div class="doc-bar"><a class="btn sm" href="#/writing">← Writing</a>
        <button class="btn sm" data-goto="${page}">The question</button><span class="spacer"></span>
        <a class="btn sm" id="newTab" target="_blank" href="${pdfUrl(book.pdf, page)}">Open in new tab</a></div><iframe id="doc" title="Book"></iframe></section>`}
      ${side}</div></div>`;

    const ta = $("#essay");
    const promptEl = $("#prompt"); // only on "my own question"
    const goto = (p) => { const f = $("#doc"); if (!f || !p) return; f.src = "about:blank"; setTimeout(() => (f.src = pdfUrl(book.pdf, p)), 30); $("#newTab").href = pdfUrl(book.pdf, p); };
    if (!free) {
      goto(page);
      $$("[data-goto]").forEach((el) => (el.onclick = () => goto(+el.dataset.goto)));
      if ($("#samplesBtn")) $("#samplesBtn").onclick = () => goto(book.samples);
    }
    const timerEl = $("#timer");
    const renderTimer = () => { const r = limit - elapsed; timerEl.textContent = r >= 0 ? fmtTime(r) : "+" + fmtTime(-r); timerEl.classList.toggle("low", r < 3 * 60); };
    const renderWc = () => { const n = wordCount(ta.value); $("#wc").innerHTML = `<b>${n}</b> words ${n < minWords ? `<span class="pill warn">need ${minWords - n} more</span>` : `<span class="pill good">✓ ${minWords}+</span>`}`; };
    let saveT;
    const saveDraft = () => { if (essay) return; clearTimeout(saveT); saveT = setTimeout(() => Store.update((s) => (s.drafts[draftKey] = { text: ta.value, prompt: promptEl ? promptEl.value : "", elapsed })), 400); };
    function startTimer() { if (ticking) return; ticking = setInterval(() => { elapsed++; renderTimer(); if (elapsed % 15 === 0) saveDraft(); if (elapsed === limit) toast("Time is up for this task!"); }, 1000); $("#timerBtn").textContent = "Pause"; }
    function stopTimer() { clearInterval(ticking); ticking = null; $("#timerBtn").textContent = "Resume"; }
    $("#timerBtn").onclick = () => (ticking ? stopTimer() : startTimer());
    ta.addEventListener("input", () => { renderWc(); saveDraft(); startTimer(); });
    if (promptEl) promptEl.addEventListener("input", saveDraft);
    renderTimer(); renderWc();

    $("#saveEssay").onclick = () => {
      const text = ta.value.trim();
      if (!text) return toast("Write something first");
      const check = {}; $$("#checklist input").forEach((c) => (check[c.dataset.i] = c.checked));
      const data = { task, book: b || null, test: t || null, prompt: promptEl ? promptEl.value : "", text, words: wordCount(text), seconds: elapsed, check, selfBand: $("#selfBand").value };
      Store.update((s) => {
        if (essay) Object.assign(s.essays.find((e) => e.id === essay.id), data);
        else { s.essays.push({ id: Store.uid(), date: new Date().toISOString(), ...data }); delete s.drafts[draftKey]; }
      });
      finished = !essay;
      clearTimeout(saveT);
      stopTimer();
      toast("Essay saved");
      if (!essay) location.hash = "#/writing";
    };
    if ($("#delEssay")) $("#delEssay").onclick = () => { if (confirm("Delete this essay?")) { Store.update((s) => (s.essays = s.essays.filter((e) => e.id !== essay.id))); location.hash = "#/writing"; } };
    cleanup = () => {
      stopTimer();
      clearTimeout(saveT);
      if (essay || finished) return;
      const has = ta.value.trim() || (promptEl && promptEl.value.trim());
      Store.update((s) => { if (has) s.drafts[draftKey] = { text: ta.value, prompt: promptEl ? promptEl.value : "", elapsed }; else delete s.drafts[draftKey]; });
    };
  }
  pages.write = (task, b, t) => writingEditor({ task: +task, b: b === "free" ? null : +b, t: t ? +t : null });
  pages.essay = (id) => {
    const e = Store.get().essays.find((x) => x.id === id);
    if (!e) { main.innerHTML = `<div class="page"><div class="card empty">Essay not found.</div></div>`; return; }
    writingEditor({ task: e.task, b: e.book, t: e.test, essay: e });
  };

  /* ---------- Speaking ---------- */
  pages.speaking = () => {
    const sp = C.speaking;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    let p1 = pick(sp.part1), p2 = pick(sp.part2);
    const recordings = [];
    let rec = null, stream = null, recStart = 0, countdown = null;
    const mins = Store.get().speaking.reduce((a, s) => a + s.minutes, 0);

    main.innerHTML = `<div class="page stack skill-S">
      <h1>Speaking</h1>
      <div class="card"><p>Practise out loud. Record yourself, listen back, and notice pauses, repeated words and grammar slips. You have practised <b>${Math.round(mins)} minutes</b> so far.</p>
        <p class="small muted">Recordings stay on this page only. Use "Download" to keep one. The browser will ask for microphone permission the first time.</p></div>

      <div class="card">
        <div class="row between"><h2>Part 1: ${esc(p1.topic)}</h2><button class="btn sm" id="newP1">New topic</button></div>
        <ol id="p1qs">${p1.qs.map((q) => `<li>${esc(q)}</li>`).join("")}</ol>
        <p class="small muted">Answer each in 2–3 sentences: answer → reason → example.</p>
      </div>

      <div class="card">
        <div class="row between"><h2>Part 2: topic card</h2><button class="btn sm" id="newP2">New card</button></div>
        <div id="card2"></div>
        <div class="row" style="margin-top:12px">
          <button class="btn primary" id="p2start">Start: 1 min prepare → 2 min talk</button>
          <div class="timer" id="p2timer"></div><span id="p2state" class="muted"></span>
        </div>
        <textarea id="notes" rows="3" placeholder="Your notes (key words only)" style="margin-top:10px"></textarea>
      </div>

      <div class="card">
        <h2>Recorder</h2>
        <div class="row"><button class="btn" id="recBtn">● Start recording</button><span id="recState" class="muted small"></span></div>
        <div id="recList" style="margin-top:10px"></div>
      </div>

    </div>`;

    function renderCard() {
      $("#card2").innerHTML = `<div class="card" style="background:var(--surface-2)"><b>${esc(p2.card)}</b><p class="small" style="margin:6px 0 4px">You should say:</p>
        <ul>${p2.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <details style="margin-top:8px"><summary>Part 3 follow-up questions</summary><ol>${p2.part3.map((q) => `<li>${esc(q)}</li>`).join("")}</ol></details>`;
    }
    renderCard();
    $("#newP1").onclick = () => { p1 = pick(sp.part1); $("h2", $("#newP1").closest(".card")).textContent = "Part 1: " + p1.topic; $("#p1qs").innerHTML = p1.qs.map((q) => `<li>${esc(q)}</li>`).join(""); };
    $("#newP2").onclick = () => { p2 = pick(sp.part2); renderCard(); };

    function runCountdown(sec, label, done) {
      clearInterval(countdown);
      let left = sec;
      $("#p2state").textContent = label;
      $("#p2timer").textContent = fmtTime(left);
      countdown = setInterval(() => { left--; $("#p2timer").textContent = fmtTime(left); if (left <= 0) { clearInterval(countdown); done(); } }, 1000);
    }
    $("#p2start").onclick = () => {
      $("#notes").focus();
      runCountdown(60, "Prepare: write key words", () => {
        startRec();
        runCountdown(120, "Speak now (recording)", () => { stopRec(); $("#p2state").textContent = "Finished! Listen to your recording below."; });
      });
    };

    async function startRec() {
      if (rec) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        $("#recState").textContent = "Microphone not available. Open the site with start-website.bat and allow the microphone.";
        return;
      }
      const chunks = [];
      rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        const secs = (Date.now() - recStart) / 1000;
        recordings.unshift({ url: URL.createObjectURL(blob), secs, when: new Date().toLocaleTimeString() });
        Store.update((s) => s.speaking.push({ date: new Date().toISOString(), minutes: secs / 60 }));
        stream.getTracks().forEach((t) => t.stop());
        rec = null;
        renderRecs();
      };
      recStart = Date.now();
      rec.start();
      $("#recBtn").textContent = "■ Stop recording";
      $("#recState").innerHTML = `<span class="rec-dot"></span> Recording...`;
    }
    function stopRec() { if (rec) rec.stop(); $("#recBtn").textContent = "● Start recording"; $("#recState").textContent = ""; }
    $("#recBtn").onclick = () => (rec ? stopRec() : startRec());
    function renderRecs() {
      $("#recList").innerHTML = recordings.map((r, i) => `<div class="row" style="margin-bottom:6px"><span class="small muted">${r.when} · ${fmtTime(r.secs)}</span>
        <audio controls src="${r.url}" style="height:34px;flex:1;min-width:200px"></audio><a class="btn sm" download="speaking-${i + 1}.webm" href="${r.url}">Download</a></div>`).join("");
    }
    cleanup = () => { clearInterval(countdown); if (rec) rec.stop(); };
  };

  /* ---------- Mistake notebook ---------- */
  pages.mistakes = (filter = "all") => {
    const st = Store.get();
    const list = st.mistakes.filter((m) => filter === "all" || m.skill === filter).slice().reverse();
    main.innerHTML = `<div class="page stack">
      <h1>Mistake notebook</h1>
      <div class="card"><p>Every wrong answer lands here. For each one: open the book page, find why the right answer is right, and write a short note (<i>"distractor: speaker changed his mind"</i>, <i>"spelling: accommodation"</i>, <i>"NOT GIVEN vs FALSE"</i>). Remove it when you understand it.</p>
        <div class="row">${["all", "L", "R"].map((f) => `<a class="btn sm ${filter === f ? "primary" : ""}" href="#/mistakes/${f}">${f === "all" ? "All" : SKILL[f]} (${f === "all" ? st.mistakes.length : st.mistakes.filter((m) => m.skill === f).length})</a>`).join("")}
        ${list.length ? `<span class="spacer"></span><button class="btn sm danger" id="clearM">Remove all shown</button>` : ""}</div></div>
      ${list.length ? list.map((m) => `<div class="card skill-${m.skill} skill-bar" data-id="${m.id}">
        <div class="row between"><div><span class="skill-tag">${SKILL[m.skill]}</span> · ${testLabel(m.book, m.test)} · <b>Question ${m.q}</b></div>
          <div class="row"><a class="btn sm" href="#/test/${m.skill}/${m.book}/${m.test}">Open test</a><button class="btn sm" data-del="${m.id}">✓ Understood, remove</button></div></div>
        <p style="margin:8px 0">Your answer: <span class="pill bad">${esc(m.yours) || "(empty)"}</span> &nbsp; Correct: <span class="pill good">${esc(m.correct)}</span></p>
        <input type="text" data-note="${m.id}" value="${esc(m.note)}" placeholder="Why did I miss it? (note to myself)">
      </div>`).join("") : `<div class="card empty">No mistakes here yet. Do a <a href="#/listening">Listening</a> or <a href="#/reading">Reading</a> test.</div>`}
    </div>`;
    $$("[data-del]").forEach((b) => (b.onclick = () => { Store.update((s) => (s.mistakes = s.mistakes.filter((m) => m.id !== b.dataset.del))); b.closest(".card").remove(); }));
    $$("[data-note]").forEach((i) => i.addEventListener("change", () => Store.update((s) => (s.mistakes.find((m) => m.id === i.dataset.note).note = i.value))));
    const c = $("#clearM");
    if (c) c.onclick = () => { if (confirm(`Remove ${list.length} mistakes?`)) { const ids = new Set(list.map((m) => m.id)); Store.update((s) => (s.mistakes = s.mistakes.filter((m) => !ids.has(m.id)))); route(); } };
  };

  /* ---------- Vocabulary ---------- */
  const BOX_DAYS = [0, 1, 2, 4, 7, 15, 30];
  pages.vocab = () => {
    const today = todayStr();
    let query = "";
    main.innerHTML = `<div class="page stack skill-V">
      <h1>Vocabulary</h1>
      <div class="grid c2">
        <div class="card"><h2>Add a word</h2>
          <div class="stack" style="--gap:8px">
            <label class="field"><span>Word or phrase</span><input type="text" id="vw" placeholder="e.g. alleviate"></label>
            <label class="field"><span>Meaning (Khmer or English)</span><input type="text" id="vm" placeholder="ការកាត់បន្ថយ / to make less bad"></label>
            <label class="field"><span>Example sentence (optional)</span><input type="text" id="ve"></label>
            <button class="btn primary" id="addW">Add word</button>
          </div></div>
        <div class="card"><h2>Flashcards</h2><div id="flashArea"></div></div>
      </div>
      <div class="card"><div class="row between"><h2>My words (<span id="vcount"></span>)</h2>
        <input type="text" id="vsearch" placeholder="Search..." style="max-width:220px"></div>
        <div id="vlist"></div></div>
    </div>`;

    function due() { return Store.get().vocab.filter((v) => !v.due || v.due <= today); }
    function renderFlash() {
      const d = due();
      const area = $("#flashArea");
      if (!Store.get().vocab.length) {
        area.innerHTML = `<p class="muted">No words yet. Add your own, or start with ${C.starterVocab.length} common IELTS words (you can add Khmer meanings later).</p><button class="btn" id="starter">Add starter words</button>`;
        $("#starter").onclick = () => { Store.update((s) => C.starterVocab.forEach(([w, m, e]) => s.vocab.push({ id: Store.uid(), word: w, meaning: m, example: e, box: 0, due: today, added: today }))); renderAll(); };
        return;
      }
      if (!d.length) { area.innerHTML = `<p class="empty">🎉 All done for today. Come back tomorrow, or add new words.</p>`; return; }
      const v = d[Math.floor(Math.random() * d.length)];
      area.innerHTML = `<p class="small muted">${d.length} cards due today · tap the card to see the meaning</p>
        <div class="flash" id="card"><div><div class="w">${esc(v.word)}</div><div class="m hidden" id="back">${esc(v.meaning)}${v.example ? `<div class="small muted" style="margin-top:8px"><i>${esc(v.example)}</i></div>` : ""}</div></div></div>
        <div class="row" style="margin-top:10px;justify-content:center"><button class="btn" id="no">✗ Not yet</button><button class="btn primary" id="yes">✓ I knew it</button></div>`;
      $("#card").onclick = () => $("#back").classList.toggle("hidden");
      const move = (ok) => {
        Store.update((s) => { const w = s.vocab.find((x) => x.id === v.id); w.box = ok ? Math.min((w.box || 0) + 1, BOX_DAYS.length - 1) : 0; w.due = addDays(today, ok ? BOX_DAYS[w.box] : 0); });
        if (!ok) toast("It will come back again today");
        renderAll();
      };
      $("#yes").onclick = () => move(true);
      $("#no").onclick = () => move(false);
    }
    function renderList() {
      const all = Store.get().vocab;
      const list = all.filter((v) => !query || (v.word + " " + v.meaning).toLowerCase().includes(query)).slice().reverse();
      $("#vcount").textContent = all.length;
      $("#vlist").innerHTML = list.length ? `<div class="table-wrap"><table class="tbl"><tr><th>Word</th><th>Meaning</th><th>Example</th><th>Level</th><th></th></tr>
        ${list.map((v) => `<tr><td><b>${esc(v.word)}</b></td><td><input type="text" data-m="${v.id}" value="${esc(v.meaning)}"></td><td class="small">${esc(v.example)}</td>
          <td><span class="pill ${v.box >= 4 ? "good" : ""}">${v.box || 0}/6</span></td><td><button class="btn sm" data-dv="${v.id}">✕</button></td></tr>`).join("")}</table></div>` : `<p class="empty">No words.</p>`;
      $$("[data-m]").forEach((i) => i.addEventListener("change", () => Store.update((s) => (s.vocab.find((x) => x.id === i.dataset.m).meaning = i.value))));
      $$("[data-dv]").forEach((b) => (b.onclick = () => { Store.update((s) => (s.vocab = s.vocab.filter((x) => x.id !== b.dataset.dv))); renderAll(); }));
    }
    function renderAll() { renderFlash(); renderList(); }
    $("#addW").onclick = () => {
      const w = $("#vw").value.trim();
      if (!w) return toast("Type a word first");
      Store.update((s) => s.vocab.push({ id: Store.uid(), word: w, meaning: $("#vm").value.trim(), example: $("#ve").value.trim(), box: 0, due: today, added: today }));
      ["#vw", "#vm", "#ve"].forEach((x) => ($(x).value = ""));
      $("#vw").focus();
      renderAll();
    };
    $("#vsearch").oninput = (e) => { query = e.target.value.toLowerCase(); renderList(); };
    renderAll();
  };

  /* ---------- Progress ---------- */
  function chart(points, color) {
    if (points.length < 2) return `<p class="small muted">Do at least 2 tests to see a chart.</p>`;
    const W = 600, H = 180, pad = 28;
    const xs = points.map((_, i) => pad + (i * (W - pad * 2)) / (points.length - 1));
    const y = (b) => H - pad - ((b - 3) / 6) * (H - pad * 2);
    const path = points.map((p, i) => `${i ? "L" : "M"}${xs[i].toFixed(1)},${y(p).toFixed(1)}`).join(" ");
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Band history">
      ${[4, 5, 6, 7, 8, 9].map((b) => `<line x1="${pad}" x2="${W - pad}" y1="${y(b)}" y2="${y(b)}" stroke="var(--border)"/><text x="4" y="${y(b) + 4}" font-size="11" fill="var(--muted)">${b}</text>`).join("")}
      <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5"/>
      ${points.map((p, i) => `<circle cx="${xs[i]}" cy="${y(p)}" r="4" fill="${color}"><title>${p}</title></circle>`).join("")}</svg>`;
  }
  pages.progress = () => {
    const st = Store.get();
    const L = attemptsFor("L"), R = attemptsFor("R");
    const mins = st.speaking.reduce((a, s) => a + s.minutes, 0);
    main.innerHTML = `<div class="page stack">
      <h1>Progress</h1>
      <div class="grid c4">
        <div class="card stat"><div class="num" style="color:var(--listen)">${L.length}</div><div class="lbl">Listening tests</div></div>
        <div class="card stat"><div class="num" style="color:var(--read)">${R.length}</div><div class="lbl">Reading tests</div></div>
        <div class="card stat"><div class="num" style="color:var(--write)">${st.essays.length}</div><div class="lbl">Essays written</div></div>
        <div class="card stat"><div class="num" style="color:var(--speak)">${Math.round(mins)}</div><div class="lbl">Speaking minutes recorded</div></div>
      </div>
      <div class="grid c2">
        <div class="card"><h2 class="skill-tag skill-L">Listening bands</h2>${chart(L.map((a) => a.band), "var(--listen)")}</div>
        <div class="card"><h2 class="skill-tag skill-R">Reading bands</h2>${chart(R.map((a) => a.band), "var(--read)")}</div>
      </div>
      <div class="card"><h2>All tests</h2>${st.attempts.length ? attemptsTable(st.attempts.slice().reverse()) : `<p class="empty">No tests yet.</p>`}</div>
    </div>`;
  };

  /* ---------- Guide ---------- */
  pages.guide = (section) => {
    main.innerHTML = `<div class="page stack guide">
      <h1>Exam guide &amp; tips</h1>
      <div class="card toc">${C.guide.map((g) => `<a href="#/guide/${g.id}">${esc(g.title)}</a>`).join("")}</div>
      ${C.guide.map((g) => `<div class="card" id="g-${g.id}"><h2 style="margin-top:0">${esc(g.title)}</h2>${g.html}</div>`).join("")}
    </div>`;
    const links = $("#sampleTaskLinks");
    if (links && D.sampleTasks) {
      const pdf = D.sampleTasks.pdf;
      links.innerHTML = `<div class="table-wrap"><table class="tbl"><tr><th>Question type</th><th>Sample</th><th>Answers</th></tr>
        ${D.sampleTasks.types.map((x) => `<tr><td>${esc(x.name)}</td><td><a target="_blank" href="${pdfUrl(pdf, x.page)}">Open (p.${x.page})</a></td><td>${x.answers ? `<a target="_blank" href="${pdfUrl(pdf, x.answers)}">Answers</a>` : ""}</td></tr>`).join("")}</table></div>`;
    }
    if (section) { const el = $("#g-" + section); if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 50); }
  };

  /* ---------- Library ---------- */
  pages.library = () => { location.hash = "#/"; };

  /* ---------- Settings ---------- */
  pages.settings = () => {
    const st = Store.get();
    main.innerHTML = `<div class="page stack">
      <h1>Settings &amp; backup</h1>
      <div class="card"><h2>Exam</h2>${examDateForm()}
        <div class="row" style="margin-top:12px"><button class="btn sm" id="restartPlan">Restart plan from today</button>
        <span class="small muted">Plan started: ${st.settings.planStart ? fmtDate(st.settings.planStart) : "–"}</span></div></div>
      <div class="card"><h2>Backup</h2>
        <p class="small">Your progress and word pictures are saved in <b>this browser only</b>. Download a backup now and then. You can load it on another computer or browser.</p>
        <div class="row"><button class="btn" id="exp">Download backup</button>
          <label class="btn">Load backup<input type="file" id="imp" accept=".json,application/json" hidden></label></div></div>
      <div class="card" id="syncCard"></div>
      <div class="card" id="aiCard"></div>
      <div class="card"><h2>Danger zone</h2><button class="btn danger" id="resetAll">Delete all my progress</button></div>
    </div>`;
    bindExamForm(() => route());
    $("#restartPlan").onclick = () => { Store.update((s) => (s.settings.planStart = todayStr())); toast("Plan restarted from today"); route(); };
    $("#exp").onclick = async () => {
      // progress + word pictures in one file
      const data = JSON.parse(Store.exportJSON());
      if (window.Pics) data.pictures = await Pics.exportAll();
      download(`ielts-backup-${todayStr()}.json`, JSON.stringify(data));
    };
    $("#imp").onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      f.text().then(async (txt) => {
        try {
          const data = JSON.parse(txt);
          const pics = data.pictures;
          delete data.pictures;
          Store.importJSON(JSON.stringify(data));
          if (pics && window.Pics) await Pics.importAll(pics);
          applyTheme(); toast("Backup loaded"); route();
        } catch (err) { alert(err.message); }
      });
    };
    if (window.Sync) syncSettings($("#syncCard"));
    if (window.AI) aiSettings($("#aiCard"));
    $("#resetAll").onclick = () => { if (confirm("Delete ALL tests, essays, words and settings? This cannot be undone.") && confirm("Are you sure?")) { Store.reset(); applyTheme(); route(); } };
  };

  // Settings -> laptop & phone sync (sync.js + tools/serve.py)
  function syncSettings(box) {
    const draw = () => {
      const st = Sync.status;
      box.innerHTML = `<h2>📱 Laptop &amp; phone sync</h2>
        <p class="small">Your progress (words, highlights, notes, tests, pictures) is shared through your laptop. Works while <b>start-website.bat</b> is running on the laptop.</p>
        <div class="row"><span class="pill ${st.online ? "good" : ""}">${st.online ? "Connected" : "Not connected"}</span>
          <span class="small muted">${esc(st.msg)}${st.last ? " · " + new Date(st.last).toLocaleTimeString() : ""}</span>
          <button class="btn sm" id="syncNow">↻ Sync now</button></div>`;
      $("#syncNow").onclick = async () => { $("#syncNow").disabled = true; await Sync.now(); draw(); };
    };
    draw();
    const redraw = () => (document.body.contains(box) ? draw() : window.removeEventListener("syncstatus", redraw));
    window.addEventListener("syncstatus", redraw);
  }

  // Settings -> AI helper (ai.js): Gemini with a free key, Ollama on this laptop, or copy & paste
  function aiSettings(box) {
    const c = AI.get();
    const fileFix = `[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")`;
    box.innerHTML = `<h2>🤖 AI helper</h2>
      <p class="small">Used by the <b>Ask AI</b> buttons (passage vocabulary, explanations of wrong answers). It answers inside the app.</p>
      <div class="stack" style="gap:8px">
        <label class="row"><input type="radio" name="aiP" value="gemini" ${c.provider === "gemini" ? "checked" : ""}> <span><b>Google Gemini</b> (recommended): best answers and Khmer. Free key, needs internet.</span></label>
        <label class="row"><input type="radio" name="aiP" value="ollama" ${c.provider === "ollama" ? "checked" : ""}> <span><b>Ollama</b> on this laptop: free, private, works offline. Simpler answers, weak Khmer.</span></label>
        <label class="row"><input type="radio" name="aiP" value="copy" ${c.provider === "copy" ? "checked" : ""}> <span><b>Copy &amp; paste</b>: copy the question and paste it into any AI website yourself.</span></label>
      </div>
      <div id="aiG" class="${c.provider === "gemini" ? "" : "hidden"}" style="margin-top:12px">
        <ol class="small" style="margin:0 0 8px;padding-left:1.3em;line-height:1.8">
          <li>Open <a href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com/apikey</a> and sign in with your Google account.</li>
          <li>Press <b>Create API key</b> and copy it.</li>
          <li>Paste it here. It is saved <b>only in this browser</b> and is <b>not</b> put in your backup file. Don't share it with anyone.</li></ol>
        <div class="row"><input type="password" id="aiKey" value="${esc(c.geminiKey)}" placeholder="Paste your Gemini API key" autocomplete="off" style="flex:1;min-width:220px">
          <button class="btn sm" id="aiKeyShow">Show</button></div>
        <p class="small muted" style="margin:6px 0 0">Free plan: limited questions per day, and Google may use what you send to improve its AI. Only IELTS text is sent.</p>
      </div>
      <div id="aiO" class="${c.provider === "ollama" ? "" : "hidden"}" style="margin-top:12px">
        <div class="row"><span class="small">Model:</span><select id="aiModel" style="min-width:200px"><option>${esc(c.ollamaModel)}</option></select>
          <button class="btn sm" id="aiRefresh">↻ Find my models</button></div>
        <details class="small" style="margin-top:8px"><summary>First-time setup (2 steps)</summary>
          <ol style="padding-left:1.3em;line-height:1.8">
            <li>Update Ollama (tray icon → <b>Restart to update</b>, or <a href="https://ollama.com/download" target="_blank">ollama.com/download</a>). Then in PowerShell run: <code>ollama pull gemma3:4b</code></li>
            ${location.protocol === "file:" ? "" : "<!--"}<li>This page is opened as a file, so let Ollama answer it. In PowerShell run once:<br><code id="aiFix">${esc(fileFix)}</code> <button class="btn sm" id="aiFixCopy">Copy</button><br>
              then quit Ollama (tray icon → Quit) and open it again.</li>${location.protocol === "file:" ? "" : "-->"}</ol></details>
      </div>
      <div class="row" style="margin-top:12px"><button class="btn primary" id="aiTest">Test the AI</button><span class="small" id="aiMsg"></span></div>`;
    const show = () => {
      const p = $("input[name=aiP]:checked", box).value;
      $("#aiG").classList.toggle("hidden", p !== "gemini");
      $("#aiO").classList.toggle("hidden", p !== "ollama");
      $("#aiTest").classList.toggle("hidden", p === "copy");
    };
    show();
    $$("input[name=aiP]", box).forEach((r) => (r.onchange = () => { AI.set({ provider: r.value }); show(); if (r.value === "ollama") refresh(); }));
    $("#aiKey").onchange = () => AI.set({ geminiKey: $("#aiKey").value.trim(), geminiModel: "" });
    $("#aiKeyShow").onclick = () => { const k = $("#aiKey"); k.type = k.type === "password" ? "text" : "password"; };
    if ($("#aiFixCopy")) $("#aiFixCopy").onclick = () => navigator.clipboard.writeText(fileFix).then(() => toast("Copied. Paste it into PowerShell."), () => {});
    $("#aiModel").onchange = () => AI.set({ ollamaModel: $("#aiModel").value });
    const msg = (t, ok) => { $("#aiMsg").innerHTML = t; $("#aiMsg").style.color = ok === true ? "var(--good)" : ok === false ? "var(--bad)" : ""; };
    async function refresh() {
      try {
        const ms = await AI.ollamaModels();
        if (!ms.length) return msg("Ollama is running but has no models yet. Run: ollama pull gemma3:4b", false);
        const cur = AI.get().ollamaModel;
        const pick = ms.includes(cur) ? cur : ms.find((m) => /^gemma/.test(m)) || ms.find((m) => !/coder/.test(m)) || ms[0];
        $("#aiModel").innerHTML = ms.map((m) => `<option ${m === pick ? "selected" : ""}>${esc(m)}</option>`).join("");
        AI.set({ ollamaModel: pick });
        msg(`Found ${ms.length} model(s).`, true);
      } catch (e) {
        msg(e.message === "blocked" ? "Ollama is running but blocked this page: do step 2 of the setup." : "Can't reach Ollama. Is the Ollama app running? (See the setup steps.)", false);
      }
    }
    if (c.provider === "ollama") refresh();
    $("#aiRefresh").onclick = refresh;
    $("#aiTest").onclick = async () => {
      AI.set({ geminiKey: $("#aiKey").value.trim() });
      msg("Asking…");
      try {
        const t = await AI.ask("In one short sentence, say hello to an IELTS student and give one quick reading tip.", (x) => msg("… " + esc(x.slice(-120))));
        msg(`✓ ${esc(AI.name())} works: “${esc(t.trim().slice(0, 200))}”`, true);
      } catch (e) { msg("✗ " + esc(e.message), false); }
    };
  }

  /* =================================================================== */
  /* Router                                                               */
  /* =================================================================== */
  function route() {
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    const parts = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
    const name = parts[0] || "";
    const view = pages[name] || pages[""];
    $$("#nav a").forEach((a) => {
      const r = a.dataset.route;
      const active = r === name || (name === "test" && r === (parts[1] === "L" ? "listening" : "reading")) || ((name === "write" || name === "essay") && r === "writing");
      a.classList.toggle("active", active);
    });
    document.getElementById("sidebar").classList.remove("open");
    // Test / writing screens use the full width (the "← All tests" button leads back).
    document.body.classList.toggle("focus", name === "test" || name === "essay" || (name === "write" && parts[2] !== "free"));
    window.scrollTo(0, 0);
    view(...parts.slice(1));
  }
  window.addEventListener("hashchange", route);
  window.addEventListener("beforeunload", () => { if (cleanup) cleanup(); });

  // Other page modules (reader.js, learn.js) register their pages here and reuse these helpers.
  const App = {
    pages, D, C, SKILL, main, esc, $, $$, fileUrl, pdfUrl, todayStr, addDays, fmtDate, fmtTime, testLabel,
    toast, attemptsFor, bestFor, route, half, avg,
    setCleanup: (fn) => (cleanup = fn),
  };
  (window.APP_MODULES || []).forEach((install) => install(App));
  window.App = { toast }; // for sync.js

  applyTheme();
  route();
})();
