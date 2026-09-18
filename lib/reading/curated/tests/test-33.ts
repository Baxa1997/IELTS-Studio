import {
  fromList,
  gapFill,
  mcq,
  noteLine,
  pickTwo,
  plain,
  tfng,
  ynng,
  type CuratedQuestion,
  type CuratedTest,
} from "../shared";

// ---- Passage 1 · engineering history · notes --------------------------------

const TUBE = {
  title: "Building the London Underground",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · headings, choose TWO --------------------------

const HEADINGS = [
  "A machine that arrived faster than the rules",
  "Counting the injuries",
  "Obstacles left on the footpath",
  "The cost of hiring one for a week",
  "Cheaper batteries for electric cars",
  "Does it actually save any carbon?",
  "Built to last longer than a season",
  "Why buses were removed from city centres",
  "Control through software",
  "Limiting the number on the street",
];

function heading(paragraph: string, answer: string, support: string, why: string): CuratedQuestion {
  return {
    ...plain("matching_headings", `Paragraph ${paragraph}`, answer, support, why),
    options: HEADINGS,
  };
}

const SCOOTER_STEM = "Which TWO measures used to control shared scooters are mentioned?";
const SCOOTER_MEASURES = [
  "software that slows or stops a scooter in certain streets",
  "a national test that riders must pass before hiring one",
  "limits on how many scooters a company may put on the streets",
  "a ban on riding them during the hours of darkness",
  "a requirement that every scooter carries two passengers",
];

// ---- Passage 3 · research debate · word bank --------------------------------

const FICTION_BANK = [
  "eyes",
  "volunteers",
  "symptom",
  "television",
  "characters",
  "headlines",
  "print",
  "curriculums",
];

export const TEST_33: CuratedTest = {
  key: "full-test-33",
  targetBand: 5,
  passages: [
    {
      key: "t33-p1-underground",
      title: "The Railway Under the Streets",
      topic: "how the world's first underground railway was built and extended",
      difficulty: 4,
      body: `By the middle of the nineteenth century, London was choking on its own success. The population had passed two million, and the main railway lines from the rest of the country all stopped at the edge of the built-up area, leaving travellers to complete their journeys through streets jammed with carts, carriages and cattle. A solicitor named Charles Pearson had been arguing for years that the answer was to put a railway beneath the roads. In 1863 the Metropolitan Railway opened between Paddington and Farringdon, and the world's first underground railway carried some forty thousand passengers on its first day.

The method used to build it was simple and brutal. Engineers dug a deep trench along the line of an existing street, built brick walls and an arched roof inside it, and then covered the whole thing over and relaid the road on top. This technique, known as cut and cover, wrecked the surface for months and required the demolition of anything in the way. Whole streets of housing came down, and thousands of poor residents were displaced with no compensation and no plan for where they should go.

There were accidents. In 1862, shortly before the line opened, the Fleet, one of London's buried rivers, burst through the workings and flooded them, and the sewer carrying it had to be rebuilt. There was also the problem of smoke. The trains were pulled by steam locomotives, and although the engines were designed to condense their own steam, the tunnels filled with fumes. Ventilation was provided by gaps left open to the sky, and passengers were assured that the sulphurous air was good for the lungs, a claim nobody believed.

The line was an immediate success, and other companies followed. By 1884 an inner circle of routes had been completed around the central districts. All of it, however, lay just below the surface, which meant that every new line had to follow the course of a street. The next step required two inventions. The first was a shield: a circular iron frame that was pushed forward through the clay while workers dug at the face and lined the tunnel behind them with iron segments. The second was electric traction, which removed the need to vent smoke at all.

The first deep-level electric railway in the world opened in 1890, running south from the City under the Thames. Because the tunnels were narrow and round, the carriages were cramped and had tiny windows — there was nothing to see in any case — and passengers nicknamed them padded cells. A more comfortable line, the Central London Railway, opened in 1900 with a flat fare of twopence, and the name the Twopenny Tube stuck to it and then to the whole system.

New machinery brought new anxieties. When the first escalator was installed at Earl's Court in 1911, passengers were nervous of stepping onto a moving staircase, and a story has long circulated that the railway employed a man with a wooden leg to ride up and down all day to prove that it was safe. Whether or not he existed, the escalator did what was needed: it moved far more people than a lift, and it made the deepest stations practical.

The map came last. By the 1930s the network was so tangled that a geographically accurate map of it was almost unreadable. An engineering draughtsman named Harry Beck, working in his own time, drew the lines as straight verticals, horizontals and diagonals, spaced the stations evenly and threw away the scale, keeping only the River Thames for orientation. His employers thought it too radical and printed a small trial run in 1933. It sold out, and Beck's design has shaped transport maps around the world ever since.

During the Second World War, Londoners sheltered from bombing on the platforms, at first against the wishes of the authorities, who feared that people would refuse to come back up. Today the system carries well over a billion passengers a year on more than four hundred kilometres of track. Much of the original 1863 route is still in daily use, which is a long working life for a railway that was widely predicted to fail.`,
      questions: [
        noteLine(
          TUBE,
          "The first line, 1863",
          "Main railways stopped at the ______ of the built-up area",
          "edge",
          "The population had passed two million, and the main railway lines from the rest of the country all stopped at the edge of the built-up area, leaving travellers to complete their journeys through streets jammed with carts, carriages and cattle.",
          "The lines 'stopped at the edge of the built-up area'.",
        ),
        noteLine(
          TUBE,
          "The first line, 1863",
          "A ______ named Charles Pearson argued for a railway below the roads",
          "solicitor",
          "A solicitor named Charles Pearson had been arguing for years that the answer was to put a railway beneath the roads.",
          "Pearson was 'a solicitor'.",
        ),
        noteLine(
          TUBE,
          "The first line, 1863",
          "Builders dug a ______ along a street, roofed it and covered it over",
          "trench",
          "Engineers dug a deep trench along the line of an existing street, built brick walls and an arched roof inside it, and then covered the whole thing over and relaid the road on top.",
          "They 'dug a deep trench along the line of an existing street'.",
        ),
        noteLine(
          TUBE,
          "The first line, 1863",
          "The buried ______ Fleet flooded the works in 1862",
          "river",
          "In 1862, shortly before the line opened, the Fleet, one of London's buried rivers, burst through the workings and flooded them, and the sewer carrying it had to be rebuilt.",
          "The Fleet was one of London's 'buried rivers'.",
        ),
        noteLine(
          TUBE,
          "Going deeper",
          "A ______ was pushed through the clay while the tunnel was lined behind it",
          "shield",
          "The first was a shield: a circular iron frame that was pushed forward through the clay while workers dug at the face and lined the tunnel behind them with iron segments.",
          "'A shield: a circular iron frame that was pushed forward through the clay'.",
        ),
        noteLine(
          TUBE,
          "Going deeper",
          "______ traction meant that smoke no longer had to be vented",
          "Electric",
          "The second was electric traction, which removed the need to vent smoke at all.",
          "'Electric traction… removed the need to vent smoke'.",
        ),
        noteLine(
          TUBE,
          "Going deeper",
          "The 1890 carriages were nicknamed padded ______",
          "cells",
          "Because the tunnels were narrow and round, the carriages were cramped and had tiny windows — there was nothing to see in any case — and passengers nicknamed them padded cells.",
          "Passengers 'nicknamed them padded cells'.",
        ),
        noteLine(
          TUBE,
          "Going deeper",
          "Beck's 1933 map kept only the ______ Thames for orientation",
          "River",
          "An engineering draughtsman named Harry Beck, working in his own time, drew the lines as straight verticals, horizontals and diagonals, spaced the stations evenly and threw away the scale, keeping only the River Thames for orientation.",
          "He kept 'only the River Thames for orientation'.",
        ),
        tfng(
          "People whose homes were demolished for the railway were paid for them.",
          "FALSE",
          "Whole streets of housing came down, and thousands of poor residents were displaced with no compensation and no plan for where they should go.",
          "They were displaced 'with no compensation'.",
        ),
        tfng(
          "Passengers were told that the air in the tunnels was healthy.",
          "TRUE",
          "Ventilation was provided by gaps left open to the sky, and passengers were assured that the sulphurous air was good for the lungs, a claim nobody believed.",
          "They 'were assured that the sulphurous air was good for the lungs'.",
        ),
        tfng(
          "The Central London Railway charged different fares for different distances.",
          "FALSE",
          "A more comfortable line, the Central London Railway, opened in 1900 with a flat fare of twopence, and the name the Twopenny Tube stuck to it and then to the whole system.",
          "It had 'a flat fare of twopence'.",
        ),
        tfng(
          "The writer is certain that a man with a wooden leg was employed to ride the first escalator.",
          "FALSE",
          "Whether or not he existed, the escalator did what was needed: it moved far more people than a lift, and it made the deepest stations practical.",
          "'Whether or not he existed' — the writer does not confirm the story.",
        ),
        tfng(
          "Beck was paid a large sum for his map design.",
          "NOT GIVEN",
          "",
          "The passage says he worked in his own time, but not what he was paid.",
        ),
      ],
    },
    {
      key: "t33-p2-e-scooters",
      title: "The Scooter Question",
      topic: "how cities have responded to rented electric scooters",
      difficulty: 5,
      body: `A) Shared electric scooters arrived in cities with almost no warning. The first large rental fleets appeared in the United States in 2017, and within two years the machines were on the streets of hundreds of cities on every continent except Antarctica. Companies typically launched first and consulted afterwards, dropping several hundred scooters overnight and letting demand make the argument for them. Councils that had spent years planning bus routes and cycle lanes found themselves regulating a new form of transport that was already in use, and the rules that followed were written in a hurry and varied wildly from one city to the next.

B) Some of those rules now govern the machines from the inside. Every rented scooter knows where it is, and operators can draw invisible boundaries on a map: inside a park or a pedestrian street, the motor cuts to walking pace or switches off altogether; outside the permitted zone, the scooter will not end the rental, so the rider is charged until they return. Cities have used this to protect footpaths, river fronts and historic squares without posting a single sign. The same system can raise or lower the top speed at different times of day, and some cities slow every scooter automatically after midnight.

C) The other common control is simpler: a limit on numbers. Rather than allowing any company to operate, most cities now issue a small number of permits, each specifying how many scooters may be on the street, where they must be parked and how quickly a badly parked one must be collected. Operators that fail lose the permit at the next round. This has ended the earliest and most chaotic period, when three or four competing firms would flood the same district and leave the surplus lying on the pavement.

D) Parking has been the most persistent complaint, and the people most affected are rarely the ones consulted. A scooter left across a footpath is an obstacle to anyone with a pushchair, and a serious hazard to blind and partially sighted pedestrians, who navigate by kerbs, walls and the ridged paving laid at crossings. Organisations representing them have pushed for marked bays, and cities that have installed them report cleaner pavements, although bays only work if there are enough of them and they are close to where people actually want to stop.

E) Safety has been harder to argue about, because the numbers are genuinely difficult. Emergency departments in several countries reported a sharp rise in scooter injuries as the fleets grew, most of them to riders rather than pedestrians, and many involving head injuries, alcohol or both. Set against the number of trips taken, the rate of serious injury is broadly comparable with cycling, but riders are often newcomers on an unfamiliar machine with small wheels that cope badly with potholes, and helmet use on rented scooters is very low. Cities that cut the top speed have generally seen fewer severe injuries.

F) The environmental case was oversold at the start. A scooter itself emits nothing, but it has to be built, shipped, charged, collected and repaired, and the first machines lasted only a few months of hard rental use before being scrapped. Early studies found that the emissions per kilometre of a shared scooter, once all of this was counted, were higher than those of a bus and far higher than those of walking or cycling. What matters is which journey the scooter replaces: when it takes the place of a car trip the saving is real, and when it takes the place of a walk it is not. Surveys suggest that most replaced journeys were on foot or on public transport.

G) The industry's answer has been to build sturdier machines with swappable batteries and replaceable parts, designed for several years of service rather than a single season, and to collect them by electric van rather than by a fleet of private cars. Life-cycle studies of the newer fleets look considerably better. Whether the improvement is enough remains contested, and one European capital settled the argument in its own way: after a public vote in 2023 in which a large majority of those who turned out rejected them, rented scooters were removed from Paris altogether. Elsewhere they have quietly become ordinary, which is usually how a new form of transport wins.`,
      questions: [
        heading(
          "A",
          "A machine that arrived faster than the rules",
          "Councils that had spent years planning bus routes and cycle lanes found themselves regulating a new form of transport that was already in use, and the rules that followed were written in a hurry and varied wildly from one city to the next.",
          "Paragraph A: the scooters were in use before the rules existed.",
        ),
        heading(
          "B",
          "Control through software",
          "Every rented scooter knows where it is, and operators can draw invisible boundaries on a map: inside a park or a pedestrian street, the motor cuts to walking pace or switches off altogether; outside the permitted zone, the scooter will not end the rental, so the rider is charged until they return.",
          "Paragraph B is about geofencing — control from inside the machine.",
        ),
        heading(
          "C",
          "Limiting the number on the street",
          "Rather than allowing any company to operate, most cities now issue a small number of permits, each specifying how many scooters may be on the street, where they must be parked and how quickly a badly parked one must be collected.",
          "Paragraph C: permits specify 'how many scooters may be on the street'.",
        ),
        heading(
          "D",
          "Obstacles left on the footpath",
          "A scooter left across a footpath is an obstacle to anyone with a pushchair, and a serious hazard to blind and partially sighted pedestrians, who navigate by kerbs, walls and the ridged paving laid at crossings.",
          "Paragraph D: a scooter across a footpath 'is an obstacle'.",
        ),
        heading(
          "E",
          "Counting the injuries",
          "Emergency departments in several countries reported a sharp rise in scooter injuries as the fleets grew, most of them to riders rather than pedestrians, and many involving head injuries, alcohol or both.",
          "Paragraph E weighs the injury figures.",
        ),
        heading(
          "F",
          "Does it actually save any carbon?",
          "Early studies found that the emissions per kilometre of a shared scooter, once all of this was counted, were higher than those of a bus and far higher than those of walking or cycling.",
          "Paragraph F examines the emissions claim.",
        ),
        heading(
          "G",
          "Built to last longer than a season",
          "The industry's answer has been to build sturdier machines with swappable batteries and replaceable parts, designed for several years of service rather than a single season, and to collect them by electric van rather than by a fleet of private cars.",
          "Paragraph G: machines designed to last years.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Rental companies usually launched first and ______ afterwards.",
          "consulted",
          "Companies typically launched first and consulted afterwards, dropping several hundred scooters overnight and letting demand make the argument for them.",
          "They 'launched first and consulted afterwards'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Blind pedestrians find their way using kerbs, walls and ridged ______.",
          "paving",
          "A scooter left across a footpath is an obstacle to anyone with a pushchair, and a serious hazard to blind and partially sighted pedestrians, who navigate by kerbs, walls and the ridged paving laid at crossings.",
          "They navigate by 'kerbs, walls and the ridged paving'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Use of ______ on rented scooters is very low.",
          "helmet",
          "Set against the number of trips taken, the rate of serious injury is broadly comparable with cycling, but riders are often newcomers on an unfamiliar machine with small wheels that cope badly with potholes, and helmet use on rented scooters is very low.",
          "'Helmet use on rented scooters is very low'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "A scooter saves emissions only when it replaces a ______.",
          "car trip",
          "What matters is which journey the scooter replaces: when it takes the place of a car trip the saving is real, and when it takes the place of a walk it is not.",
          "The saving is real only 'when it takes the place of a car trip'.",
        ),
        pickTwo(
          SCOOTER_STEM,
          SCOOTER_MEASURES,
          "A or C",
          "Every rented scooter knows where it is, and operators can draw invisible boundaries on a map: inside a park or a pedestrian street, the motor cuts to walking pace or switches off altogether; outside the permitted zone, the scooter will not end the rental, so the rider is charged until they return.",
          "A is correct: software cuts the motor in certain streets.",
        ),
        pickTwo(
          SCOOTER_STEM,
          SCOOTER_MEASURES,
          "A or C",
          "Rather than allowing any company to operate, most cities now issue a small number of permits, each specifying how many scooters may be on the street, where they must be parked and how quickly a badly parked one must be collected.",
          "C is correct: permits cap the number of scooters. B, D and E are not mentioned.",
        ),
      ],
    },
    {
      key: "t33-p3-fiction-empathy",
      title: "Does Reading Make Us Kinder?",
      topic: "the evidence on whether reading fiction improves social understanding",
      difficulty: 6,
      body: `It is a pleasing idea, and one that readers are naturally inclined to believe: that spending time inside invented minds makes a person better at understanding real ones. Novelists have claimed it for two centuries, and for the last twenty psychologists have tried to test it. The results are a useful lesson in how hard it is to measure something everybody already believes.

The claim became a scientific talking point in 2013, when a study in a leading journal reported that volunteers who read a few pages of literary fiction immediately afterwards scored better on a test of reading emotions than those who read popular fiction, non-fiction or nothing. The test showed photographs of people's eyes and asked participants to choose which emotion each pair expressed. The finding travelled around the world under headlines announcing that literature made people more empathetic, and it was quoted in arguments about school curriculums and library funding.

Then came the checking. Several teams ran the experiment again with larger numbers of participants, and the effect either shrank to nothing or appeared only in some versions of the task. One large replication with more than a thousand volunteers found no reliable difference between the reading groups at all. The original authors responded that the failures had changed the materials and the conditions, which is a reasonable objection and also an admission that the effect, if real, is fragile. A few minutes of reading in a laboratory is, after all, a very small dose of anything.

A second line of evidence is stronger, but it proves less. Studies that measure how much fiction people have read over a lifetime — usually by asking them to pick real authors' names out of a list containing invented ones — find that keen fiction readers do somewhat better on tests of social understanding than people who read little or who read mainly non-fiction. The relationship survives when age, education and personality are taken into account. What it cannot show is direction. People who are interested in other people may simply choose novels, in which case fiction is a symptom rather than a cause.

The few long-term studies that might settle this are difficult and rare. Following children through school and measuring both their reading and their social skills produces some evidence that early reading predicts later understanding of others, but it also produces a tangle of household factors — how much adults read aloud, how much conversation there is, how much television is on — that are hard to separate from the books themselves.

There are also reasons to expect the effect to be small even if it is real. Reading is not the only thing that offers practice at inhabiting another mind; so does watching a drama, listening to gossip, or having an argument. Some studies find similar benefits from television series with complex characters, which suggests the important ingredient is the depth of the characters rather than the presence of print. And the benefit, where measured, is a matter of a point or two on a laboratory test, not a transformation. A difference of that size can be produced by mood, tiredness or the hour at which somebody happens to sit the test, which is one reason results from different laboratories disagree so often.

The most honest summary is that the evidence supports a modest version of the claim and not the grand one. There is reasonable ground for thinking that engaging deeply with well-drawn characters exercises the same skills used in understanding real people, and rather little ground for thinking that a term of set texts will make a class kinder. Those who want literature defended may find this disappointing, but the defence was always better made on other grounds. A novel does not need to improve anyone's performance on a test of photographed eyes to be worth reading.

What the episode illustrates most clearly is a problem that reaches far beyond this one question. A striking result, published in a prominent place, is reported everywhere; the careful failures to reproduce it are reported almost nowhere, and appear years later in journals the public never sees. Teachers and policy-makers act on the first wave of coverage. By the time the picture has settled, the claim has been repeated so often that correcting it looks like pedantry, and the original finding has acquired a life of its own.`,
      questions: [
        mcq(
          "What did the 2013 study report?",
          [
            "Readers of popular fiction scored highest on an emotion test.",
            "Readers of literary fiction did better immediately afterwards on an emotion test.",
            "Reading fiction for a year improved social skills.",
            "Non-fiction readers were the least able to read emotions.",
          ],
          "Readers of literary fiction did better immediately afterwards on an emotion test.",
          "The claim became a scientific talking point in 2013, when a study in a leading journal reported that volunteers who read a few pages of literary fiction immediately afterwards scored better on a test of reading emotions than those who read popular fiction, non-fiction or nothing.",
          "Literary-fiction readers 'scored better on a test of reading emotions'.",
        ),
        mcq(
          "What happened when other teams repeated the experiment?",
          [
            "They found a larger effect than the original study.",
            "They were unable to obtain the original materials.",
            "The effect disappeared or showed up only in some versions.",
            "They found the effect only in older participants.",
          ],
          "The effect disappeared or showed up only in some versions.",
          "Several teams ran the experiment again with larger numbers of participants, and the effect either shrank to nothing or appeared only in some versions of the task.",
          "It 'either shrank to nothing or appeared only in some versions'.",
        ),
        mcq(
          "How is lifetime reading of fiction usually measured?",
          [
            "by asking people to identify real authors among invented names",
            "by counting the books in someone's home",
            "by recording how long people read each day",
            "by asking teachers to rate their students",
          ],
          "by asking people to identify real authors among invented names",
          "Studies that measure how much fiction people have read over a lifetime — usually by asking them to pick real authors' names out of a list containing invented ones — find that keen fiction readers do somewhat better on tests of social understanding than people who read little or who read mainly non-fiction.",
          "Participants 'pick real authors' names out of a list containing invented ones'.",
        ),
        mcq(
          "Why does the writer mention television series with complex characters?",
          [
            "to show that television is more effective than reading",
            "to suggest that the depth of the characters may matter more than the medium",
            "to argue that television has replaced reading among young people",
            "to explain why laboratory studies use video clips",
          ],
          "to suggest that the depth of the characters may matter more than the medium",
          "Some studies find similar benefits from television series with complex characters, which suggests the important ingredient is the depth of the characters rather than the presence of print.",
          "The ingredient may be 'the depth of the characters rather than the presence of print'.",
        ),
        mcq(
          "What does the final paragraph identify as a wider problem?",
          [
            "Journals refuse to publish replications of any kind.",
            "Striking findings are publicised while failed replications are not.",
            "Teachers rarely read academic research at all.",
            "Most psychology studies use too few participants.",
          ],
          "Striking findings are publicised while failed replications are not.",
          "A striking result, published in a prominent place, is reported everywhere; the careful failures to reproduce it are reported almost nowhere, and appear years later in journals the public never sees.",
          "The failures 'are reported almost nowhere'.",
        ),
        ynng(
          "The writer thinks the 2013 result was reported too confidently in the press.",
          "YES",
          "The finding travelled around the world under headlines announcing that literature made people more empathetic, and it was quoted in arguments about school curriculums and library funding.",
          "A fragile finding became confident headlines about empathy.",
        ),
        ynng(
          "The writer accepts the original authors' objection as entirely satisfactory.",
          "NO",
          "The original authors responded that the failures had changed the materials and the conditions, which is a reasonable objection and also an admission that the effect, if real, is fragile.",
          "It is 'also an admission that the effect… is fragile'.",
        ),
        ynng(
          "The writer believes lifetime-reading studies show that fiction causes social understanding.",
          "NO",
          "What it cannot show is direction.",
          "Such studies 'cannot show direction'.",
        ),
        ynng(
          "The writer holds that the value of novels does not depend on these test results.",
          "YES",
          "A novel does not need to improve anyone's performance on a test of photographed eyes to be worth reading.",
          "The novel is 'worth reading' regardless of the test.",
        ),
        ynng(
          "The writer claims that reading fiction has no effect on social understanding whatsoever.",
          "NO",
          "There is reasonable ground for thinking that engaging deeply with well-drawn characters exercises the same skills used in understanding real people, and rather little ground for thinking that a term of set texts will make a class kinder.",
          "The writer supports 'a modest version of the claim', not none.",
        ),
        fromList(
          "summary_completion",
          FICTION_BANK,
          "In the 2013 test, participants looked at photographs of people's ______ and chose the emotion shown.",
          "eyes",
          "The test showed photographs of people's eyes and asked participants to choose which emotion each pair expressed.",
          "The test 'showed photographs of people's eyes'.",
        ),
        fromList(
          "summary_completion",
          FICTION_BANK,
          "One replication with more than a thousand ______ found no reliable difference.",
          "volunteers",
          "One large replication with more than a thousand volunteers found no reliable difference between the reading groups at all.",
          "The replication had 'more than a thousand volunteers'.",
        ),
        fromList(
          "summary_completion",
          FICTION_BANK,
          "People interested in others may simply choose novels, making fiction a ______ rather than a cause.",
          "symptom",
          "People who are interested in other people may simply choose novels, in which case fiction is a symptom rather than a cause.",
          "Fiction would then be 'a symptom rather than a cause'.",
        ),
        fromList(
          "summary_completion",
          FICTION_BANK,
          "Household factors such as conversation and ______ complicate the long-term studies.",
          "television",
          "Following children through school and measuring both their reading and their social skills produces some evidence that early reading predicts later understanding of others, but it also produces a tangle of household factors — how much adults read aloud, how much conversation there is, how much television is on — that are hard to separate from the books themselves.",
          "The tangle includes 'how much television is on'.",
        ),
      ],
    },
  ],
};
