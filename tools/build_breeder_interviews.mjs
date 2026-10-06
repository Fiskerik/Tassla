import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "file:///C:/Users/erika/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const outDir = path.resolve("outputs/01a10d85-3239-7620-8512-fdff1735a876");
await fs.mkdir(outDir, { recursive: true });

const sources = {
  papillon: "https://papillonringen.se/ny/kopa_hund/plan_kullar.htm",
  bbhc: "https://www.bbhc.se/planerade-kullar/",
  greis: "https://www.greisworking.se/planer.html",
  ringlets: "https://www.ringlets.se/valpar",
  slottsbyn: "https://www.slottsbynsaustralianlabradoodles.com/planerade-kullar/",
  westie: "https://westiealliansen.se/uppfodare",
  rottweiler: "https://rottweilerklubben.se/kopa-rottweiler/valpguide/aktuella-valpkullar/",
  eurasier: "https://www.eurasierklubben.se/",
  sennen: "https://sshk.se/valpkullar/",
  schiller: "https://schillerstovare.se/avel/tiklista-2026",
};

// A = explicit event within Oct 2026–Mar 2027; B = winter 26/27 or early 2027;
// C = broad autumn 2026 / spring 2027; D = active public breeder, timing must be confirmed.
const prospects = [
  ["Sweet Desires", "Papillon", "Födsel", "14 eller 29 okt 2026", "A", "https://papillonringen.se/ny/kopa_hund/plan_kullar.htm"],
  ["Lärkängens", "Basset hound", "Födsel", "7 okt 2026", "A", sources.bbhc],
  ["Greis Working", "Miniature American Shepherd", "Födsel", "början av nov 2026", "A", sources.greis],
  ["Ringlets", "Labrador retriever", "Parning", "dec 2026 / dec–jan", "A", sources.ringlets],
  ["Slottsbyns Australian Labradoodles", "Australian labradoodle", "Leverans", "jan och mars 2027", "A", sources.slottsbyn],
  ["Redworking Ridge", "Rhodesian ridgeback", "Kull", "början av 2027", "B", "https://www.redworkingridge.se/"],
  ["SOLS Labradoodle", "Australian labradoodle", "Leverans", "dec 2026 / jan 2027", "A", "https://www.solslabradoodle.com/planerade-valpkullar"],
  ["Oakteem", "Australian labradoodle", "Parning", "sep 2026 och jan 2027", "A", "https://www.oakteem.se/"],
  ["Sunny Delight", "Labrador retriever", "Leverans", "dec 2026", "A", "https://sunnydelight.se/puppies/"],
  ["Alert 'n' Brave", "Australian shepherd", "Parning", "feb 2027", "A", "https://www.alertandbrave.se/valpar2/"],
  ["DynamiteBoom", "Australian shepherd", "Parning", "höst/vinter 2026 och feb 2027", "B", "https://dynamiteboom.se/"],
  ["Ettems", "Labrador retriever", "Födsel/leverans", "nov 2026 / jan 2027", "A", "https://ettems.se/kennel/"],
  ["Blackneck's", "Labrador retriever", "Parning", "feb/mars 2027", "A", "https://www.blacknecks.com/valparsaljes_lab_sv.html"],
  ["Betula Vallis", "Labrador retriever", "Parning", "feb/mars 2027", "A", "https://www.blacknecks.com/valparsaljes_lab_sv.html"],
  ["Vildingarnas", "Lagotto romagnolo", "Födsel", "nov 2026 och feb 2027", "A", "https://www.vildingarnas.se/1/12/valpar/"],
  ["Brightstaff", "Staffordshire bullterrier", "Leverans", "jan 2027", "A", "https://www.brightstaff.hundpoolen.nu/Valpar_1"],
  ["Skogsvettens", "Jämthund", "Parning", "nov/dec 2026", "A", "https://www.skogsvettens.com/Valpar_vantas"],
  ["Hirkaho", "Finsk lapphund", "Kull", "vår 2027", "C", "https://www.kennelhirkahos.hundpoolen.se/"],
  ["Westvings", "Welsh springer spaniel", "Kull", "vår 2027", "C", "https://www.westvings.hundpoolen.se/Nyheter"],
  ["Zebulons", "Cairnterrier", "Parning", "jan 2027", "A", "https://www.zebulons.hundpoolen.se/Anmalan"],
  ["Pihlstens", "Welsh springer spaniel", "Kull", "2027", "C", "https://www.pihlstens.hundpoolen.se/startsida_1"],
  ["Flatterhaft", "Flatcoated retriever", "Kull", "2027–2028", "C", "https://www.flatterhaft.hundpoolen.se/Toby--Vanja"],
  ["Bettylinas Labradoodle", "Labradoodle", "Kull", "höst 2026", "C", "https://bettylinas-labradoodle.se/"],
  ["Allegretto's", "Australian labradoodle", "Födsel/leverans", "okt / dec 2026", "A", "https://www.labradoodlesweden.se/index.php"],
  ["Enhagen Labradoodle", "Australian labradoodle", "Leverans", "okt 2026", "A", "https://www.enhagenlabradoodle.se/sundaes-kull-2026/"],
  ["Spårdax", "Lagotto romagnolo", "Födsel", "mitten av okt 2026", "A", "https://spardax.se/?page_id=10"],
  ["Ingdam's", "Golden retriever", "Kull", "höst 2026", "C", "https://www.ingdams.hundpoolen.se/"],
  ["Jerntraktens", "Labrador retriever", "Kull", "höst 2026 – källa motsägelsefull", "C", "https://www.jerntraktens.se/l/planerad-valpkull-varen-sommaren-2026/"],
  ["Flottatjärn's", "Golden retriever", "Kull", "höst 2026", "C", "https://www.flottatjarn.se/"],
  ["Gullungepilen", "Labrador retriever", "Parning", "dec 2026 / 2026–27", "A", "https://www.gullungepilen.se/Valpar_1"],
  ["Amandob's", "Dobermann", "Kull", "höst 2026", "C", "https://www.amandobs.com/"],
  ["Ärapoikas", "Lapsk vallhund", "Kull", "höst 2026", "C", "https://srlv.se/kopa-lvh/valpar/"],
  ["Atletos Alba", "Lagotto romagnolo", "Kull", "vår 2027", "C", "https://www.atletosalba.se/valp.php"],
  ["Ammiellas", "Golden retriever", "Kull", "höst 2026 eller vår 2027", "C", "https://www.ammiella.se/index.php/sv/"],
  ["Zenith", "Golden retriever", "Kull", "vår 2027", "C", "https://www.kennelzenith.se/valpar/"],
  ["Rippeboets", "Golden retriever", "Kull", "vår 2027", "C", "https://www.rippeboetskennel.se/17/24/valpar/"],
  ["Kullabygdens Labradoodle", "Labradoodle", "Födsel/leverans", "nov 2026 / jan 2027", "A", "https://www.kb-labradoodle.se/valpar"],
  ["Vallklanens", "Shetland sheepdog", "Kull", "vår 2027", "C", "https://vallklanen.com/valpar/"],
  ["Posh", "West highland white terrier", "Kull", "vår 2027", "C", "https://www.kennelposh.se/"],
  ["Smedstorpet", "Australian labradoodle", "Födsel/leverans", "okt–dec 2026 och jan 2027", "A", "https://www.smedstorpet.se/valpplaner"],
  ["Flattlyckan", "Flatcoated retriever", "Kull", "vår 2027", "C", "https://flattlyckan.se/valpar/"],
  ["Åbackens", "Golden retriever", "Kull", "vår 2027", "C", "https://www.abackenskennel.com/"],
  ["Filurias", "Golden retriever", "Kull", "vår 2027", "C", "https://www.filuria.se/index.html"],
  ["Lovebusters", "Labrador retriever", "Kull", "vår 2027", "C", "https://www.lovebusters.se/startsida"],
  ["Windleaf", "Labrador retriever", "Kull", "vår 2027", "C", "https://windleaf.se/valpar"],
  ["Like'ims", "Labrador retriever", "Parning", "vår 2027", "C", "https://likeims.se/"],
  ["Guldlövets", "Golden retriever", "Kull", "vår 2027", "C", "https://xn--guldlvetskennel-dtb.se/"],
  ["Queenousties", "West highland white terrier", "Kull", "vår 2027", "C", "https://www.queenousties.se/empty_24.html"],
  ["Fransros", "Fransk bulldogg", "Kull", "vår 2027", "C", "https://fransroskennel.com/"],
  ["MaDeLiChi's", "Chihuahua", "Kull", "vår 2027", "C", "https://www.madelichiskennel.com/tikar"],
  ["Grönviks", "Golden retriever", "Parning", "feb/mars 2027", "A", "https://www.gronvikskennel.se/"],
  ["Swedish Meadow", "Golden retriever", "Kull", "vår 2027", "C", "https://www.swedishmeadow.se/planerad-kull/"],
  ["Truemeric", "Golden retriever", "Kull", "vår 2027", "C", "https://truemeric.weebly.com/till-salu.html"],
  ["Åtta små tassarnas", "Chihuahua", "Kull", "vår 2027", "C", "https://attasmatassarnas.wixsite.com/start"],
  ["AfricanHunter's", "Rhodesian ridgeback", "Kull", "vår 2027", "C", "https://africanhunters.com/"],
  ["Rusagården", "Golden retriever", "Kull", "höst 2026", "C", "https://www.rusagarden.se/"],
  ["Bobelz", "Bostonterrier", "Kull", "höst 2026", "C", "https://www.bobelz.hundpoolen.nu/"],
  ["Humlamadens Labradoodle", "Labradoodle", "Kull", "höst/vinter 2026 och vår 2027", "B", "https://www.humlamadenslabradoodle.com/planerade-kullar.html"],
  ["Bländvita", "Vit herdehund", "Kull", "höst 2026", "C", "https://xn--blndvita-1za.se/"],
  ["DiversityDober", "Dobermann", "Parning", "mitten av okt / sen höst 2026", "A", "https://www.diversitydober.se/startsida"],
  ["SASOMAS", "Rottweiler", "Kull", "höst 2026", "C", "https://www.sasomas.kennelsida.se/VALPKULLAR_1"],
  ["Brighthills", "Rhodesian ridgeback", "Kull", "vinter/vår 2027", "B", "https://www.brighthills.se/"],
  ["Kangris", "Cairnterrier", "Kull", "höst/vinter 2026–27", "B", "https://www.kangris.com/"],
  ["Fire'n Ice", "Alaskan malamute", "Kull", "vinter/vår 2027", "B", "https://www.kennelfirenice.com/valpar-puppies"],
  ["Wild Escapades", "Working kelpie", "Kull", "vinter 2026–27", "B", "https://www.wildescapades.se/planerade-kullar/"],
  ["Sense of Diesel", "Briard", "Kull", "vinter/vår 2027", "B", "https://briardpicardklubben.se/for-valpkopare"],
  ["Hippie Royale", "Briard", "Kull", "vår 2027", "C", "https://briardpicardklubben.se/for-valpkopare"],
  ["Huntingdogs", "Jakthund", "Leverans", "jan 2027", "A", "https://www.huntingdogs.se/kennel"],
  ["Fyra Vita Tassar", "Vit herdehund", "Kull", "vinter 2026–27", "B", "https://fyravitatassar.com/nyheter/hem/valpplaner/"],
  ["Azileos", "Rhodesian ridgeback", "Kull", "vinter 2026–27", "B", "https://www.azileos.com/planerade-kullar"],
  ["Eau De Luxx", "Labrador retriever", "Kull", "vinter 2026–27", "B", "https://eaudeluxx.se/?page_id=1214"],
  ["TrampTass", "MAS / shetland sheepdog", "Kull", "vinter 2026–27", "B", "https://www.tramptass.se/ValparPlaner"],
  ["Accolini's", "Cocker spaniel", "Kull", "vår/sommar 2027", "C", "https://accolinis.se/valpplaner.html"],
  ["Fobecos", "Golden retriever", "Kull", "2027", "C", "https://fobecoskennel.se/"],
  ["Goldblaze", "Golden retriever", "Kull", "vår/sommar 2027", "C", "https://www.goldblaze.se/valpar.htm"],
  ["Kennel Se Upp", "Border collie", "Kull", "vår 2027", "C", "https://kennelseupp.se/valp/"],
  ["Villa Ekeborgs", "Havapoo", "Födsel/leverans", "okt / dec 2026", "A", "https://villa-ekeborgs.se/valpplaner/"],
  ["Chicostars", "Chihuahua", "Födsel", "nov 2026", "A", "https://www.chicostars.se/plans-litters-a2-z2/"],
  ["Snöfjällets", "Breton", "Kull", "sen höst 2026", "C", "https://www.breton.se/avel/aktuella-kullar"],
  ["Joarsåkerns", "Schillerstövare", "Parning", "vår 2027", "C", sources.schiller],
  ["Soya", "West highland white terrier", "Kull", "höst 2026", "C", sources.westie],
  ["Zorro", "West highland white terrier", "Kull", "höst 2026", "C", sources.westie],
  ["Tweed", "West highland white terrier", "Kull", "tidigast slutet av 2026", "B", sources.westie],
  ["Taste Of Sweet", "West highland white terrier", "Kull", "sensommar 2026", "D", sources.westie],
  ["Smash", "West highland white terrier", "Aktiv uppfödare", "timing saknas", "D", sources.westie],
  ["Jazzing", "West highland white terrier", "Aktiv uppfödare", "timing saknas", "D", sources.westie],
  ["Westinlove", "West highland white terrier", "Aktiv uppfödare", "timing saknas", "D", sources.westie],
  ["Eirwen's", "West highland white terrier", "Aktiv uppfödare", "timing saknas", "D", sources.westie],
  ["Mellanmöllan", "West highland white terrier", "Aktiv uppfödare", "timing saknas", "D", sources.westie],
  ["Nillatorps", "West highland white terrier", "Aktiv uppfödare", "timing saknas", "D", sources.westie],
  ["River Walk", "West highland white terrier", "Aktiv uppfödare", "timing saknas", "D", sources.westie],
  ["Änglalyckans", "West highland white terrier", "Aktiv uppfödare", "timing saknas", "D", sources.westie],
  ["Kenzalia's", "Rottweiler", "Aktuell rasklubbslista", "timing behöver omkontrolleras", "D", sources.rottweiler],
  ["Dexline's", "Rottweiler", "Aktuell rasklubbslista", "timing behöver omkontrolleras", "D", sources.rottweiler],
  ["Türingens", "Rottweiler", "Aktuell rasklubbslista", "timing behöver omkontrolleras", "D", sources.rottweiler],
  ["Järpéns Puppies", "Eurasier", "Aktuell rasklubbslista", "timing behöver omkontrolleras", "D", sources.eurasier],
  ["SilverMetalls", "Eurasier", "Aktuell rasklubbslista", "timing behöver omkontrolleras", "D", sources.eurasier],
  ["Hennatorpets", "Berner sennenhund", "Aktuell rasklubbslista", "timing behöver omkontrolleras", "D", sources.sennen],
  ["Kastenhofs", "Berner sennenhund", "Aktuell rasklubbslista", "timing behöver omkontrolleras", "D", sources.sennen],
  ["Lilla Björnens", "Berner sennenhund", "Aktuell rasklubbslista", "timing behöver omkontrolleras", "D", sources.sennen],
];

if (prospects.length !== 100) throw new Error(`Expected 100 prospects, got ${prospects.length}`);
if (new Set(prospects.map((p) => p[0])).size !== 100) throw new Error("Duplicate kennel names");

const wb = Workbook.create();
const overview = wb.worksheets.add("Översikt");
const breeders = wb.worksheets.add("Uppfödare");
const guide = wb.worksheets.add("Intervjuguide");
const answers = wb.worksheets.add("Svar");
const script = wb.worksheets.add("Samtalsmanus");
const codes = wb.worksheets.add("Kodlistor");

const navy = "#18324A", teal = "#1F7A78", cream = "#FFF8EE", coral = "#F29A78", pale = "#E6F2F0", gray = "#EEF1F4", red = "#FCE4E4", amber = "#FFF1CC";
const allSheets = [overview, breeders, guide, answers, script, codes];
for (const s of allSheets) { s.showGridLines = false; s.tabColor = teal; }
const title = (s, text, endCol) => { s.getRange(`A1:${endCol}1`).merge(); s.getRange("A1").values = [[text]]; s.getRange(`A1:${endCol}1`).format = { fill: navy, font: { name: "Aptos Display", size: 18, bold: true, color: "#FFFFFF" }, rowHeight: 34, verticalAlignment: "center" }; };
const header = (r) => { r.format = { fill: teal, font: { name: "Aptos", bold: true, color: "#FFFFFF" }, wrapText: true, verticalAlignment: "center", rowHeight: 30, borders: { preset: "all", style: "thin", color: "#D6E2E1" } }; };

title(overview, "Tassla — uppfödarintervjuer och pilotfunnel", "H");
overview.getRange("A3:H4").merge();
overview.getRange("A3").values = [["Beslut: använd 100 kandidater som prospekteringsfunnel. Ring 12–15 utforskande intervjuer först, följt av 25–30 strukturerade. Pilotintresse frågas separat sist och är aldrig en garanterad plats."]];
overview.getRange("A3:H4").format = { fill: cream, font: { size: 12, bold: true, color: navy }, wrapText: true, verticalAlignment: "center", borders: { preset: "outside", style: "medium", color: coral } };
overview.getRange("A6:B11").values = [["Mått", "Antal"], ["Kandidater", null], ["A — exakt periodhändelse", null], ["B — vinter/tidig 2027", null], ["C — bred överlappning", null], ["D — reserv, timing saknas", null]];
overview.getRange("B7:B11").values = [[100], [27], [13], [43], [17]];
header(overview.getRange("A6:B6"));
overview.getRange("D6:H12").values = [
  ["Arbetsprincip", "Tillämpning", "Varför", "Ägare", "Klart när"],
  ["Tidsfönster", "Skilj födsel, parning och leverans", "De betyder olika saker för pilotstart", "Research", "bekräftat vid första kontakt"],
  ["Urval", "Sprid våg 1 över ras/region/källtyp", "Minskar digital urvalsbias", "Product", "12–15 intervjuer"],
  ["Incitament", "Beskriv nyttan; pilotfråga sist", "Minskar ja-sägande och löftesrisk", "Intervjuare", "följ manus"],
  ["Persondata", "Inga köparnamn eller identifierbara historier", "Dataminimering", "Intervjuare", "avbryt och generalisera"],
  ["Innehåll", "Intervjun validerar behov, inte råd", "Hälso-/foder-/träningsråd granskas separat", "Dog Expert", "rätt granskningskod"],
  ["Produktbevis", "Komplettera med 5–8 valpköpare", "Uppfödare är proxy, inte slutmålgrupp", "Product", "separat studie"],
];
header(overview.getRange("D6:H6"));
overview.getRange("A14:H18").values = [["Våg", "Storlek", "Syfte", "Urval", "Budskap", "Beslut efter", "Mått", "Kommentar"], ["1", "12–15", "Utforska problem och språk", "Stratifierat A–C", "Överlämning + färre återkommande frågor", "Revidera guide", "svarskvalitet", "Visa inte koncept tidigt"], ["2", "25–30", "Kvantifiera och prioritera", "Fyll luckor i ras/region", "Samma kärna", "Pilotkriterier", "frekvens/impact", "Kodning konsekvent"], ["3", "ur återstående", "Rekrytera pilot", "Tydliga kriterier", "Separat pilotinbjudan", "pilotbeslut", "QR→aktivering", "Ingen garanti"], ["Valpköpare", "5–8", "Verifiera slutmålgrupp", "Neutral inbjudan", "Ingen datadelning", "produktbeslut", "nytta/retention", "Köparuppgifter ska inte lämnas till Tassla av uppfödaren"]];
header(overview.getRange("A14:H14"));
overview.getRange("A20:H22").merge(); overview.getRange("A20").values = [["Viktigt: A–C är inte samma sak som en bekräftad pilotkull. Alla kandidater ska omkontrolleras före samtal. Offentliga webbuppgifter kan vara inaktuella. Ingen personkontakt eller privat kontaktdata ingår i denna fil. Kontrollpunkt 2026-10-05."]]; overview.getRange("A20:H22").format = { fill: amber, font: { color: navy, bold: true }, wrapText: true, verticalAlignment: "center" };

title(breeders, "100 uppfödare — prospekteringsfunnel", "Q");
const breederHeaders = ["Kandidat-ID", "Kennel", "Ras", "Planhändelse", "Offentlig planperiod", "Periodmatch", "Evidensnivå", "Prioritet", "Våg", "Kontaktstatus", "Intervjustatus", "Pilotintresse", "Nästa steg", "Offentlig källa", "Kontrollerad", "Ort/län", "Intern notering"];
breeders.getRange("A2:Q2").values = [breederHeaders]; header(breeders.getRange("A2:Q2"));
const pRows = prospects.map((p, i) => {
  const level = p[4]; const match = level === "A" ? "Ja – händelse i period" : level === "B" ? "Trolig – bekräfta" : level === "C" ? "Möjlig – bekräfta" : "Ej belagd";
  const priority = level === "A" ? "1" : level === "B" ? "2" : level === "C" ? "3" : "Reserv";
  const wave = i < 15 ? "Våg 1" : i < 45 ? "Våg 2" : "Reserv/pilot";
  return [`UPP-${String(i + 1).padStart(3, "0")}`, p[0], p[1], p[2], p[3], match, level, priority, wave, "Ej kontaktad", "Ej bokad", "Ej frågat", "Kontrollera källa och period", p[5], new Date("2026-10-05T00:00:00Z"), "", level === "D" ? "Reserv: offentlig timing saknas" : ""];
});
breeders.getRange("A3").write(pRows);
breeders.tables.add("A2:Q102", true, "BreederPipeline"); breeders.freezePanes.freezeRows(2); breeders.freezePanes.freezeColumns(2);
breeders.getRange("G3:G102").dataValidation = { rule: { type: "list", values: ["A", "B", "C", "D"] } };
breeders.getRange("J3:J102").dataValidation = { rule: { type: "list", values: ["Ej kontaktad", "Försökt", "Kontaktad", "Avböjt", "Kontakta ej"] } };
breeders.getRange("K3:K102").dataValidation = { rule: { type: "list", values: ["Ej bokad", "Bokad", "Genomförd", "Avbruten", "Uteblev"] } };
breeders.getRange("L3:L102").dataValidation = { rule: { type: "list", values: ["Ej frågat", "Ja", "Nej", "Kanske"] } };
breeders.getRange("G3:G102").conditionalFormats.add("containsText", { text: "A", format: { fill: "#D9EEDB", font: { bold: true, color: "#27613A" } } });
breeders.getRange("G3:G102").conditionalFormats.add("containsText", { text: "D", format: { fill: red, font: { color: "#9B2C2C" } } });
breeders.getRange("O3:O102").format.numberFormat = "yyyy-mm-dd";

title(guide, "Intervjuguide — 12 minuter kärna, max 15", "I");
const qs = [
  ["0", "Start", "Vi kartlägger frågor och situationer valpköpare behöver hjälp med. Vi bedömer inte medicinska eller träningsmässiga råd i intervjun.", "—", "Rätt förväntan", "—", "—", "Kärna", "0:30"],
  ["1", "Kontext", "Tänk på er senaste kull: hur såg överlämningen och de första fyra veckorna ut för köparna?", "Ungefär hur många valpar och när skedde hämtning?", "Förankra i verkligt beteende", "puppy_phase", "MVP: onboarding", "Kärna", "1:00"],
  ["2", "Frågor", "Vilka tre frågor eller situationer återkom oftast före hämtning, första veckan och första månaden?", "Vad hände senast? Vad utlöste frågan?", "Behov och timing", "domain, trigger, frequency", "MVP: innehåll", "Kärna", "2:00"],
  ["3", "Glapp", "Vad frågar köpare om trots att det redan finns i valppaketet?", "När och i vilken kanal kommer frågan?", "Upptäckbarhet och format", "current_channel, workaround", "MVP: daglig resa", "Kärna", "1:00"],
  ["4", "Belastning", "Vilka situationer skapar mest osäkerhet för köparen och vilka tar mest tid för er?", "Hur ofta och hur stor blir konsekvensen?", "Prioritering", "impact, frequency", "Produktprioritering", "Kärna", "1:00"],
  ["5", "Gräns", "Vad bör en valpköpare veta eller göra själv innan hen kontaktar er — och när vill ni att hen kontaktar er direkt?", "Vad hänvisar ni alltid vidare till veterinär?", "Ansvarsgräns", "desired_outcome, review_route", "Säkerhetsflöde", "Kärna", "1:15"],
  ["6", "Nuvarande stöd", "Vilket material eller stöd använder ni idag, och vad används faktiskt respektive missas?", "Papper, sms, mejl, webb, grupp?", "Kanaler och friktion", "current_channel, workaround", "Distribution", "Kärna", "1:00"],
  ["7", "Första 30 dagar", "Om Tassla bara fick lösa ett problem under valpens första 30 dagar, vilket skulle ge störst nytta för köparen och samtidigt förenkla för er?", "Vilken konkret förändring skulle ni se?", "Prioriterat utfall", "desired_outcome, impact", "MVP-värde", "Kärna", "1:00"],
  ["8", "Variation", "Vad varierar mest med valpens ålder, ras, storlek, hälsa, miljö eller köparens erfarenhet?", "Vilket antagande får vi inte generalisera?", "Personaliseringsbehov", "dependencies", "Innehållsmotor", "Kärna", "0:45"],
  ["9", "Risk", "Vad skulle en app absolut inte få ta över eller ge falsk trygghet kring?", "När finns risk för försenad veterinär- eller beteendehjälp?", "Skyddsräcken", "risk_class, review_route", "Säkerhet", "Kärna", "0:45"],
  ["10", "Koncept", "Tänk en kostnadsfri, åldersanpassad app som introduceras via QR i valppaketet. Vad skulle göra det naturligt — eller besvärligt — att använda den i överlämningen?", "Bästa tidpunkt och kanal?", "Distribution efter behov", "friction, timing", "MVP: QR", "Kärna", "1:00"],
  ["11", "Pilot", "Intervjun är avslutad. Separat: vill ni anmäla intresse för en begränsad pilot? Det är ingen garanti om plats.", "Vilka villkor måste vara uppfyllda?", "Separera incitament", "pilot_interest", "Piloturval", "Kärna", "0:30"],
  ["12", "Uppföljning", "Får Tassla kontakta er en gång via överenskommen kanal om pilotens urval och villkor?", "Ja/nej + kanal; inget löpande utskick.", "Separat tillstånd", "followup_permission", "Compliance", "Kärna", "0:20"],
];
guide.getRange("A2:I2").values = [["Nr", "Tema", "Fråga", "Följdfråga", "Produktnytta", "Kodning", "MVP-koppling", "Nivå", "Tid"]]; header(guide.getRange("A2:I2")); guide.getRange("A3").write(qs); guide.tables.add(`A2:I${qs.length + 2}`, true, "InterviewGuide"); guide.freezePanes.freezeRows(2);

title(answers, "Svar och kodning — en rad per intervju", "T");
answers.getRange("A2:T2").values = [["Kandidat-ID", "Datum", "Intervjuare", "Senaste kull/fas", "Köparens erfarenhet", "Domän", "Köparbehov — kort avidentifierat", "Trigger/situation", "Önskat utfall", "Nuvarande kanal", "Workaround", "Frekvens", "Påverkan", "Beroenden", "Råd som uppfödaren beskriver", "Påstådd källa", "Riskklass", "Granskningsväg", "MVP-koppling", "Pilotintresse"]]; header(answers.getRange("A2:T2"));
const answerRows = prospects.map((_, i) => [`UPP-${String(i + 1).padStart(3, "0")}`, null, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "R0", "Ingen", "", "Ej frågat"]);
answers.getRange("A3").write(answerRows); answers.tables.add("A2:T102", true, "InterviewAnswers"); answers.freezePanes.freezeRows(2); answers.freezePanes.freezeColumns(1);
answers.getRange("F3:F102").dataValidation = { rule: { type: "list", values: ["Hälsa", "Foder", "Träning", "Beteende", "Vardag", "Överlämning", "App/QR"] } };
answers.getRange("L3:M102").dataValidation = { rule: { type: "list", values: ["Låg", "Medel", "Hög"] } };
answers.getRange("P3:P102").dataValidation = { rule: { type: "list", values: ["Veterinär", "Exakt foderproduktguide", "Kvalificerad beteendeexpert", "Rasklubb", "Egen erfarenhet", "Okänd"] } };
answers.getRange("Q3:Q102").dataValidation = { rule: { type: "list", values: ["R0", "R1", "R2", "R3"] } };
answers.getRange("R3:R102").dataValidation = { rule: { type: "list", values: ["Ingen", "DOG_EXPERT_REVIEW", "VET_REVIEW", "Båda", "Karantän"] } };
answers.getRange("T3:T102").dataValidation = { rule: { type: "list", values: ["Ej frågat", "Ja", "Nej", "Kanske"] } };
answers.getRange("A104:T106").merge(); answers.getRange("A104").values = [["STOPP: skriv aldrig köparens namn, kontaktuppgifter, barnuppgifter, diagnoser eller andra identifierande detaljer. Om sådant nämns: avbryt vänligt och be om en generell beskrivning. Hälsa, läkemedel, toxiska ämnen, specialdiet, smärta/rädsla/aggression och plötslig beteendeförändring kräver separat expert-/veterinärgranskning."]]; answers.getRange("A104:T106").format = { fill: red, font: { bold: true, color: "#8B1E1E" }, wrapText: true, verticalAlignment: "center" };

title(script, "Samtalsmanus A–Ö", "F");
const steps = [
  ["A", "Före samtalet", "Omkontrollera kullplan, offentlig källa, kontaktkanal och invändnings-/kontaktspärrar. Ha integritetslänk och urvalskriterier klara. Ring inte från en privat ostrukturerad lista."],
  ["B", "Öppning", "Hej, jag heter [namn] och ringer från Tassla, en app som utvecklas för att hjälpa nya valpägare under den första tiden. Vi hittade kenneln via [offentlig källa]."],
  ["C", "Värde + tid", "Vi vill göra en intervju på cirka 12 minuter om frågor valpköpare brukar ha och hur överlämningen kan bli enklare. Målet är stöd som gör köpare tryggare och kan minska återkommande grundfrågor — utan mer administration för er."],
  ["D", "Syften", "Vi kommer också i slutet, separat från intervjun, fråga om ni vill anmäla intresse för en begränsad pilot. Vi säljer inget och ingår inget avtal i samtalet. Intervjun garanterar inte en pilotplats."],
  ["E", "Integritet", "Vi spelar inte in. Vi antecknar sammanfattade svar för produktutveckling. Nämn inte namn eller andra identifierande uppgifter om enskilda valpköpare. Information om hur kontaktuppgifter och svar behandlas finns på [integritetslänk]. Ni kan avbryta eller be oss att inte kontakta er igen."],
  ["F", "Tillåtelse", "Passar det att fortsätta i cirka 12 minuter? [Ja → fortsätt. Nej → erbjud en ny tid endast om de vill; annars tacka och avsluta.]"],
  ["G–R", "Kärnintervju", "Följ Intervjuguide fråga 1–10. Börja med den senaste verkliga kullen. Fråga om händelser och arbetssätt, inte om vad de tycker om Tasslas idé. Visa konceptet först i fråga 10."],
  ["S", "Om köparuppgifter nämns", "Tack — för att skydda valpköparen behöver vi hålla det generellt. Beskriv gärna typen av fråga eller situation, men utan namn, kontaktuppgifter eller andra detaljer som kan identifiera personen."],
  ["T", "Om råd ges", "Tack, jag noterar det som hur ni brukar hantera frågan. Eventuella råd i Tassla källgranskas separat."],
  ["U", "Om de frågar vad appen ersätter", "Tassla ska inte ersätta uppfödaren, veterinären eller kvalificerad beteendehjälp. Vi testar åldersanpassat vardagsstöd och en enkel ingång via valppaketet. Ingen uppfödarportal eller köpardata delas i den här MVP:n."],
  ["V", "Pilotfråga — separat", "Intervjun är nu avslutad. Separat från era svar: vill ni anmäla intresse för att eventuellt delta i en begränsad pilot? Det är ingen garanti om plats. Urvalet sker enligt [publicerade kriterier] och piloten kan ändras eller avslutas efter testperioden."],
  ["W", "Uppföljningstillstånd", "Får Tassla kontakta er en gång via [överenskommen kanal] om pilotens urval och villkor? Ert val påverkar inte hur de redan lämnade intervjusvaren används enligt integritetsinformationen."],
  ["X", "Vanliga invändningar", "'Vi har redan valppaket': Bra — vi vill förstå vad som faktiskt används och vad som ändå skapar frågor. 'Skickar ni reklam?': Nej i denna studie; eventuella framtida kommersiella inslag ska märkas tydligt och påverkar inte vägledning. 'Får vi se köparnas data?': Nej, inte i MVP:n."],
  ["Y", "Avslut", "Tack för tiden. Jag sammanfattar att [1–2 neutrala problem]. Vi skickar inget mer om ni inte uttryckligen godkänt en kontakt om piloten. Ni kan använda [kontaktväg] för frågor eller invändning."],
  ["Ö", "Efter samtalet", "Koda svar samma dag. Separera observerat behov från råd. Markera riskklass och granskningsväg. Spara inte identifierbara köparuppgifter. Uppdatera status och nästa steg; radera enligt beslutad gallringsplan."],
];
script.getRange("A2:F2").values = [["Del", "Moment", "Säg/gör", "Klart", "Anteckning", "Riskkontroll"]]; header(script.getRange("A2:F2")); script.getRange("A3").write(steps.map((r) => [...r, "☐", "", r[0] === "S" || r[0] === "T" ? "Obligatorisk skyddsfras" : ""])); script.tables.add(`A2:F${steps.length + 2}`, true, "CallScript"); script.freezePanes.freezeRows(2);

title(codes, "Kodlistor och granskningsregler", "G");
codes.getRange("A2:G2").values = [["Kodtyp", "Kod", "Definition", "Exempel", "Åtgärd", "Publicerbar?", "Kommentar"]]; header(codes.getRange("A2:G2"));
const codeRows = [
  ["Evidens", "A", "Exakt månad/datum eller leverans i okt 2026–mar 2027", "nov 2026", "Prioritera efter omkontroll", "—", "Händelsetyp kan vara parning, födsel eller leverans"],
  ["Evidens", "B", "Vinter 2026/27 eller början av 2027", "vinter/vår", "Bekräfta period", "—", "Inte exakt Q1"],
  ["Evidens", "C", "Bred höst 2026 eller vår 2027", "vår 2027", "Bekräfta månad", "—", "Kan ligga utanför målperiod"],
  ["Evidens", "D", "Aktiv uppfödare men timing saknas", "rasklubbslista", "Reserv", "—", "Inte verifierad mot perioden"],
  ["Risk", "R0", "Ingen rådande säkerhetsrisk", "logistik/kanal", "Normal analys", "Nej, behovsdata", ""],
  ["Risk", "R1", "Låg risk; faktapåstående", "vardagsrutin", "Källgranska", "Först efter granskning", ""],
  ["Risk", "R2", "Hälsa/foder/träning/beteende", "symtom, mängd, metod", "Expertgranskning", "Nej", "VET/DOG_EXPERT"],
  ["Risk", "R3", "Akut/skadligt/aversivt eller identifierbara data", "läkemedel, gift, tvångsverktyg", "Karantän + eskalera", "Nej", "Spara inte persondata"],
  ["Källa", "Veterinär", "Veterinär eller oberoende veterinärkälla", "hänvisning", "VET_REVIEW", "Efter verifiering", ""],
  ["Källa", "Exakt foderproduktguide", "Tillverkarens guide för exakt produkt/livsstadium", "gram/dag", "VET_REVIEW vid specialdiet", "Efter verifiering", ""],
  ["Källa", "Kvalificerad beteendeexpert", "Relevant utbildning/yrkeskompetens", "beteendeplan", "DOG_EXPERT_REVIEW", "Efter verifiering", ""],
  ["Princip", "Pilot", "Intervju och pilotintresse är separata", "fråga sist", "Ingen garanti/förtur", "—", "Urvalskriterier krävs"],
  ["Princip", "Persondata", "Ingen identifierbar valpköparinformation", "inga namn/kontakter", "Generalisera eller stoppa", "—", "Google Workspace/DPA m.m. måste beslutas före skarp drift"],
];
codes.getRange("A3").write(codeRows); codes.tables.add(`A2:G${codeRows.length + 2}`, true, "Codebook"); codes.freezePanes.freezeRows(2);

// Readability pass: consistent wrapping, widths, banding and row heights.
for (const s of allSheets) { const used = s.getUsedRange(); used.format.wrapText = true; used.format.verticalAlignment = "top"; used.format.borders = { preset: "inside", style: "thin", color: "#E1E7EA" }; used.format.autofitRows(); }
overview.getRange("A:A").format.columnWidth = 20; overview.getRange("B:B").format.columnWidth = 12; overview.getRange("C:C").format.columnWidth = 22; overview.getRange("D:D").format.columnWidth = 24; overview.getRange("E:H").format.columnWidth = 23;
breeders.getRange("A:A").format.columnWidth = 13; breeders.getRange("B:B").format.columnWidth = 28; breeders.getRange("C:C").format.columnWidth = 24; breeders.getRange("D:M").format.columnWidth = 18; breeders.getRange("N:N").format.columnWidth = 42; breeders.getRange("O:Q").format.columnWidth = 18;
guide.getRange("A:A").format.columnWidth = 6; guide.getRange("B:B").format.columnWidth = 16; guide.getRange("C:D").format.columnWidth = 46; guide.getRange("E:H").format.columnWidth = 22; guide.getRange("I:I").format.columnWidth = 9;
answers.getRange("A:T").format.columnWidth = 18; answers.getRange("G:O").format.columnWidth = 28;
script.getRange("A:A").format.columnWidth = 8; script.getRange("B:B").format.columnWidth = 24; script.getRange("C:C").format.columnWidth = 78; script.getRange("D:F").format.columnWidth = 20;
codes.getRange("A:B").format.columnWidth = 16; codes.getRange("C:G").format.columnWidth = 28;

const previewSheets = ["Översikt", "Uppfödare", "Intervjuguide", "Svar", "Samtalsmanus", "Kodlistor"];
for (const sheetName of previewSheets) {
  const blob = await wb.render({ sheetName, autoCrop: "all", scale: sheetName === "Uppfödare" || sheetName === "Svar" ? 0.35 : 0.65, format: "png" });
  await fs.writeFile(path.join(outDir, `preview-${sheetName}.png`), new Uint8Array(await blob.arrayBuffer()));
}

const inspection = await wb.inspect({ kind: "workbook,sheet,table", maxChars: 10000, tableMaxRows: 4, tableMaxCols: 8, tableMaxCellChars: 100 });
await fs.writeFile(path.join(outDir, "inspection.txt"), inspection.ndjson ?? String(inspection));
const errorScan = await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 200 }, maxChars: 6000 });
await fs.writeFile(path.join(outDir, "formula-error-scan.txt"), errorScan.ndjson ?? String(errorScan));

const xlsx = await SpreadsheetFile.exportXlsx(wb);
const outFile = path.join(outDir, "Tassla-uppfodarintervjuer-pilotfunnel.xlsx");
await xlsx.save(outFile);
console.log(JSON.stringify({ outFile, prospectCount: prospects.length, levels: Object.fromEntries(["A","B","C","D"].map((l) => [l, prospects.filter((p) => p[4] === l).length])), previews: previewSheets.length }));
