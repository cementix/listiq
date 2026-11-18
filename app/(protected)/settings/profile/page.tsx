export const metadata = { title: "Settings" };
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import PageSection from "@/components/custom/PageSection";
import PageHeader from "@/components/custom/PageHeader";
import { KeyRound, Palette, Settings, ShieldCheck } from "lucide-react";
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
      <PageHeader eyebrow="Settings" title="Profile settings" description="Shape how you look and what others can see." icon={<Settings className="size-3.5" />} />
      <section id="appearance" className="scroll-mt-24 space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <h2 className="flex items-center gap-2 text-lg font-medium text-white"><Palette className="size-4 text-violet-300" />Appearance</h2>

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
      <section id="account" className="scroll-mt-24 space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <h2 className="flex items-center gap-2 text-lg font-medium text-white"><KeyRound className="size-4 text-violet-300" />Account</h2>
        <AccountSecurityForms initialUsername={user.username} />
      </section>
      <section id="privacy" className="scroll-mt-24 space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-medium text-white"><ShieldCheck className="size-4 text-violet-300" />Privacy</h2>
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
