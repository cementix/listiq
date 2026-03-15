import React from "react";
import clsx from "clsx";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
};

const GlassCard = ({ children, className }: GlassCardProps) => {
  return (
    <div
      className={clsx(
        "rounded-3xl border border-white/10 bg-white/5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.07] hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
