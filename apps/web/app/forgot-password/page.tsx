"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

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

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)

    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) {
      setStatus("Missing API URL")
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
      setStatus(data?.detail ?? "Failed to send reset link.")
      return
    }

    trackEvent("password_reset_requested_page", {})
    setStatus("If the email exists, a reset link has been sent.")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            We will email you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="reset-email">
                Email
              </label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            {status && <p className="text-xs text-muted-foreground">{status}</p>}
            <Button type="submit" disabled={isSending}>
              {isSending ? "Sending…" : "Send reset link"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/signin")}
            >
              Back to sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
