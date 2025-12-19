"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  trial?: boolean;
}

interface NavigationProps {
  navItems: NavItem[];
  sidebarExpanded: boolean;
}

export function Navigation({ navItems, sidebarExpanded }: NavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/app") {
      return pathname === "/app";
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav className="flex-1 p-4 space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-link ${isActive(item.href) ? 'bg-sidebar text-accent rounded-lg' : 'text-sidebar rounded-lg'} px-3 py-3 hover:bg-opacity-80 relative`}
          tabIndex={0}
          aria-label={item.name}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label font-medium">
            {item.name}
            {item.trial && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 border border-cyan-200">Free Trial</span>}
          </span>
          {!sidebarExpanded && item.trial && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 border-2 border-white" title="Free Trial Available"></span>
          )}
        </Link>
      ))}
    </nav>
  );
}