import type { NumericKey } from "./params";

export type Language = "hu" | "sk" | "de" | "en";

/** Order of the language switch. */
export const LANGUAGES: Language[] = ["hu", "sk", "de", "en"];

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as string[]).includes(value);
}

/**
 * Picks the first supported language from the browser's preferred languages
 * (e.g. ["de-AT", "en"] → "de"); English when none is supported.
 */
export function detectLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const primary = tag.toLowerCase().split("-")[0];
    if (isLanguage(primary)) return primary;
  }
  return "en";
}

type Winner = "A" | "B";

export interface Strings {
  /** Locale used for all number and date formatting. */
  locale: string;
  /** Thousands separator and decimal mark used when typing numbers. */
  separators: { group: string; decimal: string };
  /** The language's name in that language, for the switch. */
  languageName: string;
  title: string;
  pathA: string;
  pathB: string;
  ledeA: string;
  ledeB: string;
  ledeBoth: string;
  params: Record<NumericKey, string>;
  yearsUnit: string;
  prepayHint: (amount: string) => string;
  errors: { notNumber: string; min: (limit: string) => string; max: (limit: string) => string };
  cards: {
    netA: string;
    netB: string;
    /** Title of the card with the final net wealth difference B − A. */
    difference: string;
    mortgageFree: string;
    worstCase: (rate: string) => string;
    bestCase: (rate: string) => string;
    /** Break-even return outside the searched range (used in descriptions of the break-even return). */
    below: (rate: string) => string;
    above: (rate: string) => string;
  };
  payoffDate: (year: number, month: number) => string;
  notWithinHorizon: string;
  /** Shown instead of a payoff date when the loan amount is 0. */
  noMortgage: string;
  /** A length of time, e.g. "14 years 6 months" (months ≥ 1 in total). */
  duration: (years: number, months: number) => string;
  verdict: {
    identical: string;
    bothTie: string;
    both: (winner: Winner, worstAmount: string, worstRate: string, bestAmount: string, bestRate: string) => string;
    depends: (worstPart: string, bestPart: string) => string;
    part: (rate: string, winner: Winner | "tie", amount: string) => string;
    breakEvenAt: (rate: string) => string;
    investAlways: (min: string, max: string) => string;
    prepayAlways: (min: string, max: string) => string;
  };
  chart: {
    aWorst: string;
    aBest: string;
    bWorst: string;
    bBest: string;
    loanB: string;
    axis: string;
    start: string;
    marker: (date: string) => string;
  };
  table: { title: string; worst: string; best: string; headers: string[] };
  warning: string;
  disclaimer: string;
  privacy: string;
  credits: { createdBy: (name: string) => string; version: (date: string) => string; license: string };
  labels: { language: string; currency: string; tableCase: string };
  /** Explanations behind the "?" buttons (educational texts). */
  help: {
    /** Accessible name of a "?" button, e.g. "Explain: Loan amount". */
    button: (subject: string) => string;
    /** Names of the summary and the chart, used in the accessible names of their "?" buttons. */
    subjects: { verdict: string; chart: string };
    params: Record<NumericKey, string>;
    netA: string;
    netB: string;
    difference: string;
    mortgageFree: string;
    verdict: string;
    chart: string;
    table: string;
    currency: string;
  };
}

const en: Strings = {
  locale: "en-GB",
  separators: { group: ",", decimal: "." },
  languageName: "English",
  title: "Mortgage vs. Investment",
  pathA: "Path A",
  pathB: "Path B",
  ledeA: "invest all extra savings.",
  ledeB: "prepay the mortgage with part of it.",
  ledeBoth: "Both invest the freed-up installment once their mortgage is paid off.",
  params: {
    property: "Property value",
    appr: "Property growth / year",
    loan: "Loan amount",
    installment: "Monthly installment",
    extra: "Monthly extra savings",
    prepayPct: "…of which prepayment (B)",
    inf: "Savings growth / inflation",
    invWorst: "Return – worst case",
    invBest: "Return – best case",
    mort: "Mortgage interest rate",
    penalty: "Prepayment penalty",
    years: "Time horizon",
  },
  yearsUnit: "years",
  prepayHint: (a) => `= ${a} a month in year 1`,
  errors: { notNumber: "Enter a number", min: (l) => `Minimum is ${l}`, max: (l) => `Maximum is ${l}` },
  cards: {
    netA: "Path A final net wealth",
    netB: "Path B final net wealth",
    difference: "Difference B − A",
    mortgageFree: "Mortgage-free",
    worstCase: (r) => `Worst case (${r})`,
    bestCase: (r) => `Best case (${r})`,
    below: (r) => `Below ${r}`,
    above: (r) => `Above ${r}`,
  },
  payoffDate: (y, m) => `Year ${y}, month ${m}`,
  notWithinHorizon: "Not within horizon",
  noMortgage: "No mortgage",
  duration: (y, m) =>
    [y > 0 ? `${y} ${y === 1 ? "year" : "years"}` : "", m > 0 ? `${m} ${m === 1 ? "month" : "months"}` : ""]
      .filter(Boolean)
      .join(" "),
  verdict: {
    identical: "Nothing is prepaid within the time horizon, so both strategies give the same result.",
    bothTie: "Both strategies give the same result in both cases.",
    both: (w, aw, rw, ab, rb) =>
      `${w === "A" ? "Investing" : "Prepaying"} wins in both cases: by ${aw} at ${rw} a year and by ${ab} at ${rb} a year.`,
    depends: (pw, pb) => `It depends on your returns: ${pw}, ${pb}.`,
    part: (r, w, a) =>
      w === "tie"
        ? `at ${r} a year both give the same result`
        : `at ${r} a year ${w === "A" ? "investing" : "prepaying"} wins by ${a}`,
    breakEvenAt: (r) => `Investing comes out ahead only if your investments earn more than ${r} a year.`,
    investAlways: (min, max) => `Investing comes out ahead at any return from ${min} to ${max} a year.`,
    prepayAlways: (min, max) => `Prepaying comes out ahead at any return from ${min} to ${max} a year.`,
  },
  chart: {
    aWorst: "Path A – worst case",
    aBest: "Path A – best case",
    bWorst: "Path B – worst case",
    bBest: "Path B – best case",
    loanB: "Path B remaining loan",
    axis: "Years elapsed",
    start: "Start",
    marker: (d) => `B mortgage-free: ${d}`,
  },
  table: {
    title: "Year by year",
    worst: "Worst case",
    best: "Best case",
    headers: [
      "Year",
      "Extra savings / month",
      "Property value",
      "Net wealth A",
      "Net wealth B",
      "B − A",
      "Loan A",
      "Loan B",
      "Invested B (year)",
      "Investments A",
      "Investments B",
    ],
  },
  warning:
    "The monthly installment doesn't cover the first month's interest, so the loan never shrinks. Raise the installment or lower the loan amount or interest rate.",
  disclaimer:
    "This calculator is for illustration and education only. It is not financial, investment, tax or legal advice. " +
    "Results depend entirely on the assumptions you enter; real returns, interest rates, fees and taxes will differ. " +
    "Consult a qualified adviser before making financial decisions.",
  privacy: "Your inputs are saved only in this browser so they are still here next time. Nothing is sent to a server.",
  credits: { createdBy: (n) => `Created by ${n}`, version: (d) => `Version of ${d}`, license: "MIT License" },
  labels: { language: "Language", currency: "Currency", tableCase: "Scenario shown in the table" },
  help: {
    button: (s) => `Explain: ${s}`,
    subjects: { verdict: "Summary", chart: "Chart" },
    params: {
      property:
        "Today's market value of the home. It counts towards your net wealth in both paths, so it never decides which path wins.",
      appr: "How much the home's value is expected to rise per year. It is the same in both paths, so it only changes the size of your net wealth, not the winner.",
      loan: "The mortgage amount still owed today. Set it to 0 to see what happens without a mortgage.",
      installment:
        "The fixed monthly payment to the bank (interest + repayment). It stays the same until the loan is paid off; after that, both paths invest this amount every month.",
      extra:
        "Money you can set aside each month on top of the installment. Path A invests all of it; Path B uses part of it to prepay the mortgage.",
      prepayPct:
        "The share of your extra savings that Path B pays to the bank as early repayment. The rest is invested. 0% makes both paths the same.",
      inf: "How much your monthly extra savings grow each year, for example with pay rises or inflation. The prepayment grows with them.",
      invWorst:
        "A cautious estimate of the yearly return on your investments, after costs. Real returns vary from year to year; this case shows what happens if markets disappoint.",
      invBest:
        "An optimistic estimate of the yearly return on your investments. Comparing both cases shows how much the result depends on the markets.",
      mort: "The yearly interest rate of your mortgage. Every amount prepaid saves this interest, so prepaying works like a guaranteed return of the same size.",
      penalty:
        "A fee the bank charges on prepaid amounts, as a percentage. It makes prepaying more expensive and lowers the return at which investing wins.",
      years: "How many years the comparison covers. Net wealth is compared at the end of this period.",
    },
    netA: "What Path A is worth at the end of the period: home value + investments − remaining loan, for the worst and the best investment return.",
    netB: "The same for Path B, which prepays the mortgage with part of the savings and invests everything once the mortgage is paid off.",
    difference:
      "Path B minus Path A at the end. A positive amount (green) means prepaying came out ahead, a negative amount (blue) means investing did.",
    mortgageFree:
      "How long each path takes to repay the mortgage, and the month in which that happens if the loan starts this month.",
    verdict:
      "A plain-language summary. The break-even return is the yearly investment return at which both paths end equal: above it investing wins, below it prepaying wins.",
    chart:
      "Net wealth of both paths over time. Each shaded band runs from the worst to the best case. The red dashed line is Path B's remaining loan; the grey dashed line marks when it is paid off.",
    table:
      "End-of-year figures for the case selected above the table. The grey row is the year Path B becomes mortgage-free. Point at a value in the result cards to highlight a path here.",
    currency:
      "Changes only the currency symbol and the rounding (forint to whole units, euro and dollar to cents). Amounts are not converted.",
  },
};

const hu: Strings = {
  locale: "hu-HU",
  separators: { group: " ", decimal: "," },
  languageName: "Magyar",
  title: "Jelzáloghitel vagy befektetés",
  pathA: "A változat",
  pathB: "B változat",
  ledeA: "a teljes többletmegtakarítást befekteti.",
  ledeB: "a megtakarítás egy részével előtörleszti a hitelt.",
  ledeBoth: "Mindkettő befekteti a felszabaduló törlesztőrészletet is, amint a hitelt visszafizette.",
  params: {
    property: "Ingatlan értéke",
    appr: "Ingatlan drágulása / év",
    loan: "Hitelösszeg",
    installment: "Havi törlesztőrészlet",
    extra: "Havi többletmegtakarítás",
    prepayPct: "…ebből előtörlesztés (B)",
    inf: "Megtakarítás növekedése",
    invWorst: "Hozam – legrosszabb eset",
    invBest: "Hozam – legjobb eset",
    mort: "Hitel kamata",
    penalty: "Előtörlesztési díj",
    years: "Időtáv",
  },
  yearsUnit: "év",
  prepayHint: (a) => `= havi ${a} az 1. évben`,
  errors: { notNumber: "Adjon meg egy számot", min: (l) => `A minimum ${l}`, max: (l) => `A maximum ${l}` },
  cards: {
    netA: "A változat végső nettó vagyona",
    netB: "B változat végső nettó vagyona",
    difference: "Különbség (B − A)",
    mortgageFree: "Hitelmentes",
    worstCase: (r) => `Legrosszabb eset (${r})`,
    bestCase: (r) => `Legjobb eset (${r})`,
    below: (r) => `${r} alatt`,
    above: (r) => `${r} felett`,
  },
  payoffDate: (y, m) => `${y}. év, ${m}. hónap`,
  notWithinHorizon: "Az időtávon belül nem",
  noMortgage: "Nincs hitel",
  duration: (y, m) => [y > 0 ? `${y} év` : "", m > 0 ? `${m} hónap` : ""].filter(Boolean).join(" "),
  verdict: {
    identical: "Az időtávon belül nincs előtörlesztés, így a két stratégia eredménye azonos.",
    bothTie: "A két stratégia mindkét esetben azonos eredményt ad.",
    both: (w, aw, rw, ab, rb) =>
      `Mindkét esetben ${w === "A" ? "a befektetés" : "az előtörlesztés"} nyer: évi ${rw} hozamnál ${aw}, évi ${rb} hozamnál ${ab} különbséggel.`,
    depends: (pw, pb) => `Ez a hozamtól függ: ${pw}, ${pb}.`,
    part: (r, w, a) =>
      w === "tie"
        ? `évi ${r} hozamnál a két eredmény azonos`
        : `évi ${r} hozamnál ${w === "A" ? "a befektetés" : "az előtörlesztés"} nyer ${a} különbséggel`,
    breakEvenAt: (r) => `A befektetéssel, csak akkor jár jobban, ha évente több mint ${r} hozamot ér el.`,
    investAlways: (min, max) => `A befektetés évi ${min} és ${max} közötti bármely hozamnál jobban jár.`,
    prepayAlways: (min, max) => `Az előtörlesztés évi ${min} és ${max} közötti bármely hozamnál jobban jár.`,
  },
  chart: {
    aWorst: "A változat – legrosszabb eset",
    aBest: "A változat – legjobb eset",
    bWorst: "B változat – legrosszabb eset",
    bBest: "B változat – legjobb eset",
    loanB: "B változat hátralévő hitele",
    axis: "Eltelt évek",
    start: "Kezdet",
    marker: (d) => `B hitelmentes: ${d}`,
  },
  table: {
    title: "Évenkénti bontás",
    worst: "Legrosszabb eset",
    best: "Legjobb eset",
    headers: [
      "Év",
      "Többletmegtakarítás / hó",
      "Ingatlan értéke",
      "Nettó vagyon A",
      "Nettó vagyon B",
      "B − A",
      "Hitel A",
      "Hitel B",
      "Befektetve B (év)",
      "Befektetések A",
      "Befektetések B",
    ],
  },
  warning:
    "A havi törlesztőrészlet nem fedezi az első havi kamatot, így a hitel sosem csökken. Emelje a törlesztőrészletet, vagy csökkentse a hitelösszeget vagy a kamatot.",
  disclaimer:
    "Ez a kalkulátor kizárólag szemléltető és tájékoztató célú. Nem minősül pénzügyi, befektetési, adó- vagy jogi tanácsadásnak. " +
    "Az eredmények teljes mértékben a megadott feltételezéseken alapulnak; a valós hozamok, kamatok, díjak és adók eltérnek majd. " +
    "Pénzügyi döntés előtt kérje szakember tanácsát.",
  privacy:
    "A megadott értékeket csak ez a böngésző tárolja, hogy legközelebb is meglegyenek. Semmilyen adatot nem küldünk szerverre.",
  credits: { createdBy: (n) => `Készítette: ${n}`, version: (d) => `Verzió: ${d}`, license: "MIT licenc" },
  labels: { language: "Nyelv", currency: "Pénznem", tableCase: "A táblázatban mutatott eset" },
  help: {
    button: (s) => `Magyarázat: ${s}`,
    subjects: { verdict: "Összefoglaló", chart: "Grafikon" },
    params: {
      property:
        "Az ingatlan mai piaci értéke. Mindkét változatban beleszámít a nettó vagyonba, ezért sosem dönti el, melyik nyer.",
      appr: "Mennyivel nő várhatóan évente az ingatlan értéke. Mindkét változatban ugyanannyi, így csak a vagyon nagyságát változtatja, a győztest nem.",
      loan: "A ma még fennálló hiteltartozás. Ha 0-ra állítja, látja, mi történik hitel nélkül.",
      installment:
        "A bankba fizetett fix havi összeg (kamat + tőketörlesztés). A hitel visszafizetéséig változatlan; utána mindkét változat ezt az összeget is befekteti havonta.",
      extra:
        "A törlesztőrészleten felül havonta félretehető pénz. Az A változat az egészet befekteti, a B változat egy részével előtörleszt.",
      prepayPct:
        "A többletmegtakarítás azon része, amelyet a B változat előtörlesztésre fordít. A maradékot befekteti. 0% esetén a két változat azonos.",
      inf: "Mennyivel nő évente a havi többletmegtakarítás, például béremelés vagy infláció miatt. Az előtörlesztés is vele együtt nő.",
      invWorst:
        "Óvatos becslés a befektetések éves hozamára, költségek után. A valós hozam évről évre ingadozik; ez az eset azt mutatja, mi történik, ha a piac csalódást okoz.",
      invBest:
        "Optimista becslés a befektetések éves hozamára. A két eset összevetése megmutatja, mennyire függ az eredmény a piactól.",
      mort: "A jelzáloghitel éves kamata. Minden előtörlesztett összeg ennyi kamatot takarít meg, így az előtörlesztés olyan, mint egy ugyanekkora garantált hozam.",
      penalty:
        "Az előtörlesztett összeg után fizetendő banki díj, százalékban. Drágábbá teszi az előtörlesztést, és csökkenti azt a hozamot, amely felett a befektetés nyer.",
      years: "Hány évre szól az összehasonlítás. A nettó vagyonokat az időszak végén hasonlítjuk össze.",
    },
    netA: "Az A változat értéke az időszak végén: ingatlan + befektetések − fennmaradó hitel, a legrosszabb és a legjobb befektetési hozammal.",
    netB: "Ugyanez a B változatra, amely a megtakarítás egy részével előtörleszt, majd a hitel visszafizetése után mindent befektet.",
    difference:
      "A B változat mínusz az A változat az időszak végén. A pozitív összeg (zöld) azt jelenti, hogy az előtörlesztés járt jobban, a negatív (kék), hogy a befektetés.",
    mortgageFree:
      "Mennyi idő alatt fizeti vissza a hitelt a két változat, és ez melyik hónapra esik, ha a hitel ebben a hónapban indul.",
    verdict:
      "Közérthető összefoglaló. A küszöbhozam az az éves befektetési hozam, amelynél a két változat egyformán végez: felette a befektetés, alatta az előtörlesztés nyer.",
    chart:
      "A két változat nettó vagyona az idő függvényében. A sávok a legrosszabb és a legjobb eset között húzódnak. A piros szaggatott vonal a B változat hátralévő hitele, a szürke szaggatott vonal a visszafizetés időpontját jelzi.",
    table:
      "Év végi adatok a táblázat felett kiválasztott esetre. A szürke sor az az év, amikor a B változat hitelmentessé válik. Ha az eredménykártyákon egy értékre mutat, itt kiemeljük az adott változatot.",
    currency:
      "Csak a pénznem jelét és a kerekítést változtatja (forintnál egész összegre, eurónál és dollárnál centre). Az összegeket nem váltja át.",
  },
};

const sk: Strings = {
  locale: "sk-SK",
  separators: { group: " ", decimal: "," },
  languageName: "Slovenčina",
  title: "Hypotéka alebo investícia",
  pathA: "Variant A",
  pathB: "Variant B",
  ledeA: "investuje všetky dodatočné úspory.",
  ledeB: "časťou úspor predčasne spláca hypotéku.",
  ledeBoth: "Po splatení hypotéky obe investujú aj uvoľnenú splátku.",
  params: {
    property: "Hodnota nehnuteľnosti",
    appr: "Rast ceny nehnuteľnosti",
    loan: "Výška úveru",
    installment: "Mesačná splátka",
    extra: "Mesačné dodatočné úspory",
    prepayPct: "…z toho predčasná splátka (B)",
    inf: "Rast úspor / inflácia",
    invWorst: "Výnos – najhorší prípad",
    invBest: "Výnos – najlepší prípad",
    mort: "Úroková sadzba hypotéky",
    penalty: "Poplatok za predčasnú splátku",
    years: "Časový horizont",
  },
  yearsUnit: "rokov",
  prepayHint: (a) => `= ${a} mesačne v 1. roku`,
  errors: { notNumber: "Zadajte číslo", min: (l) => `Minimum je ${l}`, max: (l) => `Maximum je ${l}` },
  cards: {
    netA: "Konečný čistý majetok – variant A",
    netB: "Konečný čistý majetok – variant B",
    difference: "Rozdiel (B − A)",
    mortgageFree: "Bez dlhu",
    worstCase: (r) => `Najhorší prípad (${r})`,
    bestCase: (r) => `Najlepší prípad (${r})`,
    below: (r) => `Pod ${r}`,
    above: (r) => `Nad ${r}`,
  },
  payoffDate: (y, m) => `${y}. rok, ${m}. mesiac`,
  notWithinHorizon: "Nie v rámci horizontu",
  noMortgage: "Bez hypotéky",
  duration: (y, m) => {
    // 1 rok / 2–4 roky / 5+ rokov; 1 mesiac / 2–4 mesiace / 5+ mesiacov
    const form = (n: number, one: string, few: string, many: string) => `${n} ${n === 1 ? one : n <= 4 ? few : many}`;
    return [y > 0 ? form(y, "rok", "roky", "rokov") : "", m > 0 ? form(m, "mesiac", "mesiace", "mesiacov") : ""]
      .filter(Boolean)
      .join(" ");
  },
  verdict: {
    identical: "V rámci časového horizontu sa nič predčasne nespláca, preto obe stratégie dávajú rovnaký výsledok.",
    bothTie: "Obe stratégie dávajú v oboch prípadoch rovnaký výsledok.",
    both: (w, aw, rw, ab, rb) =>
      `V oboch prípadoch vyhráva ${w === "A" ? "investovanie" : "predčasné splácanie"}: o ${aw} pri výnose ${rw} ročne a o ${ab} pri výnose ${rb} ročne.`,
    depends: (pw, pb) => `Závisí to od výnosov: ${pw}, ${pb}.`,
    part: (r, w, a) =>
      w === "tie"
        ? `pri výnose ${r} ročne sú oba výsledky rovnaké`
        : `pri výnose ${r} ročne vyhráva ${w === "A" ? "investovanie" : "predčasné splácanie"} o ${a}`,
    breakEvenAt: (r) => `Investovanie vychádza lepšie, len ak vaše investície zarobia viac ako ${r} ročne.`,
    investAlways: (min, max) => `Investovanie vychádza lepšie pri akomkoľvek výnose od ${min} do ${max} ročne.`,
    prepayAlways: (min, max) => `Predčasné splácanie vychádza lepšie pri akomkoľvek výnose od ${min} do ${max} ročne.`,
  },
  chart: {
    aWorst: "Variant A – najhorší prípad",
    aBest: "Variant A – najlepší prípad",
    bWorst: "Variant B – najhorší prípad",
    bBest: "Variant B – najlepší prípad",
    loanB: "Zostávajúci úver – variant B",
    axis: "Uplynuté roky",
    start: "Začiatok",
    marker: (d) => `B bez hypotéky: ${d}`,
  },
  table: {
    title: "Po rokoch",
    worst: "Najhorší prípad",
    best: "Najlepší prípad",
    headers: [
      "Rok",
      "Dodatočné úspory / mesiac",
      "Hodnota nehnuteľnosti",
      "Čistý majetok A",
      "Čistý majetok B",
      "B − A",
      "Úver A",
      "Úver B",
      "Investované B (rok)",
      "Investície A",
      "Investície B",
    ],
  },
  warning:
    "Mesačná splátka nepokryje ani úrok za prvý mesiac, preto sa úver nikdy neznižuje. Zvýšte splátku alebo znížte výšku úveru či úrokovú sadzbu.",
  disclaimer:
    "Táto kalkulačka slúži len na ilustráciu a vzdelávanie. Nie je finančným, investičným, daňovým ani právnym poradenstvom. " +
    "Výsledky úplne závisia od zadaných predpokladov; skutočné výnosy, úrokové sadzby, poplatky a dane sa budú líšiť. " +
    "Pred finančným rozhodnutím sa poraďte s kvalifikovaným poradcom.",
  privacy: "Zadané hodnoty sa ukladajú len v tomto prehliadači, aby tu boli aj nabudúce. Nič sa neodosiela na server.",
  credits: { createdBy: (n) => `Autor: ${n}`, version: (d) => `Verzia z ${d}`, license: "Licencia MIT" },
  labels: { language: "Jazyk", currency: "Mena", tableCase: "Prípad zobrazený v tabuľke" },
  help: {
    button: (s) => `Vysvetlenie: ${s}`,
    subjects: { verdict: "Zhrnutie", chart: "Graf" },
    params: {
      property:
        "Dnešná trhová hodnota nehnuteľnosti. V oboch variantoch sa započítava do čistého majetku, preto nikdy nerozhoduje o víťazovi.",
      appr: "O koľko má hodnota nehnuteľnosti ročne rásť. V oboch variantoch je rovnaká, mení teda len výšku majetku, nie víťaza.",
      loan: "Výška úveru, ktorú dnes ešte dlhujete. Pri hodnote 0 uvidíte, čo sa stane bez hypotéky.",
      installment:
        "Pevná mesačná platba banke (úrok + splátka istiny). Platí do splatenia úveru; potom obe varianty investujú každý mesiac aj túto sumu.",
      extra:
        "Peniaze, ktoré si môžete mesačne odložiť navyše k splátke. Variant A ich celé investuje, variant B časťou z nich predčasne spláca hypotéku.",
      prepayPct:
        "Podiel dodatočných úspor, ktorý variant B použije na predčasnú splátku. Zvyšok investuje. Pri 0 % sú obe varianty rovnaké.",
      inf: "O koľko ročne rastú vaše mesačné dodatočné úspory, napríklad vďaka rastu mzdy alebo inflácii. Predčasná splátka rastie spolu s nimi.",
      invWorst:
        "Opatrný odhad ročného výnosu investícií po nákladoch. Skutočné výnosy kolíšu z roka na rok; tento prípad ukazuje, čo sa stane, ak trhy sklamú.",
      invBest:
        "Optimistický odhad ročného výnosu investícií. Porovnanie oboch prípadov ukazuje, ako veľmi výsledok závisí od trhov.",
      mort: "Ročná úroková sadzba hypotéky. Každá predčasne splatená suma ušetrí tento úrok, takže predčasné splácanie funguje ako garantovaný výnos v rovnakej výške.",
      penalty:
        "Poplatok banky z predčasne splatenej sumy, v percentách. Predčasné splácanie zdražuje a znižuje výnos, nad ktorým vyhráva investovanie.",
      years: "Koľko rokov porovnanie pokrýva. Čistý majetok sa porovnáva na konci tohto obdobia.",
    },
    netA: "Hodnota variantu A na konci obdobia: nehnuteľnosť + investície − zostávajúci úver, pre najhorší aj najlepší výnos investícií.",
    netB: "To isté pre variant B, ktorý časťou úspor predčasne spláca hypotéku a po jej splatení investuje všetko.",
    difference:
      "Variant B mínus variant A na konci obdobia. Kladná suma (zelená) znamená, že lepšie vyšlo predčasné splácanie, záporná (modrá), že investovanie.",
    mortgageFree: "Za aký čas každý variant splatí hypotéku a v ktorom mesiaci to bude, ak úver začína tento mesiac.",
    verdict:
      "Zrozumiteľné zhrnutie. Hraničný výnos je ročný výnos investícií, pri ktorom oba varianty skončia rovnako: nad ním vyhráva investovanie, pod ním predčasné splácanie.",
    chart:
      "Čistý majetok oboch variantov v čase. Pásma siahajú od najhoršieho po najlepší prípad. Červená prerušovaná čiara je zostávajúci úver variantu B, sivá prerušovaná čiara označuje jeho splatenie.",
    table:
      "Údaje ku koncu roka pre prípad zvolený nad tabuľkou. Sivý riadok je rok, keď je variant B bez hypotéky. Ak na kartách výsledkov ukážete na hodnotu, variant sa tu zvýrazní.",
    currency:
      "Mení len symbol meny a zaokrúhľovanie (forint na celé jednotky, euro a dolár na centy). Sumy sa neprepočítavajú.",
  },
};

const de: Strings = {
  locale: "de-DE",
  separators: { group: ".", decimal: "," },
  languageName: "Deutsch",
  title: "Hypothek oder Investition",
  pathA: "Variante A",
  pathB: "Variante B",
  ledeA: "investiert alle zusätzlichen Ersparnisse.",
  ledeB: "tilgt mit einem Teil davon die Hypothek vorzeitig.",
  ledeBoth: "Beide investieren die frei werdende Rate, sobald die Hypothek abbezahlt ist.",
  params: {
    property: "Immobilienwert",
    appr: "Wertsteigerung / Jahr",
    loan: "Darlehensbetrag",
    installment: "Monatliche Rate",
    extra: "Monatl. Zusatzersparnis",
    prepayPct: "…davon Sondertilgung (B)",
    inf: "Sparzuwachs / Inflation",
    invWorst: "Rendite – ungünstig",
    invBest: "Rendite – günstig",
    mort: "Hypothekenzins",
    penalty: "Sondertilgungsgebühr",
    years: "Zeithorizont",
  },
  yearsUnit: "Jahre",
  prepayHint: (a) => `= ${a} monatlich im 1. Jahr`,
  errors: { notNumber: "Bitte eine Zahl eingeben", min: (l) => `Minimum ist ${l}`, max: (l) => `Maximum ist ${l}` },
  cards: {
    netA: "Endvermögen Variante A",
    netB: "Endvermögen Variante B",
    difference: "Differenz (B − A)",
    mortgageFree: "Schuldenfrei",
    worstCase: (r) => `Ungünstiger Fall (${r})`,
    bestCase: (r) => `Günstiger Fall (${r})`,
    below: (r) => `Unter ${r}`,
    above: (r) => `Über ${r}`,
  },
  payoffDate: (y, m) => `Jahr ${y}, Monat ${m}`,
  notWithinHorizon: "Nicht im Zeitraum",
  noMortgage: "Keine Hypothek",
  duration: (y, m) =>
    [y > 0 ? `${y} ${y === 1 ? "Jahr" : "Jahre"}` : "", m > 0 ? `${m} ${m === 1 ? "Monat" : "Monate"}` : ""]
      .filter(Boolean)
      .join(" "),
  verdict: {
    identical: "Im Zeitraum wird nichts vorzeitig getilgt, daher führen beide Strategien zum selben Ergebnis.",
    bothTie: "Beide Strategien führen in beiden Fällen zum selben Ergebnis.",
    both: (w, aw, rw, ab, rb) =>
      `In beiden Fällen gewinnt ${w === "A" ? "das Investieren" : "die Sondertilgung"}: um ${aw} bei ${rw} pro Jahr und um ${ab} bei ${rb} pro Jahr.`,
    depends: (pw, pb) => `Das hängt von Ihrer Rendite ab: ${pw}, ${pb}.`,
    part: (r, w, a) =>
      w === "tie"
        ? `bei ${r} pro Jahr ist das Ergebnis gleich`
        : `bei ${r} pro Jahr gewinnt ${w === "A" ? "das Investieren" : "die Sondertilgung"} um ${a}`,
    breakEvenAt: (r) => `Investieren lohnt sich nur, wenn Ihre Anlagen mehr als ${r} pro Jahr erzielen.`,
    investAlways: (min, max) => `Investieren schneidet bei jeder Rendite von ${min} bis ${max} pro Jahr besser ab.`,
    prepayAlways: (min, max) =>
      `Die Sondertilgung schneidet bei jeder Rendite von ${min} bis ${max} pro Jahr besser ab.`,
  },
  chart: {
    aWorst: "Variante A – ungünstig",
    aBest: "Variante A – günstig",
    bWorst: "Variante B – ungünstig",
    bBest: "Variante B – günstig",
    loanB: "Restschuld Variante B",
    axis: "Vergangene Jahre",
    start: "Start",
    marker: (d) => `B schuldenfrei: ${d}`,
  },
  table: {
    title: "Jahr für Jahr",
    worst: "Ungünstiger Fall",
    best: "Günstiger Fall",
    headers: [
      "Jahr",
      "Zusatzersparnis / Monat",
      "Immobilienwert",
      "Nettovermögen A",
      "Nettovermögen B",
      "B − A",
      "Darlehen A",
      "Darlehen B",
      "Investiert B (Jahr)",
      "Anlagen A",
      "Anlagen B",
    ],
  },
  warning:
    "Die monatliche Rate deckt nicht einmal die Zinsen des ersten Monats, daher sinkt das Darlehen nie. Erhöhen Sie die Rate oder senken Sie Darlehensbetrag oder Zinssatz.",
  disclaimer:
    "Dieser Rechner dient nur der Veranschaulichung und Information. Er ist keine Finanz-, Anlage-, Steuer- oder Rechtsberatung. " +
    "Die Ergebnisse hängen vollständig von Ihren Annahmen ab; tatsächliche Renditen, Zinsen, Gebühren und Steuern werden abweichen. " +
    "Lassen Sie sich vor finanziellen Entscheidungen fachkundig beraten.",
  privacy:
    "Ihre Eingaben werden nur in diesem Browser gespeichert, damit sie beim nächsten Mal noch da sind. Es wird nichts an einen Server gesendet.",
  credits: { createdBy: (n) => `Erstellt von ${n}`, version: (d) => `Version vom ${d}`, license: "MIT-Lizenz" },
  labels: { language: "Sprache", currency: "Währung", tableCase: "In der Tabelle gezeigter Fall" },
  help: {
    button: (s) => `Erklärung: ${s}`,
    subjects: { verdict: "Zusammenfassung", chart: "Diagramm" },
    params: {
      property:
        "Der heutige Marktwert der Immobilie. Er zählt in beiden Varianten zum Nettovermögen und entscheidet daher nie, welche gewinnt.",
      appr: "Wie stark der Wert der Immobilie voraussichtlich pro Jahr steigt. Er ist in beiden Varianten gleich und ändert nur die Höhe des Vermögens, nicht den Gewinner.",
      loan: "Der heute noch offene Darlehensbetrag. Mit 0 sehen Sie, was ohne Hypothek passiert.",
      installment:
        "Die feste monatliche Zahlung an die Bank (Zinsen + Tilgung). Sie bleibt bis zur vollständigen Rückzahlung gleich; danach investieren beide Varianten auch diesen Betrag jeden Monat.",
      extra:
        "Geld, das Sie monatlich zusätzlich zur Rate zurücklegen können. Variante A investiert alles, Variante B tilgt mit einem Teil davon vorzeitig.",
      prepayPct:
        "Der Anteil der Zusatzersparnis, den Variante B als Sondertilgung an die Bank zahlt. Der Rest wird investiert. Bei 0 % sind beide Varianten gleich.",
      inf: "Um wie viel Ihre monatliche Zusatzersparnis jährlich wächst, zum Beispiel durch Gehaltserhöhungen oder Inflation. Die Sondertilgung wächst mit.",
      invWorst:
        "Eine vorsichtige Schätzung der jährlichen Rendite Ihrer Anlagen nach Kosten. Echte Renditen schwanken von Jahr zu Jahr; dieser Fall zeigt, was passiert, wenn die Märkte enttäuschen.",
      invBest:
        "Eine optimistische Schätzung der jährlichen Rendite Ihrer Anlagen. Der Vergleich beider Fälle zeigt, wie stark das Ergebnis von den Märkten abhängt.",
      mort: "Der jährliche Zinssatz Ihrer Hypothek. Jeder vorzeitig getilgte Betrag spart diesen Zins – die Sondertilgung wirkt wie eine garantierte Rendite in gleicher Höhe.",
      penalty:
        "Eine Gebühr der Bank auf vorzeitig getilgte Beträge, in Prozent. Sie verteuert die Sondertilgung und senkt die Rendite, ab der Investieren gewinnt.",
      years: "Wie viele Jahre der Vergleich umfasst. Das Nettovermögen wird am Ende dieses Zeitraums verglichen.",
    },
    netA: "Was Variante A am Ende wert ist: Immobilie + Anlagen − Restschuld, für die ungünstige und die günstige Rendite.",
    netB: "Dasselbe für Variante B, die mit einem Teil der Ersparnis vorzeitig tilgt und nach der Rückzahlung alles investiert.",
    difference:
      "Variante B minus Variante A am Ende. Ein positiver Betrag (grün) bedeutet, dass die Sondertilgung vorn liegt, ein negativer (blau), dass das Investieren vorn liegt.",
    mortgageFree:
      "Wie lange jede Variante bis zur vollständigen Rückzahlung braucht und in welchem Monat das ist, wenn das Darlehen diesen Monat beginnt.",
    verdict:
      "Eine verständliche Zusammenfassung. Die Break-even-Rendite ist die jährliche Rendite, bei der beide Varianten gleich enden: darüber gewinnt das Investieren, darunter die Sondertilgung.",
    chart:
      "Das Nettovermögen beider Varianten im Zeitverlauf. Die Bänder reichen vom ungünstigen bis zum günstigen Fall. Die rote gestrichelte Linie ist die Restschuld von Variante B, die graue gestrichelte Linie markiert ihre Rückzahlung.",
    table:
      "Werte zum Jahresende für den über der Tabelle gewählten Fall. Die graue Zeile ist das Jahr, in dem Variante B schuldenfrei wird. Zeigen Sie auf einen Wert in den Ergebniskarten, um hier eine Variante hervorzuheben.",
    currency:
      "Ändert nur das Währungssymbol und die Rundung (Forint auf ganze Einheiten, Euro und Dollar auf Cent). Beträge werden nicht umgerechnet.",
  },
};

export const STRINGS: Record<Language, Strings> = { hu, sk, de, en };

/**
 * Parses a typed number the way the language writes it: German "45.000.000" and "6,5",
 * English "45,000,000" and "6.5", Hungarian/Slovak "45 000 000" and "6,5". Spaces are always
 * ignored, and the other decimal mark is accepted when it cannot be a thousands separator
 * (German "6.5" is 6.5, but "1.234" is 1234). Returns null for anything else.
 */
export function parseLocalizedNumber(text: string, lang: Language): number | null {
  const { group, decimal } = STRINGS[lang].separators;
  const other = decimal === "," ? "." : ",";
  let s = text.replace(/[\s  ]/g, "").replace(/[−–]/g, "-");
  const sign = s.startsWith("-") ? "-" : "";
  if (sign) s = s.slice(1);

  if (group !== " " && s.includes(group)) {
    const [intPart, frac, ...rest] = s.split(decimal);
    if (rest.length > 0) return null;
    const grouping = new RegExp(`^\\d{1,3}(\\${group}\\d{3})+$`);
    if (grouping.test(intPart)) s = intPart.split(group).join("") + (frac !== undefined ? `.${frac}` : "");
    else if (frac === undefined && s.split(group).length === 2) s = s.replace(group, ".");
    else return null;
  } else if (s.includes(decimal)) {
    s = s.replace(decimal, ".");
  } else if (s.split(other).length === 2) {
    s = s.replace(other, ".");
  }
  return /^\d+(\.\d+)?$/.test(s) ? Number(sign + s) : null;
}
