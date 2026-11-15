/* Pronunciation for words: the phonetic spelling (IPA, e.g. /ˈvɜːbəl/) and a real recording (British first).
   Looked up once from the free dictionary at dictionaryapi.dev, then remembered in this browser.
   Offline, or for words the dictionary doesn't have, 🔊 uses the computer's voice. */
(function () {
  const KEY = "ielts-pron.v1", API = "https://api.dictionaryapi.dev/api/v2/entries/en/";
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { cache = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) {} };
  const norm = (w) => String(w || "").normalize("NFKC").toLowerCase().replace(/[^a-z' -]/g, "").replace(/\s+/g, " ").trim();
  const pending = {};
  const WEEK = 7 * 864e5;

  // other forms to try when the dictionary doesn't know this one: "looms" -> "loom", "garnered" -> "garner"
  const forms = (w) => [w, w.replace(/ies$/, "y"), w.replace(/es$/, ""), w.replace(/s$/, ""), w.replace(/ied$/, "y"), w.replace(/ed$/, ""), w.replace(/d$/, ""), w.replace(/ing$/, ""), w.replace(/ing$/, "e"), w.replace(/ly$/, "")]
    .filter((x, i, a) => x.length > 2 && a.indexOf(x) === i);

  // the dictionary refuses too many requests at once: ask one at a time, with a short pause
  let queue = Promise.resolve(), gap = 250;
  const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
  function fetchWord(f) {
    const job = queue.then(async () => {
      for (let tryNo = 0; tryNo < 3; tryNo++) {
        try {
          const r = await fetch(API + encodeURIComponent(f));
          if (r.ok || r.status === 404) { gap = Math.max(250, gap * 0.8); await sleep(gap); return r; }
        } catch (e) {} // offline or "too many requests": slow down and try again
        gap = Math.min(5000, gap * 2);
        await sleep(gap * (tryNo + 1));
      }
      return null;
    });
    queue = job.catch(() => null);
    return job;
  }
  async function lookupOne(w) {
    let audio = "";
    for (const f of forms(w)) {
      try {
        const r = await fetchWord(f);
        if (!r) return null; // no answer from the dictionary: don't remember anything, try again later
        if (!r.ok) continue; // 404: the dictionary doesn't know this form
        const list = await r.json();
        const ph = list.flatMap((e) => e.phonetics || []);
        const uk = ph.find((p) => p.audio && /-uk\b|_uk|-gb/i.test(p.audio));
        const any = ph.find((p) => p.audio);
        const ukText = ph.find((p) => p.text && p.audio && /-uk\b/i.test(p.audio));
        // a recording of another form (e.g. "loom" for "looms") would say the wrong word
        if (f === w) audio = ((uk || any) || {}).audio || "";
        let ipa = (ukText && ukText.text) || list.map((e) => e.phonetic).find(Boolean) || (ph.find((p) => p.text) || {}).text || "";
        if (!ipa) continue; // e.g. "inadvertently" has no spelling: try "inadvertent"
        if (f !== w && w.endsWith("ly") && !f.endsWith("ly")) ipa = ipa.replace(/\/?$/, "").replace(/\/$/, "") + "li/";
        return { ipa, audio, t: Date.now() };
      } catch (e) { return null; } // offline: try again later
    }
    return { ipa: "", audio, t: Date.now() };
  }

  const Pron = {
    /** {ipa, audio} for a word or phrase (cached). */
    get(word) {
      const w = norm(word);
      if (!w) return Promise.resolve({ ipa: "", audio: "" });
      const c = cache[w];
      if (c && (c.ipa || c.audio || Date.now() - c.t < WEEK)) return Promise.resolve(c);
      if (pending[w]) return pending[w];
      pending[w] = (async () => {
        let res;
        if (/[ -]/.test(w)) {
          // a phrase: the sound of each word ("looms larger" -> /luːm ˈlɑː.d͡ʒə/); the voice reads the whole phrase
          const one = /-/.test(w) && !w.includes(" ") ? await lookupOne(w) : null; // some dictionaries know "well-known"
          if (one && one.ipa) res = one;
          else {
            const parts = await Promise.all(w.split(/[ -]/).filter(Boolean).map((x) => Pron.get(x)));
            const ipas = parts.map((p) => (p.ipa || "").replace(/^\/|\/$/g, ""));
            res = { ipa: ipas.every(Boolean) ? `/${ipas.join(w.includes(" ") ? " " : "-")}/` : "", audio: "", t: Date.now() };
          }
        } else res = await lookupOne(w);
        if (res) { cache[w] = res; save(); }
        delete pending[w];
        return res || { ipa: "", audio: "" };
      })();
      return pending[w];
    },
    /** Say a word: the real recording if there is one, otherwise the computer's voice. */
    async say(word) {
      const voice = () => {
        try {
          const u = new SpeechSynthesisUtterance(word);
          u.lang = "en-GB"; u.rate = 0.9;
          speechSynthesis.cancel(); speechSynthesis.speak(u);
        } catch (e) {}
      };
      const c = cache[norm(word)];
      const p = c ? c : await Promise.race([Pron.get(word), new Promise((r) => setTimeout(() => r(null), 1500))]);
      if (p && p.audio) {
        try { await new Audio(p.audio).play(); return; } catch (e) {}
      }
      voice();
    },
    /** A place for the phonetic spelling; Pron.fill() puts it in. */
    tag(word) {
      return `<span class="ipa" data-ipa="${String(word || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))}"></span>`;
    },
    /** Fill every Pron.tag() inside root (a few at a time, so long lists don't flood the dictionary). */
    fill(root) {
      const els = [...(root || document).querySelectorAll("[data-ipa]:not([data-done])")];
      let i = 0;
      const next = async () => {
        while (i < els.length) {
          const el = els[i++];
          el.dataset.done = "1";
          const p = await Pron.get(el.dataset.ipa);
          if (p && p.ipa) { el.textContent = p.ipa; el.title = "How to say it"; }
        }
      };
      for (let k = 0; k < 4; k++) next();
    },
  };
  window.Pron = Pron;
})();
