import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function RouteChangeTracker() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Signal a virtual pageview for SPA route changes
    const url = location.pathname + location.search;

    // Standard analytics event via History API pushState signal
    try {
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (_) {}

    // Also dispatch a custom pageview event for any listeners
    try {
      window.dispatchEvent(
        new CustomEvent("spa-pageview", { detail: { url } })
      );
    } catch (_) {}
  }, [location]);

  return null;
}
