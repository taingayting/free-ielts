// Grammar lessons for IELTS. Each exercise: { q: "sentence with ___", a: ["accepted answer", ...], opts?: [...choices] }
window.GRAMMAR = [
  {
    id: "tenses", title: "Present tenses: simple, continuous, perfect", level: "Must know",
    why: "Speaking Part 1 (habits), Writing Task 2 (general truths), and Task 1 when there is no date.",
    html: `
<table class="tbl">
<tr><th>Tense</th><th>Form</th><th>Use</th><th>Example</th></tr>
<tr><td>Present simple</td><td>I work / she work<b>s</b></td><td>habits, facts, general truths</td><td>Many people <b>work</b> from home. Water <b>boils</b> at 100°C.</td></tr>
<tr><td>Present continuous</td><td>am / is / are + -ing</td><td>now, temporary, changing trends</td><td>More people <b>are moving</b> to cities.</td></tr>
<tr><td>Present perfect</td><td>have / has + past participle</td><td>from past until now; experience; no finished time</td><td>Technology <b>has changed</b> our lives. I <b>have lived</b> here for 5 years.</td></tr>
</table>
<p><b>Key rule:</b> he / she / it / one person / an uncountable noun → verb + <b>s</b>: <i>The government <u>spends</u>… Technology <u>helps</u>… Everyone <u>knows</u>…</i></p>
<p><b>for / since</b> with present perfect: <i>for</i> + period (for ten years), <i>since</i> + start point (since 2015).</p>`,
    mistakes: ["She work in a bank. → She <b>works</b> in a bank.", "I am living here since 2019. → I <b>have lived</b> here since 2019.", "Nowadays more people uses phones. → more people <b>use</b>"],
    ex: [
      { q: "Water ___ (freeze) at 0°C.", a: ["freezes"] },
      { q: "My brother ___ (study) medicine at the moment.", a: ["is studying"] },
      { q: "I ___ (live) in Phnom Penh since 2018.", a: ["have lived", "have been living"] },
      { q: "Nowadays, more and more people ___ (shop) online.", a: ["shop", "are shopping"] },
      { q: "The internet ___ (change) the way we communicate in recent years.", a: ["has changed"] },
      { q: "Everyone ___ (need) clean water.", a: ["needs"] },
    ],
  },
  {
    id: "past", title: "Past tenses and Task 1 dates", level: "Must know",
    why: "Writing Task 1: if the chart shows past years (2000–2020), use past tenses. Speaking Part 2 stories.",
    html: `
<ul>
<li><b>Past simple</b> (finished time): <i>In 2010, sales <b>rose</b> to 300.</i></li>
<li><b>Past continuous</b> (background action): <i>I <b>was studying</b> when she called.</i></li>
<li><b>Past perfect</b> (before another past time): <i>By 2020, the number <b>had doubled</b>.</i></li>
<li><b>Future in Task 1</b> (predictions): <i>The figure <b>is expected to / is predicted to</b> reach 50% by 2030.</i></li>
</ul>
<p>Learn irregular verbs used in charts: rise–<b>rose</b>–risen, fall–<b>fell</b>–fallen, grow–<b>grew</b>–grown, become–became–become, reach–reached.</p>`,
    mistakes: ["In 2005 the number rise to 40. → <b>rose</b>", "The price was fall sharply. → The price <b>fell</b> sharply.", "By 2010 it has doubled. → By 2010 it <b>had doubled</b>."],
    ex: [
      { q: "In 1990, the number of cars ___ (rise) to 2 million.", a: ["rose"] },
      { q: "Between 2000 and 2010, sales ___ (fall) by half.", a: ["fell"] },
      { q: "By 2015, the population ___ (double).", a: ["had doubled"] },
      { q: "I ___ (walk) home when it started to rain.", a: ["was walking"] },
      { q: "The figure is expected ___ (reach) 70% by 2040.", a: ["to reach"] },
      { q: "Last year, I ___ (go) to Siem Reap with my family.", a: ["went"] },
    ],
  },
  {
    id: "sva", title: "Subject–verb agreement", level: "Must know",
    why: "One of the most common errors that limits Grammar to band 5–6.",
    html: `
<p>The verb must match the <b>main noun</b> of the subject, not the nearest noun.</p>
<ul>
<li><i>The <u>number</u> of students <b>is</b> increasing.</i> (the number = singular)</li>
<li><i>A <u>number</u> of students <b>are</b> absent.</i> (a number of = many → plural)</li>
<li><i>The <u>quality</u> of the roads <b>has</b> improved.</i></li>
<li><i><u>Each</u> / <u>every</u> student <b>has</b>…</i>; <i><u>Everyone</u> <b>is</b>…</i></li>
<li>Uncountable nouns are singular: <i>information <b>is</b>, advice <b>is</b>, money <b>is</b>, research <b>shows</b>.</i></li>
<li>-ing subject is singular: <i><u>Reading</u> books <b>improves</b> vocabulary.</i></li>
</ul>`,
    mistakes: ["The number of cars are rising. → <b>is</b> rising", "People is worried. → People <b>are</b> worried.", "The information are useful. → <b>is</b>"],
    ex: [
      { q: "The number of tourists ___ (has / have) grown.", a: ["has"], opts: ["has", "have"] },
      { q: "A number of problems ___ (was / were) reported.", a: ["were"], opts: ["was", "were"] },
      { q: "Playing video games ___ (help / helps) some children relax.", a: ["helps"], opts: ["help", "helps"] },
      { q: "The advice he gave me ___ (was / were) very useful.", a: ["was"], opts: ["was", "were"] },
      { q: "Children in this area ___ (need / needs) more parks.", a: ["need"], opts: ["need", "needs"] },
      { q: "Every student ___ (has / have) a laptop.", a: ["has"], opts: ["has", "have"] },
    ],
  },
  {
    id: "articles", title: "Articles: a, an, the, no article", level: "Must know",
    why: "Khmer has no articles, so this is often the most common error. Examiners notice it in every sentence.",
    html: `
<ul>
<li><b>a / an</b>: one singular countable thing, first mention, not specific: <i>I bought <b>a</b> phone.</i> (<b>an</b> before a vowel <i>sound</i>: an hour, an umbrella, a university)</li>
<li><b>the</b>: specific, already known, only one: <i>The phone I bought is broken. <b>The</b> government, <b>the</b> internet, <b>the</b> environment, <b>the</b> sun.</i></li>
<li><b>no article</b>: general plural or uncountable nouns: <i><b>Children</b> need <b>exercise</b>. <b>Technology</b> changes <b>education</b>.</i></li>
<li>In charts: <i><b>the</b> number of, <b>the</b> proportion of, <b>the</b> highest, <b>the</b> USA, <b>the</b> UK</i>, but <i>Japan, Cambodia, France</i> (no article).</li>
<li>Superlatives and ordinals always take <b>the</b>: <i>the most popular, the second year.</i></li>
</ul>
<p><b>Rule of thumb:</b> a singular countable noun can never stand alone. It needs a / an / the / my / this…: <i><s>Student should study.</s> → <b>A</b> student should study / Student<b>s</b> should study.</i></p>`,
    mistakes: ["Government should invest in education. → <b>The</b> government should…", "I am student. → I am <b>a</b> student.", "The money is not everything. → Money is not everything (general)."],
    ex: [
      { q: "___ government should build more hospitals. (A / The / –)", a: ["the"], opts: ["A", "The", "–"] },
      { q: "She wants to become ___ engineer. (a / an / the)", a: ["an"], opts: ["a", "an", "the"] },
      { q: "___ pollution is a serious problem in many cities. (The / –)", a: ["–", "-", ""], opts: ["The", "–"] },
      { q: "It was ___ most expensive car in the show. (a / the)", a: ["the"], opts: ["a", "the"] },
      { q: "I studied at ___ university in Japan. (a / an)", a: ["a"], opts: ["a", "an"] },
      { q: "___ number of visitors rose in 2010. (A / The)", a: ["the"], opts: ["A", "The"] },
    ],
  },
  {
    id: "count", title: "Countable and uncountable nouns", level: "Must know",
    why: "Wrong plurals (\"informations\", \"advices\") are very common in Writing.",
    html: `
<p><b>Uncountable</b> (no plural, no a/an, singular verb): information, advice, knowledge, research, equipment, furniture, evidence, traffic, money, homework, news, transport, accommodation, pollution, employment, luggage.</p>
<ul>
<li>Use <b>much / little / a great deal of / an amount of</b> with uncountable: <i>much information, a great deal of research.</i></li>
<li>Use <b>many / few / a number of</b> with countable plurals: <i>many people, a number of jobs.</i></li>
<li>To count: <i>a piece of advice, two pieces of equipment.</i></li>
<li>Charts: <i>the <b>amount</b> of water</i> (uncountable) vs <i>the <b>number</b> of people</i> (countable).</li>
</ul>`,
    mistakes: ["many informations → much information", "an advice → a piece of advice / some advice", "the number of water → the <b>amount</b> of water"],
    ex: [
      { q: "The chart shows the ___ of electricity used. (number / amount)", a: ["amount"], opts: ["number", "amount"] },
      { q: "There isn't ___ evidence for this idea. (much / many)", a: ["much"], opts: ["much", "many"] },
      { q: "Correct the word: \"Students need more informations.\" → informations should be ___", a: ["information"] },
      { q: "___ people drive to work. (Much / Many)", a: ["many"], opts: ["Much", "Many"] },
      { q: "The ___ of students rose. (number / amount)", a: ["number"], opts: ["number", "amount"] },
      { q: "She gave me some useful ___. (advice / advices)", a: ["advice"], opts: ["advice", "advices"] },
    ],
  },
  {
    id: "passive", title: "The passive voice", level: "Band 6+",
    why: "Essential for Task 1 processes and maps, and makes Task 2 sound academic.",
    html: `
<p><b>Form:</b> be (right tense) + past participle. Use it when the action is more important than who did it.</p>
<table class="tbl">
<tr><th>Tense</th><th>Passive</th></tr>
<tr><td>Present simple</td><td>The beans <b>are roasted</b> and then <b>ground</b>.</td></tr>
<tr><td>Past simple</td><td>A new road <b>was built</b> in 2005.</td></tr>
<tr><td>Present perfect</td><td>The trees <b>have been cut down</b>.</td></tr>
<tr><td>Modal</td><td>More money <b>should be spent</b> on schools.</td></tr>
</table>
<p>Useful Task 2 phrases: <i>It is often argued that… It is widely believed that… It has been suggested that…</i></p>`,
    mistakes: ["The water is heat to 100°C. → is <b>heated</b>", "A school was build. → was <b>built</b>", "Money should spend on… → should <b>be spent</b>"],
    ex: [
      { q: "First, the leaves ___ (pick) by hand. (process, present)", a: ["are picked"] },
      { q: "The old factory ___ (replace) by a park in 2010.", a: ["was replaced"] },
      { q: "Since 2000, many trees ___ (cut) down.", a: ["have been cut"] },
      { q: "More money should ___ (spend) on public transport.", a: ["be spent"] },
      { q: "It ___ (widely believe) that exercise reduces stress.", a: ["is widely believed"] },
      { q: "The mixture ___ (pour) into moulds and left to cool.", a: ["is poured"] },
    ],
  },
  {
    id: "relative", title: "Relative clauses (who, which, that, where)", level: "Band 6+",
    why: "Complex sentences raise your Grammatical Range score.",
    html: `
<ul>
<li><b>who</b> for people: <i>Students <b>who</b> work part-time learn useful skills.</i></li>
<li><b>which</b> for things: <i>Cars, <b>which</b> are expensive to run, …</i></li>
<li><b>that</b> for people or things (only without commas): <i>the book <b>that</b> I read</i></li>
<li><b>where</b> for places, <b>when</b> for times, <b>whose</b> for possession.</li>
<li>Commas = extra information (non-defining); no commas = necessary information (defining).</li>
<li><b>…, which</b> can refer to a whole idea: <i>Prices rose, <b>which</b> made life harder.</i></li>
</ul>`,
    mistakes: ["People which live in cities… → people <b>who</b>", "The city that I live is big. → the city <b>where</b> I live / that I live <b>in</b>", "My father, that is a doctor, … → , <b>who</b> is a doctor,"],
    ex: [
      { q: "Teachers ___ inspire students are rare.", a: ["who", "that"], opts: ["who", "which", "where"] },
      { q: "This is the village ___ I grew up.", a: ["where"], opts: ["which", "where", "who"] },
      { q: "Sales fell sharply, ___ worried the company.", a: ["which"], opts: ["that", "which", "what"] },
      { q: "A friend ___ father is a pilot told me about it.", a: ["whose"], opts: ["who", "whose", "which"] },
      { q: "Phnom Penh, ___ is the capital, is growing fast.", a: ["which"], opts: ["that", "which", "where"] },
      { q: "I remember the day ___ I passed my exam.", a: ["when"], opts: ["when", "which", "where"] },
    ],
  },
  {
    id: "conditionals", title: "Conditionals (if sentences)", level: "Band 6+",
    why: "Great for Task 2 arguments and Speaking Part 3 (\"What would happen if…?\").",
    html: `
<table class="tbl">
<tr><th>Type</th><th>Form</th><th>Example</th></tr>
<tr><td>Zero (always true)</td><td>if + present, present</td><td>If you heat ice, it <b>melts</b>.</td></tr>
<tr><td>First (real future)</td><td>if + present, will + verb</td><td>If governments tax sugar, people <b>will eat</b> less.</td></tr>
<tr><td>Second (unreal / imaginary)</td><td>if + past, would + verb</td><td>If I <b>had</b> more time, I <b>would travel</b>.</td></tr>
<tr><td>Third (past, imaginary)</td><td>if + had + pp, would have + pp</td><td>If I <b>had studied</b>, I <b>would have passed</b>.</td></tr>
</table>
<p>Also useful: <i>unless</i> (= if not), <i>provided that</i>, <i>as long as</i>.</p>`,
    mistakes: ["If I will have time, I will go. → If I <b>have</b> time…", "If I would be rich, … → If I <b>were</b> rich…", "If he studied harder, he will pass. → he <b>would</b> pass"],
    ex: [
      { q: "If the government ___ (reduce) taxes, people will spend more.", a: ["reduces"] },
      { q: "If I ___ (be) the president, I would build more schools.", a: ["were", "was"] },
      { q: "If you mix blue and yellow, you ___ (get) green.", a: ["get"] },
      { q: "If she had left earlier, she ___ (not miss) the bus.", a: ["would not have missed", "wouldn't have missed"] },
      { q: "People will not change ___ prices go up. (unless / if)", a: ["unless"], opts: ["unless", "if"] },
      { q: "If cities ___ (have) better buses, fewer people would drive.", a: ["had"] },
    ],
  },
  {
    id: "compare", title: "Comparatives and superlatives", level: "Must know",
    why: "Task 1 is all about comparing. Also very useful in Speaking.",
    html: `
<ul>
<li>Short adjectives: <i>cheap → cheap<b>er</b> → the cheap<b>est</b>; big → bigger → the biggest; easy → easier</i></li>
<li>Long adjectives: <i>expensive → <b>more</b> expensive → <b>the most</b> expensive</i></li>
<li>Irregular: <i>good → better → the best; bad → worse → the worst; far → further</i></li>
<li>Degree: <i><b>much / far / significantly</b> higher; <b>slightly</b> lower</i></li>
<li>Equality: <i>as high <b>as</b>; <b>twice as</b> many <b>as</b>; <b>three times</b> higher than</i></li>
<li>Comparing two facts: <i>A rose, <b>whereas / while</b> B fell.</i></li>
</ul>`,
    mistakes: ["more cheaper → cheaper", "the most highest → the highest", "more better → better / much better"],
    ex: [
      { q: "Trains are ___ (fast) than buses.", a: ["faster"] },
      { q: "Japan had the ___ (high) figure of all five countries.", a: ["highest"] },
      { q: "Living in the city is ___ (expensive) than in the countryside.", a: ["more expensive"] },
      { q: "This year's results are ___ (good) than last year's.", a: ["better"] },
      { q: "Women spent twice as much time on housework ___ men.", a: ["as"], opts: ["than", "as", "that"] },
      { q: "The number of cars rose, ___ the number of bicycles fell.", a: ["whereas", "while"], opts: ["whereas", "because", "so"] },
    ],
  },
  {
    id: "modals", title: "Modal verbs for opinions and suggestions", level: "Band 6+",
    why: "Task 2 solutions and opinions; sounding careful (hedging) is band 7 style.",
    html: `
<ul>
<li>Obligation / advice: <i>Governments <b>should / must / ought to</b> invest in education.</i></li>
<li>Possibility: <i>This <b>may / might / could</b> lead to unemployment.</i></li>
<li>Ability: <i>Technology <b>can</b> help students learn.</i></li>
<li>After a modal: <b>base verb</b> (no to, no -s): <i>should <u>improve</u>, can <u>help</u>, might <u>cause</u>.</i></li>
<li>Hedging (careful, academic): <i>It <b>could be argued</b> that… This <b>tends to</b>… This <b>is likely to</b>…</i></li>
</ul>`,
    mistakes: ["should to improve → should improve", "can helps → can help", "must invests → must invest"],
    ex: [
      { q: "The government should ___ (provide) free health care.", a: ["provide"] },
      { q: "Too much screen time can ___ (cause) sleep problems.", a: ["cause"] },
      { q: "Children ___ wear helmets when cycling. (must / must to)", a: ["must"], opts: ["must", "must to"] },
      { q: "This policy ___ lead to higher prices. (might / might to)", a: ["might"], opts: ["might", "might to"] },
      { q: "Correct: \"It can helps students.\" → It can ___ students.", a: ["help"] },
    ],
  },
  {
    id: "gerund", title: "Gerunds (-ing) and infinitives (to + verb)", level: "Band 6+",
    why: "Wrong verb patterns are a common accuracy error.",
    html: `
<ul>
<li><b>-ing</b> after: enjoy, avoid, consider, suggest, mind, finish, keep, spend time, be worth, look forward to, be used to, and after <b>prepositions</b> (by, for, of, without, instead of).</li>
<li><b>to + verb</b> after: want, decide, plan, hope, need, refuse, afford, manage, tend, seem, aim, fail; and after adjectives (easy to, difficult to, important to).</li>
<li>-ing as a subject: <i><b>Learning</b> a language takes time.</i></li>
<li>Purpose: <i>People go to university <b>to get</b> a better job.</i></li>
</ul>`,
    mistakes: ["I look forward to hear from you. → to <b>hearing</b>", "She suggested to go. → suggested <b>going</b>", "I enjoy to read. → enjoy <b>reading</b>"],
    ex: [
      { q: "I enjoy ___ (read) English novels.", a: ["reading"] },
      { q: "Many students decide ___ (study) abroad.", a: ["to study"] },
      { q: "You can improve your score by ___ (practise) every day.", a: ["practising", "practicing"] },
      { q: "I look forward to ___ (meet) you.", a: ["meeting"] },
      { q: "It is important ___ (sleep) well before the test.", a: ["to sleep"] },
      { q: "He avoided ___ (answer) the question.", a: ["answering"] },
    ],
  },
  {
    id: "prep", title: "Prepositions for charts, time and place", level: "Must know",
    why: "Task 1 uses the same prepositions again and again.",
    html: `
<ul>
<li><b>to</b> = the final level: <i>rose <b>to</b> 50%.</i> <b>by</b> = the amount of change: <i>rose <b>by</b> 10%.</i></li>
<li><b>at</b> = a point: <i>peaked <b>at</b> 80; stood <b>at</b> 20.</i> <b>of</b> after nouns: <i>a rise <b>of</b> 10%.</i></li>
<li><b>from … to</b>, <b>between … and</b>: <i>from 2000 to 2010, between 2000 and 2010.</i></li>
<li>Time: <b>in</b> 2010 / in May / in the morning; <b>on</b> Monday / on 5 May; <b>at</b> 5 pm / at night; <b>over</b> the period; <b>during</b> the decade.</li>
<li>Common pairs: increase <b>in</b> sales, interested <b>in</b>, depend <b>on</b>, responsible <b>for</b>, impact <b>on</b>, effect <b>on</b>, solution <b>to</b>, access <b>to</b>.</li>
</ul>`,
    mistakes: ["rose until 50% → rose <b>to</b> 50%", "an increase of sales → an increase <b>in</b> sales (of = the amount: an increase of 10%)", "in 5 May → <b>on</b> 5 May"],
    ex: [
      { q: "Sales rose ___ 200 units (the new level).", a: ["to"], opts: ["to", "by", "at"] },
      { q: "Prices fell ___ 15% (the size of the change).", a: ["by"], opts: ["to", "by", "at"] },
      { q: "The figure peaked ___ 900 in July.", a: ["at"], opts: ["at", "on", "to"] },
      { q: "There was a sharp increase ___ unemployment.", a: ["in"], opts: ["in", "of", "on"] },
      { q: "Social media has a big impact ___ young people.", a: ["on"], opts: ["on", "to", "for"] },
      { q: "The exam is ___ 15 November.", a: ["on"], opts: ["in", "on", "at"] },
    ],
  },
  {
    id: "sentences", title: "Sentence types: simple, compound, complex", level: "Band 6.5+",
    why: "To get Grammar band 7 you need a MIX of sentence types with few errors.",
    html: `
<ul>
<li><b>Simple</b> (one clause): <i>Public transport reduces traffic.</i></li>
<li><b>Compound</b> (two clauses + and / but / so / or): <i>Buses are cheap, <b>but</b> they are often slow.</i></li>
<li><b>Complex</b> (main clause + because / although / when / if / which…): <i><b>Although</b> buses are cheap, many people prefer to drive <b>because</b> it is faster.</i></li>
</ul>
<p><b>Avoid run-on sentences</b> (two sentences joined with only a comma): <i><s>Cars are fast, buses are cheap.</s></i> → <i>Cars are fast, <b>while</b> buses are cheap.</i> or use a full stop.</p>
<p><b>Avoid fragments</b> (no main verb): <i><s>Because it is cheap.</s></i> → <i>Many people use it because it is cheap.</i></p>`,
    mistakes: ["Although it was raining, but we went out. → remove <b>but</b>", "Because the price is high. (fragment) → add a main clause", "I like it, it is useful. (run-on) → I like it <b>because</b> it is useful."],
    ex: [
      { q: "___ the rain, the match continued. (Although / Despite)", a: ["despite"], opts: ["Although", "Despite"] },
      { q: "___ it was raining, the match continued. (Although / Despite)", a: ["although"], opts: ["Although", "Despite"] },
      { q: "Buses are cheap, ___ they are slow. (but / because)", a: ["but"], opts: ["but", "because"] },
      { q: "Many people cycle ___ it is good for their health. (because / so)", a: ["because"], opts: ["because", "so"] },
      { q: "Is this a full sentence? \"Because cities are crowded.\" (yes / no)", a: ["no"], opts: ["yes", "no"] },
    ],
  },
  {
    id: "nominal", title: "Noun phrases (academic style)", level: "Band 7+",
    why: "Turning verbs into nouns makes Writing more formal and helps paraphrasing.",
    html: `
<p>Academic English often uses <b>nouns</b> instead of verbs:</p>
<ul>
<li><i>Prices increased sharply.</i> → <i>There was a <b>sharp increase in</b> prices.</i></li>
<li><i>People use cars more, so pollution grows.</i> → <i><b>The growing use of cars</b> leads to <b>higher pollution</b>.</i></li>
<li><i>When the government decided to…</i> → <i><b>The government's decision to</b>…</i></li>
</ul>
<p>Useful pairs: increase → an increase, decline → a decline, develop → development, improve → improvement, grow → growth, fail → failure, decide → decision, consume → consumption, produce → production.</p>
<p><b>Paraphrasing tip:</b> change verb ↔ noun to rewrite the question in your introduction.</p>`,
    mistakes: ["There was a sharp increase of the prices. → a sharp increase <b>in</b> prices", "The develop of cities → The <b>development</b> of cities"],
    ex: [
      { q: "Unemployment rose. → There was a ___ in unemployment.", a: ["rise"] },
      { q: "Cities develop fast. → The rapid ___ of cities", a: ["development"] },
      { q: "People consume a lot of energy. → High energy ___", a: ["consumption"] },
      { q: "Factories produce more. → An increase in ___", a: ["production"] },
      { q: "Health care improved. → An ___ in health care", a: ["improvement"] },
    ],
  },
  {
    id: "wordform", title: "Word forms (noun, verb, adjective, adverb)", level: "Must know",
    why: "Wrong word forms are counted as errors in both Grammar and Vocabulary.",
    html: `
<table class="tbl">
<tr><th>Noun</th><th>Verb</th><th>Adjective</th><th>Adverb</th></tr>
<tr><td>success</td><td>succeed</td><td>successful</td><td>successfully</td></tr>
<tr><td>economy</td><td>economise</td><td>economic / economical</td><td>economically</td></tr>
<tr><td>benefit</td><td>benefit</td><td>beneficial</td><td>–</td></tr>
<tr><td>significance</td><td>signify</td><td>significant</td><td>significantly</td></tr>
<tr><td>difference</td><td>differ</td><td>different</td><td>differently</td></tr>
<tr><td>importance</td><td>–</td><td>important</td><td>importantly</td></tr>
</table>
<p>Adjective describes a noun (<i>a <b>rapid</b> increase</i>); adverb describes a verb (<i>increased <b>rapidly</b></i>).</p>
<p><b>economic</b> = about the economy (economic growth); <b>economical</b> = saving money (an economical car).</p>`,
    mistakes: ["increased rapid → increased <b>rapidly</b>", "a significantly rise → a <b>significant</b> rise", "It is benefit for health. → It is <b>beneficial</b> to health."],
    ex: [
      { q: "The number rose ___ (rapid).", a: ["rapidly"] },
      { q: "There was a ___ (significant) increase.", a: ["significant"] },
      { q: "Exercise is ___ (benefit) for mental health.", a: ["beneficial"] },
      { q: "She is a very ___ (success) businesswoman.", a: ["successful"] },
      { q: "The country has strong ___ growth. (economic / economical)", a: ["economic"], opts: ["economic", "economical"] },
      { q: "Prices ___ (difference) from city to city.", a: ["differ"] },
    ],
  },
];
