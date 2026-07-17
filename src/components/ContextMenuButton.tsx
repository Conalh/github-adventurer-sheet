import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ContextMenuAction = {
  id: string;
  label: string;
  target?: string;
  onSelect?: () => void;
};

type MenuPoint = { x: number; y: number };

type ContextMenuButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "onContextMenu"
> & {
  children: ReactNode;
  items: ContextMenuAction[];
  menuLabel?: string;
};

const VIEWPORT_GUTTER = 8;

export function fitContextMenuToViewport(
  point: MenuPoint,
  menu: { width: number; height: number },
  viewport: { width: number; height: number },
): MenuPoint {
  return {
    x: Math.max(
      VIEWPORT_GUTTER,
      Math.min(point.x, viewport.width - menu.width - VIEWPORT_GUTTER),
    ),
    y: Math.max(
      VIEWPORT_GUTTER,
      Math.min(point.y, viewport.height - menu.height - VIEWPORT_GUTTER),
    ),
  };
}

export function ContextMenuButton({
  children,
  items,
  menuLabel = "Choose option",
  ...buttonProps
}: ContextMenuButtonProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<MenuPoint | null>(null);
  const [position, setPosition] = useState<MenuPoint | null>(null);
  const open = anchor !== null;

  const close = (restoreFocus = false) => {
    setAnchor(null);
    setPosition(null);

    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  useLayoutEffect(() => {
    if (!anchor || !menuRef.current) return;

    const bounds = menuRef.current.getBoundingClientRect();
    setPosition(
      fitContextMenuToViewport(
        anchor,
        { width: bounds.width, height: bounds.height },
        { width: window.innerWidth, height: window.innerHeight },
      ),
    );
  }, [anchor]);

  useEffect(() => {
    if (!position) return;

    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus();
  }, [position]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        close();
      }
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };
    const handleViewportChange = () => close();

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open]);

  const openFromTrigger = () => {
    const bounds = triggerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    setPosition(null);
    setAnchor({ x: bounds.left + 12, y: bounds.top + 12 });
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    const actions = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)',
      ),
    );
    const currentIndex = actions.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex = currentIndex;

    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = actions.length - 1;
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % actions.length;
    if (event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + actions.length) % actions.length;
    }

    event.preventDefault();
    actions[nextIndex]?.focus();
  };

  return (
    <>
      <button
        {...buttonProps}
        ref={triggerRef}
        aria-haspopup="menu"
        aria-expanded={open}
        data-context-trigger="true"
        onClick={openFromTrigger}
        onContextMenu={(event) => {
          event.preventDefault();
          setPosition(null);
          setAnchor({ x: event.clientX, y: event.clientY });
        }}
      >
        {children}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className="context-menu context-menu--floating"
              role="menu"
              aria-label={menuLabel}
              onKeyDown={handleMenuKeyDown}
              style={{
                left: position?.x ?? anchor.x,
                top: position?.y ?? anchor.y,
                visibility: position ? "visible" : "hidden",
              }}
            >
              <p className="context-title" role="presentation">
                Choose Option
              </p>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    item.onSelect?.();
                    close();
                  }}
                >
                  {item.label}
                  {item.target ? (
                    <> <span className="context-target">{item.target}</span></>
                  ) : null}
                </button>
              ))}
              <button type="button" role="menuitem" onClick={() => close()}>
                Cancel
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
