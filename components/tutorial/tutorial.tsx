"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = {
  title: string;
  description: string;
  selector?: string;
  placement?: "right" | "left" | "top" | "bottom" | "center";
};

const STEPS: Step[] = [
  {
    title: "Welcome to Hephaestus",
    description:
      "This is your VEX robotics inventory management system. We'll walk you through the key features in about 60 seconds.",
    placement: "center",
  },
  {
    title: "Dashboard",
    selector: '[data-tutorial="nav-dashboard"]',
    description:
      "The dashboard shows real-time inventory health across all teams — stock levels, low-stock alerts, reorder recommendations, and spending metrics.",
    placement: "right",
  },
  {
    title: "Inventory",
    selector: '[data-tutorial="nav-inventory"]',
    description:
      "Browse and manage parts allocated to each team. You can withdraw, return, or trade parts directly from this page.",
    placement: "right",
  },
  {
    title: "Withdrawals",
    selector: '[data-tutorial="nav-withdrawals"]',
    description:
      "Record when a team takes parts from the central supply. Every withdrawal is logged with a timestamp, quantity, and user ID.",
    placement: "right",
  },
  {
    title: "Trades",
    selector: '[data-tutorial="nav-trades"]',
    description:
      "Transfer parts between two teams. Trades are tracked with a full history so you can trace every movement.",
    placement: "right",
  },
  {
    title: "Catalog",
    selector: '[data-tutorial="nav-catalog"]',
    description:
      "Browse all 89 VEX V5 parts with search and category filters. Use this as your reference for part numbers and pricing.",
    placement: "right",
  },
  {
    title: "Settings",
    selector: '[data-tutorial="nav-settings"]',
    description:
      "Manage your profile, invite team members, and configure system preferences. Owner-only controls like bulk seeding are here too.",
    placement: "right",
  },
  {
    title: "You're all set!",
    description:
      "That covers the core of Hephaestus. Start by heading to the Dashboard for an overview, or jump straight to Inventory to see your parts.",
    placement: "center",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

function getRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

interface TutorialProps {
  onClose: () => void;
}

export function Tutorial({ onClose }: TutorialProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const updateRect = useCallback(() => {
    if (current.selector) {
      setRect(getRect(current.selector));
    } else {
      setRect(null);
    }
  }, [current.selector]);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => {
      updateRect();
      setVisible(true);
    }, 50);
    return () => clearTimeout(t);
  }, [step, updateRect]);

  useEffect(() => {
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [updateRect]);

  function next() {
    if (isLast) { onClose(); return; }
    setStep((s) => s + 1);
  }
  function back() {
    if (!isFirst) setStep((s) => s - 1);
  }

  // Card position logic
  const pad = 12;
  const cardW = 320;
  function cardStyle(): React.CSSProperties {
    if (!rect || current.placement === "center") {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: cardW,
      };
    }
    const placement = current.placement ?? "right";
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (placement === "right") {
      const left = Math.min(rect.left + rect.width + pad, vw - cardW - 16);
      const top = Math.max(16, Math.min(rect.top + rect.height / 2 - 80, vh - 200));
      return { position: "fixed", top, left, width: cardW };
    }
    if (placement === "left") {
      const left = Math.max(16, rect.left - cardW - pad);
      const top = Math.max(16, Math.min(rect.top + rect.height / 2 - 80, vh - 200));
      return { position: "fixed", top, left, width: cardW };
    }
    if (placement === "bottom") {
      const top = Math.min(rect.top + rect.height + pad, vh - 200);
      const left = Math.max(16, Math.min(rect.left + rect.width / 2 - cardW / 2, vw - cardW - 16));
      return { position: "fixed", top, left, width: cardW };
    }
    // top
    const top = Math.max(16, rect.top - 160 - pad);
    const left = Math.max(16, Math.min(rect.left + rect.width / 2 - cardW / 2, vw - cardW - 16));
    return { position: "fixed", top, left, width: cardW };
  }

  const spotlightPad = 10;
  const spotlightStyle: React.CSSProperties | undefined = rect
    ? {
        position: "fixed",
        top: rect.top - spotlightPad,
        left: rect.left - spotlightPad,
        width: rect.width + spotlightPad * 2,
        height: rect.height + spotlightPad * 2,
        borderRadius: 8,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
        border: "1.5px solid rgba(255,255,255,0.18)",
        pointerEvents: "none",
        transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
        zIndex: 49,
      }
    : undefined;

  return (
    <>
      {/* Full backdrop (only when no spotlight target) */}
      {!rect && (
        <div
          className="fixed inset-0 bg-black/70 z-40"
          style={{ transition: "opacity 0.3s" }}
          onClick={onClose}
        />
      )}

      {/* Spotlight cutout */}
      {rect && spotlightStyle && <div style={spotlightStyle} />}

      {/* Card */}
      <div
        ref={cardRef}
        style={{
          ...cardStyle(),
          opacity: visible ? 1 : 0,
          transform: `${!rect ? "translate(-50%, -50%)" : ""} translateY(${visible ? 0 : 8}px)`,
          transition: "opacity 0.25s ease, transform 0.25s ease",
          zIndex: 51,
        }}
        className="rounded-xl border border-white/10 bg-[#111] shadow-2xl shadow-black/60 p-5 space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">
              Step {step + 1} of {STEPS.length}
            </p>
            <h3 className="text-sm font-semibold text-white leading-snug">{current.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded p-1 text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 rounded-full bg-white/[0.08]">
          <div
            className="h-0.5 rounded-full bg-orange-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <p className="text-[13px] text-white/55 leading-relaxed">{current.description}</p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={back}
            disabled={isFirst}
            className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <Button
            size="sm"
            onClick={next}
            className="h-7 px-3 text-xs bg-white text-black hover:bg-white/90 gap-1"
          >
            {isLast ? "Done" : "Next"}
            {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </>
  );
}
