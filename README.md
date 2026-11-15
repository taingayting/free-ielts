# Free IELTS Prep

**A free IELTS Academic study app for students who cannot pay for expensive courses.**

👉 **Use it free:** https://taingayting.github.io/free-ielts/
No sign-up. No ads. Works on a laptop or a phone.

Made by [Taing Ayting](https://taingayting.github.io/portfolio/).

---

## Why I built it

I am from Cambodia, and I prepared for the IELTS Academic exam while working full-time. I looked for a free app that had everything I needed in one place: a study plan, practice, vocabulary, writing help and speaking practice. I could not find one. The good ones cost money, and many students in Cambodia cannot pay for them.

So I built my own app and used it every day before my exam. Then I made this free public edition, so other students can use it too.

## Why it matters

- **IELTS opens doors**: study abroad, scholarships and better jobs. But preparation is expensive.
- **Free and private.** No account and no server. Your work stays in your own browser.
- **Made for learners like me.** Simple English, and a space to write the meaning of each word in Khmer (or your own language).
- **It respects copyright.** It contains no Cambridge books, tests or audio. For full practice tests, it links to free official tests.

## What is inside (the core)

| Part | What you can do |
| :--- | :--- |
| 📅 **Study plan** | Enter your exam date. The app makes a day-by-day plan and counts down. |
| 🎧 **Listening** and 📖 **Reading** | Links to free official practice tests (IELTS.org, British Council, IDP). Log your score and the app turns it into a band. |
| ✍️ **Writing** | A timed editor with a word count and a self-check list. Every Task 1 and Task 2 type with a plan and a model answer. |
| 🗣️ **Speaking** | Part 1 questions, Part 2 cue cards with the real 1 + 2 minute timer, and a voice recorder so you can listen to yourself. |
| 🃏 **Vocabulary** | 330+ words in 11 decks: 3 levels (band 5 to 7+) and topics like environment, education, technology and health. Flashcards with spaced review, pronunciation, and a space for your own meaning. |
| 📐 **Grammar** | 15 lessons with exercises, for the mistakes learners make most. |
| 🧭 **Exam guide** | How each part of the test works, and tips. |
| 📈 **Progress** | Your scores and study days over time. |
| 🤖 **AI tutor (optional)** | Ask questions in simple English. Use Google Gemini with a free key, or Ollama on your own laptop (offline). |

## How to use it

1. Open https://taingayting.github.io/free-ielts/.
2. Go to **Plan** and enter your exam date.
3. Each day, follow the plan: vocabulary, grammar, writing and speaking.
4. For Listening and Reading, open a free official test, do it, then **log your score** in the app.
5. Go to **Settings → Download backup** sometimes, so you never lose your progress.

**On a phone:** open the link, then choose **Add to Home Screen**. It opens like a normal app.

## One hard decision I made

**No server and no accounts.** A server would let me sync between devices, but it costs money every month and means keeping other people's data safe. I chose to save everything in the student's own browser, with a backup file they can download. So the app is free forever, and private.

## Tools I used

| Part | Tool |
| :--- | :--- |
| Languages | HTML, CSS and plain JavaScript (no framework, no build step) |
| Saving | localStorage for progress, IndexedDB for flashcard pictures |
| Speaking | MediaRecorder (record your voice in the browser) |
| Pronunciation | Free Dictionary API (real recordings), the browser's voice when offline |
| AI tutor | Google Gemini API or Ollama, streamed answers |
| App on phone | Web app manifest (Add to Home Screen) |
| Hosting | GitHub Pages (free) |
| Building | I designed the app and its features from my own study needs, and built it with AI coding tools (Claude). The lessons and word lists were written for this app with AI help. |

## Files

| File | What it does |
| :--- | :--- |
| `index.html` | The page and the menu |
| `js/app.js` | The main app: pages, plan, writing, speaking, settings |
| `js/store.js` | Saves your progress in the browser |
| `js/vocab-data.js` | The vocabulary decks |
| `js/grammar-data.js` | The grammar lessons |
| `js/writing-types.js` | Task 1 and Task 2 types with model answers |
| `js/grade.js` | Turns a score into a band |
| `js/pron.js` | Word pronunciation |
| `js/ai.js` | The optional AI tutor |
| `css/style.css` | The design |

## Run it on your computer

No install needed. Download this repository, then open `index.html` in your browser.
Or run a small local server:

```
python -m http.server 8000
```

Then open http://localhost:8000.

## Copyright

This edition contains no Cambridge IELTS books, tests or audio. "IELTS" is a trademark of its owners. This app is not connected to them.
