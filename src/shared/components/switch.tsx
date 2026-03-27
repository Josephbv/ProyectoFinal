"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

function Switch({
  className,
  checked,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  // Asegurarnos de tener el valor de checked
  const isChecked = checked || (props as any)['data-state'] === 'checked';

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      checked={checked}
      className={cn(
        "peer inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)]",
        className,
      )}
      style={{
        backgroundColor: isChecked ? '#00d084' : '#ff5a5f'
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-white pointer-events-none block h-6 w-6 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] ring-0 transition-all duration-300"
        )}
        style={{
          transform: isChecked ? 'translateX(28px)' : 'translateX(2px)'
        }}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
