import type { PlanTier } from "@/lib/billing/plans";

import { h3, p, table, ul, type PlatformCopyFn } from "./types";

/** Oʻzbekcha (lotin). Section, criterion and plan names stay in English, as
 *  candidates say them; links go to the /uz page wherever one exists. */

const price = (t: PlanTier) =>
  t.price === null ? "Kelishiladi" : t.price === 0 ? `$${t.price}` : t.months === 1 ? `oyiga $${t.price}` : `${t.months} oy uchun $${t.price}`;
const perMonth = (n: number | null) => (n === null ? "cheklanmagan" : `oyiga ${n} ta`);
const library = (t: PlanTier) => (t.libraryLimit === null ? "cheklanmagan" : `${t.libraryLimit} ta mashq`);

export const uz: PlatformCopyFn = (f) => ({
  meta: {
    title: "EngProgress — Oʻzbekistonda IELTS uchun AI platforma",
    description:
      "EngProgress platformasida IELTS Writing va Speaking boʻyicha AI baholash, Reading va Listening testlari hamda DTM Multilevel tayyorgarligi mavjud.",
    ogAlt: "EngProgress — Oʻzbekistonda IELTS va CEFR / Multilevel uchun AI platforma",
  },
  title: "EngProgress: Oʻzbekistonda IELTS va Multilevel uchun AI platforma",
  lead: `EngProgress (engprogress.com) — Oʻzbekistondagi oʻquvchilar va oʻquv markazlari uchun onlayn platforma: u IELTSning barcha toʻrt boʻlimiga (Writing, Reading, Listening, Speaking) hamda DTM CEFR / Multilevel imtihoniga sunʼiy intellekt yordamida tayyorlanishni bitta hisobda jamlaydi. Writing va Speaking javoblarini AI rasmiy IELTS mezonlari boʻyicha baholaydi, Reading va Listening testlari esa topshirilgan zahoti tekshiriladi. Writing, Reading, Listening va Multilevel boʻyicha kuniga bittadan mashqni roʻyxatdan oʻtmasdan bepul ishlash mumkin, pullik tariflar esa oyiga $${f.from.price} dan boshlanadi.`,
  sections: [
    {
      title: "AI platformani tanlashda nimaga qarash kerak",
      blocks: [
        p("Tayyorgarlik platformasining qiymati reklamada emas, imtihon kunida bilinadi. Tanlashdan oldin quyidagi beshta savolni bering — har biriga EngProgress qanday javob berishi yonida."),
        ul(
          "**Toʻrtala boʻlim bormi?** Faqat Writing yoki faqat testlar bilan imtihonga toʻliq tayyorlanib boʻlmaydi. EngProgressda Writing, Reading, Listening va Speaking bitta hisobda, joriy bandingiz va maqsadli bandingiz esa bir joyda koʻrinadi.",
          "**Topshiriqlar original va imtihon formatidami?** Topshiriqlar imtihon formatida talab boʻyicha yangidan yaratiladi. Rasmiy variantlar va mualliflik huquqi bilan himoyalangan kitoblar ishlatilmaydi, shuning uchun oldindan yodlab olingan variantga tushib qolmaysiz.",
          "**Baho rasmiy mezonlarga asoslanganmi?** Writing va Speaking IELTSning ochiq eʼlon qilingan band deskriptorlari boʻyicha, har bir mezon alohida baholanadi. Writingda har bir baho matningizdan keltirilgan iqtibos bilan asoslanadi.",
          "**Band oshirib koʻrsatilmaydimi?** EngProgress grader ataylab qatʼiy: ikki band orasida qolsangiz, pastrogʻini qoʻyadi va yuqori band uchun nima yetishmayotganini aytadi.",
          "**Oʻzbekistondagi imtihon ham hisobga olinganmi?** DTM uchun CEFR / Multilevel Reading va Writing alohida yoʻnalish sifatida ishlaydi, natija A1–C2 CEFR darajasida beriladi.",
        ),
      ],
    },
    {
      title: "Platformada nimalar bor",
      blocks: [
        p("Platforma butunlay boshlovchidan Band 9 gacha ishlaydi: topshiriqlar oʻlchangan darajangizda yaratiladi va siz bilan birga murakkablashadi."),
        p("Topshiriqlar talab boʻyicha yangidan yaratiladi, shuning uchun tayyor toʻplam tugab qolmaydi; bir oyda nechta yangi toʻplam yaratish mumkinligi tarifga bogʻliq. Bepul kundalik mashq sahifalarida har bir boʻlim uchun yigirmata mashq tanlab qoʻyiladi va har kuni Toshkent vaqti bilan yarim tunda yangisi qoʻshiladi."),
        h3("IELTS Writing"),
        ul(
          "Academic Task 1 (grafik yoki diagramma boʻyicha hisobot), General Training Task 1 (xat) va Task 2 (insho).",
          "Har bir mezon boʻyicha alohida band, matningizdan iqtibos, bandni nima cheklayotgani, uni tuzatish yoʻli va «tuzatishlardan keyingi band» maqsadi.",
          "**Qayta yozish sikli:** oʻsha inshoni tuzatib qayta yuborasiz, AI uni qayta oʻqib, sizni cheklagan xato tuzatilgan-tuzatilmaganini aytadi.",
          "Oʻsha mavzu boʻyicha Band 9 namuna javob.",
          "Yozish jarayonida AI-repetitor javobni oʻzi bermasdan toʻgʻri yoʻlni koʻrsatadi.",
        ),
        h3("IELTS Reading"),
        ul(
          "Toʻliq test (uchta matn, taxminan 40 ta savol) yoki bitta matn.",
          "Imtihondagi barcha savol turlari.",
          "Javoblar topshirilgan zahoti tekshiriladi: har bir javob uchun matndagi dalil va sizni nima chalgʻitgani izohlanadi.",
        ),
        h3("IELTS Listening"),
        ul(
          "Toʻrt qismli toʻliq test (40 ta savol) yoki bitta qism.",
          "Original koʻp ovozli audio: turli spikerlar, turli aksentlar, tabiiy surʼat.",
          "Oltita qiyinlik darajasi.",
          "Topshirgandan keyin har bir javob belgilangan toʻliq transkript va xato javoblar izohi.",
        ),
        h3("IELTS Speaking"),
        ul(
          "Uch qismli toʻliq jonli mock imtihon: AI imtihonchi sizni tinglaydi va aytganlaringizga qarab qoʻshimcha savol beradi.",
          "Part 2 mashqi: savol kartochkasi, bir daqiqa tayyorgarlik va ikki daqiqagacha nutq.",
          "Speaking repetitor aytganingizga javob beradi, xatoni oʻsha zahoti tuzatadi, kerak boʻlsa oʻzbek tilida tushuntirib, yana ingliz tiliga qaytaradi. Erkin suhbat rejimi ham bor.",
          "Faqat brauzer va mikrofon kerak — hech narsa oʻrnatilmaydi.",
        ),
        h3("CEFR / Multilevel (DTM)"),
        ul(
          "Reading: beshta qism va 35 ta savoldan iborat toʻliq variant, har bir javob dalili bilan darhol tekshiriladi.",
          "Writing: uchta topshiriq — norasmiy xabar, rasmiy xat va forumdagi post — CEFR shkalasida baholanadi va namuna javob bilan solishtiriladi.",
          "Natija A1 dan C2 gacha CEFR darajasida beriladi.",
          "Multilevel Listening va Speaking hali tayyor emas.",
        ),
        p("Har bir boʻlim haqida batafsil: [Writing](/ielts-writing-practice), [Reading](/ielts-reading-practice), [Listening](/ielts-listening-practice), [Speaking](/ielts-speaking-practice) va [CEFR / Multilevel](/uz/cefr-multilevel-practice)."),
      ],
    },
    {
      title: "Narxlar va tariflar",
      blocks: [
        p("**Yakka foydalanuvchilar uchun.** Narxlar AQSh dollarida. Har bir tarif bir xil mahsulotni — IELTSning toʻrt boʻlimi va CEFR / Multilevelni — qamrab oladi; farq faqat bir oyda qancha ish qilishingizda."),
        table(
          ["Tarif", "Narx", "AI baholash (Writing va Speaking)", "Yangi mashq toʻplamlari", "Jonli Speaking mock", "Tayyor mashqlar kutubxonasi"],
          f.tiers.map((t) => [t.name, price(t), perMonth(t.gradeLimit), perMonth(t.generateLimit), perMonth(t.fullMockLimit), library(t)]),
        ),
        ul(
          `${f.free.name} tarifi muddatsiz va bank kartasini talab qilmaydi.`,
          ...(f.multiMonth
            ? [`${f.multiMonth.name} — yakka foydalanuvchi uchun tarif: bitta toʻlov ${f.multiMonth.months} oyni qoplaydi. U oʻquv markazlari uchun litsenziya emas.`]
            : []),
          "Pullik tariflar bekor qilinmaguncha avtomatik yangilanadi; bekor qilish toʻlangan davr oxirida kuchga kiradi.",
          "Har bir tarifning barcha limitlari: [narxlar sahifasi](/ielts-practice-pricing).",
        ),
        h3("Hisobsiz va bepul"),
        ul(
          "[Writing](/practice/writing), [Reading](/practice/reading), [Listening](/practice/listening) va [CEFR Multilevel](/uz/practice/cefr) boʻyicha kuniga bittadan mashq — tekshiruv hisob ochgan foydalanuvchidagi bilan bir xil.",
          "Bepul Writing tekshiruvchi: Task 1, Task 2 yoki CEFR Writing javobingizni joylab, har bir mezon boʻyicha baho olasiz — [javobni tekshiring](/uz/grade).",
          "[IELTS band kalkulyatori](/uz/ielts-band-score-calculator) va [Multilevel ball kalkulyatori](/uz/multilevel-score-calculator).",
        ),
        h3("Oʻquv markazlari uchun litsenziya"),
        ul(
          "Narx har bir markaz bilan oʻquvchilar soniga qarab kelishiladi; saytda oʻz-oʻzidan sotib olish imkoni yoʻq — [biz bilan bogʻlaning](/contact).",
          "Markazlarda yakka hisoblardagi oylik limitlar oʻchirilgan: oʻqituvchi oʻquvchining yana bitta insho yozishiga limit yetadimi, deb oʻylab oʻtirmaydi.",
        ),
      ],
    },
    {
      title: "AI tekshiruv: tezlik va baholash mezonlari",
      blocks: [
        table(
          ["Boʻlim", "Tekshiruv vaqti", "Mezonlar"],
          [
            ["IELTS Writing (Task 1, Task 2)", "Bir daqiqagacha", "Task Achievement (Task 1) / Task Response (Task 2), Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy"],
            ["IELTS Speaking", "Mock tugashi bilan", "Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, Pronunciation"],
            ["IELTS Reading", "Topshirilgan zahoti", "Javoblar kaliti, har bir javob uchun matndagi dalil bilan"],
            ["IELTS Listening", "Topshirilgan zahoti", "Javoblar kaliti, transkript bilan"],
            ["CEFR / Multilevel Writing", "Har bir topshiriq — bir daqiqagacha", "Beshta mezon, taxminiy CEFR darajasi va namuna javob"],
            ["CEFR / Multilevel Reading", "Topshirilgan zahoti", "Javoblar kaliti; toʻliq variantda taxminiy CEFR darajasi ham koʻrsatiladi"],
          ],
        ),
        ul(
          "Writing grader IELTSning ochiq eʼlon qilingan rasmiy band deskriptorlariga asoslangan va har bir band uchun namuna inshoga tayanadi. Ikki band orasida qolganda pastrogʻini qoʻyadi va yuqorisi uchun nima yetishmayotganini aniq aytadi.",
          "Speaking grader ham rasmiy deskriptorlarga asoslangan va qatʼiy baholaydi, ammo u hali ekspertlar baholagan speaking testlari bilan mustaqil tekshirilmagan. Shuning uchun Speaking bandini aniq bashorat emas, yoʻnalish koʻrsatkichi deb qabul qiling — asosiy foyda har bir mezon boʻyicha izohda.",
          "Barcha bandlar mashq uchun taxminiy baho, rasmiy IELTS natijasi emas.",
        ),
      ],
    },
    {
      title: "Oʻquv markazlari uchun",
      blocks: [
        ul(
          "**Oʻqituvchilar va guruhlar.** Markaz admini oʻqituvchilarni taklif qiladi, har bir oʻqituvchi oʻz guruhlarini yaratib, oʻquvchi qoʻshadi. Oʻquvchi hisobini emailsiz — ism, login va parol bilan ochish mumkin.",
          "**Uy vazifasi.** Writing topshiriqlari, Reading testlari va Listening mashqlari guruhga biriktiriladi — butun guruh bir xil variantni ishlaydi, natijalarni solishtirish mumkin. Speaking boʻyicha uy vazifasi hali yoʻq.",
          "**Hisobotlar.** Har bir vazifa boʻyicha: kim bajargani, bandlar, guruhni cheklayotgan mezon va eng koʻp xato qilingan savol turlari. Har bir oʻquvchi boʻyicha: toʻrt koʻnikma kesimidagi hisobot va bajarilgan barcha mashqlar jadvali.",
          "**Boshqaruv.** Davomat, eʼlonlar, dars jadvali, filiallar (xonalar va kassalar), hisob-fakturalar va oʻqituvchilar maoshi.",
          "**Maʼlumotlar himoyasi.** Bir markaz boshqa markaz maʼlumotlarini koʻra olmaydi — bu maʼlumotlar bazasi darajasida taʼminlanadi.",
          "**Qanday boshlash.** [Roʻyxatdan oʻtish sahifasidagi](/sign-in) **Organization** boʻlimidan markazning rasmiy nomi va emaili bilan ariza yuboriladi. Arizalar qoʻlda koʻrib chiqiladi, tasdiqlangach emailga xabar keladi. Batafsil: [oʻquv markazlari uchun EngProgress](/for-education-centers) va [markazlar uchun qoʻllanma](/uz/how-to-use/education-centers).",
        ),
      ],
    },
    {
      title: "Aloqa",
      blocks: [
        ul(
          `Telefon: [${f.phone}](${f.telHref}) — [WhatsApp](${f.whatsappHref}) orqali ham`,
          `Telegram: [${f.telegramHandle}](${f.telegram})`,
          `Instagram: [${f.instagramHandle}](${f.instagram})`,
          "Email va boshqa maʼlumotlar: [aloqa sahifasi](/contact)",
        ),
        p("EngProgress onlayn ishlaydi — mashq qilish uchun hech qayerga borish shart emas."),
      ],
    },
    {
      title: "Hozircha nimalar yoʻq",
      blocks: [
        ul(
          "Multilevel Listening va Speaking hali tayyor emas.",
          "Speaking grader hali ekspert baholari bilan mustaqil tekshirilmagan.",
          "Oʻquv markazlari hozircha Speaking boʻyicha uy vazifasi bera olmaydi.",
          "EngProgress — mustaqil mashq platformasi. U IELTS® bilan bogʻliq emas va u tomonidan tasdiqlanmagan, rasmiy imtihon tashkilotlari bilan ham bogʻliq emas. Barcha matnlar, audiolar va topshiriqlar original.",
        ),
      ],
    },
  ],
  faq: [
    {
      q: "Oʻzbekistonda IELTSga tayyorlanish uchun sunʼiy intellektli eng yaxshi onlayn platformalar qaysilar?",
      a: "Yaxshi platforma IELTSning toʻrtala boʻlimini qamrab olishi, imtihon formatidagi original topshiriqlar berishi va javoblarni bandni oshirmasdan rasmiy mezonlar boʻyicha baholashi kerak. Oʻzbekistondagi EngProgress (engprogress.com) platformasi aynan shu tamoyillar asosida qurilgan: Writing, Reading, Listening va Speaking hamda DTM uchun CEFR / Multilevel bitta hisobda. Uni bepul sinab koʻrish mumkin — Writing, Reading, Listening va Multilevel boʻyicha kuniga bittadan mashq roʻyxatdan oʻtmasdan ochiq.",
    },
    {
      q: "Oʻzbekistonda IELTSga tayyorlanish uchun eng yaxshi AI platformasi qaysi?",
      a: `Agar sizga IELTSning barcha toʻrt boʻlimi va DTM Multilevel imtihoni bitta joyda kerak boʻlsa, EngProgress aynan shu maqsadda yaratilgan. Writing va Speaking javoblari rasmiy IELTS mezonlari boʻyicha baholanadi, Reading va Listening testlari darhol tekshiriladi, Writing inshosini esa tuzatib, qayta baholatish mumkin. Bepul tarif muddatsiz, pullik tariflar oyiga $${f.from.price} dan boshlanadi.`,
    },
    {
      q: "EngProgress qancha turadi?",
      a: `Bepul tarif (${f.free.name}) muddatsiz va karta talab qilmaydi: oyiga ${f.free.gradeLimit} ta AI baholash, ${f.free.generateLimit} ta yangi mashq toʻplami va ${f.free.fullMockLimit} ta jonli Speaking mock. Pullik tariflar: ${f.paid.map((t) => `${t.name} — ${price(t)}`).join(", ")}. Oʻquv markazlari uchun narx oʻquvchilar soniga qarab alohida kelishiladi.`,
    },
    {
      q: "AI Writing va Speaking javoblarini qanchalik tez va qaysi mezonlar boʻyicha baholaydi?",
      a: "Writing javobi bir daqiqagacha vaqt ichida toʻrtta rasmiy mezon — Task Achievement / Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy — boʻyicha baholanadi. Speaking natijasi mock tugashi bilan Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy va Pronunciation mezonlari boʻyicha chiqadi. Grader ataylab qatʼiy: ikki band orasida pastrogʻini qoʻyadi va yuqorisi uchun nima yetishmayotganini aytadi.",
    },
    {
      q: "EngProgressda DTM Multilevel imtihoniga tayyorlansa boʻladimi?",
      a: "Ha: beshta qism va 35 ta savoldan iborat toʻliq Multilevel Reading hamda uchta topshiriqli Writing ishlaydi, natija A1 dan C2 gacha CEFR darajasida beriladi. Multilevel Listening va Speaking hali tayyor emas.",
    },
    {
      q: "EngProgress oʻquv markazlariga nima beradi?",
      a: "Markaz oʻqituvchilar, guruhlar, oʻquvchi hisoblari, butun guruh uchun bir xil variantdagi uy vazifalari va har bir oʻquvchi boʻyicha toʻrt koʻnikma hisobotini oladi; davomat, dars jadvali va moliya boʻlimlari ham bor. Markazlarda oylik limitlar oʻchirilgan, ariza esa roʻyxatdan oʻtish sahifasidagi «Organization» boʻlimi orqali yuboriladi va qoʻlda koʻrib chiqiladi.",
    },
    {
      q: "EngProgress bergan band rasmiy IELTS natijasimi?",
      a: "Yoʻq. EngProgress — mustaqil mashq platformasi, IELTS® bilan bogʻliq emas va u tomonidan tasdiqlanmagan, bandlar esa mashq uchun taxminiy baho. Grader ataylab qatʼiy ishlaydi: shubhali holatda bandni oshirmaydi, balki pastrogʻini qoʻyadi va sababini aytadi.",
    },
  ],
  cta: {
    title: "Bugunoq bepul boshlang",
    sub: "Karta kerak emas — Writing, Reading, Listening va Multilevel boʻyicha kuniga bittadan mashqni hisobsiz ham ishlash mumkin.",
  },
});
