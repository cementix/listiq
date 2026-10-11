// Next provides this marker at build time; unit tests do not load client code.
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { url: "data:text/javascript,export {};", shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
