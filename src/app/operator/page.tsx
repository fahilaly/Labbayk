"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { supabase, EMERGENCY_CHANNEL, EmergencyEvent } from "@/lib/supabase";
import { volunteers, TOP_3, EMERGENCY_LOCATION, matchLabel } from "@/lib/volunteers";
import dynamicImport from "next/dynamic";

const OperatorMap = dynamicImport(() => import("@/components/OperatorMap"), { ssr: false });

type DemoState = "idle" | "emergency" | "alerted" | "accepted" | "resolved";

export default function OperatorPage() {
  const [state, setState] = useState<DemoState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const broadcast = async (event: EmergencyEvent) => {
    await supabase.channel(EMERGENCY_CHANNEL).send({
      type: "broadcast",
      event: "state",
      payload: event,
    });
  };

  // Listen for volunteer-side responses
  useEffect(() => {
    const channel = supabase
      .channel(EMERGENCY_CHANNEL)
      .on("broadcast", { event: "state" }, ({ payload }) => {
        const ev = payload as EmergencyEvent;
        if (ev.type === "VOLUNTEER_ACCEPTED") setState("accepted");
        if (ev.type === "VOLUNTEER_ARRIVED") setState((s) => (s === "accepted" ? "resolved" : s));
        if (ev.type === "CASE_RESOLVED") {
          setState("idle");
          setElapsedSeconds(0);
          stopTimer();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function startTimer() {
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function handleSimulateEmergency() {
    setState("emergency");
    startTimer();
    broadcast({ type: "EMERGENCY_TRIGGERED" });
  }

  async function handleSendAlert() {
    setState("alerted");
    await broadcast({ type: "ALERT_SENT", volunteer: TOP_3[0].nameAr });
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  const statusColor = {
    idle: "bg-gray-100 text-gray-600",
    emergency: "bg-red-100 text-red-700",
    alerted: "bg-orange-100 text-orange-700",
    accepted: "bg-blue-100 text-blue-700",
    resolved: "bg-green-100 text-green-700",
  };

  const statusText = {
    idle: "في الانتظار",
    emergency: "حالة طارئة — تحديد المتطوعين",
    alerted: "تم الإرسال — انتظار القبول",
    accepted: "المتطوع في الطريق",
    resolved: "تم التعامل مع الحالة",
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden" dir="rtl">
      {/* Header */}
      <header className="bg-saudi-green text-white px-6 py-3 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-saudi-green font-bold text-sm">ل</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">لبيك</h1>
            <p className="text-xs text-green-200">نظام نسك الميداني — غرفة التحكم</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {state !== "idle" && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-400 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-sm font-medium text-red-200">{formatTime(elapsedSeconds)}</span>
            </div>
          )}
          <div className={`rounded-full px-4 py-1 text-sm font-medium ${statusColor[state]}`}>
            {statusText[state]}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-l border-gray-200 flex flex-col shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 text-sm">المتطوعون النشطون</h2>
            <p className="text-xs text-gray-500 mt-0.5">{volunteers.length} متطوع في المنطقة</p>
          </div>

          {/* Legend */}
          <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-x-3 gap-y-1">
            {[
              { color: "#3b82f6", label: "طبيب" },
              { color: "#22c55e", label: "ممرض" },
              { color: "#eab308", label: "مسعف" },
              { color: "#9ca3af", label: "طالب طب" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: l.color }} />
                <span className="text-xs text-gray-600">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Volunteer list */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {[...volunteers]
              .sort((a, b) => a.distance - b.distance)
              .map((v) => (
                <div
                  key={v.id}
                  className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                    state !== "idle" && TOP_3.find((t) => t.id === v.id) ? "bg-amber-50" : ""
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0 volunteer-dot-pulse"
                    style={{ backgroundColor: v.color, boxShadow: `0 0 0 0 ${v.ring}` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{v.nameAr}</p>
                    <p className="text-xs text-gray-500">{v.qualificationAr}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{v.distance}م بُعداً</p>
                  </div>
                  {state !== "idle" && TOP_3.find((t) => t.id === v.id) && (
                    <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium flex-shrink-0">
                      {v.score}
                    </span>
                  )}
                </div>
              ))}
          </div>

          {/* Action button */}
          <div className="p-4 border-t border-gray-100">
            {state === "idle" && (
              <button
                onClick={handleSimulateEmergency}
                className="w-full bg-alert-red hover:bg-red-700 active:bg-red-800 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                محاكاة حالة طارئة
              </button>
            )}
            {(state === "alerted" || state === "accepted") && (
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-saudi-green border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">
                  {state === "alerted" ? "انتظار رد المتطوع..." : "المتطوع في الطريق"}
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Map area */}
        <main className="flex-1 relative">
          <OperatorMap
            showEmergency={state !== "idle"}
            volunteers={volunteers}
            emergencyLocation={EMERGENCY_LOCATION}
            highlightedIds={state !== "idle" ? TOP_3.map((v) => v.id) : []}
          />

          {/* Emergency decision card */}
          {state === "emergency" && (
            <div className="absolute top-4 left-4 w-80 bg-white rounded-2xl shadow-2xl border border-red-100 animate-slide-in-right overflow-hidden z-[1000]">
              {/* Red header */}
              <div className="bg-alert-red text-white px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🚨</span>
                  <span className="font-bold text-lg">حالة طارئة</span>
                </div>
                <p className="text-red-100 text-sm">ألم في الصدر — رجل، ٦٥ سنة</p>
              </div>

              <div className="px-5 py-4 space-y-3">
                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-500 mb-0.5">الموقع</p>
                    <p className="font-semibold text-gray-800">منى — الجمرات</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="text-gray-500 mb-0.5">وصول الإسعاف</p>
                    <p className="font-bold text-red-600">١١ دقيقة</p>
                  </div>
                </div>

                <p className="text-xs font-bold text-gray-700 border-t pt-3">أقرب ٣ متطوعين مؤهلين:</p>

                {/* Top 3 */}
                <div className="space-y-2">
                  {TOP_3.map((v, i) => (
                    <div key={v.id} className="bg-gray-50 rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{v.nameAr}</p>
                            <p className="text-xs text-gray-500">{v.qualificationAr}</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-saudi-green">{v.score}</span>
                      </div>
                      <div className="flex gap-2 text-xs text-gray-500 mb-1.5">
                        <span>📍 {v.distance}م</span>
                        <span>•</span>
                        <span>مطابقة: {matchLabel(v.qualification)}</span>
                      </div>
                      {/* Score bar */}
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-saudi-green rounded-full transition-all duration-1000"
                          style={{ width: `${v.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSendAlert}
                  className="w-full bg-saudi-green hover:bg-saudi-green-dark text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg active:scale-95 mt-1"
                >
                  إرسال التنبيه للثلاثة
                </button>
              </div>
            </div>
          )}

          {/* Alerted state info */}
          {state === "alerted" && (
            <div className="absolute top-4 left-4 w-72 bg-white rounded-2xl shadow-xl border border-orange-200 animate-slide-in-right z-[1000]">
              <div className="bg-orange-500 text-white px-5 py-3 rounded-t-2xl">
                <p className="font-bold">تم إرسال التنبيهات</p>
                <p className="text-xs text-orange-100">انتظار رد المتطوعين...</p>
              </div>
              <div className="px-5 py-4 space-y-2">
                {TOP_3.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    <span className="text-sm text-gray-700">{v.nameAr}</span>
                    <span className="text-xs text-gray-400 mr-auto">إرسال...</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted state */}
          {state === "accepted" && (
            <div className="absolute top-4 left-4 w-72 bg-white rounded-2xl shadow-xl border border-blue-200 animate-slide-in-right z-[1000]">
              <div className="bg-blue-600 text-white px-5 py-3 rounded-t-2xl">
                <p className="font-bold">✅ تم القبول</p>
                <p className="text-xs text-blue-100">المتطوع في الطريق للمريض</p>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">👨‍⚕️</div>
                  <div>
                    <p className="font-bold text-gray-800">{TOP_3[0].nameAr}</p>
                    <p className="text-xs text-gray-500">{TOP_3[0].qualificationAr}</p>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">المسافة للمريض</p>
                  <p className="text-2xl font-black text-blue-600">٨٥م</p>
                  <p className="text-xs text-gray-400">وقت التدخل المتوقع: &lt;٩٠ ثانية</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
