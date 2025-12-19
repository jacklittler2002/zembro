"use client";

import Link from "next/link";
import { Navigation } from "./Navigation";

interface SidebarProps {
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  navItems: any[];
  user: any;
  creditBalance: number | null;
}

export function Sidebar({ sidebarExpanded, setSidebarExpanded, navItems, user, creditBalance }: SidebarProps) {
  return (
    <aside
      className={`sidebar ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'} flex flex-col bg-sidebar text-sidebar border-r border-sidebar min-h-screen`}
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => setSidebarExpanded(false)}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar">
        <Link href="/app" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-accent">
            {sidebarExpanded ? "Zembro" : "Z"}
          </span>
        </Link>
        {sidebarExpanded && (
          <p className="text-xs mt-1 text-sidebar">
            AI-powered leads
          </p>
        )}
      </div>

      {/* Navigation */}
      <Navigation navItems={navItems} sidebarExpanded={sidebarExpanded} />

      {/* User section at bottom */}
      <div className="p-4 border-t border-sidebar">
        <div
          className="flex items-center rounded-lg py-3"
          style={{
            padding: sidebarExpanded ? "12px 16px" : "12px",
            justifyContent: sidebarExpanded ? "flex-start" : "center",
          }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-sidebar-border">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          {sidebarExpanded && (
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-ui">
                {user?.email || "User"}
              </p>
              <p className="text-xs text-sidebar">
                Credits: {creditBalance !== null ? creditBalance.toLocaleString() : "..."}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}