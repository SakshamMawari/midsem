"use client";

import { useEffect, useState } from "react";

// Official First Exam: Monday, 26 October 2026 at 02:00 PM (14:00) IST
const FIRST_EXAM_DATE = new Date("2026-10-26T14:00:00+05:30").getTime();

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export default function HeroExamCountdown() {
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

  return (
    <div className="hero-countdown-container" aria-label="Official Mid-Sem Exam Countdown" suppressHydrationWarning>
      {/* Top Banner Row */}
      <div className="hero-countdown-header">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="hero-countdown-title">First Exam Countdown</span>
          <span className="hero-countdown-target">26 Oct 2026, 02:00 PM IST</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hero-countdown-paper-pill">
            <span className="font-mono font-bold text-indigo-300">Paper 1: DMV</span>
          </span>
        </div>
      </div>

      {/* Large Digits Grid */}
      <div className="hero-countdown-grid" role="timer" aria-live="off" suppressHydrationWarning>
        {/* Days */}
        <div className="hero-clock-box">
          <span className="hero-clock-digit" suppressHydrationWarning>
            {timeRemaining ? String(timeRemaining.days).padStart(2, "0") : "--"}
          </span>
          <span className="hero-clock-label">Days</span>
        </div>

        <span className="hero-clock-separator" aria-hidden="true">:</span>

        {/* Hours */}
        <div className="hero-clock-box">
          <span className="hero-clock-digit" suppressHydrationWarning>
            {timeRemaining ? String(timeRemaining.hours).padStart(2, "0") : "--"}
          </span>
          <span className="hero-clock-label">Hours</span>
        </div>

        <span className="hero-clock-separator" aria-hidden="true">:</span>

        {/* Minutes */}
        <div className="hero-clock-box">
          <span className="hero-clock-digit" suppressHydrationWarning>
            {timeRemaining ? String(timeRemaining.minutes).padStart(2, "0") : "--"}
          </span>
          <span className="hero-clock-label">Minutes</span>
        </div>

        <span className="hero-clock-separator" aria-hidden="true">:</span>

        {/* Seconds */}
        <div className="hero-clock-box hero-clock-box-accent">
          <span className="hero-clock-digit" suppressHydrationWarning>
            {timeRemaining ? String(timeRemaining.seconds).padStart(2, "0") : "--"}
          </span>
          <span className="hero-clock-label">Seconds</span>
        </div>
      </div>

      {/* Bottom Sub-bar */}
      <div className="hero-countdown-footer">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Target: <strong>Data Mining &amp; Visualization</strong> (02:00 PM – 04:00 PM)</span>
        </div>
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          IIIT Sonepat 5th Sem Timetable
        </span>
      </div>
    </div>
  );
}
