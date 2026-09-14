// Website UI translations. The exam itself (generated questions, scripts,
// grading feedback, vocabulary content) always stays in German — it mirrors
// the real telc B1 exam, which is German regardless of the learner's
// interface language. Only the app's own chrome (nav, buttons, page
// headings, status messages) is translated here.

export type Locale = "en" | "tr" | "de";

export const LOCALES: Locale[] = ["en", "tr", "de"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "doch_lang";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as string[]).includes(value);
}

export type Dictionary = {
  common: {
    logOut: string;
    save: string;
    cancel: string;
    edit: string;
    continueLabel: string;
    somethingWrong: string;
  };
  languageSwitcher: {
    label: string;
    names: Record<Locale, string>;
  };
  nav: {
    mockExam: string;
    flashcards: string;
    learnFromMistakes: string;
    statistics: string;
    openMenu: string;
    closeMenu: string;
  };
  home: {
    welcome: (name: string) => string;
    tagline: string;
    streak: (n: number) => string;
    sections: {
      examTitle: string;
      examDesc: string;
      flashTitle: string;
      flashDesc: string;
      mistakesTitle: string;
      mistakesDesc: string;
      statsTitle: string;
      statsDesc: string;
    };
  };
  login: {
    prompt: string;
    continueAs: string;
    orNewName: string;
    yourName: string;
    namePlaceholder: string;
    continueBtn: string;
    loginFailed: (status: number) => string;
    noConfirmation: string;
  };
  modeLabels: Record<string, string> & {
    full: string;
    reading: string;
    listening: string;
    writing: string;
    grammar: string;
    speaking: string;
  };
  examsPage: {
    title: string;
    subtitle: string;
    todaysRecommendation: string;
    modeOptions: {
      full: { title: string; desc: string };
      reading: { title: string; desc: string };
      listening: { title: string; desc: string };
      writing: { title: string; desc: string };
      grammar: { title: string; desc: string };
      speaking: { title: string; desc: string };
    };
    yourExams: string;
    noExamsYet: string;
    partsCount: (n: number) => string;
    scored: (pct: number) => string;
    inProgress: string;
    notStarted: string;
    viewResults: string;
    open: string;
  };
  examCountdown: {
    updateDate: string;
    whenIsExam: string;
    registerHint: string;
    save: string;
    cancel: string;
    daysUntil: (n: number, dateStr: string) => string;
    examToday: string;
    examPassed: (dateStr: string) => string;
    editBtn: string;
  };
  examModeSelector: {
    recommendedToday: string;
    generateBtn: string;
    generating: string;
    startingLabel: string;
    savingLabel: string;
    progressLabel: (done: number, total: number, label: string) => string;
    startingHint: string;
    connectionLostError: string;
    genericError: string;
    noResponseBody: string;
    generationEndedError: string;
  };
  examTaker: {
    timeRemaining: (clock: string) => string;
    browserSpeechWarning: string;
    downloadAllScripts: string;
    showScript: string;
    downloadScript: string;
    wordBank: string;
    submitExam: string;
    submitting: string;
    failedToStart: string;
    partTips: { listening: string; speaking: string; writing: string };
  };
  resultsPage: {
    resultsSuffix: string;
    score: (pct: number | null) => string;
    passLikelihood: (pct: number, passing: boolean) => string;
    passBasisWritten: (basis: string) => string;
    yourAnswer: string;
    noAnswer: string;
    correct: string;
    incorrect: string;
    expected: (text: string) => string;
    pointsOf: (a: number, b: number) => string;
    reviewMistakes: string;
  };
  mistakesPage: {
    title: string;
    subtitle: string;
    noMistakes: string;
    times: (n: number) => string;
    yourAnswer: string;
    noAnswer: string;
    correctSuffix: (text: string) => string;
    vocabMistakesTitle: string;
    vocabMistakesSubtitle: string;
  };
  vocabPage: {
    title: string;
    wordCount: (n: number) => string;
    searchPlaceholder: string;
    searchBtn: string;
    all: string;
    noVocab: string;
    colWord: string;
    colType: string;
    colTurkish: string;
    colExamples: string;
  };
  progressPage: {
    title: string;
    passLikelihood: (pct: number, writtenPct: number, passing: boolean) => string;
    passBasis: (basis: string) => string;
    timeOnSite: string;
    examsCompleted: string;
    wordsKnown: string;
    scoreTrend: string;
    examHistory: string;
    noCompletedExams: string;
    notGraded: string;
    pending: string;
    examsByType: string;
    vocabulary: string;
    known: string;
    learning: string;
    totalTracked: string;
  };
  flashcards: {
    title: string;
    subtitle: string;
    browseFullList: string;
    addWordBtn: string;
    closeBtn: string;
    wordPlaceholder: string;
    addBtn: string;
    adding: string;
    failedToAdd: string;
    loading: string;
    noWordsYet: string;
    sessionComplete: string;
    startAnother: string;
    cardXofY: (i: number, total: number) => string;
    noMeaningSaved: string;
    turkishLabel: string;
    unknownValue: string;
    pluralLabel: string;
    partizipLabel: string;
    praeteritumLabel: string;
    clickToReveal: string;
    didntKnow: string;
    knewIt: string;
  };
  speaking: {
    stopRecording: string;
    recordAnswer: string;
    notSupported: string;
    placeholder: string;
  };
  listening: {
    loading: string;
    pause: string;
    noPlaysLeft: string;
    play: string;
    playedTimes: (count: number, max: number) => string;
    playbackUnavailable: string;
  };
  scoreTrendChart: {
    noAttempts: string;
    passThreshold: string;
    caption: string;
  };
};

const en: Dictionary = {
  common: {
    logOut: "Log out",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    continueLabel: "Continue",
    somethingWrong: "Something went wrong",
  },
  languageSwitcher: {
    label: "Language",
    names: { en: "English", tr: "Türkçe", de: "Deutsch" },
  },
  nav: {
    mockExam: "Mock Exam",
    flashcards: "Flashcards",
    learnFromMistakes: "Learn from Mistakes",
    statistics: "Statistics",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  home: {
    welcome: (name) => `Welcome, ${name}`,
    tagline:
      "Practice for the telc B1 German exam with fresh, LLM-generated mock exams and instant feedback.",
    streak: (n) => `🔥 ${n} day${n === 1 ? "" : "s"} streak`,
    sections: {
      examTitle: "Mock Exam",
      examDesc: "Generate a fresh telc B1 practice exam and take it",
      flashTitle: "Flashcards",
      flashDesc: "Review vocabulary, prioritized by what you need most",
      mistakesTitle: "Learn from Mistakes",
      mistakesDesc: "Grouped explanations with fresh examples",
      statsTitle: "Statistics",
      statsDesc: "Scores, streaks, and vocabulary growth over time",
    },
  },
  login: {
    prompt:
      "Enter your name to continue. No password — this is a lightweight login for a small group of testers.",
    continueAs: "Continue as:",
    orNewName: "Or use a new name",
    yourName: "Your name",
    namePlaceholder: "e.g. Ayşe",
    continueBtn: "Continue",
    loginFailed: (status) => `Login failed (server returned ${status})`,
    noConfirmation: "Server didn't confirm the login — please try again.",
  },
  modeLabels: {
    full: "Complete Mock Exam",
    reading: "Reading",
    listening: "Listening",
    writing: "Writing",
    grammar: "Grammar",
    speaking: "Speaking",
  },
  examsPage: {
    title: "Mock Exam",
    subtitle: "Pick an exam type, generate it, and take it whenever you're ready.",
    todaysRecommendation: "Today's recommendation: ",
    modeOptions: {
      full: {
        title: "Complete Mock Exam",
        desc: "Full telc B1 exam — Lesen, Sprachbausteine, Hören, Schreiben",
      },
      reading: { title: "Reading", desc: "Leseverstehen Teil 1–3" },
      listening: {
        title: "Listening",
        desc: "Hörverstehen Teil 1–3, read aloud in-browser",
      },
      writing: { title: "Writing", desc: "Schriftlicher Ausdruck — reply email" },
      grammar: { title: "Grammar", desc: "Sprachbausteine Teil 1–2" },
      speaking: {
        title: "Speaking",
        desc: "Mündlicher Ausdruck, solo-adapted — speak or type your answer",
      },
    },
    yourExams: "Your exams",
    noExamsYet: "No exams yet. Generate one above to get started.",
    partsCount: (n) => `${n} part${n === 1 ? "" : "s"}`,
    scored: (pct) => `scored ${Math.round(pct)}%`,
    inProgress: "in progress",
    notStarted: "not started",
    viewResults: "View results",
    open: "Open",
  },
  examCountdown: {
    updateDate: "Update your exam date",
    whenIsExam: "When is your telc B1 exam?",
    registerHint:
      "Haven't registered yet? Book your exam soon so you have a real deadline to train toward.",
    save: "Save",
    cancel: "Cancel",
    daysUntil: (n, dateStr) =>
      `${n} day${n === 1 ? "" : "s"} until your telc B1 exam (${dateStr})`,
    examToday: "Your exam is today — good luck!",
    examPassed: (dateStr) => `Exam date (${dateStr}) has passed.`,
    editBtn: "Edit",
  },
  examModeSelector: {
    recommendedToday: "Recommended today",
    generateBtn: "Mock Exam Generate",
    generating: "Generating…",
    startingLabel: "Starting…",
    savingLabel: "Saving your exam…",
    progressLabel: (done, total, label) => `${done}/${total} done — just generated: ${label}`,
    startingHint: "Starting… this can take a couple of minutes",
    connectionLostError:
      "Connection lost while generating (this can happen if your screen locked or you switched apps). Nothing was saved — try again and keep this tab open until it finishes.",
    genericError: "Failed to generate exam",
    noResponseBody: "No response body",
    generationEndedError: "Generation ended without producing an exam",
  },
  examTaker: {
    timeRemaining: (clock) => `Time remaining: ${clock}`,
    browserSpeechWarning:
      "Built-in playback uses your browser's speech synthesis, which can sound robotic. Download the scripts to generate better audio with an external text-to-speech tool instead.",
    downloadAllScripts: "Download all scripts (.txt)",
    showScript: "Show script (only after listening, for review)",
    downloadScript: "Download script (.txt)",
    wordBank: "Word bank",
    submitExam: "Submit exam",
    submitting: "Submitting…",
    failedToStart: "Failed to start attempt",
    partTips: {
      listening:
        "Tip: the first items in each Hörverstehen Teil are worth just as many points as the rest — get ready before you press play so you don't miss an easy one.",
      speaking:
        "Tip: in the real paired exam, the examiner may end the conversation once they're confident in your level — that's normal, not a sign you did poorly.",
      writing:
        "Structure tip: Einleitung (1-2 sentences on why you're writing) → all 4 Leitpunkte, each with a connector (Zuerst, Außerdem, Des Weiteren, Schließlich) → Schluss (e.g. \"Ich freue mich auf Ihre/deine Antwort\"). This skeleton works for almost any telc B1 Schreiben task.",
    },
  },
  resultsPage: {
    resultsSuffix: "Results",
    score: (pct) => `Score: ${pct !== null ? `${Math.round(pct)}%` : "Not graded"}`,
    passLikelihood: (pct, passing) =>
      `Estimated pass likelihood: ${pct}% (${passing ? "currently passing" : "not yet passing"} the 60% written threshold)`,
    passBasisWritten: (basis) =>
      `Based on ${basis}. This is a rough estimate from your written-skill scores only — the telc exam also requires ≥60% on the separately-graded speaking (mündlicher Ausdruck) component, which this app doesn't assess.`,
    yourAnswer: "Your answer: ",
    noAnswer: "No answer",
    correct: "Correct",
    incorrect: "Incorrect",
    expected: (text) => ` — expected: ${text}`,
    pointsOf: (a, b) => `${a.toFixed(1)} / ${b.toFixed(1)} points`,
    reviewMistakes: "Review all past mistakes",
  },
  mistakesPage: {
    title: "Learn from Mistakes",
    subtitle:
      "Grouped by topic, most frequent first. Each explanation includes fresh examples — read them, don't just skim the rule.",
    noMistakes: "No mistakes recorded yet — take an exam to get started.",
    times: (n) => `${n} time${n === 1 ? "" : "s"}`,
    yourAnswer: "Your answer: ",
    noAnswer: "No answer",
    correctSuffix: (text) => ` — correct: ${text}`,
    vocabMistakesTitle: "Vocabulary usage mistakes",
    vocabMistakesSubtitle: "(from your writing answers)",
  },
  vocabPage: {
    title: "Vocabulary",
    wordCount: (n) => `${n} word${n === 1 ? "" : "s"}.`,
    searchPlaceholder: "Search word…",
    searchBtn: "Search",
    all: "All",
    noVocab: "No vocabulary loaded yet.",
    colWord: "Word",
    colType: "Type",
    colTurkish: "Türkçe",
    colExamples: "Examples",
  },
  progressPage: {
    title: "Statistics",
    passLikelihood: (pct, writtenPct, passing) =>
      `Estimated pass likelihood: ${pct}% — ${writtenPct.toFixed(0)}% on the written portion (${passing ? "≥60%, currently passing" : "below the 60% threshold"})`,
    passBasis: (basis) =>
      `Based on ${basis}. Written-skills only — speaking isn't assessed by this app but is graded independently.`,
    timeOnSite: "Time on site",
    examsCompleted: "Exams completed",
    wordsKnown: "Words known",
    scoreTrend: "Score trend",
    examHistory: "Exam history",
    noCompletedExams: "No completed exams yet.",
    notGraded: "Not graded",
    pending: "pending",
    examsByType: "Exams by type",
    vocabulary: "Vocabulary",
    known: "Known",
    learning: "Learning",
    totalTracked: "Total tracked",
  },
  flashcards: {
    title: "Flashcards",
    subtitle:
      "Prioritized from words you've used incorrectly, words due for review, and words you've added yourself.",
    browseFullList: "Browse the full vocabulary list →",
    addWordBtn: "+ Add word",
    closeBtn: "Close",
    wordPlaceholder: "Type a German word…",
    addBtn: "Add",
    adding: "Adding…",
    failedToAdd: "Failed to add word",
    loading: "Loading…",
    noWordsYet: "No words in your bank yet. Take a writing exam or add a word above to get started.",
    sessionComplete: "Session complete — nice work!",
    startAnother: "Start another session",
    cardXofY: (i, total) => `Card ${i} of ${total}`,
    noMeaningSaved: "No meaning saved yet",
    turkishLabel: "Türkçe:",
    unknownValue: "unbekannt",
    pluralLabel: "Plural:",
    partizipLabel: "Partizip II:",
    praeteritumLabel: "Präteritum:",
    clickToReveal: "Click to reveal",
    didntKnow: "Nochmal (didn't know)",
    knewIt: "Kannte ich (knew it)",
  },
  speaking: {
    stopRecording: "⏹ Stop recording",
    recordAnswer: "🎤 Record your answer (Deutsch)",
    notSupported: "Speech-to-text isn't supported in this browser — type your answer instead.",
    placeholder: "Your spoken answer appears here as text — review and edit before submitting.",
  },
  listening: {
    loading: "Loading…",
    pause: "Pause",
    noPlaysLeft: "No plays left",
    play: "▶ Play",
    playedTimes: (count, max) =>
      `Played ${count}/${max} time${max === 1 ? "" : "s"} — per the real exam, this Teil is played ${max === 1 ? "once" : "twice"}.`,
    playbackUnavailable:
      "Playback isn't available right now. You can still read the script below, or download it to use with an external TTS tool.",
  },
  scoreTrendChart: {
    noAttempts: "No graded attempts yet — take a practice exam to start your trend.",
    passThreshold: "60% pass threshold",
    caption: "Each line shows your most recent attempts for that skill, oldest to newest.",
  },
};

const tr: Dictionary = {
  common: {
    logOut: "Çıkış yap",
    save: "Kaydet",
    cancel: "İptal",
    edit: "Düzenle",
    continueLabel: "Devam et",
    somethingWrong: "Bir şeyler ters gitti",
  },
  languageSwitcher: {
    label: "Dil",
    names: { en: "English", tr: "Türkçe", de: "Deutsch" },
  },
  nav: {
    mockExam: "Deneme Sınavı",
    flashcards: "Kelime Kartları",
    learnFromMistakes: "Hatalardan Öğren",
    statistics: "İstatistikler",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
  },
  home: {
    welcome: (name) => `Hoş geldin, ${name}`,
    tagline:
      "telc B1 Almanca sınavına, yapay zekayla üretilen yepyeni deneme sınavları ve anında geri bildirimle hazırlan.",
    streak: (n) => `🔥 ${n} günlük seri`,
    sections: {
      examTitle: "Deneme Sınavı",
      examDesc: "Yeni bir telc B1 deneme sınavı oluştur ve çöz",
      flashTitle: "Kelime Kartları",
      flashDesc: "En çok ihtiyacın olan kelimelere öncelik vererek tekrar et",
      mistakesTitle: "Hatalardan Öğren",
      mistakesDesc: "Gruplandırılmış açıklamalar ve yeni örnekler",
      statsTitle: "İstatistikler",
      statsDesc: "Zaman içindeki puanlar, seriler ve kelime dağarcığın",
    },
  },
  login: {
    prompt:
      "Devam etmek için adını gir. Şifre yok — bu, küçük bir test grubu için basit bir giriştir.",
    continueAs: "Şu kullanıcıyla devam et:",
    orNewName: "Ya da yeni bir isim kullan",
    yourName: "Adın",
    namePlaceholder: "örn. Ayşe",
    continueBtn: "Devam et",
    loginFailed: (status) => `Giriş başarısız oldu (sunucu ${status} döndürdü)`,
    noConfirmation: "Sunucu girişi onaylamadı — lütfen tekrar dene.",
  },
  modeLabels: {
    full: "Tam Deneme Sınavı",
    reading: "Okuma",
    listening: "Dinleme",
    writing: "Yazma",
    grammar: "Dilbilgisi",
    speaking: "Konuşma",
  },
  examsPage: {
    title: "Deneme Sınavı",
    subtitle: "Bir sınav türü seç, oluştur ve hazır olduğunda çöz.",
    todaysRecommendation: "Bugünün önerisi: ",
    modeOptions: {
      full: {
        title: "Tam Deneme Sınavı",
        desc: "Tam telc B1 sınavı — Lesen, Sprachbausteine, Hören, Schreiben",
      },
      reading: { title: "Okuma", desc: "Leseverstehen Teil 1–3" },
      listening: {
        title: "Dinleme",
        desc: "Hörverstehen Teil 1–3, tarayıcıda sesli okunur",
      },
      writing: { title: "Yazma", desc: "Schriftlicher Ausdruck — cevap e-postası" },
      grammar: { title: "Dilbilgisi", desc: "Sprachbausteine Teil 1–2" },
      speaking: {
        title: "Konuşma",
        desc: "Mündlicher Ausdruck, tek kişilik uyarlama — konuş ya da yaz",
      },
    },
    yourExams: "Sınavların",
    noExamsYet: "Henüz sınav yok. Başlamak için yukarıdan bir tane oluştur.",
    partsCount: (n) => `${n} bölüm`,
    scored: (pct) => `puan: %${Math.round(pct)}`,
    inProgress: "devam ediyor",
    notStarted: "başlanmadı",
    viewResults: "Sonuçları gör",
    open: "Aç",
  },
  examCountdown: {
    updateDate: "Sınav tarihini güncelle",
    whenIsExam: "telc B1 sınavın ne zaman?",
    registerHint:
      "Henüz kayıt olmadın mı? Çalışmak için gerçek bir hedefin olsun diye sınavını yakında ayırt.",
    save: "Kaydet",
    cancel: "İptal",
    daysUntil: (n, dateStr) => `telc B1 sınavına ${n} gün kaldı (${dateStr})`,
    examToday: "Sınavın bugün — bol şans!",
    examPassed: (dateStr) => `Sınav tarihi (${dateStr}) geçti.`,
    editBtn: "Düzenle",
  },
  examModeSelector: {
    recommendedToday: "Bugün önerilen",
    generateBtn: "Deneme Sınavı Oluştur",
    generating: "Oluşturuluyor…",
    startingLabel: "Başlıyor…",
    savingLabel: "Sınavın kaydediliyor…",
    progressLabel: (done, total, label) => `${done}/${total} tamamlandı — az önce oluşturuldu: ${label}`,
    startingHint: "Başlıyor… bu birkaç dakika sürebilir",
    connectionLostError:
      "Oluşturma sırasında bağlantı koptu (ekranın kilitlendiyse veya uygulama değiştirdiysen bu olabilir). Hiçbir şey kaydedilmedi — tekrar dene ve bitene kadar bu sekmeyi açık tut.",
    genericError: "Sınav oluşturulamadı",
    noResponseBody: "Sunucudan yanıt gövdesi gelmedi",
    generationEndedError: "Oluşturma, bir sınav üretmeden sona erdi",
  },
  examTaker: {
    timeRemaining: (clock) => `Kalan süre: ${clock}`,
    browserSpeechWarning:
      "Yerleşik oynatma tarayıcının konuşma sentezini kullanır ve robotik gelebilir. Daha iyi ses için metinleri indirip harici bir metin-okuma aracı kullanabilirsin.",
    downloadAllScripts: "Tüm metinleri indir (.txt)",
    showScript: "Metni göster (sadece dinledikten sonra, tekrar için)",
    downloadScript: "Metni indir (.txt)",
    wordBank: "Kelime havuzu",
    submitExam: "Sınavı gönder",
    submitting: "Gönderiliyor…",
    failedToStart: "Sınav denemesi başlatılamadı",
    partTips: {
      listening:
        "İpucu: her Hörverstehen Teil'inin ilk sorusu diğerleriyle aynı puan değerindedir — kolay bir soruyu kaçırmamak için oynat'a basmadan önce hazır ol.",
      speaking:
        "İpucu: gerçek karşılıklı sınavda, sınav görevlisi seviyenden emin olduğunda konuşmayı bitirebilir — bu normaldir, kötü gittiği anlamına gelmez.",
      writing:
        "Yapı ipucu: Einleitung (neden yazdığına dair 1-2 cümle) → tüm 4 Leitpunkt, her biri bir bağlaçla (Zuerst, Außerdem, Des Weiteren, Schließlich) → Schluss (örn. \"Ich freue mich auf Ihre/deine Antwort\"). Bu iskelet neredeyse her telc B1 Schreiben görevinde işe yarar.",
    },
  },
  resultsPage: {
    resultsSuffix: "Sonuçlar",
    score: (pct) => `Puan: ${pct !== null ? `%${Math.round(pct)}` : "Henüz değerlendirilmedi"}`,
    passLikelihood: (pct, passing) =>
      `Tahmini geçme olasılığı: %${pct} (%60 yazılı eşiğini ${passing ? "şu anda geçiyorsun" : "henüz geçmiyorsun"})`,
    passBasisWritten: (basis) =>
      `${basis} temel alınmıştır. Bu, yalnızca yazılı beceri puanlarına dayanan kaba bir tahmindir — telc sınavı ayrıca ayrı değerlendirilen konuşma (mündlicher Ausdruck) bölümünde de ≥%60 gerektirir; bu uygulama onu değerlendirmez.`,
    yourAnswer: "Cevabın: ",
    noAnswer: "Cevap yok",
    correct: "Doğru",
    incorrect: "Yanlış",
    expected: (text) => ` — beklenen: ${text}`,
    pointsOf: (a, b) => `${a.toFixed(1)} / ${b.toFixed(1)} puan`,
    reviewMistakes: "Geçmiş tüm hataları gözden geçir",
  },
  mistakesPage: {
    title: "Hatalardan Öğren",
    subtitle:
      "Konuya göre gruplandırılmış, en sık olanlar önce. Her açıklama yeni örnekler içerir — kuralı sadece göz gezdirme, oku.",
    noMistakes: "Henüz hata kaydedilmedi — başlamak için bir sınav çöz.",
    times: (n) => `${n} kez`,
    yourAnswer: "Cevabın: ",
    noAnswer: "Cevap yok",
    correctSuffix: (text) => ` — doğrusu: ${text}`,
    vocabMistakesTitle: "Kelime kullanım hataları",
    vocabMistakesSubtitle: "(yazma cevaplarından)",
  },
  vocabPage: {
    title: "Kelime Dağarcığı",
    wordCount: (n) => `${n} kelime.`,
    searchPlaceholder: "Kelime ara…",
    searchBtn: "Ara",
    all: "Tümü",
    noVocab: "Henüz kelime yüklenmedi.",
    colWord: "Kelime",
    colType: "Tür",
    colTurkish: "Türkçe",
    colExamples: "Örnekler",
  },
  progressPage: {
    title: "İstatistikler",
    passLikelihood: (pct, writtenPct, passing) =>
      `Tahmini geçme olasılığı: %${pct} — yazılı bölümde %${writtenPct.toFixed(0)} (${passing ? "≥%60, şu anda geçiyorsun" : "%60 eşiğinin altında"})`,
    passBasis: (basis) =>
      `${basis} temel alınmıştır. Sadece yazılı beceriler — konuşma bu uygulama tarafından değerlendirilmez, ayrı olarak puanlanır.`,
    timeOnSite: "Sitede geçirilen süre",
    examsCompleted: "Tamamlanan sınavlar",
    wordsKnown: "Bilinen kelimeler",
    scoreTrend: "Puan eğilimi",
    examHistory: "Sınav geçmişi",
    noCompletedExams: "Henüz tamamlanmış sınav yok.",
    notGraded: "Henüz değerlendirilmedi",
    pending: "bekliyor",
    examsByType: "Türe göre sınavlar",
    vocabulary: "Kelime dağarcığı",
    known: "Bilinen",
    learning: "Öğreniliyor",
    totalTracked: "Toplam takip edilen",
  },
  flashcards: {
    title: "Kelime Kartları",
    subtitle:
      "Yanlış kullandığın kelimelere, tekrar zamanı gelenlere ve kendi eklediklerine öncelik verilir.",
    browseFullList: "Tüm kelime listesine göz at →",
    addWordBtn: "+ Kelime ekle",
    closeBtn: "Kapat",
    wordPlaceholder: "Bir Almanca kelime yaz…",
    addBtn: "Ekle",
    adding: "Ekleniyor…",
    failedToAdd: "Kelime eklenemedi",
    loading: "Yükleniyor…",
    noWordsYet: "Havuzunda henüz kelime yok. Başlamak için bir yazma sınavı çöz ya da yukarıdan kelime ekle.",
    sessionComplete: "Oturum tamamlandı — aferin!",
    startAnother: "Yeni bir oturum başlat",
    cardXofY: (i, total) => `Kart ${i} / ${total}`,
    noMeaningSaved: "Henüz anlam kaydedilmedi",
    turkishLabel: "Türkçe:",
    unknownValue: "bilinmiyor",
    pluralLabel: "Çoğul:",
    partizipLabel: "Partizip II:",
    praeteritumLabel: "Präteritum:",
    clickToReveal: "Görmek için tıkla",
    didntKnow: "Tekrar (bilmiyordum)",
    knewIt: "Biliyordum",
  },
  speaking: {
    stopRecording: "⏹ Kaydı durdur",
    recordAnswer: "🎤 Cevabını kaydet (Deutsch)",
    notSupported: "Bu tarayıcıda sesten metne dönüştürme desteklenmiyor — cevabını yazarak gir.",
    placeholder: "Söylediğin cevap burada metin olarak görünür — göndermeden önce gözden geçirip düzenle.",
  },
  listening: {
    loading: "Yükleniyor…",
    pause: "Duraklat",
    noPlaysLeft: "Hak kalmadı",
    play: "▶ Oynat",
    playedTimes: (count, max) =>
      `${count}/${max} kez dinlendi — gerçek sınavda bu Teil ${max === 1 ? "bir kez" : "iki kez"} çalınır.`,
    playbackUnavailable:
      "Oynatma şu anda kullanılamıyor. Metni aşağıdan okuyabilir ya da harici bir TTS aracıyla kullanmak üzere indirebilirsin.",
  },
  scoreTrendChart: {
    noAttempts: "Henüz değerlendirilmiş bir deneme yok — eğilimini görmek için bir deneme sınavı çöz.",
    passThreshold: "%60 geçme eşiği",
    caption: "Her çizgi, o beceri için en son denemelerini eskiden yeniye gösterir.",
  },
};

const de: Dictionary = {
  common: {
    logOut: "Abmelden",
    save: "Speichern",
    cancel: "Abbrechen",
    edit: "Bearbeiten",
    continueLabel: "Weiter",
    somethingWrong: "Etwas ist schiefgelaufen",
  },
  languageSwitcher: {
    label: "Sprache",
    names: { en: "English", tr: "Türkçe", de: "Deutsch" },
  },
  nav: {
    mockExam: "Übungstest",
    flashcards: "Karteikarten",
    learnFromMistakes: "Aus Fehlern lernen",
    statistics: "Statistik",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
  },
  home: {
    welcome: (name) => `Willkommen, ${name}`,
    tagline:
      "Bereite dich mit KI-generierten Übungstests und sofortigem Feedback auf die telc B1 Prüfung vor.",
    streak: (n) => `🔥 ${n} Tag${n === 1 ? "" : "e"} in Folge`,
    sections: {
      examTitle: "Übungstest",
      examDesc: "Erstelle einen neuen telc B1 Übungstest und lege ihn ab",
      flashTitle: "Karteikarten",
      flashDesc: "Wiederhole Vokabeln, priorisiert nach dem, was du am meisten brauchst",
      mistakesTitle: "Aus Fehlern lernen",
      mistakesDesc: "Gruppierte Erklärungen mit neuen Beispielen",
      statsTitle: "Statistik",
      statsDesc: "Punktzahlen, Serien und Wortschatzwachstum über die Zeit",
    },
  },
  login: {
    prompt:
      "Gib deinen Namen ein, um fortzufahren. Kein Passwort — dies ist ein einfacher Login für eine kleine Testgruppe.",
    continueAs: "Weiter als:",
    orNewName: "Oder neuen Namen verwenden",
    yourName: "Dein Name",
    namePlaceholder: "z. B. Ayşe",
    continueBtn: "Weiter",
    loginFailed: (status) => `Anmeldung fehlgeschlagen (Server antwortete mit ${status})`,
    noConfirmation: "Der Server hat den Login nicht bestätigt — bitte versuche es erneut.",
  },
  modeLabels: {
    full: "Kompletter Übungstest",
    reading: "Lesen",
    listening: "Hören",
    writing: "Schreiben",
    grammar: "Grammatik",
    speaking: "Sprechen",
  },
  examsPage: {
    title: "Übungstest",
    subtitle: "Wähle eine Prüfungsart, erstelle sie und lege sie ab, wann immer du bereit bist.",
    todaysRecommendation: "Heutige Empfehlung: ",
    modeOptions: {
      full: {
        title: "Kompletter Übungstest",
        desc: "Vollständige telc B1 Prüfung — Lesen, Sprachbausteine, Hören, Schreiben",
      },
      reading: { title: "Lesen", desc: "Leseverstehen Teil 1–3" },
      listening: {
        title: "Hören",
        desc: "Hörverstehen Teil 1–3, im Browser vorgelesen",
      },
      writing: { title: "Schreiben", desc: "Schriftlicher Ausdruck — Antwort-E-Mail" },
      grammar: { title: "Grammatik", desc: "Sprachbausteine Teil 1–2" },
      speaking: {
        title: "Sprechen",
        desc: "Mündlicher Ausdruck, für Einzelübung angepasst — sprich oder tippe deine Antwort",
      },
    },
    yourExams: "Deine Prüfungen",
    noExamsYet: "Noch keine Prüfungen. Erstelle oben eine, um loszulegen.",
    partsCount: (n) => `${n} Teil${n === 1 ? "" : "e"}`,
    scored: (pct) => `${Math.round(pct)}% erreicht`,
    inProgress: "in Bearbeitung",
    notStarted: "nicht begonnen",
    viewResults: "Ergebnisse ansehen",
    open: "Öffnen",
  },
  examCountdown: {
    updateDate: "Prüfungstermin aktualisieren",
    whenIsExam: "Wann ist deine telc B1 Prüfung?",
    registerHint:
      "Noch nicht angemeldet? Buche deine Prüfung bald, damit du ein echtes Ziel zum Trainieren hast.",
    save: "Speichern",
    cancel: "Abbrechen",
    daysUntil: (n, dateStr) => `Noch ${n} Tag${n === 1 ? "" : "e"} bis zu deiner telc B1 Prüfung (${dateStr})`,
    examToday: "Deine Prüfung ist heute — viel Erfolg!",
    examPassed: (dateStr) => `Der Prüfungstermin (${dateStr}) ist vorbei.`,
    editBtn: "Bearbeiten",
  },
  examModeSelector: {
    recommendedToday: "Heute empfohlen",
    generateBtn: "Übungstest erstellen",
    generating: "Wird erstellt…",
    startingLabel: "Wird gestartet…",
    savingLabel: "Prüfung wird gespeichert…",
    progressLabel: (done, total, label) => `${done}/${total} fertig — gerade erstellt: ${label}`,
    startingHint: "Wird gestartet… das kann ein paar Minuten dauern",
    connectionLostError:
      "Die Verbindung ist während der Erstellung abgebrochen (z. B. weil der Bildschirm gesperrt wurde oder du die App gewechselt hast). Es wurde nichts gespeichert — versuche es erneut und halte diesen Tab geöffnet, bis es fertig ist.",
    genericError: "Prüfung konnte nicht erstellt werden",
    noResponseBody: "Keine Antwort vom Server erhalten",
    generationEndedError: "Die Erstellung wurde beendet, ohne eine Prüfung zu erzeugen",
  },
  examTaker: {
    timeRemaining: (clock) => `Verbleibende Zeit: ${clock}`,
    browserSpeechWarning:
      "Die eingebaute Wiedergabe nutzt die Sprachsynthese deines Browsers, was roboterhaft klingen kann. Lade die Texte herunter, um mit einem externen Text-zu-Sprache-Tool bessere Audiodateien zu erzeugen.",
    downloadAllScripts: "Alle Texte herunterladen (.txt)",
    showScript: "Text anzeigen (erst nach dem Hören, zur Wiederholung)",
    downloadScript: "Text herunterladen (.txt)",
    wordBank: "Wortliste",
    submitExam: "Prüfung abgeben",
    submitting: "Wird abgegeben…",
    failedToStart: "Prüfungsversuch konnte nicht gestartet werden",
    partTips: {
      listening:
        "Tipp: Die ersten Aufgaben in jedem Hörverstehen-Teil zählen genauso viele Punkte wie die restlichen — sei bereit, bevor du auf Abspielen drückst, damit dir keine leichte Aufgabe entgeht.",
      speaking:
        "Tipp: In der echten Paarprüfung kann der Prüfer das Gespräch beenden, sobald er sich über dein Niveau sicher ist — das ist normal und kein Zeichen dafür, dass es schlecht gelaufen ist.",
      writing:
        "Struktur-Tipp: Einleitung (1-2 Sätze, warum du schreibst) → alle 4 Leitpunkte, jeweils mit einem Konnektor (Zuerst, Außerdem, Des Weiteren, Schließlich) → Schluss (z. B. „Ich freue mich auf Ihre/deine Antwort“). Dieses Gerüst funktioniert für fast jede telc B1 Schreibaufgabe.",
    },
  },
  resultsPage: {
    resultsSuffix: "Ergebnisse",
    score: (pct) => `Punktzahl: ${pct !== null ? `${Math.round(pct)}%` : "Noch nicht bewertet"}`,
    passLikelihood: (pct, passing) =>
      `Geschätzte Bestehenswahrscheinlichkeit: ${pct}% (die 60%-Schriftlich-Schwelle wird ${passing ? "aktuell erreicht" : "noch nicht erreicht"})`,
    passBasisWritten: (basis) =>
      `Basierend auf ${basis}. Dies ist nur eine grobe Schätzung anhand deiner schriftlichen Ergebnisse — die telc-Prüfung verlangt zusätzlich ≥60% im separat bewerteten mündlichen Ausdruck, den diese App nicht bewertet.`,
    yourAnswer: "Deine Antwort: ",
    noAnswer: "Keine Antwort",
    correct: "Richtig",
    incorrect: "Falsch",
    expected: (text) => ` — erwartet: ${text}`,
    pointsOf: (a, b) => `${a.toFixed(1)} / ${b.toFixed(1)} Punkte`,
    reviewMistakes: "Alle bisherigen Fehler ansehen",
  },
  mistakesPage: {
    title: "Aus Fehlern lernen",
    subtitle:
      "Nach Thema gruppiert, häufigste zuerst. Jede Erklärung enthält neue Beispiele — lies sie, überflieg die Regel nicht nur.",
    noMistakes: "Noch keine Fehler erfasst — lege eine Prüfung ab, um loszulegen.",
    times: (n) => `${n} Mal`,
    yourAnswer: "Deine Antwort: ",
    noAnswer: "Keine Antwort",
    correctSuffix: (text) => ` — richtig: ${text}`,
    vocabMistakesTitle: "Wortschatzfehler",
    vocabMistakesSubtitle: "(aus deinen Schreibantworten)",
  },
  vocabPage: {
    title: "Wortschatz",
    wordCount: (n) => `${n} Wort${n === 1 ? "" : "wörter"}.`,
    searchPlaceholder: "Wort suchen…",
    searchBtn: "Suchen",
    all: "Alle",
    noVocab: "Noch kein Wortschatz geladen.",
    colWord: "Wort",
    colType: "Typ",
    colTurkish: "Türkçe",
    colExamples: "Beispiele",
  },
  progressPage: {
    title: "Statistik",
    passLikelihood: (pct, writtenPct, passing) =>
      `Geschätzte Bestehenswahrscheinlichkeit: ${pct}% — ${writtenPct.toFixed(0)}% im schriftlichen Teil (${passing ? "≥60%, aktuell bestanden" : "unter der 60%-Schwelle"})`,
    passBasis: (basis) =>
      `Basierend auf ${basis}. Nur schriftliche Fertigkeiten — Sprechen wird von dieser App nicht bewertet, sondern separat geprüft.`,
    timeOnSite: "Zeit auf der Seite",
    examsCompleted: "Abgeschlossene Prüfungen",
    wordsKnown: "Bekannte Wörter",
    scoreTrend: "Punkteverlauf",
    examHistory: "Prüfungsverlauf",
    noCompletedExams: "Noch keine abgeschlossenen Prüfungen.",
    notGraded: "Noch nicht bewertet",
    pending: "ausstehend",
    examsByType: "Prüfungen nach Art",
    vocabulary: "Wortschatz",
    known: "Bekannt",
    learning: "Wird gelernt",
    totalTracked: "Insgesamt erfasst",
  },
  flashcards: {
    title: "Karteikarten",
    subtitle:
      "Priorisiert nach Wörtern, die du falsch verwendet hast, die zur Wiederholung fällig sind, und die du selbst hinzugefügt hast.",
    browseFullList: "Gesamte Wortschatzliste durchsuchen →",
    addWordBtn: "+ Wort hinzufügen",
    closeBtn: "Schließen",
    wordPlaceholder: "Ein deutsches Wort eingeben…",
    addBtn: "Hinzufügen",
    adding: "Wird hinzugefügt…",
    failedToAdd: "Wort konnte nicht hinzugefügt werden",
    loading: "Wird geladen…",
    noWordsYet: "Noch keine Wörter in deiner Sammlung. Lege eine Schreibprüfung ab oder füge oben ein Wort hinzu.",
    sessionComplete: "Sitzung abgeschlossen — gut gemacht!",
    startAnother: "Neue Sitzung starten",
    cardXofY: (i, total) => `Karte ${i} von ${total}`,
    noMeaningSaved: "Noch keine Bedeutung gespeichert",
    turkishLabel: "Türkçe:",
    unknownValue: "unbekannt",
    pluralLabel: "Plural:",
    partizipLabel: "Partizip II:",
    praeteritumLabel: "Präteritum:",
    clickToReveal: "Zum Aufdecken klicken",
    didntKnow: "Nochmal (wusste ich nicht)",
    knewIt: "Kannte ich",
  },
  speaking: {
    stopRecording: "⏹ Aufnahme stoppen",
    recordAnswer: "🎤 Antwort aufnehmen (Deutsch)",
    notSupported: "Sprache-zu-Text wird in diesem Browser nicht unterstützt — tippe deine Antwort stattdessen.",
    placeholder: "Deine gesprochene Antwort erscheint hier als Text — überprüfe und bearbeite sie vor dem Absenden.",
  },
  listening: {
    loading: "Wird geladen…",
    pause: "Pause",
    noPlaysLeft: "Keine Wiedergaben mehr",
    play: "▶ Abspielen",
    playedTimes: (count, max) =>
      `${count}/${max} Mal abgespielt — in der echten Prüfung wird dieser Teil ${max === 1 ? "einmal" : "zweimal"} abgespielt.`,
    playbackUnavailable:
      "Wiedergabe ist gerade nicht verfügbar. Du kannst den Text unten trotzdem lesen oder ihn für ein externes TTS-Tool herunterladen.",
  },
  scoreTrendChart: {
    noAttempts: "Noch keine bewerteten Versuche — lege einen Übungstest ab, um deinen Verlauf zu starten.",
    passThreshold: "60% Bestehensgrenze",
    caption: "Jede Linie zeigt deine letzten Versuche für diese Fertigkeit, vom ältesten zum neuesten.",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, tr, de };
