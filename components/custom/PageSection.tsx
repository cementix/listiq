import React from "react";
import { cn } from "@/lib/utils";

const PageSection = ({
  children,
  className,
}: React.PropsWithChildren & { className?: string }) => {
  return (
    <section className={cn("mx-auto min-w-0 w-full max-w-[1600px] space-y-5 px-4 pt-5 pb-6 sm:space-y-6 sm:px-6 sm:pt-8 lg:px-8", className)}>
      {children}
    </section>
  );
};

export default PageSection;
