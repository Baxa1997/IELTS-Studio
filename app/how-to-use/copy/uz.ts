import type { DocsCopy } from "./types";

/**
 * Uzbek — the DEFAULT locale, so this is what `/how-to-use` itself serves and
 * what most visitors read. English lives at `/en/how-to-use`.
 *
 * TERMINOLOGY FOLLOWS `lib/i18n/messages/uz.ts`, which is the established
 * vocabulary of the rest of the product: Yozish / Oʻqish / Tinglash / Gapirish
 * for the four skills, "tutor" for the per-skill tutors ("Yozish tutori"),
 * "ustoz" in running prose, "yoʻl koʻrsatish" for coaching. `band` stays in
 * English because that is how the exam reports a score and how the dictionary
 * already writes it ("Har qanday band").
 *
 * ⚠️ USE `ʻ` (U+02BB), NOT `'`. The rest of the Uzbek dictionary uses the
 * modifier letter for oʻ and gʻ — a plain ASCII apostrophe renders as a
 * different glyph and sorts differently.
 *
 * NOT TRANSLATED ON PURPOSE: IELTS, CEFR, Multilevel, Task 1 / Task 2, Part 2 /
 * Part 3, True/False/Not Given and the other question-type names. These are the
 * names on the real exam paper, and a candidate who learns them in translation
 * meets them in English on the day.
 */
export const uz: DocsCopy = {
  learner: {
    meta: {
      title: "EngProgress dan qanday foydalanish — oʻquvchilar uchun qoʻllanma",
      ogTitle: "EngProgress dan qanday foydalanish",
      description:
        "EngProgress nima va u qanday ishlaydi: IELTS va CEFR uchun oʻz darajangizda talab boʻyicha yaratiladigan original mashqlar, rasmiy mezonlar asosida har bir mezon boʻyicha alohida baholanadi — Yozish, Oʻqish, Tinglash va Gapirish boʻyicha.",
    },
    head: {
      kicker: "Hujjatlar · oʻquvchilar uchun",
      title: "EngProgress dan qanday foydalanish",
      lede: "IELTS va Multilevel imtihoni uchun sunʼiy intellektli imtihon oluvchi — mutlaqo boshlangʻichdan Band 9 gacha: talab boʻyicha siz uchun yoziladigan original mashqlar, ishlayotganingizda yoningizdagi ustoz va keyingi yarim bandgacha nima yetishmayotgani aniq aytilgan holda.",
    },
    label: "EngProgress dan qanday foydalanish",
    elsewhere: "Oʻquv markazlari uchun",
    overview: [
      "EngProgress — IELTS va oʻzbek Multilevel (CEFR) imtihoni uchun sunʼiy intellektli imtihon oluvchi. U siz uchun mashq yozadi, uni rasmiy mezonlar asosida baholaydi va olgan bandingiz bilan keyingi yarim band orasida turgan yagona narsani aytib beradi. IELTS ning toʻrttala koʻnikmasi ham ishlayapti — Yozish, Oʻqish, Tinglash va Gapirish — Multilevel imtihonining esa oʻzining Oʻqish va Yozish qismlari bor: yorligʻi almashtirilgan IELTS emas, oʻz formatida.",
      "U siz qayerda boʻlsangiz, oʻshandan boshlaydi. Agar hech qachon imtihon topshirmagan boʻlsangiz va 4 ball olsangiz, birinchi topshiriqlar 4 darajasida yoziladi va yoʻl koʻrsatish hech narsani bilasiz deb hisoblamaydi; agar 7.5 dan 9 ga intilayotgan boʻlsangiz, ular oʻsha darajada yoziladi. Platforma foydali boʻlishi uchun oʻtib olish kerak boʻlgan kirish darajasi ham, kuchli boʻlganingizdan keyin shift ham yoʻq.",
      "U mustaqil tayyorlanayotgan odam uchun qurilgan. Hech narsa oʻqituvchini kutmaydi: topshiriq soʻraysiz, u darhol yaratiladi va beriladi, hisobot esa oʻsha oʻtirishdayoq qaytadi. Shu bilan birga yolgʻiz ham qolmaysiz — topshiriq oʻrtasida tutordan yordam soʻrashingiz mumkin, u javobni oshkor qilmasdan yoʻl koʻrsatadi. Oʻquv markazlari xuddi shu platformani oʻqituvchilar, guruhlar va biriktirilgan uy vazifalari bilan birga ishlatadi — buning oʻz qoʻllanmasi bor, havolasi sahifa oxirida.",
      "Hammasidan oldin tushunib olishga arziydigan qismi — baholash. Har qanday raqobatchi essega band qoʻya oladi; bu raqam faqat imtihon kunida ham tasdiqlansa qimmatga ega. Shuning uchun baholovchi biroz pastroq turishga sozlangan: ishingiz ikki band orasida qolsa, u pastrogʻini beradi va yuqorisiga aynan nima yetmaganini nomma-nom aytadi. Bu yerdagi 6.5 imtihon zalidagi haqiqiy 6.5 boʻlishi kerak, hali yetmaganingizni eshitish esa buni iyulda bilib qolishdan ancha arzon.",
    ],
    featuresHeading: "Asosiy imkoniyatlar",
    features: [
      {
        title: "Toʻrttala koʻnikma va CEFR",
        body: "Yozish, Oʻqish, Tinglash va Gapirish — hammasi ishlaydi va hammasi baholanadi. Multilevel ning Oʻqish va Yozish qismlari ular bilan yonma-yon, oʻz formatida boradi.",
      },
      {
        title: "Cambridge formati, cheksiz",
        body: "Rasmiy mashq kitoblari formatining har bir qismi, savol turi va joylashuvi — lekin yaratiladi, shuning uchun hech qachon tugamaydi va yarim eslab qolgan testingizni qaytadan topshirmaysiz.",
      },
      {
        title: "Original kontent, talab boʻyicha",
        body: "Hech qachon oʻtgan yillar varianti emas. Har bir matn, savol, yozuv va topshiriq siz soʻraganingizda siz uchun yoziladi — oldindan yodlab qoʻyadigan narsa yoʻq va hech kimning mualliflik huquqi buzilmaydi.",
      },
      {
        title: "Boshlangʻichdan Band 9 gacha",
        body: "Bu foydali boʻlishi uchun yetib borish kerak boʻlgan daraja yoʻq. Oʻqish sizning oʻlchangan bandingizni oʻz natijalaringizdan oʻqib oladi va shuning atrofida quradi; Tinglash va Yozish siz soʻragan darajani oladi — birinchi urinishdan Band 9 ga intilishgacha.",
      },
      {
        title: "Mashq paytida yoʻl koʻrsatish",
        body: "Topshiriq oʻrtasida soʻrasa boʻladigan tutor — bu xatboshiga nima yozish kerak, bu matnning qayeriga qarash kerak — vaqt ketayotganda javobni bermasdan usulni oʻrgatadi.",
      },
      {
        title: "Har bir mezon alohida",
        body: "Har bir mezon oʻz bandini oladi, shunda bitta raqamga taxmin qilib qaramasdan, qaysi biri ballni ushlab turganini koʻrasiz.",
      },
      {
        title: "Fikr emas, dalil",
        body: "Har bir mezon oʻzi baholayotgan gapni aynan sizning ishingizdan keltiradi. Baholashga ishonishning oʻrniga uni tekshirishingiz mumkin.",
      },
      {
        title: "Ataylab qatʼiy",
        body: "Ikki band orasida qolsa, pastrogʻiga yaxlitlaydi va yuqorisi uchun nima kerakligini aytadi. Imtihon kunida takrorlay oladigan band xushomadgoʻy banddan qimmatroq.",
      },
      {
        title: "Qayta ishlash aylanasi",
        body: "Oʻsha essening oʻzini qayta yozing va yana yuboring. U oʻsha topshiriqqa qarab qayta baholanadi, shuning uchun band qanday siljiganini koʻrasiz — yangi savol va yangi taxmin emas.",
      },
      {
        title: "Notoʻgʻri javoblar izohlanadi",
        body: "Oʻqish va Tinglashda xato tushuntiriladi: matnda aslida nima deyilgan va chalgʻituvchi variant nega toʻgʻridek koʻringan. Aynan shu keyingi urinishingizni oʻzgartiradi.",
      },
      {
        title: "Oʻzini yuritadigan progress",
        body: "Har bir koʻnikma boʻyicha band, mashq qilgan sari qayta hisoblanadi va eng zaifi yuzaga chiqariladi. Har bir baholangan urinish toʻliq hisoboti bilan tarixingizda aynan yozilgan holida qoladi.",
      },
      {
        title: "Akkauntsiz sinab koʻring",
        body: "Bepul baholovchi joylashtirilgan essengizni oladi va roʻyxatdan oʻtmasdan band hamda birinchi tuzatishni qaytaradi.",
      },
    ],
    callout: {
      kicker: "Qolgan hammasi shu gʻoyaga tayanadi",
      body: "Bu yerda savollar bazasi ham, ishlab chiqiladigan testlar toʻplami ham yoʻq. Har bir topshiriq siz soʻragan zahoti yoziladi, u qaysi darajada yozilishi esa sizdan keladi — oʻqish varaqasi uchun oʻlchangan bandingiz, tinglash testi uchun siz tanlagan daraja, esse uchun sizga hali berilmagan mavzu va savol shakli. Bir kunda mashq qilayotgan ikki oʻquvchi turli variantlarni ishlaydi, siz esa hech qachon bir variantni ikki marta ishlamaysiz.",
    },
    startHeading: "Ishni boshlash",
    steps: [
      {
        title: "Haqiqiy bandingizni aniqlang",
        body: "Bepul baholovchiga esse joylashtiring yoki akkaunt ochganingizdan keyin toʻliq topshiriq ishlang. Band va uni ushlab turgan mezonni olasiz.",
      },
      {
        title: "Talab boʻyicha mashq qiling",
        body: "Toʻrt koʻnikmaning istalganida topshiriq soʻrang. U siz uchun oʻz darajangizda yoziladi va rasmiy mezonlar asosida baholanadi — hech qachon oʻtgan variant emas, demak yodlab boʻlmaydi.",
      },
      {
        title: "Farqni yoping",
        body: "Har bir hisobot keyingi yarim band uchun nima yetishmayotganini va uni tuzatadigan ishni aytadi. Oʻsha essening oʻzini qayta yozing, qayta yuboring va band haqiqatan siljiganini bilib oling.",
      },
    ],
    tabs: {
      overview: {
        title: "Umumiy koʻrinish",
        lede: "EngProgress nima, u sizga nima beradi va birinchi essedan ishonsa boʻladigan bandgacha boʻlgan uch qadam.",
      },
      writing: {
        title: "Yozish",
        lede: "Task 1 va Task 2 — imtihon oluvchi baholagandek baholanadi: har bir mezon boʻyicha band va uni keltirib chiqargan soʻzlar aynan sizning essengizdan.",
        how: "Topshiriq soʻrasangiz, u shu zahoti yoziladi. Generator oʻzi aylantiradigan oʻn toʻrtta mavzu oilasidan birini oladi — atrof-muhit, taʼlim, texnologiya, sogʻliq, ish, jamiyat, davlat boshqaruvi, globallashuv, jinoyatchilik, ommaviy axborot, madaniyat, transport, turizm — va Task 2 uchun haqiqiy imtihonda uchraydigan oltita savol shaklidan birini tanlaydi: fikr bildirish, muhokama, muammo–yechim, ikki qismli, afzallik va kamchiliklar hamda ijobiy yoki salbiy rivojlanish. Berishdan oldin u sizga allaqachon berilgan har bir savolni va siz yozgan har bir esseni tekshiradi, shuning uchun bir savol ikkinchi marta kelmaydi. Academic Task 1 bundan ham uzoqroqqa boradi va diagrammani oʻzi chizadi — oʻsha diagramma baholovchiga ham beriladi, demak u kimningdir tavsifini emas, siz koʻrgan chizmani baholaydi.",
        points: [
          {
            title: "Toʻrt mezon, alohida",
            body: "Task Response, Coherence & Cohesion, Lexical Resource va Grammatical Range — har biri oʻz bandini oladi, shunda qaysi biri sizni ushlab turganini bilasiz.",
          },
          {
            title: "Nima ushlab turibdi va qanday tuzatiladi",
            body: "Har bir mezon uni shu bandda ushlab turgan narsani va uni koʻtaradigan aniq oʻzgarishni aytadi — bogʻlovchi soʻzlar haqidagi umumiy maslahat emas.",
          },
          {
            title: "Qayta ishlash aylanasi",
            body: "Oʻsha essening oʻzini oʻsha topshiriqqa qarab qayta yuboring. Baholashda boshqa hech narsa oʻzgarmaydi, demak banddagi har qanday siljish sizning qayta yozishingizdan.",
          },
          {
            title: "Taqqoslash uchun Band 9 javobi",
            body: "Oʻsha savolga namunaviy javob — mezonlarning hammasi bir vaqtda bajarilganda qanday koʻrinishini koʻrasiz.",
          },
        ],
      },
      reading: {
        title: "Oʻqish",
        lede: "Imtihon formatidagi original matnlar, barcha haqiqiy savol turlari, yuborgan zahotingiz baholanadi.",
        how: "Bu — darajangizni oʻz natijalaringizdan oʻqib oladigan koʻnikma. Bitta soʻz yozilishidan oldin generator sizning oʻlchangan oʻqish bandingizni — oldingi urinishlaringiz bergan bandni — qidiradi, agar yangi boʻlsangiz, maqsad bandingizga, soʻng maʼqul boshlangʻich qiymatga qaytadi. Toʻliq test shu raqam atrofida quriladi, unga tekis emas: 1-matn sizdan bir band past, 2-matn darajangizda, 3-matn esa bir band yuqori boʻladi — haqiqiy varaqa ham shunday ogʻirlashadi. Butun test uchun bitta haqiqiy Cambridge savol joylashuvi tanlanadi, shunda uchala matn bir-biriga mos keladi; har bir matn ichidagi savol bloklarining tartibi keyin aralashtiriladi va har bir matnga boshqa mavzu va boshqa nuqtai nazar beriladi, toki bitta mavzuning uch xil koʻrinishini oʻqimang. Nihoyat, har bir savol oʻzi kelib chiqqan matnga qarab qayta tekshiriladi va u yerdan tasdiqlanmagan hamma narsa sizga berilmasdan tashlab yuboriladi.",
        points: [
          {
            title: "Barcha savol turlari",
            body: "True/False/Not Given, matching headings, matching features, sentence va note completion, soʻzlar banki bilan summary completion, flow-chart va pick-two ni ham oʻz ichiga olgan multiple choice.",
          },
          {
            title: "Tuzoq nega ishladi",
            body: "Notoʻgʻri javob matnga qarab tushuntiriladi: matnda aslida nima deyilgan va chalgʻituvchini nima toʻgʻridek koʻrsatgan.",
          },
          {
            title: "Savol turlari tahlili",
            body: "Xatolar tur boʻyicha guruhlanadi, shunda True/False/Not Given dagi zaiflik omadsizlik emas, tizimli muammo sifatida koʻrinadi.",
          },
          {
            title: "Vaqt bilan toʻliq bloklar",
            body: "Uchta matn, qirqta savol, bitta soat — haqiqiy xom ball jadvali boʻyicha butun varaqa uchun bir marta hisoblanadi.",
          },
        ],
      },
      listening: {
        title: "Tinglash",
        lede: "Shu platforma uchun yozilgan original koʻp ovozli audio bilan toʻliq toʻrt qismli testlar.",
        how: "Ikkita yoʻl bor. Umumiy kutubxonada allaqachon yozib olingan mashqlar turadi, ular darhol ochiladi va ijro etiladi. Yoki oʻzingiznikini yarating: L1 dan L5 gacha daraja tanlaysiz va mexanizm original matn yozib, uni koʻp ovozli audio sifatida ijro etadi — toʻliq toʻrt qismli, qirq savolli test taxminan ikki yarim daqiqada, bitta oʻn savolli mashq esa taxminan ikki daqiqada tayyor boʻladi. Daraja lugʻatni oʻzgartirishdan ancha koʻproq ish qiladi; u nutq uslubini boshqaradi. Maʼruza oson chetida daqiqasiga taxminan 115 soʻz, qiyin chetida esa 140 ga yaqin tezlikda oʻqiladi. Telefon suhbati shoshilmasdan navbat almashishdan deyarli tanaffussiz, tez ona tili tezligiga oʻtadi, talabalar munozarasi esa jonlidan haqiqatan bir-birining ustiga tushadigan holatga keladi. Tezkor mashqda savol formati diktor uni aytmaguncha yashirin qoladi, shuning uchun bitta turni mashq qilib, oʻsha chiqishiga umid qilib boʻlmaydi.",
        points: [
          {
            title: "Haqiqiy koʻp ovozli audio",
            body: "Matnlar yoziladi, keyin alohida soʻzlovchilar va imtihon diktori bilan ijro etiladi — transkriptni oʻqib chiqayotgan bitta tekis ovoz emas.",
          },
          {
            title: "Cambridge uslubidagi guruhlar",
            body: "Form completion, xarita va rejalar, matching, multiple choice — varaqada qanday joylashtirilsa, shunday.",
          },
          {
            title: "Transkriptlar, havola bilan",
            body: "Har bir javob u aytilgan aniq qatorga havola qiladi, shunda oʻylab qolmasdan nimani oʻtkazib yuborganingizni eshitasiz.",
          },
          {
            title: "Oʻn daqiqa yoki toʻliq soat",
            body: "Vaqt kam boʻlsa — bitta yozuv va oʻnta savol; haqiqiysini xohlasangiz — toʻrttala qism va qirqta savol.",
          },
        ],
      },
      speaking: {
        title: "Gapirish",
        lede: "Gaplashsa boʻladigan jonli imtihon oluvchi va siz gapirayotganda oʻrgatadigan tutor.",
        how: "Imtihon oluvchi tayyor roʻyxatdan oʻqimaydi — roʻyxatning oʻzi ham modelning oʻqitilish sanasida qotib qolmagan. Mavzular toʻplami kuniga bir marta manbaga tayangan qidiruv bilan yangilanadi va platforma boʻylab ulashiladi, shuning uchun u sezdirmasdan eskirib qololmaydi — kontent uchun eng yomon eskirish shu, chunki buni hech kim payqamaydi. Shundan keyin ikki rejim ataylab qarama-qarshi tomonga tortadi. Imtihon mashqi vaqtdan xoli, imtihon shaklidagi mavzularni saqlaydi — tugʻilgan shahringiz, ovqat, kundalik tartib va jamiyat qanday oʻzgarishi haqidagi barqaror Part 3 savollari — chunki shu haftaning yangiliklaridan qurilgan savollar imtihonga koʻproq emas, kamroq oʻxshagan boʻlardi. Erkin suhbat esa aynan dolzarb mavzularni oladi, chunki hozir nima boʻlayotganini muhokama qilish oʻsha mashqning butun maqsadi. Agar qidiruv ishlamay qolsa, ichki toʻplam ishga tushadi: dars hech qachon uni kutmaydi va hech qachon uning sababli toʻxtamaydi.",
        points: [
          {
            title: "Uch qismli mock",
            body: "Kirish, cue card va munozara — yozib olingan savollar roʻyxati emas, sunʼiy intellektli imtihon oluvchi tomonidan jonli oʻtkaziladi.",
          },
          {
            title: "Part 2 alohida",
            body: "Bosib gapirish, tayyorlanishga bir daqiqa, gapirishga ikki — koʻpchilik nomzodlar ball yoʻqotadigan qismni tuzatishning eng arzon yoʻli.",
          },
          {
            title: "Gapirish tutori",
            body: "Unga gapiring — u har bir javobda munosabat bildiradi, tuzatadi va oʻrgatadi, siz oʻzbekchaga oʻtsangiz, u ham oʻtadi.",
          },
          {
            title: "Nutq oʻlchanadi, taxmin qilinmaydi",
            body: "Nutq tezligi, toʻldiruvchi soʻzlar soni va javob uzunligi audioingizdan, aynan gapirishga sarflagan vaqtingizga nisbatan hisoblanadi.",
          },
        ],
      },
      cambridge: {
        title: "Cambridge uslubi",
        lede: "Rasmiy mashq kitoblarining formati — testlar hech qachon tugamaydi va ulardan biri ham koʻchirilmaydi.",
        how: "Generator rasmiy mashq kitoblari formatining tuzilishiga qarab qurilgan: qismlar, savol turlari, joylashuvlar, surʼat. Tinglash toʻrt qism va qirq savol boʻlib chiqadi — 1- va 4-qismlarda form, note, table va sentence completion; 2-qismda xarita va reja belgilash, matching va multiple choice; 3-qismda munozara boʻyicha multiple choice, choose-TWO va flow-chart — koʻp ovozli audio va standart diktor kirishi bilan. Oʻqish qiyinligi ortib boradigan uchta akademik matn boʻlib chiqadi: matching headings, matching features, True/False/Not Given, Yes/No/Not Given, note completion, sentence endings, pick-TWO va summary completion, guruh darajasidagi soʻz chegarasi koʻrsatmalari kitoblarda chop etilgan holda. Yozish Task 1 hisobotlarini va Task 2 ning barcha zamonaviy turlarini, jumladan yangiroq “outweigh” hamda ijobiy-yoki-salbiy rivojlanish shakllarini qamrab oladi. Tinglash va Oʻqish keyin standart qirq savolli xom ball jadvali boʻyicha hisoblanadi.",
        points: [
          {
            title: "Kitoblar tugaydi",
            body: "Jiddiy nomzod soʻnggilarini bir necha haftada tugatadi. Yaratiladigan testlar tugamaydi, shuning uchun har bir mashq birinchi urinish boʻla oladi.",
          },
          {
            title: "Ikkinchi marta ishlash xotirani tekshiradi",
            body: "Kitobni qayta ishlash tayyorlikni emas, eslab qolishni oʻlchaydi. Siz hech koʻrmagan kontent — sizni halol oʻlchaydigan yagona kontent.",
          },
          {
            title: "Kitob oʻzini tushuntira olmaydi",
            body: "U javob C ekanini aytadi. Bu yerda Oʻqish va Tinglashdagi har bir notoʻgʻri javob sizni tuzoq nega tutganini tushuntiradi, xatolaringiz esa savol turi boʻyicha guruhlanadi.",
          },
          {
            title: "Hech narsa koʻchirilmaydi",
            body: "Bu yerda birorta rasmiy Cambridge testi joylanmaydi, koʻchirilmaydi yoki qayta hikoya qilinmaydi. “Cambridge uslubi” bizning original kontentimiz amal qiladigan formatni bildiradi — EngProgress Cambridge Assessment English, IELTS, British Council yoki IDP bilan aloqador emas va ular tomonidan maʼqullanmagan.",
          },
        ],
      },
      coaching: {
        title: "Yoʻl koʻrsatish",
        lede: "Baholash qayerda ekaningizni aytadi. Yoʻl koʻrsatish esa sizni oldinga suradi — va u faqat keyin emas, ishlayotgan paytingizda yoningizda.",
        how: "Ular toʻrtta va ataylab bir-biridan farq qiladi. Yozish tutori bilan Oʻqish tutori topshiriq PAYTIDA yoningizda oʻtiradi: bu xatboshiga nima kirishini yoki bu gapdagi qaysi ikki soʻzni matn bilan solishtirish kerakligini soʻrang — oʻsha zahoti aniq javob olasiz. Siz ishni topshirmaguningizcha, ikkalasiga ham ishni siz uchun bajarish qatʼiy taqiqlangan: Yozish tutori essengizning bironta gapini yozmaydi, Oʻqish tutori esa Q7 True ekanini aytmaydi — qanday soʻrasangiz ham. Ular buning oʻrniga usulni boshqa misolda oʻrgatadi, toʻliq izohlar esa ishni topshirgan soniyangizda ochiladi — band sizniki boʻlib qolishini shu saqlaydi. Gapirish tutori teskari ishlaydi, chunki nutq jonli: u siz gapirayotganda har bir javobda munosabat bildiradi, tuzatadi va oʻrgatadi. Oʻquv murabbiyi esa umuman topshiriqqa bogʻlanmagan — u bandlaringizni, eng zaif koʻnikmangizni va necha kun qolganini koʻradi va bu vaqtni nimaga sarflashni aytadi.",
        points: [
          {
            title: "Aniq boʻlsin, aks holda hisobga oʻtmaydi",
            body: "“Koʻproq tafsilot qoʻshing” va “yaxshiroq soʻz ishlating” butunlay taqiqlangan. Javob almashtiriladigan aniq soʻzni, qoʻshiladigan aniq gapni yoki qaraladigan xatboshini koʻrsatishi shart.",
          },
          {
            title: "U sizning oʻrningizga qilmaydi",
            body: "Vaqt ketayotganda namunaviy javob ham, essengizning bironta gapi ham, qaysi variant toʻgʻriligi tasdigʻi ham yoʻq. Bu qoida tutorning oʻziga yozib qoʻyilgan, uning hukmiga tashlab qoʻyilmagan.",
          },
          {
            title: "Oʻz tilingizda",
            body: "Unga oʻzbekcha yoki ruscha yozing — u ham oʻsha tilda javob beradi. Gapirish tutori siz oʻtganingizda suhbat oʻrtasida tilni almashtiradi.",
          },
          {
            title: "U sizning qayerdaligingizni biladi",
            body: "Maqsad bandingiz va eng zaif sohangiz unga uzatiladi, shuning uchun maslahat darajangizga moslanadi — lekin u sizga hech qachon band aytmaydi. Baholash imtihon oluvchiga tegishli.",
          },
        ],
      },
      cefr: {
        title: "CEFR / Multilevel",
        lede: "Oʻzbekiston imtihoni oʻz formatida — yorligʻi almashtirilgan IELTS emas.",
        how: "Multilevel varaqalari ham hamma narsa kabi talab boʻyicha yaratiladi, lekin IELTS band deskriptorlari emas, CEFR deskriptorlari asosida — chunki bu boshqa baholash tizimiga ega boshqa imtihon. Oʻqish haqiqiy varaqa ishlatadigan shakllarda besh qism va oʻttiz besh savol sifatida quriladi; Yozish esa uchala topshiriq sifatida quriladi. Natija band emas, CEFR darajasi koʻrinishida qaytadi — sertifikatda aslida shu yoziladi.",
        points: [
          {
            title: "Oʻqish, besh qism",
            body: "Varaqa haqiqatan ishlatadigan besh qism boʻylab oʻttiz besh savol, har safar yangidan yaratiladi.",
          },
          {
            title: "Yozish, uch topshiriq",
            body: "Uchala topshiriq ham, IELTS band deskriptorlari emas, CEFR deskriptorlari asosida baholanadi.",
          },
          {
            title: "Band emas, daraja",
            body: "Natijalar A1–C2 koʻrinishida qaytadi — Multilevel sertifikatida shu koʻrsatiladi.",
          },
          {
            title: "Tinglash va Gapirish",
            body: "Bu ikkisining CEFR varaqalari hali qurilmagan. Ikkalasining IELTS versiyalari ishlaydi.",
          },
        ],
      },
    },
    cross: {
      kicker: "Oʻquv markazi yuritayapsizmi?",
      title: "Oʻquv markazlari uchun alohida qoʻllanma bor",
      body: "Oʻqituvchilar, guruhlar, oʻquvchi loginlari, biriktirilgan uy vazifalari, Telegram xabarnomalari, davomat, hisobotlar va moliya — hammasi oʻz qoʻllanmasida yoritilgan.",
      cta: "Markaz qoʻllanmasini ochish",
    },
  },

  centers: {
    meta: {
      title: "EngProgress dan qanday foydalanish — oʻquv markazlari uchun qoʻllanma",
      ogTitle: "EngProgress dan qanday foydalanish — oʻquv markazlari uchun",
      description:
        "Oʻquv markazi EngProgress ni qanday yuritadi: rollar va oʻqituvchilar, guruhlar va oʻquvchi loginlari, sunʼiy intellekt baholaydigan uy vazifalari, Telegram xabarnomalari, davomat, har bir oʻquvchi boʻyicha hisobotlar, moliya va markaz chati.",
    },
    head: {
      kicker: "Hujjatlar · oʻquv markazlari uchun",
      title: "Markazingizni EngProgress da yuriting",
      lede: "Oʻqituvchilar, guruhlar va oʻquvchi loginlari; sunʼiy intellekt baholaydigan uy vazifalari; ota-onalar va guruh uchun Telegram; davomat, hisobotlar, hisob-fakturalar va ish haqi — hamda bularning hammasi haqida savolga javob beradigan chat.",
    },
    label: "Markaz EngProgress ni qanday yuritadi",
    elsewhere: "Oʻquvchilar uchun",
    intro: [
      "Oʻquv markazi EngProgress ning butunini oʻquvchi platformasi ustida yuritadi: oʻz oʻqituvchilaringiz, oʻz guruhlaringiz, oʻz oʻquvchi loginlaringiz va topshirilgan zahoti sunʼiy intellekt baholaydigan uy vazifalari.",
      "Oʻquvchilaringiz siz guruhiga biriktirgan mashqni koʻradi. Markaz akkaunti uchun koʻrib chiqiladigan kutubxonalar oʻchirib qoʻyilgan, shuning uchun guruh oʻz mashqlariga chalgʻimasdan oʻqituvchisi bergan ishni bajaradi — har bir urinish esa toʻliq sunʼiy intellekt hisoboti bilan birga oʻqituvchisiga koʻrinadi.",
      "Siz har bir mashq uchun toʻlamaysiz. Markaz akkaunti uchun kvota va oʻrin cheklovlari ataylab oʻchirilgan, shuning uchun koʻproq uy vazifasi berish sizga hech qachon qimmatga tushmaydi va oʻqituvchi guruhga beriladigan ishni tejashga majbur emas. Tasdiqlash qoʻlda: siz ariza berasiz, biz uni oʻqib chiqamiz va elektron pochta orqali tasdiqlaymiz, akkauntingiz esa shu paytgacha kutish ekranida turadi — shuning uchun ham hech kim markazingiz nomidan roʻyxatdan oʻta olmaydi.",
    ],
    rolesHeading: "Kim nima qiladi",
    roles: [
      {
        title: "Markaz admini",
        body: "Markaz egasi. Oʻqituvchilar va administratorlarni taklif qiladi, guruhlar yaratadi, har bir oʻquvchini, har bir hisobotni va butun pulni koʻradi.",
      },
      {
        title: "Administrator",
        body: "Qabul boʻlimi. Darslar, roʻyxatlar va davomatni yuritadi, pulni qabul qiladi — lekin ish haqi va chiqim unga tegishli emas.",
      },
      {
        title: "Oʻqituvchi",
        body: "Oʻz guruhlarini yaratadi, oʻquvchi qoʻshadi, mashq biriktiradi va oʻzi yuritadigan guruhlardagi oʻquvchilar hisobotlarini oʻqiydi.",
      },
      {
        title: "Oʻquvchi",
        body: "Siz bergan login bilan kiradi — elektron pochta shart emas — guruhiga biriktirilgan uy vazifasini koʻradi va har bir urinish uchun toʻliq sunʼiy intellekt hisobotini oladi.",
      },
    ],
    startHeading: "Ishni boshlash",
    steps: [
      {
        title: "Roʻyxatdan oʻting va tasdiqlaning",
        body: "Roʻyxatdan oʻtish sahifasidagi “Tashkilot” boʻlimidan ariza bering. Biz koʻrib chiqamiz va elektron pochta orqali tasdiqlaymiz; shu paytgacha akkauntingiz tasdiqlash ekranida turadi.",
      },
      {
        title: "Oʻqituvchilar, keyin guruhlar",
        body: "Oʻqituvchilaringizni havola orqali taklif qiling. Har biri oʻz guruhlarini yaratadi va oʻquvchilarni oʻzi qoʻshadi — ism, login va parol, elektron pochta ixtiyoriy.",
      },
      {
        title: "Biriktiring, keyin hisobotlarni oʻqing",
        body: "Topshiriqni guruhga biriktiring va har bir oʻquvchi bir xil kontentni ishlaydi. Sunʼiy intellekt uni baholaydi, oʻquvchi xatolarini oladi, siz esa oʻsha hisobotning oʻzini olasiz.",
      },
    ],
    tabs: {
      overview: {
        title: "Umumiy koʻrinish",
        lede: "Markaz nima oladi, uning ichida kim nima qiladi va birinchi darsgacha uch qadam.",
      },
      people: {
        title: "Odamlar va guruhlar",
        lede: "Markaz toʻrt rol ustida ishlaydi va oʻqituvchi hech kimni kutmasdan oʻz darslarini tashkil qila oladi.",
        points: [
          {
            title: "Oʻqituvchilar oʻz guruhlarini yaratadi",
            body: "Admin orqali navbat yoʻq. Oʻqituvchi guruhni oʻzi yaratadi, jadvalini belgilaydi va uni oʻzi yuritadi.",
          },
          {
            title: "Oʻquvchilar toʻgʻridan-toʻgʻri yaratiladi",
            body: "Ism, login va parol. Elektron pochta ixtiyoriy — bersangiz, maʼlumotlar pochtaga yuboriladi, boʻsh qoldirsangiz, ularni darsda oʻzingiz berasiz.",
          },
          {
            title: "Kirish uchun pochta shart emas",
            body: "Markaz oʻquvchilari siz bergan login bilan kiradi. Kirish maydoni login ham, pochta ham qabul qiladi va uni server tomonida aniqlaydi.",
          },
          {
            title: "Suratlar yopiq saqlanadi",
            body: "Oʻquvchi surati ixtiyoriy va yopiq omborda, server tomonida imzolanadi. U hech qachon ochiq havola boʻlmaydi.",
          },
        ],
      },
      homework: {
        title: "Uy vazifasi",
        lede: "Mashqni guruhga biriktiring va hamma bir xil kontentni ishlasin.",
        points: [
          {
            title: "Yozish",
            body: "Task 1 yoki Task 2 savolini yarating va biriktiring. Guruhdagi har bir oʻquvchi bir xil savolni oladi, har biriga yangisi emas.",
          },
          {
            title: "Oʻqish",
            body: "Test yarating yoki umumiy kutubxonadan markazingizga nusxa oling, shunda butun guruh bir xil varaqani ishlaydi.",
          },
          {
            title: "Tinglash",
            body: "Kutubxonadan tinglash mashqini biriktiring. U oʻquvchining vazifalar roʻyxatiga boshqa topshiriqlar kabi tushadi.",
          },
          {
            title: "Practice AI darslari",
            body: "Kerakli darsni bir gapda tasvirlang; u tushuntirish va avtomatik baholanadigan mashqlarni yaratadi, biriktirsa yoki havola bilan ulashsa boʻladi.",
          },
          {
            title: "Gapirish uy vazifasi",
            body: "Gapirishni har qanday oʻquvchi erkin mashq qila oladi, lekin uni hali guruhga BIRIKTIRIB boʻlmaydi.",
          },
        ],
      },
      tracking: {
        title: "Kuzatuv va hisobotlar",
        lede: "Har bir oʻquvchi nima qildi, nima oldi va nimada doim adashyapti.",
        points: [
          {
            title: "Har bir vazifa boʻyicha natijalar",
            body: "Kim tugatdi, qanday band oldi va guruh umuman qaysi mezon yoki savol turida ball yoʻqotayapti.",
          },
          {
            title: "Toʻrt koʻnikmali oʻquvchi hisoboti",
            body: "Yozish, Oʻqish, Tinglash va Gapirish boʻyicha bandlar, takrorlanuvchi zaif tomonlar va har bir mashqning sanali jadvali — uy vazifasimi yoki mustaqilmi, farqi yoʻq.",
          },
          {
            title: "Oʻquvchining oʻz hisoboti",
            body: "Istalgan qatorni oching — oʻquvchi koʻradigan izoh sahifasining aynan oʻzini koʻrasiz. Xodim va oʻquvchi bitta koʻrinishni oʻqiydi, haqiqatning ikki xil talqinini emas.",
          },
          {
            title: "Davomat",
            body: "Darslarni belgilang, kim uzoqlashayotganini kuzating va davomatsizlikka ogohlantirish qoʻying.",
          },
        ],
      },
      telegram: {
        title: "Telegram",
        lede: "Oilalar va oʻquvchilar haqiqatan oʻqiydigan kanal.",
        points: [
          {
            title: "Oʻquvchiga kirish maʼlumotlari",
            body: "Oʻquvchiga login va parolini darsda ovoz chiqarib aytishning oʻrniga Telegram orqali yuboring.",
          },
          {
            title: "Uy vazifasi xabarnomalari",
            body: "Mashq biriktirilishi guruhga xabar beradi, vazifalar roʻyxatiga toʻgʻridan-toʻgʻri havola bilan.",
          },
          {
            title: "Guruh havolalari",
            body: "Darsni oʻzining Telegram guruhiga ulang, shunda xabarlar oʻquvchilar allaqachon turgan joyga tushadi.",
          },
          {
            title: "Xodimlar yordamchisi",
            body: "Konsol chati bilan bir xil miya, xodimlar uchun Telegramdan ham ochiladi.",
          },
        ],
      },
      chat: {
        title: "Markaz chati",
        lede: "Markazingiz haqida oddiy tilda soʻrang — u hech narsani buza olmaydi.",
        points: [
          {
            title: "U oʻqiydi, yozmaydi",
            body: "Model faktlar kesimini oladi va matn hamda koʻpi bilan bitta TAKLIF qaytaradi. Uni bajarish alohida “Tasdiqlash” qadami.",
          },
          {
            title: "Tasdiqlangach, qayta tekshiriladi",
            body: "Tasdiqlaganingizda server kimligingizni qaytadan aniqlaydi, rolingizni qayta tekshiradi va har bir nomni oʻz markazingiz ichida qaytadan topadi — shundan keyingina biror ish bajariladi.",
          },
          {
            title: "Faqat koʻrishingiz mumkin boʻlgan doirada",
            body: "Kesim sahifalar bilan bir xil qator darajasidagi qoidalar orqali quriladi: oʻqituvchi oʻz guruhlarini, markaz admini esa butun markazni koʻradi.",
          },
          {
            title: "Davomat, uy vazifasi, ish haqi",
            body: "Kim keldi, nima qarzda qoldi va qancha ish haqi tegishli — toʻrtta ekranni ochmasdan.",
          },
        ],
      },
      money: {
        title: "Moliya",
        lede: "Kiruvchi hisob-fakturalar, chiquvchi ish haqi va ikkalasi ham tayanadigan dars jadvali.",
        points: [
          {
            title: "Oʻquvchi hisob-fakturalari",
            body: "Dars ikkala narxni ham saqlaydi — oʻquvchi toʻlovi va oʻqituvchi stavkasi. Qayta hisoblash oyiga emas, jadvaldagi har bir darsga qarab boradi.",
          },
          {
            title: "Haqiqiy qoidali ish haqi",
            body: "Har bir oʻqituvchi uchun moslashuvchan ish haqi qoidalari, guruh stavkasi esa standart qiymat, hamda koʻp oylik eksport.",
          },
          {
            title: "Kassalar va filiallar",
            body: "Filiallar oʻz xonalari va kassalariga ega, shuning uchun koʻp manzilli markazning puli ajratilgan holda qoladi.",
          },
          {
            title: "Ataylab hisobsiz",
            body: "Markazlardan har bir mashq uchun haq olinmaydi. Markaz akkaunti uchun kvota va oʻrin tekshiruvlari oʻtkazib yuboriladi.",
          },
        ],
      },
    },
    cross: {
      kicker: "Mustaqil mashq qilyapsizmi?",
      title: "Oʻquvchilar uchun alohida qoʻllanma bor",
      body: "Haqiqiy bandingizni aniqlash, toʻrttala koʻnikma, qayta ishlash aylanasi va CEFR — markazsiz oʻqiyotgan odam uchun yozilgan.",
      cta: "Oʻquvchi qoʻllanmasini ochish",
    },
  },
};
