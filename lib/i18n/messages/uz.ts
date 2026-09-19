import type { Messages } from "./en";

/**
 * Uzbek (Latin script).
 *
 * Written in the modern Latin orthography with the modifier letter ʻ in oʻ and
 * gʻ (U+02BB), not an ASCII apostrophe — `Oʻzbekcha`, not `O'zbekcha`. The two
 * look almost identical in a terminal and sort differently everywhere else.
 *
 * The four skill names are the terms Uzbek IELTS centres actually use in class
 * rather than literal translations of the English nav labels.
 */
export const uz: Messages = {
  "nav.dashboard": "Boshqaruv paneli",
  "nav.studyPlan": "Oʻquv rejasi",
  "nav.activities": "Mashgʻulotlar",
  "nav.referrals": "Takliflar",
  "nav.assignments": "Uy vazifalari",
  "nav.writing": "Yozish",
  "nav.reading": "Oʻqish",
  "nav.listening": "Tinglash",
  "nav.speaking": "Gapirish",
  "nav.cefr": "CEFR mashqi",
  "nav.vocabulary": "Lugʻat",
  "nav.notifications": "Bildirishnomalar",
  "nav.settings": "Sozlamalar",
  "nav.signOut": "Chiqish",

  "nav.assistant": "Yordamchi",
  "nav.groups": "Guruhlar",
  "nav.students": "Oʻquvchilar",
  "nav.teachers": "Oʻqituvchilar",
  "nav.calendar": "Kalendar",
  "nav.finance": "Moliya",
  "nav.invoices": "Hisob-fakturalar",
  "nav.salary": "Ish haqi",
  "nav.practices": "Mashqlar",
  "nav.marking": "Baholash",
  "nav.results": "Natijalar",
  "nav.announcements": "Eʼlonlar",
  "nav.takePayment": "Toʻlovni qabul qilish",
  "nav.attendance": "Davomat",
  "nav.certificates": "Sertifikatlar",

  "nav.assistantAi": "AI yordamchi",
  "nav.centers": "Markazlar",
  "nav.moderation": "Moderatsiya",
  "nav.myPay": "Mening ish haqim",
  "nav.overview": "Umumiy koʻrinish",
  "nav.plansRevenue": "Tariflar va daromad",
  "nav.practice": "Mashq",
  "nav.practiceWithAi": "AI bilan ingliz tilini mashq qiling",
  "nav.systemHealth": "Tizim holati",
  "nav.users": "Foydalanuvchilar",

  "nav.section.centre": "Markaz",
  "nav.section.learning": "Oʻrganish",
  "nav.section.money": "Moliya",
  "nav.section.operations": "Operatsiyalar",
  "nav.section.platform": "Platforma",
  "nav.section.practice": "Mashq",
  "nav.section.practices": "Mashqlar",
  "nav.section.teaching": "Oʻqitish",
  "nav.section.you": "Siz",

  "common.save": "Saqlash",
  "common.saving": "Saqlanmoqda…",
  "common.cancel": "Bekor qilish",
  "common.continue": "Davom etish",
  "common.back": "Orqaga",
  "common.next": "Keyingi",
  "common.close": "Yopish",
  "common.delete": "Oʻchirish",
  "common.edit": "Tahrirlash",
  "common.loading": "Yuklanmoqda…",
  "common.retry": "Qayta urinish",
  "common.search": "Qidirish",
  "common.submit": "Yuborish",
  "common.start": "Boshlash",
  "common.finish": "Tugatish",

  "appearance.title": "Koʻrinish va til",
  "appearance.note": "EngProgress qanday koʻrinishi va qaysi tilda gapirishi",
  "theme.label": "Mavzu",
  "theme.note":
    "Tez almashtirish uchun pastki oʻng burchakdagi tugmadan foydalaning. Qurilmangizga ergashishi uchun «Tizim» rejimini tanlang.",
  "theme.light": "Yorugʻ",
  "theme.dark": "Qorongʻi",
  "theme.system": "Tizim",
  "theme.switchToDark": "Qorongʻi rejimga oʻtish",
  "theme.switchToLight": "Yorugʻ rejimga oʻtish",
  "language.label": "Til",
  "language.note": "Faqat menyu va tugmalar — mashq mazmuni ingliz tilida qoladi.",
  "language.change": "Tilni oʻzgartirish",

  "settings.account": "Hisob",
  "settings.account.note": "Ism, telefon va parol",
  "settings.goal": "Oʻquv maqsadi",
  "settings.goal.note": "Maqsadli ball va imtihon sanasi",
  "settings.billing": "Toʻlov va tarif",
  "settings.billing.note": "Tarifingiz va shu oygi foydalanish",
  "settings.delete": "Hisobni oʻchirish",
  "settings.delete.note": "Hisobingizni butunlay oʻchirish",
  "settings.appearance.note": "Mavzu va interfeys tili",

  /* ── boshqaruv paneli ───────────────────────────────────────────────── */
  "dash.eyebrow": "Boshqaruv panelingiz",
  "dash.welcome": "Xush kelibsiz",
  "dash.welcomeName": "Xush kelibsiz, {name}",
  "dash.targetBand": "Maqsad: Band {band}",
  "dash.daysToTest": "Imtihoningizga {days} kun qoldi",
  "dash.dayToTest": "Imtihoningizga {days} kun qoldi",
  "dash.setExamDate": "imtihon sanasini belgilang",
  "dash.nextTask": "Keyingi vazifa · siz uchun tanlandi",
  "dash.thisWeek": "Shu hafta",
  "dash.streak": "{days} kunlik seriya",
  "dash.weeklyGoal": "Haftalik maqsad",
  "dash.tasksOf": "{done} / {goal} vazifa",
  "dash.goalReached": "Maqsadga erishildi — barakalla.",
  "dash.moreToGoStreak": "Yana {n} ta qoldi — seriyani uzmang.",
  "dash.moreToGo": "Yana {n} ta qoldi — bugun mashq qilib seriyani boshlang.",
  "dash.adjustPlan": "Rejani oʻzgartirish",
  "dash.focusAreas": "Eʼtibor talab qiladigan yoʻnalishlar",
  "dash.notMeasured": "Hali oʻlchanmagan",
  "dash.avgBand": "oʻrtacha band {band}",
  "dash.gradeToFind": "Bilish uchun esse yozing",
  "dash.setToFind": "Bilish uchun bitta toʻplam ishlang",
  "dash.correctOf": "{pct}% toʻgʻri · {correct}/{attempted}",
  "dash.recentResults": "Soʻnggi natijalar",
  "dash.allActivities": "Barcha mashgʻulotlar",
  "dash.noResults": "Hozircha natija yoʻq — baholangan ishlaringiz shu yerda chiqadi.",
  "dash.baseline": "boshlangʻich",
  "dash.paid": "Toʻlov qabul qilindi — Pro tarifingiz faollashmoqda. Mashqdan bahramand boʻling!",
  "dash.cancelled": "Toʻlov bekor qilindi — siz hamon bepul tarifdasiz.",

  /* ── mashq kartasi ───────────────────────────────────────────────────── */
  "card.new": "Yangi",
  "card.paused": "Toʻxtatilgan",
  "card.retake": "Qayta ishlash",
  "card.review": "Koʻrib chiqish",
  "card.attach": "Biriktirish",
  "card.pro": "Pro",
  "card.unlockPro": "Pro bilan oching",
  "card.attachClass": "Guruhga biriktirish",

  /* ── reading boʻlimi ─────────────────────────────────────────────────── */
  "read.yourTests": "Testlaringiz",
  "read.yourPassages": "Matnlaringiz",
  "read.ready": "Boshlashga tayyor",
  "read.noTests":
    "Hozircha tayyor test yoʻq — yuqorida yarating. Har biri 3 ta matn, 40 ta savol boʻyicha baholanadi.",
  "read.noPassages": "Hozircha tayyor matn yoʻq — yuqorida yarating.",
  "read.fullTest": "Toʻliq reading testi",
  "read.fullTestMeta": "3 ta matn · 60 daqiqa",
  "read.fullTestBlurb": "Darajangizga moslangan, murakkabligi ortib boruvchi uchta original matn.",
  "read.generateTest": "Yangi test yaratish",
  "read.passage": "Matn mashqi",
  "read.passageMeta": "1 ta matn · ~20 daqiqa",
  "read.passageBlurb": "Baholanadigan savollari bilan bitta original matn (~20 daqiqa)",
  "read.generatePassage": "Yangi matn yaratish",
  "read.disclaimer":
    "IELTS Academic Reading formatidagi original matnlar. IELTS® bilan aloqador emas va u tomonidan tasdiqlanmagan.",

  /* ── writing boʻlimi ─────────────────────────────────────────────────── */
  "write.hub": "Writing mashqi",
  "write.intro":
    "Yozgan essengizni tekshiring, mavzu tanlang yoki yangisini yarating. Har bir mezon boʻyicha imtihonchidek qatʼiy band olasiz — soʻng oʻsha javobni xohlagan darajangizga yetguncha qayta ishlaysiz.",
  "write.question": "Savol",
  "write.questionTask": "Savol / topshiriq",
  "write.pasteExact": "Topshiriqni javob yozgan holida aynan joylashtiring",
  "write.yourEssay": "Essengiz",
  "write.gradedReal": "Haqiqiy imtihondek baholanadi",
  "write.perCriterion": "Har bir mezon boʻyicha qatʼiy band va tuzatishlar",
  "write.conservative":
    "Ehtiyotkor va imtihonchidek qatʼiy — bu yerdagi bandingiz imtihon kunidagi bandingiz.",
  "write.pasteOwn": "Oʻz savolingizni joylashtiring",
  "write.pasteOwnNote":
    "Darsdan yoki kitobdan aniq savol bormi? Joylashtiring — javobingizni oʻsha savolga qarab baholaymiz.",
  "write.anyBand": "Har qanday band",
  "write.noTopics":
    "Hozircha tayyor mavzu yoʻq — birinchisini yaratish uchun yuqoridagi “AI yangi mavzu tanlasin” tugmasidan foydalaning.",
  "write.noMatch": "Filtrlarga mos mavzu yoʻq.",
  "write.classLevel": "Guruh darajasi",
  "write.classLevelNote":
    "Soʻz va gʻoyalar qanchalik murakkabligi. Yakka mashq qilayotgan oʻquvchiga bu oʻlchangan bandidan kelib chiqib beriladi — guruhda yagona band yoʻq, shuning uchun buni siz tanlaysiz.",
  "write.questionType": "Savol turi",
  "write.optional": "(ixtiyoriy)",
  "write.anySurprise": "Farqi yoʻq — oʻzingiz tanlang",
  "write.topicPref": "Mavzu tanlovi",
  "write.grading": "AI essengizni baholamoqda…",
  "write.gradingNote":
    "Har bir mezonni imtihonchidek oʻqiyapti — Task, Coherence, Vocabulary, Grammar. Bu 15–30 soniya oladi; iltimos, bu oynani yopmang.",
  "write.gradingTitle": "Essengiz baholanmoqda",
  "write.rewrite": "Qayta yozish",
  "write.feedback": "Fikr-mulohaza",
  "write.draft": "Qoralama",
  "write.practised": "Ishlangan",
  "write.checkOwn": "Oʻz yozganingizni tekshirish",
  "write.acadT1": "Academic · Task 1",
  "write.acadT2": "Academic · Task 2",
  "write.gt": "General Training",
  "write.phQuestion": "Aniq IELTS savoli yoki topshirigʻini joylashtiring…",
  "write.phEssay": "Toʻliq javobingizni shu yerga yozing yoki joylashtiring…",
  "write.phFull": "Toʻliq IELTS writing savolini shu yerga joylashtiring…",
  "write.letAI": "AI yangi mavzu tanlasin",
  "write.generate": "Mavzu yaratish",
  "write.searchTopics": "Mavzularni qidirish…",
  "write.filterBand": "Maqsad band boʻyicha filtr",
  "write.newPractice": "Yangi mashq",
  "write.egTopics": "masalan: shahar transporti, masofaviy ish",
  "write.disclaimer":
    "IELTS Writing formatidagi AI yaratgan topshiriqlar. IELTS® bilan aloqador emas va u tomonidan tasdiqlanmagan.",

  /* ── listening boʻlimi ───────────────────────────────────────────────── */
  "listen.preparing": "Tayyorlanmoqda…",
  "listen.resume": "Davom ettirish",

  /* ── bosh sahifa ─────────────────────────────────────────────────────── */
  "lp.eyebrow": "AI · IELTS va CEFR",
  "lp.heroA": "Professional AI platforma:",
  "lp.heroB": "IELTS va CEFR",
  "lp.heroC": "mashqlar",
  "lp.heroLead":
    "Mutlaq boshlovchidan Band 9 gacha. AI sizning darajangizga mos Writing, Reading, Listening va Speaking topshiriqlarini imtihon standartida yaratadi, mashq paytida yoʻl koʻrsatadi va rasmiy IELTS bandlari hamda CEFR mezonlari boʻyicha baholaydi.",
  "lp.ctaStart": "Bepul baholashni boshlash",
  "lp.ctaHow": "Qanday ishlashini koʻring",
  "lp.noCard": "Karta shart emas · Boshlovchidan Band 9 gacha · CEFR A1–C2",
  "lp.platform": "Platforma",
  "lp.platformLead":
    "Toʻrtala koʻnikma va CEFR — har safar yangidan yaratiladi, haqiqiy mezonlar boʻyicha baholanadi",
  "lp.platformNote":
    "Bu yerda oʻtgan yillar varianti yoʻq. Har bir topshiriq original va sizning darajangizda imtihon talablariga koʻra yaratiladi — Band 4 dagi ilk urinish boʻladimi yoki 9 ga soʻnggi qadam — shuning uchun mazmunni oldindan yodlab boʻlmaydi.",
  "lp.cefrTitle": "Oʻzbekiston DTM imtihoni uchun CEFR / Multilevel",
  "lp.cefrNote":
    "Reading (5 qism, 35 savol) va Writing (3 topshiriq) — talab boʻyicha yaratiladi va CEFR mezonlari asosida baholanadi.",
  "lp.cefrCta": "CEFR mashqlarini koʻrish",
  "lp.coachEyebrow": "Faqat baho emas — yoʻl koʻrsatish",
  "lp.coachTitle": "Mashq paytida yoningizda ustoz turadi",
  "lp.coachNote":
    "Esse yoki matn oʻrtasida qotib qolsangiz, shunchaki soʻrang. U shu zahoti, xohlasangiz oʻz tilingizda javob beradi — va vaqt ketayotganda tayyor javobni bermaydi, shuning uchun yakuniy bandingiz oʻzingizniki boʻlib qoladi.",
  "lp.coachCta": "Yoʻl koʻrsatish qanday ishlashini koʻring",
  "lp.pricing": "Narxlar",
  "lp.pricingLead": "Bepul boshlang. Har kuni mashq qila boshlaganingizda tarifni koʻtaring.",
  "lp.faqEyebrow": "Savollar",
  "lp.faqTitle": "Avval soʻralishi kerak boʻlgan narsalar",
  "lp.openDemo": "Toʻliq demoni ochish →",
  "lp.finalTitle": "Haqiqiy bandingizni 60 soniyada biling",
  "lp.finalNote":
    "Essengizni joylashtiring, kalibrlangan band va sizni yuqoriga koʻtaradigan bitta tuzatishni oling — boshlash bepul.",
  "lp.gradeFree": "Essени bepul baholash",
  "lp.buildPlan": "Rejangizni tuzing",
  "lp.statNew": "Shu oydagi yangi oʻquvchilar",
  "lp.statNewNote": "oʻtgan oyda 650 ta edi",
  "lp.statCenters": "Taʼlim markazlari",
  "lp.statCentersNote": "Platformadagi maktab va IELTS markazlari",
  "lp.statUsers": "Jami foydalanuvchilar",
  "lp.statUsersNote": "Oʻquvchilar, oʻqituvchilar va adminlar",
  "lp.statTasks": "Bajarilgan topshiriqlar",
  "lp.statTasksNote": "Baholangan esselar, matnlar va mock testlar",
  "lp.disclaimer":
    "IELTS®, British Council, IDP yoki Cambridge Assessment English bilan aloqador emas va ular tomonidan tasdiqlanmagan.",

  /* ── bosh sahifa savollari ───────────────────────────────────────────── */
  "lp.faq1q": "Bu IELTS bilan aloqadormi?",
  "lp.faq1a":
    "Yoʻq. Biz mustaqil mashq vositasimiz — IELTS®, British Council, IDP yoki Cambridge Assessment English bilan aloqador emasmiz va ular tomonidan tasdiqlanmaganmiz. Baholashimiz ochiq band mezonlariga asoslanadi.",
  "lp.faq2q": "Siz haqiqiy oʻtgan yillar variantlaridan foydalanasizmi?",
  "lp.faq2a":
    "Hech qachon. Har bir matn va savol original, AI tomonidan imtihon talablariga koʻra yaratiladi — demak siz hech qachon tarqalib ketgan materialda mashq qilmaysiz va mualliflik huquqi buzilmaydi.",
  "lp.faq3q": "Baholash qanchalik aniq?",
  "lp.faq3a":
    "U inson baholovchilardan taxminan yarim band farq bilan kalibrlangan va ataylab ehtiyotkor. Ikki band orasida turganingizda pastrogʻini qoʻyamiz va yuqorisi uchun aynan nima yetishmayotganini aytamiz.",
  "lp.faq4q": "U meni xursand qilish uchun bahoni oshirib yuboradimi?",
  "lp.faq4a":
    "Yoʻq — gap aynan shunda. Soxta 7.0 imtihon kunida ishonchni buzadigan yagona narsa, shuning uchun biz takrorlay olmaydigan raqamni berishdan koʻra qolgan ishni koʻrsatishni afzal koʻramiz.",
  "lp.faq5q": "Speaking va Listening-chi?",
  "lp.faq5a":
    "Ikkalasi ham ishlaydi. Listening toʻliq toʻrt qismli testlar beradi: original koʻp ovozli audio, avtomatik baholash, transkript va tuzoqlar izohi. Speaking esa AI imtihonchi bilan toʻliq uch qismli mock test beradi.",

  /* ── bosh sahifa boʻlimlari ──────────────────────────────────────────── */
  "lp.demoEyebrow": "Ishlayotganini koʻring",
  "lp.demoTitle": "Maketlar emas, haqiqiy mahsulot",
  "lp.demoSub":
    "Bular EngProgress ning haqiqiy ekranlari — fikr-mulohaza, testlar, ustoz — rasm emas, jonli koʻrinishda.",
  "lp.proofEyebrow": "Isbot",
  "lp.proofTitle": "Baholovchining haqiqiy hisobotlari",
  "lp.proofSub":
    "Imtihonchi tizimi haqiqatda chiqaradigan hisobot koʻrinishi. Ataylab ehtiyotkor: ikki band orasida pastrogʻini qoʻyadi va nima yetishmayotganini aniq aytadi.",

  /* ── bosh sahifa metama'lumotlari (SEO) ──────────────────────────────── */
  "lp.metaTitle":
    "AI band baholashi bilan IELTS mashqi — Writing, Reading, Listening, Speaking va CEFR",
  "lp.metaTitleShort": "AI band baholashi bilan IELTS mashqi — EngProgress",
  "lp.metaDesc":
    "Toʻrtala IELTS koʻnikmasi va CEFR ni darajangizga mos original AI topshiriqlari bilan mashq qiling, soʻng kalibrlangan band va uni koʻtaradigan aniq tuzatishlarni oling.",
  "lp.metaAlt": "EngProgress IELTS mashq paneli va AI fikr-mulohazasi",
};
