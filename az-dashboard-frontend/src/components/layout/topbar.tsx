"use client";

import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { t } from "@/lib/i18n";
import { useAuthStore } from "@/stores/auth.store";

function titleForPath(pathname: string): string {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return t.nav.panel;
  }
  if (pathname.startsWith("/clients")) return t.nav.clients;
  if (pathname.startsWith("/systems")) return t.nav.systems;
  if (pathname.startsWith("/users")) return t.nav.users;
  if (pathname.startsWith("/budgets")) return t.nav.budgets;
  if (pathname.startsWith("/tasks")) return t.nav.tasks;
  if (pathname.startsWith("/finance")) return t.nav.finance;
  return t.nav.appName;
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const title = titleForPath(pathname);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {user?.name}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden />
          <span className="hidden sm:inline">{t.common.logOut}</span>
        </button>
      </div>
    </header>
  );
}
