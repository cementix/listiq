import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex h-10 min-h-28 w-full select-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm backdrop-blur transition-all focus:border-primary focus:ring-1 focus:ring-primary/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
