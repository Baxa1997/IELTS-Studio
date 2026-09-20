import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · archaeological dating · notes box --------------------------

const CRUST_NOTES = {
  title: "What a mineral crust can establish",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · resources and chemistry · people and a word bank ----------

const HELIUM_PEOPLE = ["Colette Ashworth", "Dmitri Volkov", "Naledi Sithole", "Hassan Qureshi"];
const HELIUM_BANK = [
  "decay",
  "trap",
  "balloons",
  "magnets",
  "leak",
  "carrier",
  "recondenses",
  "crystalline",
  "nitrogen",
];

// ---- Passage 3 · criminal justice · lettered paragraphs --------------------

const PRISON_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const PRISON_ENDINGS = [
  "because the people who enrol already differ from those who do not.",
  "although the effect is smaller when the places are assigned by lottery.",
  "which is why the benefit disappears if nobody will employ the person.",
  "since a transfer in the fourth month of a six-month course ends it.",
  "because the money released would stay inside the prison system anyway.",
  "which the writer thinks should never have been the load-bearing claim.",
  "even though vocational qualifications outperform general schooling.",
];

export const TEST_80: CuratedTest = {
  key: "full-test-80",
  targetBand: 8,
  passages: [
    {
      key: "t80-p1-dating-rock-art",
      title: "Putting a Date on a Painted Wall",
      topic: "why images on rock are so hard to date and what finally improved the estimates",
      difficulty: 7,
      body: `A painting on a rock face is among the hardest things in archaeology to date. An object buried in a layer of sediment can be placed relative to everything else in that layer; a painting sits on a surface that has been exposed for an unknown length of time, and nothing about its position establishes when the pigment was applied.

The difficulty is worth stating precisely, because it explains why the field has been so contentious. Radiocarbon dating measures the decay of carbon in organic material, so it can date a charcoal drawing directly — the charcoal was once a living plant. It cannot date an image made from ochre, which is an iron oxide and contains no carbon at all, and a large majority of the world's rock art is ochre. For those images the question becomes what else in the vicinity can be dated, and how confidently it can be tied to the painting.

Several indirect methods have been developed, each with its own weakness. Where a painted panel is partly buried by a deposit that can be dated, the painting must be older than the deposit, which gives a minimum age and nothing more. Where a fragment of painted wall has fallen and been buried, the same reasoning applies with more precision. Where an animal is depicted that is known to have become locally extinct, the image cannot be younger than the extinction, which is a genuine constraint and a weak one, since people paint from memory and from other paintings.

The method that has changed the subject is the dating of mineral crusts. In many environments a thin layer forms over an exposed rock surface: in arid regions a dark coating of manganese and iron oxides, in limestone caves a deposit of calcium carbonate. If such a crust has formed over a painting, the crust is younger than the painting; if a painting has been applied over a crust, it is younger than the crust. A crust containing enough carbon or uranium can be dated, and the painting is thereby bracketed.

This is where the arguments begin. The dark coating in arid regions, usually called desert varnish, was for some years thought to be produced largely by microbial activity at a roughly constant rate, and attempts were made to date it by accumulated thickness or by the ratio of cations within it. Those attempts have not held up: the rate depends on local conditions that vary over a few metres, and the assumption of a constant rate was never independently established. The technique is no longer used for anything that matters, which is a normal outcome for a promising method and an unusual one to admit in print.

Uranium-series dating of carbonate crusts is more robust and has produced the results that have unsettled the field. Very old dates for painted panels in Indonesia and in Spain have been reported on this basis, and in the Spanish case they are old enough to raise a question about who made the images. The objections are specific rather than general. A carbonate crust is not a closed system: water moving through it can remove uranium or add it, which biases the result in either direction, and a sample scraped from a crust a millimetre thick may combine material of very different ages.

There is also a problem of association that no laboratory method addresses. A date applies to the sample, and the sample's relationship to the image is an interpretation made in the field, frequently from a photograph and sometimes years later. Several disputed cases turn on whether the crust that was dated actually overlay pigment or lay beside it, and that is a question about a centimetre of rock face rather than about chemistry.

What has improved most is not any single technique but the practice of combining them. A panel with a radiocarbon date on a charcoal figure, a uranium-series bracket on a carbonate crust, a minimum age from a buried deposit and a depicted animal with a known extinction date can be placed with reasonable confidence, because the errors in the four methods are unrelated. Where only one method is available, the honest report is a range rather than a date, and the field has become considerably better at saying so.

The cost of the earlier overconfidence is still being paid. A number of dates published in the 1980s and 1990s circulated widely, entered general accounts, and are still quoted, and withdrawing a date is much harder than publishing one. The most useful thing the subject has produced in thirty years may be the habit of stating what a date is a date of.`,
      questions: [
        tfng(
          "Where a painting sits on a rock surface indicates its age.",
          "FALSE",
          "An object buried in a layer of sediment can be placed relative to everything else in that layer; a painting sits on a surface that has been exposed for an unknown length of time, and nothing about its position establishes when the pigment was applied.",
          "'Nothing about its position establishes' the date.",
        ),
        tfng(
          "Images made with ochre cannot be dated by radiocarbon.",
          "TRUE",
          "It cannot date an image made from ochre, which is an iron oxide and contains no carbon at all, and a large majority of the world's rock art is ochre.",
          "Ochre 'contains no carbon at all'.",
        ),
        tfng(
          "A depicted extinct animal fixes the date of an image precisely.",
          "FALSE",
          "Where an animal is depicted that is known to have become locally extinct, the image cannot be younger than the extinction, which is a genuine constraint and a weak one, since people paint from memory and from other paintings.",
          "It is 'a genuine constraint and a weak one'.",
        ),
        tfng(
          "The rate at which desert varnish forms varies over short distances.",
          "TRUE",
          "Those attempts have not held up: the rate depends on local conditions that vary over a few metres, and the assumption of a constant rate was never independently established.",
          "Conditions 'vary over a few metres'.",
        ),
        tfng(
          "A carbonate crust is a closed chemical system.",
          "FALSE",
          "A carbonate crust is not a closed system: water moving through it can remove uranium or add it, which biases the result in either direction, and a sample scraped from a crust a millimetre thick may combine material of very different ages.",
          "It 'is not a closed system'.",
        ),
        tfng(
          "Combining methods works because their errors are unconnected.",
          "TRUE",
          "A panel with a radiocarbon date on a charcoal figure, a uranium-series bracket on a carbonate crust, a minimum age from a buried deposit and a depicted animal with a known extinction date can be placed with reasonable confidence, because the errors in the four methods are unrelated.",
          "'The errors in the four methods are unrelated'.",
        ),
        tfng(
          "Most rock art sites have now been dated by more than one method.",
          "NOT GIVEN",
          "",
          "The passage recommends combining methods but never says how often it is done.",
        ),
        noteLine(
          CRUST_NOTES,
          null,
          "A crust formed over a painting must be ______ than the painting",
          "younger",
          "If such a crust has formed over a painting, the crust is younger than the painting; if a painting has been applied over a crust, it is younger than the crust.",
          "The crust above 'is younger than the painting'.",
          { before: [{ text: "The crust gives a bracket, not a date:", indent: 0 }] },
        ),
        noteLine(
          CRUST_NOTES,
          null,
          "In arid regions the coating is of manganese and iron ______",
          "oxides",
          "In many environments a thin layer forms over an exposed rock surface: in arid regions a dark coating of manganese and iron oxides, in limestone caves a deposit of calcium carbonate.",
          "It is 'manganese and iron oxides'.",
        ),
        noteLine(
          CRUST_NOTES,
          null,
          "In limestone caves it is a deposit of calcium ______",
          "carbonate",
          "In many environments a thin layer forms over an exposed rock surface: in arid regions a dark coating of manganese and iron oxides, in limestone caves a deposit of calcium carbonate.",
          "In caves it is 'calcium carbonate'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Charcoal can be dated directly because it was once a living ______.",
          "plant",
          "Radiocarbon dating measures the decay of carbon in organic material, so it can date a charcoal drawing directly — the charcoal was once a living plant.",
          "The charcoal 'was once a living plant'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A painting partly buried by a datable deposit yields only a ______ age.",
          "minimum",
          "Where a painted panel is partly buried by a deposit that can be dated, the painting must be older than the deposit, which gives a minimum age and nothing more.",
          "It gives 'a minimum age and nothing more'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "With only one method available the report should be a ______.",
          "range",
          "Where only one method is available, the honest report is a range rather than a date, and the field has become considerably better at saying so.",
          "It should be 'a range rather than a date'.",
        ),
      ],
    },
    {
      key: "t80-p2-helium",
      title: "The Gas That Leaves the Planet",
      topic: "why a common element is scarce where it is needed and what the remedy is",
      difficulty: 8,
      body: `Helium is the second most abundant element in the universe and one of the scarcer ones on Earth, and the reason for the discrepancy is that it does not stay. It forms no compounds, so it is never chemically bound into anything; it is so light that once released into the atmosphere it drifts to the top and is lost to space. Every atom of helium that has ever been used has either been captured or has left the planet permanently.

What exists underground is the product of radioactive decay. Uranium and thorium in the crust emit alpha particles, which are helium nuclei, and over hundreds of millions of years the gas accumulates where a geological trap holds it — the same kind of impermeable formation that holds natural gas. Helium is therefore a by-product of gas extraction, present in most fields at concentrations far too low to recover and in a small number at concentrations worth separating.

Colette Ashworth, who works on supply, makes the point that the market has almost nothing to do with the quantity in the ground. Helium is extracted only where a gas field happens to contain enough of it and where a separation plant has been built, which means global supply depends on a handful of facilities in a handful of countries, and the failure of any one of them moves the price by a large factor. She notes that three of the four shortages since 2006 were caused by scheduled maintenance or a plant fire rather than by any change in reserves.

The uses are less trivial than the reputation suggests. About a fifth of production goes into party balloons and similar applications, which is the figure usually quoted by people arguing that the gas is squandered, and the rest goes into things with no substitute. Liquid helium at four degrees above absolute zero is the only practical coolant for the superconducting magnets in medical scanners and in particle accelerators. Dmitri Volkov, who works on cryogenics, is emphatic that no alternative exists for the lowest temperatures: hydrogen liquefies at twenty degrees and is flammable, nitrogen at seventy-seven, and neither can approach the range where conventional superconductors operate.

There are other uses that depend on properties nothing else combines. Helium is chemically inert, has the smallest atom of any gas, and diffuses through the tiniest opening, which makes it the standard means of finding a leak in a vacuum system. It is used to purge rocket fuel lines, to provide an inert atmosphere for welding certain metals, and as a carrier gas in analytical chemistry. Naledi Sithole, who advises laboratories on supply, observes that the shortages have had an effect nobody intended: a laboratory that cannot obtain the gas at any price switches to a different carrier, and a number of those laboratories have found the substitute acceptable and have not switched back.

Recovery is the obvious response and is unevenly adopted. A medical scanner installed today usually recondenses the helium it boils off, and the gas is effectively retained for the life of the machine; an older installation vents it. Hassan Qureshi, who has surveyed hospital installations, reports that the equipment to capture and re-liquefy costs a substantial fraction of a scanner's price and pays for itself over several years at current prices, and that the decision is routinely made by a department that does not pay the gas bill.

The more interesting development is in where new supply is being sought. Conventional exploration looks for natural gas and treats helium as a bonus; a small number of ventures now look for helium directly, in geological settings where old crystalline rock has been generating it for a very long time and where a trap exists without any hydrocarbon at all. Several such fields have been identified in East Africa and North America. Whether this amounts to a solution depends on how much can be produced, and the honest answer is that nobody yet knows, because the exploration methods are being developed as the drilling proceeds.

The framing of the issue as a shortage is slightly misleading, and a better description is a distribution problem with a hard floor. There is a great deal of helium in the crust; there is very little in places where it is concentrated enough to extract, and the concentration is set by a geological accident that cannot be arranged. That is a different kind of scarcity from running out, and it has a different remedy: recovery, which is available now and is not being done, rather than exploration, which may or may not deliver.`,
      questions: [
        fromList(
          "matching_features",
          HELIUM_PEOPLE,
          "Supply depends on a few plants rather than on what is in the ground.",
          "Colette Ashworth",
          "Colette Ashworth, who works on supply, makes the point that the market has almost nothing to do with the quantity in the ground.",
          "Ashworth separates the market from the reserves.",
        ),
        fromList(
          "matching_features",
          HELIUM_PEOPLE,
          "Nothing else reaches the lowest working temperatures.",
          "Dmitri Volkov",
          "Dmitri Volkov, who works on cryogenics, is emphatic that no alternative exists for the lowest temperatures: hydrogen liquefies at twenty degrees and is flammable, nitrogen at seventy-seven, and neither can approach the range where conventional superconductors operate.",
          "Volkov rules out the alternatives.",
        ),
        fromList(
          "matching_features",
          HELIUM_PEOPLE,
          "Shortages pushed some users onto substitutes they then kept.",
          "Naledi Sithole",
          "Naledi Sithole, who advises laboratories on supply, observes that the shortages have had an effect nobody intended: a laboratory that cannot obtain the gas at any price switches to a different carrier, and a number of those laboratories have found the substitute acceptable and have not switched back.",
          "Sithole found the users did not return.",
        ),
        fromList(
          "matching_features",
          HELIUM_PEOPLE,
          "The capture equipment is chosen by people who do not pay for the gas.",
          "Hassan Qureshi",
          "Hassan Qureshi, who has surveyed hospital installations, reports that the equipment to capture and re-liquefy costs a substantial fraction of a scanner's price and pays for itself over several years at current prices, and that the decision is routinely made by a department that does not pay the gas bill.",
          "Qureshi identifies the split incentive.",
        ),
        fromList(
          "summary_completion",
          HELIUM_BANK,
          "Helium underground is the product of radioactive ______.",
          "decay",
          "What exists underground is the product of radioactive decay.",
          "It comes from radioactive decay.",
        ),
        fromList(
          "summary_completion",
          HELIUM_BANK,
          "It gathers only where a geological ______ holds it.",
          "trap",
          "Uranium and thorium in the crust emit alpha particles, which are helium nuclei, and over hundreds of millions of years the gas accumulates where a geological trap holds it — the same kind of impermeable formation that holds natural gas.",
          "A geological trap has to hold it.",
        ),
        fromList(
          "summary_completion",
          HELIUM_BANK,
          "The liquid cools the superconducting ______ in medical scanners.",
          "magnets",
          "Liquid helium at four degrees above absolute zero is the only practical coolant for the superconducting magnets in medical scanners and in particle accelerators.",
          "It cools the superconducting magnets.",
        ),
        fromList(
          "summary_completion",
          HELIUM_BANK,
          "Its very small atom makes it the standard way of finding a ______.",
          "leak",
          "Helium is chemically inert, has the smallest atom of any gas, and diffuses through the tiniest opening, which makes it the standard means of finding a leak in a vacuum system.",
          "It is used for finding a leak.",
        ),
        fromList(
          "summary_completion",
          HELIUM_BANK,
          "A scanner installed today ______ the gas it boils off.",
          "recondenses",
          "A medical scanner installed today usually recondenses the helium it boils off, and the gas is effectively retained for the life of the machine; an older installation vents it.",
          "A modern scanner recondenses it.",
        ),
        mcq(
          "Why is helium scarce on Earth though abundant in the universe?",
          [
            "It forms no compounds and escapes to space",
            "It decays into other elements",
            "It dissolves into seawater",
            "It is consumed by living organisms",
          ],
          "It forms no compounds and escapes to space",
          "It forms no compounds, so it is never chemically bound into anything; it is so light that once released into the atmosphere it drifts to the top and is lost to space.",
          "Nothing binds it, and it is 'lost to space'.",
        ),
        mcq(
          "What caused most of the recent shortages?",
          [
            "Maintenance or an accident at a plant",
            "A fall in the known reserves",
            "A ban on exports",
            "A rise in the sale of balloons",
          ],
          "Maintenance or an accident at a plant",
          "She notes that three of the four shortages since 2006 were caused by scheduled maintenance or a plant fire rather than by any change in reserves.",
          "They came from maintenance or a fire.",
        ),
        mcq(
          "Why can nitrogen not replace helium in cryogenics?",
          [
            "It liquefies far above the temperature needed",
            "It is flammable",
            "It reacts with the magnets",
            "It is even scarcer",
          ],
          "It liquefies far above the temperature needed",
          "Dmitri Volkov, who works on cryogenics, is emphatic that no alternative exists for the lowest temperatures: hydrogen liquefies at twenty degrees and is flammable, nitrogen at seventy-seven, and neither can approach the range where conventional superconductors operate.",
          "Nitrogen liquefies at seventy-seven degrees.",
        ),
        mcq(
          "What does the writer say the real remedy is?",
          [
            "Recovering the gas already in use",
            "Exploring for new fields",
            "Banning non-essential uses",
            "Allowing the price to rise",
          ],
          "Recovering the gas already in use",
          "That is a different kind of scarcity from running out, and it has a different remedy: recovery, which is available now and is not being done, rather than exploration, which may or may not deliver.",
          "The remedy is recovery, not exploration.",
        ),
      ],
    },
    {
      key: "t80-p3-prison-education",
      title: "Teaching People Who Are Locked Up",
      topic: "which of the two arguments for prison education the evidence can carry",
      difficulty: 9,
      body: `A) Teaching people in prison is defended on two quite different grounds that are frequently run together, and separating them is the first thing to do. One is that education reduces the chance of reoffending, which is an empirical claim about outcomes. The other is that a person confined by the state is owed the opportunity to learn, which is a claim about entitlement and is not answerable by any measurement. Almost every public argument about prison education uses the second as its motivation and the first as its justification, and the first is much the weaker of the two. It is also the one that has been asked to do nearly all the work in front of a finance committee.

B) The outcome evidence is genuinely favourable and genuinely weak, which is an uncomfortable combination. Reviews consistently find that prisoners who take part in education are reconvicted less often than those who do not, by a margin usually reported as a third or more. The difficulty is that participation is voluntary almost everywhere, and the characteristics that lead somebody to enrol on a course — a longer sentence, a settled placement, some literacy, an intention to change — are the same characteristics that predict not returning. The comparison is between people who signed up and people who did not, and that is not a comparison between an intervention and its absence.

C) The better studies address this and produce smaller effects that survive. Where a prison system has changed its provision abruptly, creating cohorts who happened to arrive before and after, the difference in reoffending is positive and modest. Where courses have been allocated by lottery because demand exceeded places, the effect is smaller again and still present. Vocational training with a recognised qualification performs better than general schooling in most of these designs, and the effect is concentrated in people who leave with something an employer recognises, which suggests the mechanism is employment rather than education in any broader sense.

D) That mechanism has an awkward implication the advocacy tends not to state. If the benefit runs through employment, then anything that prevents employment after release will neutralise it, and a great deal does: disclosure requirements, occupational licensing rules that exclude people with convictions, the absence of an address, the loss of identity documents. A prisoner who completes a qualification and cannot be hired has received the education and none of the benefit that was measured, and the measured benefit is the whole of the public case.

E) There is a further problem with the way provision is organised that is rarely discussed and is probably more consequential than the curriculum. Courses take months; transfers between prisons happen without notice and without regard to enrolment; a person moved in the fourth month of a six-month course starts again or does not. Systems that have improved their outcomes have generally done so by changing the transfer policy rather than the teaching, which is a finding about administration masquerading as a finding about pedagogy. A timetable that nobody controls is not a curriculum problem.

F) I am unpersuaded by the argument that the money would be better spent elsewhere, which is the standard objection. The comparison is almost always made against a policy that does not exist: the alternative to a prison education budget is not an equivalent sum spent on early-years provision but the same money spent on custody, and the marginal pound in a prison system goes to staffing and maintenance. Anybody who wants to move it to prevention has to win a different argument first, and the education budget is not the obstacle.

G) What I would defend is the entitlement claim, and I think the tactical decision to lead with reoffending has been a mistake. A justification that rests on measured outcomes is hostage to the next evaluation, and the effects are small enough that an unfavourable study is always possible; a justification that rests on what the state owes a person it has confined is not. The instrumental case is worth making and is true as far as it goes. It should not be the load-bearing one, because it invites the response that if the numbers were worse the teaching should stop, and almost nobody arguing this actually believes that.`,
      questions: [
        fromList(
          "matching_information",
          PRISON_PARAGRAPHS,
          "why the raw comparison between participants and others fails",
          "B",
          "The comparison is between people who signed up and people who did not, and that is not a comparison between an intervention and its absence.",
          "Paragraph B identifies the selection problem.",
        ),
        fromList(
          "matching_information",
          PRISON_PARAGRAPHS,
          "a design in which places were assigned by chance",
          "C",
          "Where courses have been allocated by lottery because demand exceeded places, the effect is smaller again and still present.",
          "Paragraph C describes the lottery studies.",
        ),
        fromList(
          "matching_information",
          PRISON_PARAGRAPHS,
          "obstacles that can cancel the benefit after release",
          "D",
          "If the benefit runs through employment, then anything that prevents employment after release will neutralise it, and a great deal does: disclosure requirements, occupational licensing rules that exclude people with convictions, the absence of an address, the loss of identity documents.",
          "Paragraph D lists the barriers to hiring.",
        ),
        fromList(
          "matching_information",
          PRISON_PARAGRAPHS,
          "an administrative practice that interrupts courses",
          "E",
          "Courses take months; transfers between prisons happen without notice and without regard to enrolment; a person moved in the fourth month of a six-month course starts again or does not.",
          "Paragraph E describes the transfers.",
        ),
        fromList(
          "matching_information",
          PRISON_PARAGRAPHS,
          "why a common objection compares the policy with the wrong alternative",
          "F",
          "The comparison is almost always made against a policy that does not exist: the alternative to a prison education budget is not an equivalent sum spent on early-years provision but the same money spent on custody, and the marginal pound in a prison system goes to staffing and maintenance.",
          "Paragraph F corrects the comparison.",
        ),
        ynng(
          "The writer regards the headline reoffending figures as reliable.",
          "NO",
          "The outcome evidence is genuinely favourable and genuinely weak, which is an uncomfortable combination.",
          "The evidence is 'genuinely weak'.",
        ),
        ynng(
          "The writer accepts that a real effect survives in the better studies.",
          "YES",
          "Where a prison system has changed its provision abruptly, creating cohorts who happened to arrive before and after, the difference in reoffending is positive and modest.",
          "The difference is 'positive and modest'.",
        ),
        ynng(
          "The writer thinks the budget would be better spent on prevention.",
          "NO",
          "I am unpersuaded by the argument that the money would be better spent elsewhere, which is the standard objection.",
          "The writer is 'unpersuaded' by that argument.",
        ),
        ynng(
          "The writer believes the entitlement argument should carry the case.",
          "YES",
          "It should not be the load-bearing one, because it invites the response that if the numbers were worse the teaching should stop, and almost nobody arguing this actually believes that.",
          "The instrumental case should not be load-bearing.",
        ),
        fromList(
          "matching_sentence_endings",
          PRISON_ENDINGS,
          "The headline comparison cannot show what the courses achieve,",
          "because the people who enrol already differ from those who do not.",
          "The comparison is between people who signed up and people who did not, and that is not a comparison between an intervention and its absence.",
          "Enrolment is not random.",
        ),
        fromList(
          "matching_sentence_endings",
          PRISON_ENDINGS,
          "The effects that survive a stricter design are real but small,",
          "although the effect is smaller when the places are assigned by lottery.",
          "Where courses have been allocated by lottery because demand exceeded places, the effect is smaller again and still present.",
          "The lottery studies shrink it further.",
        ),
        fromList(
          "matching_sentence_endings",
          PRISON_ENDINGS,
          "The mechanism appears to run through getting a job,",
          "which is why the benefit disappears if nobody will employ the person.",
          "If the benefit runs through employment, then anything that prevents employment after release will neutralise it, and a great deal does: disclosure requirements, occupational licensing rules that exclude people with convictions, the absence of an address, the loss of identity documents.",
          "Barriers to hiring neutralise it.",
        ),
        fromList(
          "matching_sentence_endings",
          PRISON_ENDINGS,
          "A course is frequently ended by a decision about beds,",
          "since a transfer in the fourth month of a six-month course ends it.",
          "Courses take months; transfers between prisons happen without notice and without regard to enrolment; a person moved in the fourth month of a six-month course starts again or does not.",
          "A transfer mid-course finishes it.",
        ),
        fromList(
          "matching_sentence_endings",
          PRISON_ENDINGS,
          "Moving the budget to prevention requires a different argument,",
          "because the money released would stay inside the prison system anyway.",
          "The comparison is almost always made against a policy that does not exist: the alternative to a prison education budget is not an equivalent sum spent on early-years provision but the same money spent on custody, and the marginal pound in a prison system goes to staffing and maintenance.",
          "The money would go to custody instead.",
        ),
      ],
    },
  ],
};
