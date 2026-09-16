import { fromList, gapFill, noteLine, pickTwo, tfng, type CuratedTest } from "../shared";

// ---- Passage 1 · flow-chart ---------------------------------------------------

const TRACING = {
  title: "How the origin of the Altar Stone was traced",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · people, word bank, choose TWO --------------------------------

const PHONE_PEOPLE = ["Hannah Kerr", "Daniel Osei", "Priya Nair", "Marcus Lindahl"];
const PHONE_BANK = [
  "distraction",
  "willpower",
  "second",
  "fraction",
  "apps",
  "identification",
  "location",
  "fashion",
  "sleep",
];
const DIFFICULTIES_STEM =
  "Which TWO of the following are mentioned as difficulties of living without a smartphone?";
const DIFFICULTIES = [
  "paying for parking",
  "finding a basic phone in the shops",
  "the high price of simple phones",
  "communicating with children's schools",
  "keeping in touch with relatives abroad",
];

// ---- Passage 3 · lettered paragraphs and people -------------------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const FORECAST_PEOPLE = ["Sanna Virtanen", "Tomasz Nowak", "Amina Yusuf", "Rafael Mendes"];

export const TEST_03: CuratedTest = {
  key: "full-test-03",
  targetBand: 6,
  passages: [
    {
      key: "t03-p1-altar-stone",
      title: "The Stone That Travelled from Scotland",
      topic: "how scientists discovered where Stonehenge's Altar Stone came from",
      difficulty: 5,
      body: `Stonehenge, the prehistoric monument on Salisbury Plain in southern England, has been studied for centuries, yet it continues to surprise researchers. In 2024, a team of scientists announced a discovery that changed long-held ideas about how the monument was built. They showed that one of its largest stones had been brought not from nearby, nor from Wales, as had been believed for decades, but from the far north of Scotland, more than 700 kilometres away.

Stonehenge was constructed in several stages over more than a thousand years, beginning around 3000 BCE. The monument that visitors see today is only a partial ruin of the original structure, since many stones have fallen or been removed over the centuries. It contains two main kinds of stone. The largest, known as sarsens, are blocks of sandstone that were brought from about 25 kilometres to the north. The smaller bluestones, by contrast, were transported from the Preseli Hills in west Wales, more than 200 kilometres away. How people without metal tools moved such heavy stones over these distances has fascinated archaeologists for generations.

The stone at the centre of the new research is called the Altar Stone. It is a flat slab of greenish sandstone, about five metres long and weighing around six tonnes, which lies beneath two fallen stones in the centre of the monument. Visitors cannot normally see it, since it is hidden beneath the larger stones that fell on top of it, probably thousands of years ago. Because it is a different kind of rock from the sarsens, it was long grouped with the bluestones and assumed to have come from Wales. Its name comes from a seventeenth-century suggestion that it might have served as an altar, although there is no evidence that it was ever used in this way.

Doubts about the Welsh origin had been growing for some time. In 2023, researchers showed that the chemical make-up of the Altar Stone did not match rocks from the area in Wales that had been proposed as its source. The question then became where else it could have come from. To answer it, a team led by geologists at an Australian university examined tiny fragments of the stone that had been collected during earlier excavations.

The researchers were fortunate that such fragments existed at all. Removing samples from the stone itself is not permitted, since it is part of a protected World Heritage Site, so the team relied on small pieces that archaeologists had found in the soil around it and stored in museum collections.

Their method relied on minerals that act as natural clocks. Sandstone is made of grains that were worn away from older rocks and carried by rivers before settling into layers. Some of these grains, such as zircon, contain radioactive elements that decay at a known rate, which allows scientists to calculate when the grains first formed. By measuring the ages of hundreds of grains, the researchers produced a kind of fingerprint for the Altar Stone. They then compared this fingerprint with those of sandstones from different parts of Britain. The closest match came from a region of north-east Scotland known as the Orcadian Basin.

The finding raises a difficult question: how was a six-tonne stone moved such a distance more than 4,500 years ago? Transporting it overland would have meant crossing mountains, rivers and dense forests. Some researchers therefore think it is more likely that the stone was carried along the coast by boat, although a journey by sea would also have carried serious risks. Others point out that this would have required large, sturdy boats, for which little direct evidence survives. At present, there is no direct evidence for either route.

Whatever the method, the discovery suggests that the communities of Neolithic Britain were more closely connected than was once thought. Moving the Altar Stone would have required planning, cooperation and considerable effort, which implies that people living at opposite ends of the island shared ideas and had reasons to work together. Some experts believe the stone may have been a gift or a symbol of an alliance between distant groups. The research team also noted that the same techniques could now be used to trace the origins of other stones at ancient monuments. More than a century after the first scientific excavations at Stonehenge, the monument still has secrets to reveal.`,
      questions: [
        tfng(
          "For many years, scientists thought that the Altar Stone had come from Wales.",
          "TRUE",
          "They showed that one of its largest stones had been brought not from nearby, nor from Wales, as had been believed for decades, but from the far north of Scotland, more than 700 kilometres away.",
          "The Welsh origin 'had been believed for decades'.",
        ),
        tfng(
          "The sarsen stones were brought from further away than the bluestones.",
          "FALSE",
          "The largest, known as sarsens, are blocks of sandstone that were brought from about 25 kilometres to the north.",
          "The sarsens came from about 25 kilometres away; the bluestones travelled more than 200 kilometres.",
        ),
        tfng(
          "There is evidence that the Altar Stone was once used for religious ceremonies.",
          "FALSE",
          "Its name comes from a seventeenth-century suggestion that it might have served as an altar, although there is no evidence that it was ever used in this way.",
          "The name is only a suggestion — there is 'no evidence that it was ever used in this way'.",
        ),
        tfng(
          "The 2023 study was carried out by the same team that made the 2024 discovery.",
          "NOT GIVEN",
          "",
          "The 2023 researchers and the 2024 team are both mentioned, but the passage never says whether they were the same people.",
        ),
        tfng(
          "The researchers were allowed to cut new samples from the Altar Stone.",
          "FALSE",
          "Removing samples from the stone itself is not permitted, since it is part of a protected World Heritage Site, so the team relied on small pieces that archaeologists had found in the soil around it and stored in museum collections.",
          "Taking samples from the stone 'is not permitted'; the team used old fragments instead.",
        ),
        tfng(
          "Some researchers think the stone is more likely to have been moved by sea than over land.",
          "TRUE",
          "Some researchers therefore think it is more likely that the stone was carried along the coast by boat, although a journey by sea would also have carried serious risks.",
          "Some think it 'more likely' that it went 'along the coast by boat'.",
        ),
        tfng(
          "Rocks from the Orcadian Basin were also used to build other ancient monuments in Scotland.",
          "NOT GIVEN",
          "",
          "The passage says the same techniques could trace other stones, but not that rock from this region was used elsewhere.",
        ),
        noteLine(
          TRACING,
          null,
          "The ages of hundreds of mineral ______ were measured",
          "grains",
          "By measuring the ages of hundreds of grains, the researchers produced a kind of fingerprint for the Altar Stone.",
          "The team measured 'the ages of hundreds of grains'.",
          {
            before: [
              { text: "Fragments collected during earlier excavations were examined", indent: 0 },
            ],
          },
        ),
        noteLine(
          TRACING,
          null,
          "The results produced a ______ for the stone",
          "fingerprint",
          "By measuring the ages of hundreds of grains, the researchers produced a kind of fingerprint for the Altar Stone.",
          "The ages together made 'a kind of fingerprint'.",
        ),
        noteLine(
          TRACING,
          null,
          "This was compared with ______ from different parts of Britain",
          "sandstones",
          "They then compared this fingerprint with those of sandstones from different parts of Britain.",
          "The fingerprint was compared with 'sandstones from different parts of Britain'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Some grains, such as zircon, contain radioactive elements that decay at a ______.",
          "known rate",
          "Some of these grains, such as zircon, contain radioactive elements that decay at a known rate, which allows scientists to calculate when the grains first formed.",
          "The elements 'decay at a known rate', which is what lets the grains be dated.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Moving the stone over land would have meant crossing mountains, rivers and ______.",
          "dense forests",
          "Transporting it overland would have meant crossing mountains, rivers and dense forests.",
          "The overland route meant 'crossing mountains, rivers and dense forests'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Some experts think the stone may have been a symbol of an ______ between distant groups.",
          "alliance",
          "Some experts believe the stone may have been a gift or a symbol of an alliance between distant groups.",
          "It may have been 'a symbol of an alliance between distant groups'.",
        ),
      ],
    },
    {
      key: "t03-p2-simple-phones",
      title: "The Return of the Simple Phone",
      topic: "why some people are swapping smartphones for basic phones",
      difficulty: 6,
      body: `For more than a decade, the smartphone has been one of the most desirable objects in the world. It combines a camera, a map, a music player, a bank and a social life in a device that fits in a pocket. Yet in recent years a small but noticeable number of people have chosen to give up these powerful machines in favour of basic mobile phones that can do little more than make calls and send text messages. Such devices, sometimes called "dumbphones", have attracted growing attention in newspapers and on social media, particularly among young adults. Online searches for basic phones have risen, and some shops that sell second-hand mobiles report steady demand for older models.

Some of the interest comes from worries about time and attention. Many smartphone users check their devices dozens of times a day, and apps are often designed to encourage people to keep scrolling. Some studies have linked heavy smartphone use with poorer sleep and lower concentration, although researchers disagree about how strong these effects are and whether phones are the cause. Psychologist Dr Hannah Kerr, who studies digital habits, argues that the problem is not the phone itself but the constant availability of distraction. "When everything is one tap away," she says, "people find it very hard to do one thing at a time." Switching to a simpler phone, in her view, removes temptation rather than relying on willpower.

For others, the motivation is closer to fashion. Older models with physical buttons and small screens have become a kind of retro accessory, and some manufacturers have released modern versions of phones that were popular in the early 2000s. Marketing consultant Daniel Osei believes that for many buyers the appeal lies as much in the image as in any change of behaviour. "Carrying a basic phone says something about you," he suggests. "It tells people you are not controlled by your screen, even if you still have a smartphone at home."

Indeed, the number of people who abandon smartphones completely appears to be small. Surveys suggest that many dumbphone users treat the device as a second phone, taking it out in the evening or at weekends while keeping their smartphone for work. Retail analyst Priya Nair points out that sales of basic phones remain a tiny fraction of the global market. The companies that make basic phones rarely publish detailed sales figures, which makes the size of the trend difficult to measure. Nair warns against reading too much into the trend, which she describes as "more visible than it is large".

Giving up a smartphone can also be surprisingly difficult in practice. In many countries, banking, public transport tickets, parking payments and even access to some workplaces now depend on apps. Parents may be expected to communicate with schools through messaging services, and many forms of identification are increasingly stored on phones. Some people also rely on their smartphones for safety, such as sharing their location with family members when travelling alone. Technology writer Marcus Lindahl, who spent a year using only a basic phone, describes the experience as liberating but inconvenient. He found that he needed to plan journeys in advance and often had to ask friends to share information that was only available online.

Schools have become an important part of the debate. In several countries, governments have introduced or considered restrictions on the use of smartphones during the school day, and some groups of parents have agreed not to give their children a smartphone before a certain age. Kerr welcomes these efforts but stresses that rules are most effective when children understand the reasons for them. Without that understanding, she argues, restrictions may simply delay heavy use rather than prevent it. Critics of such bans argue that young people need to learn to use technology responsibly rather than being kept away from it.

Whether simple phones will ever become more than a niche product remains to be seen. Some manufacturers are experimenting with devices that sit between the two extremes, offering maps and music but no social media or web browser. Others have added settings to smartphones that allow users to hide apps or turn the screen grey to make it less attractive. What the trend does show is that many people are rethinking their relationship with technology. As Osei puts it, "The question is no longer whether you can be reached at every moment, but whether you want to be."`,
      questions: [
        fromList(
          "matching_features",
          PHONE_PEOPLE,
          "A simpler phone works by removing temptation rather than depending on self-control.",
          "Hannah Kerr",
          "Switching to a simpler phone, in her view, removes temptation rather than relying on willpower.",
          "Kerr says a simpler phone 'removes temptation rather than relying on willpower'.",
        ),
        fromList(
          "matching_features",
          PHONE_PEOPLE,
          "Part of the attraction of basic phones is the image they give their owners.",
          "Daniel Osei",
          "Marketing consultant Daniel Osei believes that for many buyers the appeal lies as much in the image as in any change of behaviour.",
          "Osei says the appeal 'lies as much in the image as in any change of behaviour'.",
        ),
        fromList(
          "matching_features",
          PHONE_PEOPLE,
          "The trend receives more attention than its real size deserves.",
          "Priya Nair",
          'Nair warns against reading too much into the trend, which she describes as "more visible than it is large".',
          "Nair calls the trend 'more visible than it is large'.",
        ),
        fromList(
          "matching_features",
          PHONE_PEOPLE,
          "Life without a smartphone requires more organisation in advance.",
          "Marcus Lindahl",
          "He found that he needed to plan journeys in advance and often had to ask friends to share information that was only available online.",
          "'He' is Lindahl, who 'needed to plan journeys in advance'.",
        ),
        fromList(
          "matching_features",
          PHONE_PEOPLE,
          "Rules for children work better when the reasons behind them are explained.",
          "Hannah Kerr",
          "Kerr welcomes these efforts but stresses that rules are most effective when children understand the reasons for them.",
          "Kerr says rules work best 'when children understand the reasons for them'. People can be used more than once.",
        ),
        fromList(
          "summary_completion",
          PHONE_BANK,
          "Kerr believes the real problem is the constant availability of ______.",
          "distraction",
          "Psychologist Dr Hannah Kerr, who studies digital habits, argues that the problem is not the phone itself but the constant availability of distraction.",
          "The problem is 'the constant availability of distraction', not the phone itself.",
        ),
        fromList(
          "summary_completion",
          PHONE_BANK,
          "Many people use a basic phone as a ______ device rather than as a replacement.",
          "second",
          "Surveys suggest that many dumbphone users treat the device as a second phone, taking it out in the evening or at weekends while keeping their smartphone for work.",
          "Users 'treat the device as a second phone'.",
        ),
        fromList(
          "summary_completion",
          PHONE_BANK,
          "Sales of basic phones make up only a tiny ______ of the global market.",
          "fraction",
          "Retail analyst Priya Nair points out that sales of basic phones remain a tiny fraction of the global market.",
          "Sales 'remain a tiny fraction of the global market'.",
        ),
        fromList(
          "summary_completion",
          PHONE_BANK,
          "Everyday services such as banking and transport tickets increasingly rely on ______.",
          "apps",
          "In many countries, banking, public transport tickets, parking payments and even access to some workplaces now depend on apps.",
          "These services 'now depend on apps'.",
        ),
        fromList(
          "summary_completion",
          PHONE_BANK,
          "Many forms of ______ are now stored on phones.",
          "identification",
          "Parents may be expected to communicate with schools through messaging services, and many forms of identification are increasingly stored on phones.",
          "'Many forms of identification are increasingly stored on phones'.",
        ),
        fromList(
          "summary_completion",
          PHONE_BANK,
          "For safety, some people share their ______ with family members.",
          "location",
          "Some people also rely on their smartphones for safety, such as sharing their location with family members when travelling alone.",
          "People share 'their location with family members'.",
        ),
        pickTwo(
          DIFFICULTIES_STEM,
          DIFFICULTIES,
          "A or D",
          "In many countries, banking, public transport tickets, parking payments and even access to some workplaces now depend on apps.",
          "A is correct: 'parking payments' now depend on apps. The passage never mentions shortages or the price of basic phones (B, C).",
        ),
        pickTwo(
          DIFFICULTIES_STEM,
          DIFFICULTIES,
          "A or D",
          "Parents may be expected to communicate with schools through messaging services, and many forms of identification are increasingly stored on phones.",
          "D is correct: parents 'may be expected to communicate with schools through messaging services'. E is not mentioned.",
        ),
      ],
    },
    {
      key: "t03-p3-ai-weather",
      title: "Forecasting the Weather with Machines",
      topic: "how machine learning is changing weather prediction",
      difficulty: 7,
      body: `A) For more than half a century, weather forecasts have been produced in essentially the same way. Supercomputers divide the atmosphere into a three-dimensional grid and use the laws of physics to calculate how temperature, pressure, wind and moisture will change in each box over time. This approach, known as numerical weather prediction, has improved steadily: a five-day forecast today is roughly as accurate as a one-day forecast was in the 1980s. Each improvement has depended on more detailed observations and faster computers. But the calculations are enormously demanding, and running a single global forecast requires some of the most powerful computers in the world.

B) Since around 2022, a very different approach has emerged. Instead of solving equations, machine-learning models are trained on decades of past weather data, learning the patterns that link the state of the atmosphere at one moment to its state a few hours later. Once trained, such a model can produce a ten-day global forecast in about a minute on a single processor, compared with hours on a supercomputer. Several technology companies and research groups have released models of this kind. One such system was described in a scientific journal in 2023 after it outperformed a leading traditional model on most of the measures it was tested on.

C) The speed of these systems has attracted particular interest. Meteorologist Dr Sanna Virtanen explains that forecasters rarely rely on a single prediction; instead they run a collection of slightly different forecasts, known as an ensemble, to estimate how likely different outcomes are. "Because each run is so cheap, a machine-learning model can produce hundreds of ensemble members," she says, "which gives a much better picture of the uncertainty." In 2025, the European Centre for Medium-Range Weather Forecasts, one of the world's leading forecasting organisations, began running a machine-learning model alongside its traditional system in its daily operations. It has also made some of these forecasts openly available.

D) Not everyone is convinced that the new models are ready to replace physics-based methods. Atmospheric physicist Professor Tomasz Nowak points out that machine-learning systems learn from the past, and that the climate is changing in ways that may make historical data a less reliable guide. He is particularly concerned about extreme events, such as record-breaking heatwaves, which by definition are rare or absent in the training data. "A model that has never seen something may struggle to predict it," he warns. He also notes that some early models produced forecasts that looked realistic but broke basic physical rules, such as the conservation of energy.

E) There are also questions about how the models reach their conclusions. Traditional forecasts can be traced back to physical laws, so when a prediction goes wrong, scientists can often identify the cause. Machine-learning models, by contrast, do not reveal their reasoning. Computer scientist Dr Amina Yusuf argues that this lack of transparency matters less than critics suggest, provided the models are carefully tested. "We trust medicines because of the evidence from trials, not because we understand every step of how they work," she says. Some researchers are now developing methods to show which parts of the input data most influenced a particular forecast.

F) Importantly, the new systems still depend on the old ones. Machine-learning models need a starting point: an accurate picture of the atmosphere at the present moment, which is produced by combining millions of observations from satellites, weather balloons, aircraft and ground stations. At present, this starting point is created using the same physics-based methods that the models are sometimes said to replace. Without it, even the most sophisticated model would have nothing to work with. Forecaster Rafael Mendes describes the relationship as a partnership rather than a competition, arguing that the most useful forecasts in the coming years will combine the strengths of both approaches.

G) The potential benefits are especially large for countries with limited resources. Many national weather services cannot afford supercomputers, and rely on forecasts produced elsewhere. Faster, cheaper models could allow them to produce detailed local forecasts of their own, which could improve warnings of floods, storms and droughts. Yusuf believes this may prove to be the most important consequence of the new technology. Several international organisations are already exploring ways to make such models freely available. Even so, she notes, the benefits will only be realised if the observations on which all forecasts depend continue to be collected and shared around the world.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an indication of how much more quickly a machine-learning forecast can be produced",
          "B",
          "Once trained, such a model can produce a ten-day global forecast in about a minute on a single processor, compared with hours on a supercomputer.",
          "Paragraph B compares 'about a minute' with 'hours on a supercomputer'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a comparison with the way people come to trust medical treatments",
          "E",
          '"We trust medicines because of the evidence from trials, not because we understand every step of how they work," she says.',
          "Paragraph E compares trusting models with trusting medicines.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a list of the sources of weather observations",
          "F",
          "Machine-learning models need a starting point: an accurate picture of the atmosphere at the present moment, which is produced by combining millions of observations from satellites, weather balloons, aircraft and ground stations.",
          "Paragraph F lists satellites, weather balloons, aircraft and ground stations.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a statement about how forecast accuracy has improved over several decades",
          "A",
          "This approach, known as numerical weather prediction, has improved steadily: a five-day forecast today is roughly as accurate as a one-day forecast was in the 1980s.",
          "Paragraph A: a five-day forecast now matches a one-day forecast of the 1980s.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to countries that use forecasts made by others",
          "G",
          "Many national weather services cannot afford supercomputers, and rely on forecasts produced elsewhere.",
          "Paragraph G: some services 'rely on forecasts produced elsewhere'.",
        ),
        fromList(
          "matching_features",
          FORECAST_PEOPLE,
          "Cheaper forecasts make it possible to measure uncertainty more effectively.",
          "Sanna Virtanen",
          '"Because each run is so cheap, a machine-learning model can produce hundreds of ensemble members," she says, "which gives a much better picture of the uncertainty."',
          "Virtanen says cheap runs give 'a much better picture of the uncertainty'.",
        ),
        fromList(
          "matching_features",
          FORECAST_PEOPLE,
          "Models trained on past data may find it hard to predict unusual extreme events.",
          "Tomasz Nowak",
          "He is particularly concerned about extreme events, such as record-breaking heatwaves, which by definition are rare or absent in the training data.",
          "Nowak worries about extreme events that are 'rare or absent in the training data'.",
        ),
        fromList(
          "matching_features",
          FORECAST_PEOPLE,
          "Not knowing exactly how a model works is acceptable if it has been thoroughly tested.",
          "Amina Yusuf",
          "Computer scientist Dr Amina Yusuf argues that this lack of transparency matters less than critics suggest, provided the models are carefully tested.",
          "Yusuf says transparency matters less 'provided the models are carefully tested'.",
        ),
        fromList(
          "matching_features",
          FORECAST_PEOPLE,
          "The old and new methods of forecasting should be used together.",
          "Rafael Mendes",
          "Forecaster Rafael Mendes describes the relationship as a partnership rather than a competition, arguing that the most useful forecasts in the coming years will combine the strengths of both approaches.",
          "Mendes calls it 'a partnership rather than a competition'.",
        ),
        fromList(
          "matching_features",
          FORECAST_PEOPLE,
          "The greatest impact of the technology could be in countries with fewer resources.",
          "Amina Yusuf",
          "Yusuf believes this may prove to be the most important consequence of the new technology.",
          "Yusuf thinks local forecasts for poorer countries may be 'the most important consequence'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Traditional forecasts divide the atmosphere into a three-dimensional ______.",
          "grid",
          "Supercomputers divide the atmosphere into a three-dimensional grid and use the laws of physics to calculate how temperature, pressure, wind and moisture will change in each box over time.",
          "The atmosphere is divided into 'a three-dimensional grid'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Machine-learning models, however, are trained on decades of past ______.",
          "weather data",
          "Instead of solving equations, machine-learning models are trained on decades of past weather data, learning the patterns that link the state of the atmosphere at one moment to its state a few hours later.",
          "They are 'trained on decades of past weather data'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Forecasters run a group of slightly different forecasts, called an ______.",
          "ensemble",
          "Meteorologist Dr Sanna Virtanen explains that forecasters rarely rely on a single prediction; instead they run a collection of slightly different forecasts, known as an ensemble, to estimate how likely different outcomes are.",
          "The collection of forecasts is 'known as an ensemble'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Some early models broke basic rules such as the conservation of ______.",
          "energy",
          "He also notes that some early models produced forecasts that looked realistic but broke basic physical rules, such as the conservation of energy.",
          "They broke rules 'such as the conservation of energy'.",
        ),
      ],
    },
  ],
};
