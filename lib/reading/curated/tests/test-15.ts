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

// ---- Passage 1 · biography · notes + True/False/Not Given --------------------

const THARP = {
  title: "Marie Tharp",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · headings, choose TWO ---------------------------

const HEADINGS = [
  "A promising start that ended in disaster",
  "More than one reason for decline",
  "New technology for a new generation",
  "A cleaner way to fly",
  "Reaching places that planes cannot",
  "Obstacles that still have to be overcome",
  "A future in specialised roles",
  "The high cost of training pilots",
  "Why helium is becoming cheaper",
  "Passengers who refused to fly",
];

function heading(paragraph: string, answer: string, support: string, why: string): CuratedQuestion {
  return {
    ...plain("matching_headings", `Paragraph ${paragraph}`, answer, support, why),
    options: HEADINGS,
  };
}

const DRAWBACKS_STEM = "Which TWO disadvantages of airships are mentioned in the passage?";
const DRAWBACKS = [
  "They travel slowly.",
  "They are too noisy for passengers.",
  "They are strongly affected by high winds.",
  "They cannot carry heavy loads.",
  "They need very long runways.",
];

// ---- Passage 3 · writer's views · word bank ----------------------------------

const WRITING_BANK = [
  "workplaces",
  "fluency",
  "faster",
  "complementary",
  "painful",
  "perfection",
  "competing",
  "slower",
  "homes",
];

export const TEST_15: CuratedTest = {
  key: "full-test-15",
  targetBand: 6,
  passages: [
    {
      key: "t15-p1-marie-tharp",
      title: "Mapping the Hidden Ocean Floor",
      topic: "how Marie Tharp revealed the landscape beneath the oceans",
      difficulty: 5,
      body: `For most of human history, the floor of the deep ocean was almost completely unknown. Sailors could measure the depth of the water only by lowering a weighted rope until it touched the bottom, a slow process that gave just one measurement at a time. Many people imagined that the ocean floor was flat and featureless, covered in thick mud. The scientist who did more than anyone to show how wrong this idea was did not go to sea at all during the most important years of her work. Her name was Marie Tharp.

Tharp was born in 1920 in the state of Michigan in the United States. Her father worked for the government as a soil surveyor, making maps of farmland, and the family moved frequently as he travelled from one job to another. As a child, Tharp often went with him into the countryside, an experience that she later said gave her an early interest in maps. At university, she studied English and music before turning to geology. In the 1940s, while many men were away fighting in the Second World War, some universities began to offer places in science to women, and Tharp took the opportunity to train as a geologist in the oil industry.

In 1948, Tharp moved to New York and joined a research group at Columbia University that was studying the geology of the ocean. At that time, women were not allowed to join research voyages, so her job was to work in the office, analysing data collected by male scientists on ships. She worked closely with the geologist Bruce Heezen, who gathered measurements in the Atlantic Ocean using a device called an echo sounder. This instrument sent pulses of sound to the sea floor and recorded how long the echoes took to return, allowing the depth to be measured continuously as a ship moved.

Using thousands of these measurements, Tharp began to draw profiles of the Atlantic floor, which showed its shape from one side of the ocean to the other. In 1952, she noticed something surprising. In every profile, a deep V-shaped valley ran along the centre of a huge underwater mountain range known as the Mid-Atlantic Ridge. Tharp believed the valley was a rift, a place where the Earth's surface was being pulled apart. At the time, this was a controversial idea, because most geologists rejected the theory that the continents could move. When she showed her findings to Heezen, he dismissed them at first as "girl talk".

Tharp's evidence, however, was difficult to ignore. Another member of the group was plotting the locations of undersea earthquakes, and he found that they were concentrated along the same line as the valley. This strongly suggested that the valley was an active feature of the Earth's crust. Over the following years, Heezen came to accept Tharp's interpretation, and together they found that the ridge and its central valley continued through other oceans, forming a chain of mountains that stretched around the globe.

Because the military regarded detailed information about the sea floor as secret during the Cold War, Tharp and Heezen could not publish maps showing exact depths. Instead, they produced maps drawn as if the viewer were looking at the landscape from an angle, with mountains and valleys shown in shaded relief. Their first map of this kind, which covered the North Atlantic, was published in 1957. It allowed ordinary readers, for the first time, to picture the hidden landscape beneath the waves.

During the 1960s, new evidence persuaded most geologists that the continents did move, carried on vast plates of rock. The rift valley that Tharp had identified became one of the key pieces of evidence for this theory, now known as plate tectonics. In 1968, Tharp was finally allowed to join a research voyage herself. In 1977, she and Heezen published a map of the entire ocean floor, painted by an Austrian artist, Heinrich Berann. The same year, Heezen died suddenly while on a research voyage, and Tharp continued the work on her own.

For many years, Tharp received little public recognition, and her contribution was often overshadowed by that of Heezen and other male scientists. Recognition came late in her life. In 1997, the Library of Congress in Washington named her one of the four greatest mapmakers of the twentieth century. She died in 2006, and today her maps are regarded as some of the most important scientific images ever produced. They changed not only how scientists understood the Earth, but also how ordinary people imagined the world beneath the sea.`,
      questions: [
        noteLine(
          THARP,
          "Early life",
          "father's job: soil ______",
          "surveyor",
          "Her father worked for the government as a soil surveyor, making maps of farmland, and the family moved frequently as he travelled from one job to another.",
          "Her father 'worked for the government as a soil surveyor'.",
        ),
        noteLine(
          THARP,
          "Early life",
          "studied English and ______ before geology",
          "music",
          "At university, she studied English and music before turning to geology.",
          "She 'studied English and music before turning to geology'.",
        ),
        noteLine(
          THARP,
          "Work at Columbia University",
          "women were not allowed on research ______",
          "voyages",
          "At that time, women were not allowed to join research voyages, so her job was to work in the office, analysing data collected by male scientists on ships.",
          "Women 'were not allowed to join research voyages'.",
        ),
        noteLine(
          THARP,
          "Work at Columbia University",
          "depths were measured with an echo ______",
          "sounder",
          "She worked closely with the geologist Bruce Heezen, who gathered measurements in the Atlantic Ocean using a device called an echo sounder.",
          "Heezen used 'a device called an echo sounder'.",
        ),
        noteLine(
          THARP,
          "Work at Columbia University",
          "1952: noticed a V-shaped ______ along the Mid-Atlantic Ridge",
          "valley",
          "In every profile, a deep V-shaped valley ran along the centre of a huge underwater mountain range known as the Mid-Atlantic Ridge.",
          "She saw 'a deep V-shaped valley' in every profile.",
        ),
        noteLine(
          THARP,
          "Work at Columbia University",
          "undersea earthquakes found along the same ______ as the valley",
          "line",
          "Another member of the group was plotting the locations of undersea earthquakes, and he found that they were concentrated along the same line as the valley.",
          "The earthquakes were 'concentrated along the same line as the valley'.",
        ),
        noteLine(
          THARP,
          "Later work",
          "maps showed mountains and valleys in shaded ______",
          "relief",
          "Instead, they produced maps drawn as if the viewer were looking at the landscape from an angle, with mountains and valleys shown in shaded relief.",
          "Features were 'shown in shaded relief'.",
          {
            before: [
              {
                text: "exact depths could not be published because the information was secret",
                indent: 0,
              },
            ],
          },
        ),
        noteLine(
          THARP,
          "Later work",
          "1977 map of the whole ocean floor painted by an Austrian ______",
          "artist",
          "In 1977, she and Heezen published a map of the entire ocean floor, painted by an Austrian artist, Heinrich Berann.",
          "The map was 'painted by an Austrian artist'.",
        ),
        tfng(
          "Tharp's family often moved to a different home when she was a child.",
          "TRUE",
          "Her father worked for the government as a soil surveyor, making maps of farmland, and the family moved frequently as he travelled from one job to another.",
          "'The family moved frequently' because of her father's work.",
        ),
        tfng(
          "Heezen agreed with Tharp's explanation of the valley as soon as she showed it to him.",
          "FALSE",
          'When she showed her findings to Heezen, he dismissed them at first as "girl talk".',
          "Heezen 'dismissed them at first'.",
        ),
        tfng(
          "Tharp was on the ship when Heezen died.",
          "NOT GIVEN",
          "",
          "The passage says Heezen died on a research voyage, but not whether Tharp was there.",
        ),
        tfng(
          "The Library of Congress honoured Tharp as one of the leading mapmakers of her century.",
          "TRUE",
          "In 1997, the Library of Congress in Washington named her one of the four greatest mapmakers of the twentieth century.",
          "She was named 'one of the four greatest mapmakers of the twentieth century'.",
        ),
        tfng(
          "Tharp's maps are used in schools in many countries today.",
          "NOT GIVEN",
          "",
          "The maps are called important scientific images, but their use in schools is not mentioned.",
        ),
      ],
    },
    {
      key: "t15-p2-airships",
      title: "The Return of the Airship",
      topic: "why engineers are designing a new generation of airships",
      difficulty: 6,
      body: `A) In the early twentieth century, many people believed that airships were the future of long-distance travel. These giant craft, kept in the air by bags of lighter-than-air gas, could carry passengers across oceans in comfort, with dining rooms, lounges and private cabins. In the 1930s, German airships made regular flights between Europe and the Americas. Then, in May 1937, the airship Hindenburg caught fire as it came in to land in New Jersey, and thirty-six people were killed. The disaster was filmed and photographed, and images of the burning airship were soon seen around the world. For many people, those pictures became a lasting symbol of the dangers of airship travel.

B) The Hindenburg disaster is often said to have ended the age of the airship, but other factors were just as important. Aeroplanes were becoming faster and more reliable, and they were less affected by bad weather. The Hindenburg had been filled with hydrogen, a gas that burns very easily. It had originally been designed for helium, which does not burn, but the United States, which controlled most of the world's supply of helium, would not sell the safer gas to Germany. By the time the Second World War began, airships had almost disappeared from passenger service.

C) Nearly a century later, airships are attracting serious attention again. Several companies are developing new designs, and one of the largest, built in California, made its first test flights in 2023. At more than 120 metres long, it is among the biggest aircraft in the world. Modern airships use helium rather than hydrogen, and they are built from light materials such as carbon fibre. Many are controlled by computers and powered partly by electric motors, and their pilots rely on modern weather forecasts that were unavailable in the 1930s. Some designs combine the lift from gas with the lift from wings, making them a mixture of airship and aeroplane.

D) The main reason for this renewed interest is the need to reduce carbon emissions from transport. Because an airship is held up by gas rather than by the movement of air over its wings, it needs far less energy to stay in the air than an aeroplane does. One British company has claimed that its airship could produce around ninety per cent less carbon dioxide than a plane on some short routes. Supporters argue that airships could eventually be powered entirely by electricity or by hydrogen fuel cells, producing almost no emissions at all. Critics, however, point out that such claims have not yet been tested in regular commercial service.

E) Airships also have practical advantages that aeroplanes lack. They do not need runways, and some designs can land on water, ice or open ground. This makes them attractive for carrying goods to remote places that have no airports or roads, such as mining sites or small islands. A French company is developing an airship designed to lift heavy loads, such as long wooden logs, out of forests without building roads. Airships could also deliver supplies to areas cut off by earthquakes or floods, where roads and airports may have been damaged. Unlike helicopters, airships can stay in the air for long periods without using much fuel.

F) However, many problems remain. Airships are slow: most cannot travel faster than about 130 kilometres an hour, far below the speed of a jet. They are also very sensitive to strong winds, which can push them off course or make landing dangerous. In 2016, a British airship was damaged when it hit the ground nose first at the end of a test flight. Storing and handling such large craft requires enormous buildings, and helium, which is produced mainly as a by-product of natural gas, has become increasingly expensive.

G) For these reasons, few experts expect airships to replace aeroplanes on long-distance routes. Instead, they are likely to fill particular roles where speed matters less than cost, emissions or the ability to reach difficult places. Some tourist companies are also planning slow, luxurious airship journeys over natural landscapes such as the Arctic. Whether airships become common again will depend on whether their builders can prove that the new craft are safe, reliable and affordable. If they can, the sight of a giant airship moving slowly across the sky may once again become familiar. For now, however, most of the new airships exist only as test models.`,
      questions: [
        heading(
          "A",
          "A promising start that ended in disaster",
          "In the early twentieth century, many people believed that airships were the future of long-distance travel.",
          "Paragraph A moves from the hopes for airships to the Hindenburg fire.",
        ),
        heading(
          "B",
          "More than one reason for decline",
          "The Hindenburg disaster is often said to have ended the age of the airship, but other factors were just as important.",
          "Paragraph B adds faster aeroplanes and the helium problem to the disaster.",
        ),
        heading(
          "C",
          "New technology for a new generation",
          "Modern airships use helium rather than hydrogen, and they are built from light materials such as carbon fibre.",
          "Paragraph C describes helium, carbon fibre, computers and electric motors.",
        ),
        heading(
          "D",
          "A cleaner way to fly",
          "The main reason for this renewed interest is the need to reduce carbon emissions from transport.",
          "Paragraph D is about lower emissions.",
        ),
        heading(
          "E",
          "Reaching places that planes cannot",
          "This makes them attractive for carrying goods to remote places that have no airports or roads, such as mining sites or small islands.",
          "Paragraph E is about remote sites, forests and disaster areas without runways.",
        ),
        heading(
          "F",
          "Obstacles that still have to be overcome",
          "However, many problems remain.",
          "Paragraph F lists speed, wind, accidents, hangars and helium costs.",
        ),
        heading(
          "G",
          "A future in specialised roles",
          "Instead, they are likely to fill particular roles where speed matters less than cost, emissions or the ability to reach difficult places.",
          "Paragraph G predicts particular roles rather than replacing aeroplanes.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "The Hindenburg was filled with ______, a gas that burns very easily.",
          "hydrogen",
          "The Hindenburg had been filled with hydrogen, a gas that burns very easily.",
          "It 'had been filled with hydrogen, a gas that burns very easily'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Modern airships are made from light materials such as carbon ______.",
          "fibre",
          "Modern airships use helium rather than hydrogen, and they are built from light materials such as carbon fibre.",
          "They are built from 'light materials such as carbon fibre'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Because airships do not need ______, they can reach remote places.",
          "runways",
          "They do not need runways, and some designs can land on water, ice or open ground.",
          "Airships 'do not need runways'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Helium is mainly produced as a by-product of natural ______.",
          "gas",
          "Storing and handling such large craft requires enormous buildings, and helium, which is produced mainly as a by-product of natural gas, has become increasingly expensive.",
          "Helium is 'produced mainly as a by-product of natural gas'.",
        ),
        pickTwo(
          DRAWBACKS_STEM,
          DRAWBACKS,
          "A or C",
          "Airships are slow: most cannot travel faster than about 130 kilometres an hour, far below the speed of a jet.",
          "A is correct: 'airships are slow'. D is wrong — paragraph E says they can lift heavy loads.",
        ),
        pickTwo(
          DRAWBACKS_STEM,
          DRAWBACKS,
          "A or C",
          "They are also very sensitive to strong winds, which can push them off course or make landing dangerous.",
          "C is correct: they are 'very sensitive to strong winds'. E is wrong — they 'do not need runways'.",
        ),
      ],
    },
    {
      key: "t15-p3-handwriting",
      title: "Is Handwriting Worth Saving?",
      topic: "the debate over teaching handwriting in a digital age",
      difficulty: 7,
      body: `For centuries, learning to write by hand was one of the central tasks of early education. Children spent hours copying letters, and neat handwriting was regarded as a sign of a disciplined mind. Today, that tradition is under pressure. Much of our writing is done on keyboards and touchscreens, and some education systems have reduced the time devoted to handwriting or stopped teaching joined-up writing altogether. Finland, for example, removed the requirement to teach joined-up script in 2016, allowing schools to spend more time on typing skills. It is tempting to regard handwriting as an old-fashioned skill that is no longer worth the effort, but I believe that would be a mistake.

The strongest arguments for handwriting come from research on learning. Several studies have found that young children who practise forming letters by hand recognise them more quickly than those who learn to type them. One explanation is that writing a letter requires the brain to plan and control a precise sequence of movements, which creates a richer memory of its shape. In one experiment with children who could not yet read, brain scans showed that areas associated with reading became more active after the children had practised writing letters by hand, but not after they had typed them.

Research with older students points in a similar direction. In a study published in 2024, researchers in Norway recorded the brain activity of university students while they wrote words either by hand or on a keyboard. When the students wrote by hand, their brains showed far more widespread communication between different regions, particularly in patterns known to be important for memory and learning. The researchers argued that schools should ensure children continue to write by hand, even as they learn to use digital devices.

Such findings need to be interpreted with care. The Norwegian study involved only a small number of participants, and measuring brain activity is not the same as measuring learning; a brain that is working harder is not necessarily learning more. Nonetheless, the results are consistent with a wider body of evidence suggesting that the physical act of writing helps people to remember information. Many students report that they recall notes they have written by hand better than notes they have typed, and some experimental studies support this impression.

There are also practical reasons for keeping handwriting. Not every situation allows the use of a device, and many examinations around the world are still taken on paper. Students who write slowly or illegibly may be at a disadvantage, since they may be unable to express everything they know in the time available. Research has shown that handwriting speed in the early years of school can predict the quality and length of children's written compositions later on. In my view, it would be unwise to assume that such situations will disappear in the near future.

None of this means that typing should be neglected. Keyboard skills are essential in modern workplaces, and for some pupils, including many with physical difficulties that make handwriting painful, a keyboard can be liberating. Nor do I think that schools need to return to the rigid drills of the past, in which children were punished for untidy letters. The aim should be fluency, not perfection: children need to write quickly and clearly enough that the effort of forming letters does not distract them from what they want to say.

The debate over joined-up writing is more complex. Supporters argue that it allows people to write faster and that it helps children to see words as whole units. Critics point out that many adults write in a mixture of joined and separate letters, and that there is little evidence that joined-up writing in particular brings special benefits. Some regions that had dropped it have since brought it back, partly on the grounds that citizens should be able to read historical documents. I am not convinced that this is a strong enough reason on its own, but I do think the choice should be based on evidence rather than fashion.

Ultimately, handwriting and typing are best seen as complementary skills rather than rivals. A generation that can do both will be better equipped than one that can do only one, and schools need not choose between them. Abandoning handwriting simply because computers are convenient would mean overlooking what research increasingly suggests: that the movements of the hand play a part in how we think and remember. That is a good reason to keep pens in children's hands, even in a digital age.`,
      questions: [
        mcq(
          "Why does the writer mention Finland?",
          [
            "to show that handwriting standards are improving",
            "to give an example of a country that reduced the teaching of handwriting",
            "to compare research in Finland and Norway",
            "to criticise the teaching of typing in schools",
          ],
          "to give an example of a country that reduced the teaching of handwriting",
          "Finland, for example, removed the requirement to teach joined-up script in 2016, allowing schools to spend more time on typing skills.",
          "Finland is an example of a system that 'removed the requirement to teach joined-up script'.",
        ),
        mcq(
          "According to the passage, why may forming letters by hand help children to recognise them?",
          [
            "It is slower than typing.",
            "It creates a richer memory of each letter's shape.",
            "Children find it more enjoyable than typing.",
            "It reduces the time children spend looking at screens.",
          ],
          "It creates a richer memory of each letter's shape.",
          "One explanation is that writing a letter requires the brain to plan and control a precise sequence of movements, which creates a richer memory of its shape.",
          "Planning the movements 'creates a richer memory of its shape'.",
        ),
        mcq(
          "What did the Norwegian study find when students wrote by hand?",
          [
            "They wrote more words than when they typed.",
            "Different regions of their brains communicated more widely.",
            "They made fewer spelling mistakes.",
            "They remembered the words for longer.",
          ],
          "Different regions of their brains communicated more widely.",
          "When the students wrote by hand, their brains showed far more widespread communication between different regions, particularly in patterns known to be important for memory and learning.",
          "Their brains showed 'far more widespread communication between different regions'. Memory was not tested directly (D).",
        ),
        mcq(
          "What is the writer's view of the Norwegian study?",
          [
            "It proves that handwriting improves learning.",
            "Its results should be interpreted carefully.",
            "It was badly designed and should be ignored.",
            "It contradicts earlier research on children.",
          ],
          "Its results should be interpreted carefully.",
          "Such findings need to be interpreted with care.",
          "The writer says the findings 'need to be interpreted with care', though they fit wider evidence.",
        ),
        mcq(
          "What does research suggest about handwriting speed in young children?",
          [
            "It depends mainly on the kind of pen used.",
            "It can help to predict the quality of their later writing.",
            "It improves once children learn to type.",
            "It is usually higher in girls than in boys.",
          ],
          "It can help to predict the quality of their later writing.",
          "Research has shown that handwriting speed in the early years of school can predict the quality and length of children's written compositions later on.",
          "Early speed 'can predict the quality and length of children's written compositions later on'.",
        ),
        ynng(
          "It would be wrong to treat handwriting as a skill that is no longer worth learning.",
          "YES",
          "It is tempting to regard handwriting as an old-fashioned skill that is no longer worth the effort, but I believe that would be a mistake.",
          "The writer believes regarding handwriting as not worth the effort 'would be a mistake'.",
        ),
        ynng(
          "Examinations taken on paper are likely to disappear soon.",
          "NO",
          "In my view, it would be unwise to assume that such situations will disappear in the near future.",
          "The writer says it would be 'unwise to assume' they will disappear soon.",
        ),
        ynng(
          "Schools should return to the strict handwriting practice of the past.",
          "NO",
          "Nor do I think that schools need to return to the rigid drills of the past, in which children were punished for untidy letters.",
          "The writer does not think schools 'need to return to the rigid drills of the past'.",
        ),
        ynng(
          "Most teachers prefer to mark typed work rather than handwritten work.",
          "NOT GIVEN",
          "",
          "The writer never discusses teachers' preferences for marking.",
        ),
        ynng(
          "Decisions about teaching joined-up writing should be based on evidence.",
          "YES",
          "I am not convinced that this is a strong enough reason on its own, but I do think the choice should be based on evidence rather than fashion.",
          "The choice 'should be based on evidence rather than fashion'.",
        ),
        fromList(
          "summary_completion",
          WRITING_BANK,
          "Typing is an essential skill in today's ______.",
          "workplaces",
          "Keyboard skills are essential in modern workplaces, and for some pupils, including many with physical difficulties that make handwriting painful, a keyboard can be liberating.",
          "Keyboard skills 'are essential in modern workplaces'.",
        ),
        fromList(
          "summary_completion",
          WRITING_BANK,
          "The main aim of handwriting lessons should be ______.",
          "fluency",
          "The aim should be fluency, not perfection: children need to write quickly and clearly enough that the effort of forming letters does not distract them from what they want to say.",
          "'The aim should be fluency, not perfection.'",
        ),
        fromList(
          "summary_completion",
          WRITING_BANK,
          "Supporters of joined-up writing say it helps people to write ______.",
          "faster",
          "Supporters argue that it allows people to write faster and that it helps children to see words as whole units.",
          "It 'allows people to write faster'.",
        ),
        fromList(
          "summary_completion",
          WRITING_BANK,
          "The writer sees handwriting and typing as ______ skills.",
          "complementary",
          "Ultimately, handwriting and typing are best seen as complementary skills rather than rivals.",
          "They are 'complementary skills rather than rivals'.",
        ),
      ],
    },
  ],
};
