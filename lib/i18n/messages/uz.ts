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

  /* ── documentation guides (the tab rail's own chrome) ─────────────── */
  "doc.onThisPage": "Ushbu sahifada",
  "doc.elsewhere": "Boshqa joyda",
  "doc.soon": "TEZDA",

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
  "practice.level": "{n}-daraja",
  "practice.levelMixed": "Aralash darajalar",

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

  /* ── marketing header ─────────────────────────────────────────────────── */
  "mk.navPlatform": "Platforma",
  "mk.navPricing": "Narxlar",
  "mk.navHowTo": "Qanday ishlatiladi",
  "mk.navCenters": "Markazlar uchun",
  "mk.navPrimary": "Asosiy",
  "mk.navDashboard": "Boshqaruv paneli",
  "mk.navStart": "Oʻrganishni boshlash",
  "mk.navOpenMenu": "Menyuni ochish",
  "mk.navCloseMenu": "Menyuni yopish",

  /* ── the education-centers band above the footer ──────────────────────── */
  "mk.bandEyebrow": "Taʼlim markazlari uchun",
  "mk.bandTitle":
    "Oʻzingiz dars beradigan har bir guruh uchun AI baholaydigan IELTS va CEFR mashqlari",
  "mk.bandBody":
    "Markaz litsenziyasiga oʻquvchi loginlari, oʻqituvchi hisoblari, guruh vazifalari va band boʻyicha hisobotlar kiradi. Markazingiz uchun sinov haqida biz bilan bogʻlaning.",
  "mk.bandContact": "Biz bilan bogʻlanish",
  "mk.bandGuide": "Markaz qoʻllanmasi",

  /* ── site footer ──────────────────────────────────────────────────────── */
  "mk.footTagline":
    "Oʻquvchilar va taʼlim markazlari uchun AI baholaydigan IELTS va CEFR mashqlari.",
  "mk.footPractice": "Mashqlar",
  "mk.footPlatform": "Platforma",
  "mk.footCompany": "Kompaniya",
  "mk.footLegal": "Hisob va huquqiy maʼlumot",
  "mk.footIelts": "IELTS mashqlari",
  "mk.footCefr": "CEFR mashqlari",
  "mk.footHowTo": "Qanday ishlatiladi",
  "mk.footCenterGuide": "Markazlar uchun qoʻllanma",
  "mk.footCambridge": "Cambridge uslubidagi mashqlar",
  "mk.footGrader": "Bepul esse baholovchi",
  "mk.footDemo": "Jonli demo",
  "mk.footPricing": "Narxlar",
  "mk.footForCenters": "Taʼlim markazlari uchun",
  "mk.footContact": "Aloqa",
  "mk.footSignIn": "Kirish",
  "mk.footCreate": "Hisob yaratish",
  "mk.footPrivacy": "Maxfiylik siyosati",
  "mk.footTerms": "Foydalanish shartlari",
  "mk.footBuilt": "Toshkentda yaratilgan · engprogress.com",
  "mk.footRights": "© 2026 EngProgress. Barcha huquqlar himoyalangan.",
  "mk.footDisclaimer":
    "IELTS®, British Council, IDP yoki Cambridge Assessment English bilan aloqador emas va ular tomonidan tasdiqlanmagan. Barcha mashq materiallari original va AI tomonidan yaratilgan.",

  /* ── pricing cards ────────────────────────────────────────────────────── */
  "price.popular": "OMMABOP",
  "price.freeName": "Bepul",
  "price.freePrice": "Bepul",
  "price.perMonth": " / oyiga",
  "price.perMonths": " / {n} oyga",
  "price.ctaTrial": "Bepul boshlash",
  "price.ctaStarter": "Standard ni tanlash",
  "price.ctaPro": "Pro ni tanlash",
  "price.ctaEnterprise": "Enterprise ni tanlash",
  "price.trial1": "Kalibrlangan, ehtiyotkor AI baholash",
  "price.trial2": "IELTS va CEFR mashqlari — har safar yangidan yaratiladi",
  "price.trial3": "Oyiga 5 ta baholash · 5 ta mashq toʻplami",
  "price.starter1": "Bepul tarifdagi hamma narsa",
  "price.starter2": "Oyiga 25 ta baholash",
  "price.starter3": "Oyiga 25 ta mashq toʻplami",
  "price.starter4": "Oyiga 2 ta jonli speaking mock test",
  "price.starter5": "Toʻliq mock reading testlari",
  "price.pro1": "Standard tarifdagi hamma narsa",
  "price.pro2": "Cheksiz baholash",
  "price.pro3": "Cheksiz mashq toʻplamlari",
  "price.pro4": "Oyiga 8 ta jonli speaking mock test",
  "price.pro5": "Navbatsiz, birinchi boʻlib baholash",
  "price.ent1": "Pro tarifdagi hamma narsa, 3 oy davomida",
  "price.ent2": "Bitta toʻlov — chorakiga $29.99",
  "price.ent3": "Eng foydalisi: oyiga $10 dan arzon",

  /* ── the four skills, and the tutors ──────────────────────────────────── */
  "lp.skillWritingBody":
    "Task 1 va Task 2 har bir mezon (TR, CC, LR, GRA) boʻyicha, matningizdan keltirilgan dalillar bilan baholanadi — va bitta essening qayta yozilgan variantlarini qayta baholaydigan tahrir sikli.",
  "lp.skillReadingBody":
    "Original matnlar va barcha haqiqiy savol turlari, avtomatik baholanadi, har bir javob izohlanadi — qaysi tuzoq nega ishlagani ham.",
  "lp.skillListeningBody":
    "Original koʻp ovozli audio bilan toʻliq toʻrt qismli testlar, Cambridge uslubidagi savol guruhlari, transkriptlar va har bir javob uchun izoh.",
  "lp.skillSpeakingBody":
    "AI imtihon oluvchi bilan uch qismli jonli mock, Part-2 cue-card mashqi va siz gapirayotganda javob qaytarib, oʻrgatadigan tutor.",
  "lp.coachWriting": "Yozish tutori",
  "lp.coachWritingBody":
    "Esse yozayotib soʻrang: bu paragrafga nima yozish kerak, aniq qanday ifodalash, nega bu gap taʼsir qilmayapti. U sizning esseyingizni yozib bermaydi — oʻsha usulni boshqa mavzuda koʻrsatadi.",
  "lp.coachReading": "Oʻqish tutori",
  "lp.coachReadingBody":
    "Matn oʻrtasida qayerga qarash va qaysi soʻzlarni solishtirish kerakligini aytadi — lekin Q7 True ekanini hech qachon aytmaydi. Toʻliq izohlar siz topshirgan zahoti ochiladi.",
  "lp.coachSpeaking": "Gapirish tutori",
  "lp.coachSpeakingBody":
    "Gapiring — u har bir javobingizga munosabat bildiradi, xatoni tuzatadi va oʻrgatadi; siz oʻzbekchaga oʻtsangiz, u ham oʻtadi.",
  "lp.coachStudy": "Oʻquv murabbiyi",
  "lp.coachStudyBody":
    "Vazifa emas, reja: keyin nimani mashq qilish kerak va imtihongacha qolgan haftalarni qanday taqsimlash kerak.",
  /* ── hero demo (the animated banner) ──────────────────────────────────── */
  "hd.yourEssay": "Sizning esseyingiz · Task 2",
  "hd.criterionBands": "Mezonlar boʻyicha band",
  "hd.overall": "Umumiy {band}.",
  "hd.overallNote": "Lugʻat boyligi cheklab turibdi — tuzatishlar aniq koʻrsatilgan.",
  "hd.readingPassage": "Oʻqish matni · hozir yaratildi",
  "hd.listeningAudio": "Tinglash · koʻp ovozli audio",
  "hd.part2Map": "2-qism · xarita",
  "hd.chipParts": "4 qism · 40 savol",
  "hd.chipBand": "Band qoʻyiladi",
  "hd.chipTraps": "Tuzoqlar izohi",
  "hd.fresh": "Har safar yangi.",
  "hd.freshNote": "Qayta ishlatilgan test ham, siz eslab qolgan javob ham yoʻq.",
  "hd.examiner": "AI imtihon oluvchi",
  "hd.generator": "Mashq generatori",
  "hd.examinerDoing": "Task 2 essesini baholamoqda",
  "hd.generatorDoing": "Cambridge uslubidagi test tuzmoqda",
  "hd.tabGrading": "Baholash",
  "hd.tabGenerating": "Yaratish",

  /* ── the band-9 card in the hero ──────────────────────────────────────── */
  "b9.achievable": "Band 9 ga erishish mumkin",
  "b9.result": "Imtihon oluvchi natijasi",
  "b9.verified": "Tekshirilgan · kalibrlangan",
  "b9.overallBand": "UMUMIY BAND",
  /* ── the sign-up dialog ───────────────────────────────────────────────── */
  "su.title": "Hisob yarating",
  "su.sub": "Boshlash bepul — karta kerak emas.",
  "su.close": "Yopish",
  "su.google": "Google orqali roʻyxatdan oʻtish",
  "su.googleWait": "Google ochilmoqda…",
  "su.or": "YOKI",
  "su.name": "Toʻliq ism",
  "su.phone": "Telefon",
  "su.optional": "(ixtiyoriy)",
  "su.email": "Email",
  "su.password": "Parol",
  "su.passwordHint": "Kamida 8 ta belgi",
  "su.referral": "Taklif kodi",
  "su.referralHint": "Sizni kimdir taklif qilgan boʻlsa",
  "su.submit": "Hisob yaratish",
  "su.submitting": "Yaratilmoqda…",
  "su.legalPre": "Hisob yaratish orqali siz",
  "su.terms": "Foydalanish shartlari",
  "su.legalMid": "va",
  "su.privacy": "Maxfiylik siyosati",
  "su.legalPost": "ga rozilik bildirasiz.",

  /* ── the centre application ───────────────────────────────────────────── */
  "rc.promptTitle": "Siz taʼlim markazimisiz?",
  "rc.promptBody":
    "Shu yerda roʻyxatdan oʻting — oʻqituvchi va oʻquvchilaringiz uchun loginlar beramiz. Arizalar qoʻlda koʻrib chiqiladi, natijani email orqali tasdiqlaymiz.",
  "rc.promptShort": "Oʻquvchi va oʻqituvchilaringiz uchun loginlar beramiz.",
  "rc.promptCta": "Roʻyxatdan oʻtish",
  "rc.title": "Markazingizni roʻyxatdan oʻtkazing",
  "rc.sub":
    "Har bir arizani qoʻlda koʻrib chiqamiz. Tasdiqlangach, oʻqituvchilarni taklif qilib, oʻquvchilarga login berishingiz mumkin.",
  "rc.close": "Yopish",
  "rc.received": "Ariza qabul qilindi",
  "rc.receivedNote":
    "Har bir markazni qoʻlda koʻrib chiqamiz va tasdiqlangan zahoti emailingizga xabar yuboramiz — odatda bir ish kuni ichida.",
  "rc.loginPre": "Sizning loginingiz —",
  "rc.loginPost": "— email bilan emas, shu login va hozir tanlagan parolingiz bilan kiring.",
  "rc.done": "Tayyor",
  "rc.orgName": "Tashkilotning rasmiy nomi",
  "rc.contactEmail": "Aloqa uchun email",
  "rc.login": "Markaz uchun login",
  "rc.loginHint": "3–32 ta belgi: harflar, raqamlar va oʻrtasida . _ - belgilari.",
  "rc.password": "Parol",
  "rc.passwordHint": "Kamida 8 ta belgi",
  "rc.submit": "Arizani yuborish",
  "rc.submitting": "Yuborilmoqda…",
  /* ── demo strip (screen-reader labels) ────────────────────────────────── */
  "demo.screens": "Mahsulot demo ekranlari",
  "demo.loading": "Mahsulot demosi yuklanmoqda",
  "demo.loadingReports": "Hisobotlar yuklanmoqda",
  /* ── the demo strip's tabs ────────────────────────────────────────────── */
  "dt.wfLabel": "Yozish boʻyicha fikr",
  "dt.wfTitle": "Imtihon oluvchi uslubidagi Writing tahlili",
  "dt.wfBlurb":
    "Har bir esse mezon boʻyicha baholanadi — Task Response, Coherence, Lexis, Grammar — oʻz gaplaringizdan keltirilgan dalillar, har bir bandni nima cheklab turgani va aniq tuzatish bilan.",
  "dt.wsLabel": "Yozish studiyasi",
  "dt.wsTitle": "Haqiqiy imtihon yozuv xonasi",
  "dt.wsBlurb":
    "Har safar yangidan yaratiladigan Task 1 va Task 2 topshiriqlari, imtihon taymeri, avtosaqlash va qayta topshirish — bitta esseni qayta ishlang va band qanday oʻzgarishini koʻring.",
  "dt.rdLabel": "Oʻqish testi",
  "dt.rdTitle": "Cambridge uslubidagi Reading, yangidan yaratiladi",
  "dt.rdBlurb":
    "Haqiqiy tartibdagi toʻliq matnlar va barcha real savol turlari. Baholangach, har bir notoʻgʻri javob tuzoq nega ishlaganini tushuntiradi.",
  "dt.lsLabel": "Tinglash testi",
  "dt.lsTitle": "Original audio bilan toʻliq Listening testlari",
  "dt.lsBlurb":
    "Olti daraja boʻyicha koʻp ovozli yozuvlar — toʻliq toʻrt boʻlimli testlar yoki tezkor mashqlar, transkript va har bir javob izohi bilan.",
  "dt.spLabel": "Speaking mock testi",
  "dt.spTitle": "Jonli imtihon oluvchi bilan toʻliq 3 qismli mock",
  "dt.spBlurb":
    "AI imtihon oluvchi bilan uchala qismda gaplashing — suhbat, tayyorgarlik vaqti bilan cue-card monologi, soʻng muhokama. Toʻrtta rasmiy mezon boʻyicha baholanadi va oʻz soʻzlaringiz keltiriladi.",
  "dt.coLabel": "Oʻquv murabbiyi",
  "dt.coTitle": "Tarixingizni biladigan murabbiy",
  "dt.coBlurb":
    "Oʻquv murabbiyi oldingi urinishlaringizni oʻqiydi — har bir band, har bir zaif mezon — va keyin nimani mashq qilish kerakligini va nega kerakligini aytadi.",
  "dt.pgLabel": "Progress va statistika",
  "dt.pgTitle": "Bandingiz, halol kuzatiladi",
  "dt.pgBlurb":
    "Joriy band va maqsad, eng zaif mezoningiz va vaqt boʻyicha oʻsish — imtihon kunida ishonsa boʻladigan ehtiyotkor baho.",
  "b9.sub":
    "Cambridge tayyorlagan imtihon oluvchi qoʻyadigan band — va qayerdan boshlagan boʻlsangiz ham, unga olib boradigan aniq yoʻl.",
  "hd.withFixes": "Tuzatishlar bilan 7.0",
  "language.switching": "Til almashtirilmoqda…",
};
