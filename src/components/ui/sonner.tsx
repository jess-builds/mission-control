"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-[#228B22]" />,
        info: <InfoIcon className="size-4 text-[#4169E1]" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500" />,
        error: <OctagonXIcon className="size-4 text-red-500" />,
        loading: <Loader2Icon className="size-4 animate-spin text-[#4169E1]" />,
      }}
      style={
        {
          "--normal-bg": "#111113",
          "--normal-text": "#fafafa",
          "--normal-border": "rgba(255,255,255,0.1)",
          "--border-radius": "12px",
          "--success-bg": "rgba(34,139,34,0.1)",
          "--success-border": "rgba(34,139,34,0.2)",
          "--error-bg": "rgba(239,68,68,0.1)",
          "--error-border": "rgba(239,68,68,0.2)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
