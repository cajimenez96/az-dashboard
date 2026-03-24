"use client";

import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Server,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

type NavLabelKey = keyof typeof t.nav;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const navItems = useMemo(() => {
    const role = user?.role;
    const items: {
      href: string;
      labelKey: NavLabelKey;
      icon: LucideIcon;
    }[] = [
      { href: "/dashboard", labelKey: "panel", icon: LayoutDashboard },
      { href: "/clients", labelKey: "clients", icon: Users },
      { href: "/systems", labelKey: "systems", icon: Server },
    ];
    if (role === "SUPERADMIN") {
      items.push({ href: "/users", labelKey: "users", icon: UserCog });
    }
    items.push(
      { href: "/budgets", labelKey: "budgets", icon: CreditCard },
      { href: "/tasks", labelKey: "tasks", icon: ListTodo },
      { href: "/finance", labelKey: "finance", icon: Wallet },
    );
    return items;
  }, [user?.role]);

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
        {navItems.map(({ href, labelKey, icon: Icon }) => {
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
