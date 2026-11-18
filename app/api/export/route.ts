import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Downloads everything the signed-in member created, as portable JSON. */
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ ok: false }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      username: true,
      email: true,
      plan: true,
      createdAt: true,
      libraryPublic: true,
      reviewsPublic: true,
      statsPublic: true,
      postsPublic: true,
      library: {
        orderBy: { createdAt: "asc" },
        select: {
          rating: true,
          note: true,
          createdAt: true,
          updatedAt: true,
          title: { select: { name: true, slug: true, type: true, year: true } },
        },
      },
      titleLists: {
        orderBy: { createdAt: "asc" },
        select: {
          title: true,
          slug: true,
          description: true,
          visibility: true,
          systemType: true,
          createdAt: true,
          items: { orderBy: { position: "asc" }, select: { position: true, title: { select: { name: true, slug: true, type: true, year: true } } } },
        },
      },
      profilePosts: { orderBy: { createdAt: "asc" }, select: { content: true, createdAt: true } },
    },
  });
  if (!user) return Response.json({ ok: false }, { status: 404 });

  const payload = {
    format: "listiq-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    ...user,
  };
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="listiq-${user.username}-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
