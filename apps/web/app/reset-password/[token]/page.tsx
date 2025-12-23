"use client"

import { FormEvent, useMemo, useState } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { trackEvent } from "@/lib/analytics"

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams<{ token?: string | string[] }>()
  const pathname = usePathname()
  const token = useMemo(() => {
    const rawParam = params?.token
    if (Array.isArray(rawParam)) {
      return rawParam[0]
    }
    if (rawParam && rawParam !== "undefined") {
      return rawParam
    }
    const pathToken = pathname?.split("/reset-password/")[1]
    if (pathToken && pathToken !== "undefined") {
      return pathToken
    }
    return undefined
  }, [params?.token, pathname])

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)

    if (!token) {
      setStatus("Reset link is invalid or expired.")
      return
    }

    if (!password || !confirmPassword) {
      setStatus("Please fill in all fields.")
      return
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.")
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) {
      setStatus("Missing API URL")
      return
    }

    setIsSaving(true)
    const res = await fetch(`${API_URL}/api/auth/password-reset/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    setIsSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setStatus(data?.detail ?? "Reset link is invalid or expired.")
      return
    }

    trackEvent("password_reset_completed", {})
    setIsDone(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>Choose a strong password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isDone ? (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="new-password">
                  New password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="confirm-password">
                  Confirm password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
              {status && <p className="text-xs text-muted-foreground">{status}</p>}
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Update password"}
              </Button>
            </form>
          ) : (
            <div className="grid gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your password has been updated.
              </p>
              <Button onClick={() => router.push("/signin")}>
                Back to sign in
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
