import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Car, CheckCircle2, Clock3, CreditCard, Download, Keyboard, LogIn, LogOut, RefreshCw, Settings, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { ActiveSession, checkExit, confirmCash, createEntry, createInvoice, DEMO_SESSIONS, fetchActiveSessions, LaneEvent, SessionResult } from './api';
import { io, Socket } from 'socket.io-client';
import './styles.css';
import { getCabinConfig, saveCabinConfig, CabinConfig } from './config';
import { enqueueOffline, listOffline, removeOffline } from './offline';


const initialEvents: LaneEvent[] = [
  { id: 'event-1', direction: 'IN', plate: '51H-987.65', confidence: 99.1, time: '15:56:24', status: 'APPROVED' },
  { id: 'event-2', direction: 'OUT', plate: '59A-123.45', confidence: 97.8, time: '15:55:41', status: 'APPROVED' },
  { id: 'event-3', direction: 'OUT', plate: '50E-445.12', confidence: 82.4, time: '15:54:08', status: 'REVIEW' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function LanePanel({ direction, selectedPlate, onPlateChange, onSubmit, busy }: {
  direction: 'IN' | 'OUT';
  selectedPlate: string;
  onPlateChange: (plate: string) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const isEntry = direction === 'IN';
  return (
    <section className={`lane-panel ${isEntry ? 'entry' : 'exit'}`}>
      <header className="lane-header">
        <div className="lane-title"><span className="lane-icon">{isEntry ? <LogIn /> : <LogOut />}</span><div><h2>{isEntry ? 'LÀN VÀO' : 'LÀN RA'}</h2><p>{isEntry ? 'L01_IN · Cổng chính' : 'L02_OUT · Cổng thanh toán'}</p></div></div>
        <span className="live-badge"><span /> LIVE</span>
      </header>
      <div className="camera-frame"><div className="camera-label">CAMERA {isEntry ? 'ANPR FRONT' : 'ANPR EXIT'} · 1080p</div><div className="camera-placeholder"><Car /><span>Đang chờ khung hình camera</span></div><div className="scan-line" /></div>
      <div className="plate-card">
        <div className="plate-meta"><span>BIỂN SỐ NHẬN DIỆN</span><strong>CONFIDENCE 98.6%</strong></div>
        <input aria-label={`Biển số làn ${direction}`} value={selectedPlate} onChange={(event) => onPlateChange(event.target.value)} placeholder="Nhập biển số..." />
        <div className="plate-actions"><span className="verified"><CheckCircle2 /> AI VERIFIED</span><button onClick={onSubmit} disabled={busy}>{busy ? 'ĐANG XỬ LÝ...' : isEntry ? 'MỞ BARRIER VÀO' : 'KIỂM TRA XE RA'}</button></div>
      </div>
      <div className="hardware-row"><span><span className="hardware-dot online" /> Barrier ONLINE</span><span><span className="hardware-dot online" /> Loop 1 CLEAR</span><span><span className="hardware-dot online" /> LED READY</span></div>
    </section>
  );
}

export default function App() {
  const initialConfig = getCabinConfig();
  const [config, setConfig] = useState<CabinConfig>(initialConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [sessions, setSessions] = useState<ActiveSession[]>(DEMO_SESSIONS);
  const [events, setEvents] = useState<LaneEvent[]>(initialEvents);
  const [source, setSource] = useState<'LIVE API' | 'DEMO MODE'>('DEMO MODE');
  const [entryPlate, setEntryPlate] = useState('51H-987.65');
  const [exitPlate, setExitPlate] = useState('59A-123.45');
  const [busy, setBusy] = useState<'IN' | 'OUT' | 'PAY' | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingPayment, setPendingPayment] = useState<SessionResult | null>(null);

  const updateOfflineCount = useCallback(async () => {
    setOfflineCount((await listOffline()).length);
  }, []);

  const syncOffline = useCallback(async () => {
    if (!navigator.onLine) return;
    const operations = await listOffline();
    for (const operation of operations) {
      try {
        if (operation.type === 'ENTRY') await createEntry(operation.payload);
        if (operation.type === 'EXIT') await checkExit(operation.payload);
        if (operation.type === 'CASH_CONFIRM') await confirmCash(operation.payload.invoice_id);
        if (operation.type === 'SESSION_CASH') {
          const invoice = await createInvoice(operation.payload.session_id);
          await confirmCash(invoice.invoice_id);
        }
        await removeOffline(operation.id);
      } catch {
        break;
      }
    }
    await updateOfflineCount();
  }, [updateOfflineCount]);

  const refresh = useCallback(async () => {
    try {
      const active = await fetchActiveSessions(config.siteId);
      setSessions(active);
      setSource('LIVE API');
    } catch {
      setSource('DEMO MODE');
    }
  }, [config.siteId]);

  useEffect(() => {
    void refresh();
    void updateOfflineCount();
    const onOnline = () => { setOnline(true); void syncOffline(); };
    const onOffline = () => setOnline(false);
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    const timer = window.setInterval(() => void refresh(), 30000);
    const syncTimer = window.setInterval(() => void syncOffline(), 15000);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(syncTimer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
    };
  }, [refresh, syncOffline, updateOfflineCount]);

  useEffect(() => {
    const token = localStorage.getItem('spm_token');
    if (!token) return;
    const socket: Socket = io(`${config.wsUrl}/cabin`, {
      auth: { token },
      transports: ['websocket'],
    });
    socket.on('connect', () => socket.emit('subscribe-site', config.siteId));
    socket.on('cabin.event', () => {
      void refresh();
    });
    return () => {
      socket.disconnect();
    };
  }, [refresh, config.wsUrl, config.siteId]);

  const addEvent = (direction: 'IN' | 'OUT', plate: string, status: LaneEvent['status'] = 'APPROVED') => {
    setEvents((current) => [{ id: `${Date.now()}`, direction, plate: plate.toUpperCase(), confidence: 98.6, time: new Date().toLocaleTimeString('vi-VN'), status }, ...current].slice(0, 8));
  };

  const handleEntry = async () => {
    setBusy('IN');
    setNotice(null);
    try {
      const result = await createEntry({ site_id: config.siteId, lane_id: config.entryLaneId, clean_plate: entryPlate });
      addEvent('IN', result.plate_number);
      setNotice({ type: 'success', text: `Đã tạo phiên ${result.plate_number}. Barrier vào được mở.` });
      await refresh();
    } catch (error) {
      if (!navigator.onLine) {
        await enqueueOffline({ type: 'ENTRY', payload: { site_id: config.siteId, lane_id: config.entryLaneId, clean_plate: entryPlate } });
        await updateOfflineCount();
        addEvent('IN', entryPlate, 'APPROVED');
        setNotice({ type: 'success', text: `Offline: đã lưu xe ${entryPlate}. Sẽ đồng bộ khi có mạng.` });
      } else {
        setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Không thể tạo phiên xe vào.' });
      }
    } finally { setBusy(null); }
  };

  const handleExit = async () => {
    setBusy('OUT');
    setNotice(null);
    try {
      const result = await checkExit({ site_id: config.siteId, lane_id: config.exitLaneId, clean_plate: exitPlate });
      addEvent('OUT', result.plate_number);
      setPendingPayment(result);
      setNotice({ type: 'success', text: `${result.plate_number} cần thanh toán ${formatCurrency(result.total_fee ?? 0)}.` });
      await refresh();
    } catch (error) {
      if (!navigator.onLine) {
        await enqueueOffline({ type: 'EXIT', payload: { site_id: config.siteId, lane_id: config.exitLaneId, clean_plate: exitPlate } });
        await updateOfflineCount();
        addEvent('OUT', exitPlate, 'REVIEW');
        setNotice({ type: 'success', text: `Offline: đã lưu yêu cầu ra của ${exitPlate}.` });
      } else {
        addEvent('OUT', exitPlate, 'REVIEW');
        setNotice({ type: 'error', text: error instanceof Error ? error.message : `Không tìm thấy phiên cho ${exitPlate}. Cần kiểm tra thủ công.` });
      }
    } finally { setBusy(null); }
  };

  const handleCash = async () => {
    if (!pendingPayment) return;
    setBusy('PAY');
    try {
      const invoice = await createInvoice(pendingPayment.session_id);
      await confirmCash(invoice.invoice_id);
      setNotice({ type: 'success', text: `Đã thu tiền mặt. Barrier ra được mở cho ${pendingPayment.plate_number}.` });
      setPendingPayment(null);
      await refresh();
    } catch (error) {
      if (!navigator.onLine) {
        await enqueueOffline({
          type: 'SESSION_CASH',
          payload: { session_id: pendingPayment.session_id, operator_note: 'Offline staff cabin cash confirmation' },
        });
        await updateOfflineCount();
        setNotice({ type: 'success', text: `Offline: thao tác tiền mặt cho ${pendingPayment.plate_number} đã được ghi nhận local. Chờ đồng bộ.` });
        setPendingPayment(null);
      } else {
        setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Không thể xác nhận thanh toán tiền mặt.' });
      }
    } finally { setBusy(null); }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1') { event.preventDefault(); void handleEntry(); }
      if (event.key === ' ') { event.preventDefault(); void handleExit(); }
      if (event.key === 'F4') { event.preventDefault(); void handleCash(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const activeCount = useMemo(() => sessions.filter((session) => session.status === 'ACTIVE').length, [sessions]);

  return (
    <main className="cabin-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">P</div><div><strong>SPM STAFF CABIN</strong><small>{config.cabinName}</small></div></div>
        <div className="top-status">
          <span className={`source-pill ${online ? 'live' : ''}`}>{online ? <Wifi /> : <WifiOff />}{online ? source : 'OFFLINE MODE'}{offlineCount > 0 ? ` · ${offlineCount} chờ đồng bộ` : ''}</span>
          {installPrompt && <button className="icon-btn" onClick={() => void installPrompt.prompt()} aria-label="Cài đặt ứng dụng"><Download /></button>}
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Cấu hình cabin"><Settings /></button>
          <span className="shift">CA TRỰC: 15:00 — 23:00</span>
          <button className="icon-btn" onClick={() => void refresh()} aria-label="Làm mới"><RefreshCw /></button>
        </div>
      </header>
      <div className="notice-bar"><div><ShieldCheck /> <strong>HỆ THỐNG AN TOÀN</strong><span>AI ANPR · EDGE GATEWAY · BARRIER CONTROL</span></div><div className="clock">{new Date().toLocaleDateString('vi-VN')} · {new Date().toLocaleTimeString('vi-VN')}</div></div>
      {settingsOpen && (
        <section className="settings-drawer" role="dialog" aria-modal="true" aria-label="Cấu hình cabin">
          <header><div><Settings /><strong>CẤU HÌNH CABIN</strong></div><button onClick={() => setSettingsOpen(false)}>×</button></header>
          <div className="settings-grid">
            <label>Tên cabin<input value={config.cabinName} onChange={(event) => setConfig({ ...config, cabinName: event.target.value })} /></label>
            <label>REST API<input value={config.apiUrl} onChange={(event) => setConfig({ ...config, apiUrl: event.target.value })} /></label>
            <label>WebSocket<input value={config.wsUrl} onChange={(event) => setConfig({ ...config, wsUrl: event.target.value })} /></label>
            <label>Tenant ID<input value={config.tenantId} onChange={(event) => setConfig({ ...config, tenantId: event.target.value })} /></label>
            <label>Site ID<input value={config.siteId} onChange={(event) => setConfig({ ...config, siteId: event.target.value })} /></label>
            <label>Entry Lane ID<input value={config.entryLaneId} onChange={(event) => setConfig({ ...config, entryLaneId: event.target.value })} /></label>
            <label>Exit Lane ID<input value={config.exitLaneId} onChange={(event) => setConfig({ ...config, exitLaneId: event.target.value })} /></label>
          </div>
          <footer className="settings-actions">
            <button className="secondary" onClick={() => setSettingsOpen(false)}>Hủy</button>
            <button onClick={() => { saveCabinConfig(config); setSettingsOpen(false); setOnline(navigator.onLine); void refresh(); }}>Lưu và áp dụng</button>
          </footer>
        </section>
      )}
      <section className="summary-row"><div><span>XE ĐANG TRONG BÃI</span><strong>{activeCount}</strong></div><div><span>LƯỢT VÀO HÔM NAY</span><strong>1,284</strong></div><div><span>CHỜ XỬ LÝ</span><strong className="warning">{events.filter((event) => event.status === 'REVIEW').length}</strong></div><div className="hotkeys"><Keyboard /> <span><b>F1</b> VÀO</span><span><b>SPACE</b> RA</span><span><b>F4</b> TIỀN MẶT</span></div></section>
      {notice && <div className={`notice ${notice.type}`}><AlertTriangle />{notice.text}<button onClick={() => setNotice(null)}>×</button></div>}
      <section className="split-view"><LanePanel direction="IN" selectedPlate={entryPlate} onPlateChange={setEntryPlate} onSubmit={() => void handleEntry()} busy={busy === 'IN'} /><LanePanel direction="OUT" selectedPlate={exitPlate} onPlateChange={setExitPlate} onSubmit={() => void handleExit()} busy={busy === 'OUT'} /></section>
      {pendingPayment && <section className="payment-drawer"><div><CreditCard /><div><strong>CHỜ THANH TOÁN · {pendingPayment.plate_number}</strong><span>{pendingPayment.duration_text ?? 'Phiên xe ra đã được khớp'} · {formatCurrency(pendingPayment.total_fee ?? 0)}</span></div></div><button onClick={() => void handleCash()} disabled={busy === 'PAY'}>{busy === 'PAY' ? 'ĐANG XỬ LÝ...' : 'F4 · XÁC NHẬN TIỀN MẶT'}</button></section>}
      <section className="lower-grid"><div className="event-panel"><div className="panel-title"><div><h2>LUỒNG SỰ KIỆN GẦN NHẤT</h2><span>Polling 5s · WebSocket ready</span></div><span className="event-live"><span /> LIVE</span></div><div className="event-table">{events.map((event) => <div className="event-row" key={event.id}><span className={`direction ${event.direction.toLowerCase()}`}>{event.direction === 'IN' ? <LogIn /> : <LogOut />}</span><strong>{event.plate}</strong><span>{event.confidence.toFixed(1)}%</span><time>{event.time}</time><span className={`event-status ${event.status.toLowerCase()}`}>{event.status === 'APPROVED' ? 'ĐÃ DUYỆT' : 'CẦN KIỂM TRA'}</span></div>)}</div></div><div className="active-panel"><div className="panel-title"><div><h2>PHIÊN ĐANG HOẠT ĐỘNG</h2><span>{sessions.length} xe trong hệ thống</span></div><Clock3 /></div>{sessions.slice(0, 4).map((session) => <div className="session-row" key={session.id}><div><strong>{session.display_plate_entry}</strong><span>Vào lúc {formatTime(session.entry_time)}</span></div><span className="session-active">ACTIVE</span></div>)}</div></section>
      <footer><span>SPM ENTERPRISE v1.0 · EDGE NODE: ONLINE</span><span>Nhân viên: CABIN-01 · <a href="/login">Đăng xuất</a></span></footer>
    </main>
  );
}
