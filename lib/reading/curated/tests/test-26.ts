import { fromList, gapFill, noteLine, pickTwo, tfng, type CuratedTest } from "../shared";

// ---- Passage 1 · archaeology · flow-chart ------------------------------------

const DISC = {
  title: "How the Nebra sky disc was changed over time",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · people, word bank, choose TWO ------------------

const CAPTURE_PEOPLE = ["Nora Halvorsen", "Ravi Sharma", "Claire Dubois", "Sam Whitaker"];
const CAPTURE_BANK = [
  "stone",
  "aviation",
  "heated",
  "fuels",
  "energy",
  "credits",
  "water",
  "farming",
  "cooled",
  "fines",
];
const EARLY_STEM =
  "Which TWO problems with early direct air capture plants are mentioned in the passage?";
const EARLY = [
  "They have not operated at their full capacity.",
  "They take up large areas of farmland.",
  "Some companies have exaggerated what their plants can achieve.",
  "They produce dangerous waste.",
  "They cannot work in cold climates.",
];

// ---- Passage 3 · subject-heavy · lettered paragraphs and people --------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const MIND_PEOPLE = ["Helena Brandt", "Marcus Hale", "Yuki Tanaka", "Amara Osei"];

export const TEST_26: CuratedTest = {
  key: "full-test-26",
  targetBand: 8,
  passages: [
    {
      key: "t26-p1-nebra-disc",
      title: "A Map of the Bronze Age Sky",
      topic: "what the Nebra sky disc reveals about Bronze Age Europe",
      difficulty: 7,
      body: `In 1999, two men using metal detectors illegally on a hilltop near the town of Nebra, in eastern Germany, dug up a bronze disc about 32 centimetres across, together with two swords, two axes, a chisel and fragments of bracelets. Aware that their activity was against the law, they sold the objects to a dealer, and the hoard passed through the hands of several traders on the black market. Three years later, the disc was recovered in a police operation in a hotel in Basel, Switzerland, where an archaeologist posing as a buyer had arranged to inspect it. The looters were later convicted, and their evidence led archaeologists back to the place where the hoard had been buried.

The disc, now known as the Nebra sky disc, is decorated with gold symbols set into its bronze surface, which has turned green over the centuries. They include a large circle, usually interpreted as the Sun or the full Moon, a crescent representing the Moon, and a group of seven small dots, which many researchers believe represent the Pleiades, a cluster of stars visible to the naked eye. More than twenty other gold dots are scattered across the disc and appear to represent stars. Two gold arcs along the edges of the disc, one of which is now missing, and a curved band at the bottom were added later.

Detailed analysis has shown that the disc was modified several times during its history. In its first form, researchers believe, it showed only the Sun or Moon, the crescent and the stars. At a later stage, two arcs were added on opposite edges. Each arc covers an angle of about 82 degrees, which corresponds closely to the angle between the points on the horizon where the Sun rises, or sets, at midsummer and midwinter at the latitude where the disc was found. This suggests that the disc may have been used to follow the Sun's movement through the year. Later still, a curved band, often interpreted as a boat carrying the Sun across the sky, was added. After this, the edge of the disc was pierced with a series of small holes, perhaps so that it could be fixed to something. Finally, shortly before the disc was buried, one of the arcs was removed.

Some researchers have proposed an even more sophisticated interpretation. According to this view, the combination of the crescent Moon and the Pleiades served as a reminder of a rule for adjusting the calendar. Because a year based on the phases of the Moon is about eleven days shorter than a year based on the Sun, peoples who used a lunar calendar needed to add an extra month from time to time. Babylonian texts written many centuries later describe a rule for deciding when to do this, based on the appearance of the Moon close to the Pleiades. If this interpretation is correct, the knowledge represented on the disc would have been remarkably advanced for central Europe at the time.

The date of the disc has been the subject of debate. The swords and other objects found with it have been dated to around 1600 BCE, and most researchers therefore believe that the disc was buried at about this time, although it may have been made earlier. In 2020, however, two archaeologists argued that the disc might not belong with the other objects at all, suggesting that the looters had given false information about where it was found and that it could be up to a thousand years younger. This claim was firmly rejected by the researchers who had studied the hoard, who pointed to chemical analyses of soil attached to the objects and to the evidence given by the looters in court.

Chemical analysis has also revealed where the materials came from. The copper in the bronze appears to have been mined in the Alps, in what is now Austria, while the gold, once thought to have come from Romania, is now believed to have come from Cornwall, in south-west England. The tin may also have come from Cornwall. These findings suggest that the people who made the disc were part of extensive trade networks that connected distant parts of Europe during the Bronze Age.

In 2013, the Nebra sky disc was added to UNESCO's Memory of the World Register, which recognises documents of exceptional importance, and it is often described as the oldest known realistic picture of the night sky. It is now displayed at the State Museum of Prehistory in Halle, Germany, and a visitor centre has been built near the site where it was found. Its image has also appeared on a German postage stamp.

Whatever its precise date and meaning, the disc has changed how archaeologists view the societies of Bronze Age Europe. Once regarded as relatively simple farming communities, they are now seen as having possessed detailed knowledge of the sky, skilled metalworkers and connections that stretched across the continent. The disc also illustrates the damage caused by illegal excavation: because the objects were removed without being properly recorded, some questions about their original context may never be fully answered.`,
      questions: [
        tfng(
          "The men who found the disc had permission to search the site.",
          "FALSE",
          "In 1999, two men using metal detectors illegally on a hilltop near the town of Nebra, in eastern Germany, dug up a bronze disc about 32 centimetres across, together with two swords, two axes, a chisel and fragments of bracelets.",
          "They were using metal detectors 'illegally'.",
        ),
        tfng(
          "An archaeologist pretending to be a buyer helped to recover the disc.",
          "TRUE",
          "Three years later, the disc was recovered in a police operation in a hotel in Basel, Switzerland, where an archaeologist posing as a buyer had arranged to inspect it.",
          "'An archaeologist posing as a buyer' arranged to see it.",
        ),
        tfng(
          "The looters were sent to prison.",
          "NOT GIVEN",
          "",
          "The looters were 'convicted', but their sentences are not described.",
        ),
        tfng(
          "The disc may have been used to track the Sun's position over the year.",
          "TRUE",
          "This suggests that the disc may have been used to follow the Sun's movement through the year.",
          "The arcs suggest it was used 'to follow the Sun's movement through the year'.",
        ),
        tfng(
          "The Babylonian texts were written before the disc was made.",
          "FALSE",
          "Babylonian texts written many centuries later describe a rule for deciding when to do this, based on the appearance of the Moon close to the Pleiades.",
          "The texts were 'written many centuries later'.",
        ),
        tfng(
          "The gold and the copper in the disc came from the same region.",
          "FALSE",
          "The copper in the bronze appears to have been mined in the Alps, in what is now Austria, while the gold, once thought to have come from Romania, is now believed to have come from Cornwall, in south-west England.",
          "The copper came from the Alps and the gold from Cornwall.",
        ),
        tfng(
          "The visitor centre near the site receives more visitors than the museum in Halle.",
          "NOT GIVEN",
          "",
          "Both places are mentioned, but visitor numbers are not.",
        ),
        noteLine(
          DISC,
          null,
          "Two gold ______ are added on opposite edges",
          "arcs",
          "At a later stage, two arcs were added on opposite edges.",
          "'Two arcs were added on opposite edges.'",
          {
            before: [{ text: "First form: the Sun or Moon, a crescent and stars", indent: 0 }],
          },
        ),
        noteLine(
          DISC,
          null,
          "A curved band, perhaps a ______ carrying the Sun, is added",
          "boat",
          "Later still, a curved band, often interpreted as a boat carrying the Sun across the sky, was added.",
          "The band is 'often interpreted as a boat carrying the Sun'.",
        ),
        noteLine(
          DISC,
          null,
          "Small ______ are made around the edge of the disc",
          "holes",
          "After this, the edge of the disc was pierced with a series of small holes, perhaps so that it could be fixed to something.",
          "The edge 'was pierced with a series of small holes'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The disc was recovered during a police operation in a hotel in ______.",
          "Basel",
          "Three years later, the disc was recovered in a police operation in a hotel in Basel, Switzerland, where an archaeologist posing as a buyer had arranged to inspect it.",
          "It was recovered 'in a hotel in Basel'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A year based on the Moon is about ______ shorter than one based on the Sun.",
          "eleven days",
          "Because a year based on the phases of the Moon is about eleven days shorter than a year based on the Sun, peoples who used a lunar calendar needed to add an extra month from time to time.",
          "A lunar year is 'about eleven days shorter'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The gold on the disc is now believed to have come from ______.",
          "Cornwall",
          "The copper in the bronze appears to have been mined in the Alps, in what is now Austria, while the gold, once thought to have come from Romania, is now believed to have come from Cornwall, in south-west England.",
          "The gold 'is now believed to have come from Cornwall'.",
        ),
      ],
    },
    {
      key: "t26-p2-direct-air-capture",
      title: "Pulling Carbon from the Air",
      topic: "the promise and limits of removing carbon dioxide from the atmosphere",
      difficulty: 8,
      body: `In a volcanic landscape outside Reykjavik, the capital of Iceland, rows of large fans draw air into metal containers lined with filters. The filters capture carbon dioxide, which is then separated, mixed with water and pumped deep underground, where it reacts with volcanic rock and turns into stone within a few years. The facility, which began operating in 2024, is one of the world's largest plants for direct air capture: the removal of carbon dioxide directly from the atmosphere. Its designers say that, when running at full capacity, it can capture up to 36,000 tonnes of the gas each year.

Direct air capture has attracted growing attention because most climate scientists now agree that cutting emissions alone will not be enough to meet international climate targets. Some carbon dioxide will also need to be removed from the atmosphere, both to balance emissions from activities that are difficult to eliminate, such as aviation and some industrial processes, and eventually to reduce the amount of the gas that has already accumulated. Climate economist Dr Nora Halvorsen stresses that removal is not an alternative to cutting emissions but an addition to it. "Every tonne we avoid emitting is cheaper than a tonne we have to take back out of the air," she says.

The technology works in several ways, but most systems use chemicals that bind to carbon dioxide. In one common approach, air passes over a solid material that captures the gas; when the material is full, it is heated to release the carbon dioxide in concentrated form, and the material can then be used again. Other systems use liquid solutions instead. Once captured, the carbon dioxide can be stored permanently underground or used to make products such as fuels and building materials, although carbon dioxide used in fuels is eventually released again when the fuel is burned.

The greatest challenge is cost. Because carbon dioxide makes up only about 0.04 per cent of the air, enormous volumes of air must be processed to capture meaningful quantities, which requires large amounts of energy. Estimates of the current cost vary, but many are in the range of several hundred dollars per tonne of carbon dioxide, far more than most other ways of reducing emissions. Chemical engineer Professor Ravi Sharma believes that costs will fall as the technology matures, as happened with solar panels and batteries. "The first plants are always expensive," he says. "What matters is how quickly we learn from them."

Others are less optimistic. Energy analyst Dr Claire Dubois points out that the physical challenge of processing so much air places limits on how far costs can fall, and that the energy these plants use must come from clean sources if they are to deliver real benefits. "If you power a capture plant with electricity from coal, you may release more carbon than you remove," she says. Early plants have also struggled to operate at their full stated capacity. In addition, some companies have been criticised for exaggerating what their facilities can achieve.

The scale of what may be needed is daunting. Some scenarios for limiting global warming suggest that direct air capture might need to remove hundreds of millions, or even billions, of tonnes of carbon dioxide each year by the middle of the century. Today's plants together capture only a tiny fraction of that amount. Reaching such levels would require thousands of large plants and enormous quantities of clean energy, as well as suitable places to store the gas safely underground.

Governments have begun to provide support. The United States offers tax credits for each tonne of carbon dioxide that is captured and stored, and it has funded the development of large direct air capture centres. Some large companies have also agreed to buy carbon removal in advance, giving the industry a guaranteed income. Environmental campaigner Sam Whitaker warns, however, that such purchases could be used by polluting companies to avoid making real reductions. "Carbon removal should never become a licence to keep polluting," he says.

For now, most experts see direct air capture as a promising but unproven technology. It may eventually play an important role in addressing climate change, particularly in dealing with the emissions that are hardest to avoid. But its future depends on reducing costs, securing large supplies of clean energy and demonstrating that stored carbon remains safely locked away. Halvorsen believes the most sensible approach is to keep developing the technology while cutting emissions as quickly as possible. "We need to invest in removal," she says, "but we cannot bet the planet on it."`,
      questions: [
        fromList(
          "matching_features",
          CAPTURE_PEOPLE,
          "Avoiding emissions costs less than removing carbon from the air later.",
          "Nora Halvorsen",
          '"Every tonne we avoid emitting is cheaper than a tonne we have to take back out of the air," she says.',
          "Halvorsen: avoiding a tonne 'is cheaper than a tonne we have to take back out of the air'.",
        ),
        fromList(
          "matching_features",
          CAPTURE_PEOPLE,
          "The most important thing is how fast lessons are learned from the first plants.",
          "Ravi Sharma",
          '"What matters is how quickly we learn from them."',
          "Sharma: 'What matters is how quickly we learn from them.'",
        ),
        fromList(
          "matching_features",
          CAPTURE_PEOPLE,
          "A capture plant could do more harm than good if it uses the wrong source of power.",
          "Claire Dubois",
          '"If you power a capture plant with electricity from coal, you may release more carbon than you remove," she says.',
          "Dubois: coal power could 'release more carbon than you remove'.",
        ),
        fromList(
          "matching_features",
          CAPTURE_PEOPLE,
          "Businesses might use carbon removal as a way to avoid cutting their own emissions.",
          "Sam Whitaker",
          "Environmental campaigner Sam Whitaker warns, however, that such purchases could be used by polluting companies to avoid making real reductions.",
          "Whitaker warns purchases could help polluters 'avoid making real reductions'.",
        ),
        fromList(
          "matching_features",
          CAPTURE_PEOPLE,
          "It would be unwise to depend entirely on carbon removal.",
          "Nora Halvorsen",
          '"We need to invest in removal," she says, "but we cannot bet the planet on it."',
          "Halvorsen: 'we cannot bet the planet on it'.",
        ),
        fromList(
          "summary_completion",
          CAPTURE_BANK,
          "At the Icelandic plant, carbon dioxide is pumped underground, where it turns into ______.",
          "stone",
          "The filters capture carbon dioxide, which is then separated, mixed with water and pumped deep underground, where it reacts with volcanic rock and turns into stone within a few years.",
          "It 'turns into stone within a few years'. It is mixed with water, but does not become water.",
        ),
        fromList(
          "summary_completion",
          CAPTURE_BANK,
          "Carbon removal is needed partly to balance emissions from activities such as ______.",
          "aviation",
          "Some carbon dioxide will also need to be removed from the atmosphere, both to balance emissions from activities that are difficult to eliminate, such as aviation and some industrial processes, and eventually to reduce the amount of the gas that has already accumulated.",
          "Hard-to-eliminate activities include 'aviation and some industrial processes'.",
        ),
        fromList(
          "summary_completion",
          CAPTURE_BANK,
          "In one approach, the capture material is ______ to release the gas.",
          "heated",
          "In one common approach, air passes over a solid material that captures the gas; when the material is full, it is heated to release the carbon dioxide in concentrated form, and the material can then be used again.",
          "The material 'is heated to release the carbon dioxide'.",
        ),
        fromList(
          "summary_completion",
          CAPTURE_BANK,
          "Carbon dioxide that is used to make ______ is eventually released again.",
          "fuels",
          "Once captured, the carbon dioxide can be stored permanently underground or used to make products such as fuels and building materials, although carbon dioxide used in fuels is eventually released again when the fuel is burned.",
          "Carbon dioxide 'used in fuels is eventually released again'.",
        ),
        fromList(
          "summary_completion",
          CAPTURE_BANK,
          "Because the gas is so dilute, capturing it requires large amounts of ______.",
          "energy",
          "Because carbon dioxide makes up only about 0.04 per cent of the air, enormous volumes of air must be processed to capture meaningful quantities, which requires large amounts of energy.",
          "Processing so much air 'requires large amounts of energy'.",
        ),
        fromList(
          "summary_completion",
          CAPTURE_BANK,
          "The United States offers tax ______ for carbon dioxide that is captured and stored.",
          "credits",
          "The United States offers tax credits for each tonne of carbon dioxide that is captured and stored, and it has funded the development of large direct air capture centres.",
          "The US 'offers tax credits for each tonne'.",
        ),
        pickTwo(
          EARLY_STEM,
          EARLY,
          "A or C",
          "Early plants have also struggled to operate at their full stated capacity.",
          "A is correct: they 'struggled to operate at their full stated capacity'. B and D are not mentioned.",
        ),
        pickTwo(
          EARLY_STEM,
          EARLY,
          "A or C",
          "In addition, some companies have been criticised for exaggerating what their facilities can achieve.",
          "C is correct: companies were criticised 'for exaggerating what their facilities can achieve'. E is not mentioned — the largest plant is in Iceland.",
        ),
      ],
    },
    {
      key: "t26-p3-consciousness",
      title: "The Hardest Problem in Science",
      topic: "the scientific and philosophical debate over consciousness",
      difficulty: 9,
      body: `A) Of all the phenomena that science seeks to explain, consciousness may be the most perplexing. We know, from our own experience, what it is like to see the colour red, to feel pain or to taste coffee. Yet it is far from clear how such subjective experiences arise from the physical activity of billions of nerve cells. Neuroscience has made remarkable progress in identifying which brain processes accompany particular experiences, but explaining why those processes should be accompanied by any experience at all has proved far more elusive. In 1995, the philosopher David Chalmers called this "the hard problem" of consciousness, distinguishing it from the "easy problems" of explaining how the brain processes information, directs attention and controls behaviour.

B) The easy problems, Chalmers acknowledged, are not easy in any practical sense; solving them may take decades. But they are, in principle, the kind of problem that standard scientific methods can address, because they concern functions that can be described in terms of mechanisms. The hard problem is different, because even a complete account of every mechanism in the brain would seem to leave open the question of why there is "something it is like" to be the system in question. Philosopher Dr Helena Brandt argues that this distinction has been enormously valuable. "It forced scientists to be clear about what, exactly, they were claiming to explain," she says.

C) Not everyone accepts that the hard problem is genuine. Some philosophers and scientists argue that once all the functions of the brain have been explained, nothing will remain to be accounted for; the sense that something is missing, they suggest, is itself a product of the way our brains represent their own activity. Cognitive scientist Professor Marcus Hale takes this position. "The feeling that consciousness is a special mystery is a feature of the brain's model of itself, not evidence of a gap in our science," he says. Critics respond that this view explains away the very thing that most needs explaining.

D) Among scientific theories of consciousness, two have attracted particular attention. The first, known as global workspace theory, proposes that information becomes conscious when it is broadcast widely across the brain, particularly through networks linking its front and back regions, so that it becomes available to many different processes at once, such as memory, planning and speech. The second, integrated information theory, takes a more abstract approach. It holds that consciousness corresponds to the amount of integrated information that a system possesses, a quantity that can in principle be calculated, and it places the physical basis of consciousness mainly in the back of the brain. Neuroscientist Dr Yuki Tanaka, who studies anaesthesia, notes that any successful theory must also explain why consciousness fades when patients are given a general anaesthetic.

E) The two theories make different predictions, and in 2019 a group of researchers, including supporters of both, agreed to test them against each other in a series of experiments whose design was fixed in advance. This kind of study, known as an adversarial collaboration, is intended to prevent researchers from interpreting results in ways that favour their own theory. The first results, announced in 2023 and published in a scientific journal in 2025, challenged key predictions of both theories, and neither was clearly supported. Neuroscientist Dr Amara Osei, who was not involved in the project, describes the approach as a model for the field. "Agreeing beforehand what would count as failure is exactly what a young science needs," she says.

F) The announcement of the early results was followed by an unusually public dispute. More than a hundred researchers signed an open letter describing integrated information theory as pseudoscience, arguing that its central claims could not be properly tested and that media coverage of the collaboration had exaggerated the theory's standing. The letter provoked a strong reaction from other scientists, who argued that such a label was unjustified and damaging to scientific debate. Brandt regards the episode as revealing. "The controversy showed how little agreement there is, even about what would count as a scientific theory of consciousness," she says.

G) The stakes of these debates extend well beyond academic philosophy. Questions about consciousness bear on how doctors treat patients who cannot communicate after brain injuries, on whether animals such as fish or insects can suffer, and increasingly on whether artificial intelligence systems could ever have experiences of their own. Hale believes that such questions can only be settled by better theories. Osei, by contrast, argues that practical decisions cannot wait for theoretical agreement. "We have to act under uncertainty, and that means taking the possibility of consciousness seriously wherever the evidence points to it," she says.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the origin of a well-known distinction between two kinds of problem",
          "A",
          'In 1995, the philosopher David Chalmers called this "the hard problem" of consciousness, distinguishing it from the "easy problems" of explaining how the brain processes information, directs attention and controls behaviour.',
          "Paragraph A: Chalmers named 'the hard problem' in 1995.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the view that the brain itself creates the sense of a mystery",
          "C",
          "Some philosophers and scientists argue that once all the functions of the brain have been explained, nothing will remain to be accounted for; the sense that something is missing, they suggest, is itself a product of the way our brains represent their own activity.",
          "Paragraph C: the sense of something missing is 'a product of the way our brains represent their own activity'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the parts of the brain that each theory links to consciousness",
          "D",
          "It holds that consciousness corresponds to the amount of integrated information that a system possesses, a quantity that can in principle be calculated, and it places the physical basis of consciousness mainly in the back of the brain.",
          "Paragraph D contrasts front-and-back networks with the back of the brain.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the purpose of a particular way of organising research",
          "E",
          "This kind of study, known as an adversarial collaboration, is intended to prevent researchers from interpreting results in ways that favour their own theory.",
          "Paragraph E explains what an adversarial collaboration 'is intended to prevent'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the relevance of the debate to the treatment of patients",
          "G",
          "Questions about consciousness bear on how doctors treat patients who cannot communicate after brain injuries, on whether animals such as fish or insects can suffer, and increasingly on whether artificial intelligence systems could ever have experiences of their own.",
          "Paragraph G mentions patients who cannot communicate after brain injuries.",
        ),
        fromList(
          "matching_features",
          MIND_PEOPLE,
          "A distinction made researchers state their goals more precisely.",
          "Helena Brandt",
          '"It forced scientists to be clear about what, exactly, they were claiming to explain," she says.',
          "Brandt: it 'forced scientists to be clear about what, exactly, they were claiming to explain'.",
        ),
        fromList(
          "matching_features",
          MIND_PEOPLE,
          "The apparent mystery of consciousness does not show that science is incomplete.",
          "Marcus Hale",
          '"The feeling that consciousness is a special mystery is a feature of the brain\'s model of itself, not evidence of a gap in our science," he says.',
          "Hale: the feeling is 'not evidence of a gap in our science'.",
        ),
        fromList(
          "matching_features",
          MIND_PEOPLE,
          "A good theory must explain what happens to consciousness under anaesthesia.",
          "Yuki Tanaka",
          "Neuroscientist Dr Yuki Tanaka, who studies anaesthesia, notes that any successful theory must also explain why consciousness fades when patients are given a general anaesthetic.",
          "Tanaka: a theory must explain 'why consciousness fades' under anaesthetic.",
        ),
        fromList(
          "matching_features",
          MIND_PEOPLE,
          "It is valuable to decide in advance what result would count against a theory.",
          "Amara Osei",
          '"Agreeing beforehand what would count as failure is exactly what a young science needs," she says.',
          "Osei: 'Agreeing beforehand what would count as failure' is what the field needs.",
        ),
        fromList(
          "matching_features",
          MIND_PEOPLE,
          "Researchers do not even agree on what a scientific theory of consciousness would look like.",
          "Helena Brandt",
          '"The controversy showed how little agreement there is, even about what would count as a scientific theory of consciousness," she says.',
          "Brandt: there is little agreement 'even about what would count as a scientific theory'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Chalmers contrasted the hard problem with what he called the ______.",
          "easy problems",
          'In 1995, the philosopher David Chalmers called this "the hard problem" of consciousness, distinguishing it from the "easy problems" of explaining how the brain processes information, directs attention and controls behaviour.',
          "He distinguished it 'from the easy problems'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "One theory links consciousness to the amount of ______ that a system possesses.",
          "integrated information",
          "It holds that consciousness corresponds to the amount of integrated information that a system possesses, a quantity that can in principle be calculated, and it places the physical basis of consciousness mainly in the back of the brain.",
          "Consciousness corresponds to 'the amount of integrated information'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "A study in which supporters of rival theories test them together is known as an ______.",
          "adversarial collaboration",
          "This kind of study, known as an adversarial collaboration, is intended to prevent researchers from interpreting results in ways that favour their own theory.",
          "It is 'known as an adversarial collaboration'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "More than a hundred researchers signed an ______ criticising one of the theories.",
          "open letter",
          "More than a hundred researchers signed an open letter describing integrated information theory as pseudoscience, arguing that its central claims could not be properly tested and that media coverage of the collaboration had exaggerated the theory's standing.",
          "They 'signed an open letter'.",
        ),
      ],
    },
  ],
};
