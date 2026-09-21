import { useEffect, useRef } from "react"

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Traps Tab focus within the returned container while `active`, and moves focus into it on
 * activation (design section B7). Give the container `tabIndex={-1}` so focus can land on it
 * directly. Return-focus to the opener is handled by the caller, since the launcher unmounts.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const container = ref.current
    if (!active || !container) return

    container.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return
      const els = Array.from(container!.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (els.length === 0) return
      const first = els[0]
      const last = els[els.length - 1]
      const activeEl = document.activeElement
      if (event.shiftKey && (activeEl === first || activeEl === container)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener("keydown", onKeyDown)
    return () => container.removeEventListener("keydown", onKeyDown)
  }, [active])

  return ref
}
