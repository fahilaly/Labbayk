"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { createChannel, removeChannel, EMERGENCY_CHANNEL, EmergencyEvent } from "@/lib/supabase";
import { volunteers, ROUND1_IDS, ROUND2_IDS, EMERGENCY_LOCATION, matchLabel } from "@/lib/volunteers";
import dynamicImport from "next/dynamic";
import type { RealtimeChannel } from "@supabase/supabase-js";

const OperatorMap = dynamicImport(() => import("@/components/OperatorMap"), { ssr: false });

type DemoState = "idle" | "emergency" | "alerted" | "expanded" | "accepted" | "resolved";

export default function OperatorPage() {
  const [state, setState]             = useState<DemoState>("idle");
  const [elapsedSeconds, setElapsed]  = useState(0);
  const [waitSeconds, setWait]        = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [declinedIds, setDeclinedIds] = useState<Set<string>>(new Set());
  const [visibleRange, setVisibleRange] = useState<"round1" | "all">("round1");

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

        if (ev.type === "VOLUNTEER_DECLINED") {
          const declinedName = ev.volunteer;
          setDeclinedIds((prev) => {
            const vol = volunteers.find((v) => v.nameAr === declinedName);
            if (!vol) return prev;
            const next = new Set(prev);
            next.add(vol.id);
            // remove from selected too
            setSelectedIds((sel) => { const s = new Set(sel); s.delete(vol.id); return s; });
            return next;
          });
          // Auto-alert next selected volunteer that hasn't declined
          setState("alerted");
        }

        if (ev.type === "VOLUNTEER_ARRIVED") setState((s) => s === "accepted" ? "resolved" : s);

        if (ev.type === "CASE_RESOLVED") {
          setState("idle");
          setElapsed(0);
          setDeclinedIds(new Set());
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
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function startWaitTimer() {
    setWait(0);
    if (waitRef.current) clearInterval(waitRef.current);
    waitRef.current = setInterval(() => {
      setWait((s) => {
        if (s + 1 >= 60) {
          stopWaitTimer();
          setState("expanded");
          setVisibleRange("all");
          setSelectedIds((prev) => {
            const next = new Set(prev);
            ROUND2_IDS.forEach((id) => next.add(id));
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
    const preselect = new Set(ROUND1_IDS);
    setSelectedIds(preselect);
    setDeclinedIds(new Set());
    setVisibleRange("round1");
    setState("emergency");
    startTimer();
    broadcast({ type: "EMERGENCY_TRIGGERED" });
  }

  function toggleVolunteer(id: string) {
    if (declinedIds.has(id)) return; // can't re-select declined
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
    const first = volunteers.find((v) => selectedIds.has(v.id));
    broadcast({ type: "ALERT_SENT", volunteer: first?.nameAr ?? "" });
  }

  function handleResend() {
    setState("alerted");
    startWaitTimer();
    const first = volunteers.find((v) => selectedIds.has(v.id) && !declinedIds.has(v.id));
    broadcast({ type: "ALERT_SENT", volunteer: first?.nameAr ?? "" });
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  const statusColor: Record<DemoState, string> = {
    idle:      "bg-gray-100 text-gray-600",
    emergency: "bg-red-100 text-red-700",
    alerted:   "bg-orange-100 text-orange-700",
    expanded:  "bg-purple-100 text-purple-700",
    accepted:  "bg-blue-100 text-blue-700",
    resolved:  "bg-green-100 text-green-700",
  };
  const statusText: Record<DemoState, string> = {
    idle:      "في الانتظار",
    emergency: "حالة طارئة — اختر المتطوعين",
    alerted:   "تم الإرسال — انتظار القبول",
    expanded:  "توسيع النطاق — لا يوجد رد",
    accepted:  "المتطوع في الطريق",
    resolved:  "تم التعامل مع الحالة",
  };

  const displayedVolunteers = visibleRange === "all"
    ? [...volunteers].filter((v) => v.distance <= 500).sort((a, b) => b.score - a.score)
    : [...volunteers].filter((v) => ROUND1_IDS.includes(v.id)).sort((a, b) => b.score - a.score);

  const highlightedIds = state !== "idle"
    ? volunteers.filter((v) => selectedIds.has(v.id)).map((v) => v.id)
    : [];

  const radiusMeters = state === "expanded" ? 500 : state === "alerted" ? 200 : 0;

  const activeSelected = [...selectedIds].filter((id) => !declinedIds.has(id));

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden" dir="rtl">
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
              const isDeclined = declinedIds.has(v.id);
              return (
                <div key={v.id} className={`px-4 py-3 flex items-start gap-3 transition-colors ${
                  isDeclined ? "bg-red-50 opacity-60" : isHighlighted ? "bg-amber-50" : "hover:bg-gray-50"
                }`}>
                  <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0 volunteer-dot-pulse"
                    style={{ backgroundColor: isDeclined ? "#ef4444" : v.color }} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDeclined ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {v.nameAr}
                    </p>
                    <p className="text-xs text-gray-500">{v.qualificationAr}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{v.distance}م</p>
                  </div>
                  {isDeclined && <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5">رفض</span>}
                  {!isDeclined && isHighlighted && (
                    <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">{v.score}</span>
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
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4"/>
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#f97316" strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (waitSeconds / 60)}`}
                      style={{ transition: "stroke-dashoffset 1s linear" }}/>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-orange-600">
                    {60 - waitSeconds}
                  </span>
                </div>
                <p className="text-xs text-gray-500">انتظار رد المتطوع...</p>
                <p className="text-xs text-gray-400">توسيع النطاق بعد {60 - waitSeconds}ث</p>
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
            declinedIds={[...declinedIds]}
            radiusMeters={radiusMeters}
          />

          {/* Emergency — selection card */}
          {(state === "emergency" || state === "expanded") && (
            <div className="absolute top-4 left-4 bg-white rounded-2xl shadow-2xl border border-red-100 animate-slide-in-right overflow-hidden z-[1000] flex flex-col"
              style={{ width: "22rem", maxHeight: "calc(100vh - 100px)" }}>
              <div className={`text-white px-5 py-3 flex-shrink-0 ${state === "expanded" ? "bg-purple-600" : "bg-alert-red"}`}>
                <div className="flex items-center gap-2">
                  <span>{state === "expanded" ? "⚠️" : "🚨"}</span>
                  <div>
                    <p className="font-bold">{state === "expanded" ? "توسيع النطاق — ٥٠٠م" : "حالة طارئة"}</p>
                    <p className={`text-xs ${state === "expanded" ? "text-purple-200" : "text-red-100"}`}>
                      ألم في الصدر • رجل ٦٥ سنة • إسعاف ١١ دقيقة
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 flex-shrink-0 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-700">
                  اختر من تريد إشعاره — <span className="text-saudi-green">{activeSelected.length} محدد</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">انقر على أي متطوع لتحديده أو إلغائه</p>
              </div>

              <div className="overflow-y-auto flex-1 px-4 py-2 space-y-2">
                {displayedVolunteers.map((v, i) => {
                  const isSelected = selectedIds.has(v.id);
                  const isDeclined = declinedIds.has(v.id);
                  const isNew = state === "expanded" && ROUND2_IDS.includes(v.id);
                  return (
                    <button key={v.id} onClick={() => toggleVolunteer(v.id)} disabled={isDeclined}
                      className={`w-full text-right flex items-start gap-3 p-2.5 rounded-xl border-2 transition-all ${
                        isDeclined ? "border-red-200 bg-red-50 opacity-50 cursor-not-allowed" :
                        isSelected ? "border-saudi-green bg-green-50 shadow-sm" :
                        "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isDeclined ? "border-red-400 bg-red-100" :
                        isSelected ? "border-saudi-green bg-saudi-green" : "border-gray-300"
                      }`}>
                        {isDeclined ? <span className="text-red-500 text-xs">✕</span> :
                          isSelected ? <span className="text-white text-xs">✓</span> : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-xs font-bold truncate ${isDeclined ? "line-through text-gray-400" : "text-gray-800"}`}>
                              {v.nameAr}
                            </p>
                            {isNew && <span className="text-[9px] bg-purple-100 text-purple-600 rounded px-1 flex-shrink-0">جديد</span>}
                            {isDeclined && <span className="text-[9px] bg-red-100 text-red-600 rounded px-1 flex-shrink-0">رفض</span>}
                          </div>
                          <span className="text-sm font-black text-saudi-green flex-shrink-0 mr-1">{v.score}</span>
                        </div>
                        <p className="text-xs text-gray-500">{v.qualificationAr}</p>
                        <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                          <span>📍 {v.distance}م</span>
                          <span>•</span>
                          <span>{matchLabel(v.qualification)}</span>
                        </div>
                        <div className="h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${v.score}%`, backgroundColor: v.color }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={state === "expanded" ? handleResend : handleSendAlert}
                  disabled={activeSelected.length === 0}
                  className={`w-full text-white font-bold py-3 rounded-xl text-sm transition-all shadow active:scale-95 disabled:bg-gray-300 ${
                    state === "expanded" ? "bg-purple-600 hover:bg-purple-700" : "bg-saudi-green hover:bg-saudi-green-dark"
                  }`}>
                  {state === "expanded" ? "إعادة الإرسال" : "إرسال التنبيه"} ({activeSelected.length} متطوع)
                </button>
              </div>
            </div>
          )}

          {/* Alerted */}
          {state === "alerted" && (
            <div className="absolute top-4 left-4 w-72 bg-white rounded-2xl shadow-xl border border-orange-200 animate-slide-in-right z-[1000]">
              <div className="bg-orange-500 text-white px-5 py-3 rounded-t-2xl">
                <p className="font-bold">تم إرسال التنبيهات</p>
                <p className="text-xs text-orange-100">توسيع النطاق بعد {60 - waitSeconds} ثانية</p>
              </div>
              <div className="px-5 py-4 space-y-2">
                {volunteers.filter((v) => selectedIds.has(v.id)).map((v) => {
                  const isDeclined = declinedIds.has(v.id);
                  return (
                    <div key={v.id} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isDeclined ? "bg-red-400" : "bg-orange-400 animate-pulse"}`} />
                      <span className={`text-sm ${isDeclined ? "line-through text-gray-400" : "text-gray-700"}`}>
                        {v.nameAr}
                      </span>
                      <span className="text-xs text-gray-400 mr-auto">
                        {isDeclined ? "رفض ❌" : "في الانتظار..."}
                      </span>
                    </div>
                  );
                })}
                <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-orange-400 rounded-full transition-all duration-1000"
                    style={{ width: `${(waitSeconds / 60) * 100}%` }} />
                </div>
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
                    <p className="font-bold text-gray-800">{volunteers.find(v => v.id === ROUND1_IDS[0])?.nameAr}</p>
                    <p className="text-xs text-gray-500">{volunteers.find(v => v.id === ROUND1_IDS[0])?.qualificationAr}</p>
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
