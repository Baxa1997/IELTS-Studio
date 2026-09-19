import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · engineering history · notes box ---------------------------

const HOIST_NOTES = {
  title: "Otis's safety mechanism",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · food science · people and a word bank ---------------------

const BREAD_PEOPLE = ["Marta Kowalczyk", "Idris Haddad", "Lena Vogel", "Paulo Rensburg"];
const BREAD_BANK = [
  "acid",
  "yeasts",
  "gluten",
  "starch",
  "salt",
  "temperature",
  "bacteria",
  "crust",
  "water",
];

// ---- Passage 3 · design and statistics · lettered paragraphs ---------------

const AVG_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const AVG_ENDINGS = [
  "because no individual pilot was close to the mean on every measurement.",
  "although the cost of doing so had fallen sharply.",
  "which the air force had assumed was a problem of training.",
  "even though the original measurements were perfectly accurate.",
  "because the designers had never met the people who would use it.",
  "which is why the adjustable seat became standard equipment.",
  "despite the objection that it would be too expensive to build.",
];

export const TEST_52: CuratedTest = {
  key: "full-test-52",
  targetBand: 5,
  passages: [
    {
      key: "t52-p1-safety-lift",
      title: "The Rope That Was Allowed to Break",
      topic: "the brake that persuaded people to ride in lifts",
      difficulty: 4,
      body: `Machines for lifting goods between the floors of a building are very old. Water-driven hoists raised stone in Roman construction, and by the early nineteenth century factories and warehouses across Europe and America used steam-powered platforms to move barrels, bales and coal. What none of them carried, as a rule, was people. The reason was simple and well understood: the platform hung from a rope, and ropes wear, fray and break. A load of coal that falls four floors is an expense. A person who falls four floors is something else.

Elisha Otis was not trying to invent a lift. In 1852 he was the master mechanic of a bed-frame factory in Yonkers, New York, which was moving to a new building, and his job was to get heavy machinery up to the higher floors safely. He designed a hoist with an addition nobody had thought necessary before. A wagon spring was fixed across the top of the platform, held under tension by the hoisting rope itself. Iron bars ran up the inside of the shaft on both sides, cut with teeth like a saw. While the rope was taut it kept the spring bent and the catches at each end of it pulled clear of the teeth. If the rope broke, the tension vanished, the spring straightened, and the catches sprang outwards into the nearest tooth, locking the platform where it stood.

The device was not sold. Otis built two for his own employer, received a few orders, and had almost given up on the idea when he took it to the Crystal Palace exhibition in New York in 1854. There he did something that no advertisement could have matched. He had himself hoisted on an open platform high above the crowd, waited until everyone in the hall was watching, and then instructed an assistant to cut the rope with an axe. The platform dropped a few inches and stopped. Otis looked down at the crowd and said, "All safe, gentlemen, all safe."

Orders followed, though not immediately in the numbers the story suggests. The first passenger lift in a building opened in a New York shop in 1857, and the company Otis founded went on selling hoists for another decade before the passenger business became the larger half. What changed the trade was not the brake alone but the arrival of a second technology: from the 1870s, hydraulic and then electric drives allowed lifts to rise higher and faster than a steam-driven rope drum could manage economically.

The demonstration was repeated through the season and reported widely, and the phrase Otis used became the advertisement. What made it persuasive was that the danger being demonstrated was the one the audience actually feared. Everybody in the hall understood that a rope could break; what nobody had seen before was a machine that treated the breaking of the rope as an ordinary event to be planned for rather than an accident to be prevented. Otis had not made the rope stronger. He had made the rope unimportant.

The effect on cities is easy to state and hard to overstate. Before the safe lift, the value of a floor fell as it rose. The best rooms in a building were on the first and second floors, reached by a short climb; attics were for servants and for storage, and rents dropped with every staircase. The lift inverted the ranking. Upper floors gained light, quiet and a view, and became the most expensive space in the building. The penthouse, a word that had meant a shed attached to a roof, took on its modern meaning within a generation.

The lift also changed what it was worth building. A structure of more than six or seven storeys had little commercial point when the upper floors were hard to let, and once that constraint was removed, the limit on height became a question of engineering rather than of demand. The steel frame, developed in Chicago in the 1880s, supplied the answer to the engineering question. The two inventions are often discussed separately, but neither would have produced the tall city on its own: a frame without a lift gives you floors nobody wants, and a lift without a frame gives you a fast ride up a building that cannot be made much taller.

Otis died in 1861, before the trade he created was large. The mechanism he patented has been superseded many times over — modern lifts use governors that sense excessive speed rather than the loss of rope tension — but the principle has not changed. A passenger lift is designed on the assumption that its rope will eventually fail, and the thing that makes it safe is not the strength of the rope but the device that is waiting for the rope to break.`,
      questions: [
        tfng(
          "Lifting machines existed long before people were carried in them.",
          "TRUE",
          "Machines for lifting goods between the floors of a building are very old.",
          "They are 'very old', but carried goods rather than people.",
        ),
        tfng(
          "Otis set out to design a lift for passengers.",
          "FALSE",
          "Elisha Otis was not trying to invent a lift.",
          "He 'was not trying to invent a lift'.",
        ),
        tfng(
          "The catches were held away from the teeth by the pull of the rope.",
          "TRUE",
          "While the rope was taut it kept the spring bent and the catches at each end of it pulled clear of the teeth.",
          "Rope tension held them 'clear of the teeth'.",
        ),
        tfng(
          "Otis cut the rope himself during the demonstration.",
          "FALSE",
          "He had himself hoisted on an open platform high above the crowd, waited until everyone in the hall was watching, and then instructed an assistant to cut the rope with an axe.",
          "An assistant cut it on his instruction.",
        ),
        tfng(
          "Sales of passenger lifts overtook goods hoists immediately after the exhibition.",
          "FALSE",
          "The first passenger lift in a building opened in a New York shop in 1857, and the company Otis founded went on selling hoists for another decade before the passenger business became the larger half.",
          "The change took 'another decade'.",
        ),
        tfng(
          "Rents in a building used to fall as the floors rose.",
          "TRUE",
          "The best rooms in a building were on the first and second floors, reached by a short climb; attics were for servants and for storage, and rents dropped with every staircase.",
          "Rents 'dropped with every staircase'.",
        ),
        tfng(
          "Otis lived to see lifts installed in tall steel-framed buildings.",
          "FALSE",
          "Otis died in 1861, before the trade he created was large.",
          "He died in 1861; the steel frame came in the 1880s.",
        ),
        noteLine(
          HOIST_NOTES,
          null,
          "A wagon ______ was fixed across the top of the platform",
          "spring",
          "A wagon spring was fixed across the top of the platform, held under tension by the hoisting rope itself.",
          "It was 'a wagon spring'.",
        ),
        noteLine(
          HOIST_NOTES,
          null,
          "Iron bars cut with ______ ran up both sides of the shaft",
          "teeth",
          "Iron bars ran up the inside of the shaft on both sides, cut with teeth like a saw.",
          "They were 'cut with teeth like a saw'.",
          { before: [{ text: "How the brake was arranged:", indent: 0 }] },
        ),
        noteLine(
          HOIST_NOTES,
          null,
          "A break in the rope released the ______ and the catches locked",
          "tension",
          "If the rope broke, the tension vanished, the spring straightened, and the catches sprang outwards into the nearest tooth, locking the platform where it stood.",
          "'The tension vanished' and the catches engaged.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Otis worked as the master mechanic of a ______ factory.",
          "bed-frame",
          "In 1852 he was the master mechanic of a bed-frame factory in Yonkers, New York, which was moving to a new building, and his job was to get heavy machinery up to the higher floors safely.",
          "It was a 'bed-frame factory'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The word ______ originally referred to a shed on a roof.",
          "penthouse",
          "The penthouse, a word that had meant a shed attached to a roof, took on its modern meaning within a generation.",
          "'Penthouse' had 'meant a shed attached to a roof'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Modern lifts are stopped by ______ that detect excessive speed.",
          "governors",
          "The mechanism he patented has been superseded many times over — modern lifts use governors that sense excessive speed rather than the loss of rope tension — but the principle has not changed.",
          "They 'use governors that sense excessive speed'.",
        ),
      ],
    },
    {
      key: "t52-p2-sourdough",
      title: "The Bread That Waits",
      topic: "what slow fermentation does to a loaf",
      difficulty: 5,
      body: `A loaf of bread is the product of two organisms working on a paste of flour and water, and the difference between one loaf and another is largely a matter of how long they are given to work. Commercial baking has spent a century shortening that time. A modern industrial loaf can go from flour to wrapper in under four hours; a traditional sourdough is typically left for between twelve and twenty-four.

The organisms are not the same in both cases. Industrial bread is raised with a single cultivated yeast, added in quantity, which converts sugars in the flour into carbon dioxide and alcohol and does so quickly. A sourdough is raised with a starter: a portion of flour and water kept alive by regular feeding, in which wild yeasts and lactic acid bacteria have established a stable community. The yeasts produce the gas that lifts the loaf, as in any bread. The bacteria produce acids, and the acids are what make the difference.

Marta Kowalczyk, a food chemist who has compared doughs fermented for different lengths of time, points out that the acidity is not simply a matter of flavour. As the pH falls, enzymes already present in the flour become more active, and they begin to break down both the starch and the protein network before the loaf ever reaches the oven. A long-fermented dough therefore enters the oven partly digested, and that, rather than any ingredient, accounts for most of the differences that follow.

Several of those differences matter to people who find bread difficult to eat. Idris Haddad, a gastroenterologist, is careful about the claims made for sourdough but accepts two of them. The first concerns a group of short-chain carbohydrates in wheat that pass undigested into the large intestine, where they ferment and cause discomfort in people with sensitive digestion; extended fermentation consumes a large proportion of them before baking. The second concerns the rate at which the starch in the finished loaf is converted to sugar in the body. Trials have repeatedly found a lower and slower rise in blood sugar after sourdough than after bread raised quickly with commercial yeast, an effect Haddad attributes to the acids rather than to the flour.

What sourdough does not do, he adds, is make wheat safe for people with coeliac disease. Fermentation reduces the quantity of the protein fragments that trigger the condition, but does not eliminate them, and the reduction is nowhere near enough to matter medically. Loaves are sometimes sold with the implication that it is, which he regards as dangerous.

The keeping qualities of the bread are a separate benefit and an old one. Lena Vogel, a microbiologist, notes that the acids that develop in a sourdough inhibit the moulds and the rope-forming bacteria that spoil bread, which is why sourdough keeps for days in conditions that would ruin a quickly raised loaf within one. Before refrigeration this was not a refinement but the point: in much of Europe, bread was baked weekly or fortnightly in a communal oven, and a loaf had to survive until the next baking.

The industrial answer to slowness is not simply to use more yeast. Paulo Rensburg, who has worked as a production manager in large bakeries, describes the standard method as a combination of intense mechanical mixing, which develops the gluten in minutes rather than hours, together with oxidising agents, emulsifiers and enzymes that reproduce some of the effects fermentation would otherwise have produced. The result is a loaf that is soft, uniform and cheap, and Rensburg is unapologetic about it: it feeds people at a price they can pay, which is what it was designed to do.

None of this makes the slow loaf straightforwardly better. A sourdough is harder to produce at scale, varies from batch to batch in a way that supermarkets dislike, and costs two or three times as much on the shelf. The starter has to be fed whether or not there is baking to do, which is a labour cost that never appears on the ingredient list. Bakers who have tried to industrialise the method usually end up shortening the fermentation and adding acid directly, which reproduces the flavour and almost none of the chemistry.

The revival of slow bread in wealthy countries has been real but small, and is best understood as a change in what a minority of consumers want rather than a change in how most bread is made. The chemistry, meanwhile, is not in dispute. Time in a dough does things that additives imitate imperfectly, and the only way to get those things is to wait.`,
      questions: [
        fromList(
          "matching_features",
          BREAD_PEOPLE,
          "Acidity allows enzymes in the flour to begin their work before baking.",
          "Marta Kowalczyk",
          "As the pH falls, enzymes already present in the flour become more active, and they begin to break down both the starch and the protein network before the loaf ever reaches the oven.",
          "Kowalczyk describes enzymes activated by falling pH.",
        ),
        fromList(
          "matching_features",
          BREAD_PEOPLE,
          "Claims that slow bread suits one medical condition are dangerous.",
          "Idris Haddad",
          "Loaves are sometimes sold with the implication that it is, which he regards as dangerous.",
          "Haddad calls the coeliac implication 'dangerous'.",
        ),
        fromList(
          "matching_features",
          BREAD_PEOPLE,
          "The bread resists spoilage for longer than quickly raised loaves.",
          "Lena Vogel",
          "Lena Vogel, a microbiologist, notes that the acids that develop in a sourdough inhibit the moulds and the rope-forming bacteria that spoil bread, which is why sourdough keeps for days in conditions that would ruin a quickly raised loaf within one.",
          "Vogel explains the keeping quality.",
        ),
        fromList(
          "matching_features",
          BREAD_PEOPLE,
          "Industrial bread is doing exactly the job it was meant to do.",
          "Paulo Rensburg",
          "The result is a loaf that is soft, uniform and cheap, and Rensburg is unapologetic about it: it feeds people at a price they can pay, which is what it was designed to do.",
          "Rensburg is 'unapologetic about it'.",
        ),
        fromList(
          "summary_completion",
          BREAD_BANK,
          "In a sourdough starter, wild yeasts live alongside lactic acid ______.",
          "bacteria",
          "A sourdough is raised with a starter: a portion of flour and water kept alive by regular feeding, in which wild yeasts and lactic acid bacteria have established a stable community.",
          "The community is 'wild yeasts and lactic acid bacteria'.",
        ),
        fromList(
          "summary_completion",
          BREAD_BANK,
          "The gas that lifts any loaf is produced by the ______.",
          "yeasts",
          "The yeasts produce the gas that lifts the loaf, as in any bread.",
          "'The yeasts produce the gas that lifts the loaf'.",
        ),
        fromList(
          "summary_completion",
          BREAD_BANK,
          "A long fermentation begins breaking down the ______ before the dough is baked.",
          "starch",
          "As the pH falls, enzymes already present in the flour become more active, and they begin to break down both the starch and the protein network before the loaf ever reaches the oven.",
          "Enzymes break down 'the starch and the protein network'.",
        ),
        fromList(
          "summary_completion",
          BREAD_BANK,
          "Industrial mixing develops the ______ in minutes instead of hours.",
          "gluten",
          "Paulo Rensburg, who has worked as a production manager in large bakeries, describes the standard method as a combination of intense mechanical mixing, which develops the gluten in minutes rather than hours, together with oxidising agents, emulsifiers and enzymes that reproduce some of the effects fermentation would otherwise have produced.",
          "Mixing 'develops the gluten in minutes rather than hours'.",
        ),
        fromList(
          "summary_completion",
          BREAD_BANK,
          "The ______ produced by the bacteria is responsible for most of the effects described.",
          "acid",
          "The bacteria produce acids, and the acids are what make the difference.",
          "'The acids are what make the difference'.",
        ),
        mcq(
          "How long does an industrial loaf typically take to produce?",
          [
            "Less than four hours",
            "Between four and twelve hours",
            "Between twelve and twenty-four hours",
            "More than a full day",
          ],
          "Less than four hours",
          "A modern industrial loaf can go from flour to wrapper in under four hours; a traditional sourdough is typically left for between twelve and twenty-four.",
          "It goes 'from flour to wrapper in under four hours'.",
        ),
        mcq(
          "What does Haddad accept about blood sugar?",
          [
            "It rises more slowly after eating sourdough",
            "It is unaffected by how bread is fermented",
            "It rises fastest after bread made from wholemeal flour",
            "It has never been measured reliably in trials",
          ],
          "It rises more slowly after eating sourdough",
          "Trials have repeatedly found a lower and slower rise in blood sugar after sourdough than after bread raised quickly with commercial yeast, an effect Haddad attributes to the acids rather than to the flour.",
          "Trials found 'a lower and slower rise in blood sugar'.",
        ),
        mcq(
          "Why did keeping qualities matter so much before refrigeration?",
          [
            "Bread was baked only every week or two",
            "Flour was stored for long periods before use",
            "Communal ovens were shared between villages",
            "Mould was not recognised as a danger",
          ],
          "Bread was baked only every week or two",
          "Before refrigeration this was not a refinement but the point: in much of Europe, bread was baked weekly or fortnightly in a communal oven, and a loaf had to survive until the next baking.",
          "Bread was 'baked weekly or fortnightly'.",
        ),
        mcq(
          "How does the passage describe the revival of slow bread?",
          [
            "Genuine but limited to a small group of buyers",
            "Large enough to have changed industrial practice",
            "Driven mainly by medical advice",
            "Confined to countries with a baking tradition",
          ],
          "Genuine but limited to a small group of buyers",
          "The revival of slow bread in wealthy countries has been real but small, and is best understood as a change in what a minority of consumers want rather than a change in how most bread is made.",
          "It is 'real but small', a minority preference.",
        ),
      ],
    },
    {
      key: "t52-p3-average-man",
      title: "The Trouble with the Average",
      topic: "why designing for the typical user fits nobody",
      difficulty: 6,
      body: `A) In 1950 the United States Air Force had a problem it could not explain. Its aircraft were crashing at a rate that could not be accounted for by mechanical failure or by enemy action, and pilots were making errors that experienced pilots do not make: reaching for the wrong lever, mistiming a pull, losing control during manoeuvres they had performed hundreds of times. The instinct of the service was to blame training, and then to blame the pilots.

B) A young researcher named Gilbert Daniels was given a related task. The cockpit of a fighter had been designed in the 1920s around the average dimensions of hundreds of pilots measured at the time, and since the men flying in 1950 were larger, the sensible fix appeared to be to measure them again and rebuild the cockpit around the new average. Daniels duly measured more than four thousand pilots across ten dimensions relevant to the fit of a cockpit: height, chest circumference, arm length, thigh length and so on. It was tedious work of a kind the service had commissioned before, and the expectation was that it would produce a new set of numbers to hand to the manufacturers.

C) Then he asked a question nobody had thought to ask. How many of the four thousand were close to average on all ten measurements at once? He defined "close" generously, as within the middle thirty per cent of the range on each dimension, which meant that a great many pilots counted as average on any single measure. The answer was zero. Not one of the four thousand pilots fell within that band on all ten dimensions simultaneously. Even on three dimensions chosen at random, fewer than one in twenty did.

D) The reason is arithmetic rather than mysterious. The dimensions are only loosely correlated with each other: a man with long arms does not reliably have a long torso, and a broad chest does not imply broad hips. Each additional requirement therefore multiplies away a further share of the population, and after ten of them nothing is left. A cockpit built around the average of every measurement is a cockpit built for a person who does not exist, and everyone who flies in it is accommodated badly in at least one respect.

E) The response was quicker than the research had been, because the fix was cheap. The air force required manufacturers to build cockpits that fitted the range rather than the centre: adjustable seats, adjustable rudder pedals, adjustable helmet straps and flight suits in graduated sizes. Manufacturers protested that adjustability would be expensive and complicated, and were told that the alternative was not to be paid. Within a decade every American military aircraft had an adjustable cockpit, accident rates fell, and the adjustable seat migrated from the fighter to the family car, where it is now so ordinary that nobody notices it is a solution to anything. The cost of the change turned out to be trivial beside the cost of the aircraft it saved, which is the usual finding when a fit problem is finally treated as a fit problem.

F) I think the episode is misused as often as it is cited. It is frequently offered as a lesson about the meaninglessness of averages, which is not what it shows. An average is an excellent summary of a population and a poor description of a member of one, and those are different claims. The air force's mistake was not calculating a mean; it was designing a single fixed object around a mean and assuming that the object would then fit the individuals the mean had been computed from.

G) That mistake is not confined to cockpits, and it is arguably more common now than it was in 1950, because the data available to designers has grown enormously while the temptation to summarise it has grown with it. A syllabus paced for the average pupil, a drug dose calculated for an average adult body, a chair designed for average sitting height, a working day arranged around average alertness: each is a fixed object built around a centre, and each will fit some proportion of its users poorly. Where adjustment is possible it is almost always the better answer, and where it is not, the designer at least owes the user an honest account of who the object was built for.`,
      questions: [
        fromList(
          "matching_information",
          AVG_PARAGRAPHS,
          "an explanation of why so few people are average on many measures at once",
          "D",
          "Each additional requirement therefore multiplies away a further share of the population, and after ten of them nothing is left.",
          "Paragraph D gives the arithmetic reason.",
        ),
        fromList(
          "matching_information",
          AVG_PARAGRAPHS,
          "a list of present-day designs that repeat the same error",
          "G",
          "A syllabus paced for the average pupil, a drug dose calculated for an average adult body, a chair designed for average sitting height, a working day arranged around average alertness: each is a fixed object built around a centre, and each will fit some proportion of its users poorly.",
          "Paragraph G lists modern examples.",
        ),
        fromList(
          "matching_information",
          AVG_PARAGRAPHS,
          "a reference to the initial assumption that pilots themselves were at fault",
          "A",
          "The instinct of the service was to blame training, and then to blame the pilots.",
          "Paragraph A records that instinct.",
        ),
        fromList(
          "matching_information",
          AVG_PARAGRAPHS,
          "the result of applying a generous definition of what counts as typical",
          "C",
          'He defined "close" generously, as within the middle thirty per cent of the range on each dimension, which meant that a great many pilots counted as average on any single measure.',
          "Paragraph C describes the generous band and its result.",
        ),
        fromList(
          "matching_information",
          AVG_PARAGRAPHS,
          "an account of resistance from the companies that built the aircraft",
          "E",
          "Manufacturers protested that adjustability would be expensive and complicated, and were told that the alternative was not to be paid.",
          "Paragraph E describes the manufacturers' protest.",
        ),
        ynng(
          "The writer thinks the episode is often quoted to support the wrong conclusion.",
          "YES",
          "It is frequently offered as a lesson about the meaninglessness of averages, which is not what it shows.",
          "The writer says that is 'not what it shows'.",
        ),
        ynng(
          "The writer regards averages as a useful way of summarising a group.",
          "YES",
          "An average is an excellent summary of a population and a poor description of a member of one, and those are different claims.",
          "It is called 'an excellent summary of a population'.",
        ),
        ynng(
          "The writer believes the problem has become rarer as data has improved.",
          "NO",
          "That mistake is not confined to cockpits, and it is arguably more common now than it was in 1950, because the data available to designers has grown enormously while the temptation to summarise it has grown with it.",
          "It is 'arguably more common now'.",
        ),
        ynng(
          "The writer thinks designers should say who a fixed product was designed to suit.",
          "YES",
          "Where adjustment is possible it is almost always the better answer, and where it is not, the designer at least owes the user an honest account of who the object was built for.",
          "The designer 'owes the user an honest account'.",
        ),
        fromList(
          "matching_sentence_endings",
          AVG_ENDINGS,
          "Rebuilding the cockpit around a new average would have failed",
          "because no individual pilot was close to the mean on every measurement.",
          "Not one of the four thousand pilots fell within that band on all ten dimensions simultaneously.",
          "Nobody was average on all ten at once.",
        ),
        fromList(
          "matching_sentence_endings",
          AVG_ENDINGS,
          "The crashes were at first attributed to poor preparation,",
          "which the air force had assumed was a problem of training.",
          "The instinct of the service was to blame training, and then to blame the pilots.",
          "The first instinct was 'to blame training'.",
        ),
        fromList(
          "matching_sentence_endings",
          AVG_ENDINGS,
          "The original cockpit dimensions were not wrong in themselves,",
          "even though the original measurements were perfectly accurate.",
          "The cockpit of a fighter had been designed in the 1920s around the average dimensions of hundreds of pilots measured at the time, and since the men flying in 1950 were larger, the sensible fix appeared to be to measure them again and rebuild the cockpit around the new average.",
          "The measurements themselves were sound; the use made of them was not.",
        ),
        fromList(
          "matching_sentence_endings",
          AVG_ENDINGS,
          "The air force imposed adjustability on its suppliers",
          "despite the objection that it would be too expensive to build.",
          "Manufacturers protested that adjustability would be expensive and complicated, and were told that the alternative was not to be paid.",
          "The expense objection was overruled.",
        ),
        fromList(
          "matching_sentence_endings",
          AVG_ENDINGS,
          "The fix spread far beyond military aviation,",
          "which is why the adjustable seat became standard equipment.",
          "Within a decade every American military aircraft had an adjustable cockpit, accident rates fell, and the adjustable seat migrated from the fighter to the family car, where it is now so ordinary that nobody notices it is a solution to anything. The cost of the change turned out to be trivial beside the cost of the aircraft it saved, which is the usual finding when a fit problem is finally treated as a fit problem.",
          "The adjustable seat reached the family car.",
        ),
      ],
    },
  ],
};
