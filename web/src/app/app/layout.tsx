"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { fetchBillingStatus } from "@/lib/api/billing";
import ThemeToggle from "@/components/ThemeToggle";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { loading, user } = useRequireAuth();
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [planCode, setPlanCode] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [trialStatus, setTrialStatus] = useState<any>(null);

  useEffect(() => {
    async function fetchTrial() {
      if (loading || !user) return;
      try {
        const status = await fetchBillingStatus();
        setTrialStatus(status.trialStatus);
      } catch (e) {}
    }
    fetchTrial();
  }, [loading, user]);

  useEffect(() => {
    async function fetchCreditBalance() {
      if (loading || !user) return;

      try {
        const status = await fetchBillingStatus();
        setCreditBalance(status.credits ?? 0);
        setPlanCode(status.planCode ?? "FREE");
      } catch (error) {
        console.error("Failed to fetch credit balance:", error);
      }
    }

    fetchCreditBalance();
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchCreditBalance, 30000);
    return () => clearInterval(interval);
  }, [loading, user]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-sidebar-bg)", color: "var(--color-accent)" }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  const navItems = [
    { 
      name: "TED", 
      href: "/app/ted", 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 64 64">
          <circle cx="16" cy="16" r="8"/>
          <circle cx="48" cy="16" r="8"/>
          <circle cx="32" cy="36" r="20"/>
          <circle cx="26" cy="32" r="2.5" fill="white"/>
          <circle cx="38" cy="32" r="2.5" fill="white"/>
          <path d="M24 40 Q32 46 40 40" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    { 
      name: "Dashboard", 
      href: "/app", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: "Leads", 
      href: "/app/leads", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      name: "Lists", 
      href: "/app/lists", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    { 
      name: "Lead Searches", 
      href: "/app/lead-searches", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    { 
      name: "Campaigns", 
      href: "/app/campaigns", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      name: "Inbox", 
      href: "/app/inbox", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )
    },
    { 
      name: "Analytics", 
      href: "/app/analytics", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      name: "Email Accounts", 
      href: "/app/email-accounts", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      )
    },
    { 
      name: "Integrations", 
      href: "/app/integrations", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      name: "Billing", 
      href: "/app/billing", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      trial: trialStatus && !trialStatus.expired && !trialStatus.active
    },
  ];

  const isActive = (href: string) => {
    if (href === "/app") {
      return pathname === "/app";
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      {/* Sidebar */}
      <aside 
        className="flex flex-col transition-all duration-300 ease-in-out" 
        style={{ 
          backgroundColor: "var(--color-sidebar-bg)", 
          borderRight: `1px solid var(--color-sidebar-border)`,
          width: sidebarExpanded ? "256px" : "72px"
        }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: "var(--color-sidebar-border)" }}>
          <Link href="/app" className="flex items-center space-x-2">
            <span className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
              {sidebarExpanded ? "Zembro" : "Z"}
            </span>
          </Link>
          {sidebarExpanded && (
            <p className="text-xs mt-1" style={{ color: "var(--color-sidebar-text)" }}>
              AI-powered leads
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center rounded-lg transition-all duration-200 hover:bg-opacity-80 relative"
              style={{
                backgroundColor: isActive(item.href) ? "var(--color-sidebar-border)" : "transparent",
                color: isActive(item.href) ? "var(--color-accent)" : "var(--color-sidebar-text)",
                padding: sidebarExpanded ? "12px 16px" : "12px",
                justifyContent: sidebarExpanded ? "flex-start" : "center",
              }}
            >
              <span className={sidebarExpanded ? "flex-shrink-0" : ""}>{item.icon}</span>
              {sidebarExpanded && (
                <span className="ml-3 font-medium whitespace-nowrap flex items-center gap-2">
                  {item.name}
                  {item.trial && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 border border-cyan-200">Free Trial</span>
                  )}
                </span>
              )}
              {!sidebarExpanded && item.trial && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 border-2 border-white" title="Free Trial Available"></span>
              )}
            </Link>
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="p-4 border-t" style={{ borderColor: "var(--color-sidebar-border)" }}>
          <div 
            className="flex items-center rounded-lg py-3"
            style={{
              padding: sidebarExpanded ? "12px 16px" : "12px",
              justifyContent: sidebarExpanded ? "flex-start" : "center",
            }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--color-sidebar-border)" }}>
              <svg className="w-5 h-5" style={{ color: "var(--color-accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {sidebarExpanded && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                  {user?.email || "User"}
                </p>
                <p className="text-xs" style={{ color: "var(--color-sidebar-text)" }}>
                  Credits: {creditBalance !== null ? creditBalance.toLocaleString() : "..."}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--color-bg)" }}>
        {/* Top bar */}
        <header className="px-6 py-4 border-b" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                {pathname === "/app" && "Dashboard"}
                {pathname?.startsWith("/app/ted") && "TED AI Assistant"}
                {pathname?.startsWith("/app/leads") && "All Leads"}
                {pathname?.startsWith("/app/lists") && "Lists"}
                {pathname?.startsWith("/app/lead-searches") && "Lead Searches"}
                {pathname?.startsWith("/app/campaigns") && "Campaigns"}
                {pathname?.startsWith("/app/inbox") && "Inbox"}
                {pathname?.startsWith("/app/analytics") && "Analytics"}
                {pathname?.startsWith("/app/email-accounts") && "Email Accounts"}
                {pathname?.startsWith("/app/integrations") && "Integrations"}
                {pathname?.startsWith("/app/billing") && "Billing"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle size="sm" />
              <div className="flex items-center gap-2">
                {planCode && (
                  <span
                    className="px-2 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: "var(--color-sidebar-border)", color: "var(--color-text)" }}
                  >
                    {planCode}
                  </span>
                )}
                <Link href="/app/billing">
                  <div
                    className="px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "var(--color-accent-soft)", color: "var(--color-accent)" }}
                  >
                    {creditBalance !== null ? `${creditBalance.toLocaleString()} credits` : "Loading..."}
                  </div>
                </Link>
                <Link href="/app/billing" className="text-sm font-medium underline" style={{ color: "var(--color-accent)" }}>
                  Top up
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
