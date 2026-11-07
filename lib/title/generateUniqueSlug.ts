import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "./slugify";

export async function generateUniqueSlug(name: string) {
  const baseSlug = slugify(name);

  if (!baseSlug) {
    throw new Error("invalid title name");
  }

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.title.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
