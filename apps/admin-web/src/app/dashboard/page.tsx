'use client';

import React from 'react';
import Link from 'next/link';
import {
  Car,
  CircleDollarSign,
  Layers,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Eye,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const KPIS = [
    {
      title: 'Xe đang đỗ trong bãi',
      value: '1,120',
      total: '/ 1,500 chỗ',
      change: '+14% so với giờ trước',
      icon: Car,
      color: 'text-primary-500',
      bgColor: 'bg-primary-500/10',
    },
    {
      title: 'Tỷ lệ lấp đầy hiện tại',
      value: '74.6%',
      total: 'Trạng thái: Cao điểm',
      change: 'Dự kiến đầy lúc 17:30',
      icon: Layers,
      color: 'text-accent-cyan',
      bgColor: 'bg-accent-cyan/10',
    },
    {
      title: 'Doanh thu trong ngày',
      value: '48.500.000 ₫',
      total: '1,420 lượt thanh toán',
      change: '+8.2% so với hôm qua',
      icon: CircleDollarSign,
      color: 'text-status-success',
      bgColor: 'bg-status-success/10',
    },
    {
      title: 'Cảnh báo cần xử lý',
      value: '3 sự cố',
      total: '1 Barrier kẹt, 2 Biển lệch',
      change: 'Cần xác nhận thủ công',
      icon: AlertTriangle,
      color: 'text-status-warning',
      bgColor: 'bg-status-warning/10',
    },
  ];

  const RECENT_SESSIONS = [
    { plate: '51H-987.65', type: 'Ô tô 5 chỗ', lane: 'L01 Vào (Cổng A)', time: '15:12:45', status: 'Hợp lệ (Vé tháng)', auto: true },
    { plate: '29-E1 543.21', type: 'Xe máy SH', lane: 'L02 Vào (Cổng B)', time: '15:11:10', status: 'Hợp lệ (Vãng lai)', auto: true },
    { plate: '50E-123.45', type: 'Xe điện VF8', lane: 'L03 Ra (Cổng C)', time: '15:09:30', status: 'Đã trả 45.000đ (VietQR)', auto: true },
    { plate: '51F-777.89', type: 'Mercedes C300', lane: 'L03 Ra (Cổng C)', time: '15:08:12', status: 'Cần sửa biển số (F2)', auto: false },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">TỔNG QUAN VẬN HÀNH BÃI XE</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Bãi đỗ xe Landmark 81 · Cập nhật dữ liệu thời gian thực từ Edge Box AI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/layout-view"
            className="flex items-center gap-2 px-3.5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-medium transition-all shadow-md shadow-primary-500/20"
          >
            <Layers className="w-4 h-4" />
            <span>Mở Sơ đồ Digital Twin 2D</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {KPIS.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-navy-surface border border-navy-border/60 rounded-xl p-5 shadow-lg relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400">{kpi.title}</span>
                <div className={`w-9 h-9 rounded-lg ${kpi.bgColor} flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white tracking-tight">{kpi.value}</span>
                <span className="text-xs text-neutral-400 ml-2">{kpi.total}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-navy-border/40 flex items-center gap-1.5 text-[11px] text-neutral-400">
                <TrendingUp className="w-3.5 h-3.5 text-accent-cyan" />
                <span>{kpi.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Split: 2D Spatial Overview & Realtime Movement Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Realtime Làn xe & Sessions */}
        <div className="lg:col-span-2 bg-navy-surface border border-navy-border/60 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Lượt xe Vào / Ra gần nhất</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Sự kiện trích xuất trực tiếp từ camera AI ANPR</p>
            </div>
            <Link
              href="/dashboard/sessions"
              className="text-xs text-primary-500 hover:text-accent-cyan flex items-center gap-1 transition-colors"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-elevated/70 text-neutral-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Biển số</th>
                  <th className="py-2.5 px-3">Phương tiện</th>
                  <th className="py-2.5 px-3">Làn kiểm soát</th>
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Trạng thái xử lý</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-border/40">
                {RECENT_SESSIONS.map((s, i) => (
                  <tr key={i} className="hover:bg-navy-elevated/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-white text-[13px] tracking-wider">
                      {s.plate}
                    </td>
                    <td className="py-3 px-3 text-neutral-300">{s.type}</td>
                    <td className="py-3 px-3 text-neutral-400">{s.lane}</td>
                    <td className="py-3 px-3 text-neutral-400 font-mono">{s.time}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.auto
                            ? 'bg-status-success/15 text-status-success border border-status-success/30'
                            : 'bg-status-warning/15 text-status-warning border border-status-warning/30 animate-pulse'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button className="text-neutral-400 hover:text-white p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Tỷ lệ phân bổ & Tình trạng tầng hầm */}
        <div className="bg-navy-surface border border-navy-border/60 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Tình trạng Tầng hầm</h2>
            <p className="text-xs text-neutral-400 mb-5">Phân bổ chỗ đỗ xe tại các tầng</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-white">Tầng Hầm B1 (Khu Vãng Lai)</span>
                  <span className="text-accent-cyan font-mono font-bold">420 / 500 (84%)</span>
                </div>
                <div className="w-full h-2.5 bg-navy-elevated rounded-full overflow-hidden">
                  <div className="h-full bg-status-warning rounded-full" style={{ width: '84%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-white">Tầng Hầm B2 (Khu Cư Dân)</span>
                  <span className="text-accent-cyan font-mono font-bold">600 / 800 (75%)</span>
                </div>
                <div className="w-full h-2.5 bg-navy-elevated rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-white">Tầng Hầm B3 (Trạm Sạc EV & Xe Tải)</span>
                  <span className="text-accent-cyan font-mono font-bold">100 / 200 (50%)</span>
                </div>
                <div className="w-full h-2.5 bg-navy-elevated rounded-full overflow-hidden">
                  <div className="h-full bg-status-success rounded-full" style={{ width: '50%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-navy-border/40">
            <Link
              href="/dashboard/layout-view"
              className="w-full py-2.5 px-4 bg-navy-elevated hover:bg-navy-border/60 border border-navy-border text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <span>Xem sơ đồ chi tiết từng ô đỗ</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
