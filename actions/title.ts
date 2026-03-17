"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { safeParse, z } from "zod";

const titleSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  year: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return undefined;
      return Number(val);
    }),
  descripton: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  type: z.enum([
    "MOVIE",
    "SERIES",
    "ANIME",
    "MANGA",
    "MANHWA",
    "BOOK",
    "GAME",
    "NOVEL",
    "COMIC",
    "OTHER",
  ]),
  genre: z.string().trim().optional(),
});

export type TitleActionState = {
  ok: boolean;
  error?: string;
  success?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function submitTitle(
  _prevState: TitleActionState,
  formData: FormData,
): Promise<TitleActionState> {
  const session = await getSession();

  if (!session) {
    return {
      ok: false,
      error: "unauthorized",
    };
  }

  const parsed = titleSchema.safeParse({
    name: formData.get("name"),
    year: formData.get("year"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    type: formData.get("type"),
    genre: formData.get("genre"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "invalid fields",
    };
  }

  const data = parsed.data;

  const existingTitlte = await prisma.title.findFirst({
    where: {
      name: {
        equals: data.name,
        mode: "insensitive",
      },
      type: data.type,
    },
  });

  if (existingTitlte) {
    return {
      ok: false,
      error: "this title already exists",
    };
  }

  await prisma.titleSubmission.create({
    data: {
      name: data.name,
      year: data.year,
      description: data.descripton || null,
      imageUrl: data.imageUrl || null,
      type: data.type,
      genre: data.genre || null,
      submittedById: session.userId,
    },
  });

  revalidatePath("/dashboard");

  return {
    ok: true,
    success: "title submitted for review",
  };
}

export async function createTitleDirectly(
  _prevState: TitleActionState,
  formData: FormData,
): Promise<TitleActionState> {
  const session = await getSession();

  if (!session) {
    return {
      ok: false,
      error: "unauthorized",
    };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (
    !currentUser ||
    !["ADMIN", "MODERATOR", "VERIFIED"].includes(currentUser.role)
  ) {
    return {
      ok: false,
      error: "forbidden",
    };
  }

  const parsed = titleSchema.safeParse({
    name: formData.get("name"),
    year: formData.get("year"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    type: formData.get("type"),
    genre: formData.get("genre"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "invalid fields",
    };
  }

  const data = parsed.data;
  const baseSlug = slugify(data.name);
  let finalSlug = baseSlug;

  const existingSlug = await prisma.title.findUnique({
    where: { slug: finalSlug },
  });

  if (existingSlug) {
    finalSlug = `${baseSlug}-${Date.now()}`;
  }

  const existingTitle = await prisma.title.findFirst({
    where: {
      name: {
        equals: data.name,
        mode: "insensitive",
      },
      type: data.type,
    },
  });

  if (existingTitle) {
    return {
      ok: false,
      error: "this title already exists",
    };
  }

  await prisma.title.create({
    data: {
      name: data.name,
      slug: finalSlug,
      year: data.year,
      description: data.descripton || null,
      imageUrl: data.imageUrl || null,
      type: data.type,
      genre: data.genre || null,
      createdById: session.userId,
    },
  });

  revalidatePath("/dashboard");

  return {
    ok: true,
    success: "title created",
  };
}

export async function approveSubmission(submissionId: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("unauthorized");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!currentUser || !["ADMIN", "MODERATOR"].includes(currentUser.role)) {
    throw new Error("forbidden");
  }

  const submission = await prisma.titleSubmission.findUnique({
    where: {
      id: submissionId,
    },
  });

  if (!submission || submission.status !== "PENDING") {
    throw new Error("submission not found");
  }

  const baseSlug = slugify(submission.name);
  let finalSlug = baseSlug;

  const existingSlug = await prisma.title.findUnique({
    where: { slug: finalSlug },
  });

  if (existingSlug) {
    finalSlug = `${baseSlug}-${Date.now()}`;
  }

  await prisma.title.create({
    data: {
      name: submission.name,
      slug: finalSlug,
      year: submission.year,
      description: submission.description,
      imageUrl: submission.imageUrl,
      type: submission.type,
      genre: submission.genre,
      createdById: submission.submittedById,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin/submissions");
}
