"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Lazy load the theme toggle
const ThemeToggle = dynamic(() => import("@/components/ThemeToggle"), {
  loading: () => <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />,
});

interface HeaderProps {
  creditBalance: number | null;
  planCode: string | null;
}

export function Header({ creditBalance, planCode }: HeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === "/app") return "Dashboard";
    if (pathname?.startsWith("/app/ted")) return "TED AI Assistant";
    if (pathname?.startsWith("/app/leads")) return "All Leads";
    if (pathname?.startsWith("/app/lists")) return "Lists";
    if (pathname?.startsWith("/app/lead-searches")) return "Lead Searches";
    if (pathname?.startsWith("/app/campaigns")) return "Campaigns";
    if (pathname?.startsWith("/app/inbox")) return "Inbox";
    if (pathname?.startsWith("/app/analytics")) return "Analytics";
    if (pathname?.startsWith("/app/email-accounts")) return "Email Accounts";
    if (pathname?.startsWith("/app/integrations")) return "Integrations";
    if (pathname?.startsWith("/app/billing")) return "Billing";
    return "";
  };

  return (
    <header className="px-6 py-4 border-b bg-surface border-ui">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ui">
            {getPageTitle()}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle size="sm" />
          <div className="flex items-center gap-2">
            {planCode && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-sidebar-border text-ui">{planCode}</span>
            )}
            <Link href="/app/billing">
              <div className="px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity bg-accent-soft text-accent">
                {creditBalance !== null ? `${creditBalance.toLocaleString()} credits` : "Loading..."}
              </div>
            </Link>
            <Link href="/app/billing" className="text-sm font-medium underline text-accent">Top up</Link>
          </div>
        </div>
      </div>
    </header>
  );
}