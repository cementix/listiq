-- CreateEnum
CREATE TYPE "TitleAliasKind" AS ENUM ('PRIMARY', 'ENGLISH', 'ORIGINAL', 'NATIVE', 'ROMAJI', 'SYNONYM', 'SLUG');

-- CreateTable
CREATE TABLE "TitleAlias" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "kind" "TitleAliasKind" NOT NULL,
    "source" "ExternalTitleProvider",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TitleAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TitleAlias_normalizedValue_idx" ON "TitleAlias"("normalizedValue");

-- CreateIndex
CREATE INDEX "TitleAlias_titleId_idx" ON "TitleAlias"("titleId");

-- CreateIndex
CREATE UNIQUE INDEX "TitleAlias_titleId_normalizedValue_kind_key" ON "TitleAlias"("titleId", "normalizedValue", "kind");

-- AddForeignKey
ALTER TABLE "TitleAlias" ADD CONSTRAINT "TitleAlias_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;
