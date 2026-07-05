import { UserRole } from "@/generated/prisma/enums";

export function canReviewSubmissions(role: UserRole) {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.MODERATOR
  );
}
