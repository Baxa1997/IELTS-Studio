/**
 * Writing Task 2 essays for the curated practice set (see ../starter-set).
 *
 * Built on the SHAPE of the real exam, never its content (CLAUDE.md §IP — no
 * question here is taken from a test book or a "recent exam questions" list):
 *
 *   - All six question shapes, weighted towards opinion and discussion, which
 *     appear most often (Cambridge 19–21: opinion 5 of 12, discussion 2,
 *     positive/negative 2, and one each of the rest).
 *   - Topics weighted the way reported 2023–26 prompts are: education,
 *     technology, environment, health, government/society and crime make up
 *     roughly 85%, with the 2025–26 additions — AI at work, housing costs, the
 *     four-day week, screen time, online fraud.
 *   - Specific rather than generic wording. Since the 2025 examiner retraining,
 *     prompts name the technology or policy in question so that a memorised
 *     "technology essay" does not fit, and TR is capped hard when it is used.
 *
 * One paragraph each, the same house style as the original starter prompts, so
 * the studio shows the whole question at full size.
 */

import type { Task2Category } from "@/lib/prompts/constants";

import type { StarterPrompt } from "./shared";

function essay(
  category: Task2Category,
  topic_family: string,
  difficulty: number,
  prompt_text: string,
): StarterPrompt {
  return { task_type: "task2", category, topic_family, difficulty, prompt_text };
}

export const CURATED_TASK2: StarterPrompt[] = [
  // ---- Education -----------------------------------------------------------
  essay(
    "opinion",
    "education",
    6,
    "Some people argue that secondary schools should replace traditional written exams with long-term projects that students complete over several months. To what extent do you agree or disagree?",
  ),
  essay(
    "discussion",
    "education",
    7,
    "Some people believe that university education should be paid for entirely by the government, while others think graduates should repay the cost once they start earning a salary. Discuss both these views and give your own opinion.",
  ),
  essay(
    "advantages_disadvantages",
    "education",
    6,
    "Many schools now give every student a tablet or laptop and set most homework online rather than on paper. Do the advantages of this outweigh the disadvantages?",
  ),
  essay(
    "positive_negative",
    "education",
    7,
    "A growing number of students use AI chatbots to help them plan and write their school assignments. Is this a positive or negative development?",
  ),
  essay(
    "problem_solution",
    "education",
    6,
    "In many countries, large numbers of teachers leave the profession within a few years of qualifying. What are the causes of this problem, and what measures could be taken to keep teachers in their jobs?",
  ),
  essay(
    "two_part",
    "education",
    7,
    "More young people are choosing to take a year off between finishing school and starting university. Why do they make this choice? Is it a sensible way to spend that year?",
  ),
  essay(
    "opinion",
    "education",
    5,
    "Some people think that primary school children should not be given any homework, so that they have more time to play and rest. To what extent do you agree or disagree?",
  ),
  essay(
    "opinion",
    "education",
    8,
    "Some educators argue that learning to write computer code should be as compulsory at school as learning mathematics. To what extent do you agree or disagree?",
  ),
  essay(
    "discussion",
    "education",
    5,
    "Some parents think children learn best at single-sex schools, while others believe mixed schools prepare them better for adult life. Discuss both these views and give your own opinion.",
  ),

  // ---- Technology ----------------------------------------------------------
  essay(
    "opinion",
    "technology",
    7,
    "Some people believe that the companies which build artificial intelligence systems should be legally responsible for any harm those systems cause. To what extent do you agree or disagree?",
  ),
  essay(
    "advantages_disadvantages",
    "technology",
    7,
    "In a growing number of workplaces, routine tasks such as writing reports and answering customer emails are now done by AI software instead of by employees. Do the advantages of this outweigh the disadvantages?",
  ),
  essay(
    "positive_negative",
    "technology",
    6,
    "More and more people pay for everything with their phones or bank cards, and some shops no longer accept cash at all. Do you think this is a positive or negative development?",
  ),
  essay(
    "two_part",
    "technology",
    6,
    "Many people now spend several hours a day on social media. Why do people find it so difficult to stop using these platforms? What effects does this have on their daily lives?",
  ),
  essay(
    "discussion",
    "technology",
    8,
    "Some people argue that the police should be allowed to use facial recognition cameras in public places to prevent crime, while others see this as an unacceptable invasion of privacy. Discuss both these views and give your own opinion.",
  ),
  essay(
    "opinion",
    "technology",
    5,
    "Some people think that children under the age of 14 should not be allowed to own a smartphone. To what extent do you agree or disagree?",
  ),
  essay(
    "problem_solution",
    "technology",
    7,
    "Many older people find it increasingly difficult to use everyday services, such as banking and booking medical appointments, now that these have moved online. What problems does this cause, and what solutions can you suggest?",
  ),
  essay(
    "advantages_disadvantages",
    "technology",
    8,
    "Some universities and companies now hold classes and meetings in virtual reality, where people meet as digital avatars rather than face to face. Do the advantages of this outweigh the disadvantages?",
  ),
  essay(
    "opinion",
    "technology",
    6,
    "Some people think that streaming services, which allow viewers to watch an entire series in one sitting, have made people less patient and less able to concentrate. To what extent do you agree or disagree?",
  ),

  // ---- Environment ---------------------------------------------------------
  essay(
    "opinion",
    "environment",
    6,
    "Some people believe that air travel should be made much more expensive in order to reduce its impact on the environment. To what extent do you agree or disagree?",
  ),
  essay(
    "discussion",
    "environment",
    7,
    "Some people think the best way to protect endangered animals is to keep them in zoos and breeding centres, while others believe the money should be spent on protecting their natural habitats instead. Discuss both these views and give your own opinion.",
  ),
  essay(
    "problem_solution",
    "environment",
    5,
    "In many cities, large amounts of plastic packaging are thrown away every day. What problems does this cause, and what can be done to reduce it?",
  ),
  essay(
    "advantages_disadvantages",
    "environment",
    8,
    "Some governments plan to ban the sale of new petrol and diesel cars within the next ten years, so that only electric vehicles can be bought. Do the advantages of this policy outweigh the disadvantages?",
  ),
  essay(
    "positive_negative",
    "environment",
    6,
    "Buying second-hand clothes instead of new ones is becoming increasingly popular among young people. Is this a positive or negative development?",
  ),
  essay(
    "two_part",
    "environment",
    8,
    "In some regions, farmland is being allowed to return to its natural state so that wild plants and animals can recover. Why are some people in favour of this approach? Should it ever take priority over producing food?",
  ),
  essay(
    "opinion",
    "environment",
    7,
    "Some people think every new building should be required by law to produce as much energy as it uses, even if this makes housing more expensive. To what extent do you agree or disagree?",
  ),
  essay(
    "problem_solution",
    "environment",
    7,
    "Many cities are becoming noticeably hotter in summer because of concrete, traffic and a lack of green space. What problems does this cause for residents, and what measures could be taken to cool cities down?",
  ),

  // ---- Health --------------------------------------------------------------
  essay(
    "opinion",
    "health",
    5,
    "Some people believe that fast-food restaurants should not be allowed to open near schools. To what extent do you agree or disagree?",
  ),
  essay(
    "discussion",
    "health",
    6,
    "Some people think mental health should be taught as a compulsory subject at school, while others believe it is the responsibility of families and doctors. Discuss both these views and give your own opinion.",
  ),
  essay(
    "problem_solution",
    "health",
    8,
    "In many countries, patients now wait longer than ever to see a doctor or receive hospital treatment. What are the causes of this, and what measures could governments take to shorten waiting times?",
  ),
  essay(
    "positive_negative",
    "health",
    7,
    "Many people now use smartwatches and phone apps to track their sleep, diet and exercise every day. Is this a positive or negative development?",
  ),
  essay(
    "two_part",
    "health",
    5,
    "Many adults sleep much less than the recommended seven to eight hours a night. Why is this happening? What can people do to improve their sleep?",
  ),
  essay(
    "advantages_disadvantages",
    "health",
    6,
    "Some doctors now see patients through video calls rather than in face-to-face appointments. Do the advantages of this outweigh the disadvantages?",
  ),

  // ---- Government ----------------------------------------------------------
  essay(
    "opinion",
    "government",
    8,
    "Some people argue that governments should introduce a universal basic income: a regular payment made to every adult, whether or not they work. To what extent do you agree or disagree?",
  ),
  essay(
    "discussion",
    "government",
    7,
    "Some people believe governments should fund large scientific projects such as space missions, while others think public money should only be spent on projects with immediate practical benefits. Discuss both these views and give your own opinion.",
  ),
  essay(
    "advantages_disadvantages",
    "government",
    7,
    "In some countries, voting in national elections is compulsory, and adults who do not vote have to pay a fine. Do the advantages of this outweigh the disadvantages?",
  ),
  essay(
    "opinion",
    "government",
    6,
    "Some people think local governments should spend more money on public parks and sports facilities than on new shopping centres and car parks. To what extent do you agree or disagree?",
  ),

  // ---- Society -------------------------------------------------------------
  essay(
    "problem_solution",
    "society",
    7,
    "In many cities, rents and house prices have risen so quickly that young adults cannot afford to move out of their parents' homes. What problems does this cause, and what solutions can you suggest?",
  ),
  essay(
    "positive_negative",
    "society",
    5,
    "In many countries, more people are choosing to live alone than ever before. Is this a positive or negative development?",
  ),
  essay(
    "opinion",
    "society",
    7,
    "Some people believe that supermarkets and restaurants should be required by law to give their unsold food to charities instead of throwing it away. To what extent do you agree or disagree?",
  ),
  essay(
    "two_part",
    "society",
    6,
    "In many communities, people know far fewer of their neighbours than they did in the past. Why has this happened? What can be done to bring local communities closer together?",
  ),

  // ---- Crime ---------------------------------------------------------------
  essay(
    "opinion",
    "crime",
    6,
    "Some people think that young people who commit minor crimes should do unpaid work in the community instead of being sent to prison. To what extent do you agree or disagree?",
  ),
  essay(
    "discussion",
    "crime",
    8,
    "Some people believe the main purpose of prison is to punish criminals, while others think it should be to prepare them to return to society as law-abiding citizens. Discuss both these views and give your own opinion.",
  ),
  essay(
    "problem_solution",
    "crime",
    6,
    "Online fraud, such as fake shopping websites and scam text messages, is becoming more common. Why is this happening, and what can be done to protect people from it?",
  ),
  essay(
    "positive_negative",
    "crime",
    8,
    "In some cities, the police use computer programs to predict where crimes are most likely to happen and send officers there in advance. Is this a positive or negative development?",
  ),
  essay(
    "two_part",
    "crime",
    7,
    "In some countries, the number of teenagers involved in crime is rising. What are the reasons for this? What role should parents and schools play in preventing it?",
  ),

  // ---- Work ----------------------------------------------------------------
  essay(
    "discussion",
    "work",
    6,
    "Some people think a four-day working week would make employees happier and more productive, while others believe it would harm businesses and the economy. Discuss both these views and give your own opinion.",
  ),
  essay(
    "opinion",
    "work",
    8,
    "Some people argue that companies should be required by law to publish how much they pay each of their employees. To what extent do you agree or disagree?",
  ),
  essay(
    "advantages_disadvantages",
    "work",
    5,
    "More and more people work as freelancers, choosing their own projects instead of working for one employer. Do the advantages of this outweigh the disadvantages?",
  ),
  essay(
    "opinion",
    "work",
    7,
    "Some people believe employers should judge job applicants only on their skills and experience, not on whether they have a university degree. To what extent do you agree or disagree?",
  ),

  // ---- Culture, tourism, family, media, transport --------------------------
  essay(
    "discussion",
    "culture",
    8,
    "Some people believe that when a historic building is badly damaged, it should be rebuilt exactly as it was, while others think it is better to replace it with a modern design. Discuss both these views and give your own opinion.",
  ),
  essay(
    "positive_negative",
    "culture",
    6,
    "In many countries, young people know more about international films and music than about the traditional arts of their own culture. Is this a positive or negative development?",
  ),
  essay(
    "advantages_disadvantages",
    "tourism",
    8,
    "Some popular tourist cities now limit the number of visitors allowed into their historic centres each day. Do the advantages of this outweigh the disadvantages?",
  ),
  essay(
    "positive_negative",
    "family",
    5,
    "In many families, grandparents now look after young children every day while both parents work full-time. Is this a positive or negative development?",
  ),
  essay(
    "problem_solution",
    "media",
    7,
    "False news stories now spread online faster than ever, and many people find it hard to tell reliable information from misinformation. What problems does this cause, and what can be done to address it?",
  ),
  essay(
    "opinion",
    "transport",
    7,
    "Some people think private cars should be banned from city centres, leaving the streets to public transport, bicycles and pedestrians. To what extent do you agree or disagree?",
  ),
];
