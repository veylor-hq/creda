"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type WorkspaceOption = {
  id: string
  name: string
  owner_id?: string
}

type WorkspaceMember = {
  id: string
  email: string
  full_name?: string | null
}

type WorkspaceInvite = {
  id: string
  email: string
  created_at: string
}

type WorkspaceManagerDialogProps = {
  open: boolean
  activeWorkspace: WorkspaceOption | null
  workspaces: WorkspaceOption[]
  onOpenChange: (open: boolean) => void
  onWorkspaceChange: (workspace: WorkspaceOption) => void
  onRefresh: () => Promise<void>
}

export function WorkspaceManagerDialog({
  open,
  activeWorkspace,
  workspaces,
  onOpenChange,
  onWorkspaceChange,
  onRefresh,
}: WorkspaceManagerDialogProps) {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [details, setDetails] = useState<WorkspaceOption | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [invites, setInvites] = useState<WorkspaceInvite[]>([])
  const [renameValue, setRenameValue] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [notice, setNotice] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setNotice(null)
    }
  }, [open])

  useEffect(() => {
    async function loadProfile() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL
      if (!API_URL) return

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

      const data = (await res.json()) as { id: string }
      setCurrentUserId(data.id)
    }

    if (open) {
      loadProfile()
    }
  }, [open, router])

  useEffect(() => {
    async function loadWorkspaceDetails() {
      if (!activeWorkspace) {
        return
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL
      if (!API_URL) return

      const [detailsRes, invitesRes] = await Promise.all([
        fetch(`${API_URL}/api/private/workspace/${activeWorkspace.id}`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/private/workspace/${activeWorkspace.id}/invites`, {
          credentials: "include",
        }),
      ])

      if (detailsRes.status === 401 || invitesRes.status === 401) {
        router.push("/signin")
        return
      }

      if (detailsRes.ok) {
        const data = (await detailsRes.json()) as {
          id: string
          name: string
          owner_id: string
          members: WorkspaceMember[]
        }
        setDetails({ id: data.id, name: data.name, owner_id: data.owner_id })
        setMembers(data.members)
        setRenameValue(data.name)
      }

      if (invitesRes.ok) {
        const data = (await invitesRes.json()) as WorkspaceInvite[]
        setInvites(data)
      }
    }

    if (open && activeWorkspace) {
      loadWorkspaceDetails()
    }
  }, [open, activeWorkspace, router])

  const isOwner = useMemo(() => {
    if (!details?.owner_id || !currentUserId) return false
    return details.owner_id === currentUserId
  }, [details?.owner_id, currentUserId])

  const handleRename = async () => {
    if (!details) return
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) return

    const name = renameValue.trim()
    if (!name) {
      setNotice("Workspace name is required.")
      return
    }

    setIsBusy(true)
    const res = await fetch(`${API_URL}/api/private/workspace/${details.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    setIsBusy(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setNotice(data?.detail ?? "Failed to rename workspace.")
      return
    }

    await onRefresh()
  }

  const handleDelete = async () => {
    if (!details) return
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) return

    setIsBusy(true)
    const res = await fetch(`${API_URL}/api/private/workspace/${details.id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    setIsBusy(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setNotice(data?.detail ?? "Failed to delete workspace.")
      return
    }

    await onRefresh()
    const nextWorkspace = workspaces.find((workspace) => workspace.id !== details.id)
    if (nextWorkspace) {
      onWorkspaceChange(nextWorkspace)
    }
    onOpenChange(false)
  }

  const handleInvite = async () => {
    if (!details) return
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) return

    const email = inviteEmail.trim()
    if (!email) {
      setNotice("Invite email is required.")
      return
    }

    setIsBusy(true)
    const res = await fetch(
      `${API_URL}/api/private/workspace/${details.id}/invite`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    )

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    setIsBusy(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setNotice(data?.detail ?? "Failed to send invite.")
      return
    }

    setInviteEmail("")
    await onRefresh()
    if (activeWorkspace) {
      const invitesRes = await fetch(
        `${API_URL}/api/private/workspace/${activeWorkspace.id}/invites`,
        { credentials: "include" }
      )
      if (invitesRes.ok) {
        const data = (await invitesRes.json()) as WorkspaceInvite[]
        setInvites(data)
      }
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    if (!details) return
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) return

    const res = await fetch(
      `${API_URL}/api/private/workspace/${details.id}/invites/${inviteId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    )

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setNotice(data?.detail ?? "Failed to revoke invite.")
      return
    }

    setInvites((prev) => prev.filter((invite) => invite.id !== inviteId))
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!details) return
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) return

    const res = await fetch(
      `${API_URL}/api/private/workspace/${details.id}/members/${memberId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    )

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setNotice(data?.detail ?? "Failed to remove member.")
      return
    }

    setMembers((prev) => prev.filter((member) => member.id !== memberId))
  }

  const handleLeaveWorkspace = async () => {
    if (!details) return
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) return

    setIsBusy(true)
    const res = await fetch(
      `${API_URL}/api/private/workspace/${details.id}/leave`,
      {
        method: "DELETE",
        credentials: "include",
      }
    )

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    setIsBusy(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setNotice(data?.detail ?? "Failed to leave workspace.")
      return
    }

    await onRefresh()
    const nextWorkspace = workspaces.find((workspace) => workspace.id !== details.id)
    if (nextWorkspace) {
      onWorkspaceChange(nextWorkspace)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(720px,85vh)] w-[min(820px,94vw)] overflow-hidden rounded-2xl p-0">
        <DialogTitle className="sr-only">Workspaces</DialogTitle>
        <DialogDescription className="sr-only">
          Manage workspaces, members, and invites.
        </DialogDescription>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <p className="text-sm font-medium">Workspaces</p>
              <p className="text-xs text-muted-foreground">
                Rename, invite, and manage members.
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {notice && <p className="text-xs text-destructive">{notice}</p>}
            <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
              {!details ? (
                <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Select a workspace to manage.
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-sm font-medium">Workspace name</p>
                    <p className="text-xs text-muted-foreground">
                      Rename your workspace.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        disabled={!isOwner}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRename}
                        disabled={!isOwner || isBusy}
                      >
                        Save
                      </Button>
                    </div>
                    {!isOwner && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Only the workspace owner can rename.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-sm font-medium">Members</p>
                    <p className="text-xs text-muted-foreground">
                      Manage access to this workspace.
                    </p>
                    <div className="mt-4 space-y-2">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-xl border bg-background/60 px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">
                              {member.full_name || member.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                          {details.owner_id === member.id ? (
                            <Badge variant="outline">Owner</Badge>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!isOwner}
                                >
                                  Remove
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove member?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This user will lose access to the workspace.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveMember(member.id)}
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      ))}
                    </div>
                    {!isOwner && (
                      <div className="mt-4">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              disabled={isBusy}
                            >
                              Leave workspace
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Leave this workspace?</AlertDialogTitle>
                              <AlertDialogDescription>
                                You will lose access to all data in this workspace.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction variant="destructive" onClick={handleLeaveWorkspace}>
                                Leave
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-sm font-medium">Invite members</p>
                    <p className="text-xs text-muted-foreground">
                      Only owners can invite new members.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        placeholder="email@company.com"
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(event.target.value)}
                        disabled={!isOwner}
                      />
                      <Button
                        size="sm"
                        onClick={handleInvite}
                        disabled={!isOwner || isBusy}
                      >
                        Send invite
                      </Button>
                    </div>
                    {invites.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {invites.map((invite) => (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between rounded-xl border bg-background/60 px-3 py-2 text-sm"
                          >
                            <span>{invite.email}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevokeInvite(invite.id)}
                              disabled={!isOwner}
                            >
                              Revoke
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-sm font-medium">Danger zone</p>
                    <p className="text-xs text-muted-foreground">
                      Delete this workspace (soft delete).
                    </p>
                    <div className="mt-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            disabled={!isOwner || isBusy}
                          >
                            Delete workspace
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will archive the workspace.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={handleDelete}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
