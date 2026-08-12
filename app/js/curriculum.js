// بيانات منهج «اُكْتُبْ» — **المصدر الوحيد للحقيقة**، ونظيرُ `curriculum.js` في اقرأ.
//
// ⚠ **ملفٌّ مولَّد — لا يُحرَّر بيد** (`SESSIONS.md`: «بيانات المنهج … تُشتقّ من
// بيانات اقرأ آلياً لا تُنسخ بيد»):
//
//     node tools/make_curriculum.mjs --build
//
// **وليس فيه حرفٌ ولا كلمةٌ ولا جملةٌ من تأليفنا**: الحروفُ وترتيبُها مجموعاتُ اقرأ
// السبع، والكلماتُ كلماتُ بنكه (مجموعاتُه ومهاراتُه ومعجمُه)، والجملُ أوائلُ سلّمه،
// وأصواتُ الإملاء ملفاتُه بأعيانها. **والمؤلَّفُ هنا ترتيبُها كتابةً** — جدولُ
// `METHOD.md §٤` — وعلّةُ كلِّ قرارِ ترتيبٍ مكتوبةٌ في المولِّد عند موضعها.
//
// **ولا رقمَ محطاتٍ مكتوبٌ هنا** (`METHOD.md §٤`): طولُ الرحلة ثمرةُ البيانات،
// يطبعه `tools/check_writable.py` محسوباً — ورقمٌ يتغيّر بتغيّرها ليس انحرافاً.

/**
 * **المحطات** — مراحلُ `METHOD.md §٤` وما تحتها من عقد.
 *
 * الشكل: `{ id, kind, title, sub, nodes: [{ part, … }] }`
 *   · `kind` — نوعُ المحطة، وهو مفتاحُ الشاشة التي تفتحها ومفتاحُ قياسها أو إعفائها
 *     في `tools/test_measure.mjs`: `warmup` · `letter` · `form` · `join` ·
 *     `fade` · `sentence` (والبواباتُ `gate` من `GATES` أدناه).
 *   · `nodes` — عقدُ المحطة بترتيبها؛ لكلٍّ `part` يُبنى منه معرّفُها، ثم ما تدرّسه:
 *     `letter` حرفاً معزولاً · `letters` مع `form` شكلَ موقع · `joins` وصلاتٍ ·
 *     `words` كلماتٍ · `sentences` جملاً · و`marks` العلاماتِ التي تُفتَح بطاقتُها عندها.
 */
export const STAGES = [
  {
    "id": "warm",
    "kind": "warmup",
    "title": "تَهْيِئَةُ اليَد",
    "sub": "خطوطٌ ومنحنياتٌ وموجات — قبل أوّل حرف",
    "nodes": [
      { "part": "lines-h", "title": "خُطُوطٌ أُفُقِيَّة" },
      { "part": "lines-v", "title": "خُطُوطٌ رَأْسِيَّة" },
      { "part": "lines-d", "title": "خُطُوطٌ مَائِلَة" },
      { "part": "curves", "title": "مُنْحَنَيَاتٌ وَدَوَائِر" },
      { "part": "waves", "title": "مَوْجَاتٌ وَحَلَقَات" },
      { "part": "inside", "title": "تَحَكُّمٌ دَاخِلَ حُدُود" }
    ]
  },
  {
    "id": "g1",
    "kind": "letter",
    "title": "المجموعة الأولى",
    "sub": "كلُّ حرفٍ وحدَه: من أين يبدأ وإلى أين يتّجه",
    "nodes": [
      { "part": "ا", "letter": "ا" },
      { "part": "ب", "letter": "ب" },
      { "part": "م", "letter": "م" },
      { "part": "ل", "letter": "ل" }
    ]
  },
  {
    "id": "g2",
    "kind": "letter",
    "title": "المجموعة الثانية",
    "sub": "كلُّ حرفٍ وحدَه: من أين يبدأ وإلى أين يتّجه",
    "nodes": [
      { "part": "ن", "letter": "ن" },
      { "part": "ر", "letter": "ر" },
      { "part": "د", "letter": "د" },
      { "part": "س", "letter": "س" }
    ]
  },
  {
    "id": "g3",
    "kind": "letter",
    "title": "المجموعة الثالثة",
    "sub": "كلُّ حرفٍ وحدَه: من أين يبدأ وإلى أين يتّجه",
    "nodes": [
      { "part": "ت", "letter": "ت" },
      { "part": "و", "letter": "و" },
      { "part": "ي", "letter": "ي" },
      { "part": "ه", "letter": "ه" }
    ]
  },
  {
    "id": "g4",
    "kind": "letter",
    "title": "المجموعة الرابعة",
    "sub": "كلُّ حرفٍ وحدَه: من أين يبدأ وإلى أين يتّجه",
    "nodes": [
      { "part": "ع", "letter": "ع" },
      { "part": "ف", "letter": "ف" },
      { "part": "ك", "letter": "ك" },
      { "part": "ق", "letter": "ق" }
    ]
  },
  {
    "id": "g5",
    "kind": "letter",
    "title": "المجموعة الخامسة",
    "sub": "كلُّ حرفٍ وحدَه: من أين يبدأ وإلى أين يتّجه",
    "nodes": [
      { "part": "ح", "letter": "ح" },
      { "part": "ج", "letter": "ج" },
      { "part": "خ", "letter": "خ" }
    ]
  },
  {
    "id": "g6",
    "kind": "letter",
    "title": "المجموعة السادسة",
    "sub": "كلُّ حرفٍ وحدَه: من أين يبدأ وإلى أين يتّجه",
    "nodes": [
      { "part": "ش", "letter": "ش" },
      { "part": "ص", "letter": "ص" },
      { "part": "ز", "letter": "ز" },
      { "part": "ط", "letter": "ط" }
    ]
  },
  {
    "id": "g7",
    "kind": "letter",
    "title": "المجموعة السابعة",
    "sub": "كلُّ حرفٍ وحدَه: من أين يبدأ وإلى أين يتّجه",
    "nodes": [
      { "part": "ث", "letter": "ث" },
      { "part": "ذ", "letter": "ذ" },
      { "part": "ض", "letter": "ض" },
      { "part": "ظ", "letter": "ظ" },
      { "part": "غ", "letter": "غ" }
    ]
  },
  {
    "id": "initial",
    "kind": "form",
    "title": "الحَرْفُ أَوَّلَ الكَلِمَة",
    "sub": "شكلُه حين يبدأ الكلمة ويتصل بما بعده",
    "nodes": [
      {
        "part": "g1",
        "form": "initial",
        "letters": ["ب", "م", "ل"],
        "title": "المجموعة الأولى",
        "face": "بـ"
      },
      {
        "part": "g2",
        "form": "initial",
        "letters": ["ن", "س"],
        "title": "المجموعة الثانية",
        "face": "نـ"
      },
      {
        "part": "g3",
        "form": "initial",
        "letters": ["ت", "ي", "ه"],
        "title": "المجموعة الثالثة",
        "face": "تـ"
      },
      {
        "part": "g4",
        "form": "initial",
        "letters": ["ع", "ف", "ك", "ق"],
        "title": "المجموعة الرابعة",
        "face": "عـ"
      },
      {
        "part": "g5",
        "form": "initial",
        "letters": ["ح", "ج", "خ"],
        "title": "المجموعة الخامسة",
        "face": "حـ"
      },
      {
        "part": "g6",
        "form": "initial",
        "letters": ["ش", "ص", "ط"],
        "title": "المجموعة السادسة",
        "face": "شـ"
      },
      {
        "part": "g7",
        "form": "initial",
        "letters": ["ث", "ض", "ظ", "غ"],
        "title": "المجموعة السابعة",
        "face": "ثـ"
      },
      {
        "part": "compare",
        "form": "initial",
        "letters": ["ب", "ن", "ت", "ي", "ث", "س", "ش", "ع", "غ", "ف", "ق", "ح", "ج", "خ", "ص", "ض", "ط", "ظ"],
        "compare": [["ب", "ن", "ت", "ي", "ث"], ["س", "ش"], ["ع", "غ"], ["ف", "ق"], ["ح", "ج", "خ"], ["ص", "ض"], ["ط", "ظ"]],
        "title": "مَيِّزْ بَيْنَ المُتَشَابِهَات",
        "face": "بـ"
      }
    ]
  },
  {
    "id": "medial",
    "kind": "form",
    "title": "الحَرْفُ وَسَطَ الكَلِمَة",
    "sub": "شكلُه حين يتصل بما قبله وما بعده",
    "nodes": [
      {
        "part": "g1",
        "form": "medial",
        "letters": ["ب", "م", "ل"],
        "title": "المجموعة الأولى",
        "face": "ـبـ"
      },
      {
        "part": "g2",
        "form": "medial",
        "letters": ["ن", "س"],
        "title": "المجموعة الثانية",
        "face": "ـنـ"
      },
      {
        "part": "g3",
        "form": "medial",
        "letters": ["ت", "ي", "ه"],
        "title": "المجموعة الثالثة",
        "face": "ـتـ"
      },
      {
        "part": "g4",
        "form": "medial",
        "letters": ["ع", "ف", "ك", "ق"],
        "title": "المجموعة الرابعة",
        "face": "ـعـ"
      },
      {
        "part": "g5",
        "form": "medial",
        "letters": ["ح", "ج", "خ"],
        "title": "المجموعة الخامسة",
        "face": "ـحـ"
      },
      {
        "part": "g6",
        "form": "medial",
        "letters": ["ش", "ص", "ط"],
        "title": "المجموعة السادسة",
        "face": "ـشـ"
      },
      {
        "part": "g7",
        "form": "medial",
        "letters": ["ث", "ض", "ظ", "غ"],
        "title": "المجموعة السابعة",
        "face": "ـثـ"
      },
      {
        "part": "compare",
        "form": "medial",
        "letters": ["ب", "ن", "ت", "ي", "ث", "س", "ش", "ع", "غ", "ف", "ق", "ح", "ج", "خ", "ص", "ض", "ط", "ظ"],
        "compare": [["ب", "ن", "ت", "ي", "ث"], ["س", "ش"], ["ع", "غ"], ["ف", "ق"], ["ح", "ج", "خ"], ["ص", "ض"], ["ط", "ظ"]],
        "title": "مَيِّزْ بَيْنَ المُتَشَابِهَات",
        "face": "ـبـ"
      }
    ]
  },
  {
    "id": "final",
    "kind": "form",
    "title": "الحَرْفُ آخِرَ الكَلِمَة",
    "sub": "شكلُه حين يتصل بما قبله ثم يقف",
    "nodes": [
      {
        "part": "g1",
        "form": "final",
        "letters": ["ا", "ب", "م", "ل"],
        "title": "المجموعة الأولى",
        "face": "ـا"
      },
      {
        "part": "g2",
        "form": "final",
        "letters": ["ن", "ر", "د", "س"],
        "title": "المجموعة الثانية",
        "face": "ـن"
      },
      {
        "part": "g3",
        "form": "final",
        "letters": ["ت", "و", "ي", "ه"],
        "title": "المجموعة الثالثة",
        "face": "ـت"
      },
      {
        "part": "g4",
        "form": "final",
        "letters": ["ع", "ف", "ك", "ق"],
        "title": "المجموعة الرابعة",
        "face": "ـع"
      },
      {
        "part": "g5",
        "form": "final",
        "letters": ["ح", "ج", "خ"],
        "title": "المجموعة الخامسة",
        "face": "ـح"
      },
      {
        "part": "g6",
        "form": "final",
        "letters": ["ش", "ص", "ز", "ط"],
        "title": "المجموعة السادسة",
        "face": "ـش"
      },
      {
        "part": "g7",
        "form": "final",
        "letters": ["ث", "ذ", "ض", "ظ", "غ"],
        "title": "المجموعة السابعة",
        "face": "ـث"
      },
      {
        "part": "compare",
        "form": "final",
        "letters": ["ب", "ت", "ث", "ر", "ز", "د", "ذ", "س", "ش", "ع", "غ", "ح", "ج", "خ", "ص", "ض", "ط", "ظ"],
        "compare": [["ب", "ت", "ث"], ["ر", "ز"], ["د", "ذ"], ["س", "ش"], ["ع", "غ"], ["ح", "ج", "خ"], ["ص", "ض"], ["ط", "ظ"]],
        "title": "مَيِّزْ بَيْنَ المُتَشَابِهَات",
        "face": "ـب"
      }
    ]
  },
  {
    "id": "join",
    "kind": "join",
    "title": "الوَصْلُ وَالنَّسْخ",
    "sub": "يصل الحروفَ ثم ينسخ الكلمةَ كما يراها — والمسافةُ بين الكلمات والجلوسُ على السطر",
    "nodes": [
      { "part": "pair", "title": "وَصْلُ حَرْفَيْن", "joins": ["با", "ما", "نا", "سل", "لا"] },
      {
        "part": "triple",
        "title": "وَصْلُ ثَلَاثَة",
        "joins": ["سلا", "بيت", "تين", "تمر", "هلا"]
      },
      {
        "part": "w-g1",
        "title": "كَلِمَاتُ المجموعة الأولى",
        "words": ["بَابَا", "مَامَا", "بَابْ", "مَالْ"],
        "marks": ["َ", "ْ"]
      },
      {
        "part": "w-g2",
        "title": "كَلِمَاتُ المجموعة الثانية",
        "words": ["نَارْ", "دَارْ", "نَامْ", "سَلَامْ", "دَرَسْ"]
      },
      {
        "part": "w-g3",
        "title": "كَلِمَاتُ المجموعة الثالثة",
        "words": ["بَيْتْ", "تُوتْ", "يَدْ", "وَلَدْ", "تِينْ", "تَمْرْ", "هِلَالْ"],
        "marks": ["ُ", "ِ"]
      },
      {
        "part": "w-g4",
        "title": "كَلِمَاتُ المجموعة الرابعة",
        "words": ["عَيْنْ", "فِيلْ", "كَلْبْ", "قَلَمْ", "عِنَبْ"]
      },
      {
        "part": "w-g5",
        "title": "كَلِمَاتُ المجموعة الخامسة",
        "words": ["حُوتْ", "جَمَلْ", "جَبَلْ", "حَلِيبْ", "خَرُوفْ"]
      },
      {
        "part": "w-g6",
        "title": "كَلِمَاتُ المجموعة السادسة",
        "words": ["شَمْسْ", "مَطَرْ", "زَيْتْ", "صَارُوخْ", "قِطَارْ"]
      },
      {
        "part": "w-g7",
        "title": "كَلِمَاتُ المجموعة السابعة",
        "words": ["ثَعْلَبْ", "ذَهَبْ", "ضِفْدَعْ", "غُرَابْ", "ظَرْفْ"]
      },
      {
        "part": "sign-shadda",
        "title": "الشَّدّة",
        "words": ["سُكَّرْ", "سُلَّمْ", "دُكَّانْ"],
        "marks": ["ّ"]
      },
      {
        "part": "sign-tanween",
        "title": "التَّنوين",
        "words": ["بَابٌ", "قَلَمٌ", "وَلَدٌ"],
        "marks": ["ٌ"]
      },
      {
        "part": "sign-lam",
        "title": "اللام الشمسية والقمرية",
        "words": ["الْقَمَرْ", "الشَّمْسْ", "السَّمَكْ"]
      },
      {
        "part": "sign-hamza",
        "title": "الهَمْزَة",
        "words": ["أُمِّي", "إِبْرِيقْ", "قِرَاءَةْ"],
        "marks": ["أ", "إ", "ء", "ة"]
      },
      {
        "part": "prep-1",
        "title": "كَلِمَاتٌ لِلْجُمَل ١",
        "words": ["وَاسِعَةْ", "نَظِيفْ", "مَفْتُوحَةْ", "صَغِيرْ"]
      },
      {
        "part": "prep-2",
        "title": "كَلِمَاتٌ لِلْجُمَل ٢",
        "words": ["جَمِيلَةْ", "مُنِيرْ", "كَبِيرْ", "حَادَّةْ"]
      },
      {
        "part": "prep-3",
        "title": "كَلِمَاتٌ لِلْجُمَل ٣",
        "words": ["كَبِيرَةْ", "نَاعِمَةْ", "تَدُورْ", "سَاخِنْ"]
      }
    ]
  },
  {
    "id": "fade",
    "kind": "fade",
    "title": "خُفُوتُ النَّمُوذَج",
    "sub": "الكلمةُ كاملةً ثم تخفت بأدائه المتباعد حتى يكتبها سماعاً",
    "nodes": [
      {
        "part": "w-1",
        "title": "الخُفُوتُ ثُمَّ الإِمْلَاء ١",
        "words": ["غُرْفَةْ", "سَرِيرْ", "نَافِذَةْ", "مَقْعَدْ", "سَاعَةْ"]
      },
      {
        "part": "w-2",
        "title": "الخُفُوتُ ثُمَّ الإِمْلَاء ٢",
        "words": ["مِصْبَاحْ", "صَحْنْ", "كُوبْ", "سِكِّينْ", "حَمَّامْ"]
      },
      {
        "part": "w-3",
        "title": "الخُفُوتُ ثُمَّ الإِمْلَاء ٣",
        "words": ["سَلَّةْ", "تِلْفَازْ", "هَاتِفْ", "حَدِيقَةْ", "وِسَادَةْ"]
      },
      {
        "part": "w-4",
        "title": "الخُفُوتُ ثُمَّ الإِمْلَاء ٤",
        "words": ["مِرْوَحَةْ", "خِزَانَةْ", "مِظَلَّةْ", "قِدْرْ", "صُنْبُورْ"]
      }
    ]
  },
  {
    "id": "sent",
    "kind": "sentence",
    "title": "جُمَلٌ قَصِيرَة",
    "sub": "ينسخ جملةً من سلّم «اِقْرَأْ» ثم يكتبها سماعاً",
    "nodes": [
      {
        "part": "s-1",
        "title": "جُمَلٌ ١",
        "sentences": ["الْغُرْفَةُ وَاسِعَةْ", "السَّرِيرُ نَظِيفْ", "النَّافِذَةُ مَفْتُوحَةْ", "الْمَقْعَدُ صَغِيرْ", "السَّاعَةُ جَمِيلَةْ"]
      },
      {
        "part": "s-2",
        "title": "جُمَلٌ ٢",
        "sentences": ["الْمِصْبَاحُ مُنِيرْ", "الصَّحْنُ كَبِيرْ", "الْكُوبُ صَغِيرْ", "السِّكِّينُ حَادَّةْ", "الْحَمَّامُ نَظِيفْ"]
      },
      {
        "part": "s-3",
        "title": "جُمَلٌ ٣",
        "sentences": ["السَّلَّةُ كَبِيرَةْ", "التِّلْفَازُ كَبِيرْ", "الْهَاتِفُ صَغِيرْ", "الْحَدِيقَةُ جَمِيلَةْ", "الْوِسَادَةُ نَاعِمَةْ"]
      },
      {
        "part": "s-4",
        "title": "جُمَلٌ ٤",
        "sentences": ["الْمِرْوَحَةُ تَدُورْ", "الْخِزَانَةُ كَبِيرَةْ", "الْمِظَلَّةُ مَفْتُوحَةْ", "الْقِدْرُ سَاخِنْ", "الصُّنْبُورُ نَظِيفْ"]
      }
    ]
  }
];

/**
 * **البوابات الثلاث** (`METHOD.md §٤`): `{ id, before, title, hint }` — و`before`
 * معرّفُ المحطة التي تقف البوابةُ قبلها، أو `'end'` لبوابة الختام. فالبوابةُ **بيانٌ
 * مُعلَن**: إن سقطت من هنا سقطت من الرحلة ولا يبقى لها أثرٌ في القفل.
 *
 * **ولا وجهَ مصوَّراً لها**: لغةُ الواجهة عندنا SVG خطيّ (`DESIGN.md §٦`) ولا بنكَ
 * رموزٍ في هذا التطبيق، فوجهُ البوابة أيقونتُها في `ui.js` — ووجوهُ العقد من
 * مادّتها نفسِها: الحرفُ وشكلُ موقعه.
 */
export const GATES = [
  {
    "id": "letters",
    "before": "initial",
    "title": "بَوَّابَةُ الحُرُوف",
    "hint": "أرِني حروفَك قبل أن تصلَها"
  },
  {
    "id": "copy",
    "before": "fade",
    "title": "بَوَّابَةُ النَّسْخ",
    "hint": "أرِني كلماتِك قبل أن تكتبها سماعاً"
  },
  {
    "id": "end",
    "before": "end",
    "title": "بَوَّابَةُ الخِتَام",
    "hint": "أرِني ما تعلّمتَه — ثم بابُ «أَتْقِنْ»"
  }
];

/**
 * **العلاماتُ وأوّلُ كلمةٍ تحمل كلَّ واحدة** — تفصيلُ قرار المالك ق٣ **محسوباً لا
 * مكتوباً**: يُمشى في الرحلة بترتيبها، فأوّلُ عقدةٍ تقع العلامةُ في مادّتها هي التي
 * تفتح بطاقةَ تعريفها قبل كتابة كلمتها.
 *
 * `{ mark, title, word, node, base }` — و`base` أصلُ الحرف المتغيّر (أ ← ا · ة ← ه)
 * لمن يرسمه: حرفٌ مدروسٌ وعليه علامة، لا حرفٌ جديد.
 */
export const MARKS = [
  { "mark": "َ", "title": "فَتحة", "word": "بَابَا", "node": "join:w-g1", "base": null },
  { "mark": "ْ", "title": "السُّكون", "word": "بَابْ", "node": "join:w-g1", "base": null },
  { "mark": "ُ", "title": "ضَمّة", "word": "تُوتْ", "node": "join:w-g3", "base": null },
  { "mark": "ِ", "title": "كَسرة", "word": "تِينْ", "node": "join:w-g3", "base": null },
  {
    "mark": "ّ",
    "title": "الشَّدّة",
    "word": "سُكَّرْ",
    "node": "join:sign-shadda",
    "base": null
  },
  {
    "mark": "ٌ",
    "title": "التَّنوين",
    "word": "بَابٌ",
    "node": "join:sign-tanween",
    "base": null
  },
  {
    "mark": "أ",
    "title": "همزةٌ فوق الألف",
    "word": "أُمِّي",
    "node": "join:sign-hamza",
    "base": "ا"
  },
  {
    "mark": "إ",
    "title": "همزةٌ تحت الألف",
    "word": "إِبْرِيقْ",
    "node": "join:sign-hamza",
    "base": "ا"
  },
  {
    "mark": "ء",
    "title": "همزةٌ مفردة",
    "word": "قِرَاءَةْ",
    "node": "join:sign-hamza",
    "base": null
  },
  {
    "mark": "ة",
    "title": "تاءٌ مربوطة",
    "word": "قِرَاءَةْ",
    "node": "join:sign-hamza",
    "base": "ه"
  }
];

/**
 * **الكلماتُ ببياناتها** — كلُّها من بنك اقرأ:
 *   · `say` مفتاحُ ملفها الصوتيّ عنده، و`null` **يعني لا صوتَ لها فتُنسَخ ولا تُملى**.
 *   · `emoji` صورتُها عنده، و`from` موضعُها من رحلته.
 *   · `letters` رسمُها: كلُّ محرفٍ وشكلُ موقعه — وبها يحكم `check_writable.py`.
 */
export const WORDS = {
  "بَابَا": {
    "say": "بابا",
    "emoji": "👨",
    "from": "g1",
    "letters": [["ب", "initial"], ["ا", "final"], ["ب", "initial"], ["ا", "final"]]
  },
  "مَامَا": {
    "say": "ماما",
    "emoji": "👩",
    "from": "g1",
    "letters": [["م", "initial"], ["ا", "final"], ["م", "initial"], ["ا", "final"]]
  },
  "بَابْ": {
    "say": "باب",
    "emoji": "🚪",
    "from": "g1",
    "letters": [["ب", "initial"], ["ا", "final"], ["ب", "isolated"]]
  },
  "مَالْ": {
    "say": "مال",
    "emoji": "💰",
    "from": "g1",
    "letters": [["م", "initial"], ["ا", "final"], ["ل", "isolated"]]
  },
  "نَارْ": {
    "say": "نار",
    "emoji": "🔥",
    "from": "g2",
    "letters": [["ن", "initial"], ["ا", "final"], ["ر", "isolated"]]
  },
  "دَارْ": {
    "say": "دار",
    "emoji": "🏠",
    "from": "g2",
    "letters": [["د", "isolated"], ["ا", "isolated"], ["ر", "isolated"]]
  },
  "نَامْ": {
    "say": "نام",
    "emoji": "😴",
    "from": "g2",
    "letters": [["ن", "initial"], ["ا", "final"], ["م", "isolated"]]
  },
  "سَلَامْ": {
    "say": "سلام",
    "emoji": "👋",
    "from": "g2",
    "letters": [["س", "initial"], ["ل", "medial"], ["ا", "final"], ["م", "isolated"]]
  },
  "دَرَسْ": {
    "say": "درس",
    "emoji": "📖",
    "from": "g2",
    "letters": [["د", "isolated"], ["ر", "isolated"], ["س", "isolated"]]
  },
  "بَيْتْ": {
    "say": "بيت",
    "emoji": "🏡",
    "from": "g3",
    "letters": [["ب", "initial"], ["ي", "medial"], ["ت", "final"]]
  },
  "تُوتْ": {
    "say": "توت",
    "emoji": "🫐",
    "from": "g3",
    "letters": [["ت", "initial"], ["و", "final"], ["ت", "isolated"]]
  },
  "يَدْ": { "say": "يد", "emoji": "✋", "from": "g3", "letters": [["ي", "initial"], ["د", "final"]] },
  "وَلَدْ": {
    "say": "ولد",
    "emoji": "👦",
    "from": "g3",
    "letters": [["و", "isolated"], ["ل", "initial"], ["د", "final"]]
  },
  "تِينْ": {
    "say": "تين",
    "emoji": "🍈",
    "from": "g3",
    "letters": [["ت", "initial"], ["ي", "medial"], ["ن", "final"]]
  },
  "تَمْرْ": {
    "say": "تمر",
    "emoji": "🌴",
    "from": "g3",
    "letters": [["ت", "initial"], ["م", "medial"], ["ر", "final"]]
  },
  "هِلَالْ": {
    "say": "هلال",
    "emoji": "🌙",
    "from": "g3",
    "letters": [["ه", "initial"], ["ل", "medial"], ["ا", "final"], ["ل", "isolated"]]
  },
  "عَيْنْ": {
    "say": "عين",
    "emoji": "👁️",
    "from": "g4",
    "letters": [["ع", "initial"], ["ي", "medial"], ["ن", "final"]]
  },
  "فِيلْ": {
    "say": "فيل",
    "emoji": "🐘",
    "from": "g4",
    "letters": [["ف", "initial"], ["ي", "medial"], ["ل", "final"]]
  },
  "كَلْبْ": {
    "say": "كلب",
    "emoji": "🐕",
    "from": "g4",
    "letters": [["ك", "initial"], ["ل", "medial"], ["ب", "final"]]
  },
  "قَلَمْ": {
    "say": "قلم",
    "emoji": "✏️",
    "from": "g4",
    "letters": [["ق", "initial"], ["ل", "medial"], ["م", "final"]]
  },
  "عِنَبْ": {
    "say": "عنب",
    "emoji": "🍇",
    "from": "g4",
    "letters": [["ع", "initial"], ["ن", "medial"], ["ب", "final"]]
  },
  "حُوتْ": {
    "say": "حوت",
    "emoji": "🐋",
    "from": "g5",
    "letters": [["ح", "initial"], ["و", "final"], ["ت", "isolated"]]
  },
  "جَمَلْ": {
    "say": "جمل",
    "emoji": "🐫",
    "from": "g5",
    "letters": [["ج", "initial"], ["م", "medial"], ["ل", "final"]]
  },
  "جَبَلْ": {
    "say": "جبل",
    "emoji": "⛰️",
    "from": "g5",
    "letters": [["ج", "initial"], ["ب", "medial"], ["ل", "final"]]
  },
  "حَلِيبْ": {
    "say": "حليب",
    "emoji": "🥛",
    "from": "g5",
    "letters": [["ح", "initial"], ["ل", "medial"], ["ي", "medial"], ["ب", "final"]]
  },
  "خَرُوفْ": {
    "say": "خروف",
    "emoji": "🐑",
    "from": "g5",
    "letters": [["خ", "initial"], ["ر", "final"], ["و", "isolated"], ["ف", "isolated"]]
  },
  "شَمْسْ": {
    "say": "شمس",
    "emoji": "☀️",
    "from": "g6",
    "letters": [["ش", "initial"], ["م", "medial"], ["س", "final"]]
  },
  "مَطَرْ": {
    "say": "مطر",
    "emoji": "🌧️",
    "from": "g6",
    "letters": [["م", "initial"], ["ط", "medial"], ["ر", "final"]]
  },
  "زَيْتْ": {
    "say": "زيت",
    "emoji": "🫗",
    "from": "g6",
    "letters": [["ز", "isolated"], ["ي", "initial"], ["ت", "final"]]
  },
  "صَارُوخْ": {
    "say": "صاروخ",
    "emoji": "🚀",
    "from": "g6",
    "letters": [["ص", "initial"], ["ا", "final"], ["ر", "isolated"], ["و", "isolated"], ["خ", "isolated"]]
  },
  "قِطَارْ": {
    "say": "قطار",
    "emoji": "🚆",
    "from": "g6",
    "letters": [["ق", "initial"], ["ط", "medial"], ["ا", "final"], ["ر", "isolated"]]
  },
  "ثَعْلَبْ": {
    "say": "ثعلب",
    "emoji": "🦊",
    "from": "g7",
    "letters": [["ث", "initial"], ["ع", "medial"], ["ل", "medial"], ["ب", "final"]]
  },
  "ذَهَبْ": {
    "say": "ذهب",
    "emoji": "🥇",
    "from": "g7",
    "letters": [["ذ", "isolated"], ["ه", "initial"], ["ب", "final"]]
  },
  "ضِفْدَعْ": {
    "say": "ضفدع",
    "emoji": "🐸",
    "from": "g7",
    "letters": [["ض", "initial"], ["ف", "medial"], ["د", "final"], ["ع", "isolated"]]
  },
  "غُرَابْ": {
    "say": "غراب",
    "emoji": "🐦‍⬛",
    "from": "g7",
    "letters": [["غ", "initial"], ["ر", "final"], ["ا", "isolated"], ["ب", "isolated"]]
  },
  "ظَرْفْ": {
    "say": "ظرف",
    "emoji": "✉️",
    "from": "g7",
    "letters": [["ظ", "initial"], ["ر", "final"], ["ف", "isolated"]]
  },
  "سُكَّرْ": {
    "say": "سُكَّرْ",
    "emoji": "🍬",
    "from": "shadda",
    "letters": [["س", "initial"], ["ك", "medial"], ["ر", "final"]]
  },
  "سُلَّمْ": {
    "say": "سُلَّمْ",
    "emoji": "🪜",
    "from": "shadda",
    "letters": [["س", "initial"], ["ل", "medial"], ["م", "final"]]
  },
  "دُكَّانْ": {
    "say": "دُكَّانْ",
    "emoji": "🏪",
    "from": "shadda",
    "letters": [["د", "isolated"], ["ك", "initial"], ["ا", "final"], ["ن", "isolated"]]
  },
  "بَابٌ": {
    "say": "بَابٌ",
    "emoji": "🚪",
    "from": "tanween",
    "letters": [["ب", "initial"], ["ا", "final"], ["ب", "isolated"]]
  },
  "قَلَمٌ": {
    "say": "قَلَمٌ",
    "emoji": "✏️",
    "from": "tanween",
    "letters": [["ق", "initial"], ["ل", "medial"], ["م", "final"]]
  },
  "وَلَدٌ": {
    "say": "وَلَدٌ",
    "emoji": "👦",
    "from": "tanween",
    "letters": [["و", "isolated"], ["ل", "initial"], ["د", "final"]]
  },
  "الْقَمَرْ": {
    "say": "الْقَمَرْ",
    "emoji": "🌕",
    "from": "lam",
    "letters": [["ا", "isolated"], ["ل", "initial"], ["ق", "medial"], ["م", "medial"], ["ر", "final"]]
  },
  "الشَّمْسْ": {
    "say": "الشَّمْسْ",
    "emoji": "☀️",
    "from": "lam",
    "letters": [["ا", "isolated"], ["ل", "initial"], ["ش", "medial"], ["م", "medial"], ["س", "final"]]
  },
  "السَّمَكْ": {
    "say": "السَّمَكْ",
    "emoji": "🐟",
    "from": "lam",
    "letters": [["ا", "isolated"], ["ل", "initial"], ["س", "medial"], ["م", "medial"], ["ك", "final"]]
  },
  "أُمِّي": {
    "say": "أُمِّي",
    "emoji": "👩",
    "from": "lex:family",
    "letters": [["أ", "isolated"], ["م", "initial"], ["ي", "final"]]
  },
  "إِبْرِيقْ": {
    "say": "إِبْرِيقْ",
    "emoji": "🫖",
    "from": "lex:home",
    "letters": [["إ", "isolated"], ["ب", "initial"], ["ر", "final"], ["ي", "initial"], ["ق", "final"]]
  },
  "قِرَاءَةْ": {
    "say": "قِرَاءَةْ",
    "emoji": "📗",
    "from": "lex:school",
    "letters": [["ق", "initial"], ["ر", "final"], ["ا", "isolated"], ["ء", "isolated"], ["ة", "isolated"]]
  },
  "وَاسِعَةْ": {
    "say": "وَاسِعَةْ",
    "emoji": null,
    "from": "support",
    "letters": [["و", "isolated"], ["ا", "isolated"], ["س", "initial"], ["ع", "medial"], ["ة", "final"]]
  },
  "نَظِيفْ": {
    "say": "نَظِيفْ",
    "emoji": null,
    "from": "support",
    "letters": [["ن", "initial"], ["ظ", "medial"], ["ي", "medial"], ["ف", "final"]]
  },
  "مَفْتُوحَةْ": {
    "say": "مَفْتُوحَةْ",
    "emoji": null,
    "from": "support",
    "letters": [["م", "initial"], ["ف", "medial"], ["ت", "medial"], ["و", "final"], ["ح", "initial"], ["ة", "final"]]
  },
  "صَغِيرْ": {
    "say": "صَغِيرْ",
    "emoji": null,
    "from": "support",
    "letters": [["ص", "initial"], ["غ", "medial"], ["ي", "medial"], ["ر", "final"]]
  },
  "جَمِيلَةْ": {
    "say": "جَمِيلَةْ",
    "emoji": null,
    "from": "support",
    "letters": [["ج", "initial"], ["م", "medial"], ["ي", "medial"], ["ل", "medial"], ["ة", "final"]]
  },
  "مُنِيرْ": {
    "say": null,
    "emoji": null,
    "from": "support",
    "letters": [["م", "initial"], ["ن", "medial"], ["ي", "medial"], ["ر", "final"]]
  },
  "كَبِيرْ": {
    "say": "كَبِيرْ",
    "emoji": null,
    "from": "support",
    "letters": [["ك", "initial"], ["ب", "medial"], ["ي", "medial"], ["ر", "final"]]
  },
  "حَادَّةْ": {
    "say": "حَادَّةْ",
    "emoji": null,
    "from": "support",
    "letters": [["ح", "initial"], ["ا", "final"], ["د", "isolated"], ["ة", "isolated"]]
  },
  "كَبِيرَةْ": {
    "say": "كَبِيرَةْ",
    "emoji": null,
    "from": "support",
    "letters": [["ك", "initial"], ["ب", "medial"], ["ي", "medial"], ["ر", "final"], ["ة", "isolated"]]
  },
  "نَاعِمَةْ": {
    "say": "نَاعِمَةْ",
    "emoji": null,
    "from": "support",
    "letters": [["ن", "initial"], ["ا", "final"], ["ع", "initial"], ["م", "medial"], ["ة", "final"]]
  },
  "تَدُورْ": {
    "say": null,
    "emoji": null,
    "from": "support",
    "letters": [["ت", "initial"], ["د", "final"], ["و", "isolated"], ["ر", "isolated"]]
  },
  "سَاخِنْ": {
    "say": "سَاخِنْ",
    "emoji": null,
    "from": "support",
    "letters": [["س", "initial"], ["ا", "final"], ["خ", "initial"], ["ن", "final"]]
  },
  "غُرْفَةْ": {
    "say": "غُرْفَةْ",
    "emoji": "🛋️",
    "from": "lex:home",
    "letters": [["غ", "initial"], ["ر", "final"], ["ف", "initial"], ["ة", "final"]]
  },
  "سَرِيرْ": {
    "say": "سَرِيرْ",
    "emoji": "🛏️",
    "from": "lex:home",
    "letters": [["س", "initial"], ["ر", "final"], ["ي", "initial"], ["ر", "final"]]
  },
  "نَافِذَةْ": {
    "say": "نَافِذَةْ",
    "emoji": "🪟",
    "from": "lex:home",
    "letters": [["ن", "initial"], ["ا", "final"], ["ف", "initial"], ["ذ", "final"], ["ة", "isolated"]]
  },
  "مَقْعَدْ": {
    "say": "مَقْعَدْ",
    "emoji": "💺",
    "from": "lex:home",
    "letters": [["م", "initial"], ["ق", "medial"], ["ع", "medial"], ["د", "final"]]
  },
  "سَاعَةْ": {
    "say": "سَاعَةْ",
    "emoji": "🕐",
    "from": "lex:home",
    "letters": [["س", "initial"], ["ا", "final"], ["ع", "initial"], ["ة", "final"]]
  },
  "مِصْبَاحْ": {
    "say": "مِصْبَاحْ",
    "emoji": "💡",
    "from": "lex:home",
    "letters": [["م", "initial"], ["ص", "medial"], ["ب", "medial"], ["ا", "final"], ["ح", "isolated"]]
  },
  "صَحْنْ": {
    "say": "صَحْنْ",
    "emoji": "🍽️",
    "from": "lex:home",
    "letters": [["ص", "initial"], ["ح", "medial"], ["ن", "final"]]
  },
  "كُوبْ": {
    "say": "كُوبْ",
    "emoji": "🥤",
    "from": "lex:home",
    "letters": [["ك", "initial"], ["و", "final"], ["ب", "isolated"]]
  },
  "سِكِّينْ": {
    "say": "سِكِّينْ",
    "emoji": "🔪",
    "from": "lex:home",
    "letters": [["س", "initial"], ["ك", "medial"], ["ي", "medial"], ["ن", "final"]]
  },
  "حَمَّامْ": {
    "say": "حَمَّامْ",
    "emoji": "🛁",
    "from": "lex:home",
    "letters": [["ح", "initial"], ["م", "medial"], ["ا", "final"], ["م", "isolated"]]
  },
  "سَلَّةْ": {
    "say": "سَلَّةْ",
    "emoji": "🧺",
    "from": "lex:home",
    "letters": [["س", "initial"], ["ل", "medial"], ["ة", "final"]]
  },
  "تِلْفَازْ": {
    "say": "تِلْفَازْ",
    "emoji": "📺",
    "from": "lex:home",
    "letters": [["ت", "initial"], ["ل", "medial"], ["ف", "medial"], ["ا", "final"], ["ز", "isolated"]]
  },
  "هَاتِفْ": {
    "say": "هَاتِفْ",
    "emoji": "📱",
    "from": "lex:home",
    "letters": [["ه", "initial"], ["ا", "final"], ["ت", "initial"], ["ف", "final"]]
  },
  "حَدِيقَةْ": {
    "say": "حَدِيقَةْ",
    "emoji": "⛲",
    "from": "lex:home",
    "letters": [["ح", "initial"], ["د", "final"], ["ي", "initial"], ["ق", "medial"], ["ة", "final"]]
  },
  "وِسَادَةْ": {
    "say": "وِسَادَةْ",
    "emoji": "🛌",
    "from": "lex:home",
    "letters": [["و", "isolated"], ["س", "initial"], ["ا", "final"], ["د", "isolated"], ["ة", "isolated"]]
  },
  "مِرْوَحَةْ": {
    "say": "مِرْوَحَةْ",
    "emoji": "🪭",
    "from": "lex:home",
    "letters": [["م", "initial"], ["ر", "final"], ["و", "isolated"], ["ح", "initial"], ["ة", "final"]]
  },
  "خِزَانَةْ": {
    "say": "خِزَانَةْ",
    "emoji": "🗄️",
    "from": "lex:home",
    "letters": [["خ", "initial"], ["ز", "final"], ["ا", "isolated"], ["ن", "initial"], ["ة", "final"]]
  },
  "مِظَلَّةْ": {
    "say": "مِظَلَّةْ",
    "emoji": "☂️",
    "from": "lex:home",
    "letters": [["م", "initial"], ["ظ", "medial"], ["ل", "medial"], ["ة", "final"]]
  },
  "قِدْرْ": {
    "say": "قِدْرْ",
    "emoji": "🍲",
    "from": "lex:home",
    "letters": [["ق", "initial"], ["د", "final"], ["ر", "isolated"]]
  },
  "صُنْبُورْ": {
    "say": "صُنْبُورْ",
    "emoji": "🚰",
    "from": "lex:home",
    "letters": [["ص", "initial"], ["ن", "medial"], ["ب", "medial"], ["و", "final"], ["ر", "isolated"]]
  }
};

/** **جملُ سلّم اقرأ** المختارة: نصُّها المنطوق عنده، ودرجتُها، وكلماتُها بمفاتيح البنك. */
export const SENTENCES = {
  "الْغُرْفَةُ وَاسِعَةْ": {
    "say": "الْغُرْفَةُ وَاسِعَةْ",
    "from": "home:1",
    "words": ["غُرْفَةْ", "وَاسِعَةْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["غ", "medial"], ["ر", "final"], ["ف", "initial"], ["ة", "final"], ["و", "isolated"], ["ا", "isolated"], ["س", "initial"], ["ع", "medial"], ["ة", "final"]]
  },
  "السَّرِيرُ نَظِيفْ": {
    "say": "السَّرِيرُ نَظِيفْ",
    "from": "home:1",
    "words": ["سَرِيرْ", "نَظِيفْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["س", "medial"], ["ر", "final"], ["ي", "initial"], ["ر", "final"], ["ن", "initial"], ["ظ", "medial"], ["ي", "medial"], ["ف", "final"]]
  },
  "النَّافِذَةُ مَفْتُوحَةْ": {
    "say": "النَّافِذَةُ مَفْتُوحَةْ",
    "from": "home:1",
    "words": ["نَافِذَةْ", "مَفْتُوحَةْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["ن", "medial"], ["ا", "final"], ["ف", "initial"], ["ذ", "final"], ["ة", "isolated"], ["م", "initial"], ["ف", "medial"], ["ت", "medial"], ["و", "final"], ["ح", "initial"], ["ة", "final"]]
  },
  "الْمَقْعَدُ صَغِيرْ": {
    "say": "الْمَقْعَدُ صَغِيرْ",
    "from": "home:1",
    "words": ["مَقْعَدْ", "صَغِيرْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["م", "medial"], ["ق", "medial"], ["ع", "medial"], ["د", "final"], ["ص", "initial"], ["غ", "medial"], ["ي", "medial"], ["ر", "final"]]
  },
  "السَّاعَةُ جَمِيلَةْ": {
    "say": "السَّاعَةُ جَمِيلَةْ",
    "from": "home:1",
    "words": ["سَاعَةْ", "جَمِيلَةْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["س", "medial"], ["ا", "final"], ["ع", "initial"], ["ة", "final"], ["ج", "initial"], ["م", "medial"], ["ي", "medial"], ["ل", "medial"], ["ة", "final"]]
  },
  "الْمِصْبَاحُ مُنِيرْ": {
    "say": "الْمِصْبَاحُ مُنِيرْ",
    "from": "home:1",
    "words": ["مِصْبَاحْ", "مُنِيرْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["م", "medial"], ["ص", "medial"], ["ب", "medial"], ["ا", "final"], ["ح", "initial"], ["م", "medial"], ["ن", "medial"], ["ي", "medial"], ["ر", "final"]]
  },
  "الصَّحْنُ كَبِيرْ": {
    "say": "الصَّحْنُ كَبِيرْ",
    "from": "home:1",
    "words": ["صَحْنْ", "كَبِيرْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["ص", "medial"], ["ح", "medial"], ["ن", "medial"], ["ك", "medial"], ["ب", "medial"], ["ي", "medial"], ["ر", "final"]]
  },
  "الْكُوبُ صَغِيرْ": {
    "say": "الْكُوبُ صَغِيرْ",
    "from": "home:1",
    "words": ["كُوبْ", "صَغِيرْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["ك", "medial"], ["و", "final"], ["ب", "initial"], ["ص", "medial"], ["غ", "medial"], ["ي", "medial"], ["ر", "final"]]
  },
  "السِّكِّينُ حَادَّةْ": {
    "say": "السِّكِّينُ حَادَّةْ",
    "from": "home:2",
    "words": ["سِكِّينْ", "حَادَّةْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["س", "medial"], ["ك", "medial"], ["ي", "medial"], ["ن", "medial"], ["ح", "medial"], ["ا", "final"], ["د", "isolated"], ["ة", "isolated"]]
  },
  "الْحَمَّامُ نَظِيفْ": {
    "say": "الْحَمَّامُ نَظِيفْ",
    "from": "home:2",
    "words": ["حَمَّامْ", "نَظِيفْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["ح", "medial"], ["م", "medial"], ["ا", "final"], ["م", "initial"], ["ن", "medial"], ["ظ", "medial"], ["ي", "medial"], ["ف", "final"]]
  },
  "السَّلَّةُ كَبِيرَةْ": {
    "say": "السَّلَّةُ كَبِيرَةْ",
    "from": "home:2",
    "words": ["سَلَّةْ", "كَبِيرَةْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["س", "medial"], ["ل", "medial"], ["ة", "final"], ["ك", "initial"], ["ب", "medial"], ["ي", "medial"], ["ر", "final"], ["ة", "isolated"]]
  },
  "التِّلْفَازُ كَبِيرْ": {
    "say": "التِّلْفَازُ كَبِيرْ",
    "from": "home:2",
    "words": ["تِلْفَازْ", "كَبِيرْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["ت", "medial"], ["ل", "medial"], ["ف", "medial"], ["ا", "final"], ["ز", "isolated"], ["ك", "initial"], ["ب", "medial"], ["ي", "medial"], ["ر", "final"]]
  },
  "الْهَاتِفُ صَغِيرْ": {
    "say": "الْهَاتِفُ صَغِيرْ",
    "from": "home:2",
    "words": ["هَاتِفْ", "صَغِيرْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["ه", "medial"], ["ا", "final"], ["ت", "initial"], ["ف", "medial"], ["ص", "medial"], ["غ", "medial"], ["ي", "medial"], ["ر", "final"]]
  },
  "الْحَدِيقَةُ جَمِيلَةْ": {
    "say": "الْحَدِيقَةُ جَمِيلَةْ",
    "from": "home:2",
    "words": ["حَدِيقَةْ", "جَمِيلَةْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["ح", "medial"], ["د", "final"], ["ي", "initial"], ["ق", "medial"], ["ة", "final"], ["ج", "initial"], ["م", "medial"], ["ي", "medial"], ["ل", "medial"], ["ة", "final"]]
  },
  "الْوِسَادَةُ نَاعِمَةْ": {
    "say": "الْوِسَادَةُ نَاعِمَةْ",
    "from": "home:2",
    "words": ["وِسَادَةْ", "نَاعِمَةْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["و", "final"], ["س", "initial"], ["ا", "final"], ["د", "isolated"], ["ة", "isolated"], ["ن", "initial"], ["ا", "final"], ["ع", "initial"], ["م", "medial"], ["ة", "final"]]
  },
  "الْمِرْوَحَةُ تَدُورْ": {
    "say": "الْمِرْوَحَةُ تَدُورْ",
    "from": "home:2",
    "words": ["مِرْوَحَةْ", "تَدُورْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["م", "medial"], ["ر", "final"], ["و", "isolated"], ["ح", "initial"], ["ة", "final"], ["ت", "initial"], ["د", "final"], ["و", "isolated"], ["ر", "isolated"]]
  },
  "الْخِزَانَةُ كَبِيرَةْ": {
    "say": "الْخِزَانَةُ كَبِيرَةْ",
    "from": "home:3",
    "words": ["خِزَانَةْ", "كَبِيرَةْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["خ", "medial"], ["ز", "final"], ["ا", "isolated"], ["ن", "initial"], ["ة", "final"], ["ك", "initial"], ["ب", "medial"], ["ي", "medial"], ["ر", "final"], ["ة", "isolated"]]
  },
  "الْمِظَلَّةُ مَفْتُوحَةْ": {
    "say": "الْمِظَلَّةُ مَفْتُوحَةْ",
    "from": "home:3",
    "words": ["مِظَلَّةْ", "مَفْتُوحَةْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["م", "medial"], ["ظ", "medial"], ["ل", "medial"], ["ة", "final"], ["م", "initial"], ["ف", "medial"], ["ت", "medial"], ["و", "final"], ["ح", "initial"], ["ة", "final"]]
  },
  "الْقِدْرُ سَاخِنْ": {
    "say": "الْقِدْرُ سَاخِنْ",
    "from": "home:3",
    "words": ["قِدْرْ", "سَاخِنْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["ق", "medial"], ["د", "final"], ["ر", "isolated"], ["س", "initial"], ["ا", "final"], ["خ", "initial"], ["ن", "final"]]
  },
  "الصُّنْبُورُ نَظِيفْ": {
    "say": "الصُّنْبُورُ نَظِيفْ",
    "from": "home:3",
    "words": ["صُنْبُورْ", "نَظِيفْ"],
    "letters": [["ا", "isolated"], ["ل", "initial"], ["ص", "medial"], ["ن", "medial"], ["ب", "medial"], ["و", "final"], ["ر", "isolated"], ["ن", "initial"], ["ظ", "medial"], ["ي", "medial"], ["ف", "final"]]
  }
};

/** حروفُ العربية بأسمائها ووصلِها — **من `LETTERS` في اقرأ**، ومنها يُرسم كلُّ نصّ. */
export const LETTERS = {
  "ا": { "name": "أَلِف", "joins": false },
  "ب": { "name": "باء", "joins": true },
  "م": { "name": "ميم", "joins": true },
  "ل": { "name": "لام", "joins": true },
  "ن": { "name": "نون", "joins": true },
  "ر": { "name": "راء", "joins": false },
  "د": { "name": "دال", "joins": false },
  "س": { "name": "سين", "joins": true },
  "ت": { "name": "تاء", "joins": true },
  "و": { "name": "واو", "joins": false },
  "ي": { "name": "ياء", "joins": true },
  "ه": { "name": "هاء", "joins": true },
  "ع": { "name": "عَين", "joins": true },
  "ف": { "name": "فاء", "joins": true },
  "ك": { "name": "كاف", "joins": true },
  "ق": { "name": "قاف", "joins": true },
  "ح": { "name": "حاء", "joins": true },
  "ج": { "name": "جيم", "joins": true },
  "خ": { "name": "خاء", "joins": true },
  "ش": { "name": "شين", "joins": true },
  "ص": { "name": "صاد", "joins": true },
  "ز": { "name": "زاي", "joins": false },
  "ط": { "name": "طاء", "joins": true },
  "ث": { "name": "ثاء", "joins": true },
  "ذ": { "name": "ذال", "joins": false },
  "ض": { "name": "ضاد", "joins": true },
  "ظ": { "name": "ظاء", "joins": true },
  "غ": { "name": "غَين", "joins": true }
};

/**
 * **الحروفُ المتغيّرة**: حرفٌ مدروسٌ وعليه علامة (`base` أصلُه) — تطبيقُ ق٣ في
 * الرسم، وما لا أصلَ له (ء) يُرسم وحدَه. ووصلُها وصلُ أصلها إلا ما فرّقه الرسم.
 */
export const VARIANTS = {
  "أ": { "base": "ا", "mark": "همزةٌ فوق الألف", "joins": false },
  "إ": { "base": "ا", "mark": "همزةٌ تحت الألف", "joins": false },
  "آ": { "base": "ا", "mark": "مدّةٌ فوق الألف", "joins": false },
  "ؤ": { "base": "و", "mark": "همزةٌ فوق الواو", "joins": false },
  "ئ": { "base": "ي", "mark": "همزةٌ فوق الياء", "joins": true },
  "ء": { "base": null, "mark": "همزةٌ مفردة", "joins": false },
  "ة": { "base": "ه", "mark": "تاءٌ مربوطة", "joins": false },
  "ى": { "base": "ي", "mark": "ألفٌ مقصورة", "joins": false }
};

/**
 * **حكمُ كلِّ علامةٍ من علامات ق٣ — محسوباً لا مكتوباً** (حكمُ المدير في مراجعة
 * الجلسة ٣، بندٌ في الجلسة ٨): لكلِّ علامةٍ يبحث المولّدُ **سطوحَ اقرأ كلَّها** عن
 * كلمةٍ حاملة؛ فما وُجد حاملُه ضُمّ بقاعدةٍ معلنة، وما لم يوجد في السطوح كلِّها
 * **سقط من مقرَّر اكتب** (`surface: null`) — لا كلمةَ تُخترع — وبقي لـ«أَتْقِنْ».
 *
 * **وتُعلَن الساقطاتُ في صفحة الأسس**: «اكتبُ يعلّم كتابةَ ما علّمه اقرأ قراءةً».
 */
export const Q3_RULING = [
  { "mark": "ّ", "name": "الشَّدّة", "surface": "مقرَّرةٌ سلفاً", "word": null },
  { "mark": "ً", "name": "التَّنوين", "surface": null, "word": null },
  { "mark": "ٌ", "name": "التَّنوين", "surface": "مقرَّرةٌ سلفاً", "word": null },
  { "mark": "ٍ", "name": "التَّنوين", "surface": null, "word": null },
  { "mark": "أ", "name": "همزةٌ فوق الألف", "surface": "بنكُ الكلمات", "word": "أُمِّي" },
  { "mark": "إ", "name": "همزةٌ تحت الألف", "surface": "بنكُ الكلمات", "word": "إِبْرِيقْ" },
  { "mark": "ؤ", "name": "همزةٌ فوق الواو", "surface": null, "word": null },
  { "mark": "ئ", "name": "همزةٌ فوق الياء", "surface": null, "word": null },
  { "mark": "ء", "name": "همزةٌ مفردة", "surface": "بنكُ الكلمات", "word": "قِرَاءَةْ" }
];

/** نسبُ الوحدة: من أيّ بياناتِ اقرأ بُنيت وببصماتها — يفحصه `make_curriculum.mjs --self-test`. */
export const CURRICULUM_SOURCE = {
  "tool": "tools/make_curriculum.mjs",
  "read": "qataruts/read — المرجعُ الحيّ: يُقرأ ولا يُمَسّ",
  "files": {
    "app/js/curriculum.js": "f0cd96955c3b",
    "app/js/sentences.js": "a2aff2084a59",
    "app/data/lexicon.json": "fa3b5e9f4903",
    "app/audio/manifest.json": "6d0a0498afcc"
  }
};

/** بوابةٌ بمعرّفها. */
export const gateById = (id) => GATES.find((gate) => gate.id === id) || null;

/** البوابةُ التي تقف قبل هذه المحطة (أو قبل ختام الرحلة: `'end'`). */
export const gateBefore = (where) => GATES.find((gate) => gate.before === where) || null;

/** محطةٌ بمعرّفها. */
export const stageById = (id) => STAGES.find((stage) => stage.id === id) || null;

/**
 * **المساراتُ المرجعية** لكل حرفٍ بأشكاله (`METHOD.md §٣.١`): شبكةٌ معيارية
 * `١٠٠٠×١٠٠٠`، والنقاطُ بعد الجسم. تؤلّفها عدّةُ الجلسة ٢ (`tools/make_paths.html`)
 * ويفحصها `tools/check_paths.py` — **ولا حرفَ يدخل المنهج بلا مسارٍ عابرٍ للفحص**.
 *
 * **وبيانُها في وحدةٍ على حدة (`paths.js`) ويُصدَّر من هنا**: `PATHS` مصدرُ الحقيقة
 * الوحيد للشاشات كما كان، غير أنّ **ملفَّين لمولِّدَين** — هذا يكتبه مولّدُ المنهج،
 * وذاك تؤلّفه عدّةُ المسارات، فلا يمحو أحدُهما عملَ الآخر.
 */
export { PATHS } from './paths.js';
import { PATHS } from './paths.js';

/** أشكالُ الموقع الأربعة — أسماؤها ثابتة لأنها تدخل مفاتيحَ ليتنر (`METHOD.md §٦`). */
export const FORMS = {
  ISOLATED: 'isolated',
  INITIAL: 'initial',
  MEDIAL: 'medial',
  FINAL: 'final',
};

/** اسمُ شكل الموقع كما يُقرأ في اللوحة والعناوين. */
export const FORM_NAMES = {
  [FORMS.ISOLATED]: 'معزول',
  [FORMS.INITIAL]: 'ابتدائي',
  [FORMS.MEDIAL]: 'وسطي',
  [FORMS.FINAL]: 'نهائي',
};

/** مسارُ حرفٍ بشكلِ موضعٍ بعينه — `null` إن لم يُؤلَّف بعد. */
export const pathOf = (letter, form = FORMS.ISOLATED) => PATHS[letter]?.[form] || null;

/**
 * **مفاتيحُ أصوات كلمات المنهج في بنك اقرأ** — مصدرٌ واحد لكلِّ وحدةٍ تنطقها
 * (شاشةُ النسخ والمراجعة)، فلا تشتقّ كلٌّ قائمتَها فتفترقا يوماً. **وهي حقلُ
 * `say` لا نصُّ الكلمة**: مفتاحُ الملفّ عند اقرأ هو ما يُشغَّل وهو ما يُعلَن،
 * وفراغُه يعني «تُنسَخ ولا تُملى» (`METHOD.md §٧`).
 */
export const SPOKEN_WORDS = [...new Set(Object.values(WORDS).map((w) => w.say).filter(Boolean))];

/** بيانُ كلمةٍ من البنك — `null` إن لم تكن في المنهج. */
export const wordInfo = (text) => WORDS[text] || null;

/** بيانُ جملةٍ من السلّم — `null` إن لم تكن في المنهج. */
export const sentenceInfo = (text) => SENTENCES[text] || null;

/** بطاقةُ علامةٍ — `null` إن لم تكن في المنهج. */
export const markInfo = (mark) => MARKS.find((entry) => entry.mark === mark) || null;
