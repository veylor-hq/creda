"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics"

type InviteState =
  | { status: "loading" }
  | { status: "accepted"; workspaceId?: string }
  | { status: "unauthorized" }
  | { status: "error"; message: string }

export default function InviteAcceptPage() {
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
    const pathToken = pathname?.split("/invite/")[1]
    if (pathToken && pathToken !== "undefined") {
      return pathToken
    }
    return undefined
  }, [params?.token, pathname])
  const [state, setState] = useState<InviteState>({ status: "loading" })

  useEffect(() => {
    async function acceptInvite() {
      if (!token) {
        setState({ status: "error", message: "Invite token missing" })
        return
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL) {
        setState({ status: "error", message: "Missing API URL" })
        return
      }

      const res = await fetch(
        `${API_URL}/api/private/workspace/invites/${token}/accept`,
        {
          method: "POST",
          credentials: "include",
        }
      )

      if (res.status === 401) {
        setState({ status: "unauthorized" })
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setState({
          status: "error",
          message: data?.detail ?? "Invite could not be accepted",
        })
        return
      }

      const data = await res.json().catch(() => null)
      const workspaceId = data?.workspace_id as string | undefined
      if (workspaceId) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL
        if (API_URL) {
          await fetch(`${API_URL}/api/private/workspace/${workspaceId}/select`, {
            method: "POST",
            credentials: "include",
          }).catch(() => null)
        }
        document.cookie = `X-Workspace-ID=${workspaceId}; path=/`
        localStorage.setItem("active-workspace-id", workspaceId)
        window.dispatchEvent(
          new CustomEvent("app:workspace-changed", {
            detail: { workspaceId },
          })
        )
      }
      trackEvent("workspace_invite_accepted", {})
      setState({ status: "accepted", workspaceId })
    }

    acceptInvite()
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border bg-card p-6 text-center">
        {state.status === "loading" && (
          <>
            <p className="text-sm text-muted-foreground">Processing invite…</p>
            <p className="mt-2 text-lg font-semibold">Joining workspace</p>
          </>
        )}
        {state.status === "accepted" && (
          <>
            <p className="text-sm text-muted-foreground">Invite accepted</p>
            <p className="mt-2 text-lg font-semibold">Welcome aboard</p>
            <Button className="mt-4" onClick={() => router.push("/dashboard")}>
              Go to dashboard
            </Button>
          </>
        )}
        {state.status === "unauthorized" && (
          <>
            <p className="text-sm text-muted-foreground">Sign in required</p>
            <p className="mt-2 text-lg font-semibold">Join this workspace</p>
            <Button
              className="mt-4"
              onClick={() =>
                router.push(
                  token ? `/signin?next=/invite/${token}` : "/signin"
                )
              }
            >
              Sign in to accept
            </Button>
          </>
        )}
        {state.status === "error" && (
          <>
            <p className="text-sm text-muted-foreground">Invite error</p>
            <p className="mt-2 text-lg font-semibold">{state.message}</p>
            <Button className="mt-4" variant="outline" onClick={() => router.push("/signin")}>
              Back to sign in
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
