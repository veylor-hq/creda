"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

type Profile = {
  email: string;
  // add fields as needed
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is not defined");
      }

      const res = await fetch(`${API_URL}/api/private/profile/`, {
        credentials: "include",
      });

      if (res.status === 401) {
        router.push("/signin");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to load profile");
      }

      const data = await res.json();
      setProfile(data);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <>
      <pre className="p-6">
        {JSON.stringify(profile, null, 2)}
      </pre>
      <LogoutButton />
    </>
  );
}
