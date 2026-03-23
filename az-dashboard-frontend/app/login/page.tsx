"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { t } from "@/lib/i18n";
import { loginRequest } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginRequest(email, password);
      setAuth({
        user: data.user,
        token: data.access_token,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t.auth.invalidCredentials));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-center text-xl font-semibold tracking-tight text-foreground">
          {t.auth.loginTitle}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {t.nav.appName}
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">{t.auth.email}</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">{t.auth.password}</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t.auth.loggingIn : t.auth.submit}
          </Button>
        </form>
      </div>
    </div>
  );
}
