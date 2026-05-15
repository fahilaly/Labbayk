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
  if (distance <= 100) distScore = 100;
  else if (distance <= 200) distScore = 70;
  else if (distance <= 300) distScore = 50;
  else distScore = 30;

  const qualScore: Record<Qualification, number> = {
    "ER Doctor": 100,
    Cardiologist: 100,
    Nurse: 70,
    Paramedic: 80,
    "Med Student": 50,
  };

  return Math.round(distScore * 0.4 + qualScore[qualification] * 0.4 + 100 * 0.1 + 100 * 0.1);
}

const raw: Omit<Volunteer, "score" | "color" | "ring">[] = [
  // Within 200m — Round 1
  { id: "v1",  nameAr: "د. أحمد الشهري",   qualificationAr: "طبيب طوارئ",           qualification: "ER Doctor",   distance: 85,  lat: 21.4131, lng: 39.8940 },
  { id: "v2",  nameAr: "م. فاطمة القرني",  qualificationAr: "ممرضة عناية مركزة",    qualification: "Nurse",       distance: 120, lat: 21.4135, lng: 39.8950 },
  { id: "v3",  nameAr: "أ. خالد الزهراني", qualificationAr: "مسعف",                 qualification: "Paramedic",   distance: 160, lat: 21.4122, lng: 39.8938 },
  { id: "v4",  nameAr: "أ. نورة السلمي",   qualificationAr: "طالبة طب",             qualification: "Med Student", distance: 95,  lat: 21.4126, lng: 39.8948 },
  { id: "v5",  nameAr: "أ. ريم الدوسري",   qualificationAr: "مسعفة",                qualification: "Paramedic",   distance: 175, lat: 21.4120, lng: 39.8928 },
  // 200–400m — Round 2 (radius expansion)
  { id: "v6",  nameAr: "د. سارة العتيبي",  qualificationAr: "طبيبة قلب",            qualification: "Cardiologist",distance: 240, lat: 21.4140, lng: 39.8930 },
  { id: "v7",  nameAr: "م. عمر الحربي",    qualificationAr: "ممرض طوارئ",           qualification: "Nurse",       distance: 270, lat: 21.4118, lng: 39.8955 },
  { id: "v8",  nameAr: "د. محمد القحطاني", qualificationAr: "طبيب طوارئ",           qualification: "ER Doctor",   distance: 310, lat: 21.4145, lng: 39.8960 },
  { id: "v9",  nameAr: "م. يوسف المالكي",  qualificationAr: "ممرض",                 qualification: "Nurse",       distance: 340, lat: 21.4137, lng: 39.8965 },
  { id: "v10", nameAr: "أ. لينا الغامدي",  qualificationAr: "طالبة طب",             qualification: "Med Student", distance: 380, lat: 21.4112, lng: 39.8935 },
  { id: "v11", nameAr: "د. هند العمري",    qualificationAr: "طبيبة طوارئ",          qualification: "ER Doctor",   distance: 290, lat: 21.4150, lng: 39.8942 },
  { id: "v12", nameAr: "أ. بدر الشمري",    qualificationAr: "مسعف ميداني",          qualification: "Paramedic",   distance: 355, lat: 21.4108, lng: 39.8962 },
  { id: "v13", nameAr: "م. منى الزيد",     qualificationAr: "ممرضة",                qualification: "Nurse",       distance: 410, lat: 21.4143, lng: 39.8920 },
  { id: "v14", nameAr: "د. فيصل البلوي",   qualificationAr: "طبيب باطني",           qualification: "ER Doctor",   distance: 460, lat: 21.4103, lng: 39.8970 },
  { id: "v15", nameAr: "أ. رنا الحازمي",   qualificationAr: "طالبة طب - سنة خامسة", qualification: "Med Student", distance: 490, lat: 21.4158, lng: 39.8935 },
];

const colorMap: Record<Qualification, { dot: string; ring: string }> = {
  "ER Doctor":    { dot: "#3b82f6", ring: "rgba(59,130,246,0.4)" },
  Cardiologist:   { dot: "#3b82f6", ring: "rgba(59,130,246,0.4)" },
  Nurse:          { dot: "#22c55e", ring: "rgba(34,197,94,0.4)" },
  Paramedic:      { dot: "#eab308", ring: "rgba(234,179,8,0.4)" },
  "Med Student":  { dot: "#9ca3af", ring: "rgba(156,163,175,0.4)" },
};

export const volunteers: Volunteer[] = raw.map((v) => ({
  ...v,
  score: calcScore(v.distance, v.qualification),
  color: colorMap[v.qualification].dot,
  ring:  colorMap[v.qualification].ring,
}));

// Round 1: closest 3 by score within 200m
export const ROUND1 = [...volunteers]
  .filter((v) => v.distance <= 200)
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);

// Round 2: next best within 400m (excluding round 1)
const round1Ids = new Set(ROUND1.map((v) => v.id));
export const ROUND2 = [...volunteers]
  .filter((v) => !round1Ids.has(v.id) && v.distance <= 500)
  .sort((a, b) => b.score - a.score)
  .slice(0, 4);

export function matchLabel(qualification: Qualification): string {
  if (qualification === "ER Doctor" || qualification === "Cardiologist") return "عالية جداً";
  if (qualification === "Paramedic") return "عالية";
  if (qualification === "Nurse") return "عالية";
  return "متوسطة";
}
