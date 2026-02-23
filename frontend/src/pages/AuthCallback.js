import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const { handleGoogleCallback } = useAuth();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        const hash = window.location.hash;
        const sessionId = hash.split("session_id=")[1];
        if (!sessionId) {
          navigate("/auth", { replace: true });
          return;
        }
        const role = localStorage.getItem("pendingRole") || "consumer";
        const user = await handleGoogleCallback(sessionId, role);
        localStorage.removeItem("pendingRole");
        // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
        navigate(user.role === "consumer" ? "/dashboard" : "/pharmacy", { replace: true });
      } catch (err) {
        console.error("Auth callback error:", err);
        navigate("/auth", { replace: true });
      }
    };

    processAuth();
  }, [handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="auth-callback">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
