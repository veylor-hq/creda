"use client"

import { useRouter } from "next/navigation"
import { trackEvent } from "@/lib/analytics"

export function LogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
      {
        method: "POST",
        credentials: "include",
      }
    )

    trackEvent("user_logged_out")
    router.push("/signin")
  }

  return (
    <button
      onClick={logout}
      className="text-sm text-red-600 underline"
    >
      Log out
    </button>
  )
}
