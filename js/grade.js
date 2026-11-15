// Marks Listening / Reading answers the way an examiner would (but a little kinder
// about spacing, capitals and hyphens). Spelling still has to be right.
(function () {
  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[‘’`´]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/(\d),(\d{3})/g, "$1$2")      // 1,000 -> 1000
      .replace(/(\d):(\d\d)/g, "$1.$2")      // 4:30 -> 4.30
      .replace(/[£$€]/g, "")
      .replace(/-/g, " ")                    // car-park == car park
      .replace(/[.;,!?]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  const escapeRe = (s) => s.replace(/[.*+?^${}|[\]\\]/g, "\\$&");

  // "(the) (only) rich" -> words in brackets are optional.
  function altRegex(alt) {
    let src = escapeRe(norm(alt)); // brackets are kept: they mark optional words
    src = src.replace(/\s*\(([^()]*)\)\s*/g, (_, inner) => `\\s*(?:${inner})?\\s*`);
    src = src.replace(/ /g, "\\s*");
    return new RegExp(`^\\s*${src}\\s*$`, "i");
  }

  const ABBR = { "true": ["t"], "false": ["f"], "not given": ["ng", "n.g", "notgiven"], "yes": ["y"], "no": ["n"] };

  function matchAlt(user, alt) {
    const u = norm(user);
    if (!u) return false;
    const a = norm(alt);
    if (ABBR[a] && (u === a || ABBR[a].includes(u.replace(/\s/g, "")))) return true;
    try {
      return altRegex(alt).test(u);
    } catch (e) {
      return u === a.replace(/[()]/g, "");
    }
  }

  function matchAny(user, alts) {
    return alts.some((a) => a.split(" / ").some((x) => matchAlt(user, x)));
  }

  // Shows the key nicely: "beach / beaches", "B & E (any order)" ...
  function display(key) {
    if (key.alt) return key.alt.join(" / ");
    if (key.both) return key.both.join(" + ") + " (both needed)";
    if (key.set) return key.set.join(" or ");
    return "";
  }

  /**
   * keys: 40 key objects from data.js; answers: 40 strings.
   * returns { score, results: [{ok, key, shown}] }
   */
  function gradeSection(keys, answers) {
    const results = keys.map((k, i) => ({ ok: false, shown: display(k), q: i + 1 }));
    const groups = {};
    keys.forEach((k, i) => {
      const ans = answers[i] || "";
      if (k.grp) {
        (groups[k.grp] = groups[k.grp] || []).push(i);
      } else if (k.both) {
        const pieces = norm(ans).split(/\s*(?:,|;|&|\/|\band\b|\+)\s*/).filter(Boolean);
        const whole = norm(ans);
        results[i].ok = k.both.every((part) =>
          part.split(" / ").some((p) => pieces.some((pc) => matchAlt(pc, p)) || whole.includes(norm(p).replace(/[()]/g, "")))
        );
      } else {
        results[i].ok = matchAny(ans, k.alt);
      }
    });
    // Either-order groups: each correct letter counts once, in any box of the group.
    Object.values(groups).forEach((idxs) => {
      const letters = keys[idxs[0]].set.map((x) => x.toUpperCase());
      const used = new Set();
      idxs.forEach((i) => {
        const a = norm(answers[i]).toUpperCase();
        if (letters.includes(a) && !used.has(a)) {
          used.add(a);
          results[i].ok = true;
        }
      });
      const all = letters.join(" + ") + " (any order)";
      idxs.forEach((i) => (results[i].shown = all));
    });
    return { score: results.filter((r) => r.ok).length, results };
  }

  // Raw score (out of 40) -> band. Official conversion tables used by Cambridge/IELTS.
  const LISTENING = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 0]];
  const READING = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 0]];

  function band(skill, score) {
    const table = skill === "L" ? LISTENING : READING;
    return table.find(([min]) => score >= min)[1];
  }

  // How many correct answers you need for a band.
  function needed(skill, b) {
    const table = skill === "L" ? LISTENING : READING;
    const row = table.slice().reverse().find(([, bb]) => bb >= b);
    return row ? row[0] : 40;
  }

  // Overall band = average of 4 skills, rounded to the nearest half (x.25 -> x.5, x.75 -> next whole).
  function overall(bands) {
    const avg = bands.reduce((a, b) => a + b, 0) / bands.length;
    return Math.round(avg * 2 + 1e-9) / 2;
  }

  window.Grade = { norm, matchAlt, gradeSection, band, needed, overall, display, LISTENING, READING };
})();
