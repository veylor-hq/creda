"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { trackEvent } from "@/lib/analytics"

type SecuritySettingsPanelProps = {
  email?: string
}

export function SecuritySettingsPanel({ email }: SecuritySettingsPanelProps) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changeStatus, setChangeStatus] = useState<string | null>(null)
  const [resetStatus, setResetStatus] = useState<string | null>(null)
  const [isChanging, setIsChanging] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const statusTimeoutRef = useRef<number | null>(null)

  const clearStatusLater = () => {
    if (statusTimeoutRef.current) {
      window.clearTimeout(statusTimeoutRef.current)
    }
    statusTimeoutRef.current = window.setTimeout(() => {
      setChangeStatus(null)
      setResetStatus(null)
    }, 3000)
  }

  const handleChangePassword = async () => {
    setChangeStatus(null)

    if (!currentPassword || !newPassword) {
      setChangeStatus("All password fields are required.")
      return
    }

    if (newPassword !== confirmPassword) {
      setChangeStatus("Passwords do not match.")
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) {
      setChangeStatus("Missing API URL")
      return
    }

    setIsChanging(true)
    const res = await fetch(`${API_URL}/api/auth/password/change`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    setIsChanging(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setChangeStatus(data?.detail ?? "Failed to update password.")
      return
    }

    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setChangeStatus("Password updated.")
    trackEvent("password_changed", {})
    clearStatusLater()
  }

  const handleSendReset = async () => {
    setResetStatus(null)
    if (!email) {
      setResetStatus("Email is not available.")
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) {
      setResetStatus("Missing API URL")
      return
    }

    setIsSending(true)
    const res = await fetch(`${API_URL}/api/auth/password-reset/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    setIsSending(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setResetStatus(data?.detail ?? "Failed to send reset email.")
      return
    }

    setResetStatus("Reset link sent (check your inbox).")
    trackEvent("password_reset_requested", {})
    clearStatusLater()
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="rounded-2xl border bg-muted/40 p-6">
        <p className="text-sm font-medium">Change password</p>
        <p className="text-xs text-muted-foreground">
          Update your password using the current one.
        </p>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="security-current-password">Current password</Label>
            <Input
              id="security-current-password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="security-new-password">New password</Label>
            <Input
              id="security-new-password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="security-confirm-password">Confirm new password</Label>
            <Input
              id="security-confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          {changeStatus && (
            <span className="text-xs text-muted-foreground">{changeStatus}</span>
          )}
          <div className="flex justify-end">
            <Button size="sm" onClick={handleChangePassword} disabled={isChanging}>
              {isChanging ? "Updating…" : "Update password"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-muted/40 p-6">
        <p className="text-sm font-medium">Reset password</p>
        <p className="text-xs text-muted-foreground">
          Get a reset link sent to your email.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">{email ?? "Email unavailable"}</div>
          <Button size="sm" variant="outline" onClick={handleSendReset} disabled={isSending}>
            {isSending ? "Sending…" : "Send reset link"}
          </Button>
        </div>
        {resetStatus && (
          <span className="mt-3 block text-xs text-muted-foreground">{resetStatus}</span>
        )}
      </div>
    </div>
  )
}
