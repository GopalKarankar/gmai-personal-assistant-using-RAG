import { useEffect, useRef } from "react";

// useClickOutside: returns a ref to attach to the element that should
// ignore outside clicks. Calls `handler` when a click/touch occurs outside.
export default function useClickOutside(handler) {
  const ref = useRef(null);

  useEffect(() => {
    if (typeof handler !== "function") return;

    const listener = (event) => {
      const el = ref.current;
      if (!el) return;
      // If click is inside element, do nothing
      if (el.contains(event.target)) return;
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler]);

  return ref;
}
