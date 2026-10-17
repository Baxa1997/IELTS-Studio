/**
 * English — the SOURCE dictionary. Every other locale is typed against this
 * object, so adding a key here makes `uz.ts` and `ru.ts` fail to compile until
 * they carry it too. That is the only thing stopping a half-translated UI from
 * shipping silently.
 *
 * SCOPE IS UI CHROME, deliberately. Nav, buttons, labels, section headings,
 * empty states — the furniture a learner navigates by. It is NOT exam content
 * and NOT the grader's feedback: the passages, prompts and band explanations
 * stay in English because the exam is in English, and because translating the
 * grader's output would mean re-validating a calibrated rubric in three
 * languages against anchors that exist in one.
 *
 * KEYS ARE DOTTED AND FLAT rather than nested. A flat record is what lets the
 * lookup be a single map access with no traversal and no optional chaining, and
 * it is what makes a missing key a visible key name rather than `undefined`
 * rendering as nothing.
 */
export const en = {
  /* ── navigation ─────────────────────────────────────────────────────── */
  "nav.dashboard": "Dashboard",
  "nav.studyPlan": "Study plan",
  "nav.activities": "Activities",
  "nav.referrals": "Referrals",
  "nav.assignments": "Assignments",
  "nav.writing": "Writing",
  "nav.reading": "Reading",
  "nav.listening": "Listening",
  "nav.speaking": "Speaking",
  "nav.cefr": "CEFR practice",
  "nav.vocabulary": "Vocabulary",
  "nav.notifications": "Notifications",
  "nav.settings": "Settings",
  "nav.signOut": "Sign out",

  /* ── documentation guides (the tab rail's own chrome) ─────────────── */
  "doc.onThisPage": "On this page",
  "doc.elsewhere": "Elsewhere",
  "doc.soon": "SOON",

  /* ── console navigation ─────────────────────────────────────────────── */
  "nav.assistant": "Assistant",
  "nav.groups": "Groups",
  "nav.students": "Students",
  "nav.teachers": "Teachers",
  "nav.calendar": "Calendar",
  "nav.finance": "Finance",
  "nav.invoices": "Invoices",
  "nav.salary": "Salary",
  "nav.practices": "Practices",
  "nav.marking": "Marking",
  "nav.results": "Results",
  "nav.announcements": "Announcements",
  "nav.takePayment": "Take payment",
  "nav.attendance": "Attendance",
  "nav.certificates": "Certificates",

  /* ── console + admin navigation ─────────────────────────────────────── */
  "nav.assistantAi": "Assistant AI",
  "nav.centers": "Centers",
  "nav.moderation": "Moderation",
  "nav.myPay": "My pay",
  "nav.overview": "Overview",
  "nav.plansRevenue": "Plans & revenue",
  "nav.practice": "Practice",
  "nav.practiceWithAi": "Practice English with AI",
  "nav.systemHealth": "System health",
  "nav.users": "Users",
  "nav.broadcast": "Broadcast",
  "nav.blog": "Blog",

  /* ── sidebar section headings ───────────────────────────────────────── */
  "nav.section.centre": "Centre",
  "nav.section.learning": "Learning",
  "nav.section.money": "Money",
  "nav.section.operations": "Operations",
  "nav.section.platform": "Platform",
  "nav.section.practice": "Practice",
  "nav.section.practices": "Practices",
  "nav.section.teaching": "Teaching",
  "nav.section.you": "You",

  /* ── common actions ─────────────────────────────────────────────────── */
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.cancel": "Cancel",
  "common.continue": "Continue",
  "common.back": "Back",
  "common.next": "Next",
  "common.close": "Close",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.loading": "Loading…",
  "common.retry": "Try again",
  "common.search": "Search",
  "common.submit": "Submit",
  "common.start": "Start",
  "common.finish": "Finish",

  /* ── appearance + language ──────────────────────────────────────────── */
  "appearance.title": "Appearance & language",
  "appearance.note": "How EngProgress looks and which language it speaks",
  "theme.label": "Theme",
  "theme.note":
    "Use the button in the bottom-right corner to switch quickly. Pick System to follow your device.",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",
  "theme.switchToDark": "Switch to dark mode",
  "theme.switchToLight": "Switch to light mode",
  "language.label": "Language",
  "language.note": "Menus and buttons only — practice content stays in English.",
  "language.change": "Change language",

  /* ── settings sections ──────────────────────────────────────────────── */
  "settings.account": "Account",
  "settings.account.note": "Name, phone and password",
  "settings.goal": "Study goal",
  "settings.goal.note": "Target band and test date",
  "settings.billing": "Billing & plan",
  "settings.billing.note": "Your plan and this month's use",
  "settings.delete": "Delete account",
  "settings.delete.note": "Remove your account for good",
  "settings.appearance.note": "Theme and interface language",

  /* ââ dashboard ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
  "dash.eyebrow": "Your dashboard",
  "dash.welcome": "Welcome back",
  "dash.welcomeName": "Welcome back, {name}",
  "dash.targetBand": "Target Band {band}",
  "dash.daysToTest": "{days} days to your test",
  "dash.dayToTest": "{days} day to your test",
  "dash.setExamDate": "set your exam date",
  "dash.nextTask": "Next task · picked for you",
  "dash.thisWeek": "This week",
  "dash.streak": "{days}-day streak",
  "dash.weeklyGoal": "Weekly goal",
  "dash.tasksOf": "{done} / {goal} tasks",
  "dash.goalReached": "Goal reached — nice work.",
  "dash.moreToGoStreak": "{n} more to go — keep the streak alive.",
  "dash.moreToGo": "{n} more to go — practice today to start a streak.",
  "dash.adjustPlan": "Adjust plan",
  "dash.focusAreas": "Focus areas",
  "dash.notMeasured": "Not measured yet",
  "dash.avgBand": "avg band {band}",
  "dash.gradeToFind": "Grade an essay to find it",
  "dash.setToFind": "Do a set to find it",
  "dash.correctOf": "{pct}% correct · {correct}/{attempted}",
  "dash.recentResults": "Recent results",
  "dash.allActivities": "All activities",
  "dash.noResults": "No results yet — your graded work will show up here.",
  "dash.baseline": "baseline",
  "dash.paid": "Payment received — your Pro plan is activating now. Enjoy the extra practice!",
  "dash.cancelled": "Checkout cancelled — you’re still on the free plan.",

  /* ── practice card ───────────────────────────────────────────────────── */
  "card.new": "New",
  "card.paused": "Paused",
  "card.retake": "Retake",
  "card.review": "Review",
  "card.attach": "Attach",
  "card.pro": "Pro",
  "card.unlockPro": "Unlock with Pro",
  "card.attachClass": "Attach to a class",
  /* Headings that split a hub's ready-made library into one block per level.
     The chip on a card says LEVEL 3; these say the same thing so a learner
     reads one scale, not two. */
  "practice.level": "Level {n}",
  "practice.levelMixed": "Mixed levels",

  /* ── reading hub ─────────────────────────────────────────────────────── */
  "read.yourTests": "Your tests",
  "read.yourPassages": "Your passages",
  "read.ready": "Ready to start",
  "read.noTests":
    "No ready tests yet — generate one above. Each is 3 passages, marked over all 40 questions.",
  "read.noPassages": "No ready passages yet — generate one above.",
  "read.fullTest": "Full reading test",
  "read.fullTestMeta": "3 passages · 60 min",
  "read.fullTestBlurb": "Three original passages that rise in difficulty, pitched to your band.",
  "read.generateTest": "Generate fresh test",
  "read.passage": "Passage practice",
  "read.passageMeta": "1 passage · ~20 min",
  "read.passageBlurb": "One original passage with marked questions (~20 min)",
  "read.generatePassage": "Generate fresh passage",
  "read.disclaimer":
    "Original passages in the IELTS Academic Reading format. Not affiliated with or endorsed by IELTS®.",

  /* ── writing hub ─────────────────────────────────────────────────────── */
  "write.hub": "Writing practice",
  "write.intro":
    "Check an essay you’ve already written, pick a topic, or generate a fresh one. You’ll get an examiner-strict band per criterion — then revise the same response until it’s where you want it.",
  "write.question": "The question",
  "write.questionTask": "The question / task",
  "write.pasteExact": "Paste the task exactly as you answered it",
  "write.yourEssay": "Your essay",
  "write.gradedReal": "Graded like the real thing",
  "write.perCriterion": "Examiner-strict band per criterion, with fixes",
  "write.conservative":
    "Conservative and examiner-strict — your band here is your band on exam day.",
  "write.pasteOwn": "Paste your own question",
  "write.pasteOwnNote":
    "Got a specific question from class or a book? Paste it and we’ll grade your answer against it.",
  "write.anyBand": "Any band",
  "write.noTopics":
    "No ready topics here yet — use “Let AI choose a fresh topic” above to create your first.",
  "write.noMatch": "No topics match your filters.",
  "write.classLevel": "Level of the class",
  "write.classLevelNote":
    "How demanding the wording and ideas are. A student practising alone gets this pitched from their own measured band — a class has no single band, so you say.",
  "write.questionType": "Question type",
  "write.optional": "(optional)",
  "write.anySurprise": "Any — surprise me",
  "write.topicPref": "Topic preference",
  "write.grading": "AI is grading your essay…",
  "write.gradingNote":
    "Reading every criterion the way an examiner would — Task, Coherence, Vocabulary, Grammar. This takes about 15–30 seconds; please keep this tab open.",
  "write.gradingTitle": "Grading your essay",
  "write.rewrite": "Rewrite",
  "write.feedback": "Feedback",
  "write.draft": "Draft",
  "write.practised": "Practised",
  "write.checkOwn": "Check own writing",
  "write.acadT1": "Academic · Task 1",
  "write.acadT2": "Academic · Task 2",
  "write.gt": "General Training",
  "write.phQuestion": "Paste the exact IELTS question or task…",
  "write.phEssay": "Paste or write your full answer here…",
  "write.phFull": "Paste the full IELTS writing question here…",
  "write.letAI": "Let AI choose a fresh topic",
  "write.generate": "Generate a topic",
  "write.searchTopics": "Search topics…",
  "write.filterBand": "Filter by target band",
  "write.newPractice": "New practice",
  "write.egTopics": "e.g. urban transport, remote work",
  "write.disclaimer":
    "AI-generated prompts in the IELTS Writing format. Not affiliated with or endorsed by IELTS®.",

  /* ── listening hub ───────────────────────────────────────────────────── */
  "listen.preparing": "Preparing…",
  "listen.resume": "Resume",

  /* ── landing page ────────────────────────────────────────────────────── */
  "lp.eyebrow": "AI · IELTS & CEFR",
  "lp.heroA": "The professional AI platform for",
  "lp.heroB": "IELTS & CEFR",
  "lp.heroC": "practice",
  "lp.heroLead":
    "From a complete beginner to Band 9. AI generates exam-standard Writing, Reading, Listening and Speaking tasks at your exact level, coaches you while you practise, then scores you against the official IELTS bands and CEFR descriptors.",
  "lp.ctaStart": "Start free assessment",
  "lp.ctaPractice": "Practise for free",
  "lp.noCard": "No card required · Complete beginner to Band 9 · CEFR A1–C2",
  "lp.platform": "The platform",
  "lp.platformLead":
    "All four skills, plus CEFR — generated fresh, marked against the real criteria",
  "lp.platformNote":
    "Nothing here is a past paper. Every task is original and produced to the exam spec at your level — a first attempt at Band 4 or a final push for a 9 — so there is no way to memorise the content in advance.",
  "lp.cefrTitle": "CEFR / Multilevel for the Uzbekistan DTM exam",
  "lp.cefrNote":
    "Reading (5 parts, 35 questions) and Writing (3 tasks), generated on demand and marked against the CEFR descriptors.",
  "lp.cefrCta": "See CEFR practice",
  "lp.coachEyebrow": "Coaching, not just scoring",
  "lp.coachTitle": "A tutor sits with you while you practise",
  "lp.coachNote":
    "Stuck mid-essay or mid-passage, you can just ask. It answers in the moment, in your own language if you prefer — and it will not hand you the answer while the clock is running, so the band you finish with is still yours.",
  "lp.coachCta": "See how coaching works",
  "lp.pricing": "Pricing",
  "lp.pricingLead": "Start free. Upgrade when you are practising every day.",
  "lp.faqEyebrow": "Questions",
  "lp.faqTitle": "The things worth asking first",
  "lp.openDemo": "Open the full demo →",
  "lp.finalTitle": "Find out your real band in 60 seconds",
  "lp.finalNote":
    "Paste an essay, get a calibrated band and the one fix that moves you up — free to start.",
  "lp.gradeFree": "Grade an essay free",
  "lp.buildPlan": "Build your plan",
  "lp.statNew": "New learners this month",
  "lp.statNewNote": "vs. 1150 last month",
  "lp.statCenters": "Education centers",
  "lp.statCentersNote": "Schools and IELTS centers onboard",
  "lp.statUsers": "Total users",
  "lp.statUsersNote": "Learners, teachers and admins",
  "lp.statTasks": "Tasks practised",
  "lp.statTasksNote": "Graded essays, readings and mocks",
  "lp.disclaimer":
    "Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment English.",

  /* ── landing FAQ ─────────────────────────────────────────────────────── */
  "lp.faq1q": "Is this affiliated with IELTS?",
  "lp.faq1a":
    "No. We're an independent practice tool — not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment English. We ground our scoring in the public band descriptors.",
  "lp.faq2q": "Do you use real past papers?",
  "lp.faq2a":
    "Never. Every passage and question is original and AI-generated to the exam spec, so you're never practising on leaked material — and we stay firmly on the right side of copyright.",
  "lp.faq3q": "How accurate is the grading?",
  "lp.faq3a":
    "It's built on the official public band descriptors, anchored to an annotated sample essay at every band, and deliberately conservative. When you sit between two bands we round down and tell you exactly what's missing for the higher one.",
  "lp.faq4q": "Will it inflate my score to keep me happy?",
  "lp.faq4a":
    "No — that's the whole point. A false 7.0 is the one thing that breaks trust on exam day, so we'd rather show you the work that's left than hand you a number you won't repeat.",
  "lp.faq5q": "What about Speaking and Listening?",
  "lp.faq5a":
    "Both are live. Listening gives you full four-section tests with original multi-voice audio, auto-marking, transcripts and trap explanations. Speaking gives you a full three-part mock with an AI examiner.",

  /* ── landing sections ────────────────────────────────────────────────── */
  "lp.demoEyebrow": "See it working",
  "lp.demoTitle": "The real product, not mockups",
  "lp.demoSub":
    "These are the actual EngProgress screens — the feedback, the tests, the coach — rendered live, not pictures.",
  "lp.proofEyebrow": "Proof",
  "lp.proofTitle": "Real reports from the grader",
  "lp.proofSub":
    "The report layout the examiner engine actually produces. Conservative by design: between two bands it rounds down and names exactly what is missing.",

  /* ── free daily practice: the landing section and /practice ─────────── */
  "free.eyebrow": "Picked for you today",
  "free.title": "Your free practice for today",
  "free.sub":
    "A practice in every skill, picked for you and new each day — Writing, Reading, Listening and CEFR, marked for you with no account needed. Speaking opens with a free account.",
  "free.freeToday": "Free today",
  "free.signIn": "Sign in",
  "free.seeToday": "See today's practice",
  "free.signInToPractise": "Sign in to practise",
  "free.writingMeta": "Task 1 or Task 2 · graded by the AI examiner",
  "free.readingMeta": "Full tests and single passages · marked instantly",
  "free.listeningMeta": "Full tests and single parts · marked instantly",
  "free.skillCefr": "CEFR",
  "free.cefrMeta": "Full Multilevel Reading and Writing papers · marked for you",
  "free.speakingMeta": "A live mock with an AI examiner",
  "free.pickChip": "Picked for you",
  "free.usedChip": "Used today",
  "free.usedCta": "Sign in for more",
  "free.startHere": "Start here",
  "free.startNow": "Start now",
  "free.morePicks": "More picked for you",
  "free.tabsLabel": "CEFR papers",
  "free.pageEyebrow": "Free daily practice",
  "free.pageTitleWriting": "Free IELTS Writing practice: Task 1 and Task 2",
  "free.pageTitleReading": "Free IELTS Reading practice tests",
  "free.pageTitleListening": "Free IELTS Listening practice tests",
  "free.pageTitleCefr": "Free CEFR Multilevel practice tests",
  "free.seoTitleWriting": "Free IELTS Writing Practice: Task 1 & 2 with AI Marking",
  "free.seoTitleReading": "Free IELTS Reading Practice Tests Online, with Answers",
  "free.seoTitleListening": "Free IELTS Listening Practice Tests Online, with Audio",
  "free.seoTitleCefr": "Free CEFR Multilevel Practice Tests: Reading & Writing",
  "free.pageLead":
    "Twenty practices picked for you, with a new one every day. One a day is free with no account — the same practice, and the same marking, as inside EngProgress.",
  "free.summaryWriting":
    "Practise IELTS Writing online for free: an Academic Task 1 report, a General Training Task 1 letter or a Task 2 essay, timed like the exam — {t1} minutes for Task 1, {t2} for Task 2 — and marked by an AI examiner on the four official criteria, with what holds each band back and how to fix it.",
  "free.summaryReading":
    "Practise IELTS Reading online for free: full tests — three passages and about 40 questions in {full} minutes — or a single passage in {part}. Every question is marked the moment you finish, with the correct answer and the evidence for it in the passage.",
  "free.summaryListening":
    "Practise IELTS Listening online for free: full tests — four recordings and 40 questions in {full} minutes — or a single part in {part}, with original exam-style audio. Every question is marked the moment you finish, with the correct answer and the transcript to check it against.",
  "free.summaryCefr":
    "Practise the CEFR Multilevel exam (Uzbekistan's DTM) for free: full Reading papers — five parts and {questions} questions in {reading} minutes, marked instantly with the evidence for each answer — and full Writing papers of three tasks in {writing} minutes, graded on the CEFR scale with a model answer to compare.",
  "free.factsLabel": "What a practice holds",
  "free.factFormat": "Format",
  "free.factTime": "Time",
  "free.factMarking": "Marking",
  "free.factFormatWriting": "Task 1 report or letter, or a Task 2 essay",
  "free.factTimeWriting": "{t1} min for Task 1, {t2} for Task 2",
  "free.factMarkingWriting": "A band for each of the four criteria",
  "free.factFormatReading": "A full test of three passages, or one passage",
  "free.factTimeReading": "{full} min for a full test, {part} for a passage",
  "free.factMarkingReading": "Instant, with the evidence for every answer",
  "free.factFormatListening": "A full test of four parts, or one part",
  "free.factTimeListening": "{full} min for a full test, {part} for a part",
  "free.factMarkingListening": "Instant, with the transcript",
  "free.factFormatCefr": "Reading: five parts · Writing: three tasks",
  "free.factTimeCefr": "{reading} min for Reading, {writing} for Writing",
  "free.factMarkingCefr": "Reading instantly · Writing on the CEFR scale",
  "free.howTitle": "How the free practice works",
  "free.how1Title": "Pick one of your twenty",
  "free.how1Body":
    "Twenty practices are picked for you, with a new one every day — any of them opens.",
  "free.how2Title": "Sit it like the exam",
  "free.how2Body":
    "Exam timing and the exam's question types, on screen — the same practice signed-in learners get.",
  "free.how3Title": "Get it marked",
  "free.how3Body":
    "Marked as soon as you submit. One practice a day is free with no account; a free account opens more.",
  "free.listTitleWriting": "Today's free IELTS Writing tasks",
  "free.listTitleReading": "Today's free IELTS Reading tests",
  "free.listTitleListening": "Today's free IELTS Listening tests",
  "free.cefrReadingTitle": "CEFR Reading practice papers",
  "free.cefrReadingSub":
    "Five parts and {questions} questions in {minutes} minutes — the Multilevel Reading paper as the exam sets it, marked instantly with the evidence for each answer.",
  "free.cefrWritingTitle": "CEFR Writing practice papers",
  "free.cefrWritingSub":
    "Three tasks in {minutes} minutes — an informal message, a formal letter and a forum post — graded on the CEFR scale with a model answer to compare.",
  "free.minutes": "{n} min",
  "free.questions": "{n} questions",
  "free.testNo": "Test {n}",
  "free.fullReading": "Full reading",
  "free.partReading": "Part reading",
  "free.fullListening": "Full listening",
  "free.partListening": "Part listening",
  "free.fullCefrReading": "Full CEFR reading",
  "free.fullCefrWriting": "Full CEFR writing",
  "free.writingTask": "Writing Task {n}",
  "free.doneTitle": "Done for today",
  "free.doneBody":
    "Your next free practice arrives tomorrow. Sign in to get more free practices today.",
  "free.newToday": "New today",
  "free.availableToday": "Today's free practice is ready — pick any one below.",
  "free.usedToday":
    "Today's free practice is used. Sign in to get more free practices, or come back tomorrow.",
  "free.otherSkills": "The other skills",
  "free.stripLead": "You're on today's free practice.",
  "free.moreCta": "Sign in to get more free practices",
  "free.moreTitle": "That was today's free practice",
  "free.moreBody":
    "Sign in to get more free practices — a free account opens more practice in all four skills, Speaking included, and keeps every result.",
  "free.runnerTitleWriting": "Today's free Writing practice",
  "free.runnerTitleReading": "Today's free Reading practice",
  "free.runnerTitleListening": "Today's free Listening practice",
  "free.runnerTitleCefr": "Today's free CEFR practice",
  "free.emptyPool": "No practice is ready here yet — new ones are on their way. Check back soon.",
  "free.allFreePractice": "All free practice",
  "free.metaDescWriting":
    "A new IELTS Writing task every day — Task 1 or Task 2 — graded by the AI examiner with a band per criterion. Free, with no account needed.",
  "free.metaDescReading":
    "A new IELTS Reading practice every day — full tests and single passages, marked instantly with the reason behind each answer. Free, with no account needed.",
  "free.metaDescListening":
    "A new IELTS Listening practice every day — full four-part tests and single parts with original audio, marked instantly. Free, with no account needed.",
  "free.metaDescCefr":
    "A new CEFR Multilevel (Uzbekistan DTM) practice every day — full Reading and Writing papers, marked with an indicative CEFR level. Free, with no account needed.",
  "free.faqTitle": "Questions about the free practice",
  "free.faqAccountQ": "Do I need an account to practise?",
  "free.faqAccountA":
    "No. One practice a day in each skill is free with no account, and it is marked the moment you finish. A free account brings more practice every day.",
  "free.faqMarkedQ": "How is the free practice marked?",
  "free.faqMarkedAWriting":
    "By the same AI examiner a signed-in learner gets: a band for each of the four criteria, with evidence quoted from your answer. It is deliberately strict, and the bands are practice estimates, not official results.",
  "free.faqMarkedAReading":
    "Instantly, against the answer key, with the reason behind each answer. A full test has three passages; a part is one passage from a full test.",
  "free.faqMarkedAListening":
    "Instantly, against the answer key, question by question. A full test has four parts and 40 questions; a part is one recording from a full test.",
  "free.faqMarkedACefr":
    "A Reading paper is marked instantly against the answer key, and a full paper also shows an indicative CEFR level. Each Writing task is graded by the AI on five criteria, with an estimated CEFR level and a model answer to compare.",
  "free.faqOriginalQ": "Are these real exam papers?",
  "free.faqOriginalA":
    "No. Every passage, recording and task is original, written in the format of the exam. EngProgress is an independent practice platform, not affiliated with any exam board.",
  "free.faqDailyQ": "How often is there new practice?",
  "free.faqDailyA":
    "Every day. A new practice arrives at the top of your list at midnight, Tashkent time, and the list moves on by one practice a day.",
  "free.faqTimeQ": "How long does one practice take?",
  "free.faqTimeAWriting":
    "As long as in the exam: {t1} minutes for Task 1 and {t2} minutes for Task 2.",
  "free.faqTimeAReading":
    "A full test takes {full} minutes, as in the exam; a single passage about {part}.",
  "free.faqTimeAListening": "A full test takes about {full} minutes; a single part about {part}.",
  "free.faqTimeACefr":
    "A Reading paper takes {reading} minutes, as in the exam; a Writing paper about {writing} minutes for its three tasks.",
  "free.fromBlog": "Read before you practise",
  "free.ogNoAccount": "no account needed",

  /* ── /grade — the free writing checker ───────────────────────────────
     Rendered in English on every locale today (app/grade/page.tsx), like the
     blog and the free practice: the questions and the grader's feedback are
     English, and a page that switched language halfway down reads as a
     mistake. Keyed anyway, so following the visitor's language later is a
     one-line change. Exam vocabulary (Task 1, Academic, General Training,
     CEFR, band, the criterion names) stays English in every locale. */
  "grade.metaTitle": "Free IELTS & CEFR Writing Checker — Task 1, Task 2 and Multilevel",
  /* Under ~160 characters: a search result shows about that much and cuts the
     rest. At 245, "No sign-up" was never seen. */
  "grade.metaDesc":
    "Free IELTS Writing Task 1 & 2 and CEFR Multilevel checker. Paste or upload a photo for a strict band per criterion, or a CEFR level, and the fixes. No sign-up.",
  "grade.appName": "EngProgress Writing Checker",
  "grade.eyebrow": "Free writing checker",
  "grade.titleA": "Grade your writing.",
  "grade.titleB": "Get an honest score.",
  "grade.lead":
    "IELTS Task 1, Task 2 or CEFR Multilevel — paste your answer, upload a photo or PDF, or practise on one of our questions. No account needed.",
  "grade.pointFree": "No sign-up",
  "grade.pointUpload": "Photo or PDF",
  "grade.pointStrict": "Rounds down, never up",
  "grade.tabsLabel": "Writing task",
  "grade.tabTask1": "Writing Task 1",
  "grade.tabTask1Sub": "Report or letter · {n}+ words",
  "grade.tabTask2": "Writing Task 2",
  "grade.tabTask2Sub": "Essay · {n}+ words",
  "grade.tabCefr": "CEFR Writing",
  "grade.tabCefrSub": "Multilevel · Tasks 1.1, 1.2 and 2",
  "grade.task2Both": "The same essay for Academic and General Training",
  "grade.module": "Module",
  "grade.academic": "Academic · report",
  "grade.general": "General Training · letter",
  "grade.cefrTaskLabel": "Multilevel task",
  "grade.aim": "Aim for {n}+ words · about {m} minutes",
  "grade.aimCefr": "{lo}–{hi} words · {level} level",
  "grade.question": "The question",
  "grade.optional": "optional",
  "grade.phTask1Academic":
    "Paste the Task 1 question — or leave this blank to grade the report on its own.",
  "grade.phTask1General":
    "Paste the letter task — or leave this blank to grade the letter on its own.",
  "grade.phTask2": "Paste the Task 2 question — or leave this blank to grade the essay on its own.",
  "grade.phCefr": "Paste the task — or leave this blank to grade your answer as this task.",
  "grade.noChart":
    "Without the chart, the numbers in a report can't be checked — so Task Achievement is judged on your overview and comparisons. Practise on one of ours for a full check.",
  "grade.trySample": "Or practise on one of ours:",
  "grade.sampleLabel": "Practice question",
  "grade.useOwn": "Use my own question",
  "grade.yourAnswer": "Your answer",
  "grade.phAnswer": "Write or paste your answer here — or upload a photo or PDF of it below…",
  "grade.upload": "Upload photo or PDF",
  "grade.readingFile": "Reading your file…",
  "grade.words": "{n} words",
  "grade.oneWord": "1 word",
  "grade.minHint": "{n}+ to grade",
  "grade.maxHint": "max {n}",
  "grade.submit": "Grade my writing",
  "grade.grading": "Grading…",
  "grade.gradingNote": "Reading it the way an examiner would — this takes up to a minute.",
  "grade.freeLeft": "{n} of {total} free gradings left — no account needed.",
  "grade.freeNone": "You've used your free gradings for now.",
  "grade.errLimit": "You've used your free gradings for now. Sign in to keep going.",
  "grade.errBusy": "The free checker is busy right now — please try again in a few minutes.",
  "grade.errShort": "Add a bit more — at least {n} words to grade.",
  "grade.errLong": "That's over {n} words — shorten it to grade it here.",
  "grade.errQuestionLong": "That question is too long — shorten it, or leave it blank.",
  "grade.errFailed": "Grading failed this time — please try again in a moment.",
  "grade.errUnavailable": "CEFR grading isn't available right now — please try again later.",
  "grade.errGeneric": "Something went wrong — please try again.",
  "grade.errNetwork": "Network error — please try again.",
  "grade.errFileSize": "That file is too large — keep it under 8 MB.",
  "grade.errFileType": "Upload a PNG, JPG or WEBP image, or a PDF.",
  "grade.errFileEmpty": "That file is empty.",
  "grade.errFileNoText": "Couldn't find readable writing in that file — try a clearer photo.",
  "grade.errFileRead": "Couldn't read that file — try a clearer photo or PDF.",
  "grade.wallTitle": "You've used your free gradings",
  "grade.wallBody":
    "Sign in to keep grading — and get sentence-level fixes on your writing, a Band 9 model answer, and the revision loop to rewrite and re-grade.",
  "grade.close": "Close",
  "grade.again": "Grade another",
  "grade.gradedAs": "Graded as {task}",
  "grade.leftN": "{n} free gradings left",
  "grade.leftOne": "1 free grading left",
  "grade.leftNone": "No free gradings left",
  "grade.overall": "Overall band",
  "grade.withFixes": "Up to {band} with the fixes",
  "grade.fixFirst": "Fix this first",
  "grade.plusBand": "+{n} band",
  "grade.tagStrong": "Strong",
  "grade.tagSolid": "Solid",
  "grade.tagWork": "Needs work",
  "grade.tagCapping": "Capping",
  "grade.evidence": "In your writing",
  "grade.caps": "What's capping it",
  "grade.fix": "Fix",
  "grade.deeperTitle": "Go deeper with a free account",
  "grade.deeperBody":
    "Sentence-level fixes marked on your writing, a Band 9 model answer for the same task, and the revision loop — rewrite and re-grade until it's ready.",
  "grade.cefrLevel": "Indicative level",
  "grade.cefrOutOf": "out of 100",
  "grade.cefrTarget": "Task {task} · {level} target",
  "grade.inRange": "{n} words · in range",
  "grade.outOfRange": "{n} words · outside {lo}–{hi}",
  "grade.examiner": "Examiner's comment",
  "grade.strengths": "Strengths",
  "grade.improve": "To improve",
  "grade.suggested": "Suggested fixes",
  "grade.notGradable": "That answer couldn't be graded — write a little more and try again.",
  "grade.cefrNote":
    "An indicative CEFR level from an AI examiner, for practice — not an official Multilevel result.",
  "grade.howEyebrow": "How it works",
  "grade.howTitle": "Three steps, about a minute",
  "grade.step1T": "Pick the task",
  "grade.step1B": "Task 1, Task 2 or a CEFR Multilevel task — each is marked on its own criteria.",
  "grade.step2T": "Write, paste or upload",
  "grade.step2B":
    "Use your own question, one of ours, or none at all. A photo of handwriting works too.",
  "grade.step3T": "Get the score and the fixes",
  "grade.step3B":
    "A band for every criterion — or an indicative CEFR level — with what is holding it back and the fix that matters most.",
  "grade.faqTitle": "Frequently asked questions",
  "grade.faq1q": "How accurate is the score?",
  "grade.faq1a":
    "The IELTS grader is grounded in the official public band descriptors and anchored to annotated sample answers at every band. It scores each criterion separately, with evidence, and it is deliberately conservative: when your writing sits between two bands, it rounds down — so the band you see here is one you can defend on exam day.",
  "grade.faq2q": "Is this writing checker really free?",
  "grade.faq2a":
    "Yes. You can grade your writing here without creating an account. A free account adds sentence-level fixes, a Band 9 model answer, and the revision loop where you rewrite and re-grade the same piece.",
  "grade.faq3q": "Can I upload a photo or PDF of my writing?",
  "grade.faq3a":
    "Yes — upload a photo of your handwritten answer or a PDF, and we transcribe it exactly as written (no corrections), so the grader sees your real writing. Check the text, then grade.",
  "grade.faq4q": "What does the checker grade?",
  "grade.faq4a":
    "IELTS Writing Task 1 — Academic reports and General Training letters — and Task 2 essays, on the four official criteria: Task Achievement or Task Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy. And CEFR Multilevel Writing Tasks 1.1, 1.2 and 2, with an indicative CEFR level and scores for task, coherence, vocabulary, grammar and register.",
  "grade.faq5q": "Can I check an Academic Task 1 report without the chart?",
  "grade.faq5a":
    "Yes, but without the chart the numbers can't be checked, so Task Achievement is judged on your overview, the key features you pick and your comparisons. For a full check, practise on one of our Task 1 questions — the grader sees the chart's data and checks what you reported against it.",
  "grade.faq6q": "Which IELTS writing checker gives the closest band to a real examiner?",
  "grade.faq6a":
    "The only honest test is whether your practice band matches your exam-day band. EngProgress is built for exactly that: grading is grounded in the official public band descriptors, anchored to annotated sample answers at every band, and kept deliberately conservative so it never flatters you. Whichever checker you use, prefer one that shows evidence for every score and errs low — an inflated band is the most expensive kind of wrong.",
  "grade.faq7q": "Why is my band here lower than on other AI checkers?",
  "grade.faq7a":
    "Because we refuse to inflate. Many free tools flatter you with a band you will not get in the exam. Our grader is deliberately conservative: between two bands it rounds down and tells you exactly what is missing for the higher one. A real 6.5 you can trust beats a false 7.0.",
  "grade.faq8q": "Is EngProgress affiliated with IELTS?",
  "grade.faq8a":
    "No. EngProgress is not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment English. All practice questions are original and written for practice.",
  "grade.original": "All questions are original and written for practice.",

  /* ── the blog: the landing section and /blog's chrome ─────────────────
     The ARTICLES stay in English in every locale (see lib/blog/types.ts);
     only the furniture around them is translated. */
  "blog.name": "Blog",
  "blog.eyebrow": "From the blog",
  "blog.title": "Reading worth your time",
  "blog.sub":
    "IELTS strategy, the stories behind English words, and news from EngProgress — written in English, so reading them is practice too.",
  "blog.allStories": "All stories",
  "blog.minRead": "{n} min read",
  "blog.by": "By {author}",
  "blog.updated": "Updated {date}",
  "blog.photo": "Photo: {credit}",
  "blog.catIelts": "IELTS",
  "blog.catMultilevel": "Multilevel",
  "blog.catEnglish": "English",
  "blog.catStories": "Stories",
  "blog.catEngprogress": "EngProgress news",
  "blog.indexTitle": "The EngProgress blog",
  "blog.indexLead":
    "Exam strategy, the stories behind English words, and news from us. Every article is in English — reading it is practice too.",
  "blog.latest": "Latest stories",
  "blog.related": "Read next",
  "blog.shareTelegram": "Share on Telegram",
  "blog.inShort": "In short",
  "blog.faqTitle": "Questions readers ask",
  "blog.practiceEyebrow": "Try it today",
  "blog.practiceBody":
    "Put this article to work: a new practice every day, marked the moment you finish. No account needed.",
  "blog.accountEyebrow": "Free account",
  "blog.accountTitle": "Practise more with a free account",
  "blog.accountCta": "Create a free account",
  "blog.accountHave": "Have an account?",
  "blog.accountSignIn": "Sign in",
  "blog.rss": "EngProgress blog — RSS feed",
  "blog.home": "Home",
  "blog.metaTitle": "Blog — IELTS tips, English stories and news",
  "blog.metaDesc":
    "Practical IELTS strategy, the stories behind English words, and news from EngProgress. Every article is written in English, so reading it is practice too.",

  /* ── landing metadata (SEO) ──────────────────────────────────────────── */
  "lp.metaTitle":
    "IELTS Practice with AI Band Feedback — Writing, Reading, Listening, Speaking & CEFR",
  "lp.metaTitleShort": "IELTS Practice with AI Band Feedback — EngProgress",
  "lp.metaDesc":
    "Practise all four IELTS skills and CEFR with original, AI-generated tasks at your level, then get a calibrated band and the exact fixes that raise it.",
  "lp.metaAlt": "EngProgress IELTS practice dashboard and AI feedback",

  /* ── marketing header ─────────────────────────────────────────────────── */
  "mk.navPlatform": "Platform",
  "mk.navPricing": "Pricing",
  "mk.navHowTo": "How to use",
  "mk.navCenters": "For centers",
  "mk.navPrimary": "Primary",
  "mk.navDashboard": "Dashboard",
  "mk.navStart": "Start learning",
  "mk.navOpenMenu": "Open menu",
  "mk.navCloseMenu": "Close menu",

  /* ── the education-centers band above the footer ──────────────────────── */
  "mk.bandEyebrow": "For education centers",
  "mk.bandTitle": "Run AI-graded IELTS & CEFR practice for every group you teach",
  "mk.bandBody":
    "Center licences include student logins, teacher accounts, group assignments and band reporting. Talk to us about a pilot for your center.",
  "mk.bandContact": "Contact us",
  "mk.bandGuide": "Center guide",

  /* ── site footer ──────────────────────────────────────────────────────── */
  "mk.footTagline": "AI-graded IELTS and CEFR practice for learners and education centers.",
  "mk.footPractice": "Practice",
  "mk.footPlatform": "Platform",
  "mk.footCompany": "Company",
  "mk.footLegal": "Account & legal",
  "mk.footIelts": "IELTS practice",
  "mk.footCefr": "CEFR practice",
  "mk.footHowTo": "How to use",
  "mk.footCenterGuide": "Guide for centers",
  "mk.footCambridge": "Cambridge-style practice",
  "mk.footGrader": "Free essay grader",
  "mk.footCalculator": "Band score calculator",
  "mk.footDemo": "Live demo",
  "mk.footPricing": "Pricing",
  "mk.footForCenters": "For education centers",
  "mk.footContact": "Contact",
  "mk.footSignIn": "Sign in",
  "mk.footCreate": "Create an account",
  "mk.footPrivacy": "Privacy policy",
  "mk.footTerms": "Terms of use",
  "mk.footBuilt": "Built in Tashkent · engprogress.com",
  "mk.footRights": "© 2026 EngProgress. All rights reserved.",
  "mk.footDisclaimer":
    "Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment English. All practice content is original and AI-generated.",

  /* ── pricing cards ────────────────────────────────────────────────────── */
  "price.popular": "POPULAR",
  "price.freeName": "Free",
  "price.freePrice": "Free",
  "price.perMonth": " / month",
  "price.perMonths": " / {n} months",
  "price.ctaTrial": "Start free",
  "price.ctaStarter": "Choose Standard",
  "price.ctaPro": "Choose Pro",
  "price.ctaEnterprise": "Choose Enterprise",
  "price.trial1": "Calibrated, conservative AI grading",
  "price.trial2": "IELTS + CEFR practice, generated fresh",
  "price.trial3": "5 gradings · 5 practice sets / month",
  "price.starter1": "Everything in Free",
  "price.starter2": "25 gradings / month",
  "price.starter3": "25 practice sets / month",
  "price.starter4": "2 live speaking mock tests / month",
  "price.starter5": "Full mock reading tests",
  "price.pro1": "Everything in Standard",
  "price.pro2": "Unlimited gradings",
  "price.pro3": "Unlimited practice sets",
  "price.pro4": "8 live speaking mock tests / month",
  "price.pro5": "Priority grading queue",
  "price.ent1": "Everything in Pro, for 3 months",
  "price.ent2": "One payment — $29.99 per quarter",
  "price.ent3": "Best value: under $10 / month",

  /* ── the four skills, and the tutors ──────────────────────────────────── */
  "lp.skillWritingBody":
    "Task 1 and Task 2, graded per criterion (TR, CC, LR, GRA) with quoted evidence — and a revision loop that re-grades the same essay across drafts.",
  "lp.skillReadingBody":
    "Original passages and every real question type, auto-graded, each answer explained — including why the trap worked on you.",
  "lp.skillListeningBody":
    "Full four-part tests with original multi-voice audio, Cambridge-style question groups, transcripts and per-answer explanations.",
  "lp.skillSpeakingBody":
    "A three-part live mock with an AI examiner, Part-2 cue-card practice, and a tutor that reacts and teaches while you talk.",
  "lp.coachWriting": "Writing tutor",
  "lp.coachWritingBody":
    "Ask it mid-essay: what to put in this paragraph, the exact phrasing, why a sentence is not landing. It shows the move on a different topic rather than writing yours.",
  "lp.coachReading": "Reading tutor",
  "lp.coachReadingBody":
    "Mid-passage, it tells you where to look and which words to compare — but never whether Q7 is True. Full explanations unlock the moment you submit.",
  "lp.coachSpeaking": "Speaking tutor",
  "lp.coachSpeakingBody":
    "Talk and it reacts, corrects and teaches on every turn — and switches to Uzbek when you do.",
  "lp.coachStudy": "Study coach",
  "lp.coachStudyBody":
    "The plan, not the task: what to practise next, and how to spend the weeks you have left before the test.",
  /* ── hero demo (the animated banner) ──────────────────────────────────── */
  "hd.yourEssay": "Your essay · Task 2",
  "hd.criterionBands": "Criterion bands",
  "hd.overall": "Overall {band}.",
  "hd.overallNote": "Lexical range caps it — the fixes are named.",
  "hd.readingPassage": "Reading passage · generated now",
  "hd.listeningAudio": "Listening · multi-voice audio",
  "hd.part2Map": "Part 2 · map",
  "hd.chipParts": "4 parts · 40 questions",
  "hd.chipBand": "Band scored",
  "hd.chipTraps": "Trap explanations",
  "hd.fresh": "Fresh for every session.",
  "hd.freshNote": "Never a recycled test, never an answer you remember.",
  "hd.examiner": "AI Examiner",
  "hd.generator": "Practice generator",
  "hd.examinerDoing": "grading a Task 2 essay",
  "hd.generatorDoing": "composing a Cambridge-style test",
  "hd.tabGrading": "Grading",
  "hd.tabGenerating": "Generating",

  /* ── the band-9 card in the hero ──────────────────────────────────────── */
  "b9.achievable": "Band 9 achievable",
  "b9.result": "Examiner Result",
  "b9.verified": "Per criterion · rounded down",
  "b9.overallBand": "OVERALL BAND",
  /* ── the sign-up dialog ───────────────────────────────────────────────── */
  "su.title": "Create your free account",
  "su.sub": "Free to start, with no card and no time limit.",
  "su.freeHead": "What's free",
  "su.freeGrades": "AI gradings — {n} a month",
  "su.freePractice": "New practice sets — {n} a month",
  "su.freeMock": "Live speaking mock test — {n} a month",
  "su.freeLibrary": "Ready-made practices — {n}, yours to keep",
  "su.freeMore": "Standard and Pro open more, from {price} a month.",
  "su.close": "Close",
  "su.google": "Sign up with Google",
  "su.googleWait": "Opening Google…",
  "su.or": "OR",
  "su.name": "Full name",
  "su.phone": "Phone",
  "su.optional": "(optional)",
  "su.email": "Email",
  "su.password": "Password",
  "su.passwordHint": "At least 8 characters",
  "su.referral": "Referral code",
  "su.referralHint": "If someone invited you",
  "su.submit": "Create account",
  "su.submitting": "Creating…",
  "su.legalPre": "By creating an account you agree to our",
  "su.terms": "Terms of Service",
  "su.legalMid": "and",
  "su.privacy": "Privacy Policy",
  "su.legalPost": ".",

  /* ── the centre application ───────────────────────────────────────────── */
  "rc.promptTitle": "Are you an education center?",
  "rc.promptBody":
    "Register here and we will issue logins for your teachers and students. Applications are reviewed by hand, and we confirm by email.",
  "rc.promptShort": "We'll issue logins for your students and teachers.",
  "rc.promptCta": "Register here",
  "rc.title": "Register your center",
  "rc.sub":
    "We review each application by hand. Once it is approved you can invite teachers and issue student logins.",
  "rc.close": "Close",
  "rc.received": "Application received",
  "rc.receivedNote":
    "We review every center by hand and email you as soon as yours is approved — usually within a working day.",
  "rc.loginPre": "Your login is",
  "rc.loginPost": "— sign in with that and the password you just chose, not with your email.",
  "rc.done": "Done",
  "rc.orgName": "Official organization name",
  "rc.contactEmail": "Contact email",
  "rc.login": "Login for the center",
  "rc.loginHint": "3–32 characters: letters, digits, and . _ - in the middle.",
  "rc.password": "Password",
  "rc.passwordHint": "At least 8 characters",
  "rc.submit": "Submit application",
  "rc.submitting": "Submitting…",
  /* ── demo strip (screen-reader labels) ────────────────────────────────── */
  "demo.screens": "Product demo screens",
  "demo.loading": "Loading product demo",
  "demo.loadingReports": "Loading reports",
  /* ── the demo strip's tabs ────────────────────────────────────────────── */
  "dt.wfLabel": "Writing feedback",
  "dt.wfTitle": "Examiner-style Writing feedback",
  "dt.wfBlurb":
    "Every essay is graded criterion by criterion — Task Response, Coherence, Lexis, Grammar — with evidence quoted from your own sentences, what caps each band, and the exact fix.",
  "dt.wsLabel": "Writing studio",
  "dt.wsTitle": "A real exam writing room",
  "dt.wsBlurb":
    "Task 1 and Task 2 prompts generated fresh every time, an exam timer, autosave, and resubmission — revise the same essay and watch the band move.",
  "dt.rdLabel": "Reading test",
  "dt.rdTitle": "Cambridge-style Reading, generated fresh",
  "dt.rdBlurb":
    "Full passages in the authentic layout with every real question type. After grading, every wrong answer explains why the trap worked.",
  "dt.lsLabel": "Listening test",
  "dt.lsTitle": "Full Listening tests with original audio",
  "dt.lsBlurb":
    "Multi-voice recordings across six difficulty levels — full four-section tests or quick practices, with transcripts and per-answer explanations.",
  "dt.spLabel": "Speaking mock",
  "dt.spTitle": "A full 3-part mock with a live examiner",
  "dt.spBlurb":
    "Talk to an AI examiner through all three parts — interview, the cue-card long turn with prep time, then the discussion. Scored on the four official criteria, with your own words quoted back.",
  "dt.coLabel": "Study coach",
  "dt.coTitle": "A coach that knows your history",
  "dt.coBlurb":
    "The study coach reads your past attempts — every band, every weak criterion — and tells you what to practice next and why.",
  "dt.pgLabel": "Progress & stats",
  "dt.pgTitle": "Your band, tracked honestly",
  "dt.pgBlurb":
    "Current band versus target, your weakest criterion, and progress over time — a conservative estimate you can trust on exam day.",
  "b9.sub":
    "The band a Cambridge-trained examiner would award — and the exact path there from wherever you are starting.",
  "hd.withFixes": "7.0 with fixes",
  "language.switching": "Switching language…",
} as const;

/** The key set every locale must satisfy. */
export type MessageKey = keyof typeof en;

/** The shape a locale file has to fill. `string` rather than the literal types,
 *  so a translation is not required to equal the English text. */
export type Messages = Record<MessageKey, string>;
