"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type ReactivateState =
  | { status: "loading" }
  | { status: "success"; workspaceId?: string }
  | { status: "unauthorized" }
  | { status: "error"; message: string }

export default function WorkspaceReactivatePage() {
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
    const pathToken = pathname?.split("/workspace/reactivate/")[1]
    if (pathToken && pathToken !== "undefined") {
      return pathToken
    }
    return undefined
  }, [params?.token, pathname])

  const [state, setState] = useState<ReactivateState>({ status: "loading" })

  useEffect(() => {
    async function reactivate() {
      if (!token) {
        setState({ status: "error", message: "Reactivation token missing" })
        return
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL
      if (!API_URL) {
        setState({ status: "error", message: "Missing API URL" })
        return
      }

      const res = await fetch(`${API_URL}/api/private/workspace/reactivate/${token}`, {
        method: "POST",
        credentials: "include",
      })

      if (res.status === 401) {
        setState({ status: "unauthorized" })
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setState({
          status: "error",
          message: data?.detail ?? "Reactivation failed",
        })
        return
      }

      const data = await res.json().catch(() => null)
      const workspaceId = data?.workspace_id as string | undefined
      if (workspaceId) {
        await fetch(`${API_URL}/api/private/workspace/${workspaceId}/select`, {
          method: "POST",
          credentials: "include",
        }).catch(() => null)
        document.cookie = `X-Workspace-ID=${workspaceId}; path=/`
        localStorage.setItem("active-workspace-id", workspaceId)
        window.dispatchEvent(
          new CustomEvent("app:workspace-changed", {
            detail: { workspaceId },
          })
        )
      }
      setState({ status: "success", workspaceId })
    }

    reactivate()
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border bg-card p-6 text-center">
        {state.status === "loading" && (
          <>
            <p className="text-sm text-muted-foreground">Reactivating…</p>
            <p className="mt-2 text-lg font-semibold">Bringing your workspace back</p>
          </>
        )}
        {state.status === "success" && (
          <>
            <p className="text-sm text-muted-foreground">Workspace reactivated</p>
            <p className="mt-2 text-lg font-semibold">You're all set</p>
            <Button className="mt-4" onClick={() => router.push("/dashboard")}>
              Go to dashboard
            </Button>
          </>
        )}
        {state.status === "unauthorized" && (
          <>
            <p className="text-sm text-muted-foreground">Sign in required</p>
            <p className="mt-2 text-lg font-semibold">Reactivate this workspace</p>
            <Button
              className="mt-4"
              onClick={() =>
                router.push(token ? `/signin?next=/workspace/reactivate/${token}` : "/signin")
              }
            >
              Sign in to continue
            </Button>
          </>
        )}
        {state.status === "error" && (
          <>
            <p className="text-sm text-muted-foreground">Reactivation error</p>
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
