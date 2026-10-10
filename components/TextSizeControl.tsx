"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useLanguage } from "./LanguageProvider";

const STORAGE_KEY = "rufact.text-size.v1";
const sizes = ["normal", "large", "larger"] as const;
type TextSize = (typeof sizes)[number];
const CHANGE_EVENT = "rufact-text-size";

function readSize(): TextSize {
  const value = document.documentElement.dataset.textSize;
  return sizes.includes(value as TextSize) ? value as TextSize : "normal";
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

function defaultSize(): TextSize { return "normal"; }

const labels = {
  uz: { title: "Matn o‘lchami", normal: "Oddiy", large: "Katta", larger: "Juda katta" },
  ru: { title: "Размер текста", normal: "Обычный", large: "Крупный", larger: "Очень крупный" },
  en: { title: "Text size", normal: "Default", large: "Large", larger: "Larger" },
};

export function TextSizeControl() {
  const { locale } = useLanguage();
  const copy = labels[locale];
  const size = useSyncExternalStore(subscribe, readSize, defaultSize);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (sizes.includes(saved as TextSize)) {
        document.documentElement.setAttribute("data-text-size", saved as TextSize);
        window.dispatchEvent(new Event(CHANGE_EVENT));
      }
    } catch { /* Reading still works when browser storage is unavailable. */ }
  }, []);

  function changeSize(nextSize: TextSize) {
    document.documentElement.setAttribute("data-text-size", nextSize);
    window.dispatchEvent(new Event(CHANGE_EVENT));
    try { localStorage.setItem(STORAGE_KEY, nextSize); } catch { /* Session-only preference. */ }
  }

  return (
    <fieldset className="text-size-control flex flex-wrap items-center justify-between gap-2">
      <legend className="sr-only">{copy.title}</legend>
      <span className="text-sm font-semibold">{copy.title}</span>
      <div className="inline-flex gap-1 rounded-xl border border-[#d7d8d3] bg-white/70 p-1">
        {sizes.map((value, index) => (
          <button
            key={value}
            type="button"
            aria-label={`${copy.title}: ${copy[value]}`}
            aria-pressed={size === value}
            onClick={() => changeSize(value)}
            className={`focus-ring min-h-11 min-w-11 rounded-lg px-2 font-bold ${size === value ? "bg-ink-deep text-white" : "text-ink hover:bg-[#e6edf3]"}`}
          >
            <span aria-hidden="true" style={{ fontSize: `${14 + index * 3}px` }}>A{index === 0 ? "" : "+".repeat(index)}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
