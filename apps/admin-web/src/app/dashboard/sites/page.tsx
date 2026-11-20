'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Plus, Layers, ArrowRight, ShieldCheck } from 'lucide-react';

const SITES = [
  {
    id: 'site-lm81',
    code: 'PK_LM81',
    name: 'Bãi đỗ xe Landmark 81',
    address: '720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM',
    type: 'Trung tâm thương mại & Cư dân',
    total_capacity: 1500,
    occupied: 1120,
    lanes_count: 8,
    status: 'ONLINE',
  },
  {
    id: 'site-dongkhoi',
    code: 'PK_DONGKHOI',
    name: 'Vincom Center Đồng Khởi',
    address: '72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM',
    type: 'Trung tâm thương mại & Văn phòng',
    total_capacity: 1200,
    occupied: 980,
    lanes_count: 6,
    status: 'ONLINE',
  },
  {
    id: 'site-thaodien',
    code: 'PK_THAODIEN',
    name: 'Vincom Mega Mall Thảo Điền',
    address: '161 Xa lộ Hà Nội, Thảo Điền, TP. Thủ Đức, TP.HCM',
    type: 'Trung tâm thương mại',
    total_capacity: 800,
    occupied: 450,
    lanes_count: 4,
    status: 'ONLINE',
  },
];

export default function SitesListPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">DANH MỤC CƠ SỞ BÃI ĐỖ XE</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Quản lý danh sách các điểm bãi đỗ xe trực thuộc doanh nghiệp
          </p>
        </div>
        <button className="flex items-center gap-2 px-3.5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-primary-500/20">
          <Plus className="w-4 h-4" />
          <span>Thêm Cơ Sở Bãi Xe Mới</span>
        </button>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SITES.map((site) => {
          const occupancyRate = ((site.occupied / site.total_capacity) * 100).toFixed(1);
          return (
            <div
              key={site.id}
              className="bg-navy-surface border border-navy-border/60 rounded-xl p-6 shadow-lg flex flex-col justify-between hover:border-primary-500/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded bg-primary-500/15 text-primary-400 font-mono text-[11px] font-bold">
                    {site.code}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-success/15 text-status-success text-[10px] font-semibold border border-status-success/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                    {site.status}
                  </span>
                </div>

                <h2 className="text-base font-bold text-white tracking-tight">{site.name}</h2>
                <div className="flex items-start gap-1.5 mt-2 text-xs text-neutral-400">
                  <MapPin className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                  <p className="line-clamp-2">{site.address}</p>
                </div>

                {/* Capacity Stats */}
                <div className="mt-5 p-3 bg-navy-elevated rounded-lg border border-navy-border/40">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-neutral-400">Tỷ lệ lấp đầy:</span>
                    <span className="font-mono font-bold text-white">{occupancyRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-navy-base rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-cyan rounded-full"
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mt-2 font-mono">
                    <span>Đang đỗ: <strong className="text-white">{site.occupied}</strong></span>
                    <span>Sức chứa: <strong className="text-white">{site.total_capacity}</strong></span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-navy-border/40 flex items-center justify-between gap-3">
                <Link
                  href="/dashboard/layout-view"
                  className="flex-1 py-2 px-3 bg-navy-elevated hover:bg-navy-border/60 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-accent-cyan" />
                  <span>Sơ đồ 2D</span>
                </Link>
                <Link
                  href={`/dashboard/sites`}
                  className="p-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg text-xs transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
