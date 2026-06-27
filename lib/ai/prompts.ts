/**
 * Prompt assembly for the AI service.
 *
 * The grading prompt is assembled FROM the `ielts-examiner` skill — its grading
 * procedure, band descriptors, error taxonomy, and the retrieved calibrated
 * anchors. There is no rubric here; this file is only the plumbing that orders
 * those pieces and pins the JSON output contract (CLAUDE.md §4).
 */

import type { Task2Category } from "@/lib/prompts/types";

import type { Anchor } from "./anchors";
import type { GenerateInput, GradeEssayInput } from "./schema";
import type { GradingSkill } from "./skill";

interface AssembledPrompt {
  system: string;
  user: string;
}

const TR_LABEL: Record<GradeEssayInput["taskType"], string> = {
  task1_academic: "Task Achievement",
  task1_general: "Task Achievement",
  task2: "Task Response",
};

const TASK_LABEL: Record<GradeEssayInput["taskType"], string> = {
  task1_academic: "Academic Writing Task 1 (describe visual data in ~150 words)",
  task1_general: "General Training Writing Task 1 (a letter in ~150 words)",
  task2: "Writing Task 2 (an argumentative essay in ~250 words)",
};

/** The exact JSON the grader must emit — in lockstep with output-schema.json. */
const GRADE_OUTPUT_CONTRACT = `Emit ONE JSON object and nothing else — no prose, no code fence — conforming exactly to this shape:
{
  "overall_band": <number 0-9 in 0.5 steps>,
  "criteria": {
    "TR":  { "band": <0-9>, "evidence": "<quotes/specifics from THIS essay>", "what_caps_it": "<why it is not the next band up; cite a taxonomy fault>", "fix": "<the single highest-value next move>" },
    "CC":  { "band": <0-9>, "evidence": "...", "what_caps_it": "...", "fix": "..." },
    "LR":  { "band": <0-9>, "evidence": "...", "what_caps_it": "...", "fix": "..." },
    "GRA": { "band": <0-9>, "evidence": "...", "what_caps_it": "...", "fix": "..." }
  },
  "score_blocker": { "criterion": "TR|CC|LR|GRA", "why": "<the one thing holding the overall band down>" },
  "band_with_fixes": <realistic band 0-9 if the fixes were applied, >= overall_band>,
  "annotations": [
    { "text": "<EXACT verbatim substring copied from the essay — a few words>", "type": "spelling|grammar|vocabulary|cohesion", "fix": "<the corrected wording>", "note": "<one short line on the rule / why it's wrong>" }
  ]
}
Also emit "annotations": the concrete, in-text mistakes a reader should see highlighted. Each "text" MUST be copied verbatim from the essay (so it can be located) and be short. Classify each as spelling, grammar, vocabulary (weak/imprecise word choice), or cohesion (linking/referencing). Give the corrected "fix" and a one-line "note". Include the most important ones (up to ~30); never invent text that is not in the essay. If the essay is a non-attempt or too short to mark, use an empty array.`;

/** The JSON the model-answer generator must emit for the comparison panel. */
const WRITING_SAMPLES_CONTRACT = `Emit ONE JSON object and nothing else — no prose, no code fence — of this exact shape:
{
  "samples": [
    { "band": 9.0, "title": "Model answer", "essay": "<the full essay text, with \\n\\n between paragraphs>", "highlights": ["<2-4 specifics, each tied to a criterion>"], "to_next": "" }
  ]
}
Emit exactly ONE sample. Do NOT write the band, a title, or any label inside the "essay" text itself — only the essay prose.`;

const CEFR_WRITING_TASK_CONTRACT = `Emit ONE JSON object and nothing else — no prose, no code fence — of this exact shape:
{
  "genre": "<one of the allowed genres>",
  "title": "<short card label, e.g. 'Email · invite a friend'>",
  "prompt": "<the full task the learner reads: the situation in 1-2 sentences, then what to write>",
  "points": ["<content point 1>", "<content point 2>", "<content point 3>"]
}`;

export function buildGradePrompt(
  input: GradeEssayInput,
  skill: GradingSkill,
  anchors: Anchor[],
): AssembledPrompt {
  const anchorBlock = anchors.length
    ? anchors
        .map((a, i) => `--- calibrated anchor ${i + 1} (≈ band ${a.band}) ---\n${a.content}`)
        .join("\n\n")
    : "(No calibrated anchors are available for this task type yet — score strictly from the descriptors.)";

  const system = [
    "You are a calibrated, conservative IELTS Writing examiner.",
    `For this script, the TR criterion is ${TR_LABEL[input.taskType]}.`,
    "Work through the procedure THOROUGHLY in your private reasoning — that is what the thinking budget is for: judge each criterion (TR, CC, LR, GRA) one at a time, quoting evidence from THIS essay and naming the fault that caps it, and calibrate every band against the anchors before you commit to it. Then emit ONLY the final JSON object — no reasoning, no prose, no code fence.",
    "",
    skill.procedure, // includes its own "## Grading procedure" heading
    "",
    "## Band descriptors — score ONLY against these",
    // Academic Task 1 is a data description with its own descriptors; never grade
    // it on the Task 2 table (CLAUDE.md grading-accuracy principle).
    skill.rubricFor(input.taskType),
    "",
    "## Error taxonomy — use to name what caps each criterion",
    skill.errorTaxonomy,
    "",
    "## CEFR & lexical calibration — corroboration ONLY, never overrides the descriptors",
    skill.cefrVocabulary,
    "",
    "## Calibrated anchors — keep your numbers consistent with these",
    anchorBlock,
    "",
    "## Output",
    GRADE_OUTPUT_CONTRACT,
  ].join("\n");

  // Hand the grader the exact length so it never has to count, and can apply the
  // length & attempt gate deterministically (a fragment must not score ~4.0).
  const wordCount = input.essayText.trim().split(/\s+/).filter(Boolean).length;
  const minWords = input.taskType === "task2" ? 250 : 150;

  // Academic Task 1: hand the grader the figure's exact data so it can judge
  // whether the student reported the key features and comparisons ACCURATELY —
  // the heart of Task Achievement. Without it the grader can't check accuracy.
  const figureBlock =
    input.taskType === "task1_academic" && input.figure?.trim()
      ? [
          "",
          "FIGURE THE STUDENT DESCRIBED (the ground truth — check their data against it):",
          input.figure.trim(),
        ]
      : [];

  const user = [
    `Task type: ${TASK_LABEL[input.taskType]}`,
    `Word count: ${wordCount} (task minimum: ${minWords}). Apply the length & attempt gate FIRST.`,
    "",
    "PROMPT THE STUDENT ANSWERED:",
    input.promptText,
    ...figureBlock,
    "",
    "STUDENT ESSAY:",
    input.essayText,
  ].join("\n");

  return { system, user };
}

/** How each Task 2 question shape must be constructed. Keyed by the same literals
 *  as the `prompt_category` enum / `Task2Category` type. */
const TASK2_CATEGORY_GUIDE: Record<Task2Category, string> = {
  opinion:
    'Opinion (agree/disagree): state ONE clear, debatable position as a statement, then ask "To what extent do you agree or disagree?"',
  discussion:
    "Discussion (both views): present TWO opposing views on the issue, then ask the candidate to discuss both views and give their own opinion.",
  problem_solution:
    "Problem–solution: describe a situation, trend or problem, then ask for its causes and/or effects and the solutions. Use one consistent framing (e.g. causes + solutions).",
  two_part:
    "Two-part (direct questions): give a short context statement, then ask TWO distinct direct questions the candidate must both answer.",
};

export function buildGeneratePrompt(input: GenerateInput): AssembledPrompt {
  const specLines = Object.entries(input.spec)
    .map(([k, v]) => `- ${k}: ${String(v)}`)
    .join("\n");

  const common =
    "Produce ORIGINAL content in authentic IELTS format. Never reproduce or closely " +
    "paraphrase Cambridge/Oxford/Macmillan books, official past papers, or any " +
    "copyrighted test corpus. Adapt only public-domain or open-licensed source ideas.";

  // In-studio coaching chat. The hard rule: while the student is still writing
  // (phase !== "results") the coach must NOT write any of the answer or hand over a
  // sample, so the grade stays the student's own work (CLAUDE.md: trust/no shortcuts).
  if (input.kind === "writing_tutor") {
    const taskType = String(input.spec.task_type ?? "task2") as GradeEssayInput["taskType"];
    const taskLabel = TASK_LABEL[taskType] ?? "an IELTS Writing task";
    const promptText = String(input.spec.prompt ?? "");
    const draft = String(input.spec.draft ?? "").slice(0, 4000);
    const history = String(input.spec.history ?? "");
    const question = String(input.spec.question ?? "");
    const beforeSubmit = String(input.spec.phase ?? "writing") !== "results";

    const rules = [
      "You are a real, experienced IELTS writing tutor sitting next to one student during practice — warm, direct and human, never robotic or corporate.",
      `They are working on ${taskLabel}.`,
      "Talk the way a great tutor actually talks: plain conversational language, contractions, a little encouragement. Skip stiff filler like 'Certainly!', 'As an AI', or 'I hope this helps', and don't pad answers with long bullet lists unless a list is genuinely the clearest format — usually a short natural paragraph lands better.",
      "Be CONCRETE and decisive. Every reply must leave the student knowing two things: (1) WHAT to write — the actual idea, point, or content to put on the page, named specifically (not 'an example' but the example); and (2) HOW to write it — the structure, the order, the exact phrasing or sentence frame to use. Always SHOW it with a quick before/after or a sample sentence, never just describe it.",
      "BANNED — never reply with empty, vague, or double-meaning advice. Phrases like 'add more detail', 'use better vocabulary', 'make it more specific', 'be clearer', 'expand on this', 'good structure', 'that's the interesting part', 'work on your flow' mean nothing on their own. If you catch yourself about to write one, replace it with the precise change: the exact word to swap and what to swap it to, the exact sentence to add, the specific idea to develop. Say the ONE clear next action, with no hedging.",
      "Help with: understanding the task, brainstorming specific ideas (offer real, usable ones), planning an outline, structure and paragraphing, precise vocabulary, collocations and linking phrases, and grammar. Where useful, say how this plays out in the real exam.",
      beforeSubmit
        ? "IMPORTANT: the student is still writing — coach, don't ghost-write. Do NOT write the essay, a paragraph, or even a full sentence of THEIR answer for them, and do NOT give a full or partial sample/model answer to their task. You may still be fully concrete by teaching the move on a DIFFERENT topic than theirs: show the exact sentence frame or a worked before/after on another subject, then tell them to apply that move to their own. If they ask you to write it or for a model answer, gently decline and point them to the bare outline or the unlocked-after-submit model answer."
        : "The student has already submitted and been graded, so you may now give example sentences, a model paragraph, a full sample answer, and targeted rewrites of their own lines when asked.",
      "Never state or guess their band — the examiner owns scoring. Use only original examples; never reproduce copyrighted test material.",
      "Keep it focused — usually a short paragraph (2–5 sentences); go a little longer only when a worked example genuinely needs it. Reply in the same language the student writes to you in.",
    ];
    const user = [
      "TASK PROMPT:",
      promptText || "(not provided)",
      "",
      draft ? `STUDENT'S DRAFT SO FAR (context only — never rewrite it):\n${draft}` : "The student hasn't written anything yet.",
      history ? `\nRECENT CONVERSATION:\n${history}` : "",
      "",
      `STUDENT'S MESSAGE:\n${question}`,
    ].join("\n");
    return { system: rules.join(" "), user };
  }

  // study_coach — the dashboard study coach. A general IELTS mentor (not tied to one
  // task): what to practise next, planning the run-up to the test, strategy across
  // Writing & Reading, and closing the gap to the target band. Grounded in the
  // learner's dashboard context. Coaching only — never invents a band (CLAUDE.md).
  if (input.kind === "study_coach") {
    const question = String(input.spec.question ?? "");
    const history = String(input.spec.history ?? "");
    const ctx = String(input.spec.context ?? "");

    const rules = [
      "You are a warm, experienced IELTS study coach talking one-to-one with a learner from their dashboard — encouraging, direct and human, never robotic or corporate. Use plain conversational language and contractions; skip stiff filler like 'Certainly!' or 'As an AI'.",
      "Help with the WHOLE journey: what to practise next, how to plan the weeks before the test, strategy for Writing and Reading, how to close the gap to their target band, staying motivated, and exam-day time management.",
      "Be CONCRETE and decisive — name the specific next action (which task type, which weakness, how many, by when), never vague filler like 'practise more' or 'work on weak areas' without saying exactly which and how.",
      "Ground every suggestion in the learner's context below (target band, current bands, weakest areas, days to the test). When relevant, point them to the right place in the product — Writing practice, Reading practice, CEFR practice, the study Plan, or their Activities history.",
      "This product currently covers Writing and Reading; Speaking and Listening are coming soon — say so plainly if asked, and don't pretend to grade them.",
      "Never state or guess their exact band — the examiner owns scoring; talk in terms of what moves them toward the target. Keep replies short and skimmable (usually 2–5 sentences); use a short list only when it's genuinely clearest. Reply in the same language the learner writes in. If they ask something unrelated to IELTS or studying, gently steer back.",
    ];
    const user = [
      ctx ? `LEARNER CONTEXT:\n${ctx}` : "LEARNER CONTEXT: (not provided)",
      history ? `\nRECENT CONVERSATION:\n${history}` : "",
      "",
      `LEARNER'S MESSAGE:\n${question}`,
    ].join("\n");
    return { system: rules.join(" "), user };
  }

  // writing_samples — original band-targeted model answers for the EXACT task, for
  // the "Model answers" comparison panel (the Band-8 sample feature). The GENERATOR
  // writes these (never the grader), and they must sit HONESTLY at their stated band
  // — a Band 7 that is really a 7 — grounded in the calibrated anchors so we never
  // hand the learner an inflated "Band 8" (CLAUDE.md: trust / no inflation).
  if (input.kind === "writing_samples") {
    const taskType = String(input.spec.task_type ?? "task2") as GradeEssayInput["taskType"];
    const taskLabel = TASK_LABEL[taskType] ?? "an IELTS Writing task";
    const promptText = String(input.spec.prompt ?? "");
    const figure = String(input.spec.figure ?? "");
    const anchorBlock = String(input.spec.anchor_block ?? "");
    const words = taskType === "task2" ? "260–290" : "160–190";

    const rules = [
      "You are an experienced IELTS examiner-trainer writing ONE ORIGINAL model answer for teaching.",
      common,
      `Write a SINGLE, exemplary model answer for the candidate's task — ${taskLabel}. It should be the kind of response a top candidate would produce: a fully operational, Band 9-level answer the learner can study to see how the task is done well.`,
      "It must be genuinely excellent (calibrate against the anchors below; never inflate weaker writing): a fully developed argument (or, for Task 1, an overview capturing the truly defining features); cohesion so natural it attracts no attention (carried by logic and reference, not visible signposting like 'Firstly/However'); the EXACT word every time with idiomatic collocation (rarer items only where they are more precise, never decoration); and a wide range of structures used with full flexibility AND accuracy (essentially error-free). Concise because every sentence does work — do not pad it.",
      `The answer should be about ${words} words and read like a real strong candidate, not a template.`,
      taskType === "task1_academic" && figure
        ? `This is Academic Task 1: describe the figure ACCURATELY with an overview plus key comparisons. FIGURE DATA (ground truth — report it correctly):\n${figure}`
        : "",
      "Also give 'highlights': 2–4 short, concrete bullets naming what makes the answer strong, each tied to a criterion (Task Response/Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy) — e.g. 'LR: precise collocations such as \"a marked decline\"'. Leave 'to_next' EMPTY.",
      "Use ONLY original content; never reproduce or closely paraphrase copyrighted test material or published model essays.",
      WRITING_SAMPLES_CONTRACT,
    ].filter(Boolean);

    const user = [
      "CANDIDATE'S TASK (write model answers to THIS exact task):",
      promptText || "(not provided)",
      "",
      anchorBlock ? `CALIBRATED ANCHORS — keep each model answer's band consistent with how these are scored:\n${anchorBlock}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return { system: rules.join(" "), user };
  }

  // cefr_writing_task — an ORIGINAL CEFR practice task generated on demand, pitched
  // to a target level (A1–C2). The level + word target are fixed by the caller; the
  // model invents a fresh situation, an appropriate genre, and the content points
  // the writer must cover. Variety matters (every session is new), so this runs at
  // generation temperature — but it must stay calibrated to the level and original.
  if (input.kind === "cefr_writing_task") {
    const level = String(input.spec.level ?? "B1");
    const genres = String(input.spec.genres ?? "essay");
    const words = String(input.spec.words ?? "");

    const rules = [
      "You are a CEFR writing-test author creating ONE original practice task for a language learner.",
      common,
      `Target CEFR level: ${level}. Pitch the topic, situation, register and the language it demands EXACTLY at ${level} — not easier, not harder. At low levels (A1/A2) keep the situation concrete, personal and simple; at high levels (C1/C2) make it abstract and intellectually demanding.`,
      `Choose ONE genre suitable for this level from: ${genres}. Set a realistic, self-contained situation and tell the learner clearly what to write.`,
      "Give exactly THREE content points the writer must cover — these drive the Content subscale, so make them specific and checkable.",
      words ? `The task must be answerable in about ${words} words.` : "",
      "Keep it globally accessible (no region-specific knowledge required) and write the prompt in clear, level-appropriate English the learner reads directly, like a real exam task.",
      CEFR_WRITING_TASK_CONTRACT,
    ].filter(Boolean);

    return {
      system: rules.join(" "),
      user: `Write one original ${level} CEFR writing task.\nSpec:\n${specLines}`,
    };
  }

  // Academic Task 1 — describe a chart/graph/table. Returns JSON: the rubric the
  // candidate sees + the structured figure data (rendered for them AND fed to the
  // grader). v1 figure kinds: bar, grouped_bar, line, pie, table.
  if (input.kind === "writing_task1_academic") {
    const rules = [
      "You are an IELTS content author writing original Academic Writing Task 1 tasks (describe visual data).",
      common,
      "Invent ONE figure with realistic, ORIGINAL data and a clear story to report — at least one notable trend, contrast, or comparison so there is something to select and highlight. Do NOT copy real published statistics.",
      "Pick the figure kind that best fits the data: 'bar' (one series), 'grouped_bar' (compare 2–4 series across categories), 'line' (change over time), 'pie' (parts of a whole — values should sum to ~100 when the unit is %), or 'table'.",
      "Keep the data internally consistent and the numbers clean/round where natural. Use 3–8 categories and at most 4–5 series so it is readable.",
      "Write prompt_text in the standard register, e.g. 'The chart below shows … .' followed EXACTLY by 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.' Do not ask for opinions or causes.",
      "Make it self-contained and globally accessible (no region-specific knowledge), answerable in ~150 words.",
      TASK1_ACADEMIC_CONTRACT,
    ];
    return {
      system: rules.join(" "),
      user: `Write one IELTS Academic Writing Task 1 task.\nSpec:\n${specLines}`,
    };
  }

  if (input.kind === "writing_prompt") {
    const taskType = String(input.spec.task_type ?? "task2");

    // General Training Task 1 — a letter. Text-only, so generatable today.
    if (taskType === "task1_general") {
      const rules = [
        "You are an IELTS content author writing original General Training Writing Task 1 prompts (letters).",
        common,
        "Describe a realistic everyday situation in 1–2 sentences, then instruct the candidate to write a letter and give THREE clear bullet points they must cover.",
        "End with the standard register cue line, e.g. 'Begin your letter as follows: Dear ...,' and state whether the letter is formal, semi-formal, or informal.",
        "Keep it self-contained and globally accessible (no region-specific knowledge), answerable in ~150 words.",
        "Output ONLY the prompt text a candidate would see — no title, label, word count, or sample answer.",
      ];
      return {
        system: rules.join(" "),
        user: `Write one IELTS General Training Writing Task 1 letter prompt.\nSpec:\n${specLines}`,
      };
    }

    // Task 2 — argumentative essay (the default).
    const category = String(input.spec.category ?? "") as Task2Category;
    const categoryGuide = TASK2_CATEGORY_GUIDE[category];

    const rules = [
      "You are an IELTS content author writing original Writing Task 2 prompts.",
      common,
      categoryGuide
        ? `This prompt MUST be of this type — ${categoryGuide}`
        : "Write a standard Task 2 essay prompt.",
      "Pitch the topic's abstraction and lexis at the target band in the spec.",
      "Keep it self-contained, globally accessible (no region-specific knowledge), and answerable in ~250 words.",
      "Output ONLY the prompt text a candidate would see — no title, label, rubric, word count, or sample answer.",
    ];

    return {
      system: rules.join(" "),
      user: `Write one IELTS Writing Task 2 prompt.\nSpec:\n${specLines}`,
    };
  }

  // reading_tutor — in-test reading coach. The hard rule mirrors the writing coach:
  // DURING the test (phase !== "results") it teaches strategy but must NEVER reveal
  // or work out the answer to a specific question, so the score stays the student's
  // own. After submit it may explain anything. The passage is OUR generated content.
  if (input.kind === "reading_tutor") {
    const passageTitle = String(input.spec.passage_title ?? "");
    const passageBody = String(input.spec.passage_body ?? "").slice(0, 8000);
    const currentQuestion = String(input.spec.current_question ?? "");
    const sectionQuestions = String(input.spec.questions ?? "").slice(0, 4000);
    const history = String(input.spec.history ?? "");
    const question = String(input.spec.question ?? "");
    const beforeSubmit = String(input.spec.phase ?? "reading") !== "results";

    const rules = [
      "You are a real, experienced IELTS Reading tutor sitting with a student during practice — warm, direct and human, not robotic or corporate.",
      "Talk like a real tutor: plain conversational language, contractions, a bit of encouragement. Avoid stiff openers like 'Certainly!' or 'As an AI', and prefer a short natural paragraph over long bullet lists unless a list is genuinely clearest.",
      "Be CONCRETE — point to the actual words in THIS passage and show the move. Tell them WHERE to look (which paragraph, which sentence) and WHAT to compare (the question's words vs. the passage's paraphrase of them), then show the synonym pair so the move is obvious. BANNED: empty advice like 'look for paraphrase', 'read carefully', 'use the context', 'manage your time' on its own — every tip names the exact words or the exact step to take.",
      "Help with reading skills and strategy: skimming for gist, scanning for specific information, spotting paraphrase, the difference between False and Not Given, how to approach each question type (matching headings, True/False/Not Given, sentence/summary completion, multiple choice, matching information), time management, and unfamiliar vocabulary in context.",
      beforeSubmit
        ? "IMPORTANT: the student is still taking the test. Do NOT tell them, confirm, hint at, or work out the answer to ANY specific question, and do NOT say which option/heading is correct or whether a statement is True/False/Not Given. If they ask for an answer (e.g. 'is Q7 True?', 'which heading for paragraph B?'), gently decline and instead teach them HOW to find it themselves — where to look, what to compare, which trap to watch for. Answers unlock after they submit."
        : "The student has already submitted and been graded, so you may now fully explain any question: why the correct answer is right, why each distractor traps, where the proof is in the passage, and how to get better at that question type.",
      "Never state or guess their band — scoring is objective and already handled. Use only the passage provided and original examples; never reproduce copyrighted test material.",
      "Keep it focused — usually a short paragraph (2–5 sentences); a little longer only when a worked example needs it. Reply in the same language the student writes to you in.",
    ];
    const user = [
      `PASSAGE${passageTitle ? ` — ${passageTitle}` : ""}:`,
      passageBody || "(not provided)",
      sectionQuestions
        ? `\nQUESTIONS THE STUDENT CAN SEE (numbered as on screen — these are the answer-free prompts, no keys; ${beforeSubmit ? "before submit, discuss what each asks and how to approach it but do NOT reveal or imply which answer is correct" : "you may now fully explain any of them"}):\n${sectionQuestions}`
        : "",
      currentQuestion ? `\nTHE QUESTION CURRENTLY IN FOCUS:\n${currentQuestion}` : "",
      history ? `\nRECENT CONVERSATION:\n${history}` : "",
      "",
      `STUDENT'S MESSAGE:\n${question}`,
    ].join("\n");
    return { system: rules.join(" "), user };
  }

  // vocabulary_translate — a student selected a word while practicing and wants
  // its meaning in their own language. A bilingual-dictionary lookup that uses the
  // sentence the word appeared in to pick the right SENSE, returned as JSON.
  if (input.kind === "vocabulary_translate") {
    const word = String(input.spec.word ?? "").slice(0, 120);
    const language = String(input.spec.language ?? "").slice(0, 60);
    const context = String(input.spec.context ?? "").slice(0, 600);
    const lang = language || "the requested language";
    const system = [
      "You are a precise bilingual dictionary and IELTS vocabulary tutor.",
      `Translate the given English word or phrase into ${lang}.`,
      "Use the sentence it appeared in to pick the correct sense (e.g. 'bank' of a river vs. a money bank). Give the meaning AS USED in that sentence.",
      `Keep everything short and learner-friendly: a natural translation, the part of speech, a short definition WRITTEN IN ${lang} (at most ~12 words — NOT in English), and ONE short natural example sentence in English showing the word in use (do NOT reuse the student's sentence verbatim).`,
      `Write the translation and the definition in ${lang}'s normal script. If the item is already in ${lang} or is a proper noun with no translation, return it unchanged and say so briefly in the definition.`,
      VOCAB_TRANSLATE_CONTRACT,
    ].join(" ");
    const user = [
      `WORD/PHRASE: ${word}`,
      `TARGET LANGUAGE: ${language || "(not specified)"}`,
      context ? `SENTENCE IT APPEARED IN: ${context}` : "(no surrounding sentence provided)",
    ].join("\n");
    return { system, user };
  }

  // reading_set — original passage + a set of typed, auto-gradeable questions.
  if (input.kind === "reading_set") {
    const system = [
      "You are an IELTS Academic Reading author.",
      common,
      "Write ONE original passage and questions that are objectively answerable FROM THE PASSAGE ALONE — no outside knowledge.",
      "Number questions sequentially from 1 and use ONLY the question types named in the spec.",
      "Group questions by type: keep ALL questions of the same type together in one contiguous numbered block (e.g. Q1–6 True/False/Not Given, then Q7–10 sentence completion) — never interleave types — so each block reads under a single Cambridge-style instruction.",
      "For EVERY question give the single defensible answer AND quote, verbatim, the exact sentence from the passage that justifies it.",
      "true_false_not_given / yes_no_not_given: 'Not Given' (or 'Not Mentioned') means the passage neither confirms nor contradicts the statement — for those, supporting_sentence may be empty.",
      "matching_headings: put the full heading bank in options and the correct heading text in answer; prompt names the paragraph (e.g. 'Paragraph B'). Label passage paragraphs 'A) ', 'B) ', … in body.",
      "matching_information: answer is the paragraph label that contains the information.",
      "sentence_completion / summary_completion: write the candidate-facing 'prompt' as the FULL sentence with the missing word(s) shown as a run of underscores '______' exactly where the answer goes (e.g. 'The research was funded by the ______ government.'). The answer is the exact word(s) copied verbatim from the passage, NO MORE THAN TWO WORDS (and/or a number). Put the gap mid-sentence where natural, not always at the end.",
      "multiple_choice: options are the choices and answer is the exact text of the correct option; make distractors plausible.",
      "Pitch vocabulary and abstraction at the target band in the spec.",
      "CEFR mode: if the spec includes a 'cefr_level' and 'passage_words', this is a CEFR practice text — write a SHORTER original passage of approximately that many words pitched at that CEFR level (A1–C2): use high-frequency vocabulary, shorter and clearer sentences, and a simple linear structure, and write comprehension questions a learner AT that level can answer directly from the text. If no cefr_level is given, write a full-length Academic passage as usual.",
      READING_SET_CONTRACT,
    ].join(" ");
    return { system, user: `Write one IELTS Academic Reading set.\nSpec:\n${specLines}` };
  }

  // reading_validation — the second-pass answer-key checker.
  if (input.kind === "reading_validation") {
    const passage = String(input.spec.passage ?? "");
    const questions = JSON.stringify(input.spec.questions ?? [], null, 2);
    const system = [
      "You are a meticulous IELTS Reading answer-key checker.",
      "For EACH question, verify the proposed answer is correct AND uniquely supported by the passage text.",
      "Be conservative: if the passage does not clearly and uniquely entail the answer, mark it 'ambiguous' or 'unsupported' with LOW confidence. Verify the supporting_sentence actually appears in the passage and justifies the answer.",
      "Judge only — do not rewrite the questions or the passage.",
      READING_VALIDATION_CONTRACT,
    ].join(" ");
    return {
      system,
      user: `PASSAGE:\n${passage}\n\nQUESTIONS + PROPOSED ANSWERS (JSON):\n${questions}`,
    };
  }

  // reading_passage (legacy generic passage-only path).
  return {
    system:
      "You are an IELTS content author writing Academic Reading passages. " +
      common +
      " The passage must read like a real exam text and support auto-gradeable questions.",
    user: `Write one original IELTS Reading passage.\nSpec:\n${specLines}`,
  };
}

/** The exact JSON an Academic Task 1 task must emit — in lockstep with the zod
 *  schema in lib/writing/figure.ts (figureSchema). */
const TASK1_ACADEMIC_CONTRACT = `Emit ONE JSON object and nothing else — no prose, no code fence — exactly:
{
  "prompt_text": "<what the candidate sees, ending with 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'>",
  "figure": <one of the shapes below>
}
Figure shapes (choose exactly ONE "kind"):
- bar / grouped_bar / line:
  { "kind": "bar"|"grouped_bar"|"line", "title": "<short caption>", "x_label": "<optional>", "y_label": "<optional>", "unit": "<e.g. %, millions, °C — optional>", "categories": ["<3-8 x-axis labels>"], "series": [ { "name": "<series label>", "values": [<one number PER category>] } ] }
  (single-series → "bar" or "line"; 2-5 series → "grouped_bar" or "line". Every series MUST have exactly one value per category.)
- pie:
  { "kind": "pie", "title": "<short caption>", "unit": "<usually %>", "slices": [ { "label": "<slice>", "value": <number> } ] }
  (2-8 slices; when unit is % the values should sum to ~100.)
- table:
  { "kind": "table", "title": "<short caption>", "unit": "<optional>", "columns": ["<2-6 headers>"], "rows": [ ["<cell>", <number>, …] ] }
  (each row MUST have exactly one cell per column; cells are strings or numbers.)
All numbers must be plain JSON numbers (no "%", "m", or commas inside the number).`;

/** The exact JSON a vocabulary lookup must emit — parsed in app/api/vocabulary. */
const VOCAB_TRANSLATE_CONTRACT = `Emit ONE JSON object and nothing else — no prose, no code fence — exactly:
{
  "translation": "<the word/phrase in the target language>",
  "part_of_speech": "<noun|verb|adjective|adverb|phrase|… — short, or empty>",
  "definition": "<meaning AS USED in the sentence, written in the TARGET language, ≤ ~12 words>",
  "example": "<one short, natural example sentence in English>"
}`;

/** The exact JSON a reading SET must emit — in lockstep with the zod schema in
 *  lib/reading/types.ts (readingSetOutputSchema). */
const READING_SET_CONTRACT = `Emit ONE JSON object and nothing else — no prose, no code fence — exactly:
{
  "title": "<short passage title>",
  "body": "<the full passage; if questions reference paragraphs, prefix each paragraph with 'A) ', 'B) ' …>",
  "questions": [
    {
      "type": "<one of the requested question types>",
      "number": <int, sequential from 1>,
      "prompt": "<the statement or question the candidate sees>",
      "options": ["<choice or heading>", "…"] ,
      "answer": "<the single defensible answer key>",
      "supporting_sentence": "<verbatim sentence from the passage that justifies the answer; empty only for Not Given>",
      "explanation": "<one line: why this is the answer / why a distractor is a trap>"
    }
  ]
}
Set "options" to null for question types that have no options (true/false/not given, completion).`;

/** The exact JSON the validation pass must emit — in lockstep with
 *  readingValidationOutputSchema. */
const READING_VALIDATION_CONTRACT = `Emit ONE JSON object and nothing else — no prose, no code fence — exactly:
{
  "items": [
    {
      "number": <int matching the question>,
      "verdict": "correct" | "incorrect" | "ambiguous" | "unsupported",
      "confidence": <number 0..1>,
      "corrected_answer": "<your answer if the proposed key is wrong, else null>",
      "supporting_sentence_ok": <true if the cited sentence is in the passage and justifies the answer>,
      "note": "<one line on any problem; empty if fine>"
    }
  ]
}`;
