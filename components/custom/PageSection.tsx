import clsx from "clsx";
import React from "react";

const PageSection = ({
  children,
  className,
}: React.PropsWithChildren & { className?: string }) => {
  return (
    <section className={clsx("space-y-6 px-24 pt-8 pb-6", className)}>
      {children}
    </section>
  );
};

export default PageSection;
