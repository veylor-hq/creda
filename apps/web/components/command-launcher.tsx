"use client"

import { useEffect, useMemo, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { trackEvent } from "@/lib/analytics"

export type CommandAction = {
  id: string
  label: string
  description?: string
  shortcut?: string
  onSelect: () => void
}

type CommandLauncherProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  actions: CommandAction[]
}

export function CommandLauncher({
  open,
  onOpenChange,
  actions,
}: CommandLauncherProps) {
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!open) {
      setQuery("")
      return
    }
    trackEvent("command_opened")
  }, [open])

  const filteredActions = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) {
      return actions
    }

    return actions.filter((action) =>
      `${action.label} ${action.description ?? ""}`
        .toLowerCase()
        .includes(value)
    )
  }, [actions, query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(560px,92vw)] overflow-hidden p-0">
        <DialogTitle className="sr-only">Command launcher</DialogTitle>
        <DialogDescription className="sr-only">
          Quickly trigger common actions.
        </DialogDescription>
        <div className="border-b px-4 py-3">
          <Input
            autoFocus
            placeholder="Type a command"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="max-h-[320px] overflow-y-auto p-2">
          {filteredActions.length ? (
            filteredActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  action.onSelect()
                  trackEvent("command_executed", { action_id: action.id })
                  onOpenChange(false)
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
              >
                <div>
                  <p className="font-medium">{action.label}</p>
                  {action.description && (
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-6 text-sm text-muted-foreground">
              No matches.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
