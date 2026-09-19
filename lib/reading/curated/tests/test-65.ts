import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · archaeology of domestication · notes box ------------------

const HORSE_NOTES = {
  title: "Evidence of riding and harness",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · frozen ground · people and a word bank --------------------

const FROST_PEOPLE = ["Katya Yefimova", "Lars Brekke", "Emmanuel Dube", "Sarah Keighley"];
const FROST_BANK = [
  "thaw",
  "methane",
  "piles",
  "carbon",
  "subsidence",
  "insulation",
  "ice",
  "microbes",
  "roads",
];

// ---- Passage 3 · sport and technology · lettered paragraphs ----------------

const SPORT_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const SPORT_ENDINGS = [
  "because the rule was written before anybody imagined the material existing.",
  "although the governing body had approved the design before the season began.",
  "which is why records set in one decade cannot be compared with another.",
  "even though every competitor had equal access to the equipment.",
  "because a line has to be drawn somewhere and no line is principled.",
  "which the writer regards as the only honest way to run the argument.",
  "despite the objection that the advantage was available to anybody who paid.",
];

export const TEST_65: CuratedTest = {
  key: "full-test-65",
  targetBand: 7,
  passages: [
    {
      key: "t65-p1-horse-domestication",
      title: "The Animal That Changed the Distance",
      topic: "when and where horses were first ridden, and how we can tell",
      difficulty: 6,
      body: `Horses were hunted for meat across the Eurasian steppe for tens of thousands of years before anybody rode one. Establishing when the relationship changed has been unusually difficult, because the evidence that would settle it — a person on a horse — leaves almost nothing behind, and the bones of a ridden horse are not obviously different from the bones of a hunted one.

For two decades the leading candidate was a site in northern Kazakhstan occupied around 3500 BCE, where excavators found enormous quantities of horse bone, post-holes suggesting corrals, and pottery whose interior residues contained the fats of mare's milk. Milking is not something done to a wild animal. The case was strengthened by wear on the second premolars of some of the horses, of a kind produced by a bit held in the mouth.

That interpretation has been substantially revised. Genetic work published from 2021 onwards, drawing on hundreds of ancient horse genomes, established that the horses of that site are not the ancestors of modern domestic horses. They belong to a lineage whose closest living relatives are the Przewalski's horses of Mongolia — themselves now understood as feral descendants of those same animals rather than as the last truly wild horses. Something was being done with horses in Kazakhstan in 3500 BCE, but it was not the beginning of the lineage that carried people across continents.

The genomes point instead to the steppe north of the Black Sea and the Caspian, and to a date around 2200 BCE. From roughly that point a single lineage expands with extraordinary speed, replacing local horse populations across Eurasia within a few centuries, which is the genetic signature of a domesticated animal being carried by people who valued it. Two genes stand out among the changes selected for: one associated with docility and one affecting the strength of the back, which is what a ridden animal needs.

It is worth being clear about what the genetic evidence can and cannot date. A genome establishes when a lineage expanded and what was being selected for in it; it does not establish the moment somebody first sat on a horse, which may well have happened repeatedly, in several places, without leaving a population behind. Domestication in the sense that matters archaeologically is not a first event but a lineage that persisted, and those are different things that the popular accounts routinely merge.

A separate line of evidence concerns the riders. Skeletons from steppe burials show a recognisable pattern of changes — wear on the hip sockets, modification of the thigh bones, damage to the lower spine — consistent with long hours sitting astride a moving animal. The pattern is not unambiguous, since some of it can be produced by other activities, but where several markers appear together in the same skeleton the interpretation is reasonably secure, and skeletons of that kind are found from about the same period.

What followed is easier to document. The chariot appears in the archaeological record shortly afterwards, with spoked wheels that required real carpentry, and spreads rapidly across the Near East. Riding as a military technique took considerably longer to develop, because it requires a seat and control at speed that the earliest equipment did not provide; the stirrup, which transformed both, did not reach Europe until the early medieval period.

The consequences are hard to overstate and easy to misstate. A horse converts a journey of several days into one of several hours, which changes what a state can govern, what a raid can reach, and how far news and disease travel. But it is worth noticing that the animal was domesticated at least twice for different purposes — the donkey earlier, in a different region, for carrying loads — and that the horse's advantage lay specifically in speed rather than in strength or endurance, both of which oxen provided more cheaply.

The revision of the Kazakhstan case is worth dwelling on, because it is a clean example of a well-supported archaeological conclusion being overturned by a method that did not exist when it was formed. The bit wear was real, the milk residues were real, and the interpretation drawn from them was reasonable. What the genomes showed was that the animals concerned were a dead end, and no amount of further excavation at the site would have revealed it.`,
      questions: [
        tfng(
          "The bones of a ridden horse are easily distinguished from those of a wild one.",
          "FALSE",
          "Establishing when the relationship changed has been unusually difficult, because the evidence that would settle it — a person on a horse — leaves almost nothing behind, and the bones of a ridden horse are not obviously different from the bones of a hunted one.",
          "They are 'not obviously different'.",
        ),
        tfng(
          "Residues in pottery at the Kazakh site indicated that horses were milked.",
          "TRUE",
          "For two decades the leading candidate was a site in northern Kazakhstan occupied around 3500 BCE, where excavators found enormous quantities of horse bone, post-holes suggesting corrals, and pottery whose interior residues contained the fats of mare's milk.",
          "The residues held 'the fats of mare's milk'.",
        ),
        tfng(
          "The horses at that site were ancestors of today's domestic horses.",
          "FALSE",
          "Genetic work published from 2021 onwards, drawing on hundreds of ancient horse genomes, established that the horses of that site are not the ancestors of modern domestic horses.",
          "They 'are not the ancestors'.",
        ),
        tfng(
          "Przewalski's horses are now considered genuinely wild.",
          "FALSE",
          "They belong to a lineage whose closest living relatives are the Przewalski's horses of Mongolia — themselves now understood as feral descendants of those same animals rather than as the last truly wild horses.",
          "They are 'feral descendants'.",
        ),
        tfng(
          "The expansion of the domestic lineage happened slowly over millennia.",
          "FALSE",
          "From roughly that point a single lineage expands with extraordinary speed, replacing local horse populations across Eurasia within a few centuries, which is the genetic signature of a domesticated animal being carried by people who valued it.",
          "It spread 'within a few centuries'.",
        ),
        tfng(
          "Skeletal changes in riders can be caused by other activities too.",
          "TRUE",
          "The pattern is not unambiguous, since some of it can be produced by other activities, but where several markers appear together in the same skeleton the interpretation is reasonably secure, and skeletons of that kind are found from about the same period.",
          "'Some of it can be produced by other activities'.",
        ),
        tfng(
          "Oxen were more expensive than horses for pulling heavy loads.",
          "FALSE",
          "But it is worth noticing that the animal was domesticated at least twice for different purposes — the donkey earlier, in a different region, for carrying loads — and that the horse's advantage lay specifically in speed rather than in strength or endurance, both of which oxen provided more cheaply.",
          "Oxen 'provided more cheaply'.",
        ),
        noteLine(
          HORSE_NOTES,
          null,
          "Wear on the second ______ made by a bit in the mouth",
          "premolars",
          "The case was strengthened by wear on the second premolars of some of the horses, of a kind produced by a bit held in the mouth.",
          "The wear was on 'the second premolars'.",
        ),
        noteLine(
          HORSE_NOTES,
          null,
          "Selection for a stronger ______ in the domesticated lineage",
          "back",
          "Two genes stand out among the changes selected for: one associated with docility and one affecting the strength of the back, which is what a ridden animal needs.",
          "One gene affects 'the strength of the back'.",
          { before: [{ text: "Several independent lines point the same way:", indent: 0 }] },
        ),
        noteLine(
          HORSE_NOTES,
          null,
          "Damage to the lower ______ of people buried on the steppe",
          "spine",
          "Skeletons from steppe burials show a recognisable pattern of changes — wear on the hip sockets, modification of the thigh bones, damage to the lower spine — consistent with long hours sitting astride a moving animal.",
          "The list includes 'damage to the lower spine'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Post-holes at the Kazakh site were interpreted as ______.",
          "corrals",
          "For two decades the leading candidate was a site in northern Kazakhstan occupied around 3500 BCE, where excavators found enormous quantities of horse bone, post-holes suggesting corrals, and pottery whose interior residues contained the fats of mare's milk.",
          "The post-holes suggested corrals.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "One of the selected genes is associated with ______.",
          "docility",
          "Two genes stand out among the changes selected for: one associated with docility and one affecting the strength of the back, which is what a ridden animal needs.",
          "One is 'associated with docility'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The ______ did not arrive in Europe until the early medieval period.",
          "stirrup",
          "Riding as a military technique took considerably longer to develop, because it requires a seat and control at speed that the earliest equipment did not provide; the stirrup, which transformed both, did not reach Europe until the early medieval period.",
          "The stirrup arrived in the early medieval period.",
        ),
      ],
    },
    {
      key: "t65-p2-permafrost",
      title: "Building on Ground That Was Meant to Stay Frozen",
      topic: "what thawing does to the ground and to what stands on it",
      difficulty: 7,
      body: `Permafrost is ground that has remained below freezing for at least two consecutive years, and in much of the Arctic it has been frozen continuously for tens of thousands. It underlies roughly a sixth of the exposed land in the northern hemisphere. Above it sits the active layer, which thaws each summer and refreezes each winter, and which is where everything that grows does so.

The engineering fact that governs northern construction is that frozen ground is strong and thawed ground frequently is not. Much permafrost contains a great deal of ice — sometimes as scattered crystals, sometimes as massive wedges several metres across — and when that ice melts the volume it occupied becomes a void. The surface above collapses into it. The resulting ground is called thermokarst, and it is neither level nor able to carry a load.

Katya Yefimova, an engineer who works on northern infrastructure, explains that the standard solution is to keep the ground frozen rather than to build something strong enough to survive its thawing. Buildings are raised on piles driven deep into the permafrost, with an open ventilated space beneath the floor so that the building's own heat never reaches the ground. Where that is not possible, thermosyphons are used: sealed tubes containing a fluid that carries heat from the ground up to a radiator in the cold air above, working passively all winter and doing nothing in summer. Neither approach is exotic and both are well proven. Both assume that the permafrost they are anchored in will stay frozen.

That assumption is the one failing. Lars Brekke, who monitors borehole temperatures across northern Scandinavia and Siberia, reports warming at depth across essentially every site with a long record, with the largest increases in the coldest permafrost. Warming does not have to reach zero degrees to cause damage: a pile's grip depends on the ground being cold enough to hold it, and warming from minus eight to minus three substantially reduces the load it can carry without any thawing occurring at all. A large fuel tank collapse in the Russian Arctic in 2020, which released twenty thousand tonnes of diesel into a river system, was attributed to pile failure of exactly this kind.

The scale of what is built on this ground is not widely appreciated. Emmanuel Dube, who has surveyed Arctic infrastructure, counts several million people living on permafrost, along with the pipelines, airstrips, roads, mines and settlements that support them, and estimates that a substantial fraction of the built environment in the Russian Arctic sits on ground projected to become unsuitable within decades. Roads are the most visible failure — a road absorbs heat, conducts it downwards and thaws the ground beneath itself, so that northern highways develop the characteristic waves and sinkholes that require constant repair.

The second consequence is a feedback rather than an engineering problem. Permafrost holds an enormous quantity of organic carbon — plant material frozen before it could decay, estimated at roughly twice the carbon currently in the atmosphere. When it thaws, microbes resume work on material that has been unavailable to them for millennia, releasing carbon dioxide where there is oxygen and methane where there is not. Sarah Keighley, who models these emissions, is careful about the alarm they generate. The release is not a sudden event and the models do not predict one; it is a slow addition over centuries, significant in aggregate and impossible to stop once it is under way, which makes it a reason for urgency without being the catastrophe it is sometimes described as.

Adaptation is possible and expensive. Piles can be driven deeper, refrigeration can be added to foundations that were designed without it, roads can be rebuilt on insulating layers that stop the heat reaching the ground. All of it costs several times what the original construction did, and all of it has to be done in places with short building seasons and long supply lines.

There is a further complication that makes prediction difficult. Thaw does not proceed evenly downwards from the surface. Where ice wedges melt, the collapsed ground collects water, water conducts heat far better than air, and the thaw accelerates locally and abruptly. A landscape can be stable for decades and then reorganise itself in a single summer, which is very hard to represent in a model built on gradual change, and which is why field observations keep outrunning the projections.`,
      questions: [
        fromList(
          "matching_features",
          FROST_PEOPLE,
          "Construction aims to preserve the frozen state rather than resist thawing.",
          "Katya Yefimova",
          "Katya Yefimova, an engineer who works on northern infrastructure, explains that the standard solution is to keep the ground frozen rather than to build something strong enough to survive its thawing.",
          "Yefimova states the design principle.",
        ),
        fromList(
          "matching_features",
          FROST_PEOPLE,
          "Warming that stops short of melting can still weaken foundations.",
          "Lars Brekke",
          "Warming does not have to reach zero degrees to cause damage: a pile's grip depends on the ground being cold enough to hold it, and warming from minus eight to minus three substantially reduces the load it can carry without any thawing occurring at all.",
          "Brekke explains the sub-zero weakening.",
        ),
        fromList(
          "matching_features",
          FROST_PEOPLE,
          "A large amount of existing infrastructure is on ground that will not hold it.",
          "Emmanuel Dube",
          "Emmanuel Dube, who has surveyed Arctic infrastructure, counts several million people living on permafrost, along with the pipelines, airstrips, roads, mines and settlements that support them, and estimates that a substantial fraction of the built environment in the Russian Arctic sits on ground projected to become unsuitable within decades.",
          "Dube surveys what is built on it.",
        ),
        fromList(
          "matching_features",
          FROST_PEOPLE,
          "The emissions are serious but not the sudden event they are portrayed as.",
          "Sarah Keighley",
          "The release is not a sudden event and the models do not predict one; it is a slow addition over centuries, significant in aggregate and impossible to stop once it is under way, which makes it a reason for urgency without being the catastrophe it is sometimes described as.",
          "Keighley corrects the sudden-release picture.",
        ),
        fromList(
          "summary_completion",
          FROST_BANK,
          "Melting ______ within the ground leaves voids that the surface falls into.",
          "ice",
          "Much permafrost contains a great deal of ice — sometimes as scattered crystals, sometimes as massive wedges several metres across — and when that ice melts the volume it occupied becomes a void.",
          "Melting ice leaves a void.",
        ),
        fromList(
          "summary_completion",
          FROST_BANK,
          "Buildings are held up on ______ driven into the frozen ground.",
          "piles",
          "Buildings are raised on piles driven deep into the permafrost, with an open ventilated space beneath the floor so that the building's own heat never reaches the ground.",
          "They are 'raised on piles'.",
        ),
        fromList(
          "summary_completion",
          FROST_BANK,
          "Highways suffer badly because a road conducts heat down and causes ______.",
          "subsidence",
          "Roads are the most visible failure — a road absorbs heat, conducts it downwards and thaws the ground beneath itself, so that northern highways develop the characteristic waves and sinkholes that require constant repair.",
          "The result is waves and sinkholes.",
        ),
        fromList(
          "summary_completion",
          FROST_BANK,
          "Thawing lets ______ resume work on material frozen for millennia.",
          "microbes",
          "When it thaws, microbes resume work on material that has been unavailable to them for millennia, releasing carbon dioxide where there is oxygen and methane where there is not.",
          "'Microbes resume work'.",
        ),
        fromList(
          "summary_completion",
          FROST_BANK,
          "Where there is no oxygen they release ______ instead of carbon dioxide.",
          "methane",
          "When it thaws, microbes resume work on material that has been unavailable to them for millennia, releasing carbon dioxide where there is oxygen and methane where there is not.",
          "Methane where there is no oxygen.",
        ),
        mcq(
          "What is the active layer?",
          [
            "Ground that thaws and refreezes each year",
            "Ground frozen for more than two years",
            "The ice wedges within the permafrost",
            "The collapsed surface after thawing",
          ],
          "Ground that thaws and refreezes each year",
          "Above it sits the active layer, which thaws each summer and refreezes each winter, and which is where everything that grows does so.",
          "It 'thaws each summer and refreezes each winter'.",
        ),
        mcq(
          "How does a thermosyphon work?",
          [
            "It passively moves heat from the ground to the air",
            "It pumps refrigerant through the foundations",
            "It insulates the building from the ground",
            "It heats the ground evenly to prevent collapse",
          ],
          "It passively moves heat from the ground to the air",
          "Where that is not possible, thermosyphons are used: sealed tubes containing a fluid that carries heat from the ground up to a radiator in the cold air above, working passively all winter and doing nothing in summer.",
          "It carries heat up 'working passively all winter'.",
        ),
        mcq(
          "How much carbon does permafrost hold?",
          [
            "Roughly twice what is in the atmosphere",
            "About the same as the atmosphere",
            "About half of what is in the atmosphere",
            "An amount nobody has estimated",
          ],
          "Roughly twice what is in the atmosphere",
          "Permafrost holds an enormous quantity of organic carbon — plant material frozen before it could decay, estimated at roughly twice the carbon currently in the atmosphere.",
          "'Roughly twice the carbon currently in the atmosphere'.",
        ),
        mcq(
          "Why is thaw hard to model?",
          [
            "It can accelerate suddenly in one place",
            "Boreholes cannot be drilled deep enough",
            "Ice wedges cannot be located in advance",
            "Winter measurements are unreliable",
          ],
          "It can accelerate suddenly in one place",
          "A landscape can be stable for decades and then reorganise itself in a single summer, which is very hard to represent in a model built on gradual change, and which is why field observations keep outrunning the projections.",
          "A landscape can 'reorganise itself in a single summer'.",
        ),
      ],
    },
    {
      key: "t65-p3-technology-in-sport",
      title: "The Line Nobody Can Draw",
      topic: "how sport decides which equipment counts as cheating",
      difficulty: 8,
      body: `A) In 2008 a swimsuit made of polyurethane panels appeared at international competition. It compressed the body, trapped air, and raised the swimmer higher in the water, reducing drag. Within eighteen months something like a hundred and thirty world records had fallen, several of them repeatedly, and the sport's governing body banned non-textile suits outright. Swimmers who had spent a decade approaching a record found it broken four times in a season by people wearing a different fabric. The records set in them were not rescinded, which is why a number of swimming records from 2009 stood untouched for more than a decade.

B) The episode is treated as a clear case, and it is worth asking why. The suits were available to every competitor, so nobody had an unfair advantage over anybody else in the same race. They involved no substance entering the body. The objection that carried the day was that the performances were no longer comparable with those of previous generations, and that what was being measured had changed from the swimmer to the suit. That is an argument about what a sport is for rather than about fairness between competitors, and it is worth separating the two.

C) That objection cannot be applied consistently, which is the difficulty. Running shoes containing a curved carbon plate and a highly resilient foam improve distance-running economy by around four per cent, a margin that decides every marathon ever run. The shoes were not banned. A limit was placed on sole thickness and on the number of plates, which permits most of the advantage and excludes the most extreme designs. Records set in them stand, and no serious proposal exists to separate them from earlier ones. Distance running absorbed a four per cent change in what it was measuring and carried on comparing the results with those of fifty years ago.

D) Nor is the line drawn where the public imagines. Athletes sleep in altitude tents that simulate thin air and raise their red cell count, which is legal; they cannot achieve the same effect by injecting a hormone, which is not. The physiological outcome is similar and the means are different, and the rule attaches to the means. A swimmer may shave their body hair, wear goggles, and train in a flume; a golfer may use a driver whose face has been engineered to a tolerance the rules specify precisely, and a hundredth of a millimetre beyond it becomes illegal.

E) The honest position is that there is no principle here, only a set of negotiated conventions that each sport has arrived at separately and defends afterwards as though it were a principle. The conventions are influenced by who manufactures the equipment, by what spectators will accept, by whether a record book is felt to be sacred, and by whether the change arrived suddenly enough to be noticed. Gradual improvement is absorbed; a step change provokes a rule.

F) The argument becomes sharper where the equipment is prosthetic. A runner using carbon-fibre blades returns energy differently from a biological leg and has a different mass distribution, and whether that constitutes an advantage has been contested in courts and laboratories, with expert evidence pointing in both directions at different distances. The question is genuinely hard, and it is made harder by the fact that the comparison has no neutral baseline: there is no unmodified version of the athlete to compare against.

G) What I think follows is that sport should stop pretending the line is discovered and admit that it is drawn. Each sport is entitled to decide what it wants to be a test of, and to write equipment rules that serve that decision — but it should say so in those terms rather than appealing to fairness, nature or the integrity of the record, none of which survive contact with the history of their own rulebooks. A sport that states plainly what it is measuring can defend its rules. A sport that claims to have found a principled boundary will be embarrassed by the next material somebody invents, exactly as swimming was. The material is always invented, and it is always invented by somebody who has read the rulebook carefully.`,
      questions: [
        fromList(
          "matching_information",
          SPORT_PARAGRAPHS,
          "the reason a particular set of records stood for so long",
          "A",
          "The records set in them were not rescinded, which is why a number of swimming records from 2009 stood untouched for more than a decade.",
          "Paragraph A explains the surviving records.",
        ),
        fromList(
          "matching_information",
          SPORT_PARAGRAPHS,
          "a pair of practices with similar effects but different legal status",
          "D",
          "Athletes sleep in altitude tents that simulate thin air and raise their red cell count, which is legal; they cannot achieve the same effect by injecting a hormone, which is not.",
          "Paragraph D contrasts tents with injections.",
        ),
        fromList(
          "matching_information",
          SPORT_PARAGRAPHS,
          "an account of what actually influences where rules are set",
          "E",
          "The conventions are influenced by who manufactures the equipment, by what spectators will accept, by whether a record book is felt to be sacred, and by whether the change arrived suddenly enough to be noticed.",
          "Paragraph E lists the real influences.",
        ),
        fromList(
          "matching_information",
          SPORT_PARAGRAPHS,
          "a case in which there is nothing neutral to compare against",
          "F",
          "The question is genuinely hard, and it is made harder by the fact that the comparison has no neutral baseline: there is no unmodified version of the athlete to compare against.",
          "Paragraph F raises the missing baseline.",
        ),
        fromList(
          "matching_information",
          SPORT_PARAGRAPHS,
          "an example of a partial restriction that permits most of an advantage",
          "C",
          "A limit was placed on sole thickness and on the number of plates, which permits most of the advantage and excludes the most extreme designs.",
          "Paragraph C describes the shoe limits.",
        ),
        ynng(
          "The writer thinks the swimsuit ban rested on a consistent principle.",
          "NO",
          "That objection cannot be applied consistently, which is the difficulty.",
          "It 'cannot be applied consistently'.",
        ),
        ynng(
          "The writer accepts that sports may decide what they want to test.",
          "YES",
          "Each sport is entitled to decide what it wants to be a test of, and to write equipment rules that serve that decision — but it should say so in those terms rather than appealing to fairness, nature or the integrity of the record, none of which survive contact with the history of their own rulebooks.",
          "Each sport 'is entitled to decide'.",
        ),
        ynng(
          "The writer believes the prosthetics question has been resolved by evidence.",
          "NO",
          "A runner using carbon-fibre blades returns energy differently from a biological leg and has a different mass distribution, and whether that constitutes an advantage has been contested in courts and laboratories, with expert evidence pointing in both directions at different distances.",
          "Expert evidence points 'in both directions'.",
        ),
        ynng(
          "The writer expects future materials to expose the same problem again.",
          "YES",
          "A sport that claims to have found a principled boundary will be embarrassed by the next material somebody invents, exactly as swimming was.",
          "The next material will embarrass it.",
        ),
        fromList(
          "matching_sentence_endings",
          SPORT_ENDINGS,
          "The suits were banned despite a fairness argument in their favour,",
          "even though every competitor had equal access to the equipment.",
          "The suits were available to every competitor, so nobody had an unfair advantage over anybody else in the same race.",
          "Everybody could wear them.",
        ),
        fromList(
          "matching_sentence_endings",
          SPORT_ENDINGS,
          "Carbon-plated running shoes were restricted rather than prohibited,",
          "despite the objection that the advantage was available to anybody who paid.",
          "A limit was placed on sole thickness and on the number of plates, which permits most of the advantage and excludes the most extreme designs.",
          "Only the extremes were excluded.",
        ),
        fromList(
          "matching_sentence_endings",
          SPORT_ENDINGS,
          "Rules attach to methods rather than to outcomes,",
          "because a line has to be drawn somewhere and no line is principled.",
          "The physiological outcome is similar and the means are different, and the rule attaches to the means.",
          "The rule follows the means, not the effect.",
        ),
        fromList(
          "matching_sentence_endings",
          SPORT_ENDINGS,
          "A sudden gain provokes regulation while a slow one does not,",
          "which is why records set in one decade cannot be compared with another.",
          "Gradual improvement is absorbed; a step change provokes a rule.",
          "Only step changes provoke rules.",
        ),
        fromList(
          "matching_sentence_endings",
          SPORT_ENDINGS,
          "Sports should say what they are measuring and defend that,",
          "which the writer regards as the only honest way to run the argument.",
          "What I think follows is that sport should stop pretending the line is discovered and admit that it is drawn.",
          "The line is drawn, not discovered.",
        ),
      ],
    },
  ],
};
