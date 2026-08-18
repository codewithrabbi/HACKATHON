"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Users,
  TrendingUp,
  Bell,
  Bot,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  LogOut,
  ShieldAlert,
  Sparkles,
  ListTodo,
  Menu,
  X
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/forecasts", label: "Forecasts", icon: TrendingUp },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/copilot", label: "OpsPilot AI", icon: Bot },
  { href: "/actions", label: "Actions", icon: ListTodo },
  { href: "/leakage", label: "Leakage Detector", icon: ShieldAlert },
  { href: "/data", label: "Data Sources", icon: Database },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface2/90 backdrop-blur-xl border-b border-line z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2L2 9L16 16L30 9L16 2Z" fill="#D4A24C" fillOpacity="0.8"/>
            <path d="M2 23L16 30L30 23V9L16 16L2 9V23Z" fill="#D4A24C" fillOpacity="0.3"/>
            <path d="M16 30L2 23V9L16 16V30Z" fill="#D4A24C" fillOpacity="0.5"/>
          </svg>
          <span className="font-display tracking-tight text-paper text-lg">OpsPilot</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-muted hover:text-paper">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col transition-transform duration-300 ease-in-out bg-surface2/95 backdrop-blur-xl border-r border-line
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:bg-surface2/60
          ${collapsed ? "md:w-[80px]" : "w-[260px]"}
        `}
      >
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-6 h-20 border-b border-line/50 relative shrink-0">
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L2 9L16 16L30 9L16 2Z" fill="#D4A24C" fillOpacity="0.8"/>
              <path d="M2 23L16 30L30 23V9L16 16L2 9V23Z" fill="#D4A24C" fillOpacity="0.3"/>
              <path d="M16 30L2 23V9L16 16V30Z" fill="#D4A24C" fillOpacity="0.5"/>
            </svg>
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="animate-fade-in flex flex-col">
              <span className="font-display text-xl tracking-tight text-paper">OpsPilot</span>
            </div>
          )}

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface border border-line rounded-full items-center justify-center text-muted hover:text-paper hover:border-brass/50 transition-colors shadow-md z-50"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          
          {/* Mobile Close Button */}
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden absolute right-4 text-muted hover:text-paper p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${
                  isActive
                    ? "text-brass bg-surface/50 font-medium"
                    : "text-muted hover:text-paper hover:bg-surface/30"
                }`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brass rounded-r-full" />
                )}
                <Icon size={20} className={`flex-shrink-0 ${isActive ? "text-brass" : "text-muted group-hover:text-paper transition-colors"}`} />
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                {item.href === "/copilot" && (!collapsed || mobileOpen) && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-signal pulse-dot" />
                )}
                {item.href === "/alerts" && (!collapsed || mobileOpen) && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-alert" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-line/50 shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative text-alert/80 hover:text-alert hover:bg-alert/10 ${
              collapsed && !mobileOpen ? "justify-center" : ""
            }`}
            title={collapsed && !mobileOpen ? "Log out" : undefined}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {(!collapsed || mobileOpen) && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Spacer to push content ONLY ON DESKTOP */}
      <div className={`hidden md:block flex-shrink-0 transition-all duration-300 ${collapsed ? "w-[80px]" : "w-[260px]"}`} />
    </>
  );
}
