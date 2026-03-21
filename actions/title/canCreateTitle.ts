import { UserRole } from "@/generated/prisma/enums";

export function canCreateTitle(role: UserRole) {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.MODERATOR ||
    role === UserRole.VERIFIED
  );
}
