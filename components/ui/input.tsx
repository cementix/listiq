import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex min-w-0 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-base sm:text-sm backdrop-blur transition-all focus:border-primary focus:ring-1 focus:ring-primary/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
