"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateAccountSecurity } from "@/actions/profile/updateAccountSecurity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/custom/PasswordInput";

export default function AccountSecurityForms({
  initialUsername,
}: {
  initialUsername: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [usernamePassword, setUsernamePassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernamePending, startUsernameTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();

  const changeUsername = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    startUsernameTransition(async () => {
      const result = await updateAccountSecurity({
        kind: "username",
        username,
        currentPassword: usernamePassword,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setUsernamePassword("");
      toast.success(result.message);
      router.refresh();
    });
  };

  const changePassword = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    startPasswordTransition(async () => {
      const result = await updateAccountSecurity({
        kind: "password",
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(result.message);
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={changeUsername} className="space-y-4">
        <h3 className="text-base font-medium text-white">Change username</h3>
        <div className="space-y-2">
          <Label htmlFor="username-current-password">Current password</Label>
          <Input
            id="username-current-password"
            type="password"
            autoComplete="current-password"
            required
            value={usernamePassword}
            onChange={(event) => setUsernamePassword(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-username">New username</Label>
          <Input
            id="settings-username"
            autoComplete="username"
            required
            minLength={3}
            maxLength={20}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={usernamePending}>
          {usernamePending ? "Saving..." : "Change username"}
        </Button>
      </form>

      <form onSubmit={changePassword} className="space-y-4">
        <h3 className="text-base font-medium text-white">Change password</h3>
        <div className="space-y-2">
          <Label htmlFor="password-current">Current password</Label>
          <PasswordInput
            id="password-current"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password-new">New password</Label>
          <PasswordInput
            id="password-new"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password-confirm">Confirm new password</Label>
          <PasswordInput
            id="password-confirm"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={passwordPending}>
          {passwordPending ? "Saving..." : "Change password"}
        </Button>
      </form>
    </div>
  );
}
