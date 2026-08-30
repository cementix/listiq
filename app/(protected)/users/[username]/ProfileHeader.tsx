import GlassCard from "@/components/custom/GlassCard";
import ProfileImageEditor from "./ProfileImageEditor";
import Image from "next/image";
import { UserRound } from "lucide-react";
import {
  formatRelativeDate,
  getRoleClassName,
  getRoleLabel,
} from "./ProfileUtils";

type ProfileHeaderProps = {
  user: {
    username: string;
    role: string;
    avatarUrl: string | null;
    avatarPublicId: string | null;
    bannerUrl: string | null;
    bannerPublicId: string | null;
    createdAt: Date;
  };
  isOwnProfile: boolean;
};

const ProfileHeader = ({ user, isOwnProfile }: ProfileHeaderProps) => {
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="mb-6">
        {isOwnProfile ? (
          <ProfileImageEditor
            type="banner"
            imageUrl={user.bannerUrl}
            imagePublicId={user.bannerPublicId}
          />
        ) : (
          <div className="relative h-36 w-full overflow-hidden">
            {user.bannerUrl ? (
              <Image
                src={user.bannerUrl}
                alt={`${user.username} banner`}
                fill
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.35),transparent_35%),linear-gradient(135deg,rgba(15,23,42,1),rgba(0,0,0,1))]" />
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 p-6 pt-0">
        <div className="-mt-12 flex items-end gap-4">
          {isOwnProfile ? (
            <ProfileImageEditor
              type="avatar"
              imageUrl={user.avatarUrl}
              imagePublicId={user.avatarPublicId}
            />
          ) : (
            <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black text-white shadow-2xl">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={`${user.username} avatar`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <UserRound className="size-10 text-white/60" />
              )}
            </div>
          )}

          <div className="pb-1">
            <h1 className="text-3xl font-semibold text-white">
              @{user.username}
            </h1>
            <p className="mt-1 text-sm text-white/50">
              <span className={getRoleClassName(user.role)}>
                {getRoleLabel(user.role)}
              </span>
              {", "}
              joined {formatRelativeDate(user.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default ProfileHeader;
