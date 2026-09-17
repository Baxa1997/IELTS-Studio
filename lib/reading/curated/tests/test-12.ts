import { fromList, gapFill, mcq, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 2 · 2026 trend · lettered paragraphs, choose TWO ---------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const MAKERS_STEM = "Which TWO arguments do manufacturers use against the right to repair?";
const MAKERS = [
  "Repairs carried out by untrained people could be unsafe.",
  "Independent repair shops charge customers too much.",
  "Technical information could be misused if it is shared.",
  "Customers do not want to buy repaired products.",
  "Spare parts are too expensive to produce.",
];

// ---- Passage 3 · writer's views · sentence endings ---------------------------

const ENDINGS = [
  "can create new dangers.",
  "was linked with more physical activity and better social skills.",
  "are usually minor.",
  "often report that there is less bullying.",
  "should be removed from every playground.",
  "was first developed by a British campaigner.",
  "prefer to play indoors.",
];

export const TEST_12: CuratedTest = {
  key: "full-test-12",
  targetBand: 5,
  passages: [
    {
      key: "t12-p1-seed-vault",
      title: "A Safe for the World's Seeds",
      topic: "how a frozen vault in the Arctic protects the world's crops",
      difficulty: 4,
      body: `High in the Arctic, on the Norwegian island of Spitsbergen, a long tunnel leads deep into the side of a mountain. At the end of the tunnel are three large storage rooms. They do not contain gold or money, but something that may be even more valuable: the seeds of the world's most important food plants. This is the Svalbard Global Seed Vault. It opened in 2008, and newspapers sometimes call it the "doomsday vault". The name suggests a place prepared for the end of the world, but the people who run it say that its main purpose is much more practical.

Seeds matter because farmers depend on many different types, or varieties, of each crop. Some varieties of wheat or rice can survive long periods without rain, while others can resist certain diseases or grow well in poor soil. When scientists develop new crops, they often need these special qualities. However, farmers around the world are now growing a smaller number of modern varieties, and many traditional ones are disappearing. If a variety disappears completely, its useful qualities may be lost for ever.

To protect these varieties, countries have built around 1,700 gene banks, where seeds are dried and stored at low temperatures. But gene banks can be damaged by wars, natural disasters or simple accidents. Some have lost their collections because of a lack of money or a failure in the electricity supply. The Svalbard vault was designed as a back-up for all of these gene banks. It is a place where copies of their seeds can be kept safely in case the originals are ever lost.

The location was chosen with great care. Svalbard is about 1,300 kilometres from the North Pole, and the ground there is frozen all year round. This means that even if the electricity fails, the seeds will stay frozen for a long time. The vault is also about 130 metres above sea level, so it should stay dry even if the ice at the Poles melts. The area has very few earthquakes, and it is far from any war. Inside the storage rooms, the temperature is kept at minus 18 degrees Celsius. At this temperature, seeds use very little energy and age much more slowly than they would in a normal room.

The vault works rather like a safe in a bank. Countries and organisations send their seeds in sealed boxes, and they remain the owners of the seeds. The staff in Norway never open the boxes, and only the organisation that sent a box can take it out again. Norway paid for the building, and the costs of running the vault are shared by the Norwegian government and an international organisation called the Crop Trust. Sending seeds to the vault is free.

The vault has room for 4.5 million different samples, and each sample usually contains about 500 seeds. By 2025, it held more than 1.3 million samples from almost every country in the world. The largest collections include rice, wheat and barley, but there are also seeds of many less familiar plants. Some countries have sent only a few boxes, while others have sent thousands. At such low temperatures, some of the seeds may stay alive for hundreds of years, although this depends on the type of plant.

For several years, nobody took any seeds out of the vault. Then, in 2015, it received its first request. A research organisation that had been based in Aleppo, Syria, had been forced to move because of the war there. It could no longer reach its own gene bank, so it asked for its seeds back in order to start new collections in Lebanon and Morocco. The seeds were planted, and new seeds from these plants were later sent back to the vault. Many people saw this as proof that the idea really worked.

The vault has also faced some problems of its own. In 2016, unusually warm weather caused water from melting snow and ice to flow into the entrance tunnel. The seeds were not affected, but the event caused worry, and the tunnel was later rebuilt to make it waterproof. Some experts have also pointed out that the vault can only protect seeds, not the knowledge of the farmers who grew them. Even so, most agree that this frozen room in the Arctic is an important insurance policy for the future of the world's food.`,
      questions: [
        tfng(
          "The storage rooms in the vault contain gold as well as seeds.",
          "FALSE",
          "They do not contain gold or money, but something that may be even more valuable: the seeds of the world's most important food plants.",
          "The rooms 'do not contain gold or money'.",
        ),
        tfng(
          "Farmers today grow fewer varieties of crops than they did in the past.",
          "TRUE",
          "However, farmers around the world are now growing a smaller number of modern varieties, and many traditional ones are disappearing.",
          "Farmers are 'now growing a smaller number of modern varieties'.",
        ),
        tfng(
          "Some gene banks have lost their seeds because of problems with the power supply.",
          "TRUE",
          "Some have lost their collections because of a lack of money or a failure in the electricity supply.",
          "Collections were lost through 'a failure in the electricity supply'.",
        ),
        tfng(
          "Staff at the vault sometimes open the boxes to check the seeds.",
          "FALSE",
          "The staff in Norway never open the boxes, and only the organisation that sent a box can take it out again.",
          "The staff 'never open the boxes'.",
        ),
        tfng(
          "Organisations have to pay to keep their seeds in the vault.",
          "FALSE",
          "Sending seeds to the vault is free.",
          "Storing seeds in the vault 'is free'.",
        ),
        tfng(
          "Rice is the crop with the largest number of samples in the vault.",
          "NOT GIVEN",
          "",
          "Rice is one of the largest collections, together with wheat and barley, but the passage never says which is the biggest.",
        ),
        tfng(
          "The research organisation from Aleppo has now moved back to Syria.",
          "NOT GIVEN",
          "",
          "The passage says the organisation moved and started collections in Lebanon and Morocco, but not whether it later returned.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Some varieties of wheat or rice can survive for long periods without ______.",
          "rain",
          "Some varieties of wheat or rice can survive long periods without rain, while others can resist certain diseases or grow well in poor soil.",
          "Some varieties 'can survive long periods without rain'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Svalbard lies about 1,300 kilometres from the ______.",
          "North Pole",
          "Svalbard is about 1,300 kilometres from the North Pole, and the ground there is frozen all year round.",
          "Svalbard is 'about 1,300 kilometres from the North Pole'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The vault should stay dry because it is about 130 metres above ______.",
          "sea level",
          "The vault is also about 130 metres above sea level, so it should stay dry even if the ice at the Poles melts.",
          "Being '130 metres above sea level' keeps it dry.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The Norwegian government shares the running costs with the ______.",
          "Crop Trust",
          "Norway paid for the building, and the costs of running the vault are shared by the Norwegian government and an international organisation called the Crop Trust.",
          "Costs are shared with 'an international organisation called the Crop Trust'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "After water entered it in 2016, the entrance tunnel was rebuilt to make it ______.",
          "waterproof",
          "The seeds were not affected, but the event caused worry, and the tunnel was later rebuilt to make it waterproof.",
          "The tunnel 'was later rebuilt to make it waterproof'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Some experts note that the vault cannot protect the ______ of the farmers who grew the seeds.",
          "knowledge",
          "Some experts have also pointed out that the vault can only protect seeds, not the knowledge of the farmers who grew them.",
          "It protects seeds, 'not the knowledge of the farmers who grew them'.",
        ),
      ],
    },
    {
      key: "t12-p2-right-to-repair",
      title: "The Right to Repair",
      topic: "the movement to make everyday products easier to repair",
      difficulty: 5,
      body: `A) When a washing machine, a phone or a laptop stops working, many people simply throw it away and buy a new one. Often, this is not because the fault is serious, but because repairing the item is difficult or expensive. Spare parts may be hard to find, repair instructions may not be available, and some products are glued together so that they cannot be opened without being damaged. A growing movement, known as the "right to repair", aims to change this situation. Its supporters believe that people should be able to fix the things they own, or to choose who fixes them. In recent years, the idea has gained support from environmental groups, consumer organisations and many politicians.

B) Supporters of the movement point to the environmental cost of throwing things away. Electronic waste is one of the fastest-growing types of rubbish in the world. According to a United Nations report, about 62 million tonnes of it were produced in 2022, and less than a quarter was properly collected and recycled. Making new products also uses large amounts of energy and raw materials, some of which are rare. Keeping a phone or a computer in use for a few extra years is one of the simplest ways to reduce this damage. Repairing a device usually produces far less waste than making a new one.

C) The movement also has an economic argument. When only the original manufacturer is able to repair a product, it can charge high prices for the service. Independent repair shops, which are often small local businesses, may not be able to get the parts or tools they need. Farmers in the United States were among the first to complain about this problem. Modern tractors are controlled by computer software, and some farmers found that they were not allowed to fix their own machines without the manufacturer's permission, even during the busy harvest season. Delays of even a few days at that time of year can cost a farmer a great deal of money.

D) One of the best-known parts of the movement began in Amsterdam in 2009, when a journalist organised the first "repair café". At these events, volunteers with practical skills help visitors to fix broken items, from toasters to bicycles, free of charge. The idea spread quickly, and today there are thousands of repair cafés around the world. Their organisers say that the events are not only about saving money. They also bring neighbours together and show people that many problems are easier to solve than they think. Many visitors also leave with the confidence to try simple repairs at home.

E) Governments have started to take action. In 2021, France introduced a repair score, which appears on products such as phones, laptops and televisions. Each product receives a mark out of ten, based on how easy it is to repair and how long spare parts will be available. Shoppers can compare these scores before they buy. Several states in the USA have also passed laws that require manufacturers to provide parts, tools and information to independent repairers and to the public. In some states, these laws cover farm machinery and wheelchairs as well as electronic goods.

F) The European Union has gone further. In 2024, it agreed a new law that requires manufacturers to repair certain products, such as washing machines, fridges and phones, even after the guarantee has ended. Customers who choose a repair instead of a replacement will also receive an extra year of guarantee. EU countries had until July 2026 to make the rules part of their national law. Separate EU rules will also make it easier for users to replace the batteries in many portable devices.

G) Manufacturers have raised some concerns. They argue that repairs carried out by untrained people could be dangerous, especially for products with powerful batteries. They also claim that sharing detailed technical information could help criminals or competitors. Some companies have responded to public pressure by selling spare parts and repair kits directly to customers. Critics, however, say that these programmes are sometimes expensive and difficult to use. Some also point out that products designed to be repaired easily can still be attractive and well made. The debate is likely to continue for some time, but many observers believe that the days when a small fault meant the end of a product may soon be over.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an example of how some products are made in a way that prevents repair",
          "A",
          "Spare parts may be hard to find, repair instructions may not be available, and some products are glued together so that they cannot be opened without being damaged.",
          "Paragraph A: some products 'are glued together so that they cannot be opened'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a figure for the amount of electronic waste produced in one year",
          "B",
          "According to a United Nations report, about 62 million tonnes of it were produced in 2022, and less than a quarter was properly collected and recycled.",
          "Paragraph B gives '62 million tonnes' of electronic waste in 2022.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a group of people who were not allowed to fix their own equipment",
          "C",
          "Modern tractors are controlled by computer software, and some farmers found that they were not allowed to fix their own machines without the manufacturer's permission, even during the busy harvest season.",
          "Paragraph C: farmers 'were not allowed to fix their own machines'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a system that helps shoppers to compare products",
          "E",
          "Shoppers can compare these scores before they buy.",
          "Paragraph E: France's repair score lets shoppers 'compare these scores before they buy'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reward for customers who decide to have a product repaired",
          "F",
          "Customers who choose a repair instead of a replacement will also receive an extra year of guarantee.",
          "Paragraph F: choosing repair brings 'an extra year of guarantee'.",
        ),
        pickTwo(
          MAKERS_STEM,
          MAKERS,
          "A or C",
          "They argue that repairs carried out by untrained people could be dangerous, especially for products with powerful batteries.",
          "A is correct: manufacturers say repairs by untrained people 'could be dangerous'. B is the opposite of the passage, which says manufacturers can charge high prices.",
        ),
        pickTwo(
          MAKERS_STEM,
          MAKERS,
          "A or C",
          "They also claim that sharing detailed technical information could help criminals or competitors.",
          "C is correct: sharing information 'could help criminals or competitors'. D and E are not mentioned.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The first repair café was organised in Amsterdam by a ______.",
          "journalist",
          'One of the best-known parts of the movement began in Amsterdam in 2009, when a journalist organised the first "repair café".',
          "The first repair café was organised by 'a journalist'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "At repair cafés, volunteers with ______ help visitors to mend broken items.",
          "practical skills",
          "At these events, volunteers with practical skills help visitors to fix broken items, from toasters to bicycles, free of charge.",
          "The volunteers have 'practical skills'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Organisers say the events also bring ______ together.",
          "neighbours",
          "They also bring neighbours together and show people that many problems are easier to solve than they think.",
          "The events 'bring neighbours together'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "In France, each product is given a mark out of ______.",
          "ten",
          "Each product receives a mark out of ten, based on how easy it is to repair and how long spare parts will be available.",
          "Products receive 'a mark out of ten'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Under the EU law, some products must be repaired even after the ______ has ended.",
          "guarantee",
          "In 2024, it agreed a new law that requires manufacturers to repair certain products, such as washing machines, fridges and phones, even after the guarantee has ended.",
          "Repairs are required 'even after the guarantee has ended'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Some companies now sell spare parts and ______ directly to customers.",
          "repair kits",
          "Some companies have responded to public pressure by selling spare parts and repair kits directly to customers.",
          "Companies sell 'spare parts and repair kits directly to customers'.",
        ),
      ],
    },
    {
      key: "t12-p3-risky-play",
      title: "Why Children Need Risky Play",
      topic: "the case for letting children take risks when they play",
      difficulty: 6,
      body: `Visit a children's playground built in the last thirty years, and you are likely to find soft rubber surfaces, low climbing frames and swings designed to prevent any serious fall. In many countries, concern about injuries, and about the possibility of legal action if a child is hurt, has produced playgrounds that are safer than ever before. Yet many researchers and educators now believe that the drive for safety has gone too far. I agree with them: children need opportunities to take risks when they play.

The idea is not new. In 1943, during the Second World War, an unusual playground opened in Emdrup, near Copenhagen in Denmark. Its designer, the landscape architect Carl Theodor Sørensen, had noticed that children often preferred to play on building sites and in rubbish dumps rather than in the neat playgrounds he designed. At Emdrup, children were given old wood, bricks and tools, and were allowed to build whatever they wanted. After a visit in 1946, a British campaigner, Lady Allen of Hurtwood, promoted the idea in Britain, where such places became known as "adventure playgrounds". Many were built on land that had been damaged by bombs during the war.

Researchers define risky play as thrilling and exciting play that involves some possibility of physical injury. A Norwegian researcher has identified several common types, including playing at great heights, playing at high speed, using dangerous tools, playing near water or fire, and play-fighting. Children also enjoy exploring places on their own, away from adults. What these activities have in common is a mixture of fear and excitement, which children seem to seek out for its own sake. Many adults can remember similar experiences from their own childhoods, such as climbing high into a tree or riding a bicycle down a steep hill.

Supporters of risky play argue that it brings important benefits. Children who climb trees or balance on walls learn to judge their own abilities and to manage their fear. A review of studies published in 2015 found that risky outdoor play was linked with more physical activity and better social skills. Some psychologists have also suggested that children who never experience manageable fear may be more likely to develop anxiety later in life, although this idea still needs more evidence.

Critics worry that encouraging risk will simply lead to more injuries. This concern is understandable, but the evidence suggests that serious injuries in playgrounds are rare, and that most injuries are minor, such as cuts and bruises. Some researchers even argue that very safe playgrounds can create new dangers, because children who are bored look for excitement elsewhere, or use equipment in ways it was not designed for. In my view, a broken arm, though painful, is not the worst thing that can happen to a child; a childhood without challenges may do more lasting harm.

Attitudes are beginning to change. In several countries, safety organisations now recommend that playground designers should weigh the benefits of an activity against its risks, rather than trying to remove risk completely. Some schools have removed rules that stopped children from running or climbing during breaks, and a few have even provided materials such as old tyres, planks and ropes for children to play with freely. Teachers at these schools often report that there is less bullying and that children are more active. Some also say that children become better at solving problems together.

None of this means that adults should stop supervising children. The aim is not to put children in danger but to let them experience manageable risks in a reasonably safe environment. Adults can help by allowing children to try new challenges gradually, and by resisting the urge to step in at the first sign of difficulty. Parents who let a child climb a little higher than usual should not feel that they are being careless. Learning when to stay back is, for many adults, the hardest part.

In the end, childhood is a preparation for adult life, and adult life is full of uncertainty. Children who have learned to judge risks for themselves are, I believe, better prepared to face that uncertainty than those who have always been protected from it. Playgrounds cannot remove every danger from the world, and they should not try to. Instead, they should give children the chance to discover what they are capable of. That, after all, is one of the most valuable lessons any child can learn.`,
      questions: [
        mcq(
          "What point is made about modern playgrounds in the first paragraph?",
          [
            "They are more popular than older playgrounds.",
            "They have become too concerned with safety.",
            "They are too expensive for most towns to build.",
            "They are mainly designed with children's help.",
          ],
          "They have become too concerned with safety.",
          "Yet many researchers and educators now believe that the drive for safety has gone too far.",
          "The drive for safety 'has gone too far', and the writer agrees.",
        ),
        mcq(
          "What had Carl Theodor Sørensen noticed about children?",
          [
            "They often preferred to play in places not designed for play.",
            "They were frightened of building sites.",
            "They liked playgrounds with soft surfaces.",
            "They needed adults to organise their games.",
          ],
          "They often preferred to play in places not designed for play.",
          "Its designer, the landscape architect Carl Theodor Sørensen, had noticed that children often preferred to play on building sites and in rubbish dumps rather than in the neat playgrounds he designed.",
          "Children preferred 'building sites and rubbish dumps' to neat playgrounds.",
        ),
        mcq(
          "According to the passage, what do the different types of risky play have in common?",
          [
            "They all take place outdoors.",
            "They all need special equipment.",
            "They combine fear with excitement.",
            "They are usually done in large groups.",
          ],
          "They combine fear with excitement.",
          "What these activities have in common is a mixture of fear and excitement, which children seem to seek out for its own sake.",
          "They share 'a mixture of fear and excitement'.",
        ),
        mcq(
          "What does the writer say about the idea that risky play may prevent anxiety?",
          [
            "It has been proven by many studies.",
            "It has not yet been fully supported by evidence.",
            "It applies only to very young children.",
            "It was first suggested by Lady Allen of Hurtwood.",
          ],
          "It has not yet been fully supported by evidence.",
          "Some psychologists have also suggested that children who never experience manageable fear may be more likely to develop anxiety later in life, although this idea still needs more evidence.",
          "The idea 'still needs more evidence'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "A review of studies published in 2015 found that risky outdoor play",
          "was linked with more physical activity and better social skills.",
          "A review of studies published in 2015 found that risky outdoor play was linked with more physical activity and better social skills.",
          "The 2015 review linked risky play with 'more physical activity and better social skills'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Most injuries that happen in playgrounds",
          "are usually minor.",
          "This concern is understandable, but the evidence suggests that serious injuries in playgrounds are rare, and that most injuries are minor, such as cuts and bruises.",
          "Most injuries 'are minor, such as cuts and bruises'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Some researchers believe that very safe playgrounds",
          "can create new dangers.",
          "Some researchers even argue that very safe playgrounds can create new dangers, because children who are bored look for excitement elsewhere, or use equipment in ways it was not designed for.",
          "Very safe playgrounds 'can create new dangers'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Teachers at schools that give children loose materials to play with",
          "often report that there is less bullying.",
          "Teachers at these schools often report that there is less bullying and that children are more active.",
          "These teachers 'often report that there is less bullying'.",
        ),
        ynng(
          "Children should be given opportunities to take risks when they play.",
          "YES",
          "I agree with them: children need opportunities to take risks when they play.",
          "The writer agrees that 'children need opportunities to take risks'.",
        ),
        ynng(
          "A broken arm is the most serious harm that a child can suffer.",
          "NO",
          "In my view, a broken arm, though painful, is not the worst thing that can happen to a child; a childhood without challenges may do more lasting harm.",
          "A broken arm 'is not the worst thing that can happen to a child'.",
        ),
        ynng(
          "Children at schools that allow risky play achieve better exam results.",
          "NOT GIVEN",
          "",
          "The writer mentions less bullying and more activity at these schools, but nothing about exam results.",
        ),
        ynng(
          "Adults should no longer supervise children in playgrounds.",
          "NO",
          "None of this means that adults should stop supervising children.",
          "The writer says this does not mean 'adults should stop supervising children'.",
        ),
        ynng(
          "Parents who allow a child to climb higher than usual are not being careless.",
          "YES",
          "Parents who let a child climb a little higher than usual should not feel that they are being careless.",
          "Such parents 'should not feel that they are being careless'.",
        ),
        ynng(
          "Children who learn to judge risks are better prepared for adult life.",
          "YES",
          "Children who have learned to judge risks for themselves are, I believe, better prepared to face that uncertainty than those who have always been protected from it.",
          "The writer believes they are 'better prepared to face that uncertainty'.",
        ),
      ],
    },
  ],
};
