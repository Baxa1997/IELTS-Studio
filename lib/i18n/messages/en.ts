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
  "theme.note": "Use the button in the bottom-right corner to switch quickly. Pick System to follow your device.",
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
} as const;

/** The key set every locale must satisfy. */
export type MessageKey = keyof typeof en;

/** The shape a locale file has to fill. `string` rather than the literal types,
 *  so a translation is not required to equal the English text. */
export type Messages = Record<MessageKey, string>;
