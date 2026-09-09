"use client";

const openDialogs = new Set<symbol>();

export function registerOpenDialog() {
  const id = Symbol();
  openDialogs.add(id);
  return () => { openDialogs.delete(id); };
}

export function hasOpenDialog() {
  return openDialogs.size > 0;
}
