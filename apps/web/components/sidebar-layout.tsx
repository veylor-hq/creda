"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { CustomersTable } from "@/components/customers-table"
import { DashboardBlankState } from "@/components/dashboard-blank"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LayoutIcon,
  UnfoldMoreIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"

type AppTabId = "dashboard" | "customers"

type AppTab = {
  id: AppTabId
  label: string
  icon: React.ReactNode
  component: React.ComponentType
}

type WorkspaceOption = {
  id: string
  name: string
}

const tabs: AppTab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <HugeiconsIcon icon={LayoutIcon} strokeWidth={2} />,
    component: DashboardBlankState,
  },
  {
    id: "customers",
    label: "Customers",
    icon: <HugeiconsIcon icon={UserIcon} strokeWidth={2} />,
    component: CustomersTable,
  },
]

export function SidebarIconLayout() {
  const router = useRouter()
  const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
  }

  const [workspaces, setWorkspaces] = React.useState<WorkspaceOption[]>([])
  const [activeWorkspace, setActiveWorkspace] =
    React.useState<WorkspaceOption | null>(null)
  const [isAddWorkspaceOpen, setIsAddWorkspaceOpen] = React.useState(false)
  const [activeTabId, setActiveTabId] = React.useState<AppTabId>(
    "dashboard"
  )

  React.useEffect(() => {
    async function loadWorkspaces() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL) {
        return
      }

      const res = await fetch(`${API_URL}/api/private/workspace/`, {
        credentials: "include",
      })

      if (res.status === 401) {
        router.push("/signin")
        return
      }

      if (!res.ok) {
        return
      }

      const data = (await res.json()) as WorkspaceOption[]
      setWorkspaces(data)
      setActiveWorkspace((current) => current ?? data[0] ?? null)
    }

    loadWorkspaces()
  }, [router])

  React.useEffect(() => {
    const stored = localStorage.getItem("sidebar-active-tab")
    if (stored === "dashboard" || stored === "customers") {
      setActiveTabId(stored)
    }
  }, [])

  React.useEffect(() => {
    localStorage.setItem("sidebar-active-tab", activeTabId)
  }, [activeTabId])
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const ActiveContent = activeTab.component

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                  >
                    <Button size="icon-sm" asChild className="size-8">
                      <span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 256 256"
                        >
                          <rect width="256" height="256" fill="none"></rect>
                          <line
                            x1="208"
                            y1="128"
                            x2="128"
                            y2="208"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="32"
                          ></line>
                          <line
                            x1="192"
                            y1="40"
                            x2="40"
                            y2="192"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="32"
                          ></line>
                        </svg>
                      </span>
                    </Button>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {activeWorkspace?.name ?? "Select workspace"}
                      </span>
                      <span className="truncate text-xs">
                        Workspace
                      </span>
                    </div>
                    <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                    {workspaces.length ? (
                      workspaces.map((workspace) => {
                        const isActive = activeWorkspace?.id === workspace.id

                        return (
                          <DropdownMenuItem
                            key={workspace.id}
                            onClick={() => setActiveWorkspace(workspace)}
                          >
                            <span>{workspace.name}</span>
                            {isActive && (
                              <Badge
                                variant="outline"
                                className="ml-auto text-[10px] uppercase"
                              >
                                Active
                              </Badge>
                            )}
                          </DropdownMenuItem>
                        )
                      })
                    ) : (
                      <DropdownMenuItem className="text-muted-foreground" disabled>
                        No workspaces
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      setIsAddWorkspaceOpen(true)
                    }}
                  >
                    Add new workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tabs.map((tab) => (
                  <SidebarMenuItem key={tab.id}>
                    <SidebarMenuButton
                      tooltip={tab.label}
                      isActive={activeTabId === tab.id}
                      onClick={() => setActiveTabId(tab.id)}
                      className="gap-2"
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                  >
                    <Avatar>
                      <AvatarImage
                        src={data.user.avatar}
                        alt={data.user.name}
                      />
                      <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {data.user.name}
                      </span>
                      <span className="truncate text-xs">
                        {data.user.email}
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
                            <AvatarImage
                              src={data.user.avatar}
                              alt={data.user.name}
                            />
                            <AvatarFallback>CN</AvatarFallback>
                          </Avatar>
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>{data.user.name}</ItemTitle>
                          <ItemDescription> {data.user.email}</ItemDescription>
                        </ItemContent>
                      </Item>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuGroup>
                    <DropdownMenuItem>Account</DropdownMenuItem>
                    <DropdownMenuItem>Billing</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuGroup>
                    <DropdownMenuItem>Log out</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-3 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{activeTab.label}</span>
              <span className="text-xs text-muted-foreground">
                Switch tabs from the sidebar
              </span>
            </div>
          </div>
        </header>
        <ActiveContent />
      </SidebarInset>
      <AlertDialog
        open={isAddWorkspaceOpen}
        onOpenChange={setIsAddWorkspaceOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Coming soon!</AlertDialogTitle>
            <AlertDialogDescription>
              Workspace creation is on the way.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction>Got it</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}
