import { prisma } from "@/lib/prisma";

export default async function getGenres() {
  const genres = await prisma.genre.findMany();
  return genres;
}
