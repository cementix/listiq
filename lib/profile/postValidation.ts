import { z } from "zod";

export const postSchema = z.object({
  content: z.string().trim().max(1000),
  attachedUserTitleId: z.string().max(100).nullish(),
  media: z.array(z.object({
    type: z.enum(["IMAGE", "VIDEO"]),
    url: z.string().max(2048),
    publicId: z.string().min(1).max(500),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })).max(10).optional(),
});

export type CreateProfilePostInput = z.input<typeof postSchema>;

export const profileImageSchema = z.object({
  avatarUrl: z.string().max(2048).nullish(),
  avatarPublicId: z.string().max(500).nullish(),
  bannerUrl: z.string().max(2048).nullish(),
  bannerPublicId: z.string().max(500).nullish(),
});
