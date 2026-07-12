import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Rect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

type Size = {
  width: number;
  height: number;
};

type FloatingPosition = {
  top: number;
  left: number;
  placement: "above" | "below";
};

const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 7;

export function computeFloatingTooltipPosition(
  trigger: Rect,
  tooltip: Size,
  viewport: Size,
): FloatingPosition {
  const above = trigger.top - tooltip.height - TRIGGER_GAP;
  const placement = above >= VIEWPORT_MARGIN ? "above" : "below";
  const desiredTop = placement === "above"
    ? above
    : trigger.bottom + TRIGGER_GAP;
  const maxTop = Math.max(
    VIEWPORT_MARGIN,
    viewport.height - tooltip.height - VIEWPORT_MARGIN,
  );
  const centeredLeft = trigger.left + trigger.width / 2 - tooltip.width / 2;
  const maxLeft = Math.max(
    VIEWPORT_MARGIN,
    viewport.width - tooltip.width - VIEWPORT_MARGIN,
  );

  return {
    top: clamp(desiredTop, VIEWPORT_MARGIN, maxTop),
    left: clamp(centeredLeft, VIEWPORT_MARGIN, maxLeft),
    placement,
  };
}

export function FloatingTooltip({ children }: { children: ReactNode }) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<FloatingPosition | null>(null);

  const updatePosition = useCallback(() => {
    const trigger = anchorRef.current?.parentElement;
    const tooltip = tooltipRef.current;

    if (!trigger?.isConnected || !tooltip) {
      setOpen(false);
      return;
    }

    setPosition(computeFloatingTooltipPosition(
      trigger.getBoundingClientRect(),
      tooltip.getBoundingClientRect(),
      { width: window.innerWidth, height: window.innerHeight },
    ));
  }, []);

  useEffect(() => {
    const trigger = anchorRef.current?.parentElement;
    if (!trigger) return;

    const show = () => setOpen(true);
    const hide = () => setOpen(false);
    const hideAfterFocus = (event: FocusEvent) => {
      if (!trigger.contains(event.relatedTarget as Node | null)) hide();
    };

    trigger.addEventListener("pointerenter", show);
    trigger.addEventListener("pointerleave", hide);
    trigger.addEventListener("focusin", show);
    trigger.addEventListener("focusout", hideAfterFocus);

    return () => {
      trigger.removeEventListener("pointerenter", show);
      trigger.removeEventListener("pointerleave", hide);
      trigger.removeEventListener("focusin", show);
      trigger.removeEventListener("focusout", hideAfterFocus);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <>
      <span ref={anchorRef} className="floating-tooltip-anchor" aria-hidden="true" />
      {open && typeof document !== "undefined"
        ? createPortal(
            <span
              ref={tooltipRef}
              className="rs-tooltip rs-tooltip--floating"
              role="presentation"
              data-placement={position?.placement}
              style={{
                top: position?.top ?? -10_000,
                left: position?.left ?? -10_000,
                visibility: position ? "visible" : "hidden",
              }}
            >
              {children}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
