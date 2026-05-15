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
  distance: number; // meters
  lat: number;
  lng: number;
  score: number;
  color: string;
  ring: string;
}

// Emergency location in Mina — near Jamarat
export const EMERGENCY_LOCATION = { lat: 21.4128, lng: 39.8945 };

function calcScore(distance: number, qualification: Qualification): number {
  let distScore = 0;
  if (distance <= 100) distScore = 100;
  else if (distance <= 200) distScore = 70;
  else distScore = 40;

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
  { id: "v1", nameAr: "د. أحمد الشهري", qualificationAr: "طبيب طوارئ", qualification: "ER Doctor", distance: 85, lat: 21.4131, lng: 39.8940 },
  { id: "v2", nameAr: "م. فاطمة القرني", qualificationAr: "ممرضة عناية مركزة", qualification: "Nurse", distance: 120, lat: 21.4135, lng: 39.8950 },
  { id: "v3", nameAr: "أ. خالد الزهراني", qualificationAr: "مسعف", qualification: "Paramedic", distance: 180, lat: 21.4122, lng: 39.8938 },
  { id: "v4", nameAr: "د. سارة العتيبي", qualificationAr: "طبيبة قلب", qualification: "Cardiologist", distance: 240, lat: 21.4140, lng: 39.8930 },
  { id: "v5", nameAr: "م. عمر الحربي", qualificationAr: "ممرض طوارئ", qualification: "Nurse", distance: 310, lat: 21.4118, lng: 39.8955 },
  { id: "v6", nameAr: "أ. نورة السلمي", qualificationAr: "طالبة طب", qualification: "Med Student", distance: 95, lat: 21.4126, lng: 39.8948 },
  { id: "v7", nameAr: "د. محمد القحطاني", qualificationAr: "طبيب طوارئ", qualification: "ER Doctor", distance: 420, lat: 21.4145, lng: 39.8960 },
  { id: "v8", nameAr: "أ. ريم الدوسري", qualificationAr: "مسعفة", qualification: "Paramedic", distance: 160, lat: 21.4120, lng: 39.8928 },
  { id: "v9", nameAr: "م. يوسف المالكي", qualificationAr: "ممرض", qualification: "Nurse", distance: 280, lat: 21.4137, lng: 39.8965 },
  { id: "v10", nameAr: "أ. لينا الغامدي", qualificationAr: "طالبة طب", qualification: "Med Student", distance: 350, lat: 21.4112, lng: 39.8935 },
];

const colorMap: Record<Qualification, { dot: string; ring: string }> = {
  "ER Doctor": { dot: "#3b82f6", ring: "rgba(59,130,246,0.4)" },
  Cardiologist: { dot: "#3b82f6", ring: "rgba(59,130,246,0.4)" },
  Nurse: { dot: "#22c55e", ring: "rgba(34,197,94,0.4)" },
  Paramedic: { dot: "#eab308", ring: "rgba(234,179,8,0.4)" },
  "Med Student": { dot: "#9ca3af", ring: "rgba(156,163,175,0.4)" },
};

export const volunteers: Volunteer[] = raw.map((v) => ({
  ...v,
  score: calcScore(v.distance, v.qualification),
  color: colorMap[v.qualification].dot,
  ring: colorMap[v.qualification].ring,
}));

export const TOP_3 = [...volunteers]
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);

export function matchLabel(qualification: Qualification): string {
  if (qualification === "ER Doctor" || qualification === "Cardiologist") return "عالية";
  if (qualification === "Paramedic" || qualification === "Nurse") return "عالية";
  return "متوسطة";
}
