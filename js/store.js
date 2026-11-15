// Everything you do is saved in this browser (localStorage).
// Use Settings -> "Download backup" to keep a copy or move it to another computer.
(function () {
  const KEY = "ielts-prep.v1";

  const empty = () => ({
    settings: { examDate: "", targetBand: 6.5, planStart: "", theme: "" },
    attempts: [],   // finished Listening/Reading tests
    mistakes: [],   // wrong answers, for the mistake notebook
    essays: [],     // writing practice
    speaking: [],   // speaking sessions (time only; recordings are not stored)
    vocab: [],      // your word list
    planDone: {},   // ticked study-plan tasks
    drafts: {},     // unfinished tests, so a refresh doesn't lose answers
  });

  let state;
  try {
    state = Object.assign(empty(), JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch (e) {
    state = empty();
  }

  const listeners = [];
  function save(quiet) {
    if (!quiet) state.savedAt = Date.now(); // sync.js uses this to know which device has the newest progress
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not save", e);
    }
    if (!quiet) listeners.forEach((fn) => { try { fn(); } catch (e) {} });
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  window.Store = {
    get: () => state,
    save,
    uid,
    update(fn) { fn(state); save(); },
    exportJSON: () => JSON.stringify(state, null, 1),
    importJSON(text) {
      const data = JSON.parse(text);
      if (typeof data !== "object" || !data.settings) throw new Error("This is not a backup file from this site.");
      state = Object.assign(empty(), data);
      save();
    },
    reset() { state = empty(); save(); },
    /** call fn after every change (used by sync.js) */
    onChange(fn) { listeners.push(fn); },
    /** replace everything with progress from another device (keeps its savedAt) */
    replace(data) { state = Object.assign(empty(), data); save(true); },
  };
})();
