'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Layers,
  ArrowRightLeft,
  Car,
  CreditCard,
  Bell,
  Users,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronDown,
} from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Tổng quan hệ thống', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Doanh nghiệp (Tenants)', href: '/dashboard/organizations', icon: Building2 },
  { label: 'Cơ sở Bãi xe', href: '/dashboard/sites', icon: MapPin },
  { label: 'Sơ đồ Digital Twin 2D', href: '/dashboard/layout-view', icon: Layers },
  { label: 'Quản lý Làn xe', href: '/dashboard/lanes', icon: ArrowRightLeft },
  { label: 'Lượt gửi xe (Sessions)', href: '/dashboard/sessions', icon: Car },
  { label: 'Biểu phí & Doanh thu', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Cảnh báo & Sự cố', href: '/dashboard/alerts', icon: ShieldAlert, badge: 3 },
  { label: 'Người dùng & Phân quyền', href: '/dashboard/iam', icon: Users },
  { label: 'Cấu hình hệ thống', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [selectedSite, setSelectedSite] = useState('Landmark 81');

  return (
    <div className="flex h-screen bg-navy-base text-neutral-100 overflow-hidden">
      {/* 1. Collapsible Sidebar */}
      <aside className="w-64 bg-navy-surface border-r border-navy-border/60 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-navy-border/60">
          <div className="w-8 h-8 rounded-lg bg-primary-500/20 border border-primary-500/40 flex items-center justify-center">
            <span className="text-accent-cyan font-mono font-bold text-lg">🅿️</span>
          </div>
          <div>
            <h2 className="font-bold text-white tracking-tight text-sm">SPM CONTROL</h2>
            <p className="text-[10px] text-accent-cyan uppercase tracking-wider font-semibold">Enterprise Core</p>
          </div>
        </div>

        {/* Tenant Indicator */}
        <div className="mx-4 my-3 p-2.5 rounded-lg bg-navy-elevated/70 border border-navy-border/40 flex items-center justify-between">
          <div className="truncate">
            <p className="text-[10px] uppercase tracking-wider text-neutral-400">Doanh nghiệp</p>
            <p className="text-xs font-semibold text-white truncate">Vincom Retail Corp</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse shrink-0 ml-2" />
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'text-neutral-300 hover:bg-navy-elevated hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-status-danger text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer User Profile */}
        <div className="p-4 border-t border-navy-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              AD
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">Admin SPM</p>
              <p className="text-[10px] text-accent-cyan truncate">SUPER_ADMIN</p>
            </div>
          </div>
          <Link href="/login" className="text-neutral-400 hover:text-status-danger transition-colors p-1.5">
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-navy-surface border-b border-navy-border/60 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="bg-navy-elevated border border-navy-border text-xs text-white rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:border-primary-500 font-medium"
              >
                <option value="Landmark 81">Bãi đỗ xe Landmark 81 (TP.HCM)</option>
                <option value="Vincom Đồng Khởi">Vincom Center Đồng Khởi</option>
                <option value="Vincom Mega Mall">Mega Mall Thảo Điền</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-navy-base border border-navy-border/60 rounded-md text-[11px] text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-status-success animate-ping" />
              <span>Edge Agent: <strong className="text-accent-cyan">ONLINE (Ping: 8ms)</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg bg-navy-elevated border border-navy-border text-neutral-300 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-danger" />
            </button>
            <div className="text-right">
              <p className="text-xs font-mono font-medium text-white">2026-11-19 15:15:00</p>
              <p className="text-[10px] text-neutral-400">Giờ chuẩn GMT+7</p>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 bg-navy-base">
          {children}
        </main>
      </div>
    </div>
  );
}
