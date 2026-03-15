import React from "react";

const PageSection = ({ children }: React.PropsWithChildren) => {
  return <section className="space-y-6 px-24 pt-8">{children}</section>;
};

export default PageSection;
