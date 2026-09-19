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
} as const;

/** The key set every locale must satisfy. */
export type MessageKey = keyof typeof en;

/** The shape a locale file has to fill. `string` rather than the literal types,
 *  so a translation is not required to equal the English text. */
export type Messages = Record<MessageKey, string>;
