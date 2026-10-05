import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import PageSection from "@/components/custom/PageSection";
import { prisma } from "@/lib/prisma";
import ProfileImageEditor from "../../users/[username]/ProfileImageEditor";
import PrivacySettingsForm from "./PrivacySettingsForm";
import AccountSecurityForms from "./AccountSecurityForm";

export default async function ProfileSettingsPage() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      avatarUrl: true,
      username: true,
      avatarPublicId: true,
      bannerUrl: true,
      bannerPublicId: true,
      libraryPublic: true,
      reviewsPublic: true,
      statsPublic: true,
      postsPublic: true,
      titleActivityPublic: true,
      listActivityPublic: true,
    },
  });

  if (!user) notFound();

  return (
    <PageSection className="mx-auto w-full max-w-6xl px-4 lg:px-6">
      <h1 className="text-2xl font-semibold text-white">Profile settings</h1>
      <section className="space-y-4 border-b border-white/10 pb-8">
        <h2 className="text-lg font-medium text-white">Appearance</h2>

        <div className="grid items-start gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <div className="space-y-3">
            <h3 className="text-sm text-white/60">Avatar</h3>
            <ProfileImageEditor
              type="avatar"
              imageUrl={user.avatarUrl}
              imagePublicId={user.avatarPublicId}
              largeAvatar
            />
          </div>

          <div className="min-w-0 space-y-3">
            <h3 className="text-sm text-white/60">Banner</h3>
            <ProfileImageEditor
              type="banner"
              imageUrl={user.bannerUrl}
              imagePublicId={user.bannerPublicId}
            />
          </div>
        </div>
      </section>
      <section className="space-y-5 border-b border-white/10 pb-8">
        <h2 className="text-lg font-medium text-white">Account</h2>
        <AccountSecurityForms initialUsername={user.username} />
      </section>
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-white">Privacy</h2>
          <p className="text-sm text-white/45">
            Choose which parts of your profile other users can see.
          </p>
        </div>
        <PrivacySettingsForm
          initialSettings={{
            libraryPublic: user.libraryPublic,
            reviewsPublic: user.reviewsPublic,
            statsPublic: user.statsPublic,
            postsPublic: user.postsPublic,
            titleActivityPublic: user.titleActivityPublic,
            listActivityPublic: user.listActivityPublic,
          }}
        />
      </section>
    </PageSection>
  );
}
