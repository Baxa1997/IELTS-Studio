import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of printing · notes box ----------------------------

const TYPE_NOTES = {
  title: "Why the technique stalled in East Asia",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · writing systems · people and a word bank ------------------

const SHORTHAND_PEOPLE = ["Harriet Enderby", "Viktor Sobol", "Chidinma Obi", "Lars Hoffmann"];
const SHORTHAND_BANK = [
  "phonetic",
  "outlines",
  "verbatim",
  "vowels",
  "dictation",
  "recorders",
  "certification",
  "courts",
  "speed",
];

// ---- Passage 3 · library science · lettered paragraphs ---------------------

const CLASS_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const CLASS_ENDINGS = [
  "because a physical book can occupy only one position on one shelf.",
  "which is why a scheme devised in 1876 still governs where a book stands.",
  "since a number that encodes a subject also encodes an opinion about it.",
  "since a digital catalogue can file the same item under twenty headings.",
  "because reclassifying a collection means physically moving every volume in it.",
  "even though the categories were drawn up by one man in his early twenties.",
  "which makes browsing a shelf a different act from searching a database.",
];

export const TEST_101: CuratedTest = {
  key: "full-test-101",
  targetBand: 8,
  passages: [
    {
      key: "t101-p1-movable-type-korea",
      title: "Type Before Gutenberg",
      topic: "an invention made twice, and why only the second time changed anything",
      difficulty: 7,
      body: `Printing with movable type was invented in East Asia several centuries before it appeared in Europe. Ceramic type is described in a Chinese text of the 1040s. Wooden type was in use in the following centuries, and there are surviving printed sheets to prove it. Metal type was cast in Korea from at least the early thirteenth century, and a Korean government foundry was producing bronze type on an organised basis by the 1400s, decades before anything comparable existed in Mainz. The Korean alphabet itself, devised in the 1440s, is an almost ideal script for movable type: it has a small number of letters, they are simple in form, and they are assembled into syllabic blocks.

None of this produced the effects that European printing produced within fifty years of its appearance. There was no comparable explosion in the number of books in circulation, no comparable fall in their price, and no comparable emergence of a commercial publishing trade. Books continued to be produced in much the way they had been, by institutions that had always produced them, for readers who had always read them. Explaining that difference is one of the standard problems in the history of technology, and the standard explanations are not all equally good.

The weakest explanation is the script. It is frequently said that a Chinese printer needed thousands of characters and a European one needed a hundred, which made the technique impractical. The difficulty is real for Chinese and it does not explain Korea, where the alphabetic script removed the problem entirely and the outcome was still different. A hypothesis that fails on the best-designed case is not doing much work. It is also worth noting that Chinese printers did print very large numbers of books, using carved wooden blocks rather than type, which suggests the constraint was on the technique chosen and not on the volume of printing.

A stronger explanation concerns who was printing and why. The Korean foundry was a state institution. It printed what the state wanted printed — administrative texts, classics, calendars, works of official scholarship — in editions of a few dozen to a few hundred, for distribution to officials and institutions rather than for sale. There was no reason to seek the largest possible print run, because the readership was defined in advance. European printing, by contrast, was from the beginning a commercial venture financed by borrowed money and obliged to sell copies to repay it, which produces continuous pressure to find more readers, cheaper materials and faster presses.

The third explanation is the press itself, and it is the one most often omitted. Gutenberg's contribution was not the idea of movable type but a system: an oil-based ink that adhered to metal, a type-casting method using a hand mould that produced identical pieces quickly, and a screw press adapted from wine and paper making that applied even pressure across a whole page. East Asian printing was done by laying paper on inked type and rubbing it with a brush, which is slower per sheet and prints on one side. The press is a throughput technology, and throughput was what the commercial model required.

There is also an infrastructural point. Europe had paper mills, an established trade in manuscripts with booksellers and university markets, a fragmented political landscape in which a printer could move to a more permissive city, and a scholarly readership already writing to each other in a shared language. These are conditions for a market, and the technology arrived into them.

What the comparison suggests is that the invention was not the cause of anything on its own. The same device, in a place with a state monopoly on its use and a defined readership, produced a well-run government printing office for four centuries. In a place with commercial finance, competing jurisdictions, an existing book trade and a mechanical press, it produced an industry, and then a publishing trade, and then a reading public that had not previously existed as a market. Historians who set out to identify the decisive factor have generally ended by concluding that the question is badly posed, and that what differed was not one element but the arrangement the element sat in.`,
      questions: [
        tfng(
          "Metal type was being cast in Korea before it existed in Europe.",
          "TRUE",
          "Metal type was cast in Korea from at least the early thirteenth century, and a Korean government foundry was producing bronze type on an organised basis by the 1400s, decades before anything comparable existed in Mainz.",
          "It preceded Mainz by decades at least.",
        ),
        tfng(
          "The Korean script was poorly suited to movable type.",
          "FALSE",
          "The Korean alphabet itself, devised in the 1440s, is an almost ideal script for movable type: it has a small number of letters, they are simple in form, and they are assembled into syllabic blocks.",
          "It is 'an almost ideal script'.",
        ),
        tfng(
          "The writer accepts that the number of characters explains the difference.",
          "FALSE",
          "The difficulty is real for Chinese and it does not explain Korea, where the alphabetic script removed the problem entirely and the outcome was still different.",
          "It fails to explain Korea.",
        ),
        tfng(
          "The Korean foundry printed mainly for sale to the public.",
          "FALSE",
          "It printed what the state wanted printed — administrative texts, classics, calendars, works of official scholarship — in editions of a few dozen to a few hundred, for distribution to officials and institutions rather than for sale.",
          "It printed for distribution, not sale.",
        ),
        tfng(
          "European printers were under financial pressure to increase print runs.",
          "TRUE",
          "European printing, by contrast, was from the beginning a commercial venture financed by borrowed money and obliged to sell copies to repay it, which produces continuous pressure to find more readers, cheaper materials and faster presses.",
          "Borrowed money created the pressure.",
        ),
        tfng(
          "East Asian printing used a press to apply pressure evenly.",
          "FALSE",
          "East Asian printing was done by laying paper on inked type and rubbing it with a brush, which is slower per sheet and prints on one side.",
          "A brush was used, not a press.",
        ),
        tfng(
          "The Korean foundry employed more workers than a European printing house.",
          "NOT GIVEN",
          "",
          "The passage compares purposes and methods but not workforce sizes.",
        ),
        noteLine(
          TYPE_NOTES,
          null,
          "The foundry was a ______ institution, not a business",
          "state",
          "The Korean foundry was a state institution.",
          "It was a state institution.",
          { before: [{ text: "Conditions around the same device:", indent: 0 }] },
        ),
        noteLine(
          TYPE_NOTES,
          null,
          "The ______ was known in advance, so no larger run was sought",
          "readership",
          "There was no reason to seek the largest possible print run, because the readership was defined in advance.",
          "The readership was defined in advance.",
        ),
        noteLine(
          TYPE_NOTES,
          null,
          "Impressions were taken with a ______ rather than a press",
          "brush",
          "East Asian printing was done by laying paper on inked type and rubbing it with a brush, which is slower per sheet and prints on one side.",
          "A brush took the impression.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Gutenberg's ink was ______ and adhered to metal.",
          "oil-based",
          "Gutenberg's contribution was not the idea of movable type but a system: an oil-based ink that adhered to metal, a type-casting method using a hand mould that produced identical pieces quickly, and a screw press adapted from wine and paper making that applied even pressure across a whole page.",
          "The ink was oil-based.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A printer in Europe could move to a more ______ city.",
          "permissive",
          "Europe had paper mills, an established trade in manuscripts with booksellers and university markets, a fragmented political landscape in which a printer could move to a more permissive city, and a scholarly readership already writing to each other in a shared language.",
          "He could move somewhere more permissive.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "What differed was the ______ the element sat in.",
          "arrangement",
          "Historians who set out to identify the decisive factor have generally ended by concluding that the question is badly posed, and that what differed was not one element but the arrangement the element sat in.",
          "The arrangement differed.",
        ),
      ],
    },
    {
      key: "t101-p2-shorthand",
      title: "Writing as Fast as Speech",
      topic: "a skill that was a profession, then a qualification, and is now almost gone",
      difficulty: 8,
      body: `Ordinary handwriting runs at perhaps thirty words a minute. Speech runs at a hundred and fifty. For most of recorded history the gap between the two meant that nothing said could be preserved as said, and any account of a speech, a trial or a meeting was a summary written afterwards by somebody who had been there. What people had actually said, in the words they had used, was simply not recoverable.

Systems for closing the gap are ancient — a Roman freedman devised one used for senate proceedings — and the modern versions date from the nineteenth century, when a demand for verbatim records of parliaments, trials and sermons appeared at the same moment as a mass market for cheap print. Harriet Enderby, a historian of clerical work, emphasises what the successful systems had in common and how it differed from earlier attempts. They abandoned the alphabet. Instead of abbreviating spelling, they recorded sound: a stroke for each consonant, its thickness or length distinguishing related sounds, and vowels indicated by small marks that a practised writer could omit entirely. She stresses that this is why the systems were fast and also why they were difficult, since a phonetic record of English is not something anyone can read without training.

The two that mattered were published in 1837 and 1888, and the difference between them is instructive. Viktor Sobol, who has studied both, explains that the earlier system distinguished pairs of similar sounds by the thickness of the stroke, which requires a flexible nib and careful pressure, while the later one used length instead, which works with any pen and in any conditions. He regards this as the clearest case he knows of a design decision that determined which of two competing standards survived a change in materials, since the arrival of the ballpoint pen made pressure-based distinctions impossible to write reliably.

The skill created an occupation, and the occupation changed who worked in offices. Chidinma Obi, who studies the history of women's employment, notes that shorthand combined with typewriting produced the first large category of respectable paid work available to educated women in Britain and North America, and that the training was provided by private commercial schools rather than by the state. She adds a detail that complicates the usual account: the qualification was defined by a measured speed, in words per minute, certified by examination, which made it one of the few labour markets of the period in which a woman's credential was a number rather than a reference.

The decline was slower than one would expect. Sound recording existed from the 1870s and did not displace shorthand for a century, and Lars Hoffmann, who has examined why, argues that the reason was never the recording but the transcription: a recording has to be listened to in real time to become text, whereas a shorthand note is already a text that its writer can read back at reading speed. Only when machine transcription became usable did the advantage disappear. He points out that the profession's last stronghold, the courts, held on longest for a related reason, since a stenographer produces a certified transcript with a person answerable for its accuracy, and a recording does not.

What has replaced it in the courtroom is not typing but machine shorthand: a chorded keyboard on which a whole syllable is struck at once, producing an output that software expands into text. The underlying principle is the nineteenth-century one — record the sound, not the spelling — implemented in hardware, and a competent operator reaches two hundred words a minute or more. The training still takes years, and the shortage of qualified operators is a live problem for court systems in several countries.

The general observation is about what was lost when the skill went. A shorthand note is a compressed record made by a person who understood what was being said, and the compression involved judgement: what to take down fully, what to abbreviate, what to mark as uncertain. A recording makes no judgements and requires none, which is its virtue and the reason a transcript of a meeting is so much longer and so much less useful than the minutes a secretary would once have produced from the same hour.`,
      questions: [
        fromList(
          "matching_features",
          SHORTHAND_PEOPLE,
          "The systems worked by recording sound rather than spelling.",
          "Harriet Enderby",
          "She stresses that this is why the systems were fast and also why they were difficult, since a phonetic record of English is not something anyone can read without training.",
          "Enderby explains the phonetic basis.",
        ),
        fromList(
          "matching_features",
          SHORTHAND_PEOPLE,
          "A change in writing materials decided which system survived.",
          "Viktor Sobol",
          "He regards this as the clearest case he knows of a design decision that determined which of two competing standards survived a change in materials, since the arrival of the ballpoint pen made pressure-based distinctions impossible to write reliably.",
          "Sobol credits the change of pen.",
        ),
        fromList(
          "matching_features",
          SHORTHAND_PEOPLE,
          "The qualification was a measured number rather than a recommendation.",
          "Chidinma Obi",
          "She adds a detail that complicates the usual account: the qualification was defined by a measured speed, in words per minute, certified by examination, which made it one of the few labour markets of the period in which a woman's credential was a number rather than a reference.",
          "Obi notes the numerical credential.",
        ),
        fromList(
          "matching_features",
          SHORTHAND_PEOPLE,
          "Recording did not displace the skill because transcription was the bottleneck.",
          "Lars Hoffmann",
          "Sound recording existed from the 1870s and did not displace shorthand for a century, and Lars Hoffmann, who has examined why, argues that the reason was never the recording but the transcription: a recording has to be listened to in real time to become text, whereas a shorthand note is already a text that its writer can read back at reading speed.",
          "Hoffmann identifies transcription.",
        ),
        fromList(
          "summary_completion",
          SHORTHAND_BANK,
          "The systems were ______, recording sounds rather than letters.",
          "phonetic",
          "She stresses that this is why the systems were fast and also why they were difficult, since a phonetic record of English is not something anyone can read without training.",
          "The record is phonetic.",
        ),
        fromList(
          "summary_completion",
          SHORTHAND_BANK,
          "A practised writer could leave the ______ out altogether.",
          "vowels",
          "Instead of abbreviating spelling, they recorded sound: a stroke for each consonant, its thickness or length distinguishing related sounds, and vowels indicated by small marks that a practised writer could omit entirely.",
          "Vowel marks could be omitted.",
        ),
        fromList(
          "summary_completion",
          SHORTHAND_BANK,
          "The qualification was a ______ measured in words per minute.",
          "speed",
          "She adds a detail that complicates the usual account: the qualification was defined by a measured speed, in words per minute, certified by examination, which made it one of the few labour markets of the period in which a woman's credential was a number rather than a reference.",
          "The credential was a speed.",
        ),
        fromList(
          "summary_completion",
          SHORTHAND_BANK,
          "Sound ______ existed for a century without displacing the skill.",
          "recorders",
          "Sound recording existed from the 1870s and did not displace shorthand for a century, and Lars Hoffmann, who has examined why, argues that the reason was never the recording but the transcription: a recording has to be listened to in real time to become text, whereas a shorthand note is already a text that its writer can read back at reading speed.",
          "Recording existed from the 1870s.",
        ),
        fromList(
          "summary_completion",
          SHORTHAND_BANK,
          "The skill survived longest in the ______, where accuracy must be attested.",
          "courts",
          "He points out that the profession's last stronghold, the courts, held on longest for a related reason, since a stenographer produces a certified transcript with a person answerable for its accuracy, and a recording does not.",
          "The courts were the last stronghold.",
        ),
        mcq(
          "How did the 1888 system differ from the earlier one?",
          [
            "It used stroke length instead of thickness",
            "It abandoned phonetic recording",
            "It required a flexible nib",
            "It used chorded keys",
          ],
          "It used stroke length instead of thickness",
          "Viktor Sobol, who has studied both, explains that the earlier system distinguished pairs of similar sounds by the thickness of the stroke, which requires a flexible nib and careful pressure, while the later one used length instead, which works with any pen and in any conditions.",
          "Length replaced thickness.",
        ),
        mcq(
          "Who provided the training for shorthand and typing?",
          [
            "Private commercial schools",
            "State secondary schools",
            "Employers in their own offices",
            "Professional associations",
          ],
          "Private commercial schools",
          "Chidinma Obi, who studies the history of women's employment, notes that shorthand combined with typewriting produced the first large category of respectable paid work available to educated women in Britain and North America, and that the training was provided by private commercial schools rather than by the state.",
          "Private commercial schools trained them.",
        ),
        mcq(
          "What has replaced pen shorthand in courtrooms?",
          [
            "A chorded keyboard expanded by software",
            "Typing at high speed",
            "Audio recording alone",
            "Automatic speech recognition",
          ],
          "A chorded keyboard expanded by software",
          "What has replaced it in the courtroom is not typing but machine shorthand: a chorded keyboard on which a whole syllable is struck at once, producing an output that software expands into text.",
          "A chorded keyboard with software.",
        ),
        mcq(
          "What does the writer say was lost with the skill?",
          [
            "A record compressed by someone exercising judgement",
            "The ability to write quickly by hand",
            "A cheap alternative to recording equipment",
            "A qualification available to women",
          ],
          "A record compressed by someone exercising judgement",
          "A shorthand note is a compressed record made by a person who understood what was being said, and the compression involved judgement: what to take down fully, what to abbreviate, what to mark as uncertain.",
          "The judgement in the compression.",
        ),
      ],
    },
    {
      key: "t101-p3-library-classification",
      title: "Putting Every Book in Its Place",
      topic: "the constraint that a book can only be in one place, and what it forced",
      difficulty: 9,
      body: `A) A library with open shelves must decide where each book stands, and the decision is singular: a physical volume occupies one position, and a reader browsing will find it there or not at all. Everything distinctive about library classification follows from that constraint. A catalogue can list a book under any number of subjects; a shelf cannot. The classification scheme is therefore an attempt to impose a single linear order on a body of knowledge that is not linear, and the interest of the subject lies in how that impossible task has been managed.

B) The dominant solution divides knowledge into ten classes, each into ten divisions, each into ten sections, with decimal subdivision below that. It was devised in 1876 by Melvil Dewey, then twenty-four and working as a student assistant in a college library, and it is still the scheme most public libraries in the world use. Its great practical virtue is that a number can be extended indefinitely to the right, so a new subject can be inserted without renumbering anything, which for a system governing physical objects is the property that matters most.

C) Its weaknesses are the weaknesses of any fixed division of knowledge made at a particular moment by a particular person. The allocation of the ten top-level classes reflects the intellectual world of a nineteenth-century American college: religion receives a full class, of which the great majority is subdivided for Christianity while all other religions share the remainder; language and literature are separated by class from each other; and computing had to be squeezed into a corner of general works. The scheme has been revised continually, and the revisions can relocate but not rebalance, because the ten-class structure is the thing that cannot change.

D) The alternative approach abandons the single hierarchy. A faceted classification, developed most fully by the Indian librarian S. R. Ranganathan in the 1930s, analyses a subject into independent aspects — personality, matter, energy, space, time — and builds a class number by combining them in a specified order. This is more expressive, more consistent and capable of describing a subject nobody anticipated, and it has been adopted for shelving almost nowhere, because it produces long numbers that library users cannot remember and staff find slow to file by. Its influence has instead been on databases, where its logic is ubiquitous and its name mostly forgotten.

E) The cost of changing a scheme is what keeps the old ones in place. Reclassifying a collection means assigning a new number to every volume, relabelling it, and physically moving it, in an order that avoids leaving the collection unusable during the process. For a large library this is a project of years and a substantial fraction of an annual budget, and it produces no new material and no visible improvement to a reader who already knew where things were. Libraries have therefore continued with schemes they consider intellectually unsatisfactory, which is an entirely rational choice and looks like inertia.

F) Digital collections removed the constraint and did not remove the scheme. An electronic item can be filed under twenty subjects, retrieved by any word in its text, and reached without reference to any classification at all, and one might have expected classification to become obsolete. It did not, for two reasons. Subject headings remain the only reliable way to find everything on a topic regardless of the words an author chose, which full-text search cannot do. And the shelf survives as a way of encountering a book one was not looking for, which no search interface has reproduced, because a search returns what was asked for and a shelf returns what is adjacent.

G) The most interesting thing about classification is that it cannot be neutral and does not pretend to be. Deciding that a subject is a subdivision of another subject is an intellectual claim, and a scheme is a very large number of such claims frozen into a filing system and then made expensive to revise. Libraries have amended the more indefensible ones, sometimes after long argument, and the structure within which they amend was fixed in 1876 by a young man with a decimal notation and considerable confidence. Every reader who finds a book by its number is using his judgement about how knowledge divides up, which is a remarkable amount of influence for a shelving system to carry.`,
      questions: [
        fromList(
          "matching_information",
          CLASS_PARAGRAPHS,
          "an approach whose real influence has been outside libraries",
          "D",
          "Its influence has instead been on databases, where its logic is ubiquitous and its name mostly forgotten.",
          "Paragraph D describes the influence on databases.",
        ),
        fromList(
          "matching_information",
          CLASS_PARAGRAPHS,
          "why a library keeps a scheme it considers inadequate",
          "E",
          "Libraries have therefore continued with schemes they consider intellectually unsatisfactory, which is an entirely rational choice and looks like inertia.",
          "Paragraph E explains the rational persistence.",
        ),
        fromList(
          "matching_information",
          CLASS_PARAGRAPHS,
          "two things a search interface still cannot do",
          "F",
          "Subject headings remain the only reliable way to find everything on a topic regardless of the words an author chose, which full-text search cannot do.",
          "Paragraph F names both limitations.",
        ),
        fromList(
          "matching_information",
          CLASS_PARAGRAPHS,
          "the property of the notation that mattered most in practice",
          "B",
          "Its great practical virtue is that a number can be extended indefinitely to the right, so a new subject can be inserted without renumbering anything, which for a system governing physical objects is the property that matters most.",
          "Paragraph B names indefinite extension.",
        ),
        fromList(
          "matching_information",
          CLASS_PARAGRAPHS,
          "the reason a shelf can never do what a catalogue does",
          "A",
          "A catalogue can list a book under any number of subjects; a shelf cannot.",
          "Paragraph A states the difference.",
        ),
        ynng(
          "The writer thinks the faceted approach is intellectually superior.",
          "YES",
          "This is more expressive, more consistent and capable of describing a subject nobody anticipated, and it has been adopted for shelving almost nowhere, because it produces long numbers that library users cannot remember and staff find slow to file by.",
          "It is 'more expressive, more consistent'.",
        ),
        ynng(
          "The writer regards libraries' reluctance to reclassify as unreasonable.",
          "NO",
          "Libraries have therefore continued with schemes they consider intellectually unsatisfactory, which is an entirely rational choice and looks like inertia.",
          "It is 'an entirely rational choice'.",
        ),
        ynng(
          "The writer believes digital access has made classification unnecessary.",
          "NO",
          "It did not, for two reasons.",
          "The writer gives two reasons it survived.",
        ),
        ynng(
          "The writer thinks a classification scheme embodies intellectual claims.",
          "YES",
          "Deciding that a subject is a subdivision of another subject is an intellectual claim, and a scheme is a very large number of such claims frozen into a filing system and then made expensive to revise.",
          "It is a set of claims frozen in place.",
        ),
        fromList(
          "matching_sentence_endings",
          CLASS_ENDINGS,
          "A single order has to be imposed on knowledge,",
          "because a physical book can occupy only one position on one shelf.",
          "A library with open shelves must decide where each book stands, and the decision is singular: a physical volume occupies one position, and a reader browsing will find it there or not at all.",
          "The volume has one position only.",
        ),
        fromList(
          "matching_sentence_endings",
          CLASS_ENDINGS,
          "The top-level structure has never been rebalanced,",
          "even though the categories were drawn up by one man in his early twenties.",
          "It was devised in 1876 by Melvil Dewey, then twenty-four and working as a student assistant in a college library, and it is still the scheme most public libraries in the world use.",
          "Dewey was twenty-four when he devised it.",
        ),
        fromList(
          "matching_sentence_endings",
          CLASS_ENDINGS,
          "Changing schemes is prohibitively expensive,",
          "because reclassifying a collection means physically moving every volume in it.",
          "Reclassifying a collection means assigning a new number to every volume, relabelling it, and physically moving it, in an order that avoids leaving the collection unusable during the process.",
          "Every volume must be moved.",
        ),
        fromList(
          "matching_sentence_endings",
          CLASS_ENDINGS,
          "The constraint disappears once an item is electronic,",
          "since a digital catalogue can file the same item under twenty headings.",
          "An electronic item can be filed under twenty subjects, retrieved by any word in its text, and reached without reference to any classification at all, and one might have expected classification to become obsolete.",
          "A digital item has no single place.",
        ),
        fromList(
          "matching_sentence_endings",
          CLASS_ENDINGS,
          "A reader may find something they were not seeking,",
          "which makes browsing a shelf a different act from searching a database.",
          "And the shelf survives as a way of encountering a book one was not looking for, which no search interface has reproduced, because a search returns what was asked for and a shelf returns what is adjacent.",
          "A shelf returns what is adjacent.",
        ),
      ],
    },
  ],
};
