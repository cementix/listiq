import {
  ExternalTitleProvider,
  TitleAliasKind,
} from "@/generated/prisma/enums";
import { prisma } from "../prisma";

type AliasInput = {
  value: string | null | undefined;
  kind: TitleAliasKind;
  source?: ExternalTitleProvider;
};

export function normalizeTitleAlias(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      // Splits accented characters into base character + diacritic
      // "café" -> "café"

      .replace(/[\u0300-\u036f]/g, "")
      // Removes diacritic marks
      // "café" -> "cafe"

      .replace(/&/g, " and ")
      // "Damn & Reincarnation" -> "Damn  and  Reincarnation"

      .replace(/[^a-z0-9а-яё]+/gi, " ")
      // Replaces punctuation/special characters with spaces
      // "Damn-Reincarnation!" -> "Damn Reincarnation "

      .replace(/\s+/g, " ")
      // Collapses multiple spaces into one
      // "damn   reincarnation" -> "damn reincarnation"

      .trim()
  );
}

export async function upsertTitleAlias(titleId: string, aliases: AliasInput[]) {
  const seen = new Set<string>();

  for (const alias of aliases) {
    const value = alias.value?.trim();

    if (!value) {
      continue;
    }

    const normalizedValue = normalizeTitleAlias(value);

    if (!normalizedValue) {
      continue;
    }

    const key = `${alias.kind}:${normalizedValue}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    await prisma.titleAlias.upsert({
      where: {
        titleId_normalizedValue_kind: {
          titleId,
          normalizedValue,
          kind: alias.kind,
        },
      },
      update: {
        value,
        source: alias.source,
      },
      create: {
        titleId,
        value,
        normalizedValue,
        kind: alias.kind,
        source: alias.source,
      },
    });
  }
}
