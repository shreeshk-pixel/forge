import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { useForge } from "@/lib/progress";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Forge" },
      { name: "description", content: "Learn Java, OOP, and DSA by writing code that has to pass." },
      { name: "theme-color", content: "#0e1116" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
      },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: Root,
});

function Root() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <ForgeBoot />
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function ForgeBoot() {
  useEffect(() => {
    const boot = () => useForge.getState().syncShards();
    const unsub = useForge.persist.onFinishHydration(boot);
    if (useForge.persist.hasHydrated()) boot();
    else void useForge.persist.rehydrate();
    return unsub;
  }, []);
  return null;
}
