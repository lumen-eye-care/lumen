"use client";

import { useState } from "react";
import { Icon } from "@/components/atoms/icon";

type FilterGroupProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function FilterGroup({
  title,
  defaultOpen = true,
  children,
}: FilterGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b py-4" style={{ borderColor: "var(--lm-hair)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
        style={{ color: "var(--lm-text)" }}
        aria-expanded={open}
      >
        {title}
        <Icon
          name="chev"
          size={14}
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--lm-faint)" }}
        />
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}
