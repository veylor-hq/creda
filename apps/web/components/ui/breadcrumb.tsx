"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Breadcrumb({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function BreadcrumbList({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

function BreadcrumbItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

function BreadcrumbLink({
  className,
  ...props
}: React.ComponentProps<"a">) {
  return (
    <a
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  )
}

function BreadcrumbPage({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      className={cn("text-foreground font-medium", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-separator"
      className={cn("text-muted-foreground/60", className)}
      {...props}
    >
      {props.children ?? "/"}
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
}
