/* Built-in AI helper: Google Gemini (free API key, best quality + Khmer) or Ollama (on this laptop, free, offline).
   Settings live in their own browser storage key (NOT in the progress backup, so the API key is never exported).
   The answers arrive bit by bit (streaming), in Markdown; AI.md() turns that into safe HTML. */
(function () {
  const KEY = "ielts-ai.v1";
  const SYSTEM = "You are a kind, patient IELTS Academic tutor. The student is a Khmer speaker at about band 5-6 who wants band 6.5-7. " +
    "Always use simple English and short sentences. Give the Khmer meaning (in Khmer script) for difficult words. " +
    "Explain using the passage text given; do not invent facts that are not in it. Use Markdown: headings, **bold**, bullet lists.";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  let cfg = Object.assign({ provider: "copy", geminiKey: "", geminiModel: "", ollamaModel: "gemma3:4b", ollamaUrl: "http://localhost:11434" }, load());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} };
  const GEMINI = "https://generativelanguage.googleapis.com/v1beta";

  // read a streamed response line by line
  async function lines(res, onLine) {
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) { onLine(buf.slice(0, i).trim()); buf = buf.slice(i + 1); }
    }
    if (buf.trim()) onLine(buf.trim());
  }

  // the newest normal "flash" model (fast, free tier); remembered after the first look-up
  async function geminiModel() {
    if (cfg.geminiModel) return cfg.geminiModel;
    try {
      const r = await fetch(`${GEMINI}/models?pageSize=200`, { headers: { "x-goog-api-key": cfg.geminiKey } });
      if (r.ok) {
        const ms = ((await r.json()).models || [])
          .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
          .map((m) => m.name.replace(/^models\//, ""))
          .filter((n) => /^gemini-[\d.]+-flash$/.test(n));
        ms.sort((a, b) => parseFloat(b.split("-")[1]) - parseFloat(a.split("-")[1]));
        if (ms[0]) { cfg.geminiModel = ms[0]; save(); return ms[0]; }
      }
    } catch (e) {}
    return "gemini-2.5-flash";
  }

  async function askGemini(prompt, onText, signal) {
    if (!cfg.geminiKey) throw new Error("Add your free Gemini API key in Settings → AI helper first.");
    const model = await geminiModel();
    let res;
    try {
      res = await fetch(`${GEMINI}/models/${model}:streamGenerateContent?alt=sse`, {
        method: "POST", signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": cfg.geminiKey },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } }),
      });
    } catch (e) { throw new Error("Can't reach Gemini. Check your internet connection."); }
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      if (res.status === 400 && /API key/i.test(msg)) throw new Error("Gemini says the API key is not valid. Check it in Settings → AI helper.");
      if (res.status === 403) throw new Error("Gemini refused this key (403). Make a new key at aistudio.google.com.");
      if (res.status === 429) throw new Error("You used today's free Gemini limit, or asked too fast. Wait a minute, or switch to Ollama in Settings.");
      if (res.status === 404) { cfg.geminiModel = ""; save(); throw new Error("That Gemini model isn't available any more. Press Ask again (I'll pick a new one)."); }
      throw new Error(`Gemini error ${res.status}. Try again in a minute.`);
    }
    let text = "";
    await lines(res, (l) => {
      if (!l.startsWith("data:")) return;
      try {
        const j = JSON.parse(l.slice(5));
        const t = (((j.candidates || [])[0] || {}).content || {}).parts;
        if (t) { text += t.map((p) => p.text || "").join(""); onText(text); }
      } catch (e) {}
    });
    return text;
  }

  // opened from the laptop's server (or the phone via Tailscale): go through the server's Ollama bridge
  const viaServer = location.protocol !== "file:";
  const ollamaBase = () => (viaServer ? `${location.origin}/ollama` : cfg.ollamaUrl);
  const ollamaHeaders = () => (viaServer ? { "X-IELTS": "1" } : {});
  async function askOllama(prompt, onText, signal) {
    let res;
    try {
      res = await fetch(`${ollamaBase()}/api/chat`, {
        method: "POST", signal, headers: { "Content-Type": "application/json", ...ollamaHeaders() },
        body: JSON.stringify({ model: cfg.ollamaModel, stream: true, options: { temperature: 0.4, num_ctx: 8192 }, // room for a whole passage
          messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }] }),
      });
    } catch (e) {
      throw new Error(location.protocol === "file:"
        ? "Can't reach Ollama. Make sure Ollama is running, and that it allows this page (Settings → AI helper shows how)."
        : "Can't reach Ollama. Make sure the Ollama app is running.");
    }
    if (res.status === 403) throw new Error("Ollama blocked this page. Settings → AI helper shows the one-line fix.");
    if (res.status === 502) throw new Error("Ollama is not running on the laptop. Open the Ollama app there.");
    if (res.status === 404) throw new Error(`Ollama doesn't have the model “${cfg.ollamaModel}”. Open PowerShell and run: ollama pull ${cfg.ollamaModel}`);
    if (!res.ok) throw new Error(`Ollama error ${res.status}: ${(await res.text().catch(() => "")).slice(0, 160)}`);
    let text = "";
    await lines(res, (l) => {
      try { const j = JSON.parse(l); if (j.error) throw new Error(j.error); if (j.message) { text += j.message.content || ""; onText(text); } }
      catch (e) { if (e.message && !/JSON/.test(e.message)) throw e; }
    });
    return text;
  }

  /* ---------- small Markdown -> HTML (headings, bold, italic, lists, tables, quotes, code) ---------- */
  function md(src) {
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/__(.+?)__/g, "<b>$1</b>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<i>$2</i>").replace(/`([^`]+)`/g, "<code>$1</code>");
    const out = [], L = String(src || "").replace(/\r/g, "").split("\n");
    let list = null, para = [];
    const flushPara = () => { if (para.length) { out.push(`<p>${para.map(inline).join("<br>")}</p>`); para = []; } };
    const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
    for (let i = 0; i < L.length; i++) {
      const line = L[i], t = line.trim();
      if (!t) { flushPara(); closeList(); continue; }
      let m;
      if ((m = t.match(/^(#{1,6})\s+(.*)$/))) { flushPara(); closeList(); out.push(`<h${Math.min(6, m[1].length + 1)}>${inline(m[2])}</h${Math.min(6, m[1].length + 1)}>`); continue; }
      if (/^\|.*\|$/.test(t) && i + 1 < L.length && /^\|?\s*:?-{2,}/.test(L[i + 1].trim())) {
        flushPara(); closeList();
        const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim()));
        const rows = [`<tr>${cells(t).map((c) => `<th>${c}</th>`).join("")}</tr>`];
        i += 2;
        while (i < L.length && /^\|.*\|$/.test(L[i].trim())) { rows.push(`<tr>${cells(L[i]).map((c) => `<td>${c}</td>`).join("")}</tr>`); i++; }
        i--;
        out.push(`<table>${rows.join("")}</table>`);
        continue;
      }
      if ((m = line.match(/^(\s*)([-*•]|\d+[.)])\s+(.*)$/))) {
        flushPara();
        const kind = /\d/.test(m[2]) ? "ol" : "ul";
        if (m[1].length >= 2 && list) { out.push(`<li style="margin-left:1.2em">${inline(m[3])}</li>`); continue; }
        if (list !== kind) { closeList(); out.push(`<${kind}>`); list = kind; }
        out.push(`<li>${inline(m[3])}</li>`);
        continue;
      }
      if ((m = t.match(/^>\s?(.*)$/))) { flushPara(); closeList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
      if (/^(-{3,}|\*{3,})$/.test(t)) { flushPara(); closeList(); out.push("<hr>"); continue; }
      closeList();
      para.push(t);
    }
    flushPara(); closeList();
    const html = out.join("");
    return window.Rich ? Rich.sanitize(html) : html;
  }

  const AI = {
    get: () => ({ ...cfg }),
    set(patch) { cfg = { ...cfg, ...patch }; save(); },
    /** true when an AI is chosen and set up (otherwise the app uses copy & paste) */
    ready: () => (cfg.provider === "gemini" && !!cfg.geminiKey) || cfg.provider === "ollama",
    name: () => (cfg.provider === "gemini" ? "Gemini" : cfg.provider === "ollama" ? `Ollama (${cfg.ollamaModel})` : "AI"),
    /** Ask; onText(fullTextSoFar) is called as the answer arrives. Returns the whole answer. */
    ask(prompt, onText = () => {}, signal) {
      return cfg.provider === "ollama" ? askOllama(prompt, onText, signal) : askGemini(prompt, onText, signal);
    },
    /** models installed in Ollama */
    async ollamaModels() {
      const r = await fetch(`${ollamaBase()}/api/tags`, { headers: ollamaHeaders() });
      if (!r.ok) throw new Error(r.status === 403 ? "blocked" : "error " + r.status);
      return ((await r.json()).models || []).map((m) => m.name);
    },
    md,
  };
  window.AI = AI;
})();
