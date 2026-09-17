import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · history · notes + True/False/Not Given ----------------------

const ICE_TRADE = {
  title: "Frederic Tudor and the ice trade",
  layout: "notes" as const,
  wordLimit: "NO MORE THAN TWO WORDS",
};

// ---- Passage 2 · 2026 trend · lettered paragraphs and people -----------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const PEOPLE = ["Laura Ferrante", "Marc Soler", "Priya Nair", "Henrik Olsen"];

// ---- Passage 3 · writer's views · word bank ----------------------------------

const BOREDOM_BANK = [
  "ideas",
  "charity",
  "danger",
  "purpose",
  "imagination",
  "games",
  "patience",
  "memory",
  "exercise",
  "rules",
];

export const TEST_11: CuratedTest = {
  key: "full-test-11",
  targetBand: 5,
  passages: [
    {
      key: "t11-p1-ice-trade",
      title: "The Man Who Sold Ice",
      topic: "how Frederic Tudor turned ice into a global business",
      difficulty: 4,
      body: `Today, most people can make ice at home in a few hours. They simply fill a tray with water and put it in the freezer. Two hundred years ago, however, ice was a luxury. In hot countries, very few people had ever seen it, and even in cold countries it was difficult to keep ice through the summer. One man from Boston, in the north-east of the United States, believed that he could change this. His name was Frederic Tudor, and he later became known as the "Ice King".

Tudor was born in 1783 into a wealthy family. Unlike his brothers, he did not go to university. Instead, he became interested in business at a young age. In 1805, he and his brother discussed an unusual idea at a family party. In New England, the lakes froze every winter, and the ice was free for anyone to cut. Tudor wondered whether this ice could be shipped to the Caribbean, where the weather was hot all year round. He believed that people there would pay a high price for something so rare.

Many people laughed at the plan. No ship owner in Boston wanted to carry ice, so Tudor had to buy his own ship. In 1806, he sent about 130 tons of ice to the island of Martinique. The ice arrived safely, but the trip was a failure. The people of the island did not know what to do with ice, and there was nowhere to store it. Most of it melted within a few weeks, and Tudor lost a large amount of money.

The next few years were very difficult. Tudor lost more money, and he was sent to prison more than once because he could not pay his debts. However, he did not give up. Instead, he learned from each mistake. He realised that he needed special ice houses in the places where he sold ice, so that it could be kept cool for months. He also tested different materials to stop the ice from melting and found that sawdust worked very well. Sawdust was also cheap, because timber mills usually threw it away.

Tudor also had to create a demand for his product. He gave away free ice to bar owners and showed them how to make cold drinks. He knew that once customers had tasted a cold drink on a hot day, they would not want to go back to warm ones. He also encouraged doctors to use ice to treat patients with fevers. Slowly, people in hot places began to see ice as something they needed, not just a strange luxury.

Another important change came from one of Tudor's suppliers, Nathaniel Wyeth. In 1825, Wyeth invented a new tool for cutting ice. It was pulled by a horse and cut the frozen surface of a lake into large blocks of the same size. Blocks of the same shape could be packed closely together, so less ice melted during a journey. The new method was also much faster than cutting ice by hand, and it meant that far more ice could be collected each winter.

By the 1830s, the business was very successful. In 1833, Tudor sent a ship full of ice on a four-month voyage to Calcutta in India. To the surprise of many people, more than half of the ice survived the journey. It sold quickly, and the trade with India continued for several decades. Ice from the lakes near Boston was soon shipped to many other parts of the world, including South America and China. One of these lakes was Walden Pond, where the writer Henry David Thoreau lived for two years.

The ice trade changed daily life in many ways. In the United States, families began to keep food in wooden boxes cooled with ice, and fish and meat could be sent long distances without going bad. By the late nineteenth century, however, factories were able to produce ice using machines. Natural ice also became less popular because the water in many lakes was polluted. By the early twentieth century, the natural ice trade had almost disappeared. Tudor, who died in 1864, did not live to see its end, but he had shown that even frozen water could be sold around the world.`,
      questions: [
        noteLine(
          ICE_TRADE,
          "The first voyage",
          "about 130 tons of ice sent to ______",
          "Martinique",
          "In 1806, he sent about 130 tons of ice to the island of Martinique.",
          "The first cargo went 'to the island of Martinique'.",
          {
            before: [
              {
                text: "Tudor bought his own ship because no Boston ship owner would carry ice",
                indent: 0,
              },
            ],
          },
        ),
        noteLine(
          ICE_TRADE,
          "The first voyage",
          "a failure: islanders did not know what to do with ice and there was nowhere to ______ it",
          "store",
          "The people of the island did not know what to do with ice, and there was nowhere to store it.",
          "There was 'nowhere to store it', so most of the ice melted.",
        ),
        noteLine(
          ICE_TRADE,
          "Solving the problems",
          "______ used to stop the ice from melting",
          "sawdust",
          "He also tested different materials to stop the ice from melting and found that sawdust worked very well.",
          "Of the materials he tested, 'sawdust worked very well'.",
          {
            before: [{ text: "ice houses built in the places where ice was sold", indent: 0 }],
          },
        ),
        noteLine(
          ICE_TRADE,
          "Solving the problems",
          "free ice given to ______ to show how cold drinks were made",
          "bar owners",
          "He gave away free ice to bar owners and showed them how to make cold drinks.",
          "Tudor 'gave away free ice to bar owners'.",
        ),
        noteLine(
          ICE_TRADE,
          "Solving the problems",
          "______ encouraged to use ice for patients with fevers",
          "doctors",
          "He also encouraged doctors to use ice to treat patients with fevers.",
          "He 'encouraged doctors to use ice' for fevers.",
        ),
        noteLine(
          ICE_TRADE,
          "Growth of the trade",
          "Wyeth's horse-drawn tool cut lake ice into large ______ of the same size",
          "blocks",
          "It was pulled by a horse and cut the frozen surface of a lake into large blocks of the same size.",
          "The tool cut the ice 'into large blocks of the same size'.",
        ),
        noteLine(
          ICE_TRADE,
          "Growth of the trade",
          "1833: a ship full of ice sent on a four-month voyage to ______",
          "Calcutta",
          "In 1833, Tudor sent a ship full of ice on a four-month voyage to Calcutta in India.",
          "The long voyage in 1833 was 'to Calcutta in India'.",
        ),
        tfng(
          "Tudor studied at university before he started his business.",
          "FALSE",
          "Unlike his brothers, he did not go to university.",
          "The passage says he 'did not go to university'.",
        ),
        tfng(
          "Tudor was put in prison because he could not pay the money he owed.",
          "TRUE",
          "Tudor lost more money, and he was sent to prison more than once because he could not pay his debts.",
          "He was 'sent to prison more than once because he could not pay his debts'.",
        ),
        tfng(
          "Sawdust was an expensive material to buy.",
          "FALSE",
          "Sawdust was also cheap, because timber mills usually threw it away.",
          "Sawdust was 'cheap', because timber mills threw it away.",
        ),
        tfng(
          "Tudor earned more from selling ice to hospitals than from selling it to bars.",
          "NOT GIVEN",
          "",
          "Bars and doctors are both mentioned, but the passage never compares how much money each brought in.",
        ),
        tfng(
          "Wyeth's way of cutting ice was quicker than cutting it by hand.",
          "TRUE",
          "The new method was also much faster than cutting ice by hand, and it meant that far more ice could be collected each winter.",
          "The method was 'much faster than cutting ice by hand'.",
        ),
        tfng(
          "Henry David Thoreau worked for Tudor as an ice cutter.",
          "NOT GIVEN",
          "",
          "Thoreau is said to have lived beside Walden Pond, but nothing is said about him working in the ice trade.",
        ),
      ],
    },
    {
      key: "t11-p2-overtourism",
      title: "Too Many Visitors?",
      topic: "why popular destinations are trying to control tourism",
      difficulty: 5,
      body: `A) Every year, more people travel abroad for their holidays. According to the United Nations tourism agency, there were about 1.4 billion international tourist arrivals in 2024, almost the same number as before the COVID-19 pandemic. Cheap flights, online booking and social media have made it easier than ever to visit famous places, and photographs shared online can turn a quiet village into a popular destination almost overnight. For many towns and cities, tourism brings jobs and income. But in some popular places, local people now complain that there are simply too many visitors. This problem has become known as overtourism.

B) The effects of overtourism are easy to see. In the narrow streets of some historic cities, crowds make it difficult for residents to walk to work or school. Rubbish and noise increase, and shops that once sold everyday goods are replaced by souvenir stores. One of the most serious problems is housing. When flats are rented to tourists through websites, fewer homes are available for local people, and rents go up. Dr Laura Ferrante, who studies tourism in southern Europe, says that in some city centres the number of permanent residents has fallen sharply. "When the residents leave, a city can lose its character and become a kind of theme park," she warns.

C) In 2024, thousands of people in several Spanish cities took part in protests against mass tourism. In Barcelona, some protesters sprayed tourists with water pistols to draw attention to their message. The protests were reported by newspapers and television channels around the world. Most protesters, however, said they were not against visitors themselves. Instead, they wanted governments to limit the growth of tourism and to protect homes for local people. Marc Soler, a resident who helped to organise one of the protests, explains, "Our city depends on tourism, but we cannot let it decide everything about our lives."

D) Some cities have started to charge visitors. In 2024, Venice became the first city in the world to ask day-trippers to pay an entry fee on its busiest days. Visitors who did not stay overnight had to pay five euros, and the following year the fee was doubled for those who booked less than four days in advance. The city says that the fee is meant to spread visitors more evenly across the year, not to raise money. However, some critics argue that such a small charge is unlikely to stop people from coming. Economist Dr Priya Nair believes that "a fee only changes behaviour if it is high enough to make people think twice".

E) Other places have tried different approaches. Amsterdam launched an online campaign aimed at young British men, warning them to "stay away" if they were planning a noisy party holiday. The Croatian city of Dubrovnik has limited the number of cruise ships that can visit on the same day. In Kyoto, Japan, some private streets in the famous Gion district were closed to tourists after residents complained that visitors were chasing and photographing geisha. Japan has also introduced a fee and a daily limit for climbers on one of the most popular paths up Mount Fuji, partly for safety reasons.

F) Not everyone agrees that limiting tourist numbers is the best solution. Tourism researcher Professor Henrik Olsen argues that the real problem is not the total number of visitors but the fact that most of them go to the same places at the same times. "Many cities have beautiful areas that tourists never see," he says. He suggests that destinations should encourage people to visit less famous neighbourhoods and to travel outside the busy summer months. This, he believes, would also spread the money that tourists spend more widely. Some national tourism boards now advertise lesser-known towns and villages for exactly this reason.

G) Technology may also help. Some cities use data from mobile phones to measure how crowded different streets are, and apps can show visitors which attractions are busy at a particular time. At some popular museums, visitors must now book a time slot in advance, which helps to prevent long queues. Ferrante believes that such tools are useful but not enough on their own. "Real change needs clear rules about housing and the number of flats that can be rented to tourists," she says. Most experts agree that tourism can benefit both visitors and residents, but only if it is carefully managed.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a figure for the number of international tourist arrivals in a single year",
          "A",
          "According to the United Nations tourism agency, there were about 1.4 billion international tourist arrivals in 2024, almost the same number as before the COVID-19 pandemic.",
          "Paragraph A gives the figure of 'about 1.4 billion international tourist arrivals in 2024'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an example of an unusual way of protesting",
          "C",
          "In Barcelona, some protesters sprayed tourists with water pistols to draw attention to their message.",
          "Paragraph C: protesters 'sprayed tourists with water pistols'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the reason one city gives for charging visitors",
          "D",
          "The city says that the fee is meant to spread visitors more evenly across the year, not to raise money.",
          "Paragraph D: Venice says the fee is 'meant to spread visitors more evenly across the year'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a campaign aimed at one particular group of travellers",
          "E",
          'Amsterdam launched an online campaign aimed at young British men, warning them to "stay away" if they were planning a noisy party holiday.',
          "Paragraph E: Amsterdam's campaign was 'aimed at young British men'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "When flats are rented to tourists, ______ go up for the people who live in the city.",
          "rents",
          "When flats are rented to tourists through websites, fewer homes are available for local people, and rents go up.",
          "Fewer homes are available 'and rents go up'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Venice says its entry fee is not intended to raise ______.",
          "money",
          "The city says that the fee is meant to spread visitors more evenly across the year, not to raise money.",
          "The fee is 'not to raise money'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "In Kyoto, residents complained that visitors were chasing and photographing ______.",
          "geisha",
          "In Kyoto, Japan, some private streets in the famous Gion district were closed to tourists after residents complained that visitors were chasing and photographing geisha.",
          "Visitors were 'chasing and photographing geisha'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Professor Olsen thinks tourists should be encouraged to travel outside the busy ______ months.",
          "summer",
          "He suggests that destinations should encourage people to visit less famous neighbourhoods and to travel outside the busy summer months.",
          "He wants people 'to travel outside the busy summer months'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "A city may lose its identity when the people who live there move away.",
          "Laura Ferrante",
          '"When the residents leave, a city can lose its character and become a kind of theme park," she warns.',
          "Ferrante warns that a city 'can lose its character' when residents leave.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "Local people should not allow tourism to control their whole way of life.",
          "Marc Soler",
          'Marc Soler, a resident who helped to organise one of the protests, explains, "Our city depends on tourism, but we cannot let it decide everything about our lives."',
          "Soler: 'we cannot let it decide everything about our lives'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "A charge must be large enough to affect what visitors decide to do.",
          "Priya Nair",
          'Economist Dr Priya Nair believes that "a fee only changes behaviour if it is high enough to make people think twice".',
          "Nair: a fee only works 'if it is high enough to make people think twice'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "The difficulty is where and when tourists travel rather than how many of them there are.",
          "Henrik Olsen",
          "Tourism researcher Professor Henrik Olsen argues that the real problem is not the total number of visitors but the fact that most of them go to the same places at the same times.",
          "Olsen says the problem is that visitors 'go to the same places at the same times'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "Technology alone will not solve the problem.",
          "Laura Ferrante",
          "Ferrante believes that such tools are useful but not enough on their own.",
          "Ferrante says the tools are 'not enough on their own'.",
        ),
      ],
    },
    {
      key: "t11-p3-boredom",
      title: "In Praise of Boredom",
      topic: "why short periods of boredom may be good for us",
      difficulty: 6,
      body: `Boredom has a poor reputation. We tend to see it as a waste of time, an unpleasant state to be escaped as quickly as possible, and modern technology makes escape easier than ever. With a smartphone in every pocket, few people now need to spend even a minute without entertainment. Yet a growing body of research suggests that boredom is not simply a problem to be solved. In my view, it may be one of the most useful feelings we have, and we lose something important when we avoid it completely.

Psychologists define boredom as the uncomfortable feeling of wanting to be engaged in a satisfying activity but being unable to find one. It is different from relaxation, which people usually enjoy, and from apathy, in which a person has no desire to do anything at all. Bored people want something to happen. This restless quality is important, because it suggests that boredom acts as a signal, telling us that our current situation is not meeting our needs and pushing us to look for something better.

Just how unpleasant people find doing nothing was shown in a well-known series of experiments published in 2014. Participants were asked to sit alone in a plain room for between six and fifteen minutes with nothing to do but think. Most reported that they did not enjoy the experience. In one version, participants were given the option of pressing a button to give themselves a mild electric shock. Remarkably, a quarter of the women and two-thirds of the men chose to shock themselves at least once rather than simply sit with their thoughts. Some commentators treated this as evidence that people cannot cope with their own minds. I think a more reasonable conclusion is that people strongly prefer some stimulation, even unpleasant stimulation, to none.

Other research has focused on the possible benefits of boredom, especially for creativity. In a study carried out in Britain, some participants were first given a deliberately dull task: copying numbers out of a telephone directory. Afterwards, they were asked to think of as many uses as possible for a pair of plastic cups. Those who had completed the boring task came up with more ideas than those who had not. The researchers suggested that boredom encourages the mind to wander, and that daydreaming allows people to make new connections between ideas. Similar results have been reported in other studies, although the effects are not always large.

Boredom may also encourage people to look for meaning. Some psychologists argue that when people feel bored, they become more likely to choose activities that seem worthwhile, such as helping others or learning something new. In one set of experiments, people who had been made to feel bored were more willing to donate to charity afterwards. Of course, boredom does not always lead to such positive results. People who are frequently bored are more likely to eat unhealthily, and some turn to risky behaviour in search of excitement. What matters, it seems, is how people respond to the feeling.

This is where modern technology becomes a concern. Smartphones allow us to relieve boredom instantly, but the relief is usually brief. Scrolling through social media rarely provides the sense of purpose that boredom is urging us to find, and some studies suggest that heavy phone use may even make people more easily bored over time. I do not believe that phones are the enemy; they are extremely useful tools. But I am convinced that reaching for them at every quiet moment prevents boredom from doing its job.

Children are a particular case. Many parents feel guilty when their children complain of having nothing to do, and fill their days with organised activities. Yet educators have long argued that unstructured time allows children to develop imagination and independence. A child who is bored on a rainy afternoon may invent a game, build something or start writing a story. I would not suggest that parents should deliberately make their children bored, but they need not rush to rescue them from every empty hour.

None of this means that boredom is always pleasant or that we should go looking for it. Long periods of boredom, such as those experienced by people in dull, repetitive jobs, can be harmful to wellbeing. The point is rather that short periods of boredom are a normal part of life and can serve a purpose. Instead of treating every empty moment as a problem, we might allow ourselves, now and then, to stare out of the window and see where our thoughts lead.`,
      questions: [
        mcq(
          "What is the writer's main point in the first paragraph?",
          [
            "Boredom is less common than it used to be.",
            "Boredom may be more valuable than most people think.",
            "Boredom is mainly caused by modern technology.",
            "Boredom should be avoided whenever possible.",
          ],
          "Boredom may be more valuable than most people think.",
          "In my view, it may be one of the most useful feelings we have, and we lose something important when we avoid it completely.",
          "The writer calls boredom possibly 'one of the most useful feelings we have', although it has 'a poor reputation'.",
        ),
        mcq(
          "According to the passage, how is apathy different from boredom?",
          [
            "It is more pleasant than boredom.",
            "It usually lasts for a shorter time.",
            "A person who feels it does not want to do anything.",
            "It is a signal that a person needs to relax.",
          ],
          "A person who feels it does not want to do anything.",
          "It is different from relaxation, which people usually enjoy, and from apathy, in which a person has no desire to do anything at all.",
          "In apathy 'a person has no desire to do anything at all', whereas bored people 'want something to happen'.",
        ),
        mcq(
          "What does the writer conclude from the electric shock experiments?",
          [
            "People are unable to cope with their own thoughts.",
            "Men are more easily bored than women.",
            "People would rather have some stimulation than none at all.",
            "The experiments were too short to show anything useful.",
          ],
          "People would rather have some stimulation than none at all.",
          "I think a more reasonable conclusion is that people strongly prefer some stimulation, even unpleasant stimulation, to none.",
          "The writer rejects the commentators' view (A) and concludes that people 'prefer some stimulation, even unpleasant stimulation, to none'.",
        ),
        mcq(
          "Why were some participants asked to copy numbers from a telephone directory?",
          [
            "to test how well they could remember information",
            "to make them feel bored before the next task",
            "to measure how quickly they could work",
            "to compare different ways of copying information",
          ],
          "to make them feel bored before the next task",
          "In a study carried out in Britain, some participants were first given a deliberately dull task: copying numbers out of a telephone directory.",
          "The copying was 'a deliberately dull task' given first, before the creativity test.",
        ),
        fromList(
          "summary_completion",
          BOREDOM_BANK,
          "People who had first done a boring task produced more ______ for using plastic cups.",
          "ideas",
          "Those who had completed the boring task came up with more ideas than those who had not.",
          "They 'came up with more ideas than those who had not'.",
        ),
        fromList(
          "summary_completion",
          BOREDOM_BANK,
          "In one set of experiments, bored people were later more willing to give money to ______.",
          "charity",
          "In one set of experiments, people who had been made to feel bored were more willing to donate to charity afterwards.",
          "Bored people 'were more willing to donate to charity afterwards'.",
        ),
        fromList(
          "summary_completion",
          BOREDOM_BANK,
          "Some people who are often bored look for excitement in activities that involve ______.",
          "danger",
          "People who are frequently bored are more likely to eat unhealthily, and some turn to risky behaviour in search of excitement.",
          "'Risky behaviour' is behaviour that involves danger.",
        ),
        fromList(
          "summary_completion",
          BOREDOM_BANK,
          "Social media rarely gives people the sense of ______ that boredom pushes them to find.",
          "purpose",
          "Scrolling through social media rarely provides the sense of purpose that boredom is urging us to find, and some studies suggest that heavy phone use may even make people more easily bored over time.",
          "Social media 'rarely provides the sense of purpose' boredom urges us to find.",
        ),
        fromList(
          "summary_completion",
          BOREDOM_BANK,
          "Unstructured time is thought to help children develop their ______ and independence.",
          "imagination",
          "Yet educators have long argued that unstructured time allows children to develop imagination and independence.",
          "Unstructured time helps children 'develop imagination and independence'.",
        ),
        fromList(
          "summary_completion",
          BOREDOM_BANK,
          "On a rainy afternoon, a bored child might make up ______ or start writing a story.",
          "games",
          "A child who is bored on a rainy afternoon may invent a game, build something or start writing a story.",
          "To 'invent a game' is to make up games.",
        ),
        ynng(
          "Technology now makes it easy for people to escape from boredom.",
          "YES",
          "We tend to see it as a waste of time, an unpleasant state to be escaped as quickly as possible, and modern technology makes escape easier than ever.",
          "The writer says 'modern technology makes escape easier than ever'.",
        ),
        ynng(
          "Smartphones do more harm than good and should be avoided.",
          "NO",
          "I do not believe that phones are the enemy; they are extremely useful tools.",
          "The writer says phones are not 'the enemy' but 'extremely useful tools'.",
        ),
        ynng(
          "Children today get bored more easily than children did in the past.",
          "NOT GIVEN",
          "",
          "The writer discusses bored children but never compares them with children in the past.",
        ),
        ynng(
          "Short periods of boredom can have a useful function.",
          "YES",
          "The point is rather that short periods of boredom are a normal part of life and can serve a purpose.",
          "Short periods of boredom 'can serve a purpose'.",
        ),
      ],
    },
  ],
};
