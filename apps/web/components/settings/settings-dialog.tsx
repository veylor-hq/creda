"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AccountSettingsPanel } from "@/components/settings/account-settings-panel"
import { SecuritySettingsPanel } from "@/components/settings/security-settings-panel"
import { NotificationsSettingsPanel } from "@/components/settings/notifications-settings-panel"
import { AppSettingsPanel } from "@/components/settings/app-settings-panel"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CreditCardIcon,
  LogoutIcon,
  NotificationIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"

type SettingsSectionId =
  | "account"
  | "billing"
  | "settings"
  | "notifications"
  | "security"
  | "logout"

type SettingsSection = {
  id: SettingsSectionId
  label: string
  description: string
  icon: React.ReactNode
}

const sections: SettingsSection[] = [
  {
    id: "account",
    label: "Account",
    description: "Profile details and account preferences.",
    icon: <HugeiconsIcon icon={UserIcon} strokeWidth={2} />,
  },
  {
    id: "billing",
    label: "Billing",
    description: "Plans, invoices, and payment methods.",
    icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />,
  },
  {
    id: "settings",
    label: "Settings",
    description: "General application configuration.",
    icon: <HugeiconsIcon icon={SettingsIcon} strokeWidth={2} />,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Delivery rules and alert preferences.",
    icon: <HugeiconsIcon icon={NotificationIcon} strokeWidth={2} />,
  },
  {
    id: "security",
    label: "Security",
    description: "Security controls and access history.",
    icon: <HugeiconsIcon icon={ShieldIcon} strokeWidth={2} />,
  },
  {
    id: "logout",
    label: "Log out",
    description: "Sign out options and device sessions.",
    icon: <HugeiconsIcon icon={LogoutIcon} strokeWidth={2} />,
  },
]

type SettingsDialogProps = {
  open: boolean
  activeSectionId: SettingsSectionId
  onOpenChange: (open: boolean) => void
  onSectionChange: (id: SettingsSectionId) => void
  profile?: {
    email: string
    email_verified: boolean
    full_name?: string | null
    notification_settings?: {
      email_on_signin: boolean
      email_on_password_reset: boolean
    }
  } | null
}

export function SettingsDialog({
  open,
  activeSectionId,
  onOpenChange,
  onSectionChange,
  profile,
}: SettingsDialogProps) {
  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(560px,80vh)] w-[min(900px,92vw)] overflow-hidden p-0 flex flex-col">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        <SidebarProvider className="items-start flex-1 min-h-0">
          <Sidebar collapsible="none" className="hidden h-full md:flex">
            <SidebarContent className="h-full">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sections.map((section) => (
                      <SidebarMenuItem key={section.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeSectionId === section.id}
                        >
                          <button
                            type="button"
                            onClick={() => onSectionChange(section.id)}
                          >
                            {section.icon}
                            <span>{section.label}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeSection.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6 pt-4 min-h-0">
              {activeSectionId === "account" ? (
                <AccountSettingsPanel
                  email={profile?.email}
                  emailVerified={profile?.email_verified}
                  fullName={profile?.full_name ?? ""}
                />
              ) : activeSectionId === "security" ? (
                <SecuritySettingsPanel email={profile?.email} />
              ) : activeSectionId === "notifications" ? (
                <NotificationsSettingsPanel settings={profile?.notification_settings} />
              ) : activeSectionId === "settings" ? (
                <AppSettingsPanel />
              ) : (
                <>
                  <div className="rounded-2xl border bg-muted/40 p-6">
                    <p className="text-sm font-medium">Overview</p>
                    <p className="text-xs text-muted-foreground">
                      Settings UI placeholder for {activeSection.label.toLowerCase()}.
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/40 p-6">
                    <p className="text-sm font-medium">Details</p>
                    <p className="text-xs text-muted-foreground">
                      Add real configuration controls here when ready.
                    </p>
                  </div>
                </>
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}

export type { SettingsSectionId }
