"use client";

import {
  CreditCard,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Server,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "panel" as const, icon: LayoutDashboard },
  { href: "/clients", labelKey: "clients" as const, icon: Users },
  { href: "/systems", labelKey: "systems" as const, icon: Server },
  { href: "/budgets", labelKey: "budgets" as const, icon: CreditCard },
  { href: "/tasks", labelKey: "tasks" as const, icon: ListTodo },
  { href: "/finance", labelKey: "finance" as const, icon: Wallet },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside
      className="flex h-screen w-[240px] shrink-0 flex-col border-r border-border bg-background"
      aria-label="Navegación principal"
    >
      <div className="flex h-14 items-center border-b border-border px-5">
        <Link
          href="/dashboard"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          {t.nav.appName}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === href || pathname.startsWith(`${href}/`);

          const label = t.nav[labelKey];

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors",
                "hover:bg-muted",
                active && "bg-muted font-semibold",
              )}
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-3 rounded-md px-2 py-1.5">
          <p className="truncate text-sm font-medium text-foreground">
            {user?.name ?? t.common.user}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          {t.common.logOut}
        </button>
      </div>
    </aside>
  );
}
