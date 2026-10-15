"use client";

// Watermelon UI `floating-input` (base) — adapted: label is tied to the input (htmlFor/id),
// supports a leading icon, rounded pill, 16px text (no iOS zoom), theme tokens throughout.

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
}

export function FloatingInput({ label, icon, className, id, onChange, ...props }: FloatingInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [hasValue, setHasValue] = useState(Boolean(props.value ?? props.defaultValue));

  return (
    <div className="relative">
      {icon && (
        <span aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-5 -translate-y-1/2">
          {icon}
        </span>
      )}
      <input
        id={inputId}
        className={cn(
          "peer bg-card h-14 w-full rounded-full border px-5 pt-4 text-base outline-none",
          "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-ring/30 transition-[border-color,box-shadow] duration-200 focus-visible:ring-4",
          icon && "pl-12",
          className,
        )}
        placeholder=" "
        onChange={(e) => {
          setHasValue(e.target.value !== "");
          onChange?.(e);
        }}
        {...props}
      />
      <label
        htmlFor={inputId}
        className={cn(
          "text-muted-foreground pointer-events-none absolute top-1/2 -translate-y-1/2 origin-left transition-transform duration-200 ease-(--ease-out)",
          icon ? "left-12" : "left-5",
          "peer-focus:-translate-y-[1.15rem] peer-focus:scale-[0.8]",
          hasValue && "-translate-y-[1.15rem] scale-[0.8]",
        )}
      >
        {label}
      </label>
    </div>
  );
}
