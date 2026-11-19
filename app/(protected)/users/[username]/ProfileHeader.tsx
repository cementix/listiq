import GlassCard from "@/components/custom/GlassCard";
import ProfileImageEditor from "./ProfileImageEditor";
import Image from "next/image";
import {
  formatRelativeDate,
  getRoleClassName,
  getRoleLabel,
} from "./ProfileUtils";

type ProfileHeaderProps = {
  user: {
    username: string;
    role: string;
    plan?: string;
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
          <div className="relative h-40 w-full overflow-hidden sm:h-52">
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
              <div className="absolute inset-0 animate-gradient-pan bg-[linear-gradient(120deg,rgba(139,92,246,0.45),rgba(232,121,249,0.25),rgba(56,189,248,0.3),rgba(139,92,246,0.45))] bg-[length:220%_220%]">
                <div className="absolute inset-0 bg-grid opacity-40 [mask-image:linear-gradient(to_bottom,#000,transparent)]" />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-4 px-4 pb-5 sm:px-6 sm:pb-6">
        <div className="-mt-12 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-4">
          {isOwnProfile ? (
            <ProfileImageEditor
              type="avatar"
              imageUrl={user.avatarUrl}
              imagePublicId={user.avatarPublicId}
            />
          ) : (
            <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-black bg-gradient-to-br from-violet-500/40 via-fuchsia-500/30 to-sky-500/30 text-white shadow-[0_20px_50px_-15px_rgba(139,92,246,0.7)] animate-in zoom-in-90 fade-in duration-700">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={`${user.username} avatar`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-3xl font-semibold text-white/90">{user.username.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
          )}

          <div className="min-w-0 max-w-full pb-1">
            <h1 className="break-words text-2xl font-semibold tracking-tight text-white animate-in fade-in slide-in-from-bottom-2 duration-700 sm:text-4xl">
              @{user.username}
              {user.plan === "PRO" && (
                <span className="ml-3 inline-flex translate-y-[-4px] items-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2.5 py-0.5 align-middle text-xs font-bold tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(217,70,239,0.8)]">PRO</span>
              )}
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
