import { prisma } from "@/lib/prisma";

export async function validateGenreIds(genreIds: string[]) {
  if (!genreIds.length) {
    return false;
  }

  const count = await prisma.genre.count({
    where: {
      id: {
        in: genreIds,
      },
    },
  });

  return count === genreIds.length;
}
