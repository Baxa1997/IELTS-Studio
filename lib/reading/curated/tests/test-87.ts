import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · working animals · notes box --------------------------------

const DOG_NOTES = {
  title: "Stages of training",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · accident investigation · people and a word bank -----------

const RECORDER_PEOPLE = ["Ingrid Halvorsen", "Samir Boudiaf", "Grace Okonkwo", "Toshiro Namba"];
const RECORDER_BANK = [
  "orange",
  "tail",
  "beacon",
  "parameters",
  "voices",
  "loop",
  "blame",
  "streaming",
  "crush",
];

// ---- Passage 3 · road safety law · lettered paragraphs ---------------------

const BELT_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const BELT_ENDINGS = [
  "because a body goes on travelling at the speed the car was doing.",
  "because its inventor's employer judged safety to outweigh ownership.",
  "although voluntary fitting had already been available for a decade.",
  "since voluntary wearing stayed between ten and thirty per cent for years.",
  "because drivers who feel safer may take slightly greater risks.",
  "even though the evidence for the front seats had been settled for years.",
  "which made the law rather than the product the decisive step.",
];

export const TEST_87: CuratedTest = {
  key: "full-test-87",
  targetBand: 4,
  passages: [
    {
      key: "t87-p1-guide-dogs",
      title: "The Dog That Learns a Route",
      topic: "what a guide dog is actually trained to do, and what its handler does instead",
      difficulty: 4,
      body: `A guide dog does not know where its handler wants to go. This is the first thing every instructor tells a new owner, and it is the thing the public most consistently gets wrong. The dog does not lead; it responds to instructions, and its job is to carry out an instruction safely rather than to choose a destination. The handler decides the route, keeps track of where they are, and gives commands. The dog contributes obstacle avoidance, a straight line along a pavement, an accurate stop at every kerb, and a refusal to move when moving would be dangerous.

That last item is the most remarkable part of the training, because it requires the animal to disobey. A dog trained only to follow commands would step into traffic when told to cross. A guide dog is taught to stop at the edge of a road and wait, and to refuse the command to go forward if a vehicle is approaching, even when the handler insists. Trainers call this intelligent disobedience, and it takes longer to establish than any other element of the work.

The training system now used almost everywhere began with a school founded in Germany after the First World War to work with blinded soldiers, and was brought to the English-speaking world in the 1920s by an American woman, Dorothy Eustis, who had been breeding shepherd dogs in Switzerland. Her account of the German school was published in a newspaper, a blind young man read it and wrote to her, and the school that resulted became the model for the organisations that exist today.

Modern preparation starts before the puppy can work at all. For roughly the first year a puppy lives with a volunteer family whose task is not to teach the guiding but to produce a calm adult: a dog that is comfortable on buses, in shops, in lifts, in crowds, around other dogs and near traffic. This stage is called socialisation, and the organisations that run these programmes regard it as the part that decides most outcomes. A dog that is anxious in a supermarket cannot be trained out of it later, whatever else it can do.

The dog then goes to a training centre for several months of formal work with a professional instructor, learning the harness, the kerb stops, the obstacle work and the disobedience. Finally the dog and its future handler are trained together, usually residentially, for several weeks. This last stage is as much about the person as the animal: learning to read the harness, to trust a stop, and to keep a mental map of a route are all skills, and they take practice.

The failure rate is high and is not a sign of a bad programme. Something like a third to a half of dogs that begin formal training do not complete it. The commonest reasons are a distraction that cannot be trained away, anxiety in traffic, or a medical problem such as a joint condition or an allergy. Dogs that do not qualify are usually rehomed as pets or moved to other kinds of assistance work where the demands are different.

The cost is what surprises people. Producing one working guide dog, from breeding to placement, and supporting the partnership for its working life, is usually put at the equivalent of the price of a small car, and the working life is about eight years. Almost all of it is staff time. Because the dogs are given to handlers at no charge in most countries, the cost falls on donations, which makes the whole system dependent on public generosity for what is, in effect, a piece of mobility equipment.

There are alternatives, and the sensible position is that they are complementary rather than competing. A long cane is cheaper, needs no feeding, never retires, and gives direct information about the surface ahead that a dog cannot convey. Electronic aids can detect obstacles above waist height, which is where canes are weakest. A dog offers speed, a smoother walk, an animal that will refuse a dangerous instruction, and companionship that handlers frequently describe as the part they had not expected to matter. Most experienced travellers use more than one of these and choose between them according to the journey.`,
      questions: [
        tfng(
          "A guide dog chooses the route to the destination.",
          "FALSE",
          "The handler decides the route, keeps track of where they are, and gives commands.",
          "The handler decides the route.",
        ),
        tfng(
          "The dog is trained to refuse a dangerous command.",
          "TRUE",
          "A guide dog is taught to stop at the edge of a road and wait, and to refuse the command to go forward if a vehicle is approaching, even when the handler insists.",
          "It refuses when a vehicle approaches.",
        ),
        tfng(
          "Intelligent disobedience is quicker to teach than the other skills.",
          "FALSE",
          "Trainers call this intelligent disobedience, and it takes longer to establish than any other element of the work.",
          "It 'takes longer to establish' than anything else.",
        ),
        tfng(
          "The first school of this kind was set up for soldiers who had lost their sight.",
          "TRUE",
          "The training system now used almost everywhere began with a school founded in Germany after the First World War to work with blinded soldiers, and was brought to the English-speaking world in the 1920s by an American woman, Dorothy Eustis, who had been breeding shepherd dogs in Switzerland.",
          "It worked with blinded soldiers.",
        ),
        tfng(
          "Anxiety in shops can be corrected during formal training.",
          "FALSE",
          "A dog that is anxious in a supermarket cannot be trained out of it later, whatever else it can do.",
          "It 'cannot be trained out of it later'.",
        ),
        tfng(
          "Dogs that fail the training are usually put to other uses.",
          "TRUE",
          "Dogs that do not qualify are usually rehomed as pets or moved to other kinds of assistance work where the demands are different.",
          "They are rehomed or moved to other work.",
        ),
        tfng(
          "Labradors are the breed most often used today.",
          "NOT GIVEN",
          "",
          "The passage mentions shepherd dogs historically but names no modern breed.",
        ),
        noteLine(
          DOG_NOTES,
          "Year one",
          "Puppy lives with a volunteer ______",
          "family",
          "For roughly the first year a puppy lives with a volunteer family whose task is not to teach the guiding but to produce a calm adult: a dog that is comfortable on buses, in shops, in lifts, in crowds, around other dogs and near traffic.",
          "It lives with a volunteer family.",
        ),
        noteLine(
          DOG_NOTES,
          "Year one",
          "Purpose of the stage: ______",
          "socialisation",
          "This stage is called socialisation, and the organisations that run these programmes regard it as the part that decides most outcomes.",
          "The stage is called socialisation.",
        ),
        noteLine(
          DOG_NOTES,
          "Then",
          "Months of formal work with a professional ______",
          "instructor",
          "The dog then goes to a training centre for several months of formal work with a professional instructor, learning the harness, the kerb stops, the obstacle work and the disobedience.",
          "A professional instructor takes over.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Between a third and a half of dogs do not ______ formal training.",
          "complete",
          "Something like a third to a half of dogs that begin formal training do not complete it.",
          "They do not complete it.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A working dog's career lasts about eight ______.",
          "years",
          "Producing one working guide dog, from breeding to placement, and supporting the partnership for its working life, is usually put at the equivalent of the price of a small car, and the working life is about eight years.",
          "The working life is about eight years.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Canes are weakest at detecting obstacles above ______ height.",
          "waist",
          "Electronic aids can detect obstacles above waist height, which is where canes are weakest.",
          "Canes are weakest above waist height.",
        ),
      ],
    },
    {
      key: "t87-p2-flight-recorder",
      title: "The Box That Survives the Crash",
      topic: "a device built to be the only witness left",
      difficulty: 4,
      body: `The object universally called a black box is bright orange. It is painted that way so that searchers can see it among wreckage, and the name is a piece of journalistic shorthand that has outlived every attempt to correct it. There are normally two such devices on a large aircraft: one recording the aeroplane's own data, the other recording the sound in the cockpit. Both are built on the same principle, which is that the recording must survive whatever destroys the aircraft.

The engineering requirements are extreme and specific. The memory unit must withstand an impact of several thousand times the force of gravity, a crush load of over two tonnes, penetration by a heavy spike dropped from three metres, an hour in a fire at 1,100 degrees Celsius, and immersion at the pressure found several kilometres down. The electronics that do the recording are not protected; only the memory is, inside a stainless steel or titanium shell lined with insulating material. A recovered unit is often a burnt lump from which the internal module is cut out in a laboratory.

Ingrid Halvorsen, who works on accident investigation standards, stresses that the device's value depends on a rule that has nothing to do with engineering. In most jurisdictions the cockpit recording may be used only to establish the cause of an accident, and not in a prosecution or a disciplinary process. She argues that this protection is what makes the recording worth having, since crews who expect their conversation to be used against them behave differently, and that the countries where the protection has been weakened have seen exactly that effect.

The data recorder has grown beyond recognition. Early units scratched five parameters onto metal foil: heading, altitude, airspeed, vertical acceleration and time. Modern units record hundreds or thousands of parameters digitally, from control surface positions to individual switch states, sampled several times a second. Samir Boudiaf, an investigator, makes the point that this abundance changed the nature of the work: the difficulty is now interpretation rather than discovery, and an investigation can spend months establishing which of several thousand recorded channels is the one that matters.

The cockpit voice recorder has a limitation that has caused repeated argument. For decades it recorded on a loop of thirty minutes, overwriting continuously, which meant that in an accident following a long emergency the crucial early conversation had already been erased. The standard was extended to two hours, and there are proposals for twenty-five. Grace Okonkwo, a pilots' representative, supports the longer duration and opposes the video cameras that are periodically proposed alongside it, on the grounds that audio has a demonstrated investigative value while images of a crew's faces mostly serve a different purpose, and that the two should not be bundled into one decision.

The most persistent question is why the data must be recovered from the wreck at all. Aircraft already transmit maintenance data by satellite during flight, and after two airliners were lost over water with prolonged and expensive searches, proposals for continuous streaming of flight data became serious. Toshiro Namba, an engineer who has costed such systems, concludes that streaming everything is not currently affordable in bandwidth terms for the whole world fleet, but that triggered streaming — transmitting only when the aircraft's own systems detect an abnormal state — is affordable and would have located both of those aircraft immediately. He regards it as the clear next step and notes that it has been discussed for well over a decade.

Meanwhile the devices themselves have acquired one addition. A recorder now carries an underwater locator beacon, which is activated by contact with water and emits an acoustic pulse for thirty days, extended to ninety on newer units. It is a simple device and it only helps if a ship with the right listening equipment reaches the right area within the battery's life, which is why the streaming argument has not gone away.

There is also a question of scope. Trains, ships and some road vehicles now carry recorders of their own, and the investigative culture that grew up around aviation — a no-blame inquiry whose only product is a public report and a set of recommendations — has spread much less readily than the hardware. The box is easy to fit. The institution around it is the part that actually prevents the next accident.`,
      questions: [
        fromList(
          "matching_features",
          RECORDER_PEOPLE,
          "Legal protection for the recording is what makes it useful.",
          "Ingrid Halvorsen",
          "She argues that this protection is what makes the recording worth having, since crews who expect their conversation to be used against them behave differently, and that the countries where the protection has been weakened have seen exactly that effect.",
          "Halvorsen defends the legal protection.",
        ),
        fromList(
          "matching_features",
          RECORDER_PEOPLE,
          "The problem has shifted from finding information to making sense of it.",
          "Samir Boudiaf",
          "Samir Boudiaf, an investigator, makes the point that this abundance changed the nature of the work: the difficulty is now interpretation rather than discovery, and an investigation can spend months establishing which of several thousand recorded channels is the one that matters.",
          "Boudiaf names interpretation as the difficulty.",
        ),
        fromList(
          "matching_features",
          RECORDER_PEOPLE,
          "Two separate proposals should not be decided together.",
          "Grace Okonkwo",
          "Grace Okonkwo, a pilots' representative, supports the longer duration and opposes the video cameras that are periodically proposed alongside it, on the grounds that audio has a demonstrated investigative value while images of a crew's faces mostly serve a different purpose, and that the two should not be bundled into one decision.",
          "Okonkwo separates audio from video.",
        ),
        fromList(
          "matching_features",
          RECORDER_PEOPLE,
          "A partial version of an expensive idea is already affordable.",
          "Toshiro Namba",
          "Toshiro Namba, an engineer who has costed such systems, concludes that streaming everything is not currently affordable in bandwidth terms for the whole world fleet, but that triggered streaming — transmitting only when the aircraft's own systems detect an abnormal state — is affordable and would have located both of those aircraft immediately.",
          "Namba costs triggered streaming.",
        ),
        fromList(
          "summary_completion",
          RECORDER_BANK,
          "The so-called black box is painted ______ to be found in wreckage.",
          "orange",
          "It is painted that way so that searchers can see it among wreckage, and the name is a piece of journalistic shorthand that has outlived every attempt to correct it.",
          "The colour aids the search.",
        ),
        fromList(
          "summary_completion",
          RECORDER_BANK,
          "It must survive a ______ load of more than two tonnes.",
          "crush",
          "The memory unit must withstand an impact of several thousand times the force of gravity, a crush load of over two tonnes, penetration by a heavy spike dropped from three metres, an hour in a fire at 1,100 degrees Celsius, and immersion at the pressure found several kilometres down.",
          "The crush load is over two tonnes.",
        ),
        fromList(
          "summary_completion",
          RECORDER_BANK,
          "Early units recorded only five ______ onto metal foil.",
          "parameters",
          "Early units scratched five parameters onto metal foil: heading, altitude, airspeed, vertical acceleration and time.",
          "Five parameters were recorded.",
        ),
        fromList(
          "summary_completion",
          RECORDER_BANK,
          "The voice recorder once erased itself on a thirty-minute ______.",
          "loop",
          "For decades it recorded on a loop of thirty minutes, overwriting continuously, which meant that in an accident following a long emergency the crucial early conversation had already been erased.",
          "It ran on a thirty-minute loop.",
        ),
        fromList(
          "summary_completion",
          RECORDER_BANK,
          "An underwater ______ pulses for up to ninety days after immersion.",
          "beacon",
          "A recorder now carries an underwater locator beacon, which is activated by contact with water and emits an acoustic pulse for thirty days, extended to ninety on newer units.",
          "The beacon pulses after immersion.",
        ),
        mcq(
          "Which part of the recorder is armoured?",
          [
            "Only the memory unit",
            "The whole device including its electronics",
            "The beacon and the memory",
            "The outer casing alone",
          ],
          "Only the memory unit",
          "The electronics that do the recording are not protected; only the memory is, inside a stainless steel or titanium shell lined with insulating material.",
          "Only the memory is protected.",
        ),
        mcq(
          "Why was the thirty-minute loop a problem?",
          [
            "A long emergency was erased before the crash",
            "The tape wore out too quickly",
            "It could not record two crew members",
            "It stopped working under water",
          ],
          "A long emergency was erased before the crash",
          "For decades it recorded on a loop of thirty minutes, overwriting continuously, which meant that in an accident following a long emergency the crucial early conversation had already been erased.",
          "The early conversation had already been erased.",
        ),
        mcq(
          "What prompted serious interest in streaming flight data?",
          [
            "Two airliners lost over water",
            "A change in satellite pricing",
            "A failure of several beacons",
            "The extension of the voice recording",
          ],
          "Two airliners lost over water",
          "Aircraft already transmit maintenance data by satellite during flight, and after two airliners were lost over water with prolonged and expensive searches, proposals for continuous streaming of flight data became serious.",
          "Two losses over water prompted it.",
        ),
        mcq(
          "What does the writer identify as the harder thing to export?",
          [
            "The no-blame investigative institution",
            "The armoured memory unit",
            "The underwater beacon",
            "The two-hour recording standard",
          ],
          "The no-blame investigative institution",
          "Trains, ships and some road vehicles now carry recorders of their own, and the investigative culture that grew up around aviation — a no-blame inquiry whose only product is a public report and a set of recommendations — has spread much less readily than the hardware.",
          "The institution is the hard part.",
        ),
      ],
    },
    {
      key: "t87-p3-seat-belts",
      title: "The Strap That Had to Be Made Law",
      topic: "a device almost nobody used until they were compelled to",
      difficulty: 5,
      body: `A) In a collision the vehicle stops and the people inside do not. A body travelling at fifty kilometres an hour continues at that speed until something applies a force to it, and in an unrestrained crash that something is the steering wheel, the windscreen or the road. The physics has been understood since the beginning of motoring, and the earliest restraint patents date from the nineteenth century, before cars were fast enough for the problem to arise.

B) The decisive engineering came in 1959. Nils Bohlin, an engineer at Volvo who had previously designed ejection seats, produced the three-point belt: a single strap anchored at three points, restraining the pelvis and the upper body together, and fastenable with one hand. Earlier lap belts held the hips and allowed the torso to fold forward, which in severe crashes produced injuries of its own, some of them to the spine and the abdomen rather than the head. Bohlin's design was effective, cheap, and required no skill to use. His employer took out a patent and then made it freely available to other manufacturers, on the stated grounds that its value to safety exceeded its value as property.

C) Availability changed almost nothing. Through the 1960s belts were fitted to more and more cars and worn by a small minority of the people sitting in front of them. Surveys in several countries put voluntary wearing rates between ten and thirty per cent, and the figure was lowest among young men driving alone at night, who were also the group most likely to be in a serious collision. The reasons given were consistent and are still heard: discomfort, the creasing of clothes, short journeys, the belief that one would be better off thrown clear, and a general sense that the device implied an expectation of crashing.

D) The first compulsory-wearing law was passed in the Australian state of Victoria in 1970, thirteen years after belts had begun to appear in showrooms there. It was strongly opposed, and it worked: deaths among front-seat occupants fell sharply and immediately. Other jurisdictions followed over the next fifteen years, generally against the same objections, and generally with the same result. Britain legislated for front seats in 1983, having debated it repeatedly since the 1970s, and for rear seats only much later, by which time the evidence for the front seats had been unambiguous for a decade.

E) The pattern is the standard one for a safety measure whose cost falls on the user and whose benefit is invisible. Each individual journey without a belt is almost certainly harmless; the benefit is statistical and appears only across a population and a long period; and there is no moment at which a driver experiences the belt working. A device with those properties will not be adopted voluntarily at anything like the rate that would minimise harm, whatever information campaigns are run, and the history of belt-wearing is now used as the reference case when this argument is made about something else.

F) One objection deserves to be taken seriously rather than dismissed. Some economists argued that making drivers feel safer would make them drive less carefully, offsetting part of the gain and possibly shifting harm onto pedestrians and cyclists, who get no protection from the belt. The mechanism is real and has been found in other contexts. The empirical question is the size of the offset, and the weight of evidence is that it is small relative to the direct effect: occupant deaths fell far more than any plausible increase in risk to others, and total road deaths fell. The argument was worth making and it lost on the numbers.

G) What followed is instructive. Compliance in most countries with enforced laws now runs above ninety per cent, and wearing a belt has become a habit performed without deliberation, which is the condition under which safety measures actually work. A generation has grown up reaching for the strap on sitting down, and the objections of the 1970s are no longer even intelligible to them. Airbags, arriving later, were designed to supplement belts and not to replace them, and are dangerous to an unbelted occupant. The sequence — a cheap effective device, decades of availability without uptake, a contested law, rapid compliance, and then a norm nobody thinks about — recurs often enough that it is worth recognising while it is happening rather than afterwards.`,
      questions: [
        fromList(
          "matching_information",
          BELT_PARAGRAPHS,
          "a measured objection that the writer says lost on the evidence",
          "F",
          "The argument was worth making and it lost on the numbers.",
          "Paragraph F weighs and rejects the offsetting argument.",
        ),
        fromList(
          "matching_information",
          BELT_PARAGRAPHS,
          "the reasons people gave for not wearing a belt",
          "C",
          "The reasons given were consistent and are still heard: discomfort, the creasing of clothes, short journeys, the belief that one would be better off thrown clear, and a general sense that the device implied an expectation of crashing.",
          "Paragraph C lists the stated reasons.",
        ),
        fromList(
          "matching_information",
          BELT_PARAGRAPHS,
          "a company choosing not to profit from a patent",
          "B",
          "His employer took out a patent and then made it freely available to other manufacturers, on the stated grounds that its value to safety exceeded its value as property.",
          "Paragraph B describes the released patent.",
        ),
        fromList(
          "matching_information",
          BELT_PARAGRAPHS,
          "why an individual has no experience of the device working",
          "E",
          "Each individual journey without a belt is almost certainly harmless; the benefit is statistical and appears only across a population and a long period; and there is no moment at which a driver experiences the belt working.",
          "Paragraph E explains the invisibility of the benefit.",
        ),
        fromList(
          "matching_information",
          BELT_PARAGRAPHS,
          "an early patent filed before the danger existed",
          "A",
          "The physics has been understood since the beginning of motoring, and the earliest restraint patents date from the nineteenth century, before cars were fast enough for the problem to arise.",
          "Paragraph A dates the earliest patents.",
        ),
        ynng(
          "The writer thinks information campaigns could have achieved what the law achieved.",
          "NO",
          "A device with those properties will not be adopted voluntarily at anything like the rate that would minimise harm, whatever information campaigns are run, and the history of belt-wearing is now used as the reference case when this argument is made about something else.",
          "Campaigns would not have been enough.",
        ),
        ynng(
          "The writer regards the risk-compensation argument as worth examining.",
          "YES",
          "One objection deserves to be taken seriously rather than dismissed.",
          "It 'deserves to be taken seriously'.",
        ),
        ynng(
          "The writer believes the delay over rear seat belts was justified by the evidence.",
          "NO",
          "Britain legislated for front seats in 1983, having debated it repeatedly since the 1970s, and for rear seats only much later, by which time the evidence for the front seats had been unambiguous for a decade.",
          "The evidence had been unambiguous throughout the delay.",
        ),
        ynng(
          "The writer thinks the belt story is a useful template for recognising similar cases early.",
          "YES",
          "The sequence — a cheap effective device, decades of availability without uptake, a contested law, rapid compliance, and then a norm nobody thinks about — recurs often enough that it is worth recognising while it is happening rather than afterwards.",
          "It is 'worth recognising while it is happening'.",
        ),
        fromList(
          "matching_sentence_endings",
          BELT_ENDINGS,
          "An unrestrained passenger strikes the interior hard,",
          "because a body goes on travelling at the speed the car was doing.",
          "A body travelling at fifty kilometres an hour continues at that speed until something applies a force to it, and in an unrestrained crash that something is the steering wheel, the windscreen or the road.",
          "The body keeps the road speed.",
        ),
        fromList(
          "matching_sentence_endings",
          BELT_ENDINGS,
          "The three-point design spread to every manufacturer,",
          "because its inventor's employer judged safety to outweigh ownership.",
          "Bohlin's design was effective, cheap, and required no skill to use.",
          "The design was released rather than licensed.",
        ),
        fromList(
          "matching_sentence_endings",
          BELT_ENDINGS,
          "Most people fitted with a belt did not use it,",
          "since voluntary wearing stayed between ten and thirty per cent for years.",
          "Surveys in several countries put voluntary wearing rates between ten and thirty per cent.",
          "Voluntary wearing stayed very low.",
        ),
        fromList(
          "matching_sentence_endings",
          BELT_ENDINGS,
          "Compulsion produced an immediate fall in deaths,",
          "although voluntary fitting had already been available for a decade.",
          "It was strongly opposed, and it worked: deaths among front-seat occupants fell sharply and immediately.",
          "The law, not the device, changed the numbers.",
        ),
        fromList(
          "matching_sentence_endings",
          BELT_ENDINGS,
          "Some economists predicted part of the gain would be lost,",
          "because drivers who feel safer may take slightly greater risks.",
          "Some economists argued that making drivers feel safer would make them drive less carefully, offsetting part of the gain and possibly shifting harm onto pedestrians and cyclists, who get no protection from the belt.",
          "Feeling safer may reduce care.",
        ),
      ],
    },
  ],
};
