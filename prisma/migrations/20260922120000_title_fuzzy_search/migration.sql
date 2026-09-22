CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Title_name_trgm_idx" ON "Title" USING GIN ("name" gin_trgm_ops);

CREATE INDEX "TitleAlias_normalizedValue_trgm_idx" ON "TitleAlias" USING GIN ("normalizedValue" gin_trgm_ops);