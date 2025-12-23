"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { CustomersTable } from "@/components/customers-table"
import { DashboardOverview } from "@/components/dashboard-overview"
import { TransactionsTab } from "@/components/income/transactions-tab"
import { InvoicesTab } from "@/components/invoices/invoices-tab"
import { SidebarProfileMenu } from "@/components/sidebar-profile-menu"
import { CommandLauncher } from "@/components/command-launcher"
import { WorkspaceManagerDialog } from "@/components/workspaces/workspace-manager-dialog"
import { WorkspaceCreateAlert } from "@/components/workspaces/workspace-create-alert"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CreditCardIcon,
  File01Icon,
  LayoutIcon,
  PlusSignIcon,
  UnfoldMoreIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { Badge } from "./ui/badge"

type AppTabId = "dashboard" | "customers" | "income" | "invoices"

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
    component: DashboardOverview,
  },
  {
    id: "customers",
    label: "Customers",
    icon: <HugeiconsIcon icon={UserIcon} strokeWidth={2} />,
    component: CustomersTable,
  },
  {
    id: "income",
    label: "Income",
    icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />,
    component: TransactionsTab,
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: <HugeiconsIcon icon={File01Icon} strokeWidth={2} />,
    component: InvoicesTab,
  },
]

export function SidebarIconLayout() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = React.useState<WorkspaceOption[]>([])
  const [activeWorkspace, setActiveWorkspace] =
    React.useState<WorkspaceOption | null>(null)
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = React.useState(false)
  const [workspaceCreateOpen, setWorkspaceCreateOpen] = React.useState(false)
  const [commandOpen, setCommandOpen] = React.useState(false)
  const [activeTabId, setActiveTabId] = React.useState<AppTabId>(
    "dashboard"
  )

  React.useEffect(() => {
    const storedWorkspace = localStorage.getItem("active-workspace-id")
    if (storedWorkspace) {
      setActiveWorkspace((current) => current ?? { id: storedWorkspace, name: "Workspace" })
    }
  }, [])

  const refreshWorkspaces = React.useCallback(async () => {
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
    setActiveWorkspace((current) => {
      if (current && data.find((workspace) => workspace.id === current.id)) {
        return data.find((workspace) => workspace.id === current.id) ?? current
      }
      const storedWorkspace = localStorage.getItem("active-workspace-id")
      if (storedWorkspace) {
        return data.find((workspace) => workspace.id === storedWorkspace) ?? data[0] ?? null
      }
      return data[0] ?? null
    })
  }, [router])

  React.useEffect(() => {
    refreshWorkspaces()
  }, [refreshWorkspaces])

  React.useEffect(() => {
    const stored = localStorage.getItem("sidebar-active-tab")
    if (
      stored === "dashboard" ||
      stored === "customers" ||
      stored === "income" ||
      stored === "invoices"
    ) {
      setActiveTabId(stored)
    }
  }, [])

  React.useEffect(() => {
    const handleSwitchTab = (event: Event) => {
      const detail = (event as CustomEvent<{ tabId: AppTabId }>).detail
      if (detail?.tabId) {
        setActiveTabId(detail.tabId)
      }
    }

    window.addEventListener("app:switch-tab", handleSwitchTab)
    return () => window.removeEventListener("app:switch-tab", handleSwitchTab)
  }, [])

  React.useEffect(() => {
    localStorage.setItem("sidebar-active-tab", activeTabId)
  }, [activeTabId])

  React.useEffect(() => {
    async function selectWorkspace() {
      if (!activeWorkspace?.id) {
        return
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL
      if (API_URL) {
        await fetch(
          `${API_URL}/api/private/workspace/${activeWorkspace.id}/select`,
          {
            method: "POST",
            credentials: "include",
          }
        ).catch(() => null)
      }

      document.cookie = `X-Workspace-ID=${activeWorkspace.id}; path=/; max-age=${60 * 60 * 24 * 30}`
      localStorage.setItem("active-workspace-id", activeWorkspace.id)
      window.dispatchEvent(
        new CustomEvent("app:workspace-changed", {
          detail: { workspaceId: activeWorkspace.id },
        })
      )
    }

    selectWorkspace()
  }, [activeWorkspace?.id])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCommand = event.metaKey || event.ctrlKey
      if (isCommand && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setCommandOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const ActiveContent = activeTab.component

  const dispatchTab = (tabId: AppTabId) => {
    setActiveTabId(tabId)
  }

  const handleAddCustomer = () => {
    localStorage.setItem("open-customer-dialog", "true")
    window.dispatchEvent(new Event("app:open-customer-dialog"))
    dispatchTab("customers")
  }

  const handleAddIncome = () => {
    localStorage.setItem("open-income-dialog", "true")
    window.dispatchEvent(new Event("app:open-income-dialog"))
    dispatchTab("income")
  }

  const handleAddInvoice = () => {
    localStorage.setItem("open-invoice-dialog", "true")
    window.dispatchEvent(new Event("app:open-invoice-dialog"))
    dispatchTab("invoices")
  }

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
                      setWorkspaceDialogOpen(true)
                    }}
                  >
                    Manage workspace
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      setWorkspaceCreateOpen(true)
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
                    {(tab.id === "customers" ||
                      tab.id === "income" ||
                      tab.id === "invoices") && (
                      <SidebarMenuAction
                        showOnHover
                        onClick={() =>
                          tab.id === "customers"
                            ? handleAddCustomer()
                            : tab.id === "income"
                              ? handleAddIncome()
                              : handleAddInvoice()
                        }
                      >
                        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
                        <span className="sr-only">
                          {tab.id === "customers"
                            ? "Add customer"
                            : tab.id === "income"
                              ? "Add transaction"
                              : "Add invoice"}
                        </span>
                      </SidebarMenuAction>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarProfileMenu />
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-3">
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
      <WorkspaceManagerDialog
        open={workspaceDialogOpen}
        activeWorkspace={activeWorkspace}
        workspaces={workspaces}
        onOpenChange={setWorkspaceDialogOpen}
        onWorkspaceChange={setActiveWorkspace}
        onRefresh={refreshWorkspaces}
      />
      <WorkspaceCreateAlert
        open={workspaceCreateOpen}
        onOpenChange={setWorkspaceCreateOpen}
        onCreated={(workspace) => {
          refreshWorkspaces().then(() => {
            setActiveWorkspace(workspace)
          })
        }}
      />
      <CommandLauncher
        open={commandOpen}
        onOpenChange={setCommandOpen}
        actions={[
          {
            id: "add-customer",
            label: "Add customer",
            description: "Create a new customer",
            onSelect: handleAddCustomer,
          },
          {
            id: "add-transaction",
            label: "Add transaction",
            description: "Log incoming income",
            onSelect: handleAddIncome,
          },
          {
            id: "add-invoice",
            label: "Add invoice",
            description: "Create a new invoice",
            onSelect: handleAddInvoice,
          },
          {
            id: "go-dashboard",
            label: "Go to Dashboard",
            description: "Jump to overview",
            onSelect: () => dispatchTab("dashboard"),
          },
          {
            id: "go-customers",
            label: "Go to Customers",
            description: "Open customer list",
            onSelect: () => dispatchTab("customers"),
          },
          {
            id: "go-income",
            label: "Go to Income",
            description: "Open income ledger",
            onSelect: () => dispatchTab("income"),
          },
          {
            id: "go-invoices",
            label: "Go to Invoices",
            description: "Open invoice list",
            onSelect: () => dispatchTab("invoices"),
          },
        ]}
      />
    </SidebarProvider>
  )
}
