"use client";

import { useEffect, useState } from "react";

// First Exam: 26 October 2026 at 02:00 PM (14:00) IST
const FIRST_EXAM_DATE = new Date("2026-10-26T14:00:00+05:30").getTime();

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export default function ExamCountdown() {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    function calculate() {
      const now = new Date().getTime();
      const difference = FIRST_EXAM_DATE - now;

      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, isPast: false });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeRemaining) {
    return (
      <div className="countdown-bar">
        <div className="countdown-inner">
          <span className="text-xs text-zinc-500">Loading exam countdown...</span>
        </div>
      </div>
    );
  }

  return (
    <aside className="countdown-bar" aria-label="First exam countdown">
      <div className="countdown-inner">
        <div className="countdown-label">
          <span className="countdown-dot" aria-hidden="true" />
          <span className="font-semibold text-zinc-200">First Mid-Sem Exam:</span>
          <span className="text-zinc-400 hidden sm:inline">26 Oct 2026, 02:00 PM</span>
        </div>

        {timeRemaining.isPast ? (
          <span className="text-xs font-semibold text-emerald-400">Exams in progress or completed</span>
        ) : (
          <div className="countdown-clock" role="timer" aria-live="off">
            <div className="countdown-unit">
              <span className="countdown-num">{String(timeRemaining.days).padStart(2, "0")}</span>
              <span className="countdown-text">Days</span>
            </div>
            <span className="countdown-sep">:</span>
            <div className="countdown-unit">
              <span className="countdown-num">{String(timeRemaining.hours).padStart(2, "0")}</span>
              <span className="countdown-text">Hours</span>
            </div>
            <span className="countdown-sep">:</span>
            <div className="countdown-unit">
              <span className="countdown-num">{String(timeRemaining.minutes).padStart(2, "0")}</span>
              <span className="countdown-text">Min</span>
            </div>
            <span className="countdown-sep">:</span>
            <div className="countdown-unit">
              <span className="countdown-num">{String(timeRemaining.seconds).padStart(2, "0")}</span>
              <span className="countdown-text">Sec</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
