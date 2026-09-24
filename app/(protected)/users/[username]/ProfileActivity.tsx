import { ChevronDown } from "lucide-react";

import GlassCard from "@/components/custom/GlassCard";
import ProfileActivityGroup from "./ProfileActivityGroup";
import ProfilePrivacyHint from "./ProfilePrivacyHint";

type ActivityEvent = {
  id: string;
  type: string;
  rating: number | null;
  createdAt: Date;
};

type ActivityGroup = {
  key: string;
  title: string;
  href: string;
  createdAt: Date;
  events: ActivityEvent[];
};

type ProfileActivityProps = {
  groups: ActivityGroup[];
  privateForOthers?: boolean;
};

export default function ProfileActivity({
  groups,
  privateForOthers = false,
}: ProfileActivityProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-white">Recent activity</h2>
        {privateForOthers && <ProfilePrivacyHint />}
      </div>

      <div className="mt-4 space-y-3">
        {groups.length === 0 ? (
          <p className="text-sm text-white/50">No activity yet.</p>
        ) : (
          <>
            {groups.slice(0, 6).map((group) => (
              <ProfileActivityGroup key={group.key} group={group} />
            ))}

            {groups.length > 6 && (
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/55 transition hover:bg-white/10 hover:text-white">
                  Show older activity
                  <ChevronDown className="size-4 transition group-open:rotate-180" />
                </summary>

                <div className="mt-3 space-y-3">
                  {groups.slice(6).map((group) => (
                    <ProfileActivityGroup
                      key={group.key}
                      group={group}
                      compact
                    />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
}
