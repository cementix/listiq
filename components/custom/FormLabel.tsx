const FormLabel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <label
      className={
        className || "mb-2 flex items-center gap-2 text-md w-full text-white/70"
      }
    >
      {children}
    </label>
  );
};

export default FormLabel;
