UPDATE "Title" AS title
SET "description" = CASE WHEN source."provider" = 'MANGA_UPDATES' THEN NULL ELSE title."description" END,
    "imageUrl" = CASE
      WHEN title."imageUrl" LIKE 'https://cdn.mangaupdates.com/%'
        OR title."imageUrl" LIKE 'https://covers.openlibrary.org/%' THEN NULL
      ELSE title."imageUrl"
    END,
    "catalogEligible" = false,
    "catalogScore" = NULL,
    "catalogScoredAt" = NULL,
    "updatedAt" = CURRENT_TIMESTAMP
FROM "ExternalTitle" AS source
WHERE source."titleId" = title."id"
  AND title."createdById" IS NULL
  AND (
    (source."provider" = 'MANGA_UPDATES' AND title."slug" LIKE 'mu-%')
    OR (source."provider" = 'OPEN_LIBRARY' AND title."slug" LIKE 'open_library-%')
  );

UPDATE "ExternalTitle"
SET "rawData" = "rawData" - 'description' - 'image',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "provider" = 'MANGA_UPDATES' AND jsonb_typeof("rawData") = 'object';
