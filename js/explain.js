/* Finds WHERE in the passage each answer is, and explains WHY, in simple English.
   It matches the question (and the correct answer) against every sentence of the passage:
   rare words, names and numbers count most, and answers usually come in passage order. */
(window.APP_MODULES = window.APP_MODULES || []).push(function (App) {
  const STOP = new Set(("a an the and or but if of to in on at by for with from as is are was were be been being it its this that these those there their " +
    "they them he she his her we our you your i not no do does did have has had can could will would should may might must also than then so such " +
    "which who whom whose what when where why how all any some more most other into about over after before between during through up down out " +
    "very much many one two just only own same both each few further once here while because until again against too s t paragraph section passage " +
    "following writer according information statement mention mentions reference describe description example").split(" "));

  function stem(w) {
    w = w.toLowerCase().replace(/[’']s$/, "").replace(/[^a-z0-9]/g, "");
    if (w.length > 5 && w.endsWith("ies")) return w.slice(0, -3) + "y";
    if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
    if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
    if (w.length > 4 && w.endsWith("es")) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
    if (w.length > 5 && w.endsWith("ly")) return w.slice(0, -2);
    return w;
  }
  const words = (t) => (String(t || "").match(/[A-Za-z0-9][A-Za-z0-9’'-]*/g) || []);
  const toks = (t) => words(t).map((w) => ({ s: stem(w), cap: /^[A-Z]/.test(w), num: /\d/.test(w) })).filter((x) => x.s && !STOP.has(x.s));

  /* ---------- sentences of a passage, with their character position in the rendered text ---------- */
  function sentences(p) {
    const out = [];
    let pos = (p.title || "").length; // the title is rendered first
    p.paras.forEach((para, pi) => {
      const t = para.text;
      if (!para.note) {
        const re = /[^.!?]+(?:[.!?]+["'’”)]*|$)/g;
        let m;
        while ((m = re.exec(t))) {
          const raw = m[0];
          if (!raw.trim()) { if (m.index >= t.length) break; continue; }
          const lead = raw.length - raw.trimStart().length;
          // keep short pieces (e.g. "Dr." / "U.S.") with the next part
          const prev = out[out.length - 1];
          if (prev && prev.para === pi && prev.text.split(/\s+/).length < 4) {
            prev.text += raw;
            prev.end = pos + m.index + raw.length;
          } else {
            out.push({ para: pi, label: para.label || nearestLabel(p, pi), text: raw.trim(), start: pos + m.index + lead, end: pos + m.index + raw.length });
          }
          if (m.index + raw.length >= t.length) break;
        }
      }
      pos += t.length;
    });
    const df = {};
    out.forEach((s) => { s.toks = toks(s.text); s.set = new Set(s.toks.map((x) => x.s)); s.set.forEach((w) => (df[w] = (df[w] || 0) + 1)); });
    out.forEach((s, i) => (s.i = i));
    out.idf = (w) => Math.log(1 + out.length / (1 + (df[w] || 0)));
    return out;
  }
  function nearestLabel(p, pi) {
    for (let i = pi; i >= 0; i--) if (p.paras[i].label) return p.paras[i].label;
    return "";
  }

  function score(sent, q, S) {
    let sc = 0;
    const seen = new Set();
    q.forEach((t) => {
      if (seen.has(t.s) || !sent.set.has(t.s)) return;
      seen.add(t.s);
      sc += S.idf(t.s) * (t.num ? 2 : t.cap ? 1.4 : 1);
    });
    return sc;
  }
  const normPhrase = (t) => words(String(t).replace(/[()]/g, " ")).map((w) => stem(w)).join(" ");
  function containsPhrase(sent, phrase) {
    const p = normPhrase(phrase);
    if (!p) return false;
    return (" " + sent.toks.map((x) => x.s).join(" ") + " ").includes(" " + p.split(" ").filter((w) => !STOP.has(w)).join(" ") + " ")
      || (" " + words(sent.text).map(stem).join(" ") + " ").includes(" " + p + " ");
  }
  function best(S, q, opts = {}) {
    let bestS = null, bestScore = -1;
    // completion answers are copied from the passage: if a sentence contains the answer, it must be one of those
    const withAnswer = opts.answers ? S.filter((s) => opts.answers.some((a) => containsPhrase(s, a))) : [];
    const pool = withAnswer.length ? withAnswer : S;
    pool.forEach((s) => {
      if (opts.only && !opts.only(s)) return;
      let sc = score(s, q, S) + (withAnswer.length ? 0.01 : 0);
      if (opts.prefer) sc *= opts.prefer(s);
      if (opts.after != null && s.i < opts.after) sc *= 0.65; // answers usually follow passage order
      if (sc > bestScore) { bestScore = sc; bestS = s; }
    });
    if (bestS && bestScore > 0) return bestS;
    // we already know WHERE (e.g. "paragraph G"), even if no word matches: show the start of that place
    return opts.only ? S.find((s) => opts.only(s)) || null : null;
  }

  /* paragraph letter -> its paragraphs. If the scan lost the printed letter (e.g. "G"),
     use the unlabelled paragraph(s) between the letters before and after it. */
  function paragraphsOf(p, letter) {
    const labelled = p.paras.map((x, i) => ({ i, l: x.label })).filter((x) => x.l);
    const own = labelled.find((x) => x.l === letter);
    const isBody = (i) => !p.paras[i].note;
    if (own) {
      const out = [own.i];
      for (let i = own.i + 1; i < p.paras.length && !p.paras[i].label; i++) if (isBody(i)) out.push(i);
      return out;
    }
    const before = labelled.filter((x) => x.l < letter).pop();
    const after = labelled.find((x) => x.l > letter);
    const lo = before ? before.i + 1 : 0, hi = after ? after.i : p.paras.length;
    const out = [];
    for (let i = lo; i < hi; i++) if (isBody(i)) out.push(i);
    return out;
  }

  // "in the third paragraph" / "paragraph C" in a question -> only look there
  const ORD = { first: 0, second: 1, third: 2, fourth: 3, fifth: 4, sixth: 5, seventh: 6, eighth: 7, ninth: 8, tenth: 9, last: -1, final: -1 };
  function paraFilter(p, text) {
    const t = String(text || "");
    let m = t.match(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last|final)\s+paragraph/i);
    if (m) {
      // counting paragraphs in scanned text is not exact, so this is only a preference (see best())
      const real = p.paras.map((x, i) => (x.note ? -1 : i)).filter((i) => i >= 0);
      const k = ORD[m[1].toLowerCase()];
      const idx = k < 0 ? real[real.length - 1] : real[k];
      if (idx != null) return { prefer: (s) => (s.para === idx ? 1.6 : Math.abs(s.para - idx) === 1 ? 1.25 : 1) };
    }
    m = t.match(/\b(?:paragraph|section)\s+([A-J])\b/);
    if (m && p.paras.some((x) => x.label === m[1])) return { only: (s) => s.label === m[1] };
    return {};
  }
  // add the next/previous sentence when it matches the question almost as well (answers often run over two sentences)
  function withNeighbour(S, s, q) {
    if (!s) return [];
    const base = score(s, q, S);
    const cands = [S[s.i - 1], S[s.i + 1]].filter((x) => x && x.para === s.para);
    const nb = cands.map((x) => ({ x, sc: score(x, q, S) })).sort((a, b) => b.sc - a.sc)[0];
    return nb && nb.sc >= 0.6 * base && nb.sc > 0 ? [s, nb.x].sort((a, b) => a.i - b.i) : [s];
  }

  /* ---------- the text a question is about ---------- */
  function gapContext(g, n) {
    // words around gap n in a completion group
    const flat = [];
    g.rows.forEach((r) => r.forEach((c) => c.forEach((x) => flat.push(x))));
    const i = flat.findIndex((x) => x && x.g === n);
    if (i < 0) return g.instr.join(" ");
    const before = [], after = [];
    for (let k = i - 1; k >= 0 && before.join(" ").split(" ").length < 14; k--) { if (typeof flat[k] === "string") before.unshift(flat[k]); else if (flat[k].g) break; }
    for (let k = i + 1; k < flat.length && after.join(" ").split(" ").length < 12; k++) { if (typeof flat[k] === "string") after.push(flat[k]); else if (flat[k].g) break; }
    return before.join(" ") + " … " + after.join(" ");
  }
  const itemOf = (g, n) => g.items.find((it) => it.n === n);
  const listText = (g, k) => (g.list.find((x) => x.k === k) || {}).t || "";
  const keyAnswers = (key) => (key.alt ? key.alt.flatMap((a) => a.split(" / ")) : key.both ? key.both.flatMap((a) => a.split(" / ")) : key.set || []);

  /* ---------- explanations ---------- */
  const COACH = {
    "FALSE>NOT GIVEN": "You chose FALSE, but the passage does not say the opposite. It simply doesn't give this information. Only choose FALSE when the passage clearly says something different.",
    "TRUE>NOT GIVEN": "You chose TRUE, but the passage doesn't actually say this. Don't use your own knowledge or guess what is probably true.",
    "NOT GIVEN>FALSE": "You chose NOT GIVEN, but the passage DOES talk about this, and it says something different. When the passage contradicts the statement, it's FALSE.",
    "NOT GIVEN>TRUE": "You chose NOT GIVEN, but this sentence gives the same information in different words (a paraphrase).",
    "TRUE>FALSE": "Read the sentence again carefully. One detail is different from the statement (a number, a word like 'all/some/only', or who did what).",
    "FALSE>TRUE": "The statement uses different words, but the meaning is the same as this sentence. Look for synonyms.",
    "NO>NOT GIVEN": "You chose NO, but the writer does not give an opinion on this. Choose NO only when the writer clearly disagrees.",
    "YES>NOT GIVEN": "You chose YES, but the writer doesn't actually say this.",
    "NOT GIVEN>NO": "The writer does give a view here, and it is the opposite of the statement.",
    "NOT GIVEN>YES": "The writer does say this, in different words.",
    "YES>NO": "Read again: the writer's view is the opposite of the statement.",
    "NO>YES": "The writer's view matches the statement, in different words.",
  };

  /* ---------- compare the statement with the passage sentence, word by word (TRUE / FALSE / NOT GIVEN) ---------- */
  // common IELTS paraphrases (same meaning) and opposites (a FALSE answer often swaps one of these)
  const SYN = ["increase rise grow go up expand boost climb raise", "decrease fall drop decline reduce shrink lower cut go down", "big large huge vast enormous major considerable significant substantial",
    "small little minor tiny slight modest", "begin start commence launch initiate", "end finish stop cease complete", "help assist aid support", "show reveal demonstrate indicate suggest prove",
    "use employ utilise utilize apply", "make produce create manufacture generate build construct", "buy purchase acquire", "need require demand necessary essential", "try attempt",
    "important significant crucial vital key essential", "difficult hard tough challenging", "easy simple straightforward", "fast quick rapid rapidly quickly swift", "slow gradual gradually",
    "old ancient former early traditional", "new modern recent novel latest", "cost price expense expensive cheap", "money finance funding economic financial", "rich wealthy affluent", "poor poverty",
    "people public population society community residents citizens locals local", "worker employee staff labour labor", "job work employment occupation career", "child children kid young youngster",
    "scientist researcher expert specialist academic", "study research investigation survey experiment", "find discover identify detect", "think believe consider feel regard view opinion",
    "say state claim argue assert maintain", "allow permit enable let", "stop prevent prohibit ban block", "damage harm destroy hurt injure", "danger risk threat hazard", "problem issue difficulty trouble",
    "change alter modify transform adapt", "improve enhance better develop advance progress", "reason cause because why", "result effect consequence outcome impact", "often frequently regularly commonly usually",
    "rare rarely seldom unusual uncommon", "many numerous plenty lot", "few several handful", "whole entire all", "only solely exclusively just", "limit restrict confine", "same identical similar alike",
    "different various diverse distinct", "first initial original earliest", "main primary chief principal major", "reliable dependable trustworthy", "sympathy support compassion pity", "arrest detain capture",
    "goods products merchandise cargo", "transport carry move ship deliver", "country nation state", "city town urban", "rural countryside village", "benefit advantage gain profit", "disadvantage drawback downside",
    "believe expect predict fear worry", "lose loss losses", "machine machinery equipment device tool technology"].map((g) => g.split(" "));
  const OPP = [["increase", "decrease"], ["rise", "fall"], ["grow", "decline"], ["more", "less"], ["more", "fewer"], ["higher", "lower"], ["high", "low"], ["before", "after"], ["first", "last"],
    ["all", "some"], ["always", "sometimes"], ["always", "never"], ["only", "also"], ["cheap", "expensive"], ["easy", "difficult"], ["success", "failure"], ["succeed", "fail"], ["agree", "disagree"],
    ["accept", "reject"], ["same", "different"], ["many", "few"], ["large", "small"], ["big", "small"], ["fast", "slow"], ["rapidly", "slowly"], ["early", "late"], ["old", "new"], ["increase", "fall"],
    ["rose", "fell"], ["rise", "drop"], ["positive", "negative"], ["safe", "dangerous"], ["possible", "impossible"], ["likely", "unlikely"], ["popular", "unpopular"], ["common", "rare"], ["better", "worse"],
    ["most", "least"], ["ancient", "modern"], ["include", "exclude"], ["strong", "weak"], ["reliable", "unreliable"], ["simple", "complex"], ["private", "public"], ["male", "female"], ["win", "lose"]];
  const NEG = /\b(not|no|never|none|nobody|nothing|neither|nor|cannot|can't|didn't|doesn't|don't|isn't|wasn't|weren't|aren't|hardly|rarely|fail(ed|s)?)\b/i;
  const synOf = (s) => { const out = new Set([s]); SYN.forEach((g) => { const st = g.map(stem); if (st.includes(s)) st.forEach((x) => out.add(x)); }); return out; };
  const opposite = (a, b) => OPP.some(([x, y]) => (stem(x) === a && stem(y) === b) || (stem(x) === b && stem(y) === a));

  const SMALL = new Set("among around within without near across toward towards upon whether although though however thing things way ways get got".split(" ").map(stem));
  function compare(stmt, locs, a) {
    if (!stmt || !locs.length) return "";
    const sentText = locs.map((s) => s.text).join(" ");
    const sentWords = words(sentText);
    const sentSt = new Map(sentWords.map((w) => [stem(w), w]));
    const seen = new Set(), same = [], para = [], missing = [], opp = [];
    words(stmt).forEach((w) => {
      const s = stem(w);
      if (!s || STOP.has(s) || SMALL.has(s) || seen.has(s) || s.length < 3 && !/\d/.test(s)) return;
      seen.add(s);
      if (sentSt.has(s)) return same.push(w);
      const o = [...sentSt.keys()].find((x) => opposite(s, x));
      if (o) return opp.push([w, sentSt.get(o)]);
      const syn = [...synOf(s)].find((x) => x !== s && sentSt.has(x));
      if (syn) return para.push([w, sentSt.get(syn)]);
      missing.push(w);
    });
    // numbers: "1850" in the statement but "1860" in the passage
    const nQ = words(stmt).filter((w) => /^\d/.test(w)), nP = sentWords.filter((w) => /^\d/.test(w));
    const numDiff = nQ.filter((x) => !nP.includes(x));
    const negQ = NEG.test(stmt), negP = NEG.test(sentText);
    const b = (list) => list.map((w) => `<b>${esc(w)}</b>`).join(", ");
    const out = [];
    if (same.length) out.push(`🔎 <b>Same words</b> in the question and the passage: ${b(same)}. That's how you find the right place.`);
    if (para.length) out.push(`🔁 <b>Same meaning, different words</b>: ${para.map(([q, p]) => `<b>${esc(q)}</b> = <b>${esc(p)}</b>`).join(", ")}.`);
    const isNo = a === "FALSE" || a === "NO", isNG = a === "NOT GIVEN", isYes = a === "TRUE" || a === "YES";
    if (isNo) {
      if (opp.length) out.push(`❌ <b>Opposite</b>: the question says ${opp.map(([q, p]) => `<b>${esc(q)}</b>, but the passage says <b>${esc(p)}</b>`).join("; ")}.`);
      else if (numDiff.length && nP.length) out.push(`❌ <b>Different number</b>: the question says ${b(numDiff)}, but the passage says ${b(nP)}.`);
      else if (negQ !== negP) out.push(`❌ One of them says <b>NOT / NO / NEVER</b> and the other doesn't, so they say opposite things.`);
      else if (missing.length) out.push(`❌ Compare these words from the question with the passage sentence: ${b(missing)}. The passage says something <b>different</b> about them.`);
    } else if (isNG) {
      if (missing.length) out.push(`❓ <b>Not in the passage</b>: the passage says nothing about ${b(missing)}. Maybe it's true in real life, but this text doesn't tell us, so we can't say TRUE or FALSE. That's <b>NOT GIVEN</b>.`);
      else out.push(`❓ The passage talks about these things, but it doesn't say exactly what the question says, so it's <b>NOT GIVEN</b>.`);
    } else if (isYes && missing.length) {
      out.push(`✅ The other words (${b(missing.slice(0, 6))}) are said <b>in different words</b> in the passage sentence. Read it and find the part with the same meaning.`);
    }
    return out.length ? `<ul class="ex-compare">${out.map((x) => `<li>${x}</li>`).join("")}</ul>` : "";
  }

  function explainOne(data, pi, g, n, key, yours) {
    const p = data.passages[pi];
    const S = p._S || (p._S = sentences(p));
    const answers = keyAnswers(key);
    const ansShown = Grade.display(key);
    const typ = g.type;
    let loc = [], why = "", whole = null;
    const it = itemOf(g, n);
    const prev = p._last && p._last[g.a] != null ? p._last[g.a] : null;

    if (typ === "complete" || typ === "short") {
      const ctx = typ === "short" && it ? it.t : gapContext(g, n);
      const s = best(S, toks(ctx), { answers, after: prev });
      if (s) loc = [s];
      why = `The answer is <b>${esc(ansShown)}</b>. ${s && answers.some((a) => containsPhrase(s, a)) ? "These exact words are in the highlighted sentence, and" : "Look at the highlighted sentence:"} the words around the gap${typ === "short" ? " (the question)" : ""} mean the same as this part of the passage. Copy the word(s) exactly. Check the spelling, singular/plural and the word limit.`;
    } else if (typ === "complete_letter") {
      const letter = answers[0];
      const word = listText(g, letter);
      const s = best(S, toks(gapContext(g, n) + " " + word), { after: prev });
      if (s) loc = [s];
      why = `The answer is <b>${esc(letter)}</b>${word ? ` (“${esc(word)}”)` : ""}. The highlighted sentence has the same meaning as the words around the gap. The passage uses different words (synonyms) from the box, so match the <i>meaning</i>, not the exact word.`;
    } else if (typ === "tfng" || typ === "ynng") {
      const q = toks(it ? it.t : "");
      const s = best(S, q, { after: prev, ...paraFilter(p, it && it.t) });
      loc = withNeighbour(S, s, q);
      const a = answers[0];
      const base = {
        TRUE: "This sentence says the same thing as the statement, in different words, so the answer is <b>TRUE</b>.",
        FALSE: "This sentence says something <b>different from / the opposite of</b> the statement, so the answer is <b>FALSE</b>.",
        "NOT GIVEN": "The passage talks about this topic here, but it <b>does not give</b> the information in the statement, so the answer is <b>NOT GIVEN</b>.",
        YES: "The writer's view here agrees with the statement, so the answer is <b>YES</b>.",
        NO: "The writer's view here is the opposite of the statement, so the answer is <b>NO</b>.",
      }[a] || `The answer is <b>${esc(a)}</b>.`;
      const coach = COACH[`${String(yours || "").toUpperCase().replace(/^T$/, "TRUE").replace(/^F$/, "FALSE").replace(/^NG$/, "NOT GIVEN").replace(/^Y$/, "YES").replace(/^N$/, "NO")}>${a}`];
      why = base + compare(it && it.t, loc, a) + (coach ? `<span class="coach">💬 ${coach}</span>` : "");
    } else if (typ === "mcq") {
      const opt = it && it.opts.find((o) => o.k === answers[0]);
      const q = toks((it ? it.t : "") + " " + (opt ? opt.t : ""));
      const s = best(S, q, { after: prev, ...paraFilter(p, it && it.t) });
      loc = withNeighbour(S, s, q);
      why = `The answer is <b>${esc(answers[0])}</b>${opt ? ` (“${esc(opt.t)}”)` : ""}: it has the same meaning as the highlighted sentence. The other options often use words from the passage but say something the passage doesn't say.`;
    } else if (typ === "multi") {
      const letters = key.set || answers;
      letters.forEach((l) => { const s = best(S, toks((it ? it.t : "") + " " + listText(g, l))); if (s && !loc.includes(s)) loc.push(s); });
      why = `The correct letters are <b>${esc(letters.join(" and "))}</b>${letters.map((l) => listText(g, l) ? `<br>• <b>${esc(l)}</b> ${esc(listText(g, l))}` : "").join("")}<br>Each of these is clearly stated in the highlighted sentences. The other options are not what the question asks.`;
    } else if (typ === "headings") {
      const heading = listText(g, answers[0]);
      let lab = ((it && it.t) || "").match(/\b([A-J])\b/);
      lab = lab ? lab[1] : null;
      let paras = lab ? paragraphsOf(p, lab) : [];
      if (!paras.length) {
        // we don't know which paragraph this question is about: find the paragraph that matches the heading best
        const q = toks(heading);
        const byPara = {};
        S.forEach((s) => (byPara[s.para] = (byPara[s.para] || 0) + score(s, q, S)));
        const top = Object.entries(byPara).sort((x, y) => y[1] - x[1])[0];
        if (top) paras = [+top[0]];
      }
      if (paras.length) {
        const inPara = S.filter((s) => paras.includes(s.para));
        // the first sentence (topic sentence) + the sentence that matches the heading best
        const bestS = best(S, toks(heading), { only: (s) => paras.includes(s.para) });
        loc = [inPara[0], bestS].filter((x, i, arr) => x && arr.indexOf(x) === i).sort((x, y) => x.i - y.i);
        whole = paras[0];
        if (!lab) lab = S.find((s) => s.para === paras[0])?.label || "";
      }
      why = `The answer is <b>${esc(answers[0])}</b>: “${esc(heading)}”. This is the <b>main idea</b> of the whole paragraph${lab ? " " + lab : ""}, not just one detail. The first sentence (the topic sentence) usually shows the main idea.`;
    } else if (typ === "match") {
      const letter = answers[0];
      const paraLabels = new Set(p.paras.map((x) => x.label).filter(Boolean));
      const isParagraph = /paragraph|section/i.test(g.instr.join(" ")) || (!g.list.length && paraLabels.size > 0);
      if (isParagraph && /^[A-J]$/.test(letter)) {
        const paras = paragraphsOf(p, letter);
        const s = best(S, toks(it ? it.t : ""), { only: (x) => paras.includes(x.para) });
        if (s) loc = [{ ...s, label: letter }]; // show the right letter even if the scan lost it
        why = `The answer is <b>paragraph ${esc(letter)}</b>${paraLabels.has(letter) ? "" : " (its letter didn't scan clearly, so it is shown here)"}. This information is in the highlighted sentence. These questions are not in passage order, so scan the whole passage for key words and their synonyms.`;
      } else {
        const who = listText(g, letter);
        const s = best(S, toks((it ? it.t : "") + " " + who + " " + who));
        if (s) loc = [s];
        why = `The answer is <b>${esc(letter)}</b>${who ? ` (${esc(who)})` : ""}. The highlighted sentence links ${who ? esc(who) : "this option"} to the idea in the question. Scan for the names / key words first, then read that sentence carefully.`;
      }
    } else {
      const s = best(S, toks((it ? it.t : "") + " " + gapContext(g, n)), { answers });
      if (s) loc = [s];
      why = `The answer is <b>${esc(ansShown)}</b>.`;
    }
    if (!loc.length) {
      // last try: everything we know about the question and its answer, anywhere in the passage
      const extra = answers.map((a) => listText(g, a) || (it && it.opts.find((o) => o.k === a) || {}).t || a).join(" ");
      const s = best(S, toks([(it ? it.t : ""), g.type.startsWith("complete") ? gapContext(g, n) : "", extra].join(" ")), { answers: g.type === "complete" ? answers : null });
      if (s) loc = [s];
    }
    if (!loc.length) why = why.replace(/ (in|as) the highlighted sentences?/g, "").replace(/This information is in the highlighted sentence\. /, "").replace(/Look at the highlighted sentence:/, "");
    if (loc[0] && g.type !== "match" && g.type !== "headings" && g.type !== "multi") {
      p._last = p._last || {};
      p._last[g.a] = loc[0].i;
    }
    const opts = it && it.opts && it.opts.length ? " Options: " + it.opts.map((o) => `${o.k}. ${o.t}`).join(" ") : "";
    return { n, loc, why, whole, answer: ansShown, question: ((it && it.t) || (typ.startsWith("complete") ? gapContext(g, n) : "")) + opts, type: typ };
  }
  const esc = App.esc;

  /** Explanations for the given question numbers of passage pi. */
  App.explain = function (data, pi, keys, nums, ans) {
    const p = data.passages[pi];
    p._last = {};
    const byN = {};
    // walk all questions in order (so "passage order" works), keep the ones asked for
    p.groups.forEach((g) => {
      const all = [];
      for (let n = g.a; n <= g.b; n++) all.push(n);
      g.fallback.forEach((n) => { if (!all.includes(n)) all.push(n); });
      all.sort((x, y) => x - y).forEach((n) => {
        if (!keys[n - 1] || byN[n]) return;
        if (g.type === "multi" && n !== g.a) return;
        byN[n] = explainOne(data, pi, g, n, keys[n - 1], ans[n - 1]);
        if (g.type === "multi") for (let m = g.a + 1; m <= g.b; m++) byN[m] = byN[n];
      });
    });
    return nums.map((n) => byN[n]).filter(Boolean);
  };
  window.IELTS_EXPLAIN = App.explain; // handy for checking from the browser console
});
