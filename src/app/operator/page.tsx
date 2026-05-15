"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { createChannel, removeChannel, EMERGENCY_CHANNEL, EmergencyEvent } from "@/lib/supabase";
import { volunteers, ROUND1, ROUND2, EMERGENCY_LOCATION, matchLabel } from "@/lib/volunteers";
import dynamicImport from "next/dynamic";
import type { RealtimeChannel } from "@supabase/supabase-js";

const OperatorMap = dynamicImport(() => import("@/components/OperatorMap"), { ssr: false });

type DemoState = "idle" | "emergency" | "alerted" | "expanded" | "accepted" | "resolved";

export default function OperatorPage() {
  const [state, setState] = useState<DemoState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const waitRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const ch = createChannel(EMERGENCY_CHANNEL)
      .on("broadcast", { event: "state" }, ({ payload }) => {
        const ev = payload as EmergencyEvent;
        if (ev.type === "VOLUNTEER_ACCEPTED") {
          setState("accepted");
          stopWaitTimer();
        }
        if (ev.type === "VOLUNTEER_ARRIVED") setState((s) => s === "accepted" ? "resolved" : s);
        if (ev.type === "CASE_RESOLVED") {
          setState("idle");
          setElapsedSeconds(0);
          stopTimer();
          stopWaitTimer();
        }
      })
      .subscribe();
    channelRef.current = ch;
    return () => { removeChannel(ch); };
  }, []);

  const broadcast = (event: EmergencyEvent) =>
    channelRef.current?.send({ type: "broadcast", event: "state", payload: event });

  function startTimer() {
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function startWaitTimer() {
    setWaitSeconds(0);
    waitRef.current = setInterval(() => {
      setWaitSeconds((s) => {
        if (s + 1 >= 60) {
          stopWaitTimer();
          setState("expanded");
          // Auto-select round2 volunteers too
          setSelectedIds((prev) => {
            const next = new Set(prev);
            ROUND2.forEach((v) => next.add(v.id));
            return next;
          });
        }
        return s + 1;
      });
    }, 1000);
  }
  function stopWaitTimer() {
    if (waitRef.current) { clearInterval(waitRef.current); waitRef.current = null; }
  }

  function handleSimulateEmergency() {
    setSelectedIds(new Set(ROUND1.map((v) => v.id)));
    setState("emergency");
    startTimer();
    broadcast({ type: "EMERGENCY_TRIGGERED" });
  }

  function toggleVolunteer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSendAlert() {
    setState("alerted");
    startWaitTimer();
    broadcast({ type: "ALERT_SENT", volunteer: ROUND1[0].nameAr });
  }

  function handleResendExpanded() {
    setState("alerted");
    startWaitTimer();
    broadcast({ type: "ALERT_SENT", volunteer: ROUND1[0].nameAr });
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  const statusColor: Record<DemoState, string> = {
    idle:     "bg-gray-100 text-gray-600",
    emergency:"bg-red-100 text-red-700",
    alerted:  "bg-orange-100 text-orange-700",
    expanded: "bg-purple-100 text-purple-700",
    accepted: "bg-blue-100 text-blue-700",
    resolved: "bg-green-100 text-green-700",
  };
  const statusText: Record<DemoState, string> = {
    idle:     "في الانتظار",
    emergency:"حالة طارئة — اختر المتطوعين",
    alerted:  "تم الإرسال — انتظار القبول",
    expanded: "توسيع النطاق — لا يوجد رد",
    accepted: "المتطوع في الطريق",
    resolved: "تم التعامل مع الحالة",
  };

  const activeVolunteers = state === "expanded"
    ? [...ROUND1, ...ROUND2]
    : ROUND1;

  const highlightedIds = state !== "idle"
    ? (state === "expanded" ? [...ROUND1, ...ROUND2] : ROUND1).map((v) => v.id)
    : [];

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden" dir="rtl">
      {/* Header */}
      <header className="bg-saudi-green text-white px-6 py-3 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-saudi-green font-bold text-sm">ل</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">لبيك</h1>
            <p className="text-xs text-green-200">نظام نسك الميداني — غرفة التحكم</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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

          <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-x-3 gap-y-1">
            {[
              { color: "#3b82f6", label: "طبيب" },
              { color: "#22c55e", label: "ممرض" },
              { color: "#eab308", label: "مسعف" },
              { color: "#9ca3af", label: "طالب طب" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-xs text-gray-600">{l.label}</span>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {[...volunteers].sort((a, b) => a.distance - b.distance).map((v) => {
              const isHighlighted = highlightedIds.includes(v.id);
              return (
                <div
                  key={v.id}
                  className={`px-4 py-3 flex items-start gap-3 transition-colors ${isHighlighted ? "bg-amber-50" : "hover:bg-gray-50"}`}
                >
                  <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0 volunteer-dot-pulse"
                    style={{ backgroundColor: v.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{v.nameAr}</p>
                    <p className="text-xs text-gray-500">{v.qualificationAr}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{v.distance}م</p>
                  </div>
                  {isHighlighted && (
                    <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium flex-shrink-0">
                      {v.score}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-100">
            {state === "idle" && (
              <button onClick={handleSimulateEmergency}
                className="w-full bg-alert-red hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg active:scale-95">
                محاكاة حالة طارئة
              </button>
            )}
            {state === "alerted" && (
              <div className="text-center space-y-2">
                <div className="relative w-12 h-12 mx-auto">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#f97316" strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (waitSeconds / 60)}`}
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-orange-600">
                    {60 - waitSeconds}
                  </span>
                </div>
                <p className="text-xs text-gray-500">انتظار رد المتطوع...</p>
                <p className="text-xs text-gray-400">سيتم توسيع النطاق تلقائياً</p>
              </div>
            )}
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <OperatorMap
            showEmergency={state !== "idle"}
            volunteers={volunteers}
            emergencyLocation={EMERGENCY_LOCATION}
            highlightedIds={highlightedIds}
            radiusMeters={state === "expanded" || state === "alerted" ? (state === "expanded" ? 500 : 200) : 0}
          />

          {/* Emergency decision card */}
          {state === "emergency" && (
            <div className="absolute top-4 left-4 w-84 bg-white rounded-2xl shadow-2xl border border-red-100 animate-slide-in-right overflow-hidden z-[1000]"
              style={{ width: "22rem" }}>
              <div className="bg-alert-red text-white px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🚨</span>
                  <span className="font-bold text-lg">حالة طارئة</span>
                </div>
                <p className="text-red-100 text-sm">ألم في الصدر — رجل، ٦٥ سنة • منى الجمرات</p>
              </div>

              <div className="px-5 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-500 mb-0.5">نطاق البحث</p>
                    <p className="font-semibold text-gray-800">٢٠٠م</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="text-gray-500 mb-0.5">وصول الإسعاف</p>
                    <p className="font-bold text-red-600">١١ دقيقة</p>
                  </div>
                </div>

                <p className="text-xs font-bold text-gray-700 border-t pt-2">
                  اختر المتطوعين لإرسال التنبيه:
                </p>

                <div className="space-y-2">
                  {ROUND1.map((v, i) => (
                    <label key={v.id}
                      className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all border-2 ${
                        selectedIds.has(v.id) ? "border-saudi-green bg-green-50" : "border-gray-100 bg-gray-50"
                      }`}>
                      <input type="checkbox" checked={selectedIds.has(v.id)}
                        onChange={() => toggleVolunteer(v.id)}
                        className="mt-0.5 accent-[#0a7c47] w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            <p className="text-xs font-bold text-gray-800">{v.nameAr}</p>
                          </div>
                          <span className="text-sm font-black text-saudi-green">{v.score}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 mr-5">{v.qualificationAr}</p>
                        <div className="flex gap-2 text-xs text-gray-400 mt-1 mr-5">
                          <span>📍 {v.distance}م</span>
                          <span>•</span>
                          <span>{matchLabel(v.qualification)}</span>
                        </div>
                        <div className="h-1 bg-gray-200 rounded-full mt-1.5 mr-5 overflow-hidden">
                          <div className="h-full bg-saudi-green rounded-full"
                            style={{ width: `${v.score}%` }} />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <button onClick={handleSendAlert}
                  disabled={selectedIds.size === 0}
                  className="w-full bg-saudi-green hover:bg-saudi-green-dark disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md active:scale-95">
                  إرسال التنبيه ({selectedIds.size} متطوع)
                </button>
              </div>
            </div>
          )}

          {/* Alerted — waiting */}
          {state === "alerted" && (
            <div className="absolute top-4 left-4 w-72 bg-white rounded-2xl shadow-xl border border-orange-200 animate-slide-in-right z-[1000]">
              <div className="bg-orange-500 text-white px-5 py-3 rounded-t-2xl">
                <p className="font-bold">تم إرسال التنبيهات</p>
                <p className="text-xs text-orange-100">
                  يتوسع النطاق تلقائياً بعد {60 - waitSeconds} ثانية
                </p>
              </div>
              <div className="px-5 py-4 space-y-2">
                {ROUND1.filter((v) => selectedIds.has(v.id)).map((v) => (
                  <div key={v.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    <span className="text-sm text-gray-700">{v.nameAr}</span>
                    <span className="text-xs text-gray-400 mr-auto">في الانتظار...</span>
                  </div>
                ))}
                <div className="bg-orange-50 rounded-xl p-2 mt-2">
                  <div className="h-1.5 bg-orange-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(waitSeconds / 60) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expanded radius */}
          {state === "expanded" && (
            <div className="absolute top-4 left-4 bg-white rounded-2xl shadow-2xl border border-purple-200 animate-slide-in-right z-[1000]"
              style={{ width: "22rem" }}>
              <div className="bg-purple-600 text-white px-5 py-3 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <div>
                    <p className="font-bold">لا يوجد رد — توسيع النطاق</p>
                    <p className="text-xs text-purple-200">تم توسيع البحث إلى ٥٠٠م</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3">
                <p className="text-xs font-bold text-gray-700">متطوعون إضافيون — اختر من تريد إشعاره:</p>
                <div className="space-y-2">
                  {[...ROUND1, ...ROUND2].map((v) => {
                    const isR2 = ROUND2.find((r) => r.id === v.id);
                    return (
                      <label key={v.id}
                        className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer border-2 transition-all ${
                          selectedIds.has(v.id) ? "border-saudi-green bg-green-50" : "border-gray-100 bg-gray-50"
                        }`}>
                        <input type="checkbox" checked={selectedIds.has(v.id)}
                          onChange={() => toggleVolunteer(v.id)}
                          className="mt-0.5 accent-[#0a7c47] w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-800">{v.nameAr}</p>
                            <div className="flex items-center gap-1">
                              {isR2 && (
                                <span className="text-[9px] bg-purple-100 text-purple-600 rounded px-1">جديد</span>
                              )}
                              <span className="text-sm font-black text-saudi-green">{v.score}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">{v.qualificationAr} • {v.distance}م</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <button onClick={handleResendExpanded}
                  disabled={selectedIds.size === 0}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-all shadow active:scale-95">
                  إعادة الإرسال ({selectedIds.size} متطوع)
                </button>
              </div>
            </div>
          )}

          {/* Accepted */}
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
                    <p className="font-bold text-gray-800">{ROUND1[0].nameAr}</p>
                    <p className="text-xs text-gray-500">{ROUND1[0].qualificationAr}</p>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">وقت التدخل المتوقع</p>
                  <p className="text-2xl font-black text-blue-600">&lt;٩٠ ثانية</p>
                  <p className="text-xs text-gray-400 mt-1">مقارنةً بـ ١١ دقيقة للإسعاف</p>
                </div>
              </div>
            </div>
          )}

          {/* Resolved */}
          {state === "resolved" && (
            <div className="absolute top-4 left-4 w-72 bg-white rounded-2xl shadow-xl border border-green-200 animate-slide-in-right z-[1000]">
              <div className="bg-saudi-green text-white px-5 py-3 rounded-t-2xl">
                <p className="font-bold">🤲 تقبّل الله منك</p>
                <p className="text-xs text-green-100">تمت معالجة الحالة بنجاح</p>
              </div>
              <div className="px-5 py-4 text-center">
                <p className="text-4xl mb-2">✅</p>
                <p className="font-bold text-gray-800">وقت الاستجابة الكلي</p>
                <p className="text-2xl font-black text-saudi-green">{formatTime(elapsedSeconds)}</p>
                <p className="text-xs text-gray-400 mt-1">مقارنةً بـ ١١ دقيقة للإسعاف</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
