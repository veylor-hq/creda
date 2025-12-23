"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { trackEvent } from "@/lib/analytics"

type AccountSettingsPanelProps = {
  email?: string
  emailVerified?: boolean
  fullName?: string
}

export function AccountSettingsPanel({
  email,
  emailVerified,
  fullName,
}: AccountSettingsPanelProps) {
  const router = useRouter()
  const [nameValue, setNameValue] = useState(fullName ?? "")
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameStatus, setNameStatus] = useState<string | null>(null)
  const statusTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    setNameValue(fullName ?? "")
  }, [fullName])

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        window.clearTimeout(statusTimeoutRef.current)
      }
    }
  }, [])

  const handleSaveName = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    if (!API_URL) {
      setNameStatus("Missing API URL")
      return
    }

    setIsSavingName(true)
    setNameStatus(null)

    const res = await fetch(`${API_URL}/api/private/profile/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ full_name: nameValue.trim() || null }),
    })

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    if (!res.ok) {
      setNameStatus("Failed to update name")
      setIsSavingName(false)
      return
    }

    setNameStatus("Saved")
    trackEvent("profile_name_updated", {
      has_name: Boolean(nameValue.trim()),
    })
    if (statusTimeoutRef.current) {
      window.clearTimeout(statusTimeoutRef.current)
    }
    statusTimeoutRef.current = window.setTimeout(() => {
      setNameStatus(null)
    }, 2500)
    setIsSavingName(false)
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="rounded-2xl border bg-muted/40 p-6">
        <p className="text-sm font-medium">Profile</p>
        <p className="text-xs text-muted-foreground">
          Synced from your account profile.
        </p>
        <div className="mt-4 grid gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Full name</span>
            <span className="font-medium">
              {fullName?.trim() ? fullName : "Not set"}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-name">Full name</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="account-name"
                placeholder="Add full name"
                value={nameValue}
                onChange={(event) => setNameValue(event.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveName}
                disabled={isSavingName}
              >
                {isSavingName ? "Saving…" : "Save"}
              </Button>
            </div>
            {nameStatus && (
              <span className="text-xs text-muted-foreground">{nameStatus}</span>
            )}
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
    </div>
  )
}
