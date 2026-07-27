import { TitleType } from "@/generated/prisma/enums";

export type CreateTitleInput = {
  name: string;
  year?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  type: TitleType;
  genresIds: string[];
};

export type UpdateUserTitleInput = {
  titleId: string;
  isChecked?: boolean;
  rating?: number | null;
  note?: string | null;
};
