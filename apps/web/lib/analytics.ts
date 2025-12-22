export type AnalyticsEventData = Record<string, string | number | boolean>

type UmamiWindow = Window & {
  umami?: {
    track: (event: string, data?: AnalyticsEventData) => void
  }
}

export function trackEvent(event: string, data?: AnalyticsEventData) {
  if (typeof window === "undefined") {
    return
  }

  const umami = (window as UmamiWindow).umami
  if (!umami || typeof umami.track !== "function") {
    return
  }

  umami.track(event, data)
}
