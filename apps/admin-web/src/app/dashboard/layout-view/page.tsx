'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Car, CheckCircle2, Clock, Info, Layers, RefreshCw, Zap } from 'lucide-react';
import { fetchParkingLayout, ParkingFloor, ParkingSlot, SlotStatus } from '@/lib/parking-api';

const DEMO_SITE_ID = 'site-lm81';

const DEMO_FLOORS: ParkingFloor[] = ['B1', 'B2', 'B3'].map((floorCode, floorIndex) => {
  const slots: ParkingSlot[] = Array.from({ length: 48 }, (_, index) => {
    const number = index + 1;
    let occupancy_status: SlotStatus = 'EMPTY';
    if (number % 3 === 0) occupancy_status = 'OCCUPIED';
    if (number === 13 || number === 29) occupancy_status = 'RESERVED';
    if (number === 44) occupancy_status = 'MAINTENANCE';

    return {
      slot_id: `demo-${floorCode}-${number}`,
      slot_number: `${floorCode}-A${String(number).padStart(2, '0')}`,
      slot_type: number % 5 === 0 ? 'EV_CHARGING' : number % 7 === 0 ? 'VIP' : 'STANDARD',
      occupancy_status,
    };
  });

  return {
    floor_id: `demo-floor-${floorCode}`,
    floor_code: floorCode,
    floor_name: `Tầng Hầm ${floorCode}`,
    level_order: -1 - floorIndex,
    total_slots: slots.length,
    occupied_slots: slots.filter((slot) => slot.occupancy_status === 'OCCUPIED').length,
    zones: [{ zone_id: `demo-zone-${floorCode}`, zone_code: 'ZONE_A', zone_name: 'Khu A', allowed_vehicle_type: 'CAR', capacity: slots.length, slots }],
  };
});

const STATUS_LABELS: Record<SlotStatus, string> = {
  EMPTY: 'TRỐNG',
  OCCUPIED: 'CÓ XE',
  RESERVED: 'ĐÃ ĐẶT',
  MAINTENANCE: 'BẢO TRÌ',
};

function slotColor(status: SlotStatus) {
  switch (status) {
    case 'EMPTY':
      return 'bg-status-success/15 border-status-success/50 text-status-success hover:bg-status-success/25';
    case 'OCCUPIED':
      return 'bg-navy-elevated border-navy-border text-neutral-300 hover:border-primary-500';
    case 'RESERVED':
      return 'bg-status-warning/15 border-status-warning/50 text-status-warning hover:bg-status-warning/25';
    case 'MAINTENANCE':
      return 'bg-status-danger/15 border-status-danger/50 text-status-danger hover:bg-status-danger/25';
  }
}

export default function DigitalTwinLayoutPage() {
  const [floors, setFloors] = useState<ParkingFloor[]>(DEMO_FLOORS);
  const [activeFloorId, setActiveFloorId] = useState(DEMO_FLOORS[0].floor_id);
  const [activeZone, setActiveZone] = useState('ALL');
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLayout = async () => {
    setLoading(true);
    setError('');
    try {
      const liveFloors = await fetchParkingLayout(DEMO_SITE_ID);
      setFloors(liveFloors.length ? liveFloors : DEMO_FLOORS);
      setActiveFloorId((current) => liveFloors.some((floor) => floor.floor_id === current) ? current : liveFloors[0]?.floor_id ?? DEMO_FLOORS[0].floor_id);
      setSource(liveFloors.length ? 'api' : 'demo');
    } catch (loadError) {
      setFloors(DEMO_FLOORS);
      setActiveFloorId(DEMO_FLOORS[0].floor_id);
      setSource('demo');
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu sơ đồ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLayout();
  }, []);

  const activeFloor = floors.find((floor) => floor.floor_id === activeFloorId) ?? floors[0];
  const allSlots = useMemo(() => activeFloor?.zones.flatMap((zone) => zone.slots) ?? [], [activeFloor]);
  const filteredSlots = allSlots.filter((slot) => activeZone === 'ALL' || (activeZone === 'EV' && slot.slot_type === 'EV_CHARGING') || (activeZone === 'VIP' && slot.slot_type === 'VIP'));
  const counts = allSlots.reduce<Record<SlotStatus, number>>((accumulator, slot) => {
    accumulator[slot.occupancy_status] += 1;
    return accumulator;
  }, { EMPTY: 0, OCCUPIED: 0, RESERVED: 0, MAINTENANCE: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent-cyan" />
            <h1 className="text-xl font-bold text-white tracking-tight">SƠ ĐỒ DIGITAL TWIN 2D</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">Bãi xe Landmark 81 · Vị trí ô đỗ theo thời gian thực</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${source === 'api' ? 'text-status-success border-status-success/30 bg-status-success/10' : 'text-status-warning border-status-warning/30 bg-status-warning/10'}`}>
            {source === 'api' ? 'LIVE API' : 'DEMO DATA'}
          </span>
          <button onClick={() => void loadLayout()} disabled={loading} className="p-2 rounded-lg bg-navy-surface border border-navy-border text-neutral-300 hover:text-white disabled:opacity-50" aria-label="Tải lại sơ đồ">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 rounded-lg border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-xs text-status-warning"><AlertCircle className="w-4 h-4 shrink-0" />{error}. Đang hiển thị dữ liệu demo.</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(STATUS_LABELS) as SlotStatus[]).map((status) => (
          <div key={status} className="bg-navy-surface border border-navy-border/60 rounded-lg px-3 py-2">
            <p className="text-[10px] text-neutral-400">{STATUS_LABELS[status]}</p>
            <p className="text-lg font-bold text-white">{counts[status]}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-navy-surface border border-navy-border/60 p-3 rounded-xl">
        <div className="flex items-center gap-1.5 bg-navy-elevated p-1 rounded-lg overflow-x-auto max-w-full">
          {floors.map((floor) => <button key={floor.floor_id} onClick={() => { setActiveFloorId(floor.floor_id); setSelectedSlot(null); }} className={`px-4 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${activeFloorId === floor.floor_id ? 'bg-primary-500 text-white shadow' : 'text-neutral-400 hover:text-white'}`}>{floor.floor_name}</button>)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Phân khu:</span>
          {[['ALL', 'Tất cả'], ['VIP', 'Khu VIP'], ['EV', 'Trạm Sạc EV']].map(([id, label]) => <button key={id} onClick={() => setActiveZone(id)} className={`px-3 py-1 rounded-md text-xs font-medium ${activeZone === id ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/40' : 'bg-navy-elevated border border-navy-border text-neutral-400 hover:text-white'}`}>{label}</button>)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-navy-surface border border-navy-border/60 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4 text-xs text-neutral-400 border-b border-navy-border/40 pb-3">
            <span className="font-semibold text-white">{activeFloor?.floor_name ?? 'Chưa có tầng'}</span>
            <span className="text-accent-cyan font-mono">{activeFloor?.total_slots ?? 0} ô · {activeFloor?.occupied_slots ?? 0} đang đỗ</span>
          </div>
          {filteredSlots.length ? <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {filteredSlots.map((slot) => <button key={slot.slot_id} onClick={() => setSelectedSlot(slot)} className={`h-24 rounded-lg border flex flex-col justify-between p-2 text-left transition-all ${slotColor(slot.occupancy_status)} ${selectedSlot?.slot_id === slot.slot_id ? 'ring-2 ring-accent-cyan scale-105 z-10 shadow-lg' : ''}`}>
              <div className="flex items-center justify-between w-full"><span className="text-[11px] font-mono font-bold">{slot.slot_number}</span>{slot.slot_type === 'EV_CHARGING' && <Zap className="w-3.5 h-3.5 text-accent-cyan" />}{slot.slot_type === 'VIP' && <span className="text-[9px] font-bold text-status-warning">VIP</span>}</div>
              {slot.occupancy_status === 'OCCUPIED' ? <div className="my-auto text-center"><Car className="w-6 h-6 mx-auto text-white/80" /><p className="text-[9px] mt-1">Đang đỗ</p></div> : <div className="my-auto text-center text-[10px] font-medium opacity-80">{STATUS_LABELS[slot.occupancy_status]}</div>}
              <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden"><div className={`h-full ${slot.occupancy_status === 'EMPTY' ? 'bg-status-success' : slot.occupancy_status === 'OCCUPIED' ? 'bg-primary-500' : 'bg-status-warning'}`} /></div>
            </button>)}
          </div> : <div className="h-48 flex items-center justify-center text-xs text-neutral-400">Không có ô đỗ phù hợp bộ lọc</div>}
        </div>

        <div className="bg-navy-surface border border-navy-border/60 rounded-xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-3 border-b border-navy-border/40">Thông tin Ô Đỗ</h2>
          {selectedSlot ? <div className="space-y-4 text-xs">
            <div><span className="text-neutral-400 block text-[11px]">MÃ VỊ TRÍ</span><span className="text-lg font-mono font-bold text-white">{selectedSlot.slot_number}</span></div>
            <div><span className="text-neutral-400 block text-[11px]">PHÂN LOẠI</span><span className="font-semibold text-accent-cyan">{selectedSlot.slot_type}</span></div>
            <div><span className="text-neutral-400 block text-[11px]">TRẠNG THÁI</span><span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold mt-1 bg-primary-500/20 text-primary-500 border border-primary-500/40">{STATUS_LABELS[selectedSlot.occupancy_status]}</span></div>
            {selectedSlot.last_status_changed_at && <div className="flex items-center gap-2 text-neutral-400"><Clock className="w-4 h-4 text-accent-cyan" />Cập nhật: {new Date(selectedSlot.last_status_changed_at).toLocaleString('vi-VN')}</div>}
            <div className="pt-4 border-t border-navy-border/40"><button className="w-full py-2 bg-navy-elevated hover:bg-navy-border/60 border border-navy-border text-neutral-300 rounded-lg font-semibold">Kiểm tra cảm biến</button></div>
          </div> : <div className="h-64 flex flex-col items-center justify-center text-center text-neutral-400"><Info className="w-8 h-8 text-neutral-500 mb-2" /><p className="text-xs">Nhấp vào một ô đỗ để xem chi tiết</p></div>}
        </div>
      </div>
    </div>
  );
}
