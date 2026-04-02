"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useNavigation } from "@/lib/contexts/navigation-context";
import { SpinningDna } from "@/components/spinning-dna";

const NavigationLoadingContent = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isNavigating, startNavigating, stopNavigating } = useNavigation();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevLocationRef = useRef<string>("");
  const isInitialMount = useRef(true);

  // Listen for link clicks and navigation events
  useEffect(() => {
    const currentPath = window.location.pathname;
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check for Link components (Next.js Link wraps in <a>)
      const link = target.closest('a');
      if (link && link.href && !link.href.startsWith('#') && !link.target && !link.hasAttribute('download')) {
        try {
          const url = new URL(link.href);
          if (url.origin === window.location.origin && url.pathname !== currentPath) {
            // Small delay to avoid flickering on fast navigations
            if (navigationTimeoutRef.current) {
              clearTimeout(navigationTimeoutRef.current);
            }
            navigationTimeoutRef.current = setTimeout(() => {
              startNavigating();
            }, 50);
          }
        } catch (e) {
          // Invalid URL, ignore
        }
      }
      
      // Check for buttons that might trigger navigation
      const button = target.closest('button');
      if (button) {
        // Check if button is inside a Link
        const parentLink = button.closest('a');
        if (parentLink && parentLink.href && !parentLink.href.startsWith('#') && !parentLink.target) {
          try {
            const url = new URL(parentLink.href);
            if (url.origin === window.location.origin && url.pathname !== currentPath) {
              if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
              }
              navigationTimeoutRef.current = setTimeout(() => {
                startNavigating();
              }, 50);
            }
          } catch (e) {
            // Invalid URL, ignore
          }
        }
        
        // Check if button is in dashboard sidebar or navigation area
        // These buttons often trigger router.push()
        const isInNavigationArea = button.closest('[role="navigation"]') || 
                                   button.closest('nav') ||
                                   button.closest('[data-navigation]') ||
                                   (button.closest('aside') && window.location.pathname.includes('/dashboard'));
        
        if (isInNavigationArea && !button.disabled) {
          // Assume navigation might happen, show loading after a short delay
          // This will be cancelled if pathname doesn't change
          if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
          }
          navigationTimeoutRef.current = setTimeout(() => {
            // Only show if pathname hasn't changed yet (navigation is in progress)
            if (window.location.pathname === currentPath) {
              startNavigating();
            }
          }, 150);
        }
      }
    };

    // Intercept Next.js router navigation by listening to route changes
    // Next.js App Router uses pushState/replaceState internally
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    let lastPath = currentPath;

    history.pushState = function(...args) {
      const result = originalPushState.apply(history, args);
      // Use a small delay to check if path actually changed
      setTimeout(() => {
        const newPath = window.location.pathname;
        if (newPath !== lastPath && newPath !== pathname) {
          lastPath = newPath;
          if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
          }
          navigationTimeoutRef.current = setTimeout(() => {
            startNavigating();
          }, 50);
        }
      }, 0);
      return result;
    };

    history.replaceState = function(...args) {
      const result = originalReplaceState.apply(history, args);
      setTimeout(() => {
        const newPath = window.location.pathname;
        if (newPath !== lastPath && newPath !== pathname) {
          lastPath = newPath;
          if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
          }
          navigationTimeoutRef.current = setTimeout(() => {
            startNavigating();
          }, 50);
        }
      }, 0);
      return result;
    };

    document.addEventListener('click', handleClick, true);
    const handlePopState = () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      navigationTimeoutRef.current = setTimeout(() => {
        startNavigating();
      }, 50);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleClick, true);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      window.removeEventListener('popstate', handlePopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [pathname, startNavigating]);

  const searchParamsString = searchParams?.toString() ?? "";
  const currentLocation = `${pathname}?${searchParamsString}`;

  // Stop loading when pathname or search params change
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevLocationRef.current = currentLocation;
      return;
    }

    if (prevLocationRef.current !== currentLocation) {
      prevLocationRef.current = currentLocation;

      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }

      // Stop shortly after any location change to avoid stale overlays
      stopTimeoutRef.current = setTimeout(() => {
        stopNavigating();
      }, 100);
    }

    return () => {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
    };
  }, [currentLocation, stopNavigating]);

  // Safety timeout: ensure overlay never gets stuck indefinitely
  useEffect(() => {
    if (isNavigating) {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
      safetyTimeoutRef.current = setTimeout(() => {
        stopNavigating();
      }, 6000);
      return () => {
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
        }
      };
    }

    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  }, [isNavigating, stopNavigating]);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex animate-in fade-in items-center justify-center duration-200">
      <div
        className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_35%,rgba(56,189,248,0.12),transparent)]"
        aria-hidden
      />

      <div
        className="relative flex flex-col items-center gap-8 rounded-2xl border border-sky-400/25 bg-zinc-950/90 px-10 py-10 shadow-[0_0_48px_-12px_rgba(56,189,248,0.35)] backdrop-blur-xl animate-in zoom-in-95 duration-300 md:px-14 md:py-11"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <SpinningDna size="lg" />
        <div className="space-y-1 text-center">
          <p className="text-base font-bold text-white md:text-lg">Loading…</p>
          <p className="text-xs text-white/55 md:text-sm">Educational Biotechnology platform</p>
        </div>
      </div>
    </div>
  );
};

export const NavigationLoading = () => {
  return (
    <Suspense fallback={null}>
      <NavigationLoadingContent />
    </Suspense>
  );
};

