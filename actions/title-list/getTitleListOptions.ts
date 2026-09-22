"use server";

import { z } from "zod";

import { getMyTitleListOptions } from "@/lib/title-list/getMyTitleListOptions";

const getTitleListOptionsSchema = z.object({
  titleId: z.string().min(1, "Title ID is required"),
});

type GetTitleListOptionsInput = z.infer<typeof getTitleListOptionsSchema>;

type GetTitleListOptionsResult =
  | {
      ok: true;
      lists: Awaited<ReturnType<typeof getMyTitleListOptions>>;
    }
  | {
      ok: false;
      error: string;
    };

export async function getTitleListOptions(
  input: GetTitleListOptionsInput,
): Promise<GetTitleListOptionsResult> {
  try {
    const parsed = getTitleListOptionsSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid title data",
      };
    }

    const lists = await getMyTitleListOptions(parsed.data.titleId);

    return {
      ok: true,
      lists,
    };
  } catch (error) {
    console.error("getTitleListOptions error:", error);

    return {
      ok: false,
      error: "Failed to load lists",
    };
  }
}
