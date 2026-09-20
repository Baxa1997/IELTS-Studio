import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · linguistics · notes box ------------------------------------

const WHISTLE_NOTES = {
  title: "Why a whistle travels so far",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · marine biosecurity · people and a word bank ---------------

const BALLAST_PEOPLE = ["Ingrid Sørlie", "Kwame Adjei", "Lucia Ferraro", "Noor Rahimi"];
const BALLAST_BANK = [
  "stone",
  "larvae",
  "exchange",
  "filtration",
  "biofouling",
  "dormant",
  "convention",
  "predators",
  "sediment",
];

// ---- Passage 3 · waste policy · lettered paragraphs ------------------------

const WASTE_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const WASTE_ENDINGS = [
  "because the metal loses nothing and the energy saving is very large.",
  "although the material descends through grades and eventually leaves the system.",
  "since carrying a heavy material a long way consumes much of the benefit.",
  "because the receiving capacity in those countries had never existed.",
  "which the writer regards as the question the ritual has displaced.",
  "even though the yield from mixed waste has fallen short of every projection.",
  "because recycled feedstock competes with virgin plastic priced off oil.",
];

export const TEST_72: CuratedTest = {
  key: "full-test-72",
  targetBand: 6,
  passages: [
    {
      key: "t72-p1-whistled-languages",
      title: "Talking Across a Valley",
      topic: "the places where people hold conversations by whistling their own language",
      difficulty: 5,
      body: `In a few places in the world, people hold conversations by whistling. It is not a code, like Morse, in which each letter has an agreed signal. It is the local spoken language, whistled, and a person who does not speak that language cannot understand the whistling either.

The practice is found in mountainous and heavily wooded places: in a village in northern Turkey, on the island of La Gomera in the Canaries, among the Hmong of southeast Asia, in parts of the Amazon and in the Atlas Mountains. What these places have in common is terrain that makes ordinary travel slow and ordinary speech useless at a distance. A shout carries perhaps two hundred metres across a valley. A whistle carries several kilometres.

The reason is physical. A shout contains a wide range of frequencies, and the higher ones are absorbed by air and scattered by leaves and rock far more than the lower ones, so a distant shout arrives as a muddle. A whistle puts almost all of its energy into a single frequency, usually between one and four kilohertz, which happens to be close to the range in which human hearing is most sensitive. The result is a sound that is not loud but is remarkably hard to lose.

What has to be sacrificed is most of the information. Speech carries meaning in two layers at once: the melody of the voice, and the much more detailed pattern of resonances produced by the tongue, lips and jaw that distinguishes one vowel or consonant from another. A whistle can reproduce the melody and almost nothing of the detail. The whistler is therefore working with a small fraction of what speech normally contains.

How that fraction is chosen depends on the language being whistled. In a language where the pitch of a syllable changes its meaning, the job is comparatively easy: the whistle reproduces the pitch pattern directly, which is why whistled forms of such languages are often the most fluent. In a language without that feature, the whistler encodes the vowels as pitch levels — a high whistle for one vowel, a lower one for another — and marks the consonants with breaks, jumps and changes in loudness.

Understanding the result requires filling in a great deal from context. Studies of Silbo, the whistled form of Spanish used on La Gomera, find that experienced listeners identify isolated whistled words correctly about seventy per cent of the time, and that the figure rises sharply for a whole sentence, because the surrounding words remove most of the possibilities. This is not unlike an ordinary telephone conversation, in which a great deal of the acoustic detail is lost and almost nothing is misunderstood.

The uses are practical. Shepherds coordinate; farmers pass news between terraces; a message can be relayed across a valley faster than a person can walk down one side and up the other. In the Turkish village the whistling carried announcements — a death, an invitation, a request for help with a harvest — and had a recognised etiquette about who could whistle to whom.

Brain imaging has produced one finding worth noting. When a person who knows a whistled language listens to it, both hemispheres of the brain are engaged, rather than mainly the left one, which is what happens with ordinary speech. The pattern resembles the way musical melody is handled. The interpretation usually given is that the brain uses whatever machinery suits the signal, and that the division of labour observed for speech is a consequence of the kind of signal speech is, not a fixed arrangement.

Almost all of these practices are disappearing, and the cause is not quite what people assume. Mobile telephones are frequently blamed, and the timing fits, but the decline had already begun: roads, schooling in a national language and the movement of young people to cities removed both the need and the community of speakers. The whistling survives where it has been deliberately taught. Silbo was made part of the school curriculum on La Gomera in 1999, after the number of competent whistlers had fallen very low, and the number has risen since.

There is an argument for recording them that does not depend on sentiment. A whistled language is a natural experiment in how little of a speech signal a listener actually needs. Each one shows a different solution to the same problem of compression, arrived at by people who were not trying to demonstrate anything, and once the last fluent whistler of a particular language stops, that solution is not recoverable from a recording alone.`,
      questions: [
        tfng(
          "Whistled speech is a code in which every letter has its own signal.",
          "FALSE",
          "It is not a code, like Morse, in which each letter has an agreed signal.",
          "It is 'not a code, like Morse'.",
        ),
        tfng(
          "A whistle can be heard much further away than a shout.",
          "TRUE",
          "A whistle carries several kilometres.",
          "A whistle carries kilometres, a shout metres.",
        ),
        tfng(
          "High frequencies are lost over distance more than low ones.",
          "TRUE",
          "A shout contains a wide range of frequencies, and the higher ones are absorbed by air and scattered by leaves and rock far more than the lower ones, so a distant shout arrives as a muddle.",
          "The higher ones are absorbed 'far more'.",
        ),
        tfng(
          "Whistling preserves most of the detail of ordinary speech.",
          "FALSE",
          "A whistle can reproduce the melody and almost nothing of the detail.",
          "It carries 'almost nothing of the detail'.",
        ),
        tfng(
          "Whistled words heard on their own are understood almost perfectly.",
          "FALSE",
          "Studies of Silbo, the whistled form of Spanish used on La Gomera, find that experienced listeners identify isolated whistled words correctly about seventy per cent of the time, and that the figure rises sharply for a whole sentence, because the surrounding words remove most of the possibilities.",
          "Isolated words are right about seventy per cent of the time.",
        ),
        tfng(
          "Listening to a whistled language involves both halves of the brain.",
          "TRUE",
          "When a person who knows a whistled language listens to it, both hemispheres of the brain are engaged, rather than mainly the left one, which is what happens with ordinary speech.",
          "'Both hemispheres of the brain are engaged'.",
        ),
        tfng(
          "Women in the Turkish village were not allowed to whistle.",
          "NOT GIVEN",
          "",
          "An etiquette is mentioned but its content is never described.",
        ),
        noteLine(
          WHISTLE_NOTES,
          null,
          "A shout arrives at a distance as a ______",
          "muddle",
          "A shout contains a wide range of frequencies, and the higher ones are absorbed by air and scattered by leaves and rock far more than the lower ones, so a distant shout arrives as a muddle.",
          "A distant shout 'arrives as a muddle'.",
          { before: [{ text: "The advantage is entirely physical:", indent: 0 }] },
        ),
        noteLine(
          WHISTLE_NOTES,
          null,
          "A whistle concentrates its energy at one ______",
          "frequency",
          "A whistle puts almost all of its energy into a single frequency, usually between one and four kilohertz, which happens to be close to the range in which human hearing is most sensitive.",
          "It uses 'a single frequency'.",
        ),
        noteLine(
          WHISTLE_NOTES,
          null,
          "That band is where human ______ is most sensitive",
          "hearing",
          "A whistle puts almost all of its energy into a single frequency, usually between one and four kilohertz, which happens to be close to the range in which human hearing is most sensitive.",
          "It is where 'human hearing is most sensitive'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Consonants are marked with breaks, jumps and changes in ______.",
          "loudness",
          "In a language without that feature, the whistler encodes the vowels as pitch levels — a high whistle for one vowel, a lower one for another — and marks the consonants with breaks, jumps and changes in loudness.",
          "Consonants use 'changes in loudness'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Silbo was added to the school ______ on La Gomera in 1999.",
          "curriculum",
          "Silbo was made part of the school curriculum on La Gomera in 1999, after the number of competent whistlers had fallen very low, and the number has risen since.",
          "It joined 'the school curriculum'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Each whistled language is a separate answer to the problem of ______.",
          "compression",
          "Each one shows a different solution to the same problem of compression, arrived at by people who were not trying to demonstrate anything, and once the last fluent whistler of a particular language stops, that solution is not recoverable from a recording alone.",
          "They solve 'the same problem of compression'.",
        ),
      ],
    },
    {
      key: "t72-p2-ballast-water",
      title: "The Species That Travel in the Tanks",
      topic: "how the water a ship carries for stability moves organisms between oceans",
      difficulty: 6,
      body: `A ship that is not carrying cargo is dangerously light. It rides high, its propeller comes out of the water and it becomes unstable, so an empty ship takes on weight to compensate. For most of the history of shipping that weight was solid — stone, gravel or sand, shovelled in at one port and shovelled out at another. Since the late nineteenth century it has been water, pumped into tanks and pumped out again, which is cheaper, faster and needs no labour.

The unintended consequence is that a ship fills its tanks in one harbour and empties them in another, and whatever was living in the first harbour arrives in the second. A large vessel may carry many thousands of tonnes of water. Ingrid Sørlie, who samples ballast tanks, reports that a single tank routinely contains larvae, eggs, spores and cysts of dozens of species, most of them microscopic and many not identifiable even by specialists; the tank is a functioning ecosystem with its own predators.

The great majority of arrivals die, and this is central to understanding the problem. A species released into unsuitable water simply fails, and most do. The difficulty is that shipping delivers the same organisms repeatedly, thousands of times a year, so an event with a very low probability becomes near-certain given enough attempts. Kwame Adjei, who models establishment risk, makes the point that reducing the number of organisms in a discharge is worthwhile even without eliminating them, because the relationship between the number arriving and the chance of a population establishing is steep at the low end.

The consequences, when they occur, are not subtle. A comb jelly taken from the western Atlantic to the Black Sea in the 1980s multiplied in the absence of predators, consumed the eggs and larvae of fish, and contributed to the collapse of a fishery that had supported a large fleet. A freshwater mussel established in the North American Great Lakes blocks intake pipes so comprehensively that power stations and water treatment plants spend heavily on removing it every year. A toxic alga transported to Australian waters closed shellfish farms.

Solutions have been argued over for thirty years, and the first one adopted was crude. A ship could be required to exchange its ballast in mid-ocean, pumping out coastal water and taking in deep water, on the reasoning that oceanic organisms rarely establish in a harbour and coastal ones rarely survive the open sea. Lucia Ferraro, who has evaluated the practice, notes that it removes perhaps eighty or ninety per cent of the organisms in the best case, is much less effective in some tank designs, and requires the master to pump water in heavy weather, which is a safety decision nobody wants to make under commercial pressure.

Treatment has replaced it. An international convention that came into force in 2017 requires ships to reduce living organisms in discharged ballast below a numerical standard, and most installed systems combine filtration with either ultraviolet light or the injection of an oxidising chemical. Noor Rahimi, who works on the verification of these systems, stresses that the difficulty is not building them but proving they work: a treated discharge has to be tested for living organisms in specific size classes, most methods cannot reliably distinguish a dead organism from a dormant one, and a system that passed its approval in temperate water may perform quite differently in the sediment-laden water of a river port.

Ballast is also not the only pathway, and the attention it has received partly reflects the fact that it is the easiest to regulate. Organisms growing on the outside of a hull — biofouling — are a comparable or larger source, and there is no equivalent binding standard, because cleaning a hull releases exactly what it removes and many ports forbid doing it in their waters. Anchors, chains and sea chests carry material too.

What makes the whole problem difficult is the asymmetry between cost and benefit in time. A treatment system costs a shipowner one to five million dollars to install, now, and prevents an invasion that would have occurred at some unknown point and would have cost somebody else a great deal. Nothing in the market connects the two, which is why this required a convention rather than a commercial decision, and why it took three decades to write.`,
      questions: [
        fromList(
          "matching_features",
          BALLAST_PEOPLE,
          "One tank holds dozens of species, most of them too small to see.",
          "Ingrid Sørlie",
          "Ingrid Sørlie, who samples ballast tanks, reports that a single tank routinely contains larvae, eggs, spores and cysts of dozens of species, most of them microscopic and many not identifiable even by specialists; the tank is a functioning ecosystem with its own predators.",
          "Sørlie samples what the tanks hold.",
        ),
        fromList(
          "matching_features",
          BALLAST_PEOPLE,
          "Cutting the numbers is worth doing even short of eliminating them.",
          "Kwame Adjei",
          "Kwame Adjei, who models establishment risk, makes the point that reducing the number of organisms in a discharge is worthwhile even without eliminating them, because the relationship between the number arriving and the chance of a population establishing is steep at the low end.",
          "Adjei models the establishment curve.",
        ),
        fromList(
          "matching_features",
          BALLAST_PEOPLE,
          "One measure puts a safety judgement under commercial pressure.",
          "Lucia Ferraro",
          "Lucia Ferraro, who has evaluated the practice, notes that it removes perhaps eighty or ninety per cent of the organisms in the best case, is much less effective in some tank designs, and requires the master to pump water in heavy weather, which is a safety decision nobody wants to make under commercial pressure.",
          "Ferraro identifies the safety problem.",
        ),
        fromList(
          "matching_features",
          BALLAST_PEOPLE,
          "Demonstrating that a system works is harder than building one.",
          "Noor Rahimi",
          "Noor Rahimi, who works on the verification of these systems, stresses that the difficulty is not building them but proving they work: a treated discharge has to be tested for living organisms in specific size classes, most methods cannot reliably distinguish a dead organism from a dormant one, and a system that passed its approval in temperate water may perform quite differently in the sediment-laden water of a river port.",
          "Rahimi works on verification.",
        ),
        fromList(
          "summary_completion",
          BALLAST_BANK,
          "Ships once carried solid ballast such as ______ or gravel.",
          "stone",
          "For most of the history of shipping that weight was solid — stone, gravel or sand, shovelled in at one port and shovelled out at another.",
          "Stone, gravel or sand was used.",
        ),
        fromList(
          "summary_completion",
          BALLAST_BANK,
          "The tanks carry eggs, spores and ______ of many species.",
          "larvae",
          "Ingrid Sørlie, who samples ballast tanks, reports that a single tank routinely contains larvae, eggs, spores and cysts of dozens of species, most of them microscopic and many not identifiable even by specialists; the tank is a functioning ecosystem with its own predators.",
          "Larvae are among the contents.",
        ),
        fromList(
          "summary_completion",
          BALLAST_BANK,
          "The first rule required ships to ______ their ballast at sea.",
          "exchange",
          "A ship could be required to exchange its ballast in mid-ocean, pumping out coastal water and taking in deep water, on the reasoning that oceanic organisms rarely establish in a harbour and coastal ones rarely survive the open sea.",
          "They had to exchange it mid-ocean.",
        ),
        fromList(
          "summary_completion",
          BALLAST_BANK,
          "Most treatment systems pair ______ with light or a chemical.",
          "filtration",
          "An international convention that came into force in 2017 requires ships to reduce living organisms in discharged ballast below a numerical standard, and most installed systems combine filtration with either ultraviolet light or the injection of an oxidising chemical.",
          "They combine filtration with one of two methods.",
        ),
        fromList(
          "summary_completion",
          BALLAST_BANK,
          "Growth on the hull, known as ______, is at least as large a route.",
          "biofouling",
          "Organisms growing on the outside of a hull — biofouling — are a comparable or larger source, and there is no equivalent binding standard, because cleaning a hull releases exactly what it removes and many ports forbid doing it in their waters.",
          "Biofouling is 'a comparable or larger source'.",
        ),
        mcq(
          "Why does a ship without cargo need ballast?",
          [
            "It becomes unstable and its propeller lifts clear",
            "It burns more fuel than a loaded ship",
            "Its empty holds would otherwise flood",
            "It cannot be steered inside a harbour",
          ],
          "It becomes unstable and its propeller lifts clear",
          "It rides high, its propeller comes out of the water and it becomes unstable, so an empty ship takes on weight to compensate.",
          "The propeller lifts out and the ship becomes unstable.",
        ),
        mcq(
          "What did the comb jelly do in the Black Sea?",
          [
            "It ate the eggs and larvae of fish",
            "It blocked industrial intake pipes",
            "It closed the shellfish farms",
            "It displaced a native jellyfish",
          ],
          "It ate the eggs and larvae of fish",
          "A comb jelly taken from the western Atlantic to the Black Sea in the 1980s multiplied in the absence of predators, consumed the eggs and larvae of fish, and contributed to the collapse of a fishery that had supported a large fleet.",
          "It 'consumed the eggs and larvae of fish'.",
        ),
        mcq(
          "Why is testing a treated discharge difficult?",
          [
            "A dead organism is hard to tell from a dormant one",
            "Samples cannot be taken while at sea",
            "No numerical standard has been written",
            "Ultraviolet light destroys the evidence",
          ],
          "A dead organism is hard to tell from a dormant one",
          "Noor Rahimi, who works on the verification of these systems, stresses that the difficulty is not building them but proving they work: a treated discharge has to be tested for living organisms in specific size classes, most methods cannot reliably distinguish a dead organism from a dormant one, and a system that passed its approval in temperate water may perform quite differently in the sediment-laden water of a river port.",
          "Dead and dormant cannot be separated reliably.",
        ),
        mcq(
          "Why did this problem require an international agreement?",
          [
            "The cost and the benefit fall on different parties",
            "No treatment technology existed at all",
            "Shipowners could not agree on a standard",
            "Ports refused to measure any discharges",
          ],
          "The cost and the benefit fall on different parties",
          "Nothing in the market connects the two, which is why this required a convention rather than a commercial decision, and why it took three decades to write.",
          "'Nothing in the market connects the two'.",
        ),
      ],
    },
    {
      key: "t72-p3-recycling",
      title: "What Goes in the Bin",
      topic: "how much household recycling achieves, material by material",
      difficulty: 7,
      body: `A) Household recycling occupies a strange position in public argument: it is the environmental action most people perform, it is defended with unusual warmth, and the evidence about it is more mixed than almost any of its defenders acknowledge. The confusion arises because recycling is not one activity. Aluminium, paper, glass and mixed plastic have almost nothing in common except the bin they are put into. Each has its own chemistry, its own market and its own energy arithmetic, and a claim that holds for one of them is usually false for another.

B) The clear cases should be stated first, because a general scepticism would be wrong. Recycling aluminium uses about five per cent of the energy required to smelt it from ore, the metal loses nothing in the process, and it can be done indefinitely. Steel is similar. Paper and cardboard are worthwhile with qualifications: the fibres shorten each time, so the material descends through grades and eventually leaves the system, but each pass displaces new pulp. For these materials there is no serious argument, and the collection pays for itself without any appeal to virtue.

C) Glass is where the arithmetic starts to turn. It is endlessly recyclable in principle and the furnace saving is real but modest, and glass is heavy, so the transport to a plant can consume a substantial share of the benefit. Where a bottling plant is nearby the case is good; where the collected material is carried five hundred kilometres to be melted it is thin, and in several places collected glass has been used as road aggregate, which is a form of disposal described as recycling. The distinction between using a material again and finding somewhere to put it matters, and the published figures rarely draw it.

D) Plastic is the case that has damaged public confidence, and deservedly. Of the plastic ever produced, less than a tenth has been recycled. The reasons are structural rather than a failure of effort: there are many incompatible polymers that must be separated to be useful; the material degrades with each cycle, so a bottle cannot become a bottle indefinitely; recycled feedstock competes with virgin plastic whose price follows oil and is frequently lower; and food contact rules restrict where the output may be used. For two decades the shortfall was concealed by export. Material collected in Europe and North America was shipped to countries with lower labour costs and counted as recycled at the point of loading, and when China stopped accepting it in 2018 the accounting collapsed, because the receiving capacity had never existed.

E) The industry response has been to promote chemical recycling, breaking the polymer back into its components. I am not persuaded that this is close. The processes are energy-intensive, most plants announced have not reached the output promised, and the yield of usable material from mixed waste has been consistently below projection. It may work eventually. It is currently being used to justify decisions about packaging today on the basis of a capability that does not exist.

F) What I think is the real objection to how recycling is discussed is that it has displaced the question that matters. A recycled bottle is better than a buried one and considerably worse than a bottle that was never manufactured, and the order of the familiar three words — reduce, reuse, recycle — records exactly that ranking. Recycling is the last and weakest of the three, and it is the only one that has become a civic ritual, because it is the only one requiring no reduction in consumption and threatening nobody's revenue. A container industry that funds recycling campaigns while opposing deposit return schemes and refill systems is behaving perfectly rationally.

G) None of which is an argument for stopping. Sorting waste at home costs a household almost nothing, the metals and paper alone justify the collection, and a population in the habit of separating materials is a precondition for anything better. But it should be described accurately: it is a partial remedy for one end of the problem, its effectiveness varies by a factor of twenty between materials, and presenting it as the answer has allowed twenty years of rising plastic production to proceed with the public under the impression that the matter was being handled.`,
      questions: [
        fromList(
          "matching_information",
          WASTE_PARAGRAPHS,
          "a figure for how much of all plastic has ever been reprocessed",
          "D",
          "Of the plastic ever produced, less than a tenth has been recycled.",
          "Paragraph D gives the proportion.",
        ),
        fromList(
          "matching_information",
          WASTE_PARAGRAPHS,
          "a material whose weight can cancel much of the saving",
          "C",
          "It is endlessly recyclable in principle and the furnace saving is real but modest, and glass is heavy, so the transport to a plant can consume a substantial share of the benefit.",
          "Paragraph C weighs glass against transport.",
        ),
        fromList(
          "matching_information",
          WASTE_PARAGRAPHS,
          "why one metal can be reprocessed without any limit",
          "B",
          "Recycling aluminium uses about five per cent of the energy required to smelt it from ore, the metal loses nothing in the process, and it can be done indefinitely.",
          "Paragraph B makes the case for aluminium.",
        ),
        fromList(
          "matching_information",
          WASTE_PARAGRAPHS,
          "why an industry funds one measure while opposing another",
          "F",
          "A container industry that funds recycling campaigns while opposing deposit return schemes and refill systems is behaving perfectly rationally.",
          "Paragraph F explains the industry's incentives.",
        ),
        fromList(
          "matching_information",
          WASTE_PARAGRAPHS,
          "a claim that a promoted technology is being counted before it exists",
          "E",
          "It is currently being used to justify decisions about packaging today on the basis of a capability that does not exist.",
          "Paragraph E rejects chemical recycling as a present answer.",
        ),
        ynng(
          "The writer thinks a general scepticism about recycling is justified.",
          "NO",
          "The clear cases should be stated first, because a general scepticism would be wrong.",
          "Such scepticism 'would be wrong'.",
        ),
        ynng(
          "The writer accepts that paper recycling is worthwhile despite its limits.",
          "YES",
          "Paper and cardboard are worthwhile with qualifications: the fibres shorten each time, so the material descends through grades and eventually leaves the system, but each pass displaces new pulp.",
          "They are 'worthwhile with qualifications'.",
        ),
        ynng(
          "The writer believes chemical recycling is close to working at scale.",
          "NO",
          "I am not persuaded that this is close.",
          "The writer is 'not persuaded that this is close'.",
        ),
        ynng(
          "The writer thinks households should carry on separating their waste.",
          "YES",
          "Sorting waste at home costs a household almost nothing, the metals and paper alone justify the collection, and a population in the habit of separating materials is a precondition for anything better.",
          "The metals and paper 'justify the collection'.",
        ),
        fromList(
          "matching_sentence_endings",
          WASTE_ENDINGS,
          "The case for reprocessing aluminium is not seriously disputed,",
          "because the metal loses nothing and the energy saving is very large.",
          "Recycling aluminium uses about five per cent of the energy required to smelt it from ore, the metal loses nothing in the process, and it can be done indefinitely.",
          "Five per cent of the energy, and no loss.",
        ),
        fromList(
          "matching_sentence_endings",
          WASTE_ENDINGS,
          "Glass recycling depends on how far the material must travel,",
          "since carrying a heavy material a long way consumes much of the benefit.",
          "It is endlessly recyclable in principle and the furnace saving is real but modest, and glass is heavy, so the transport to a plant can consume a substantial share of the benefit.",
          "Transport eats the saving.",
        ),
        fromList(
          "matching_sentence_endings",
          WASTE_ENDINGS,
          "Reprocessed plastic has never competed on price,",
          "because recycled feedstock competes with virgin plastic priced off oil.",
          "The reasons are structural rather than a failure of effort: there are many incompatible polymers that must be separated to be useful; the material degrades with each cycle, so a bottle cannot become a bottle indefinitely; recycled feedstock competes with virgin plastic whose price follows oil and is frequently lower; and food contact rules restrict where the output may be used.",
          "Virgin plastic is frequently cheaper.",
        ),
        fromList(
          "matching_sentence_endings",
          WASTE_ENDINGS,
          "The 2018 refusal of imports exposed an accounting fiction,",
          "because the receiving capacity in those countries had never existed.",
          "Material collected in Europe and North America was shipped to countries with lower labour costs and counted as recycled at the point of loading, and when China stopped accepting it in 2018 the accounting collapsed, because the receiving capacity had never existed.",
          "The capacity had never been there.",
        ),
        fromList(
          "matching_sentence_endings",
          WASTE_ENDINGS,
          "Reducing consumption ranks above recycling and is discussed far less,",
          "which the writer regards as the question the ritual has displaced.",
          "Recycling is the last and weakest of the three, and it is the only one that has become a civic ritual, because it is the only one requiring no reduction in consumption and threatening nobody's revenue.",
          "Only the weakest of the three became a ritual.",
        ),
      ],
    },
  ],
};
