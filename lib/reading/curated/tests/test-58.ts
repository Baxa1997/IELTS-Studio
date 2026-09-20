import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · building regulation · notes box ---------------------------

const EXIT_NOTES = {
  title: "What the 1911 rules required",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · carbon ecology · people and a word bank -------------------

const PEAT_PEOPLE = ["Aoife Donnelly", "Ravi Sharma", "Linnea Berg", "Charles Mbeki"];
const PEAT_BANK = [
  "waterlogged",
  "sphagnum",
  "ditches",
  "carbon",
  "fire",
  "oxygen",
  "grazing",
  "dams",
  "centuries",
];

// ---- Passage 3 · psychology of waiting · lettered paragraphs ---------------

const QUEUE_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const QUEUE_ENDINGS = [
  "because an unexplained wait feels roughly twice as long as an explained one.",
  "although the total time spent waiting did not change at all.",
  "which is why a single line is fairer even when it looks longer.",
  "which was already good by the standards of the industry.",
  "because people entering later have no idea how long anyone has been there.",
  "which the writer thinks is where most of the real improvement now lies.",
  "despite the extra distance every passenger had to walk.",
];

export const TEST_58: CuratedTest = {
  key: "full-test-58",
  targetBand: 6,
  passages: [
    {
      key: "t58-p1-fire-exits",
      title: "The Door That Opens Outwards",
      topic: "how the rules for escaping a burning building were written",
      difficulty: 5,
      body: `Almost every rule about how a building must be arranged for escape was written after a fire in which people died because the building was arranged differently. The regulations are, in a literal sense, a list of things that have already gone wrong.

The pattern was established early. After a Chicago theatre fire in 1903 killed more than six hundred people, investigators found that the exits had been fitted with a European style of latch that a panicking crowd could not operate, that several doors opened inwards and were held shut by the weight of the people pressing against them, and that an iron fire curtain had jammed on an obstruction. Each of those findings produced a rule. Exit doors must open in the direction of travel. Exit hardware must release under pressure from a body — the panic bar, patented shortly afterwards, does exactly this. Fire curtains must be tested.

The fire that shaped the rules most comprehensively occurred in a New York garment factory in 1911. A hundred and forty-six workers died, most of them young immigrant women, in a building that was not in breach of the law as it then stood. The single stairway serving the upper floors was legal. The single fire escape, which buckled under the weight of the people on it, was legal. The doors to the stairwell opened inwards, which was legal, and one of them was locked to prevent theft, which was not legal but was routine and unenforced. The fire brigade's ladders reached the sixth floor of a ten-storey building, which was simply a fact about ladders.

What followed was unusual in its thoroughness. A state commission spent two years examining factories rather than only the one that burned, and produced a body of legislation covering exits, sprinklers, fire drills, door hardware, occupancy limits and inspection. The commission's importance lay less in any single rule than in a change of approach: safety stopped being a matter of prosecuting a negligent owner after an event and became a matter of specifying, in advance, what a building had to have before anyone could work in it.

Modern codes have developed that specification into a set of interlocking requirements. The capacity of an exit is measured in the width needed per person. Travel distance to an exit is capped, with the cap depending on the use of the building and whether it is sprinklered. Two exits, remote from each other, are required wherever occupancy or distance exceeds a threshold, so that a single fire cannot block both. Stairways are enclosed in fire-rated construction, so that the escape route stays usable while the floor it serves does not. And in a tall building the stairs are pressurised, with fans pushing air into the shaft so that smoke cannot enter.

The last of these points at an assumption that has been revised. For most of the twentieth century the standard advice in a tall building was to use the stairs and never the lift, because lifts fail in fires, open onto burning floors and lose power. Studies of full-building evacuations, particularly after 2001, established that stairs alone cannot move the occupants of a very tall building quickly enough, and that the people least able to use them are exactly those who most need to be moved. Codes now provide for occupant evacuation lifts: lifts in protected shafts, with their own power supply and water protection, designed to be used in a fire under the direction of the fire service.

None of this is free, and the argument about cost is permanent. Every requirement adds to what a building costs to put up, and every requirement is defended by somebody who can point at a fire.

Three questions run through all of it and none has a fixed answer. How long does the structure have to stand up? How quickly can the people inside get out? And how much of the second depends on their being told what is happening, in time, by a system somebody tested? The rules give numerical answers to the first two and only partial ones to the third, which is why so many post-fire investigations still turn on the alarm, the announcement and the delay before anybody moved.`,
      questions: [
        tfng(
          "Most escape regulations were written in response to particular disasters.",
          "TRUE",
          "Almost every rule about how a building must be arranged for escape was written after a fire in which people died because the building was arranged differently.",
          "Rules follow fires in which people died.",
        ),
        tfng(
          "Some doors in the 1903 theatre could not be opened by the crowd.",
          "TRUE",
          "After a Chicago theatre fire in 1903 killed more than six hundred people, investigators found that the exits had been fitted with a European style of latch that a panicking crowd could not operate, that several doors opened inwards and were held shut by the weight of the people pressing against them, and that an iron fire curtain had jammed on an obstruction.",
          "The latch 'a panicking crowd could not operate'.",
        ),
        tfng(
          "The 1911 factory building broke the law in most respects.",
          "FALSE",
          "A hundred and forty-six workers died, most of them young immigrant women, in a building that was not in breach of the law as it then stood.",
          "It 'was not in breach of the law as it then stood'.",
        ),
        tfng(
          "The fire brigade's ladders could reach the top of the 1911 building.",
          "FALSE",
          "The fire brigade's ladders reached the sixth floor of a ten-storey building, which was simply a fact about ladders.",
          "They reached six floors of ten.",
        ),
        tfng(
          "The commission examined only the factory where the fire happened.",
          "FALSE",
          "A state commission spent two years examining factories rather than only the one that burned, and produced a body of legislation covering exits, sprinklers, fire drills, door hardware, occupancy limits and inspection.",
          "It examined factories generally.",
        ),
        tfng(
          "The two required exits may be placed next to each other.",
          "FALSE",
          "Two exits, remote from each other, are required wherever occupancy or distance exceeds a threshold, so that a single fire cannot block both.",
          "They must be 'remote from each other'.",
        ),
        tfng(
          "Advice about using lifts during a fire has changed.",
          "TRUE",
          "Codes now provide for occupant evacuation lifts: lifts in protected shafts, with their own power supply and water protection, designed to be used in a fire under the direction of the fire service.",
          "Lifts are now provided for in codes.",
        ),
        noteLine(
          EXIT_NOTES,
          null,
          "Regular fire ______ had to be held in factories",
          "drills",
          "A state commission spent two years examining factories rather than only the one that burned, and produced a body of legislation covering exits, sprinklers, fire drills, door hardware, occupancy limits and inspection.",
          "The legislation covered 'fire drills'.",
        ),
        noteLine(
          EXIT_NOTES,
          null,
          "Buildings had to be fitted with ______ as well as exits",
          "sprinklers",
          "A state commission spent two years examining factories rather than only the one that burned, and produced a body of legislation covering exits, sprinklers, fire drills, door hardware, occupancy limits and inspection.",
          "'Exits, sprinklers, fire drills' were all covered.",
          { before: [{ text: "The commission's legislation set out:", indent: 0 }] },
        ),
        noteLine(
          EXIT_NOTES,
          null,
          "Limits were placed on ______ as well as on door hardware",
          "occupancy",
          "A state commission spent two years examining factories rather than only the one that burned, and produced a body of legislation covering exits, sprinklers, fire drills, door hardware, occupancy limits and inspection.",
          "It set 'occupancy limits'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Hardware that releases when a body presses against it is called a ______.",
          "panic bar",
          "Exit hardware must release under pressure from a body — the panic bar, patented shortly afterwards, does exactly this.",
          "It is 'the panic bar'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "How far a person may be from an exit is limited by the ______ distance rule.",
          "travel",
          "Travel distance to an exit is capped, with the cap depending on the use of the building and whether it is sprinklered.",
          "It is the cap on 'travel distance'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In tall buildings the stairs are ______ so that smoke cannot get in.",
          "pressurised",
          "And in a tall building the stairs are pressurised, with fans pushing air into the shaft so that smoke cannot enter.",
          "The stairs are pressurised by fans.",
        ),
      ],
    },
    {
      key: "t58-p2-peatland",
      title: "The Carbon Under the Moss",
      topic: "why drained bogs release more than they store",
      difficulty: 6,
      body: `Peat is plant material that has not finished decaying. In a bog the water table sits at or near the surface all year, and waterlogged ground contains almost no oxygen, so the bacteria and fungi that would otherwise break down dead vegetation work very slowly or not at all. Each year's growth is added to the top and buried, and the accumulation proceeds at perhaps a millimetre a year. A bog two metres deep has been assembling itself for two thousand years.

The arithmetic that follows has made peatlands a subject of unusual interest. Peatlands cover about three per cent of the world's land surface and hold roughly twice as much carbon as all the world's forests combined. Aoife Donnelly, who has surveyed Irish and Scottish bogs for two decades, emphasises that the storage is almost entirely a function of the water. Raise the water table and the peat accumulates; lower it and oxygen reaches material that has been protected from it for millennia, decomposition resumes, and the carbon that took two thousand years to bury is released over decades.

Drainage has been the normal treatment of bogs for most of recorded history, and for understandable reasons. Drained peat grows crops, carries forestry, supports grazing and can be cut for fuel. Across northern Europe the great majority of lowland bog has been drained, and in south-east Asia enormous areas of tropical peat swamp have been converted to plantation. Ravi Sharma, who studies emissions from these landscapes, notes that drained peatlands are estimated to account for around five per cent of global emissions from human activity while occupying a fraction of a per cent of the land — an intensity per hectare unmatched by any other land use.

Fire is where the tropical figures become dramatic. Dry peat burns underground, smouldering along the layers for weeks or months, largely immune to rain and almost impossible to extinguish. The fires that burned across Indonesian peatlands in 2015 released, by several estimates, more carbon dioxide in a matter of weeks than the annual emissions of most industrial economies, and produced a haze that closed schools and airports across three countries.

Restoration, where it is attempted, is mostly plumbing. Linnea Berg, a hydrologist who has worked on Scandinavian and Baltic sites, describes the core operation as blocking ditches: a series of dams of peat, timber or plastic piling, placed so that the water table rises back towards the surface and stays there through the dry season. Where the surface has been damaged the bog-forming mosses are reintroduced, because sphagnum both builds the peat and acidifies the water in a way that suppresses competitors. Berg is careful about the timescale. Emissions can be reduced within a few years of rewetting, and a functioning bog surface may re-establish within a decade or two, but the peat that was lost is not coming back within any horizon that matters to a policy: rebuilding a metre of it requires a thousand years.

The economics have shifted enough to make restoration plausible at scale. Charles Mbeki, who works on land-use finance, argues that peatland is now the clearest case in the whole carbon market, because the intervention is cheap, the measurement is relatively tractable and the counterfactual is unusually solid — a drained bog will certainly continue emitting, so the avoided emissions are real rather than hypothetical. What holds it back, in his account, is that the land belongs to farmers whose livelihood depends on its being dry, and no scheme works unless it pays them at least as much as the drained land did.

There is a horticultural footnote with a large total, and it is the one part of the subject an ordinary householder can act on directly. Peat is still extracted and sold as a growing medium for gardens, a use that destroys a two-thousand-year deposit to fill a bag that will be emptied into a pot within a year. Several countries have now announced bans on its sale to amateur gardeners. The alternatives — composted bark, coir, wood fibre — work differently and require growers to change their watering and feeding, which is the ordinary reason a technically adequate substitute takes a decade to be adopted.`,
      questions: [
        fromList(
          "matching_features",
          PEAT_PEOPLE,
          "Whether peat stores or releases carbon depends on the water table.",
          "Aoife Donnelly",
          "Aoife Donnelly, who has surveyed Irish and Scottish bogs for two decades, emphasises that the storage is almost entirely a function of the water.",
          "Donnelly makes storage a function of water.",
        ),
        fromList(
          "matching_features",
          PEAT_PEOPLE,
          "Emissions per hectare are higher than for any other land use.",
          "Ravi Sharma",
          "Ravi Sharma, who studies emissions from these landscapes, notes that drained peatlands are estimated to account for around five per cent of global emissions from human activity while occupying a fraction of a per cent of the land — an intensity per hectare unmatched by any other land use.",
          "Sharma gives the per-hectare comparison.",
        ),
        fromList(
          "matching_features",
          PEAT_PEOPLE,
          "Restoration is mainly a matter of holding water in place.",
          "Linnea Berg",
          "Linnea Berg, a hydrologist who has worked on Scandinavian and Baltic sites, describes the core operation as blocking ditches: a series of dams of peat, timber or plastic piling, placed so that the water table rises back towards the surface and stays there through the dry season.",
          "Berg describes ditch blocking.",
        ),
        fromList(
          "matching_features",
          PEAT_PEOPLE,
          "Schemes fail unless landowners are paid what the drained land earned.",
          "Charles Mbeki",
          "What holds it back, in his account, is that the land belongs to farmers whose livelihood depends on its being dry, and no scheme works unless it pays them at least as much as the drained land did.",
          "Mbeki sets the payment condition.",
        ),
        fromList(
          "summary_completion",
          PEAT_BANK,
          "Decay is suppressed because the ground is ______ and therefore short of air.",
          "waterlogged",
          "In a bog the water table sits at or near the surface all year, and waterlogged ground contains almost no oxygen, so the bacteria and fungi that would otherwise break down dead vegetation work very slowly or not at all.",
          "'Waterlogged ground contains almost no oxygen'.",
        ),
        fromList(
          "summary_completion",
          PEAT_BANK,
          "Draining lets ______ reach material that has been protected for millennia.",
          "oxygen",
          "Raise the water table and the peat accumulates; lower it and oxygen reaches material that has been protected from it for millennia, decomposition resumes, and the carbon that took two thousand years to bury is released over decades.",
          "Lowering the table lets oxygen in.",
        ),
        fromList(
          "summary_completion",
          PEAT_BANK,
          "Dried-out peat can also catch ______, which then burns underground for months.",
          "fire",
          "Dry peat burns underground, smouldering along the layers for weeks or months, largely immune to rain and almost impossible to extinguish.",
          "It burns underground for weeks or months.",
        ),
        fromList(
          "summary_completion",
          PEAT_BANK,
          "Restoration begins by placing ______ in the drainage channels.",
          "dams",
          "Linnea Berg, a hydrologist who has worked on Scandinavian and Baltic sites, describes the core operation as blocking ditches: a series of dams of peat, timber or plastic piling, placed so that the water table rises back towards the surface and stays there through the dry season.",
          "It uses 'a series of dams'.",
        ),
        fromList(
          "summary_completion",
          PEAT_BANK,
          "Bog mosses, especially ______, are replanted where the surface is damaged.",
          "sphagnum",
          "Where the surface has been damaged the bog-forming mosses are reintroduced, because sphagnum both builds the peat and acidifies the water in a way that suppresses competitors.",
          "Sphagnum is the moss reintroduced.",
        ),
        mcq(
          "How much carbon do peatlands hold compared with forests?",
          [
            "About twice as much",
            "About the same amount",
            "About half as much",
            "Ten times as much",
          ],
          "About twice as much",
          "Peatlands cover about three per cent of the world's land surface and hold roughly twice as much carbon as all the world's forests combined.",
          "'Roughly twice as much carbon as all the world's forests'.",
        ),
        mcq(
          "What does the passage say about the 2015 Indonesian fires?",
          [
            "They released more carbon in weeks than many countries do in a year",
            "They were extinguished by the following monsoon",
            "They burned only on plantations",
            "They caused no disruption beyond the country",
          ],
          "They released more carbon in weeks than many countries do in a year",
          "The fires that burned across Indonesian peatlands in 2015 released, by several estimates, more carbon dioxide in a matter of weeks than the annual emissions of most industrial economies, and produced a haze that closed schools and airports across three countries.",
          "Weeks of fire exceeded most economies' annual emissions.",
        ),
        mcq(
          "What does Berg say about the timescale of recovery?",
          [
            "Lost peat cannot be rebuilt on any useful timescale",
            "A bog surface takes a century to re-establish",
            "Emissions continue rising for decades after rewetting",
            "Restoration must be repeated every few years",
          ],
          "Lost peat cannot be rebuilt on any useful timescale",
          "Emissions can be reduced within a few years of rewetting, and a functioning bog surface may re-establish within a decade or two, but the peat that was lost is not coming back within any horizon that matters to a policy: rebuilding a metre of it requires a thousand years.",
          "A metre of peat needs a thousand years.",
        ),
        mcq(
          "Why do peat substitutes take time to be adopted?",
          [
            "Growers must change how they water and feed",
            "They cost several times as much",
            "They are not available in large quantities",
            "They have been banned in several countries",
          ],
          "Growers must change how they water and feed",
          "The alternatives — composted bark, coir, wood fibre — work differently and require growers to change their watering and feeding, which is the ordinary reason a technically adequate substitute takes a decade to be adopted.",
          "They 'require growers to change their watering and feeding'.",
        ),
      ],
    },
    {
      key: "t58-p3-waiting-psychology",
      title: "The Length of a Wait",
      topic: "why how long a queue feels has little to do with how long it is",
      difficulty: 7,
      body: `A) An airline in the 1990s received persistent complaints about the time passengers spent waiting for baggage at one of its terminals. The airline did what an operations department does: it added handlers, and it reduced the average wait to a little under eight minutes, which was good by industry standards. The complaints continued. Somebody then measured the components of the wait and found that passengers walked about a minute from the gate to the carousel and then stood for seven. The airline moved the arrival gates further from the baggage hall, so that the walk took six minutes and the standing took two. Complaints fell to almost nothing.

B) The story is told often enough to have become slightly suspect, but the effect it illustrates is well established: unoccupied time feels substantially longer than occupied time. A wait in which nothing can be done is experienced as longer than a wait of the same duration in which something is happening, even when the something is walking down a corridor with a suitcase. Mirrors beside lift doors, the newspaper rack at a barber's, and the winding queue rope that keeps people moving in short steps all exploit the same finding.

C) A second robust result concerns explanation. A delay whose cause is unknown is experienced as roughly twice as long as a delay of the same length that has been explained, and the effect survives even when the explanation is unwelcome. The underground train that stops in a tunnel and says nothing produces far more frustration than the one that stops and announces a signal failure ahead, although the second has confirmed that the wait will be longer. A related finding is that the anxiety of not knowing whether you are in the right queue is itself a large component of perceived duration.

D) Fairness is the third and the strongest. People will tolerate a long wait far better than a short one in which somebody who arrived later is served first, and a violation of queue order produces a reaction out of all proportion to the time lost. This is the finding behind the single serpentine line feeding several servers, which is now standard in banks, post offices and airport security. A single line is usually slower for the individual than picking the shortest of several — it cannot be, and it does not feel, faster — but it guarantees first come, first served, and satisfaction with it is consistently higher.

E) The practical toolkit that follows is well known to anyone who has designed a service. Give people something to do or look at. Tell them what is happening and why. Tell them how long it will be, and overstate it slightly, because a wait that ends sooner than promised is remembered as short. Start the service before the wait ends, which is what the menu handed out in the queue and the form filled in while waiting both accomplish. Make the order visible and unbreakable. None of these reduces the wait; all of them reduce the complaint.

F) There is an obvious objection, which is that this amounts to managing perception instead of fixing the problem, and in some hands it plainly is. A hospital that furnishes its waiting room beautifully while leaving a four-hour wait in place has not treated anybody. But the objection assumes the wait can be removed, and in a system with variable demand and finite capacity a great deal of waiting is irreducible. Given a wait that is going to happen, making it feel shorter is not a trick played on the customer; it is the only remaining thing that can be done for them.

G) Where I think the field now matters most is in the queues that have no physical form. The wait for a callback, the application whose status is unknown for six weeks, the parcel that is somewhere — these are waits with no line to look at, no visible order, no explanation and no estimate, and they fail every one of the conditions the research identifies. The lift lobby has been solved for fifty years. The invisible queue, which is where most waiting now happens, has hardly been touched.`,
      questions: [
        fromList(
          "matching_information",
          QUEUE_PARAGRAPHS,
          "a list of measures that a service designer can apply",
          "E",
          "Give people something to do or look at. Tell them what is happening and why.",
          "Paragraph E is the practical toolkit.",
        ),
        fromList(
          "matching_information",
          QUEUE_PARAGRAPHS,
          "an argument that waiting cannot always be designed away",
          "F",
          "But the objection assumes the wait can be removed, and in a system with variable demand and finite capacity a great deal of waiting is irreducible.",
          "Paragraph F answers the objection.",
        ),
        fromList(
          "matching_information",
          QUEUE_PARAGRAPHS,
          "an example in which the solution made the journey longer",
          "A",
          "The airline moved the arrival gates further from the baggage hall, so that the walk took six minutes and the standing took two.",
          "Paragraph A describes the gate move.",
        ),
        fromList(
          "matching_information",
          QUEUE_PARAGRAPHS,
          "the reason a slower arrangement is preferred by customers",
          "D",
          "A single line is usually slower for the individual than picking the shortest of several — it cannot be, and it does not feel, faster — but it guarantees first come, first served, and satisfaction with it is consistently higher.",
          "Paragraph D explains the serpentine line.",
        ),
        fromList(
          "matching_information",
          QUEUE_PARAGRAPHS,
          "a kind of waiting the writer believes has been neglected",
          "G",
          "The lift lobby has been solved for fifty years. The invisible queue, which is where most waiting now happens, has hardly been touched.",
          "Paragraph G names the invisible queue.",
        ),
        ynng(
          "The writer regards the airline anecdote as completely reliable.",
          "NO",
          "The story is told often enough to have become slightly suspect, but the effect it illustrates is well established: unoccupied time feels substantially longer than occupied time.",
          "It has 'become slightly suspect'.",
        ),
        ynng(
          "The writer thinks an unwelcome explanation is better than none.",
          "YES",
          "A delay whose cause is unknown is experienced as roughly twice as long as a delay of the same length that has been explained, and the effect survives even when the explanation is unwelcome.",
          "The effect 'survives even when the explanation is unwelcome'.",
        ),
        ynng(
          "The writer accepts that improving perception can be a substitute for fixing a service.",
          "NO",
          "A hospital that furnishes its waiting room beautifully while leaving a four-hour wait in place has not treated anybody.",
          "Such a hospital 'has not treated anybody'.",
        ),
        ynng(
          "The writer believes physical queues are now the main problem.",
          "NO",
          "The lift lobby has been solved for fifty years. The invisible queue, which is where most waiting now happens, has hardly been touched.",
          "Physical queues are solved; invisible ones are not.",
        ),
        fromList(
          "matching_sentence_endings",
          QUEUE_ENDINGS,
          "Moving the arrival gates ended the complaints,",
          "although the total time spent waiting did not change at all.",
          "The airline moved the arrival gates further from the baggage hall, so that the walk took six minutes and the standing took two.",
          "Six minutes walking plus two standing is the same eight minutes.",
        ),
        fromList(
          "matching_sentence_endings",
          QUEUE_ENDINGS,
          "The first response was to put more staff on the job,",
          "which was already good by the standards of the industry.",
          "The airline did what an operations department does: it added handlers, and it reduced the average wait to a little under eight minutes, which was good by industry standards.",
          "Eight minutes was 'good by industry standards'.",
        ),
        fromList(
          "matching_sentence_endings",
          QUEUE_ENDINGS,
          "Announcing the cause of a hold-up is worth doing",
          "because an unexplained wait feels roughly twice as long as an explained one.",
          "A delay whose cause is unknown is experienced as roughly twice as long as a delay of the same length that has been explained, and the effect survives even when the explanation is unwelcome.",
          "Unexplained delays feel about twice as long.",
        ),
        fromList(
          "matching_sentence_endings",
          QUEUE_ENDINGS,
          "Banks and airports feed several counters from one line,",
          "which is why a single line is fairer even when it looks longer.",
          "This is the finding behind the single serpentine line feeding several servers, which is now standard in banks, post offices and airport security.",
          "The single line guarantees order.",
        ),
        fromList(
          "matching_sentence_endings",
          QUEUE_ENDINGS,
          "Waits without a visible line are the remaining problem,",
          "which the writer thinks is where most of the real improvement now lies.",
          "The wait for a callback, the application whose status is unknown for six weeks, the parcel that is somewhere — these are waits with no line to look at, no visible order, no explanation and no estimate, and they fail every one of the conditions the research identifies.",
          "Invisible queues fail every condition.",
        ),
      ],
    },
  ],
};
