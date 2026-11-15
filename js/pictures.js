/* Pictures for words (flashcards), several per word. Stored in the browser's IndexedDB (localStorage is too small),
   resized to max 480px so hundreds of pictures fit. Included in Settings -> Download backup. */
(function () {
  const DB = "ielts-pictures", STORE = "pics";
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }
  const tx = (mode, fn) => db().then((d) => new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out);
    t.onerror = () => reject(t.error);
  }));
  const urls = {}; // id -> object URL (cached)

  // shrink a picture (File/Blob) to max 480px, JPEG
  function shrink(blob, max = 480) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const u = URL.createObjectURL(blob);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * k));
        c.height = Math.max(1, Math.round(img.height * k));
        const g = c.getContext("2d");
        g.fillStyle = "#fff";
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read this picture"))), "image/jpeg", 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(u); reject(new Error("This file is not a picture")); };
      img.src = u;
    });
  }

  const Pics = {
    async add(file) {
      const small = await shrink(file);
      const id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      await tx("readwrite", (s) => s.put(small, id));
      return id;
    },
    async url(id) {
      if (Array.isArray(id)) id = id[0]; // several pictures: the first one (for small thumbnails)
      if (!id) return null;
      if (urls[id]) return urls[id];
      const blob = await tx("readonly", (s) => s.get(id));
      if (!blob) return null;
      urls[id] = URL.createObjectURL(blob);
      return urls[id];
    },
    async remove(id) {
      if (!id) return;
      if (urls[id]) { URL.revokeObjectURL(urls[id]); delete urls[id]; }
      await tx("readwrite", (s) => s.delete(id));
    },
    // for sync between laptop and phone (sync.js)
    async ids() { const d = await db(); return new Promise((ok) => { const r = d.transaction(STORE).objectStore(STORE).getAllKeys(); r.onsuccess = () => ok(r.result || []); r.onerror = () => ok([]); }); },
    blob: (id) => tx("readonly", (s) => s.get(id)),
    async putBlob(id, blob) { await tx("readwrite", (s) => s.put(blob, id)); },
    // for backups: [{id, data: "data:image/jpeg;base64,..."}]
    async exportAll() {
      const d = await db();
      return new Promise((resolve) => {
        const out = [];
        const req = d.transaction(STORE).objectStore(STORE).openCursor();
        req.onsuccess = () => {
          const cur = req.result;
          if (!cur) return Promise.all(out).then(resolve);
          const id = cur.key, blob = cur.value;
          out.push(new Promise((r) => { const fr = new FileReader(); fr.onload = () => r({ id, data: fr.result }); fr.readAsDataURL(blob); }));
          cur.continue();
        };
        req.onerror = () => resolve([]);
      });
    },
    async importAll(list) {
      for (const p of list || []) {
        const blob = await (await fetch(p.data)).blob();
        await tx("readwrite", (s) => s.put(blob, p.id));
      }
    },

    /** A word can have several pictures: the saved value is one id (older notes) or a list of ids. */
    list(v) { return (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean); },
    async urls(v) { return (await Promise.all(Pics.list(v).map((id) => Pics.url(id)))).filter(Boolean); },

    /** A picture box for one word: all its pictures + add more (choose files / paste / drop) / find on Google / remove one.
     *  get() -> current picture id(s), set(list of ids | null) saves them. */
    picker(container, word, get, set) {
      const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      const render = async () => {
        const ids = Pics.list(get());
        const us = await Promise.all(ids.map((id) => Pics.url(id)));
        container.innerHTML = `<div class="picbox" tabindex="0" title="Click here, then press Ctrl+V to paste a picture">
          ${ids.length ? `<div class="picgrid">${ids.map((id, i) => us[i] ? `<div class="picitem"><img src="${us[i]}" alt="${esc(word)}"><button type="button" class="picx" data-rm="${id}" title="Remove this picture">✕</button></div>` : "").join("")}</div>`
            : `<div class="picempty">🖼 No picture yet<br><span>Paste a picture here (Ctrl+V)</span></div>`}
          <div class="row picbtns">
            <label class="btn sm">📷 ${ids.length ? "Add more" : "Add picture"}<input type="file" accept="image/*" multiple hidden></label>
            <a class="btn sm" target="_blank" href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(word)}">🔎 Find pictures</a>
          </div>
          <div class="small muted picmsg">${ids.length ? "You can add as many pictures as you like." : ""}</div></div>`;
        const box = container.querySelector(".picbox");
        const msg = container.querySelector(".picmsg");
        const save = async (files) => {
          try {
            msg.textContent = "Saving…";
            const added = [];
            for (const f of files) added.push(await Pics.add(f));
            set(Pics.list(get()).concat(added));
            render();
          } catch (e) { msg.textContent = e.message; }
        };
        container.querySelector("input[type=file]").onchange = (e) => e.target.files.length && save([...e.target.files]);
        container.querySelectorAll("[data-rm]").forEach((x) => (x.onclick = () => {
          const left = Pics.list(get()).filter((id) => id !== x.dataset.rm);
          set(left.length ? left : null);
          Pics.remove(x.dataset.rm);
          render();
        }));
        box.addEventListener("paste", (e) => {
          const files = [...(e.clipboardData || {}).items || []].filter((x) => x.type.startsWith("image/")).map((x) => x.getAsFile());
          if (files.length) { e.preventDefault(); save(files); }
          else msg.textContent = "No picture in the clipboard. In Google Images: right-click a picture → Copy image, then click here and press Ctrl+V.";
        });
        box.addEventListener("dragover", (e) => e.preventDefault());
        box.addEventListener("drop", (e) => { e.preventDefault(); const f = [...e.dataTransfer.files].filter((x) => x.type.startsWith("image/")); if (f.length) save(f); });
      };
      render();
    },
  };
  window.Pics = Pics;
})();
