import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Car, CheckCircle2, Clock3, CreditCard, Keyboard, LogIn, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { ActiveSession, checkExit, confirmCash, createEntry, createInvoice, DEMO_SESSIONS, fetchActiveSessions, LaneEvent, SessionResult } from './api';
import { io, Socket } from 'socket.io-client';
import './styles.css';

const SITE_ID = import.meta.env.VITE_SITE_ID ?? 'site-lm81';
const ENTRY_LANE_ID = import.meta.env.VITE_ENTRY_LANE_ID ?? 'lane-entry-01';
const EXIT_LANE_ID = import.meta.env.VITE_EXIT_LANE_ID ?? 'lane-exit-01';

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
  const [sessions, setSessions] = useState<ActiveSession[]>(DEMO_SESSIONS);
  const [events, setEvents] = useState<LaneEvent[]>(initialEvents);
  const [source, setSource] = useState<'LIVE API' | 'DEMO MODE'>('DEMO MODE');
  const [entryPlate, setEntryPlate] = useState('51H-987.65');
  const [exitPlate, setExitPlate] = useState('59A-123.45');
  const [busy, setBusy] = useState<'IN' | 'OUT' | 'PAY' | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingPayment, setPendingPayment] = useState<SessionResult | null>(null);

  const refresh = useCallback(async () => {
    try {
      const active = await fetchActiveSessions(SITE_ID);
      setSessions(active);
      setSource('LIVE API');
    } catch {
      setSource('DEMO MODE');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    const token = localStorage.getItem('spm_token');
    if (!token) return;
    const socket: Socket = io(`${import.meta.env.VITE_WS_URL ?? 'http://localhost:8000'}/cabin`, {
      auth: { token },
      transports: ['websocket'],
    });
    socket.on('connect', () => socket.emit('subscribe-site', SITE_ID));
    socket.on('cabin.event', () => {
      void refresh();
    });
    return () => {
      socket.disconnect();
    };
  }, [refresh]);

  const addEvent = (direction: 'IN' | 'OUT', plate: string, status: LaneEvent['status'] = 'APPROVED') => {
    setEvents((current) => [{ id: `${Date.now()}`, direction, plate: plate.toUpperCase(), confidence: 98.6, time: new Date().toLocaleTimeString('vi-VN'), status }, ...current].slice(0, 8));
  };

  const handleEntry = async () => {
    setBusy('IN');
    setNotice(null);
    try {
      const result = await createEntry({ site_id: SITE_ID, lane_id: ENTRY_LANE_ID, clean_plate: entryPlate });
      addEvent('IN', result.plate_number);
      setNotice({ type: 'success', text: `Đã tạo phiên ${result.plate_number}. Barrier vào được mở.` });
      await refresh();
    } catch (error) {
      if (source === 'DEMO MODE') {
        addEvent('IN', entryPlate, 'APPROVED');
        setNotice({ type: 'success', text: `Demo: đã duyệt xe ${entryPlate}. Barrier vào được mở.` });
      } else {
        setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Không thể tạo phiên xe vào.' });
      }
    } finally { setBusy(null); }
  };

  const handleExit = async () => {
    setBusy('OUT');
    setNotice(null);
    try {
      const result = await checkExit({ site_id: SITE_ID, lane_id: EXIT_LANE_ID, clean_plate: exitPlate });
      addEvent('OUT', result.plate_number);
      setPendingPayment(result);
      setNotice({ type: 'success', text: `${result.plate_number} cần thanh toán ${formatCurrency(result.total_fee ?? 0)}.` });
      await refresh();
    } catch {
      addEvent('OUT', exitPlate, 'REVIEW');
      setNotice({ type: 'error', text: `Không tìm thấy phiên cho ${exitPlate}. Cần kiểm tra thủ công.` });
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
      if (source === 'DEMO MODE') {
        setNotice({ type: 'success', text: `Demo: đã xác nhận tiền mặt cho ${pendingPayment.plate_number}. Barrier ra được mở.` });
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
      <header className="topbar"><div className="brand"><div className="brand-mark">P</div><div><strong>SPM STAFF CABIN</strong><small>LANDMARK 81 · CONTROL ROOM</small></div></div><div className="top-status"><span className={`source-pill ${source === 'LIVE API' ? 'live' : ''}`}><span />{source}</span><span className="shift">CA TRỰC: 15:00 — 23:00</span><button className="icon-btn" onClick={() => void refresh()} aria-label="Làm mới"><RefreshCw /></button></div></header>
      <div className="notice-bar"><div><ShieldCheck /> <strong>HỆ THỐNG AN TOÀN</strong><span>AI ANPR · EDGE GATEWAY · BARRIER CONTROL</span></div><div className="clock">{new Date().toLocaleDateString('vi-VN')} · {new Date().toLocaleTimeString('vi-VN')}</div></div>
      <section className="summary-row"><div><span>XE ĐANG TRONG BÃI</span><strong>{activeCount}</strong></div><div><span>LƯỢT VÀO HÔM NAY</span><strong>1,284</strong></div><div><span>CHỜ XỬ LÝ</span><strong className="warning">{events.filter((event) => event.status === 'REVIEW').length}</strong></div><div className="hotkeys"><Keyboard /> <span><b>F1</b> VÀO</span><span><b>SPACE</b> RA</span><span><b>F4</b> TIỀN MẶT</span></div></section>
      {notice && <div className={`notice ${notice.type}`}><AlertTriangle />{notice.text}<button onClick={() => setNotice(null)}>×</button></div>}
      <section className="split-view"><LanePanel direction="IN" selectedPlate={entryPlate} onPlateChange={setEntryPlate} onSubmit={() => void handleEntry()} busy={busy === 'IN'} /><LanePanel direction="OUT" selectedPlate={exitPlate} onPlateChange={setExitPlate} onSubmit={() => void handleExit()} busy={busy === 'OUT'} /></section>
      {pendingPayment && <section className="payment-drawer"><div><CreditCard /><div><strong>CHỜ THANH TOÁN · {pendingPayment.plate_number}</strong><span>{pendingPayment.duration_text ?? 'Phiên xe ra đã được khớp'} · {formatCurrency(pendingPayment.total_fee ?? 0)}</span></div></div><button onClick={() => void handleCash()} disabled={busy === 'PAY'}>{busy === 'PAY' ? 'ĐANG XỬ LÝ...' : 'F4 · XÁC NHẬN TIỀN MẶT'}</button></section>}
      <section className="lower-grid"><div className="event-panel"><div className="panel-title"><div><h2>LUỒNG SỰ KIỆN GẦN NHẤT</h2><span>Polling 5s · WebSocket ready</span></div><span className="event-live"><span /> LIVE</span></div><div className="event-table">{events.map((event) => <div className="event-row" key={event.id}><span className={`direction ${event.direction.toLowerCase()}`}>{event.direction === 'IN' ? <LogIn /> : <LogOut />}</span><strong>{event.plate}</strong><span>{event.confidence.toFixed(1)}%</span><time>{event.time}</time><span className={`event-status ${event.status.toLowerCase()}`}>{event.status === 'APPROVED' ? 'ĐÃ DUYỆT' : 'CẦN KIỂM TRA'}</span></div>)}</div></div><div className="active-panel"><div className="panel-title"><div><h2>PHIÊN ĐANG HOẠT ĐỘNG</h2><span>{sessions.length} xe trong hệ thống</span></div><Clock3 /></div>{sessions.slice(0, 4).map((session) => <div className="session-row" key={session.id}><div><strong>{session.display_plate_entry}</strong><span>Vào lúc {formatTime(session.entry_time)}</span></div><span className="session-active">ACTIVE</span></div>)}</div></section>
      <footer><span>SPM ENTERPRISE v1.0 · EDGE NODE: ONLINE</span><span>Nhân viên: CABIN-01 · <a href="/login">Đăng xuất</a></span></footer>
    </main>
  );
}
