"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SettingsDialog, type SettingsSectionId } from "@/components/settings/settings-dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import { UnfoldMoreIcon } from "@hugeicons/core-free-icons"
import { trackEvent } from "@/lib/analytics"

type Profile = {
  id: string
  email: string
  email_verified: boolean
  full_name?: string | null
  notification_settings?: {
    email_on_signin: boolean
    email_on_password_reset: boolean
  }
}

const settingsMenuItems: Array<{ id: SettingsSectionId; label: string }> = [
  { id: "account", label: "Account" },
  { id: "billing", label: "Billing" },
  { id: "settings", label: "Settings" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "logout", label: "Log out" },
]

function getInitials(email?: string) {
  if (!email) {
    return "??"
  }

  const [name] = email.split("@")
  return name.slice(0, 2).toUpperCase()
}

function md5(input: string) {
  let result = ""
  const rotateLeft = (value: number, shift: number) =>
    (value << shift) | (value >>> (32 - shift))
  const addUnsigned = (x: number, y: number) => {
    const lsw = (x & 0xffff) + (y & 0xffff)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xffff)
  }
  const convertToWordArray = (str: string) => {
    const wordArray: number[] = []
    let index = 0
    const length = str.length
    while (index < length) {
      const wordCount = (index >> 2)
      wordArray[wordCount] = wordArray[wordCount] || 0
      wordArray[wordCount] |= (str.charCodeAt(index) & 0xff) << ((index % 4) * 8)
      index += 1
    }
    const wordCount = (index >> 2)
    wordArray[wordCount] = wordArray[wordCount] || 0
    wordArray[wordCount] |= 0x80 << ((index % 4) * 8)
    wordArray[(((length + 8) >> 6) * 16) + 14] = length * 8
    return wordArray
  }
  const wordToHex = (value: number) => {
    let hex = ""
    for (let i = 0; i <= 3; i += 1) {
      const byte = (value >>> (i * 8)) & 255
      hex += (`0${byte.toString(16)}`).slice(-2)
    }
    return hex
  }
  const wordArray = convertToWordArray(input)
  let a = 0x67452301
  let b = 0xefcdab89
  let c = 0x98badcfe
  let d = 0x10325476
  const ff = (aa: number, bb: number, cc: number, dd: number, x: number, s: number, ac: number) => {
    const res = addUnsigned(aa, addUnsigned(addUnsigned((bb & cc) | (~bb & dd), x), ac))
    return addUnsigned(rotateLeft(res, s), bb)
  }
  const gg = (aa: number, bb: number, cc: number, dd: number, x: number, s: number, ac: number) => {
    const res = addUnsigned(aa, addUnsigned(addUnsigned((bb & dd) | (cc & ~dd), x), ac))
    return addUnsigned(rotateLeft(res, s), bb)
  }
  const hh = (aa: number, bb: number, cc: number, dd: number, x: number, s: number, ac: number) => {
    const res = addUnsigned(aa, addUnsigned(addUnsigned(bb ^ cc ^ dd, x), ac))
    return addUnsigned(rotateLeft(res, s), bb)
  }
  const ii = (aa: number, bb: number, cc: number, dd: number, x: number, s: number, ac: number) => {
    const res = addUnsigned(aa, addUnsigned(addUnsigned(cc ^ (bb | ~dd), x), ac))
    return addUnsigned(rotateLeft(res, s), bb)
  }
  for (let i = 0; i < wordArray.length; i += 16) {
    const aa = a
    const bb = b
    const cc = c
    const dd = d
    a = ff(a, b, c, d, wordArray[i + 0], 7, 0xd76aa478)
    d = ff(d, a, b, c, wordArray[i + 1], 12, 0xe8c7b756)
    c = ff(c, d, a, b, wordArray[i + 2], 17, 0x242070db)
    b = ff(b, c, d, a, wordArray[i + 3], 22, 0xc1bdceee)
    a = ff(a, b, c, d, wordArray[i + 4], 7, 0xf57c0faf)
    d = ff(d, a, b, c, wordArray[i + 5], 12, 0x4787c62a)
    c = ff(c, d, a, b, wordArray[i + 6], 17, 0xa8304613)
    b = ff(b, c, d, a, wordArray[i + 7], 22, 0xfd469501)
    a = ff(a, b, c, d, wordArray[i + 8], 7, 0x698098d8)
    d = ff(d, a, b, c, wordArray[i + 9], 12, 0x8b44f7af)
    c = ff(c, d, a, b, wordArray[i + 10], 17, 0xffff5bb1)
    b = ff(b, c, d, a, wordArray[i + 11], 22, 0x895cd7be)
    a = ff(a, b, c, d, wordArray[i + 12], 7, 0x6b901122)
    d = ff(d, a, b, c, wordArray[i + 13], 12, 0xfd987193)
    c = ff(c, d, a, b, wordArray[i + 14], 17, 0xa679438e)
    b = ff(b, c, d, a, wordArray[i + 15], 22, 0x49b40821)
    a = gg(a, b, c, d, wordArray[i + 1], 5, 0xf61e2562)
    d = gg(d, a, b, c, wordArray[i + 6], 9, 0xc040b340)
    c = gg(c, d, a, b, wordArray[i + 11], 14, 0x265e5a51)
    b = gg(b, c, d, a, wordArray[i + 0], 20, 0xe9b6c7aa)
    a = gg(a, b, c, d, wordArray[i + 5], 5, 0xd62f105d)
    d = gg(d, a, b, c, wordArray[i + 10], 9, 0x2441453)
    c = gg(c, d, a, b, wordArray[i + 15], 14, 0xd8a1e681)
    b = gg(b, c, d, a, wordArray[i + 4], 20, 0xe7d3fbc8)
    a = gg(a, b, c, d, wordArray[i + 9], 5, 0x21e1cde6)
    d = gg(d, a, b, c, wordArray[i + 14], 9, 0xc33707d6)
    c = gg(c, d, a, b, wordArray[i + 3], 14, 0xf4d50d87)
    b = gg(b, c, d, a, wordArray[i + 8], 20, 0x455a14ed)
    a = gg(a, b, c, d, wordArray[i + 13], 5, 0xa9e3e905)
    d = gg(d, a, b, c, wordArray[i + 2], 9, 0xfcefa3f8)
    c = gg(c, d, a, b, wordArray[i + 7], 14, 0x676f02d9)
    b = gg(b, c, d, a, wordArray[i + 12], 20, 0x8d2a4c8a)
    a = hh(a, b, c, d, wordArray[i + 5], 4, 0xfffa3942)
    d = hh(d, a, b, c, wordArray[i + 8], 11, 0x8771f681)
    c = hh(c, d, a, b, wordArray[i + 11], 16, 0x6d9d6122)
    b = hh(b, c, d, a, wordArray[i + 14], 23, 0xfde5380c)
    a = hh(a, b, c, d, wordArray[i + 1], 4, 0xa4beea44)
    d = hh(d, a, b, c, wordArray[i + 4], 11, 0x4bdecfa9)
    c = hh(c, d, a, b, wordArray[i + 7], 16, 0xf6bb4b60)
    b = hh(b, c, d, a, wordArray[i + 10], 23, 0xbebfbc70)
    a = hh(a, b, c, d, wordArray[i + 13], 4, 0x289b7ec6)
    d = hh(d, a, b, c, wordArray[i + 0], 11, 0xeaa127fa)
    c = hh(c, d, a, b, wordArray[i + 3], 16, 0xd4ef3085)
    b = hh(b, c, d, a, wordArray[i + 6], 23, 0x4881d05)
    a = hh(a, b, c, d, wordArray[i + 9], 4, 0xd9d4d039)
    d = hh(d, a, b, c, wordArray[i + 12], 11, 0xe6db99e5)
    c = hh(c, d, a, b, wordArray[i + 15], 16, 0x1fa27cf8)
    b = hh(b, c, d, a, wordArray[i + 2], 23, 0xc4ac5665)
    a = ii(a, b, c, d, wordArray[i + 0], 6, 0xf4292244)
    d = ii(d, a, b, c, wordArray[i + 7], 10, 0x432aff97)
    c = ii(c, d, a, b, wordArray[i + 14], 15, 0xab9423a7)
    b = ii(b, c, d, a, wordArray[i + 5], 21, 0xfc93a039)
    a = ii(a, b, c, d, wordArray[i + 12], 6, 0x655b59c3)
    d = ii(d, a, b, c, wordArray[i + 3], 10, 0x8f0ccc92)
    c = ii(c, d, a, b, wordArray[i + 10], 15, 0xffeff47d)
    b = ii(b, c, d, a, wordArray[i + 1], 21, 0x85845dd1)
    a = ii(a, b, c, d, wordArray[i + 8], 6, 0x6fa87e4f)
    d = ii(d, a, b, c, wordArray[i + 15], 10, 0xfe2ce6e0)
    c = ii(c, d, a, b, wordArray[i + 6], 15, 0xa3014314)
    b = ii(b, c, d, a, wordArray[i + 13], 21, 0x4e0811a1)
    a = ii(a, b, c, d, wordArray[i + 4], 6, 0xf7537e82)
    d = ii(d, a, b, c, wordArray[i + 11], 10, 0xbd3af235)
    c = ii(c, d, a, b, wordArray[i + 2], 15, 0x2ad7d2bb)
    b = ii(b, c, d, a, wordArray[i + 9], 21, 0xeb86d391)
    a = addUnsigned(a, aa)
    b = addUnsigned(b, bb)
    c = addUnsigned(c, cc)
    d = addUnsigned(d, dd)
  }
  result = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)
  return result.toLowerCase()
}

export function SidebarProfileMenu() {
  const router = useRouter()
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [activeSectionId, setActiveSectionId] =
    React.useState<SettingsSectionId>("account")

  React.useEffect(() => {
    async function loadProfile() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL) {
        return
      }

      const res = await fetch(`${API_URL}/api/private/profile/`, {
        credentials: "include",
      })

      if (res.status === 401) {
        router.push("/signin")
        return
      }

      if (!res.ok) {
        return
      }

      const data = (await res.json()) as Profile
      setProfile(data)
    }

    loadProfile()
  }, [router])

  React.useEffect(() => {
    if (!profile?.email) {
      setAvatarUrl(null)
      return
    }

    const hash = md5(profile.email.trim().toLowerCase())
    setAvatarUrl(`https://www.gravatar.com/avatar/${hash}?d=404`)
  }, [profile?.email])

  const handleOpenSection = (id: SettingsSectionId) => {
    if (id === "logout") {
      trackEvent("user_logout_requested")
      setSettingsOpen(false)
      router.push("/logout")
      return
    }

    setActiveSectionId(id)
    setSettingsOpen(true)
  }

  const handleSectionChange = (id: SettingsSectionId) => {
    if (id === "logout") {
      setSettingsOpen(false)
      router.push("/logout")
      return
    }

    setActiveSectionId(id)
  }

  return (
    <>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
            >
              <Avatar>
                <AvatarImage src={avatarUrl ?? ""} alt={profile?.email ?? "Profile"} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(profile?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {profile?.email ?? "Loading profile…"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {profile?.email_verified ? "Verified" : "Unverified"}
                </span>
              </div>
              <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <Item size="xs">
                  <ItemMedia>
                    <Avatar>
                      <AvatarImage src={avatarUrl ?? ""} alt={profile?.email ?? "Profile"} />
                      <AvatarFallback>{getInitials(profile?.email)}</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{profile?.email ?? "Loading…"}</ItemTitle>
                    <ItemDescription>
                      {profile?.email_verified ? "Verified" : "Unverified"}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {settingsMenuItems.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onSelect={() => handleOpenSection(item.id)}
                >
                  <span>{item.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <SettingsDialog
        open={settingsOpen}
        activeSectionId={activeSectionId}
        onOpenChange={setSettingsOpen}
        onSectionChange={handleSectionChange}
        profile={profile}
      />
    </>
  )
}
