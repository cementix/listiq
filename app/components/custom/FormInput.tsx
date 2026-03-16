const FormInput = ({
  type,
  name,
  placeholder,
  required,
  className,
}: {
  type: string;
  name: string;
  placeholder: string;
  required?: boolean;
  className?: string;
}) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      required={required || false}
      className={
        className ||
        "w-full rounded-md border border-border/60 bg-background/60 px-3 py-1.5 text-sm text-foreground/90 placeholder:text-xs placeholder:text-muted-foreground/70 outline-none transition-all duration-200 focus:-translate-y-px focus:border-ring focus:bg-background/80 focus:shadow-[0_0_0_1px_rgba(129,140,248,0.45)] focus:placeholder:text-muted-foreground/40"
      }
    />
  );
};

export default FormInput;
