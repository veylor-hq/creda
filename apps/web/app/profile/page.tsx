import { LogoutButton } from "@/components/logout-button"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/private/profile/`,
    {
      headers: {
        cookie: (await headers()).get("cookie") ?? "",
      },
      cache: "no-store",
    }
  )

  if (res.status === 401) {
    redirect("/signin")
  }

  const profile = await res.json()

  return (
    <>
        <pre className="p-6">
        {JSON.stringify(profile, null, 2)}
        </pre>
        <LogoutButton />
    </>
  )
}
