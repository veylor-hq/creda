"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

type NotificationSettings = {
  email_on_signin: boolean
  email_on_password_reset: boolean
}

type NotificationsSettingsPanelProps = {
  settings?: NotificationSettings
}

export function NotificationsSettingsPanel({
  settings,
}: NotificationsSettingsPanelProps) {
  const router = useRouter()
  const [values, setValues] = useState<NotificationSettings>({
    email_on_signin: false,
    email_on_password_reset: false,
  })
  const [status, setStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setValues(settings)
    }
  }, [settings])

  const updateSettings = async (next: NotificationSettings) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) {
      setStatus("Missing API URL")
      return
    }

    setIsSaving(true)
    setStatus(null)

    const res = await fetch(`${API_URL}/api/private/profile/`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_settings: next }),
    })

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    setIsSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setStatus(data?.detail ?? "Failed to update notifications.")
      return
    }

    setValues(next)
    setStatus("Saved")
    window.setTimeout(() => setStatus(null), 2000)
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="rounded-2xl border bg-muted/40 p-6">
        <p className="text-sm font-medium">Email notifications</p>
        <p className="text-xs text-muted-foreground">
          Choose which security emails you want to receive.
        </p>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-xl border bg-background/60 px-4 py-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Sign-in alert</Label>
              <p className="text-xs text-muted-foreground">
                Get an email whenever your account signs in.
              </p>
            </div>
            <Switch
              checked={values.email_on_signin}
              onCheckedChange={(checked) =>
                updateSettings({ ...values, email_on_signin: checked })
              }
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border bg-background/60 px-4 py-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Password reset confirmation</Label>
              <p className="text-xs text-muted-foreground">
                Get an email after your password is reset.
              </p>
            </div>
            <Switch
              checked={values.email_on_password_reset}
              onCheckedChange={(checked) =>
                updateSettings({ ...values, email_on_password_reset: checked })
              }
              disabled={isSaving}
            />
          </div>
        </div>
        {status && (
          <p className="mt-4 text-xs text-muted-foreground">{status}</p>
        )}
      </div>
    </div>
  )
}
