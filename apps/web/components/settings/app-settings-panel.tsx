"use client"

import { useMemo } from "react"
import { useTheme } from "next-themes"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function AppSettingsPanel() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const isDark = useMemo(() => {
    if (theme === "system") {
      return resolvedTheme === "dark"
    }
    return theme === "dark"
  }, [resolvedTheme, theme])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="rounded-2xl border bg-muted/40 p-6">
        <p className="text-sm font-medium">Appearance</p>
        <p className="text-xs text-muted-foreground">
          Switch between light and dark mode.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-xl border bg-background/60 px-4 py-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Dark mode</Label>
            <p className="text-xs text-muted-foreground">
              Toggle the interface theme.
            </p>
          </div>
          <Switch
            checked={isDark}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>
      </div>
    </div>
  )
}
