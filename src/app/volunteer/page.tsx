"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { createChannel, removeChannel, EMERGENCY_CHANNEL, EmergencyEvent } from "@/lib/supabase";
import { startAlert, stopAlert } from "@/lib/alertSound";
import dynamicImport from "next/dynamic";
import type { RealtimeChannel } from "@supabase/supabase-js";

const VolunteerNav = dynamicImport(() => import("@/components/VolunteerNav"), { ssr: false });

type ScreenState = "home" | "alert" | "navigating" | "arrived" | "critical_scene" | "resolved";
type OutcomeType = "stable" | "transport" | "critical";

export default function VolunteerPage() {
  const [screen, setScreen]           = useState<ScreenState>("home");
  const [countdown, setCountdown]     = useState(60);
  const [outcome, setOutcome]         = useState<OutcomeType | null>(null);
  const [responseTime, setResponseTime] = useState(0);
  const [elapsedRef]                  = useState({ val: 0 });
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioStarted    = useRef(false);
  const channelRef      = useRef<RealtimeChannel | null>(null);

  const broadcast = (event: EmergencyEvent) =>
    channelRef.current?.send({ type: "broadcast", event: "state", payload: event });

  useEffect(() => {
    const ch = createChannel(EMERGENCY_CHANNEL)
      .on("broadcast", { event: "state" }, ({ payload }) => {
        const ev = payload as EmergencyEvent;
        // Only react to ALERT_SENT — not EMERGENCY_TRIGGERED
        if (ev.type === "ALERT_SENT") {
          setScreen("alert");
          setCountdown(60);
          if (!audioStarted.current) {
            startAlert();
            audioStarted.current = true;
          }
          startCountdown();
          startElapsedTimer();
        }
        if (ev.type === "RESET") resetAll();
      })
      .subscribe();
    channelRef.current = ch;
    return () => { removeChannel(ch); };
  }, []);

  function startCountdown() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    let c = 60;
    countdownRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countdownRef.current!);
        setScreen("home");
        stopAlert();
        audioStarted.current = false;
      }
    }, 1000);
  }

  function startElapsedTimer() {
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    elapsedRef.val = 0;
    elapsedTimerRef.current = setInterval(() => { elapsedRef.val += 1; }, 1000);
  }

  function stopElapsedTimer() {
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
  }

  function resetAll() {
    setScreen("home");
    setCountdown(60);
    setOutcome(null);
    stopAlert();
    audioStarted.current = false;
    if (countdownRef.current) clearInterval(countdownRef.current);
    stopElapsedTimer();
  }

  function handleAccept() {
    stopAlert();
    audioStarted.current = false;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setScreen("navigating");
    broadcast({ type: "VOLUNTEER_ACCEPTED", volunteer: "د. أحمد الشهري" });
  }

  function handleDecline() {
    stopAlert();
    audioStarted.current = false;
    if (countdownRef.current) clearInterval(countdownRef.current);
    broadcast({ type: "VOLUNTEER_DECLINED", volunteer: "د. أحمد الشهري" });
    setScreen("home");
  }

  function handleArrived() {
    stopElapsedTimer();
    setResponseTime(elapsedRef.val);
    setScreen("arrived");
    broadcast({ type: "VOLUNTEER_ARRIVED" });
  }

  function handleOutcome(type: OutcomeType) {
    setOutcome(type);
    if (type === "critical") {
      setScreen("critical_scene");
      broadcast({ type: "CASE_CRITICAL" });
    } else {
      setScreen("resolved");
      broadcast({ type: "CASE_RESOLVED", outcome: type });
      setTimeout(resetAll, 5000);
    }
  }

  function handleCaseStabilized() {
    setScreen("resolved");
    setOutcome("transport");
    broadcast({ type: "CASE_RESOLVED", outcome: "transport" });
    setTimeout(resetAll, 5000);
  }

  const countdownPct   = (countdown / 60) * 100;
  const circumference  = 2 * Math.PI * 54;

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4" dir="rtl">
      {/* Phone frame */}
      <div className="relative w-[375px] h-[812px] bg-black rounded-[50px] shadow-2xl overflow-hidden border-4 border-gray-800 flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-3xl z-50" />
        <div className="flex items-center justify-between px-8 pb-1 bg-black text-white text-xs z-40 flex-shrink-0" style={{ paddingTop: "28px" }}>
          <span className="font-semibold">9:41</span>
          <div className="flex items-center gap-1"><span>▪▪▪</span><span>WiFi</span><span>🔋</span></div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {screen === "home"          && <HomeScreen />}
          {screen === "alert"         && (
            <AlertScreen countdown={countdown} circumference={circumference} countdownPct={countdownPct}
              onAccept={handleAccept} onDecline={handleDecline} />
          )}
          {screen === "navigating"    && <NavigatingScreen onArrived={handleArrived} />}
          {screen === "arrived"       && <ArrivedScreen onOutcome={handleOutcome} />}
          {screen === "critical_scene"&& <CriticalOnSceneScreen onStabilized={handleCaseStabilized} />}
          {screen === "resolved"      && <ResolvedScreen outcome={outcome} responseTime={responseTime} />}
        </div>
      </div>
    </div>
  );
}

/* ─── Home ─────────────────────────────────────────────────── */
function HomeScreen() {
  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <div className="bg-saudi-green px-4 py-3 text-white flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><span className="text-sm">🕋</span></div>
            <span className="font-bold text-base">نسك</span>
          </div>
          <div className="text-xs text-green-200">٢٠ ذي الحجة ١٤٤٦</div>
        </div>
        <div className="bg-white/15 border border-white/30 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
          <span className="text-sm font-bold">متطوع طبي — نشط</span>
          <span className="text-xs text-green-200 mr-auto">د. أحمد الشهري</span>
        </div>
      </div>
      <div className="px-4 py-3 space-y-3 flex-1">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2 font-medium">تقدمك في أداء المناسك</p>
          <div className="flex justify-between mb-2">
            {["الإحرام","عرفة","المزدلفة","منى","الطواف"].map((s,i) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i<4?"bg-saudi-green text-white":"bg-gray-100 text-gray-400"}`}>
                  {i<4?"✓":(i+1).toString()}
                </div>
                <span className="text-[9px] text-gray-500">{s}</span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-saudi-green rounded-full" style={{width:"75%"}}/></div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2 font-medium">مواقيت الصلاة</p>
          <div className="grid grid-cols-5 gap-1 text-center">
            {[{name:"الفجر",time:"04:12"},{name:"الظهر",time:"12:15"},{name:"العصر",time:"15:32"},{name:"المغرب",time:"18:47"},{name:"العشاء",time:"20:17"}].map((p)=>(
              <div key={p.name} className="bg-gray-50 rounded-xl p-2">
                <p className="text-[9px] text-gray-500">{p.name}</p>
                <p className="text-xs font-bold text-gray-800">{p.time}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 font-medium">معسكرك</p>
          <p className="font-bold text-gray-800">منى — المخيم ٢١٧-أ</p>
          <p className="text-xs text-gray-500">المنطقة الثالثة • البعثة السعودية</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-center">
          <p className="text-xs text-blue-600 font-medium">أنت على أهبة الاستعداد للمساعدة</p>
          <p className="text-[10px] text-blue-400 mt-0.5">سيتم تنبيهك عند وجود حالة طارئة قريبة منك</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Alert ─────────────────────────────────────────────────── */
function AlertScreen({ countdown, circumference, countdownPct, onAccept, onDecline }: {
  countdown: number; circumference: number; countdownPct: number;
  onAccept: () => void; onDecline: () => void;
}) {
  const offset = circumference * (1 - countdownPct / 100);
  return (
    <div className="h-full flex flex-col items-center justify-between px-6 py-8"
      style={{ background: countdown % 2 === 0
        ? "linear-gradient(180deg,#dc2626 0%,#991b1b 100%)"
        : "linear-gradient(180deg,#b91c1c 0%,#7f1d1d 100%)", transition:"background 0.5s ease" }}>
      <div className="text-center text-white pt-2">
        <div className="text-5xl mb-3">🚨</div>
        <h1 className="text-2xl font-black mb-1">حالة طارئة قريبة منك</h1>
        <div className="flex items-center justify-center gap-2 text-red-200">
          <span className="text-lg">📍</span>
          <span className="text-base font-medium">٨٥م — شمال غرب</span>
        </div>
      </div>
      <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 w-full border border-white/20">
        <div className="text-white space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🫀</span>
            <div>
              <p className="font-black text-lg">ألم في الصدر</p>
              <p className="text-red-200 text-sm">يُحتمل سكتة قلبية • رجل، ٦٥ سنة</p>
            </div>
          </div>
          <div className="border-t border-white/20 pt-3 grid grid-cols-2 gap-3">
            <div><p className="text-red-300 text-xs mb-0.5">وصول الإسعاف</p><p className="font-bold text-lg">١١ دقيقة</p></div>
            <div><p className="text-red-300 text-xs mb-0.5">تأهيلك</p><p className="font-bold text-sm">طبيب طوارئ</p></div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8"/>
            <circle cx="60" cy="60" r="54" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{transition:"stroke-dashoffset 1s linear"}}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <span className="text-3xl font-black">{countdown}</span>
            <span className="text-xs text-red-200">ثانية</span>
          </div>
        </div>
      </div>
      <div className="w-full space-y-3">
        <button onClick={onAccept}
          className="w-full bg-white text-red-600 font-black py-4 rounded-2xl text-lg shadow-lg active:scale-95 transition-transform">
          🟢 أنا قادم
        </button>
        <button onClick={onDecline}
          className="w-full bg-white/20 border border-white/40 text-white font-bold py-3 rounded-2xl text-base active:scale-95 transition-transform">
          ⚪ لا أستطيع المساعدة
        </button>
      </div>
    </div>
  );
}

/* ─── Navigating ─────────────────────────────────────────────── */
function NavigatingScreen({ onArrived }: { onArrived: () => void }) {
  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex-1 relative bg-gray-700">
        <VolunteerNav/>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent h-24"/>
      </div>
      <div className="bg-gray-900 px-4 py-4 space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-black text-3xl">٨٥م</p>
            <p className="text-gray-400 text-sm">شمال غرب • تقدم مباشرة</p>
          </div>
          <div className="bg-saudi-green/20 border border-saudi-green/40 rounded-2xl px-4 py-2 text-center">
            <p className="text-saudi-green font-bold text-lg">~٩٠ث</p>
            <p className="text-xs text-gray-400">وقت الوصول</p>
          </div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-3 flex items-center gap-3">
          <span className="text-2xl">🫀</span>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">ألم في الصدر • رجل ٦٥ سنة</p>
            <p className="text-gray-400 text-xs">منى — الجمرات • المريض ينتظر</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="bg-gray-700 text-white font-medium py-3 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
            📞 اتصل بالمشغل
          </button>
          <button onClick={onArrived}
            className="bg-saudi-green text-white font-black py-3 rounded-2xl text-sm active:scale-95 transition-transform">
            تم الوصول ✓
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Arrived ─────────────────────────────────────────────────── */
function ArrivedScreen({ onOutcome }: { onOutcome: (t: OutcomeType) => void }) {
  return (
    <div className="h-full bg-gray-50 flex flex-col px-5 py-6">
      <div className="text-center mb-4">
        <div className="text-5xl mb-3">📋</div>
        <h2 className="text-xl font-black text-gray-800">وصلت إلى المريض</h2>
        <p className="text-gray-500 text-sm mt-1">اختر نتيجة الحالة الطبية</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 text-sm text-blue-800">
        <p className="font-bold mb-1">تذكير: إجراءات الإسعاف الأولي</p>
        <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
          <li>قيّم الوعي ومجرى الهواء</li>
          <li>تحقق من النبض والتنفس</li>
          <li>ابدأ CPR إذا لزم (٣٠ضغطة / ٢ نفس)</li>
          <li>استخدم AED إن وجد</li>
        </ul>
      </div>
      <p className="text-sm font-bold text-gray-700 mb-3">نتيجة الحالة:</p>
      <div className="space-y-3">
        <button onClick={() => onOutcome("stable")}
          className="w-full bg-green-50 border-2 border-green-400 text-green-800 font-bold py-4 rounded-2xl text-sm active:scale-95 transition-all hover:bg-green-100">
          🟢 حالة مستقرة — لا تحتاج إسعاف
        </button>
        <button onClick={() => onOutcome("transport")}
          className="w-full bg-yellow-50 border-2 border-yellow-400 text-yellow-800 font-bold py-4 rounded-2xl text-sm active:scale-95 transition-all hover:bg-yellow-100">
          🟡 تحتاج نقل للمستشفى — الإسعاف قادم
        </button>
        <button onClick={() => onOutcome("critical")}
          className="w-full bg-red-50 border-2 border-red-400 text-red-800 font-bold py-4 rounded-2xl text-sm active:scale-95 transition-all hover:bg-red-100">
          🔴 حالة حرجة — أحتاج دعم فوري
        </button>
      </div>
    </div>
  );
}

/* ─── Critical On Scene ──────────────────────────────────────── */
function CriticalOnSceneScreen({ onStabilized }: { onStabilized: () => void }) {
  return (
    <div className="h-full bg-red-950 flex flex-col px-5 py-6">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3 animate-pulse">🆘</div>
        <h2 className="text-xl font-black text-white">حالة حرجة — أنت على الموقع</h2>
        <p className="text-red-300 text-sm mt-1">تم إشعار غرفة التحكم • الإسعاف في الطريق</p>
      </div>

      <div className="bg-red-900/60 border border-red-700 rounded-2xl p-4 mb-4">
        <p className="text-white font-bold text-sm mb-2">استمر بالإسعاف الأولي:</p>
        <ul className="space-y-2 text-xs text-red-200">
          <li className="flex items-center gap-2"><span className="text-lg">💓</span> حافظ على CPR حتى وصول الإسعاف</li>
          <li className="flex items-center gap-2"><span className="text-lg">🫁</span> تأكد من انفتاح مجرى الهواء</li>
          <li className="flex items-center gap-2"><span className="text-lg">⚡</span> استخدم AED إذا توفر قريباً</li>
          <li className="flex items-center gap-2"><span className="text-lg">📍</span> ابقَ على الموقع حتى وصول الدعم</li>
        </ul>
      </div>

      <div className="bg-white/10 rounded-2xl p-3 mb-4 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse flex-shrink-0"/>
        <div>
          <p className="text-white text-sm font-bold">غرفة التحكم على علم بالموقف</p>
          <p className="text-red-300 text-xs">الإسعاف ETA: أقل من ٨ دقائق</p>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <a href="tel:911"
          className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2 active:scale-95 transition-all">
          📞 اتصل بالإسعاف — ٩١١
        </a>
        <button onClick={onStabilized}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl text-sm active:scale-95 transition-all">
          ✅ تم استقرار الحالة
        </button>
      </div>
    </div>
  );
}

/* ─── Resolved ───────────────────────────────────────────────── */
function ResolvedScreen({ outcome, responseTime }: { outcome: OutcomeType | null; responseTime: number }) {
  const config = {
    stable:    { icon: "🟢", text: "الحالة مستقرة" },
    transport: { icon: "🟡", text: "في طريقه للمستشفى" },
    critical:  { icon: "🔴", text: "تم الاستقرار بدعم الإسعاف" },
  };
  const c = outcome ? config[outcome] : config.stable;
  const minutes = Math.floor(responseTime / 60);
  const seconds = responseTime % 60;
  const timeStr = minutes > 0 ? `${minutes}د ${seconds}ث` : `${seconds} ثانية`;

  return (
    <div className="h-full bg-gradient-to-b from-saudi-green to-saudi-green-dark flex flex-col items-center justify-center px-6 text-center text-white">
      <div className="text-7xl mb-4">🤲</div>
      <h1 className="text-3xl font-black mb-2">تقبّل الله منك</h1>
      <p className="text-green-200 text-lg mb-8">جزاك الله خيراً على مساعدتك</p>
      <div className="bg-white/15 rounded-2xl p-5 w-full mb-6 space-y-3 border border-white/20">
        <div className="flex items-center justify-between">
          <span className="text-green-200 text-sm">وقت الاستجابة</span>
          <span className="font-black text-xl">{timeStr}</span>
        </div>
        <div className="border-t border-white/20"/>
        <div className="flex items-center justify-between">
          <span className="text-green-200 text-sm">نتيجة الحالة</span>
          <span className="font-bold text-sm bg-white/20 rounded-full px-3 py-0.5">{c.icon} {c.text}</span>
        </div>
      </div>
      <p className="text-green-200 text-xs">سيتم تحديث حالتك إلى نشط قريباً...</p>
    </div>
  );
}
