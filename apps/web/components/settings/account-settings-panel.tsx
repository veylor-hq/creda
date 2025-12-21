"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AccountSettingsPanelProps = {
  email?: string
  emailVerified?: boolean
}

export function AccountSettingsPanel({
  email,
  emailVerified,
}: AccountSettingsPanelProps) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="rounded-2xl border bg-muted/40 p-6">
        <p className="text-sm font-medium">Profile</p>
        <p className="text-xs text-muted-foreground">
          Synced from your account profile.
        </p>
        <div className="mt-4 grid gap-3 text-sm">
           <div className="flex flex-col gap-2">
            <Label htmlFor="account-name">Full name</Label>
            <Input id="account-name" placeholder="Add full name" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Email</span>
            <span className="font-medium">{email ?? "—"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Verification</span>
            <span className="font-medium">
              {emailVerified ? "Verified" : "Unverified"}
            </span>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border bg-muted/40 p-6">
        <p className="text-sm font-medium">Change password</p>
        <p className="text-xs text-muted-foreground">
          Placeholder flow, frontend-only for now.
        </p>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input id="current-password" type="password" placeholder="••••••••" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" placeholder="••••••••" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input id="confirm-password" type="password" placeholder="••••••••" />
          </div>
          <div className="flex justify-end">
            <Button size="sm">Update password</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
