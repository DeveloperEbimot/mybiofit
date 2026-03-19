import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Check if dismissed recently (24h cooldown)
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 86400000) return;

    // iOS detection (no beforeinstallprompt support)
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show iOS instructions after 3 seconds
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      // Log the install
      supabase.from("pwa_installs").insert({
        user_agent: navigator.userAgent,
        platform: navigator.platform || "unknown",
      }).then();
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", String(Date.now()));
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-fade-up md:left-auto md:right-6 md:max-w-sm">
      <div className="glass-card p-5 border border-primary/30 shadow-xl shadow-primary/10">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-foreground text-sm mb-1">
              Install BioFit
            </h3>
            {isIOS ? (
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Tap the <strong>Share</strong> button in Safari, then select <strong>"Add to Home Screen"</strong> to install BioFit.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Add BioFit to your home screen for quick access and an app-like experience.
              </p>
            )}
            <div className="flex gap-2">
              {!isIOS && (
                <Button size="sm" onClick={handleInstall} className="text-xs gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Install
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs">
                {isIOS ? "Got it" : "Not now"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
