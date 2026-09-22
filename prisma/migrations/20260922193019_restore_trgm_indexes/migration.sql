-- CreateIndex
CREATE INDEX "Title_name_trgm_idx" ON "Title" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "TitleAlias_normalizedValue_trgm_idx" ON "TitleAlias" USING GIN ("normalizedValue" gin_trgm_ops);
