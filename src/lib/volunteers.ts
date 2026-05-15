export type Qualification =
  | "ER Doctor"
  | "Cardiologist"
  | "Nurse"
  | "Paramedic"
  | "Med Student";

export interface Volunteer {
  id: string;
  nameAr: string;
  qualificationAr: string;
  qualification: Qualification;
  distance: number;
  lat: number;
  lng: number;
  score: number;
  color: string;
  ring: string;
}

export const EMERGENCY_LOCATION = { lat: 21.4128, lng: 39.8945 };

function calcScore(distance: number, qualification: Qualification): number {
  let distScore = 0;
  if (distance <= 100)      distScore = 100;
  else if (distance <= 200) distScore = 80;
  else if (distance <= 350) distScore = 60;
  else if (distance <= 500) distScore = 40;
  else                      distScore = 20;

  const qualScore: Record<Qualification, number> = {
    "ER Doctor":   100,
    Cardiologist:  100,
    Paramedic:      80,
    Nurse:          70,
    "Med Student":  50,
  };
  return Math.round(distScore * 0.4 + qualScore[qualification] * 0.4 + 100 * 0.2);
}

const raw: Omit<Volunteer, "score" | "color" | "ring">[] = [
  // ── Close ring (< 200m) ──────────────────────────────────────
  { id:"v1",  nameAr:"د. أحمد الشهري",    qualificationAr:"طبيب طوارئ",            qualification:"ER Doctor",   distance:85,  lat:21.4131, lng:39.8940 },
  { id:"v2",  nameAr:"م. فاطمة القرني",   qualificationAr:"ممرضة عناية مركزة",     qualification:"Nurse",       distance:120, lat:21.4135, lng:39.8950 },
  { id:"v3",  nameAr:"أ. خالد الزهراني",  qualificationAr:"مسعف",                  qualification:"Paramedic",   distance:160, lat:21.4122, lng:39.8938 },
  { id:"v4",  nameAr:"أ. نورة السلمي",    qualificationAr:"طالبة طب - سنة ٦",     qualification:"Med Student", distance:95,  lat:21.4126, lng:39.8948 },
  { id:"v5",  nameAr:"أ. ريم الدوسري",    qualificationAr:"مسعفة ميدانية",         qualification:"Paramedic",   distance:175, lat:21.4120, lng:39.8928 },
  { id:"v6",  nameAr:"د. سارة العتيبي",   qualificationAr:"طبيبة قلب",             qualification:"Cardiologist",distance:190, lat:21.4124, lng:39.8958 },
  // ── Mid ring (200–400m) ──────────────────────────────────────
  { id:"v7",  nameAr:"م. عمر الحربي",     qualificationAr:"ممرض طوارئ",            qualification:"Nurse",       distance:230, lat:21.4118, lng:39.8955 },
  { id:"v8",  nameAr:"د. محمد القحطاني",  qualificationAr:"طبيب طوارئ",            qualification:"ER Doctor",   distance:280, lat:21.4145, lng:39.8960 },
  { id:"v9",  nameAr:"م. يوسف المالكي",   qualificationAr:"ممرض",                  qualification:"Nurse",       distance:310, lat:21.4137, lng:39.8965 },
  { id:"v10", nameAr:"د. هند العمري",     qualificationAr:"طبيبة طوارئ",           qualification:"ER Doctor",   distance:260, lat:21.4150, lng:39.8942 },
  { id:"v11", nameAr:"أ. بدر الشمري",     qualificationAr:"مسعف ميداني",           qualification:"Paramedic",   distance:330, lat:21.4108, lng:39.8962 },
  { id:"v12", nameAr:"أ. لينا الغامدي",   qualificationAr:"طالبة طب",              qualification:"Med Student", distance:350, lat:21.4112, lng:39.8935 },
  { id:"v13", nameAr:"د. فيصل البلوي",    qualificationAr:"طبيب باطني",            qualification:"ER Doctor",   distance:290, lat:21.4103, lng:39.8970 },
  { id:"v14", nameAr:"م. منى الزيد",      qualificationAr:"ممرضة",                 qualification:"Nurse",       distance:380, lat:21.4143, lng:39.8920 },
  // ── Outer ring (400–700m) — spread across Mina ───────────────
  { id:"v15", nameAr:"أ. رنا الحازمي",    qualificationAr:"طالبة طب - سنة ٥",     qualification:"Med Student", distance:420, lat:21.4158, lng:39.8935 },
  { id:"v16", nameAr:"د. وليد الغامدي",   qualificationAr:"طبيب طوارئ",            qualification:"ER Doctor",   distance:460, lat:21.4098, lng:39.8975 },
  { id:"v17", nameAr:"م. ديمة السبيعي",   qualificationAr:"ممرضة أطفال",          qualification:"Nurse",       distance:490, lat:21.4165, lng:39.8950 },
  { id:"v18", nameAr:"أ. عبدالله الرشيد", qualificationAr:"مسعف",                  qualification:"Paramedic",   distance:510, lat:21.4095, lng:39.8920 },
  { id:"v19", nameAr:"د. نوف المطيري",    qualificationAr:"طبيبة قلب",             qualification:"Cardiologist",distance:540, lat:21.4170, lng:39.8910 },
  { id:"v20", nameAr:"م. حمد العنزي",     qualificationAr:"ممرض ICU",              qualification:"Nurse",       distance:560, lat:21.4090, lng:39.8990 },
  { id:"v21", nameAr:"أ. سلمى الزهراني",  qualificationAr:"طالبة طب",              qualification:"Med Student", distance:580, lat:21.4175, lng:39.8965 },
  { id:"v22", nameAr:"د. تركي الشريف",    qualificationAr:"طبيب طوارئ",            qualification:"ER Doctor",   distance:610, lat:21.4085, lng:39.9000 },
  { id:"v23", nameAr:"م. أمل القحطاني",   qualificationAr:"ممرضة طوارئ",           qualification:"Nurse",       distance:630, lat:21.4180, lng:39.8930 },
  { id:"v24", nameAr:"أ. ماجد الدوسري",   qualificationAr:"مسعف ميداني",           qualification:"Paramedic",   distance:650, lat:21.4078, lng:39.8960 },
  { id:"v25", nameAr:"د. غادة المالكي",   qualificationAr:"طبيبة باطنية",          qualification:"ER Doctor",   distance:680, lat:21.4185, lng:39.8945 },
  { id:"v26", nameAr:"م. راشد السلمي",    qualificationAr:"ممرض",                  qualification:"Nurse",       distance:700, lat:21.4073, lng:39.8975 },
  { id:"v27", nameAr:"أ. بسمة الحربي",    qualificationAr:"طالبة طب - سنة ٤",     qualification:"Med Student", distance:720, lat:21.4188, lng:39.8960 },
  { id:"v28", nameAr:"د. عادل العتيبي",   qualificationAr:"طبيب طوارئ",            qualification:"ER Doctor",   distance:750, lat:21.4068, lng:39.8988 },
  { id:"v29", nameAr:"م. شيماء الشهري",   qualificationAr:"ممرضة عناية",           qualification:"Nurse",       distance:780, lat:21.4192, lng:39.8920 },
  { id:"v30", nameAr:"أ. نايف القرني",    qualificationAr:"مسعف",                  qualification:"Paramedic",   distance:800, lat:21.4062, lng:39.9005 },
];

const colorMap: Record<Qualification, { dot: string; ring: string }> = {
  "ER Doctor":   { dot: "#3b82f6", ring: "rgba(59,130,246,0.4)" },
  Cardiologist:  { dot: "#3b82f6", ring: "rgba(59,130,246,0.4)" },
  Nurse:         { dot: "#22c55e", ring: "rgba(34,197,94,0.4)"  },
  Paramedic:     { dot: "#eab308", ring: "rgba(234,179,8,0.4)"  },
  "Med Student": { dot: "#9ca3af", ring: "rgba(156,163,175,0.4)"},
};

export const volunteers: Volunteer[] = raw.map((v) => ({
  ...v,
  score: calcScore(v.distance, v.qualification),
  color: colorMap[v.qualification].dot,
  ring:  colorMap[v.qualification].ring,
}));

export const ROUND1_IDS = volunteers
  .filter((v) => v.distance <= 300)
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)
  .map((v) => v.id);

export const ROUND2_IDS = volunteers
  .filter((v) => v.distance > 300 && v.distance <= 600)
  .sort((a, b) => b.score - a.score)
  .map((v) => v.id);

export function matchLabel(qualification: Qualification): string {
  if (qualification === "ER Doctor" || qualification === "Cardiologist") return "عالية جداً";
  if (qualification === "Paramedic") return "عالية";
  if (qualification === "Nurse") return "عالية";
  return "متوسطة";
}
