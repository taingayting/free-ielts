// Study content written for this site: exam guide, strategies, speaking questions, starter words.
window.CONTENT = {};

/* ------------------------------------------------------------------ */
/* Exam guide. Each section: { id, title, html }                       */
/* ------------------------------------------------------------------ */
CONTENT.guide = [
  {
    id: "overview",
    title: "1. How the exam works",
    html: `
<p>IELTS Academic has four parts. Listening, Reading and Writing are done together on one day (no breaks between them). Speaking is a face-to-face talk with an examiner, on the same day or up to a week before/after.</p>
<div class="table-wrap"><table class="tbl">
<tr><th>Part</th><th>Time</th><th>What you do</th></tr>
<tr><td class="skill-L"><span class="skill-tag">Listening</span></td><td>about 30 min (+10 min to copy answers on paper, or 2 min check on computer)</td><td>4 recordings, 40 questions. You hear each recording <b>once</b>.</td></tr>
<tr><td class="skill-R"><span class="skill-tag">Reading</span></td><td>60 min (no extra time)</td><td>3 long passages, 40 questions. Passages get harder.</td></tr>
<tr><td class="skill-W"><span class="skill-tag">Writing</span></td><td>60 min</td><td>Task 1: describe a chart/map/process, 150+ words (~20 min).<br>Task 2: essay, 250+ words (~40 min). Task 2 is worth <b>twice</b> as much.</td></tr>
<tr><td class="skill-S"><span class="skill-tag">Speaking</span></td><td>11–14 min</td><td>Part 1: short questions about you. Part 2: talk 2 minutes about a topic card (1 min to prepare). Part 3: deeper discussion.</td></tr>
</table></div>
<h3>How the score works</h3>
<ul>
<li>Each skill gets a band from 0 to 9 (in half bands, e.g. 6.5).</li>
<li>Listening and Reading: 1 mark per question, out of 40. The site converts your raw score to a band automatically.</li>
<li>Your <b>overall band</b> is the average of the four, rounded to the nearest half band (6.25 → 6.5, 6.75 → 7.0, 6.1 → 6.0).</li>
<li>Rough targets: Band 6 needs about 23/40 in Reading and 23/40 in Listening; Band 6.5 about 27/40 Reading and 26/40 Listening; Band 7 needs 30/40 in both.</li>
</ul>
<h3>The most important habit</h3>
<p>Do every practice test <b>with a timer</b>, then spend just as long <b>reviewing your mistakes</b>. Use the audioscript to find exactly where the answer was, and why you missed it. That review is where most of the improvement comes from.</p>`,
  },
  {
    id: "listening",
    title: "2. Listening strategies",
    html: `
<h3>Format</h3>
<ul>
<li><b>Part 1</b>: everyday conversation (booking, enquiry). Mostly form/note completion: names, numbers, dates. Easiest marks: don't lose them.</li>
<li><b>Part 2</b>: one speaker, everyday topic (a tour, a facility). Often map labelling and multiple choice.</li>
<li><b>Part 3</b>: 2–4 people in an academic situation (students and tutor). Matching and multiple choice: the hardest part for most people.</li>
<li><b>Part 4</b>: a lecture. 10 gap-fill notes in a row, with no break in the middle.</li>
</ul>
<h3>Before each part: read ahead</h3>
<ul>
<li>Use the pause before each part to read the questions. <b>Underline key words</b> and guess what type of word is missing (number? noun? plural?).</li>
<li>Read the word limit: "ONE WORD ONLY" means "<i>the</i> garden" is wrong. "ONE WORD AND/OR A NUMBER" allows "3 rooms".</li>
<li>Answers come <b>in order</b>. If you miss one, let it go and listen for the next. Don't panic and lose three.</li>
</ul>
<h3>Common traps (distractors)</h3>
<ul>
<li>Speakers change their mind: "Tuesday... oh no, actually Wednesday is better." The <b>last</b> answer counts.</li>
<li>Words you hear are often <b>not</b> the answer. In multiple choice, all three options are usually mentioned, and two of them get rejected.</li>
<li>Paraphrase: the question says "inexpensive", the speaker says "it won't cost much".</li>
</ul>
<h3>Spelling and numbers</h3>
<ul>
<li>Spelling must be correct. British and American spelling are both accepted (colour/color).</li>
<li>Learn the alphabet sounds well (A/E/I, G/J, B/V/P). Names are spelled letter by letter in Part 1.</li>
<li>Practise numbers: 13 vs 30, 15 vs 50, phone numbers ("double five" = 55), dates (write "14 March" or "March 14").</li>
<li>Check plurals: if it's "two <u>&nbsp;&nbsp;</u>", the answer is plural.</li>
<li>Capital letters don't matter: you may write everything in CAPITALS.</li>
</ul>
<h3>How to review a listening test (very important)</h3>
<ol>
<li>Mark your answers on this site.</li>
<li>Open the <b>audioscript</b> (button after you submit) and listen again while reading.</li>
<li>For every mistake, find the sentence with the answer. Write in your mistake notebook <b>why</b> you missed it: spelling, didn't hear, fell for the distractor, didn't understand the paraphrase.</li>
<li>Listen to hard parts 2–3 more times without the script (this is called "shadowing" if you repeat along with the speaker).</li>
</ol>`,
  },
  {
    id: "reading",
    title: "3. Reading strategies",
    html: `
<h3>Time</h3>
<p>60 minutes, 3 passages, and <b>no extra time</b> to copy answers. Aim for about <b>17 + 20 + 23 minutes</b>. Passage 3 is the hardest. If one question takes more than 2 minutes, guess and move on: there's no penalty for wrong answers, so <b>never leave a box empty</b>.</p>
<h3>General method</h3>
<ol>
<li>Skim the passage for 2–3 minutes: title, first sentence of each paragraph. What is each paragraph about?</li>
<li>Read the questions, underline key words, especially names, numbers and dates that are easy to find (scanning).</li>
<li>Find the place in the text, then read those 2–3 sentences <b>carefully</b>. Most answers are a paraphrase, not the same words.</li>
</ol>
<h3>Question types</h3>
<p>Free official samples of every question type: <a href="https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test" target="_blank" rel="noopener">IELTS.org sample test questions</a>.</p>
<div id="sampleTaskLinks"></div>
<h4>True / False / Not Given (and Yes / No / Not Given)</h4>
<ul>
<li><b>TRUE</b>: the text says the same thing (in different words).</li>
<li><b>FALSE</b>: the text says the <b>opposite</b>.</li>
<li><b>NOT GIVEN</b>: the text doesn't say anything about it. Don't use your own knowledge!</li>
<li>Watch small words: <i>all / some / only / always / never / most</i>. These often turn TRUE into FALSE or NOT GIVEN.</li>
<li>Answers are in passage order.</li>
</ul>
<h4>Matching headings</h4>
<ul>
<li>Read the paragraph first, then choose the heading that sums up the <b>main idea</b>, not just one detail.</li>
<li>Do the easy paragraphs first and cross off used headings. There are always extra headings.</li>
</ul>
<h4>Matching information / features / sentence endings</h4>
<ul>
<li>"Which paragraph contains...": these are <b>not</b> in order and some paragraphs may be used twice. Do them last.</li>
<li>Sentence endings: the ending must fit grammatically <b>and</b> match the meaning in the text.</li>
</ul>
<h4>Completion (summary, notes, table, flow-chart, sentence, diagram)</h4>
<ul>
<li>Check the word limit ("NO MORE THAN TWO WORDS"). Breaking it = wrong.</li>
<li>Copy words exactly from the passage (spelling!). Predict the word type before you look.</li>
<li>Summaries with a word list (A–J): the words in the box usually are <b>not</b> in the text. Look for synonyms.</li>
</ul>
<h4>Multiple choice</h4>
<ul>
<li>Find the place in the text first, then check each option against it. Wrong options often use words from the text but change the meaning.</li>
</ul>
<h3>Build reading speed</h3>
<ul>
<li>Read one English article a day (science, history, environment: the usual IELTS topics).</li>
<li>Collect new words in the Vocabulary page, with your Khmer meaning.</li>
</ul>`,
  },
  {
    id: "writing1",
    title: "4. Writing Task 1 (charts, maps, processes)",
    html: `
<p>At least <b>150 words</b> in about <b>20 minutes</b>. You describe what you see. <b>No opinions</b> and no reasons that aren't shown.</p>
<h3>Four-paragraph structure</h3>
<ol>
<li><b>Introduction (1 sentence)</b>: paraphrase the question. <i>"The bar chart compares the number of visitors to three museums in London between 2010 and 2020."</i></li>
<li><b>Overview (2 sentences)</b>: the main trends or biggest differences, no numbers. <i>"Overall, the Science Museum was the most popular throughout the period, while visits to the other two fell."</i> <b>Without an overview you cannot get above Band 5 for Task Achievement.</b></li>
<li><b>Body 1</b>: details for one group of data, with numbers.</li>
<li><b>Body 2</b>: details for the other group, with comparisons.</li>
</ol>
<h3>Useful language</h3>
<ul>
<li>Up: <i>rose, increased, grew, climbed, a rise / an increase of 20%</i></li>
<li>Down: <i>fell, decreased, declined, dropped, a fall / a decline</i></li>
<li>No change: <i>remained stable / steady at, levelled off</i></li>
<li>How much: <i>slightly, gradually, steadily, sharply, dramatically</i></li>
<li>Compare: <i>twice as high as, slightly lower than, the highest/lowest, whereas, while, compared with</i></li>
<li>Numbers: <i>just over a quarter, nearly half, approximately 40%, a peak of 300</i></li>
</ul>
<h3>Maps</h3>
<p>Describe changes over time: <i>"The trees were cut down to make way for a car park." "A new road was built to the north of the village."</i> Use the passive and location words (north of, next to, opposite).</p>
<h3>Processes</h3>
<p>Say how many stages, where it starts and ends (overview). Use passive and sequence words: <i>first, then, after that, once..., finally.</i></p>`,
  },
  {
    id: "writing2",
    title: "5. Writing Task 2 (essay)",
    html: `
<p>At least <b>250 words</b> in about <b>40 minutes</b>. Task 2 counts <b>double</b> Task 1, so many people do Task 2 first.</p>
<h3>Five question types</h3>
<ul>
<li><b>Opinion</b>: "To what extent do you agree or disagree?" Give a clear position and keep it in every paragraph.</li>
<li><b>Discussion</b>: "Discuss both views and give your own opinion." One paragraph per view, plus your opinion (intro and conclusion).</li>
<li><b>Advantages / disadvantages</b>: "Do the advantages outweigh the disadvantages?" Must say which is bigger.</li>
<li><b>Problem / solution</b> (or cause / solution).</li>
<li><b>Two-part question</b>: answer <b>both</b> questions.</li>
</ul>
<h3>Plan for 5 minutes, write for 30, check for 5</h3>
<ol>
<li><b>Introduction (2 sentences)</b>: paraphrase the topic + your answer/thesis.</li>
<li><b>Body 1 and Body 2</b>: topic sentence → explanation → example → link back to the question. One main idea per paragraph, developed well, is better than many ideas listed.</li>
<li><b>Conclusion (1–2 sentences)</b>: repeat your position in new words. No new ideas.</li>
</ol>
<h3>How it is marked (each 25%)</h3>
<ul>
<li><b>Task Response</b>: answer all parts of the question, clear position, ideas extended and supported.</li>
<li><b>Coherence &amp; Cohesion</b>: logical paragraphs, linking words used naturally (not one at the start of every sentence).</li>
<li><b>Lexical Resource</b>: range of vocabulary, collocations, correct spelling and word forms.</li>
<li><b>Grammatical Range &amp; Accuracy</b>: mix of simple and complex sentences (if/although/which/who) with few errors.</li>
</ul>
<h3>Common mistakes that cost bands</h3>
<ul>
<li>Writing about the general topic instead of the exact question.</li>
<li>Memorised template sentences that don't fit. Examiners notice.</li>
<li>Under 250 words (penalised), or far too long with more errors.</li>
<li>Informal style: avoid "don't", "lots of", "stuff", questions to the reader.</li>
<li>Article and plural errors (<i>the</i> / <i>a</i>, "many informations" ✗). Re-read for these in your last 5 minutes.</li>
</ul>
<h3>Linking words</h3>
<p><i>Firstly, Furthermore, In addition, However, On the other hand, Nevertheless, For example, For instance, As a result, Therefore, Consequently, In conclusion.</i></p>`,
  },
  {
    id: "speaking",
    title: "6. Speaking",
    html: `
<h3>The three parts</h3>
<ul>
<li><b>Part 1 (4–5 min)</b>: easy questions about home, work/study, hobbies. Answer in 2–3 sentences: answer + reason + small example. Not just "yes".</li>
<li><b>Part 2 (3–4 min)</b>: topic card. <b>1 minute</b> to make notes, then talk for <b>up to 2 minutes</b>. Keep going until the examiner stops you.</li>
<li><b>Part 3 (4–5 min)</b>: abstract questions linked to Part 2 (society, the future, comparing). Give opinions with reasons and examples.</li>
</ul>
<h3>How it is marked</h3>
<p>Fluency &amp; coherence, vocabulary, grammar, and pronunciation (25% each). An accent is fine; being <b>clear</b> is what matters.</p>
<h3>Tips</h3>
<ul>
<li>It's OK to ask: "Could you repeat the question, please?"</li>
<li>Buy time naturally: "That's an interesting question... I'd say..."</li>
<li>Part 2 notes: write 4–5 key words (who / what / when / why / how you felt), not sentences.</li>
<li>Use different tenses: past experiences, present habits, future plans, "If I could...".</li>
<li>Practise by <b>recording yourself</b> on the Speaking page and listening back: count "umm"s, check you used varied words.</li>
</ul>`,
  },
  {
    id: "testday",
    title: "7. Test day checklist",
    html: `
<ul>
<li>Bring the same passport / ID you used to register.</li>
<li>Sleep well the night before. Don't do a full mock test the day before: just light review.</li>
<li>Arrive early. Know if you are doing the test on paper or on computer.</li>
<li>Listening on paper: you get 10 minutes at the end to copy answers. Check spelling and plurals then.</li>
<li>Reading: write answers <b>directly</b> as you go. There's no extra time.</li>
<li>Writing: watch the clock. Leave Task 1 at 20 minutes even if it isn't perfect.</li>
<li>Never leave a Listening or Reading answer empty: guess.</li>
<li>In Speaking, smile, relax and talk. The examiner wants to hear you speak.</li>
</ul>`,
  },
];

/* ------------------------------------------------------------------ */
/* Writing self-check (based on the four public marking criteria)      */
/* ------------------------------------------------------------------ */
CONTENT.writingChecklist = {
  1: [
    "I paraphrased the question in the introduction (didn't copy it)",
    "I wrote a clear overview of the main trends / differences",
    "I included accurate numbers / details to support the overview",
    "I compared data, not just listed it",
    "I did not give opinions or reasons not shown in the chart",
    "My paragraphs are logical (intro, overview, 2 body paragraphs)",
    "I used a range of trend / comparison language",
    "I checked tenses (past data → past tense) and articles",
    "150 words or more",
  ],
  2: [
    "I answered every part of the question",
    "My position / opinion is clear from the introduction to the conclusion",
    "Each body paragraph has one main idea with explanation + example",
    "I used linking words naturally (not at the start of every sentence)",
    "I used topic vocabulary and collocations, not repeated the same words",
    "I used a mix of simple and complex sentences",
    "I checked spelling, plurals, articles and subject-verb agreement",
    "My style is formal (no contractions, no slang)",
    "250 words or more",
  ],
};

/* ------------------------------------------------------------------ */
/* Speaking question bank (own questions, typical IELTS topics)        */
/* ------------------------------------------------------------------ */
CONTENT.speaking = {
  part1: [
    { topic: "Home / where you live", qs: ["Do you live in a house or an apartment?", "What do you like most about your home?", "Is there anything you would like to change about it?", "Do you plan to live there for a long time?"] },
    { topic: "Hometown", qs: ["Where is your hometown?", "What is it famous for?", "How has it changed in recent years?", "Would you recommend it to visitors? Why?"] },
    { topic: "Work or study", qs: ["Do you work or are you a student?", "Why did you choose that subject / job?", "What do you enjoy most about it?", "What would you like to do in the future?"] },
    { topic: "Daily routine", qs: ["What is your daily routine like?", "Which part of the day do you like most?", "Do you prefer mornings or evenings?", "Has your routine changed recently?"] },
    { topic: "Food", qs: ["What kind of food do you like?", "Do you prefer eating at home or in restaurants?", "Can you cook?", "Is there any food you didn't like as a child but like now?"] },
    { topic: "Weather", qs: ["What's the weather like where you live?", "What's your favourite season? Why?", "Does the weather affect your mood?", "Do you check the weather forecast?"] },
    { topic: "Reading", qs: ["Do you like reading?", "What kind of things do you read?", "Do you prefer paper books or e-books?", "Did you read a lot as a child?"] },
    { topic: "Music", qs: ["What kind of music do you like?", "When do you usually listen to music?", "Have you ever learned to play an instrument?", "Is traditional music popular in your country?"] },
    { topic: "Mobile phones", qs: ["How often do you use your phone?", "What do you mainly use it for?", "Could you live without your phone for a week?", "Do you think children should have phones?"] },
    { topic: "Friends", qs: ["Do you have many friends?", "How do you usually spend time with friends?", "Is it easy to make new friends where you live?", "Are online friends real friends?"] },
    { topic: "Transport", qs: ["How do you usually travel around?", "Is public transport good in your city?", "Do you like travelling by bus?", "How will transport change in the future?"] },
    { topic: "Holidays", qs: ["Where did you go on your last holiday?", "Do you prefer relaxing holidays or active ones?", "Who do you usually travel with?", "Where would you like to go next?"] },
    { topic: "Shopping", qs: ["Do you enjoy shopping?", "Do you prefer shopping online or in shops?", "What was the last thing you bought?", "Are there markets near your home?"] },
    { topic: "Sport and exercise", qs: ["Do you play any sports?", "How do you keep fit?", "Did you do sport at school?", "Is it important for children to do sport?"] },
    { topic: "Sleep", qs: ["How many hours do you usually sleep?", "Do you take naps during the day?", "What do you do if you can't sleep?", "Do you think people sleep less nowadays?"] },
  ],
  part2: [
    { card: "Describe a person who has helped you a lot.", points: ["who this person is", "how you know them", "how they helped you", "and explain why their help was important to you"], part3: ["Who should help young people more: families or teachers?", "Why do some people find it difficult to ask for help?", "Do people help each other less than in the past?"] },
    { card: "Describe a place you visited that you really liked.", points: ["where it is", "when you went there", "what you did there", "and explain why you liked it"], part3: ["Why do people like travelling?", "How does tourism affect local people?", "Will people travel more or less in the future?"] },
    { card: "Describe a skill you would like to learn.", points: ["what the skill is", "how you would learn it", "how difficult it would be", "and explain why you want to learn it"], part3: ["Which skills are most important for young people today?", "Is it better to learn from a teacher or online?", "Do older people find it harder to learn new skills?"] },
    { card: "Describe a book or film that made you think.", points: ["what it was", "when you read/watched it", "what it was about", "and explain why it made you think"], part3: ["Why do people still read books?", "Should films be used in education?", "How has technology changed the way people enjoy stories?"] },
    { card: "Describe a time you were very busy.", points: ["when it was", "what you had to do", "how you managed your time", "and explain how you felt"], part3: ["Why are people busier today than before?", "Is it important to have free time?", "How can companies help workers with stress?"] },
    { card: "Describe an important decision you made.", points: ["what the decision was", "when you made it", "how you made it", "and explain why it was important"], part3: ["Should parents make decisions for teenagers?", "Do people make better decisions alone or in groups?", "What important decisions do young people face?"] },
    { card: "Describe a piece of technology you use every day.", points: ["what it is", "when you started using it", "what you use it for", "and explain how your life would be different without it"], part3: ["Has technology made life easier or more complicated?", "Do older people have problems with new technology?", "Should children learn coding at school?"] },
    { card: "Describe a festival or celebration in your country.", points: ["what it is", "when it happens", "what people do", "and explain why it is important"], part3: ["Why are traditional festivals important?", "Are festivals becoming more commercial?", "Should children learn about other countries' festivals?"] },
    { card: "Describe a teacher you remember well.", points: ["who the teacher was", "what subject they taught", "what they were like", "and explain why you remember them"], part3: ["What makes a good teacher?", "Will computers replace teachers?", "Should teachers be paid more?"] },
    { card: "Describe a goal you want to achieve in the future.", points: ["what the goal is", "when you set it", "what you are doing to reach it", "and explain why it matters to you"], part3: ["Is it important to set goals?", "Why do some people give up on their goals?", "Do young people today have different goals from their parents?"] },
    { card: "Describe a park or garden you like.", points: ["where it is", "what it looks like", "what people do there", "and explain why you like it"], part3: ["Why are green spaces important in cities?", "Should the government spend more on parks?", "How can cities become more environmentally friendly?"] },
    { card: "Describe a time you helped someone.", points: ["who you helped", "what the situation was", "how you helped", "and explain how you felt afterwards"], part3: ["Why do people volunteer?", "Should schools make students do community work?", "Is helping others a duty or a choice?"] },
    { card: "Describe a meal you enjoyed with other people.", points: ["what you ate", "who you ate with", "where it was", "and explain why you enjoyed it"], part3: ["How have eating habits changed in your country?", "Is fast food a problem?", "Why do families eat together less nowadays?"] },
    { card: "Describe something you bought that you were happy with.", points: ["what it was", "where you bought it", "why you bought it", "and explain why you were happy with it"], part3: ["Do advertisements influence what people buy?", "Is online shopping better than shopping in stores?", "Do people buy too many things today?"] },
    { card: "Describe a time you learned something from a mistake.", points: ["what the mistake was", "when it happened", "what happened next", "and explain what you learned"], part3: ["Should children be allowed to make mistakes?", "Why are some people afraid of failure?", "How should managers respond to employees' mistakes?"] },
  ],
};

/* ------------------------------------------------------------------ */
/* Starter vocabulary: common academic / IELTS-topic words             */
/* ------------------------------------------------------------------ */
CONTENT.starterVocab = [
  ["significant", "large or important enough to notice", "There was a significant increase in sales."],
  ["decline", "to become smaller or worse; a fall", "The number of visitors declined after 2015."],
  ["fluctuate", "to go up and down often", "Prices fluctuated throughout the year."],
  ["approximately", "about, not exactly", "Approximately 40% of students live on campus."],
  ["proportion", "a part of a total", "A large proportion of the budget goes on health."],
  ["consequence", "a result, often a bad one", "Pollution is one consequence of rapid growth."],
  ["benefit", "an advantage; to be helped by something", "Students benefit from smaller classes."],
  ["drawback", "a disadvantage", "The main drawback is the cost."],
  ["sustainable", "able to continue without damaging the environment", "We need more sustainable sources of energy."],
  ["urban", "of a city or town", "Urban areas are becoming more crowded."],
  ["rural", "of the countryside", "Many young people leave rural areas for jobs."],
  ["infrastructure", "basic systems like roads, water, power", "The government invested in infrastructure."],
  ["contribute", "to help cause something; to give", "Cars contribute to air pollution."],
  ["essential", "absolutely necessary", "Water is essential for life."],
  ["tend to", "to usually do something", "Older people tend to prefer newspapers."],
  ["crucial", "extremely important", "Sleep is crucial for memory."],
  ["evidence", "facts that show something is true", "There is little evidence that the drug works."],
  ["hypothesis", "an idea that scientists test", "The results supported the hypothesis."],
  ["phenomenon", "something that happens and can be studied (plural: phenomena)", "Climate change is a global phenomenon."],
  ["decade", "a period of ten years", "Prices doubled over the last decade."],
  ["habitat", "the natural home of an animal or plant", "Forests are the habitat of many species."],
  ["species", "a group of animals or plants of the same type", "Several species are now endangered."],
  ["emission", "gas or other substance sent into the air", "Carbon emissions must be reduced."],
  ["renewable", "can be replaced naturally (sun, wind)", "Renewable energy is becoming cheaper."],
  ["obesity", "being very overweight", "Childhood obesity is rising in many countries."],
  ["sedentary", "involving a lot of sitting, little exercise", "Office work is often sedentary."],
  ["curriculum", "the subjects taught at a school", "Coding is now part of the curriculum."],
  ["acquire", "to get or learn", "Children acquire languages quickly."],
  ["globalisation", "the world becoming more connected through trade and culture", "Globalisation has changed local businesses."],
  ["heritage", "traditions and buildings from the past", "The city protects its cultural heritage."],
  ["affordable", "cheap enough to buy", "Housing is no longer affordable for young people."],
  ["commute", "to travel to work or school regularly", "I commute for an hour every day."],
  ["congestion", "too much traffic", "Traffic congestion is a problem in big cities."],
  ["inevitable", "certain to happen", "Some job losses are inevitable."],
  ["detrimental", "harmful", "Too much screen time can be detrimental to health."],
  ["advocate", "to publicly support an idea", "Some experts advocate a four-day week."],
  ["alleviate", "to make a problem less bad", "New roads could alleviate traffic."],
  ["enhance", "to improve", "Technology can enhance learning."],
  ["implement", "to put a plan into action", "The policy was implemented in 2020."],
  ["mitigate", "to reduce the harm of something", "Trees help mitigate flooding."],
  ["exacerbate", "to make a bad situation worse", "Drought exacerbated the food shortage."],
  ["predominantly", "mainly", "The workforce is predominantly young."],
  ["whereas", "used to compare two different facts", "Men preferred sport, whereas women chose music."],
  ["nevertheless", "despite that", "It was expensive. Nevertheless, it sold well."],
  ["subsequently", "after that", "He studied law and subsequently became a judge."],
  ["peak", "the highest point; to reach the highest point", "Sales peaked at 500 in July."],
  ["plummet", "to fall very quickly", "Profits plummeted in 2009."],
  ["surge", "a sudden large increase", "There was a surge in online shopping."],
];

/* ------------------------------------------------------------------ */
/* Study plan: first-week learning tasks before full tests             */
/* ------------------------------------------------------------------ */
CONTENT.planIntro = [
  { text: "Read: How the exam works", link: "#/guide/overview" },
  { text: "Read: Listening strategies", link: "#/guide/listening" },
  { text: "Read: Reading strategies + try 2 sample question types", link: "#/guide/reading" },
  { text: "Read: Writing Task 1 guide", link: "#/guide/writing1" },
  { text: "Read: Writing Task 2 guide", link: "#/guide/writing2" },
  { text: "Read: Speaking guide", link: "#/guide/speaking" },
];
