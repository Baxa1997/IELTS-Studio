import { gapFill, mcq, noteLine, tfng, ynng, type CuratedPassage } from "./shared";

const ETHER_NOTES = {
  title: "The 1846 demonstration",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

export const ANAESTHESIA: CuratedPassage = {
  key: "anaesthesia",
  title: "The Gas That Was Laughed At First",
  topic: "why surgery without pain arrived decades after the means existed",
  difficulty: 7,
  body: `Before 1846 a surgical operation was conducted on a conscious patient who had to be held down. The consequence was that surgery was limited to what could be done in a very short time — an amputation, a stone cut from the bladder, a tooth — and the surgeon's most admired quality was speed. Operations on the chest and the abdomen were essentially impossible, not because surgeons could not imagine them but because nobody could perform them on somebody who was struggling.

What makes the history uncomfortable is that the means had been available for decades. Nitrous oxide was identified in 1772 and its effects described in 1800 by Humphry Davy, who noted explicitly that it appeared to destroy physical pain and might be used during surgical operations. Nobody acted on the suggestion for forty-four years. The gas was instead used for entertainment: travelling showmen administered it at public demonstrations, and ether was inhaled at parties for the same reason.

The first person to use it surgically was a dentist. Horace Wells attended such a demonstration in 1844 and noticed that a participant under the influence of the gas injured his leg badly and reported feeling nothing. The following day Wells had a colleague extract one of his own teeth while he inhaled it, and felt nothing. His public demonstration at a Boston hospital in 1845 went wrong — the patient cried out, whether from pain or from the semi-conscious agitation the gas can produce — and Wells was dismissed as a fraud.

The successful demonstration came a year later, with a different agent. William Morton, a dentist who had worked with Wells, used ether, which is more potent and easier to administer, on a patient having a tumour removed from his neck at the same hospital. The patient did not move. The surgeon, who had been openly sceptical, turned to the audience and said that it was no humbug. News of the operation reached Britain within two months and the procedure was in use in London before the end of the year.

Several explanations have been offered for the long delay, and the least satisfying is that nobody thought of it, since Davy had written it down. A more plausible account has two parts. The first is that pain was widely believed to be a necessary accompaniment of healing, and its removal was regarded in some quarters as interfering with a natural process; the second is that the agents were associated with entertainment and with people of no medical standing, and an idea carried by a showman is not an idea a professional adopts.

That second factor is visible in what happened next. Once a hospital surgeon had used ether in front of an audience of surgeons, adoption was almost immediate, and the same substances that had been dismissed for a generation became standard within a year. Nothing had changed about the chemistry. What changed was who was holding the mask.

The subsequent history is one of managing risk. Ether is flammable and irritates the airway; chloroform, introduced in 1847, is pleasanter to inhale and has a much narrower margin between the dose that anaesthetises and the dose that stops the heart, and it killed patients unpredictably for a century before it was abandoned. The modern specialty exists because the substances are dangerous: an anaesthetist is present throughout not to start the process but to manage a physiology that is being deliberately suppressed.

The change to what surgery could attempt followed immediately. Operations on the abdomen, which had been attempted only in desperation, became routine within a generation; the chest took longer, because opening it collapses the lung and that required a separate solution. It is worth noting that the other precondition for modern surgery — antisepsis — arrived twenty years later, and that the interval between them was the most dangerous period in the history of the operating theatre: surgeons could now work slowly and deep inside the body, in wounds they had no means of keeping clean.

There remains one unresolved question at the centre of the field. Anaesthetic agents are chemically diverse — gases, steroids, barbiturates, molecules with almost nothing in common — and they produce the same state. How they do it is still argued about, with theories divided between effects on the lipid membrane and effects on specific protein receptors. Several million people a year are rendered reliably unconscious by a process that is understood at the level of what works rather than of why.`,
  questions: [
    tfng(
      "Surgeons before 1846 were valued mainly for how quickly they worked.",
      "TRUE",
      "The consequence was that surgery was limited to what could be done in a very short time — an amputation, a stone cut from the bladder, a tooth — and the surgeon's most admired quality was speed.",
      "Speed was 'the surgeon's most admired quality'.",
    ),
    tfng(
      "Davy recognised that nitrous oxide might be useful in surgery.",
      "TRUE",
      "Nitrous oxide was identified in 1772 and its effects described in 1800 by Humphry Davy, who noted explicitly that it appeared to destroy physical pain and might be used during surgical operations.",
      "He noted it 'might be used during surgical operations'.",
    ),
    tfng(
      "Wells tested the gas on a patient before trying it himself.",
      "FALSE",
      "The following day Wells had a colleague extract one of his own teeth while he inhaled it, and felt nothing.",
      "He tested it on himself first.",
    ),
    tfng(
      "Morton used the same substance that Wells had demonstrated.",
      "FALSE",
      "William Morton, a dentist who had worked with Wells, used ether, which is more potent and easier to administer, on a patient having a tumour removed from his neck at the same hospital.",
      "Morton used ether, not nitrous oxide.",
    ),
    tfng(
      "News of the successful demonstration took over a year to reach Britain.",
      "FALSE",
      "News of the operation reached Britain within two months and the procedure was in use in London before the end of the year.",
      "It arrived 'within two months'.",
    ),
    tfng(
      "Chloroform was safer to administer than ether.",
      "FALSE",
      "Ether is flammable and irritates the airway; chloroform, introduced in 1847, is pleasanter to inhale and has a much narrower margin between the dose that anaesthetises and the dose that stops the heart, and it killed patients unpredictably for a century before it was abandoned.",
      "Its margin of safety was 'much narrower'.",
    ),
    ynng(
      "The writer thinks the delay is explained by nobody having had the idea.",
      "NO",
      "Several explanations have been offered for the long delay, and the least satisfying is that nobody thought of it, since Davy had written it down.",
      "That explanation is 'the least satisfying'.",
    ),
    ynng(
      "The writer believes the status of the people involved affected adoption.",
      "YES",
      "Nothing had changed about the chemistry. What changed was who was holding the mask.",
      "What changed was 'who was holding the mask'.",
    ),
    ynng(
      "The writer considers the mechanism of anaesthesia to be settled.",
      "NO",
      "How they do it is still argued about, with theories divided between effects on the lipid membrane and effects on specific protein receptors.",
      "It is 'still argued about'.",
    ),
    noteLine(
      ETHER_NOTES,
      null,
      "Morton used ______ rather than nitrous oxide",
      "ether",
      "William Morton, a dentist who had worked with Wells, used ether, which is more potent and easier to administer, on a patient having a tumour removed from his neck at the same hospital.",
      "He 'used ether'.",
    ),
    noteLine(
      ETHER_NOTES,
      null,
      "A ______ was removed from the patient's neck",
      "tumour",
      "William Morton, a dentist who had worked with Wells, used ether, which is more potent and easier to administer, on a patient having a tumour removed from his neck at the same hospital.",
      "The operation removed a tumour.",
      { before: [{ text: "What happened in the operating theatre:", indent: 0 }] },
    ),
    noteLine(
      ETHER_NOTES,
      null,
      "The sceptical ______ told the audience it was no humbug",
      "surgeon",
      "The surgeon, who had been openly sceptical, turned to the audience and said that it was no humbug.",
      "'The surgeon, who had been openly sceptical' said so.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Before medical use, the gases were administered by ______ at public shows.",
      "showmen",
      "The gas was instead used for entertainment: travelling showmen administered it at public demonstrations, and ether was inhaled at parties for the same reason.",
      "'Travelling showmen administered it'.",
    ),
    mcq(
      "Why does the passage say the modern specialty exists?",
      [
        "Because the substances used are dangerous",
        "Because operations have become longer",
        "Because patients request a specialist",
        "Because the mechanism is not understood",
      ],
      "Because the substances used are dangerous",
      "The modern specialty exists because the substances are dangerous: an anaesthetist is present throughout not to start the process but to manage a physiology that is being deliberately suppressed.",
      "It exists 'because the substances are dangerous'.",
    ),
  ],
};
