/* Rich notes: keep the formatting of text you paste (from an AI answer, a dictionary website...):
   bold, italic, headings, lists, tables, quotes. Colours, fonts, pictures and scripts are removed
   so the note looks clean in light and dark mode. */
(function () {
  const KEEP = new Set(["B", "STRONG", "I", "EM", "U", "P", "BR", "UL", "OL", "LI", "H1", "H2", "H3", "H4", "H5", "H6",
    "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "BLOCKQUOTE", "CODE", "PRE", "HR", "SUB", "SUP", "S", "MARK"]);
  const BLOCKISH = new Set(["DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "MAIN", "ASIDE"]);
  const DROP = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "IMG", "SVG", "VIDEO", "AUDIO", "CANVAS", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "FORM", "NOSCRIPT", "TEMPLATE", "META", "LINK"]);

  function clean(node, doc) {
    const out = doc.createDocumentFragment();
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) { out.appendChild(doc.createTextNode(n.data)); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName.toUpperCase();
      if (DROP.has(tag)) return;
      const inner = clean(n, doc);
      if (KEEP.has(tag)) {
        const el = doc.createElement(tag === "STRONG" ? "b" : tag === "EM" ? "i" : tag.toLowerCase());
        if ((tag === "TD" || tag === "TH") && n.getAttribute("colspan")) el.setAttribute("colspan", n.getAttribute("colspan"));
        if ((tag === "TD" || tag === "TH") && n.getAttribute("rowspan")) el.setAttribute("rowspan", n.getAttribute("rowspan"));
        el.appendChild(inner);
        out.appendChild(el);
      } else if (BLOCKISH.has(tag)) {
        const p = doc.createElement("p");
        p.appendChild(inner);
        out.appendChild(p);
      } else if (tag === "SPAN" && /font-weight:\s*(bold|[6-9]00)/i.test(n.getAttribute("style") || "")) {
        const b = doc.createElement("b"); // Google Docs / some sites mark bold with style only
        b.appendChild(inner);
        out.appendChild(b);
      } else {
        out.appendChild(inner); // unwrap unknown tags (span, a, font...) but keep their text
      }
    });
    return out;
  }

  const Rich = {
    /** Safe HTML from any HTML string. */
    sanitize(html) {
      const doc = new DOMParser().parseFromString(`<body>${html || ""}</body>`, "text/html");
      const box = document.createElement("div");
      box.appendChild(clean(doc.body, document));
      // remove empty paragraphs at the start/end
      while (box.firstChild && box.firstChild.nodeType === 1 && !box.firstChild.textContent.trim() && box.firstChild.tagName !== "TABLE") box.removeChild(box.firstChild);
      while (box.lastChild && box.lastChild.nodeType === 1 && !box.lastChild.textContent.trim() && box.lastChild.tagName !== "TABLE") box.removeChild(box.lastChild);
      return box.innerHTML.trim();
    },
    /** Plain text from rich HTML (for searching, word detection, short previews). */
    toText(html) {
      const box = document.createElement("div");
      box.innerHTML = Rich.sanitize(html).replace(/<\/(p|li|h\d|tr|blockquote)>/gi, "$&\n").replace(/<br\s*\/?>/gi, "\n").replace(/<\/t[dh]>/gi, " $&");
      return box.textContent.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    },
    /** Rich HTML from plain text (old notes). */
    fromText(text) {
      const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      return esc(text).replace(/\n/g, "<br>");
    },
    /** Hide a word inside rich HTML (for "type the word" flashcards). */
    mask(html, word) {
      if (!word) return html;
      const re = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
      const box = document.createElement("div");
      box.innerHTML = Rich.sanitize(html);
      const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (w.nextNode()) nodes.push(w.currentNode);
      nodes.forEach((n) => (n.data = n.data.replace(re, "_____")));
      return box.innerHTML;
    },
    /** Make an element an editor that keeps formatting when you paste. onChange(html, text). */
    editor(el, html, onChange) {
      el.contentEditable = "true";
      el.classList.add("rich", "rich-edit");
      el.innerHTML = Rich.sanitize(html);
      const fire = () => onChange(Rich.sanitize(el.innerHTML), Rich.toText(el.innerHTML));
      el.addEventListener("paste", (e) => {
        const cd = e.clipboardData;
        if (!cd) return;
        if ([...cd.items].some((x) => x.type.startsWith("image/")) && !cd.getData("text/plain")) return; // a picture: let the picture box handle it
        e.preventDefault();
        const htmlData = cd.getData("text/html");
        const frag = htmlData ? Rich.sanitize(htmlData) : Rich.fromText(cd.getData("text/plain"));
        document.execCommand("insertHTML", false, frag);
        fire();
      });
      el.addEventListener("input", fire);
      el.addEventListener("keydown", (e) => {
        // keyboard shortcuts for formatting
        if ((e.ctrlKey || e.metaKey) && ["b", "i", "u"].includes(e.key.toLowerCase())) {
          e.preventDefault();
          document.execCommand({ b: "bold", i: "italic", u: "underline" }[e.key.toLowerCase()]);
          fire();
        }
      });
      return el;
    },
  };
  window.Rich = Rich;
})();
