import React from "react";

const MainButton = ({
  disabled,
  type,
  className,
  children,
}: {
  disabled?: boolean;
  type?: "submit" | "reset" | "button" | undefined;
  className?: string;
  children: React.ReactNode;
}) => {
  const baseStyles =
    "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-medium text-primary-foreground  transition-all duration-200 hover:-translate-y-[1px]  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <button type={type} disabled={disabled} className={className || baseStyles}>
      <span className="relative flex flex-1 text-center w-full items-center justify-center">
        {children}
      </span>
    </button>
  );
};

export default MainButton;
