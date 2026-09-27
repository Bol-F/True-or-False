"use client";

import { motion } from "framer-motion";
import {
  HeartPulse,
  Megaphone,
  MessageCircle,
  Newspaper,
  type LucideIcon,
} from "lucide-react";

export interface TextExample {
  id: string;
  label: string;
  text: string;
  icon: "news" | "social" | "medical" | "politics";
}

const iconByKind: Record<TextExample["icon"], LucideIcon> = {
  news: Newspaper,
  social: MessageCircle,
  medical: HeartPulse,
  politics: Megaphone,
};

interface ExampleChipsProps {
  examples: readonly TextExample[];
  activeId: string | null;
  disabled?: boolean;
  onSelect: (example: TextExample) => void;
}

export function ExampleChips({
  examples,
  activeId,
  disabled = false,
  onSelect,
}: ExampleChipsProps) {
  return (
    <div className="mt-3">
      <p className="mb-2 text-[12px] font-medium text-[#718097]">
        Попробуйте пример:
      </p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Примеры текстов">
        {examples.map((example) => {
          const Icon = iconByKind[example.icon];
          const isActive = example.id === activeId;

          return (
            <motion.button
              key={example.id}
              type="button"
              whileHover={disabled ? undefined : { y: -1 }}
              whileTap={disabled ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.14 }}
              disabled={disabled}
              aria-pressed={isActive}
              onClick={() => onSelect(example)}
              className={`focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-xl border px-2.5 text-[10.5px] font-semibold transition-colors xl:text-[11px] ${
                isActive
                  ? "border-[#b7c8d8] bg-[#e9f0f6] text-ink"
                  : "border-transparent bg-[#f0f1f1] text-[#425167] hover:bg-[#e8ebed]"
              } disabled:cursor-not-allowed disabled:opacity-55`}
            >
              <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
              {example.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
