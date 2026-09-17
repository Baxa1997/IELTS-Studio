import { fromList, gapFill, mcq, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 2 · 2026 trend · lettered paragraphs, choose TWO ---------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const MARKET_STEM =
  "Which TWO problems faced by traders at Kantamanto market are mentioned in the passage?";
const MARKET = [
  "They cannot see exactly what is inside the bales they buy.",
  "The market is too far from the nearest port.",
  "Many of the clothes are too poor in quality to be sold again.",
  "They are not allowed to send clothes to other countries.",
  "The price of bales has fallen sharply.",
];

// ---- Passage 3 · writer's views · sentence endings ---------------------------

const ENDINGS = [
  "are more likely to be published than studies with small effects.",
  "was much smaller than the effects reported in academic journals.",
  "have repeatedly produced large and lasting effects.",
  "may distract governments from more effective measures.",
  "were first used by private businesses.",
  "always require new laws to be passed.",
  "are usually ignored by the public.",
];

export const TEST_17: CuratedTest = {
  key: "full-test-17",
  targetBand: 6,
  passages: [
    {
      key: "t17-p1-rubin-observatory",
      title: "A Camera the Size of a Car",
      topic: "how a new observatory in Chile is filming the changing sky",
      difficulty: 5,
      body: `On a mountain in northern Chile, about 2,700 metres above sea level, stands one of the most ambitious scientific instruments ever built. The Vera C. Rubin Observatory has been designed to do something no telescope has done before: to photograph the entire southern sky every few nights for ten years, creating what its builders describe as the greatest film of the universe ever made. In June 2025, the observatory released its first images, which revealed millions of galaxies and more than two thousand previously unknown asteroids from just a few hours of observation.

The observatory is named after Vera Rubin, an American astronomer who, in the 1970s, studied how fast stars move around the centres of galaxies. She found that stars far from the centre moved much faster than expected, which suggested that galaxies contain large amounts of invisible material. This material, now known as dark matter, cannot be seen directly, and scientists still do not know what it is made of. As a woman in a field dominated by men, Rubin faced many obstacles during her career, but her work is now considered one of the most important scientific discoveries of the twentieth century.

The heart of the observatory is its camera, the largest digital camera ever built for astronomy. It is roughly the size of a small car and weighs about three tonnes. Its sensor contains 3,200 megapixels, hundreds of times more than a typical smartphone camera. To display just one of its images at full size, a viewer would need hundreds of high-definition television screens. To reduce electronic noise, the sensor is cooled to about minus 100 degrees Celsius. Building and testing the camera took engineers in the United States many years.

The telescope itself is also unusual. Its main mirror, 8.4 metres across, was made as a single piece of glass that contains two mirror surfaces with different curves. This design allows the telescope to be short and stiff, which means it can move quickly from one part of the sky to another. The telescope takes an image roughly every 40 seconds and can swing to a new position in a matter of seconds. Over the course of a single night, it can photograph a large part of the visible sky.

Because the observatory photographs the same areas of sky again and again, its computers can compare each new image with earlier ones and identify anything that has changed. This may be an exploding star, an asteroid moving across the sky or a star whose brightness varies. The system is expected to detect up to ten million changes every night and to send alerts to astronomers around the world within minutes. Scientists can then use other telescopes to study the most interesting events in more detail. Some events last only a few hours, so speed is essential.

The amount of data involved is enormous. Each night, the observatory will collect about 20 terabytes of information, and over the ten years of the survey it is expected to produce a catalogue of billions of stars and galaxies. The data is sent by high-speed links from Chile to computer centres in the United States and Europe for processing. Much of it will be made available to scientists and, in some forms, to the public, who may help to classify objects through online projects.

The survey has several scientific goals. Astronomers hope that it will help to explain the nature of dark matter and of dark energy, the mysterious force that appears to be making the expansion of the universe speed up. It will also create a detailed map of our own galaxy, the Milky Way. Closer to home, it is expected to discover millions of asteroids, including many that pass near the Earth. Identifying these objects is an important part of planetary defence, since it allows any dangerous asteroid to be found long before it could strike our planet. The survey may also find objects in the outer solar system that are too faint for other telescopes to detect.

The observatory faces challenges of its own. The growing number of satellites in low orbit around the Earth can leave bright streaks across its images, and engineers have developed software to identify and remove them. The mountain site can also be affected by strong winds and occasional snow, which stop observations. Nevertheless, astronomers are optimistic. Many believe that the survey's most important results will be discoveries that nobody has yet imagined.`,
      questions: [
        tfng(
          "The observatory is designed to photograph the whole sky above both halves of the Earth.",
          "FALSE",
          "The Vera C. Rubin Observatory has been designed to do something no telescope has done before: to photograph the entire southern sky every few nights for ten years, creating what its builders describe as the greatest film of the universe ever made.",
          "It photographs 'the entire southern sky', not the whole sky.",
        ),
        tfng(
          "Vera Rubin's research suggested that galaxies contain material that cannot be seen.",
          "TRUE",
          "She found that stars far from the centre moved much faster than expected, which suggested that galaxies contain large amounts of invisible material.",
          "Her results 'suggested that galaxies contain large amounts of invisible material'.",
        ),
        tfng(
          "Scientists now know what dark matter consists of.",
          "FALSE",
          "This material, now known as dark matter, cannot be seen directly, and scientists still do not know what it is made of.",
          "Scientists 'still do not know what it is made of'.",
        ),
        tfng(
          "The camera's sensor is kept extremely cold to reduce electronic noise.",
          "TRUE",
          "To reduce electronic noise, the sensor is cooled to about minus 100 degrees Celsius.",
          "It is cooled to about minus 100 degrees 'to reduce electronic noise'.",
        ),
        tfng(
          "The telescope's main mirror was made from several smaller pieces of glass.",
          "FALSE",
          "Its main mirror, 8.4 metres across, was made as a single piece of glass that contains two mirror surfaces with different curves.",
          "The mirror 'was made as a single piece of glass'.",
        ),
        tfng(
          "The Rubin Observatory cost more to build than any other telescope.",
          "NOT GIVEN",
          "",
          "The cost of the observatory is never mentioned.",
        ),
        tfng(
          "Streaks left by satellites have made some of the observatory's images useless.",
          "NOT GIVEN",
          "",
          "The passage says software removes the streaks, but not whether any images have been lost.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The first images showed more than two thousand previously unknown ______.",
          "asteroids",
          "In June 2025, the observatory released its first images, which revealed millions of galaxies and more than two thousand previously unknown asteroids from just a few hours of observation.",
          "The images revealed 'more than two thousand previously unknown asteroids'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Vera Rubin studied how fast stars move around the ______ of galaxies.",
          "centres",
          "The observatory is named after Vera Rubin, an American astronomer who, in the 1970s, studied how fast stars move around the centres of galaxies.",
          "She studied stars moving 'around the centres of galaxies'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The observatory's camera is roughly as big as a ______.",
          "small car",
          "It is roughly the size of a small car and weighs about three tonnes.",
          "The camera is 'roughly the size of a small car'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The telescope can move quickly because it is short and ______.",
          "stiff",
          "This design allows the telescope to be short and stiff, which means it can move quickly from one part of the sky to another.",
          "Being 'short and stiff' lets it move quickly.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The system may detect as many as ten million ______ every night.",
          "changes",
          "The system is expected to detect up to ten million changes every night and to send alerts to astronomers around the world within minutes.",
          "It may 'detect up to ten million changes every night'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Dark energy seems to be causing the ______ of the universe to speed up.",
          "expansion",
          "Astronomers hope that it will help to explain the nature of dark matter and of dark energy, the mysterious force that appears to be making the expansion of the universe speed up.",
          "Dark energy appears to be 'making the expansion of the universe speed up'.",
        ),
      ],
    },
    {
      key: "t17-p2-textile-recycling",
      title: "What Happens to Old Clothes?",
      topic: "the problem of clothing waste and the search for solutions",
      difficulty: 6,
      body: `A) Over the past few decades, the way people buy clothes has changed dramatically. Prices have fallen, new styles appear in shops every few weeks, and online retailers can deliver items within a day. According to one widely quoted report, global clothing production roughly doubled between 2000 and 2015, while the average number of times a garment was worn before being thrown away fell by more than a third. This model, often called "fast fashion", has made clothes more affordable than ever, but it has also created a mountain of waste. Producing all these clothes also uses large amounts of water, energy and chemicals.

B) What happens to clothes after they are discarded depends largely on where people live. In many countries, most unwanted textiles are simply put out with household rubbish and end up in landfill sites or are burned. Clothes made from synthetic fibres such as polyester, which is produced from oil, can take hundreds of years to break down. It has been estimated that the equivalent of one rubbish lorry full of textiles is buried or burned somewhere in the world every second. Burning textiles releases greenhouse gases, while clothes in landfill can release chemicals from dyes into the ground.

C) Clothes that are given to charities do not always stay in the country where they were donated. Only a small proportion of donated clothing is sold in local charity shops; much of the rest is sorted, pressed into large bales and sent abroad. One of the biggest destinations is Kantamanto market in Accra, the capital of Ghana, where traders buy bales of used clothing without knowing exactly what they contain. Traders say that a growing share of the clothes are of such poor quality that they cannot be resold. Large amounts are dumped as a result, and some of this clothing ends up on beaches and in the sea. Some campaigners argue that the countries that export used clothing should help to pay for dealing with this waste.

D) Recycling might seem to be the obvious solution, but it is far more difficult than recycling paper or glass. Most clothes are made from blends of different fibres, such as cotton mixed with polyester, which are hard to separate. Buttons, zips and dyes add further complications. As a result, most textile recycling today involves turning old clothes into products of lower value, such as insulation material, cleaning cloths or the filling for furniture. Less than one per cent of the material used to make clothing is recycled into new clothing. Collecting and sorting old clothes by hand is also slow and costly.

E) New technologies may change this. Several companies are developing chemical processes that can break down polyester or cotton into their basic components, which can then be used to make new fibres of the same quality as the original. Other firms are building machines that sort clothes automatically by fibre type, using light to identify the materials. However, many of these technologies are still expensive, and some early projects have struggled to find enough investment to operate on a large scale. One Swedish company that turned old cotton into new material went bankrupt in 2024, although its factory was later bought by new owners.

F) Governments have started to act. The European Union now requires its member states to collect used textiles separately from other waste, a rule that came into force at the start of 2025. The EU is also introducing a system known as extended producer responsibility, under which clothing companies will have to pay for the collection and recycling of the products they sell. France has operated a system of this kind for many years, and French lawmakers have also voted for measures to discourage the cheapest forms of fast fashion, including limits on their advertising.

G) Many experts argue, however, that the most effective solution is simply to buy fewer clothes and to keep them for longer. According to a British study, using a garment for just nine months longer can significantly reduce its impact on the environment. Second-hand clothing has become increasingly popular, especially among young people, and online platforms that let people resell clothes have grown rapidly. Some brands now offer repair services or rent clothes out rather than selling them. Whether these trends can outweigh the continued growth of fast fashion remains to be seen. For now, the amount of clothing produced each year continues to rise.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a change in how often people wear their clothes",
          "A",
          "According to one widely quoted report, global clothing production roughly doubled between 2000 and 2015, while the average number of times a garment was worn before being thrown away fell by more than a third.",
          "Paragraph A: the number of times a garment was worn 'fell by more than a third'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a figure showing how quickly clothing waste is disposed of",
          "B",
          "It has been estimated that the equivalent of one rubbish lorry full of textiles is buried or burned somewhere in the world every second.",
          "Paragraph B: one lorry load 'every second'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "reasons why clothes are hard to recycle",
          "D",
          "Most clothes are made from blends of different fibres, such as cotton mixed with polyester, which are hard to separate.",
          "Paragraph D explains blended fibres, buttons, zips and dyes.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a legal requirement that began in 2025",
          "F",
          "The European Union now requires its member states to collect used textiles separately from other waste, a rule that came into force at the start of 2025.",
          "Paragraph F: the EU rule 'came into force at the start of 2025'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the environmental benefit of keeping clothes for longer",
          "G",
          "According to a British study, using a garment for just nine months longer can significantly reduce its impact on the environment.",
          "Paragraph G: nine extra months 'can significantly reduce its impact on the environment'.",
        ),
        pickTwo(
          MARKET_STEM,
          MARKET,
          "A or C",
          "One of the biggest destinations is Kantamanto market in Accra, the capital of Ghana, where traders buy bales of used clothing without knowing exactly what they contain.",
          "A is correct: traders buy bales 'without knowing exactly what they contain'. B and E are not mentioned.",
        ),
        pickTwo(
          MARKET_STEM,
          MARKET,
          "A or C",
          "Traders say that a growing share of the clothes are of such poor quality that they cannot be resold.",
          "C is correct: many clothes 'cannot be resold'. D is not mentioned.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Most clothes are made from ______ of different fibres.",
          "blends",
          "Most clothes are made from blends of different fibres, such as cotton mixed with polyester, which are hard to separate.",
          "Clothes are made 'from blends of different fibres'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Recycled clothes are often turned into insulation, furniture filling or ______.",
          "cleaning cloths",
          "As a result, most textile recycling today involves turning old clothes into products of lower value, such as insulation material, cleaning cloths or the filling for furniture.",
          "Old clothes become 'insulation material, cleaning cloths or the filling for furniture'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Chemical processes can break polyester or cotton down into their basic ______.",
          "components",
          "Several companies are developing chemical processes that can break down polyester or cotton into their basic components, which can then be used to make new fibres of the same quality as the original.",
          "The processes break fibres 'into their basic components'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Some sorting machines use ______ to identify the materials in clothes.",
          "light",
          "Other firms are building machines that sort clothes automatically by fibre type, using light to identify the materials.",
          "The machines use 'light to identify the materials'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Companies will have to pay for the ______ and recycling of the products they sell.",
          "collection",
          "The EU is also introducing a system known as extended producer responsibility, under which clothing companies will have to pay for the collection and recycling of the products they sell.",
          "Companies must pay 'for the collection and recycling' of their products.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Online platforms that let people ______ clothes have grown quickly.",
          "resell",
          "Second-hand clothing has become increasingly popular, especially among young people, and online platforms that let people resell clothes have grown rapidly.",
          "Platforms 'that let people resell clothes have grown rapidly'.",
        ),
      ],
    },
    {
      key: "t17-p3-nudges",
      title: "The Power and Limits of the Nudge",
      topic: "what the evidence shows about nudging people towards better choices",
      difficulty: 7,
      body: `In 2008, an economist and a legal scholar published a book that would influence governments around the world. Its central idea was simple: people's decisions are strongly affected by the way choices are presented to them, so small changes in presentation can encourage better decisions without restricting anyone's freedom. The authors called such changes "nudges". A classic example is placing fruit at eye level in a school canteen rather than hiding it behind desserts. Nobody is forced to eat fruit, but more children choose it. It is an appealing idea, and in my view it has achieved some genuine successes, but the enthusiasm it generated has sometimes run ahead of the evidence.

Nudges draw on decades of research showing that human decision-making departs from the purely rational model assumed in traditional economics. People tend to stick with whatever option has already been selected for them, give too much weight to the present compared with the future, and are influenced by what others are doing. Rather than fighting these tendencies, nudges try to use them. For instance, telling people that most of their neighbours pay their taxes on time has been found to increase the number of people who pay promptly.

The most impressive results have come from changing default options, the choice that applies if a person does nothing. In 2012, the United Kingdom began requiring employers to enrol their workers automatically in a workplace pension scheme, while allowing them to leave if they wished. Previously, workers had to make an active choice to join. The change led to a dramatic rise in the proportion of employees saving for retirement, and relatively few chose to leave. Similar effects have been found with organ donation: countries in which citizens are automatically registered as donors unless they object tend to have far higher registration rates than countries where people must sign up themselves.

Encouraged by such findings, many governments created special teams to design and test nudges. The first, set up in the United Kingdom in 2010, became known informally as the "nudge unit", and dozens of countries followed its example. These units have tested thousands of ideas, from reminder letters for medical appointments to simpler official forms. Importantly, many of them have used randomised trials, comparing groups who receive a nudge with groups who do not, which has brought a welcome culture of testing to public policy.

However, as the evidence has accumulated, a more cautious picture has emerged. When researchers examined trials run by two of the largest nudge units in the United States, they found that the average effect was much smaller than the effects reported in academic journals. One likely explanation is publication bias: studies with impressive results are more likely to be published than studies with small effects or none at all. In 2022, another group of researchers went further, arguing that once publication bias was taken into account, there was little convincing evidence that nudges, taken as a whole, had any effect.

I think this conclusion goes too far. Combining very different interventions into a single average is rather like asking whether "medicine" works: some treatments are highly effective, while others do nothing. Default options, in particular, have repeatedly produced large and lasting effects. What the critical research does show is that many nudges have smaller effects than their supporters claimed, and that some of the most famous findings may not be reliable.

There are also ethical concerns. Critics argue that nudges can be manipulative, because they work partly by taking advantage of people's mental shortcuts rather than by persuading them with reasons. Businesses use similar techniques, not always for their customers' benefit, for example by making subscriptions easy to start but difficult to cancel. I believe that nudges by governments are acceptable when they are open and when people can easily choose differently, but these conditions are not always met.

Perhaps the most important lesson is that nudges are not a substitute for other kinds of policy. Some problems, such as climate change or obesity, are driven by powerful economic forces, and small changes in how choices are presented are unlikely to solve them on their own. Some researchers have warned that the popularity of nudges may distract governments from more effective measures, such as taxes or regulation. Nudges are a useful tool, but they should be judged by rigorous evidence rather than by the appeal of a clever idea.`,
      questions: [
        mcq(
          "What does the example of fruit in a school canteen illustrate?",
          [
            "how children can be made to eat healthy food",
            "how choices can be influenced without removing freedom",
            "how schools can reduce the cost of meals",
            "how rules about diet can be enforced",
          ],
          "how choices can be influenced without removing freedom",
          "Nobody is forced to eat fruit, but more children choose it.",
          "'Nobody is forced to eat fruit, but more children choose it' — freedom is kept.",
        ),
        mcq(
          "What is the writer's overall view of nudges in the first paragraph?",
          [
            "They have not achieved anything useful.",
            "They have had real successes but have sometimes been overrated.",
            "They work better than traditional economics predicts.",
            "They should replace most government rules.",
          ],
          "They have had real successes but have sometimes been overrated.",
          "It is an appealing idea, and in my view it has achieved some genuine successes, but the enthusiasm it generated has sometimes run ahead of the evidence.",
          "The writer notes 'genuine successes' but says enthusiasm 'has sometimes run ahead of the evidence'.",
        ),
        mcq(
          "What happened after UK workers were enrolled in pensions automatically?",
          [
            "Most workers decided to leave the scheme.",
            "A much larger share of employees began saving for retirement.",
            "Employers refused to pay the extra costs.",
            "Workers had to make an active choice to join.",
          ],
          "A much larger share of employees began saving for retirement.",
          "The change led to a dramatic rise in the proportion of employees saving for retirement, and relatively few chose to leave.",
          "There was 'a dramatic rise in the proportion of employees saving for retirement'. D describes the system before 2012.",
        ),
        mcq(
          "What does the writer say about government nudge units?",
          [
            "They were first set up in the United States.",
            "They have tested only a small number of ideas.",
            "They have brought a valuable habit of testing to public policy.",
            "They have mostly worked in secret.",
          ],
          "They have brought a valuable habit of testing to public policy.",
          "Importantly, many of them have used randomised trials, comparing groups who receive a nudge with groups who do not, which has brought a welcome culture of testing to public policy.",
          "Their trials 'brought a welcome culture of testing to public policy'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "In trials run by two large nudge units in the United States, the average effect",
          "was much smaller than the effects reported in academic journals.",
          "When researchers examined trials run by two of the largest nudge units in the United States, they found that the average effect was much smaller than the effects reported in academic journals.",
          "The average effect 'was much smaller than the effects reported in academic journals'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Studies with impressive results",
          "are more likely to be published than studies with small effects.",
          "One likely explanation is publication bias: studies with impressive results are more likely to be published than studies with small effects or none at all.",
          "Such studies 'are more likely to be published' — this is publication bias.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Changes to default options",
          "have repeatedly produced large and lasting effects.",
          "Default options, in particular, have repeatedly produced large and lasting effects.",
          "Defaults 'have repeatedly produced large and lasting effects'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Some researchers warn that the popularity of nudges",
          "may distract governments from more effective measures.",
          "Some researchers have warned that the popularity of nudges may distract governments from more effective measures, such as taxes or regulation.",
          "Their popularity 'may distract governments from more effective measures'.",
        ),
        ynng(
          "The claim that nudges have no overall effect is too extreme.",
          "YES",
          "I think this conclusion goes too far.",
          "The writer says 'this conclusion goes too far'.",
        ),
        ynng(
          "Some well-known findings about nudges may not be trustworthy.",
          "YES",
          "What the critical research does show is that many nudges have smaller effects than their supporters claimed, and that some of the most famous findings may not be reliable.",
          "'Some of the most famous findings may not be reliable.'",
        ),
        ynng(
          "Governments should never use nudges.",
          "NO",
          "I believe that nudges by governments are acceptable when they are open and when people can easily choose differently, but these conditions are not always met.",
          "The writer finds government nudges 'acceptable' under certain conditions.",
        ),
        ynng(
          "Nudge units in poorer countries have been more successful than those in richer ones.",
          "NOT GIVEN",
          "",
          "The writer never compares nudge units in poorer and richer countries.",
        ),
        ynng(
          "Nudges can solve problems such as climate change by themselves.",
          "NO",
          "Some problems, such as climate change or obesity, are driven by powerful economic forces, and small changes in how choices are presented are unlikely to solve them on their own.",
          "Nudges are 'unlikely to solve them on their own'.",
        ),
        ynng(
          "Nudges should be judged on the basis of strong evidence.",
          "YES",
          "Nudges are a useful tool, but they should be judged by rigorous evidence rather than by the appeal of a clever idea.",
          "They 'should be judged by rigorous evidence'.",
        ),
      ],
    },
  ],
};
