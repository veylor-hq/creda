"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type WorkspaceOption = {
  id: string
  name: string
  owner_id?: string
}

type WorkspaceCreateAlertProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (workspace: WorkspaceOption) => void
}

export function WorkspaceCreateAlert({
  open,
  onOpenChange,
  onCreated,
}: WorkspaceCreateAlertProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleCreate = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) return

    const trimmed = name.trim()
    if (!trimmed) {
      setError("Workspace name is required.")
      return
    }

    setIsSaving(true)
    setError(null)

    const res = await fetch(`${API_URL}/api/private/workspace/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    setIsSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.detail ?? "Failed to create workspace.")
      return
    }

    const workspace = (await res.json()) as WorkspaceOption
    setName("")
    onCreated(workspace)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>New workspace</AlertDialogTitle>
          <AlertDialogDescription>
            Create another workspace to organize your data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="workspace-name">Workspace name</Label>
          <Input
            id="workspace-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Acme Ltd"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCreate} disabled={isSaving}>
            {isSaving ? "Creating…" : "Create"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
