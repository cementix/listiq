-- AlterTable
ALTER TABLE "User" ADD COLUMN     "libraryPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listActivityPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postsPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privacySetupCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewsPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "statsPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "titleActivityPublic" BOOLEAN NOT NULL DEFAULT false;
