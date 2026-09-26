import type { DocsCopy } from "./types";

/**
 * English — the SOURCE copy for both guides. `uz.ts` and `ru.ts` are typed
 * against `DocsCopy`, so anything added here fails their compile until it is
 * translated.
 *
 * ⚠️ THIS IS WRITTEN AGAINST THE CODE, NOT AGAINST THE PITCH — the rule the
 * centre guide was built under and the one thing that keeps it honest. Every
 * capability named here was checked in the console first, and the two that do
 * not exist yet are marked SOON by the page rather than quietly implied.
 * When the console gains or loses a feature, this file is what goes stale
 * first, and it goes stale in three languages at once.
 */
export const en: DocsCopy = {
  learner: {
    meta: {
      title: "How to use EngProgress — a guide for learners",
      ogTitle: "How to use EngProgress",
      description:
        "What EngProgress is and how it works: original IELTS and CEFR practice generated on demand at your level, marked criterion by criterion against the official descriptors, across Writing, Reading, Listening and Speaking.",
    },
    head: {
      kicker: "Documentation · for learners",
      title: "How to use EngProgress",
      lede: "An AI examiner for IELTS and the Multilevel exam, from complete beginner to Band 9: original practice written for you on demand, a tutor beside you while you work, and the next half band spelled out.",
    },
    label: "How to use EngProgress",
    elsewhere: "For education centers",
    overview: [
      "EngProgress is an AI examiner for IELTS and for the Uzbek Multilevel (CEFR) exam. It writes practice for you, marks it against the official criteria, and tells you the one thing standing between the band you got and the next half band up. All four IELTS skills are live — Writing, Reading, Listening and Speaking — and the Multilevel exam has its own Reading and Writing papers in their own format rather than IELTS with the labels changed.",
      "It starts wherever you are. If you have never sat the exam and would score a 4, the first tasks are written at a 4 and the coaching assumes nothing; if you are pushing from 7.5 to a 9, they are written there instead. There is no entry level to clear before the platform is useful to you, and no ceiling once you are good.",
      "It is built for someone preparing on their own. Nothing waits on a teacher: you ask for a task, it is generated and served immediately, and the report comes back in the same sitting. You are not left alone with it either — you can ask the tutor for help in the middle of a task, and it will answer without giving the answer away. Education centers run the same platform with teachers, groups and assigned homework on top of it — that has its own guide, linked at the foot of this page.",
      "The part worth understanding before anything else is the marking. Every competitor can put a band on an essay; the number is only worth having if it survives exam day. So the grader is calibrated to sit slightly low: when your work falls between two bands it gives you the lower one and names precisely what the higher one was missing. A 6.5 here is meant to be a real 6.5 in the exam hall, and being told you are not there yet is far cheaper than finding out in July.",
    ],
    featuresHeading: "Key features",
    features: [
      {
        title: "All four skills, plus CEFR",
        body: "Writing, Reading, Listening and Speaking are all live and all graded. The Multilevel Reading and Writing papers run alongside them in their own format.",
      },
      {
        title: "The Cambridge format, unlimited",
        body: "Every part, question type and layout of the official practice-book format — but generated, so you never run out and never re-sit one you can half remember.",
      },
      {
        title: "Original content, generated on demand",
        body: "No past papers, ever. Every passage, prompt, recording and question is written for you when you ask for it, so there is nothing to memorise in advance — and nothing that infringes anyone's copyright.",
      },
      {
        title: "Beginner to Band 9",
        body: "There is no level you have to reach before this is useful. Reading reads your measured band off your own results and builds around it; Listening and Writing take the level you ask for, from a first ever attempt up to a Band 9 push.",
      },
      {
        title: "Coaching while you practise",
        body: "A tutor you can ask mid-task — what to put in this paragraph, where to look in this passage — that teaches the move without handing over the answer while the clock is running.",
      },
      {
        title: "Marked criterion by criterion",
        body: "Each criterion gets its own band, so you can see which one is holding the score down instead of guessing at a single number.",
      },
      {
        title: "Evidence, not opinions",
        body: "Every criterion quotes the sentence from your own work that it is judging. You can check the marking rather than take it on trust.",
      },
      {
        title: "Deliberately conservative",
        body: "Sitting between two bands, it rounds down and states what the higher one needs. A band you can repeat on exam day is worth more than a flattering one.",
      },
      {
        title: "The revision loop",
        body: "Rewrite the same essay and submit it again. It is re-marked against the same task, so you watch the band move — not a fresh prompt and a fresh guess.",
      },
      {
        title: "Wrong answers explained",
        body: "In Reading and Listening a miss is explained: what the text actually said, and why the distractor looked right. That is the part that changes your next attempt.",
      },
      {
        title: "Progress that keeps itself",
        body: "A band per skill, re-derived as you practise, with the weakest surfaced. Every graded attempt stays in your history with its full report exactly as written.",
      },
      {
        title: "Try it without an account",
        body: "The free grader takes a pasted essay and returns a band and the first fix, with no sign-up.",
      },
    ],
    callout: {
      kicker: "The idea the rest of it rests on",
      body: "There is no question bank here and no set of tests to work through. Every task is written the moment you ask for it, and the level it is written at comes from you — your measured band for a reading paper, the level you pick for a listening test, a topic and question shape you have not been given before for an essay. Two learners practising on the same day sit different papers, and you never sit the same one twice.",
    },
    startHeading: "Getting started",
    steps: [
      {
        title: "Find your real band",
        body: "Paste an essay into the free grader, or sit a full task once you have an account. You get a band and the criterion that is holding it down.",
      },
      {
        title: "Practise on demand",
        body: "Ask for a task in any of the four skills. It is written for you at your level and marked against the official criteria — never a past paper, so nothing can be memorised.",
      },
      {
        title: "Close the gap",
        body: "Every report names what is missing for the next half band and the work that fixes it. Rewrite the same essay, resubmit it, and find out whether the band actually moved.",
      },
    ],
    tabs: {
      overview: {
        title: "Overview",
        lede: "What EngProgress is, what it gives you, and the three steps from a first essay to a band you can trust.",
      },
      writing: {
        title: "Writing",
        lede: "Task 1 and Task 2, marked the way an examiner marks them — a band per criterion, with the words from your own essay that earned it.",
        how: "Ask for a task and one is written on the spot. The generator draws a topic family from the fourteen it rotates through — environment, education, technology, health, work, society, government, globalisation, crime, media, culture, transport, tourism — and, for Task 2, one of the six question shapes the real exam uses: opinion, discussion, problem–solution, two-part, advantages versus disadvantages, and positive or negative development. Before serving it, it checks every prompt you have already been given and every essay you have already written, so the same question never comes round twice. Academic Task 1 goes a step further and draws the chart itself — and the grader is handed that same chart, so it marks the figure you actually saw rather than somebody's description of it.",
        points: [
          {
            title: "Four criteria, separately",
            body: "Task Response, Coherence & Cohesion, Lexical Resource and Grammatical Range each get their own band, so you know which one is capping you.",
          },
          {
            title: "What caps it, and the fix",
            body: "Each criterion says what is holding it at that band and the specific change that would lift it — not general advice about linking words.",
          },
          {
            title: "The revision loop",
            body: "Resubmit the same essay against the same task. Nothing else about the marking changes, so any movement in the band came from your rewrite.",
          },
          {
            title: "A band 9 answer to compare",
            body: "A model answer to the same prompt, so you can see what the criteria look like when they are all met at once.",
          },
        ],
      },
      reading: {
        title: "Reading",
        lede: "Original passages in the exam format, every real question type, marked the moment you submit.",
        how: "This is the skill that reads your level off your own results. Before a word is written, the generator looks up your measured reading band — the one your previous attempts produced — and falls back to your target band, and then to a sensible default, if you are new. A full test is built around that number rather than flat at it: passage 1 lands a band below you, passage 2 at your level and passage 3 a band above, which is how the real paper ramps. One authentic Cambridge question layout is chosen for the whole test so the three passages cohere, the order of the question blocks inside each passage is then shuffled, and each passage is given a different subject and angle so you are not reading three variations on one theme. Every question is finally checked back against the passage it came from, and anything that cannot be confirmed there is thrown away rather than served to you.",
        points: [
          {
            title: "Every question type",
            body: "True/False/Not Given, matching headings, matching features, sentence and note completion, summary completion with a word bank, flow-charts, and multiple choice including pick-two.",
          },
          {
            title: "Why the trap worked",
            body: "A wrong answer is explained against the passage: what it actually said, and what made the distractor look right.",
          },
          {
            title: "Question-type analytics",
            body: "Misses are grouped by type, so a weakness in True/False/Not Given shows up as a pattern instead of as bad luck.",
          },
          {
            title: "Timed full sections",
            body: "Three passages, forty questions, one clock — converted once over the whole paper using the real raw-score table.",
          },
        ],
      },
      listening: {
        title: "Listening",
        lede: "Full four-part tests with original multi-voice audio, recorded for this platform.",
        how: "There are two ways in. The shared library holds practices that are already recorded, so they open and play at once. Or make your own: choose a level from L1 to L5 and the engine writes an original script and then performs it as multi-voice audio — a complete four-part, forty-question test in about two and a half minutes, or a single ten-question practice in about two. The level does far more than change the vocabulary; it drives the delivery. A lecture is voiced at roughly 115 words a minute at the easy end and about 140 at the hard end. A phone conversation moves from unhurried turn-taking to a fast native pace with barely a gap between speakers, and a student discussion goes from lively to genuinely overlapping. On a quick practice the question format is withheld until the announcer states it, so you cannot rehearse one type and hope it comes up.",
        points: [
          {
            title: "Real multi-voice audio",
            body: "Scripts are written and then performed with distinct speakers and an exam announcer — not one flat reader working through a transcript.",
          },
          {
            title: "Cambridge-style groups",
            body: "Form completion, maps and plans, matching, multiple choice — laid out the way the paper lays them out.",
          },
          {
            title: "Transcripts, linked",
            body: "Each answer links to the exact line where it was said, so you can hear what you missed instead of wondering.",
          },
          {
            title: "Ten minutes or the full hour",
            body: "One recording and ten questions when time is short; all four parts and forty questions when you want the real thing.",
          },
        ],
      },
      speaking: {
        title: "Speaking",
        lede: "A live examiner you can talk to, and a tutor that teaches while you speak.",
        how: "The examiner is not reading from a fixed list — and the list is not frozen at the model's training cutoff either. The pool of themes is refreshed once a day by a grounded search and shared across the platform, so it cannot quietly go stale, which is the worst way for content to age because nobody notices. From there the two modes pull in deliberately opposite directions. Exam practice keeps timeless, exam-shaped themes — your home town, food, routines, and the durable Part 3 questions about how society changes — because questions built from this week's headlines would be less exam-authentic, not more. Free conversation gets the current topics themselves, because discussing what is actually going on is the whole point of that practice. If a search ever fails, the built-in pool takes over: a lesson never waits on one and never fails because of one.",
        points: [
          {
            title: "The three-part mock",
            body: "Introduction, cue card and discussion, conducted live by an AI examiner rather than a list of recorded questions.",
          },
          {
            title: "Part 2 on its own",
            body: "Push to talk, one minute to prepare, two to speak — the cheapest way to fix the part most candidates lose marks on.",
          },
          {
            title: "The speaking tutor",
            body: "Talk to it and it reacts, corrects and teaches on every turn — and switches to Uzbek when you do.",
          },
          {
            title: "Delivery measured, not guessed",
            body: "Speech rate, filler count and answer length are computed from your audio, against the time you actually spent speaking.",
          },
        ],
      },
      cambridge: {
        title: "Cambridge-style",
        lede: "The format of the official practice books, without ever running out of tests — and without copying one of them.",
        how: "The generator was built against the structure of the official practice-book format: the parts, the question types, the layouts, the pacing. Listening comes out as four parts and forty questions — form, note, table and sentence completion in Parts 1 and 4; map and plan labelling, matching and multiple choice in Part 2; discussion multiple choice, choose-TWO and flow-charts in Part 3 — with multi-voice audio and the standard narrator framing. Reading comes out as three academic passages of rising difficulty carrying matching headings, matching features, True/False/Not Given, Yes/No/Not Given, note completion, sentence endings, pick-TWO and summary completion, with the group-level word-limit instructions printed the way the books print them. Writing covers Task 1 reports and every modern Task 2 category, including the newer “outweigh” and positive-or-negative-development phrasings. Listening and Reading are then converted on the standard forty-question raw-score table.",
        points: [
          {
            title: "The books run out",
            body: "A serious candidate finishes the recent ones in weeks. Generated tests do not run out, so every practice can be a first attempt.",
          },
          {
            title: "A second pass tests memory",
            body: "Re-sitting a book measures recall, not readiness. Content you have never seen is the only content that measures you honestly.",
          },
          {
            title: "A book cannot explain itself",
            body: "It tells you the answer was C. Here every wrong answer in Reading and Listening explains why the trap caught you, and your misses are grouped by question type.",
          },
          {
            title: "Nothing is copied",
            body: "No official Cambridge test is hosted, copied or paraphrased here. “Cambridge-style” describes the format our original content follows — EngProgress is not affiliated with or endorsed by Cambridge Assessment English, IELTS, the British Council or IDP.",
          },
        ],
      },
      coaching: {
        title: "Coaching",
        lede: "Scoring tells you where you are. Coaching is the part that moves you — and it is there while you work, not only afterwards.",
        how: "There are four of them, and they are deliberately different things. The Writing tutor and the Reading tutor sit with you DURING the task: ask what belongs in this paragraph, or which two words in this sentence to compare against the passage, and you get a straight answer in the moment. Both are hard-blocked from doing the work for you until you submit — the Writing tutor will not write a sentence of your essay and the Reading tutor will not tell you whether Q7 is True, no matter how you ask. They teach the move on a different example instead, and the full explanations unlock the second you hand the work in, which is what keeps the band yours. The Speaking tutor works the other way round, because speech is live: it reacts, corrects and teaches on every turn while you are talking. The study coach is not attached to a task at all — it sees your bands, your weakest skill and how many days you have left, and tells you what to do with the time.",
        points: [
          {
            title: "Concrete, or it does not count",
            body: "“Add more detail” and “use better vocabulary” are banned outright. A reply has to name the exact word to swap, the exact sentence to add, or the paragraph to look in.",
          },
          {
            title: "It will not do it for you",
            body: "While the clock runs, no model answer, no sentence of your essay, and no confirmation of which option is right. That rule is written into the tutor itself, not left to its judgement.",
          },
          {
            title: "In your own language",
            body: "Write to it in Uzbek or Russian and it answers in the same language. The Speaking tutor switches mid-conversation when you do.",
          },
          {
            title: "It knows where you are",
            body: "Your target band and weakest area are passed in, so the advice is pitched at your level — but it will never quote you a band. Scoring belongs to the examiner.",
          },
        ],
      },
      cefr: {
        title: "CEFR / Multilevel",
        lede: "The Uzbekistan exam in its own format — not IELTS with the labels changed.",
        how: "The Multilevel papers are generated on demand like everything else, but against the CEFR descriptors rather than the IELTS band descriptors, because they are a different exam with a different mark scheme. Reading is built as five parts and thirty-five questions in the shapes the real paper uses; Writing is built as all three tasks. A result comes back as a CEFR level rather than a band, which is what the certificate actually reports.",
        points: [
          {
            title: "Reading, five parts",
            body: "Thirty-five questions across the five parts the paper actually uses, generated fresh each time.",
          },
          {
            title: "Writing, three tasks",
            body: "All three tasks, marked against the CEFR descriptors rather than the IELTS band descriptors.",
          },
          {
            title: "A level, not a band",
            body: "Results come back as A1–C2, which is what the Multilevel certificate reports.",
          },
          {
            title: "Listening and Speaking",
            body: "The CEFR papers for these two are not built yet. The IELTS versions of both are live.",
          },
        ],
      },
    },
    cross: {
      kicker: "Running a school?",
      title: "There is a separate guide for education centers",
      body: "Teachers, groups, student logins, assigned homework, Telegram notifications, attendance, reports and finance — all of it is covered in its own guide.",
      cta: "Open the center guide",
    },
  },

  centers: {
    meta: {
      title: "How to use EngProgress — a guide for education centers",
      ogTitle: "How to use EngProgress — for education centers",
      description:
        "How an education center runs EngProgress: roles and teachers, groups and student logins, assigned homework with AI marking, Telegram notifications, attendance, per-student reports, finance and the center chat.",
    },
    head: {
      kicker: "Documentation · for education centers",
      title: "Run your center on EngProgress",
      lede: "Teachers, groups and student logins; homework the AI marks; Telegram for the parents and the class; attendance, reports, invoices and payroll — and a chat that answers questions about all of it.",
    },
    label: "How a center runs EngProgress",
    elsewhere: "For learners",
    intro: [
      "An education center runs the whole of EngProgress on top of the learner platform: your own teachers, your own groups, your own student logins, and homework the AI marks the moment it is handed in.",
      /* ⚠️ THIS PARAGRAPH USED TO SAY THE OPPOSITE. It read "your students are
         ordinary learners — they can practise anything they like", which is
         what the product did until 2026-08-09 and has not done since:
         `isHomeworkOnlyStudent()` in lib/auth.ts sends a centre student from
         all five skill hubs to /assignments. The page's own "Student" role card
         already described the real behaviour, so the guide contradicted itself
         on the same screen. Corrected before translation, because a false claim
         translated three times is a false claim in three markets. */
      "Your students see the practice you attach to their group. The browsable libraries are switched off for a center account, so a class works through what its teacher set rather than wandering off into their own practice — and every attempt, with the full AI report behind it, is visible to their teacher.",
      "You do not pay per practice. Quota and seat limits are switched off for a center account on purpose, so setting more homework never costs you more, and a teacher never has to ration what a class is given. Approval is by hand: you apply, we read the application and confirm by email, and your account waits on a holding screen until then — which is also why nobody can sign your center up on your behalf.",
    ],
    rolesHeading: "Who does what",
    roles: [
      {
        title: "Center admin",
        body: "The owner of the center. Invites teachers and administrators, creates groups, sees every student, every report and all of the money.",
      },
      {
        title: "Administrator",
        body: "The front desk. Runs classes, rosters and attendance, and takes money in — but not payroll or money out.",
      },
      {
        title: "Teacher",
        body: "Creates their own groups, adds students, assigns practice and reads the reports for the students in the groups they own.",
      },
      {
        title: "Student",
        body: "Signs in with the login you issue — no email needed — sees the homework attached to their group, and gets a full AI report on every attempt.",
      },
    ],
    startHeading: "Getting started",
    steps: [
      {
        title: "Register and get approved",
        body: "Apply from the Organization tab on sign-up. We review it and confirm by email; your account waits on an approval screen until then.",
      },
      {
        title: "Add teachers, then groups",
        body: "Invite your teachers by link. Each one creates their own groups and adds students outright — name, login and password, email optional.",
      },
      {
        title: "Assign, then read the reports",
        body: "Pin a task to a group and every student sits the same content. The AI marks it, the student gets their mistakes, and you get the same report.",
      },
    ],
    tabs: {
      overview: {
        title: "Overview",
        lede: "What a center gets, who does what inside it, and the three steps to your first class.",
      },
      people: {
        title: "People & groups",
        lede: "A centre runs on four roles, and a teacher can set up their own classes without waiting for anyone.",
        points: [
          {
            title: "Teachers create their own groups",
            body: "No queue through an admin. A teacher makes the class, sets the schedule and owns it.",
          },
          {
            title: "Students created outright",
            body: "Name, login and password. An email address is optional — give one and the credentials are emailed, leave it blank and you hand them over in class.",
          },
          {
            title: "No email needed to sign in",
            body: "Centre students sign in with the login you issued. The sign-in field takes either a login or an email and resolves it server-side.",
          },
          {
            title: "Photos, kept private",
            body: "A student photo is optional and lives in a private bucket, signed server-side. It is never a public URL.",
          },
        ],
      },
      homework: {
        title: "Homework",
        lede: "Pin practice to a group and everyone sits identical content.",
        points: [
          {
            title: "Writing",
            body: "Generate a Task 1 or Task 2 prompt and attach it. Every student in the group gets the same prompt, not a fresh one each.",
          },
          {
            title: "Reading",
            body: "Generate a test, or clone one from the shared library into your centre so the whole class sits the same paper.",
          },
          {
            title: "Listening",
            body: "Attach a listening practice from the library. It lands on the student's assignments list like any other task.",
          },
          {
            title: "Practice AI lessons",
            body: "Describe the lesson you want in a sentence; it builds an explanation plus auto-graded exercises, assignable or shareable by link.",
          },
          {
            title: "Speaking homework",
            body: "Speaking can be practised freely by any student, but it cannot yet be ASSIGNED to a group.",
          },
        ],
      },
      tracking: {
        title: "Tracking & reports",
        lede: "What each student did, what they got, and what keeps going wrong.",
        points: [
          {
            title: "Results per assignment",
            body: "Who finished, the bands they got, and the criterion or question type the class as a whole is losing marks on.",
          },
          {
            title: "A four-skill student report",
            body: "Bands across Writing, Reading, Listening and Speaking, recurring weaknesses, and a dated table of every practice — homework or self-directed.",
          },
          {
            title: "The learner's own report",
            body: "Open any row and you see exactly the feedback page the student sees. Staff and student read one view, not two versions of the truth.",
          },
          {
            title: "Attendance",
            body: "Mark sessions, track who is drifting, and set alerts on absence.",
          },
        ],
      },
      telegram: {
        title: "Telegram",
        lede: "The channel families and students actually read.",
        points: [
          {
            title: "Credentials to the student",
            body: "Send a student their login and password over Telegram instead of reading them out in class.",
          },
          {
            title: "Homework notices",
            body: "Setting practice tells the class, with a link straight to their assignments list.",
          },
          {
            title: "Group links",
            body: "Connect a class to its Telegram group so notices land where the students already are.",
          },
          {
            title: "Staff assistant",
            body: "The same brain as the console chat, reachable from Telegram for staff.",
          },
        ],
      },
      chat: {
        title: "Center chat",
        lede: "Ask about your centre in plain language — and it cannot break anything.",
        points: [
          {
            title: "It reads, it does not write",
            body: "The model gets a snapshot of facts and returns prose plus, at most, one PROPOSAL. Running it is a separate Confirm step.",
          },
          {
            title: "Confirmed, then re-checked",
            body: "On confirm the server re-derives who you are, re-checks your role and re-resolves every name inside your own centre before anything happens.",
          },
          {
            title: "Scoped to what you may see",
            body: "The snapshot is built through the same row-level rules as the pages: a teacher sees their groups, a centre admin sees the centre.",
          },
          {
            title: "Attendance, homework, payroll",
            body: "Who turned up, what is outstanding, and what pay is owed — without opening four screens.",
          },
        ],
      },
      money: {
        title: "Money",
        lede: "Invoices in, payroll out, and the timetable they both hang off.",
        points: [
          {
            title: "Student invoices",
            body: "A class carries both prices — the student fee and the teacher rate. Proration is per lesson from the timetable, not per month.",
          },
          {
            title: "Payroll with real rules",
            body: "Dynamic salary rules per teacher, with the group rate as the default, and multi-month exports.",
          },
          {
            title: "Cash desks and branches",
            body: "Branches own their own rooms and cash desks, so a multi-site centre's money stays separated.",
          },
          {
            title: "Unmetered on purpose",
            body: "Centres are not charged per practice. Quota and seat checks are skipped for a centre account.",
          },
        ],
      },
    },
    cross: {
      kicker: "Practising on your own?",
      title: "There is a separate guide for learners",
      body: "Finding your real band, all four skills, the revision loop and CEFR — written for someone studying without a center.",
      cta: "Open the learner guide",
    },
  },
};
