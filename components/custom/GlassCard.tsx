import React from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = {
  children?: React.ReactNode;
  className?: string;
};

const GlassCard = ({ children, className }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl p-4 sm:rounded-3xl border border-white/10 bg-white/5 transition-all duration-300 ease-out hover:border-white/15 hover:bg-white/[0.07]",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
