// Writing task types with structure, language and a model answer (written for this site).
// chart: optional data to draw a small chart { kind: "line" | "bar" | "pie" | "table", ... }
window.WRITING_TYPES = [
  /* ============================ TASK 1 ============================ */
  {
    id: "line", task: 1, name: "Line graph",
    spot: "\"The graph below shows…\" with years along the bottom. It shows <b>change over time</b>.",
    question: "The graph below shows the percentage of households with internet access in three countries between 2000 and 2020.",
    chart: { kind: "line", unit: "%", x: ["2000", "2005", "2010", "2015", "2020"], series: [
      { name: "Country A", data: [40, 58, 72, 85, 92] },
      { name: "Country B", data: [20, 30, 45, 62, 80] },
      { name: "Country C", data: [5, 8, 15, 30, 55] },
    ] },
    plan: [
      "Introduction: paraphrase the question (graph → line graph; shows → illustrates; households with internet access → homes connected to the internet).",
      "Overview: the main trend(s) + the biggest/smallest. No numbers.",
      "Body 1: the highest line(s): start, change, end with numbers.",
      "Body 2: the other line(s), compare.",
    ],
    language: ["rose steadily from … to …", "increased dramatically / sharply", "doubled / tripled", "reached a peak of …", "remained the highest throughout", "the gap between … narrowed"],
    model: `The line graph illustrates the proportion of homes with an internet connection in three countries over a twenty-year period from 2000.

Overall, internet access increased considerably in all three countries. Country A had the highest level of access throughout the period, while Country C, despite starting from a very low base, saw the most dramatic growth.

In 2000, 40% of households in Country A were connected to the internet, which was twice the figure for Country B (20%). Over the following two decades, the percentage in Country A rose steadily, reaching 92% by 2020. Country B followed a similar upward trend, climbing to 62% in 2015 and then to 80% at the end of the period.

Country C, by contrast, began with only 5% of homes online. The figure grew slowly to 15% in 2010, but then rose sharply, doubling to 30% in 2015 and reaching 55% in 2020. As a result, the gap between Country C and the other two countries narrowed significantly, although it remained the lowest of the three.`,
  },
  {
    id: "bar", task: 1, name: "Bar chart",
    spot: "\"The bar chart compares…\". Can show categories (no time) or change over a few years.",
    question: "The bar chart shows the average number of hours per week that students in four age groups spent on different activities.",
    chart: { kind: "bar", unit: "hours", x: ["Studying", "Social media", "Sport", "Part-time work"], series: [
      { name: "16–18", data: [20, 14, 6, 2] },
      { name: "19–21", data: [24, 12, 4, 8] },
    ] },
    plan: [
      "Introduction: paraphrase.",
      "Overview: which activity was largest/smallest; the main difference between groups.",
      "Body 1: group the biggest categories together and compare.",
      "Body 2: the smaller categories.",
    ],
    language: ["the most / least popular activity", "spent twice as long on … as on …", "slightly more / considerably less", "compared with", "whereas / while", "the figures for … were similar"],
    model: `The bar chart compares how many hours a week students aged 16–18 and 19–21 spent on four activities: studying, social media, sport and part-time work.

Overall, studying took up the most time for both age groups, while part-time work and sport took the least. Older students studied and worked more, whereas younger students spent more time on social media and sport.

Studying was the main activity for both groups. Students aged 19–21 spent 24 hours a week studying, slightly more than the 20 hours reported by the younger group. Social media was the second most time-consuming activity, at 14 hours a week for 16–18-year-olds and 12 hours for the older students.

The figures for the two remaining activities were much lower. Younger students did 6 hours of sport a week, compared with only 4 hours among those aged 19–21. However, the opposite was true for part-time work: older students worked 8 hours a week, four times as long as the younger group (2 hours).`,
  },
  {
    id: "pie", task: 1, name: "Pie chart",
    spot: "Circles showing <b>proportions</b> (percentages) of a whole. Often two pies to compare.",
    question: "The pie charts show how a household's money was spent in 1990 and 2020.",
    chart: { kind: "pie", series: [
      { name: "1990", data: [["Housing", 30], ["Food", 35], ["Transport", 15], ["Entertainment", 10], ["Other", 10]] },
      { name: "2020", data: [["Housing", 40], ["Food", 20], ["Transport", 15], ["Entertainment", 15], ["Other", 10]] },
    ] },
    plan: [
      "Introduction: paraphrase.",
      "Overview: the largest share in each year + the biggest change.",
      "Body 1: categories that changed (increase / decrease).",
      "Body 2: categories that stayed the same.",
    ],
    language: ["accounted for / made up / represented", "a third / just under half / a fifth", "the largest proportion", "fell from … to …", "remained unchanged at …", "the share of …"],
    model: `The pie charts compare the proportion of household spending that went on five categories in 1990 and 2020.

Overall, the largest share of spending moved from food in 1990 to housing in 2020. The proportion spent on entertainment also rose, while the figures for transport and other expenses did not change.

In 1990, food made up the biggest part of the household budget, at just over a third (35%). By 2020, however, this had fallen to a fifth (20%). Housing, in contrast, grew from 30% to 40%, becoming the largest category. Spending on entertainment also increased, from 10% to 15%.

The remaining two categories stayed the same over the thirty-year period. Transport accounted for 15% of spending in both years, and other expenses represented 10% in 1990 and in 2020.`,
  },
  {
    id: "table", task: 1, name: "Table",
    spot: "Numbers in rows and columns. Don't describe every number: <b>choose the main features</b>.",
    question: "The table shows the number of visitors (in millions) to four museums in a city in 2010, 2015 and 2020.",
    chart: { kind: "table", head: ["Museum", "2010", "2015", "2020"], rows: [["Science", "3.0", "3.8", "4.5"], ["History", "2.5", "2.4", "2.0"], ["Art", "1.2", "1.8", "2.6"], ["Toy", "0.8", "0.8", "0.7"]] },
    plan: [
      "Introduction: paraphrase.",
      "Overview: highest / lowest + up vs down trends.",
      "Body 1: the museums that grew.",
      "Body 2: the museums that fell or stayed stable.",
    ],
    language: ["the most visited", "rose / grew from … to …", "more than doubled", "fell slightly", "remained almost unchanged", "by contrast"],
    model: `The table shows how many people, in millions, visited four museums in a city in 2010, 2015 and 2020.

Overall, the Science Museum was the most popular throughout the period, and visits to both the Science and Art museums increased. In contrast, the History and Toy museums attracted fewer visitors by 2020.

The Science Museum received 3 million visitors in 2010, and this figure rose steadily to 3.8 million in 2015 and 4.5 million in 2020. The Art Museum saw even faster growth: its visitor numbers more than doubled, from 1.2 million to 2.6 million, so that by the end of the period it was more popular than the History Museum.

The History Museum, which had 2.5 million visitors in 2010, saw a slight fall to 2.4 million in 2015 and then a larger drop to 2 million. Meanwhile, the Toy Museum remained the least visited, with numbers almost unchanged at around 0.7–0.8 million.`,
  },
  {
    id: "process", task: 1, name: "Process diagram",
    spot: "Arrows and pictures showing <b>how something is made or happens</b>, step by step.",
    question: "The diagram shows how orange juice is produced. (Stages: picked → washed → squeezed → filtered → heated → cooled → bottled → delivered)",
    chart: { kind: "steps", steps: ["Oranges picked", "Washed", "Squeezed", "Juice filtered", "Heated (pasteurised)", "Cooled", "Bottled", "Delivered to shops"] },
    plan: [
      "Introduction: paraphrase.",
      "Overview: how many stages, where it starts and ends (natural or man-made process).",
      "Body 1: first half of the steps, in order.",
      "Body 2: second half, in order.",
    ],
    language: ["Use the PASSIVE: are picked, is heated, is then poured", "first / to begin with", "next / then / after that", "once / after being …", "following this", "finally / in the final stage"],
    model: `The diagram illustrates the stages involved in producing bottled orange juice.

Overall, there are eight main stages in the process, beginning with the picking of the fruit and ending with the delivery of the finished juice to shops.

To begin with, ripe oranges are picked from the trees and transported to a factory, where they are thoroughly washed. Next, the fruit is squeezed by a machine to extract the juice, and the juice is then filtered in order to remove seeds and pieces of skin.

After being filtered, the juice is heated to a high temperature. This stage, known as pasteurisation, kills harmful bacteria. Following this, the juice is cooled and poured into bottles. In the final stage, the bottled juice is loaded onto trucks and delivered to shops, where it is sold to customers.`,
  },
  {
    id: "map", task: 1, name: "Maps",
    spot: "Two maps of the same place: \"…in 1995 and now\". Describe <b>what changed</b>.",
    question: "The maps show a village in 2000 and today. (2000: farmland in the north, a small school, one road, a forest in the east. Today: houses on the farmland, school extended, new road to the south, forest replaced by a car park and supermarket, the lake unchanged.)",
    chart: { kind: "compare", before: ["Farmland in the north", "Small school in the centre", "One main road (west–east)", "Forest in the east", "Lake in the south-west"], after: ["Houses built on the farmland", "School extended", "New road leading south", "Supermarket and car park instead of the forest", "Lake unchanged"] },
    plan: [
      "Introduction: paraphrase.",
      "Overview: the village became more developed / residential; what stayed the same.",
      "Body 1: changes in one area (north / centre).",
      "Body 2: changes in another area (east / south) + what didn't change.",
    ],
    language: ["Passive: was replaced by, were built, was extended, was demolished, was converted into", "to the north of / in the east / next to / opposite", "make way for", "remained unchanged"],
    model: `The maps compare the layout of a village in 2000 with how it looks today.

Overall, the village has become much more developed, with more housing, shops and roads, while most of its natural areas have disappeared. Only the lake has remained unchanged.

The most noticeable change has taken place in the north, where the farmland that existed in 2000 has been replaced by a residential area with a number of new houses. In the centre of the village, the small school has been extended, presumably to accommodate more pupils.

In the east, the forest has been cut down to make way for a supermarket and a car park. In addition, a new road has been built, leading south from the original main road, which still runs from west to east. The lake in the south-west, however, has stayed exactly the same.`,
  },

  /* ============================ TASK 2 ============================ */
  {
    id: "opinion", task: 2, name: "Opinion (agree / disagree)",
    spot: "\"To what extent do you agree or disagree?\" / \"Do you agree or disagree?\"",
    question: "Some people believe that university education should be free for all students. To what extent do you agree or disagree?",
    plan: [
      "Introduction: paraphrase the statement + YOUR POSITION (e.g. I completely agree / I partly agree).",
      "Body 1: reason 1 → explain → example.",
      "Body 2: reason 2 → explain → example. (If you partly agree, Body 2 can be the other side.)",
      "Conclusion: repeat your position in new words.",
    ],
    language: ["I strongly believe that…", "I agree with this view to a large extent", "The main reason is that…", "This is because…", "For example,…", "For these reasons, I…"],
    model: `It is sometimes argued that higher education should be provided free of charge to every student. I largely agree with this view, because free university education creates equal opportunities and benefits society as a whole.

The main reason for my opinion is fairness. When students have to pay high tuition fees, only young people from wealthy families can easily attend university. Talented students from poorer backgrounds may decide not to study at all, or they may finish their degree with debts that take many years to repay. If university is free, a student's future depends on ability and effort rather than on family income. In countries such as Germany, where tuition is free, many students from low-income families are able to become doctors, engineers and teachers.

In addition, society gains from having more educated citizens. Graduates usually earn higher salaries, which means they pay more tax over their lifetime. They also bring skills and new ideas that help the economy grow. Therefore, the money a government spends on free education can be seen as an investment rather than a cost.

Admittedly, free education is expensive, and governments must find the money to pay for it. However, this could be managed by limiting the number of places in some subjects or by asking graduates with high incomes to pay slightly higher taxes.

In conclusion, I believe that university education should be free for all students, as it gives everyone an equal chance to succeed and brings long-term benefits to the whole country.`,
  },
  {
    id: "discuss", task: 2, name: "Discussion (both views + opinion)",
    spot: "\"Discuss both these views and give your own opinion.\"",
    question: "Some people think children should start learning a foreign language at primary school. Others believe they should wait until secondary school. Discuss both views and give your own opinion.",
    plan: [
      "Introduction: paraphrase both views + your opinion (which side you support).",
      "Body 1: view 1. Why some people think this, explain + example.",
      "Body 2: view 2 (often the one you agree with), explain + example.",
      "Conclusion: summarise both + your opinion.",
    ],
    language: ["On the one hand, some people argue that…", "Those who support this view believe…", "On the other hand, others claim that…", "In my view / Personally, I believe…", "While I understand…, I think…"],
    model: `People have different opinions about the best age for children to begin studying a foreign language. While some feel it is better to wait until secondary school, I believe that starting at primary school is more effective.

On the one hand, there are reasons to delay foreign language learning. Some people argue that young children should first focus on reading and writing in their own language, and that adding a second language too early may confuse them. They also point out that older children are more mature, so they can understand grammar rules and study more independently. In addition, primary schools in some areas do not have enough qualified language teachers.

On the other hand, many experts believe that children learn languages more easily when they are young. Young learners are good at copying sounds, so they often develop more natural pronunciation than teenagers or adults. They are also less afraid of making mistakes, which helps them speak with confidence. For example, children who learn English through songs and games from the age of six often reach a higher level by the end of secondary school than those who start at twelve.

In my opinion, the advantages of an early start are greater. Problems such as a lack of teachers can be solved with training, and lessons for young children can be short and enjoyable so that they do not interfere with their first language.

In conclusion, although waiting until secondary school has some benefits, I believe children should begin learning a foreign language at primary school, because this gives them the best chance to become fluent.`,
  },
  {
    id: "advdis", task: 2, name: "Advantages & disadvantages",
    spot: "\"What are the advantages and disadvantages?\" or \"Do the advantages outweigh the disadvantages?\"",
    question: "More and more people are working from home. Do the advantages of this development outweigh the disadvantages?",
    plan: [
      "Introduction: paraphrase + your answer (if the question asks which is greater).",
      "Body 1: advantages, explain + example.",
      "Body 2: disadvantages, explain + example.",
      "Conclusion: say clearly which side is bigger (if asked).",
    ],
    language: ["One major advantage is…", "Another benefit is…", "However, there are also drawbacks…", "The main disadvantage is…", "On balance, I believe the benefits outweigh the drawbacks"],
    model: `In recent years, a growing number of employees have started to work from home rather than in an office. In my view, the advantages of this trend outweigh the disadvantages.

The most obvious benefit of working from home is the time and money that people save. Without a daily journey to the office, workers avoid traffic jams and transport costs, and they can use this extra time to rest, exercise or spend with their families. This often leads to lower stress and a better work-life balance. Furthermore, remote working allows companies to employ the best people regardless of where they live, and it reduces the number of cars on the road, which is good for the environment.

However, there are some drawbacks. Some people feel lonely when they work alone at home for long periods, and they miss the friendly conversations they used to have with colleagues. It can also be harder for teams to share ideas and solve problems quickly without meeting face to face. In addition, some employees find it difficult to separate their work from their private life, so they end up working longer hours.

Nevertheless, most of these problems can be reduced. For example, companies can organise regular online meetings and ask staff to come to the office one or two days a week for teamwork. By contrast, the benefits of saving time, reducing stress and protecting the environment are difficult to achieve in any other way.

In conclusion, although working from home can cause loneliness and communication problems, I believe its advantages are more significant.`,
  },
  {
    id: "problem", task: 2, name: "Problem / cause & solution",
    spot: "\"What problems does this cause? What solutions can you suggest?\" or \"What are the causes…? How can…?\"",
    question: "In many cities, traffic congestion is becoming a serious problem. What are the causes of this problem, and what measures could be taken to solve it?",
    plan: [
      "Introduction: paraphrase + say you will explain causes and solutions.",
      "Body 1: 1–2 causes, explained with examples.",
      "Body 2: solutions that match the causes.",
      "Conclusion: summarise.",
    ],
    language: ["One of the main causes of … is…", "This is largely due to…", "As a result,…", "One effective solution would be to…", "Governments could / should…", "This would help to…"],
    model: `Traffic jams have become a major issue in many cities around the world. This essay will explain the main reasons for this problem and suggest some practical solutions.

The first cause of traffic congestion is the rapid growth of urban populations. As people move from rural areas to cities in search of jobs, the number of vehicles on the roads increases much faster than new roads can be built. A second cause is the lack of good public transport. In many cities, buses are slow, crowded and unreliable, so people who can afford a car or a motorbike prefer to use their own vehicle, even for short journeys.

There are several measures that could reduce this problem. Firstly, governments should invest in fast and affordable public transport, such as metro systems and bus lanes. If buses and trains are quicker than cars, many people will choose them. Singapore, for example, has a modern public transport network, which helps to keep its roads relatively clear. Secondly, authorities could make driving in the city centre more expensive by introducing congestion charges or higher parking fees. This would encourage people to share cars, cycle or walk. Finally, companies could allow flexible working hours, so that fewer people travel at the same time.

In conclusion, traffic congestion is mainly caused by population growth and poor public transport. Investing in better transport and discouraging unnecessary car use are the most effective ways to tackle it.`,
  },
  {
    id: "twopart", task: 2, name: "Two-part question",
    spot: "Two direct questions, e.g. \"Why is this happening? Is it a positive or negative development?\"",
    question: "Nowadays, many young people choose to live alone rather than with their families. Why is this happening? Is it a positive or negative development?",
    plan: [
      "Introduction: paraphrase + short answer to BOTH questions.",
      "Body 1: answer question 1 fully.",
      "Body 2: answer question 2 fully.",
      "Conclusion: summarise both answers.",
    ],
    language: ["There are several reasons why…", "The main reason is…", "In my opinion, this is a positive / negative development because…", "Overall,…"],
    model: `It is becoming increasingly common for young adults to move out of their parents' home and live by themselves. This is mainly because of education, work and a desire for independence, and I believe it is largely a positive development.

There are several reasons for this trend. Firstly, many young people move to big cities to attend university or to find better jobs, so they cannot live with their families even if they want to. Secondly, attitudes have changed. Today's young adults value independence and privacy, and they want to make their own decisions about their daily lives. Finally, in many countries young people earn enough money to rent a small apartment, which was more difficult for earlier generations.

In my view, this is mostly a positive change. Living alone teaches young people important life skills, such as managing money, cooking and solving problems without help from their parents. These skills make them more responsible and confident adults. Living independently can also improve relationships with parents, because there are fewer arguments about everyday matters. On the other hand, some young people may feel lonely, and renting is expensive. However, these problems can be reduced by sharing a flat with friends and staying in regular contact with family.

In conclusion, young people choose to live alone because of study, work and a wish for independence. Overall, I believe this is a positive development, as it helps them become mature and capable adults.`,
  },
];
