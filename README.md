# 🅿️ SPM – SMART PARKING MANAGEMENT PLATFORM
### Full Enterprise AI-Powered Parking Infrastructure Platform
**Hybrid Cloud + Edge AI | Turborepo Monorepo | Web Admin & Staff Cabin | Customer & Roaming Guard Mobile**

---

## 📌 GIỚI THIỆU DỰ ÁN
**SPM (Smart Parking Management)** là nền tảng quản lý bãi đỗ xe thông minh toàn diện, kiến trúc Multi-tenant SaaS kết hợp Edge Computing, có khả năng triển khai linh hoạt từ bãi xe độc lập đơn lẻ đến chuỗi hàng nghìn bãi xe quy mô Enterprise (Trung tâm thương mại, Sân bay, Cảng biển, Tòa nhà văn phòng, Khu đô thị thông minh).

Sản phẩm hợp nhất 5 trụ cột công nghệ:
1. **AI Computer Vision:** Tự động nhận diện biển số ô tô/xe máy (ANPR) và xác thực khuôn mặt tài xế (Liveness Biometrics).
2. **IoT & Edge Automation:** Điều khiển cần barrier, vòng từ phát hiện xe (Loop Detector), cảm biến siêu âm vị trí đỗ, bảng LED chỉ dẫn.
3. **Offline-Resilient Edge Agent:** Hoạt động độc lập và liên tục tại bãi đỗ xe ngay cả khi xảy ra sự cố mất Internet, tự động đồng bộ 2 chiều khi có mạng trở lại.
4. **Cloud Central Management:** Quản lý tập trung đa doanh nghiệp, đa bãi xe, cấu hình biểu phí động, đối soát tài chính và phân tích dữ liệu vĩ mô.
5. **Đa kênh Thanh toán Không chạm (Ticketless):** Hỗ trợ VietQR động, thẻ tín dụng, ví điện tử (MoMo, ZaloPay), Apple Pay, hóa đơn điện tử tự động.

---

## 📂 HỆ THỐNG TÀI LIỆU DỰ ÁN (PROJECT SPECIFICATIONS)

Toàn bộ tài liệu kỹ thuật và thiết kế đã hoàn thành 100% tại thư mục [`/docs`](file:///e:/Project/SmartParking/docs):

- 📜 **[SPM Product Blueprint (Tài liệu Định hướng Cốt lõi)](file:///e:/Project/SmartParking/docs/PRD/SPM_PRODUCT_BLUEPRINT.md):** Tầm nhìn sản phẩm, mô hình kinh doanh, 18 phân hệ nghiệp vụ, kiến trúc Cloud/Edge, 5 thực thể cốt lõi, NFRs và lộ trình 12 tháng.
- 🎨 **[SPM UI/UX Master Specification (Gói 01)](file:///e:/Project/SmartParking/docs/UI_UX/SPM_UI_UX_MASTER_SPECIFICATION.md):** 
  - Quy chuẩn Design Tokens & Typography (8pt Grid, High-Tech Dark Navy / Cyan palette, Monospace JetBrains Mono cho biển số xe).
  - Danh mục chi tiết **24 màn hình Super Admin**, **52 màn hình Organization Admin**, **22 màn hình/modes Web Staff bốt trực**, **30 màn hình Customer Mobile (Flutter)** và **10 màn hình Roaming Staff Mobile**.
- 🗄️ **[SPM Database Specification (Gói 02A)](file:///e:/Project/SmartParking/docs/DATABASE/SPM_DATABASE_SPECIFICATION.md):**
  - Chi tiết Schema DDL 12 nhóm bảng PostgreSQL 16+ (PostGIS & pg_trgm), quan hệ khóa ngoại, Row-Level Security (RLS) đa doanh nghiệp.
  - Chiến lược đánh chỉ mục Trigram Index cực tốc (`pg_trgm`) cho tra cứu biển số dưới 10ms trên hàng triệu lượt gửi, phân vùng Monthly Range Partitioning cho bảng `parking_sessions` và `audit_logs`.
- 🌐 **[SPM API Specification (Gói 02B)](file:///e:/Project/SmartParking/docs/API/SPM_API_SPECIFICATION.md):**
  - Chuẩn hóa định dạng JSON response `{ status, message, data, error }`.
  - Bộ đặc tả REST API (`/api/v1/...`) cho Auth, Sites, Lanes, Sessions, Payments, Biometrics (Tuân thủ Luật 91/2025/QH15).
  - Giao thức WebSocket Realtime Stream cho màn hình bốt trực Cabin và cấu trúc chủ đề MQTT điều khiển thiết bị Edge/Barrier.
- 🤖 **[SPM AI & IoT Technical Specification (Gói 03)](file:///e:/Project/SmartParking/docs/AI_IOT/SPM_AI_IOT_SPECIFICATION.md):**
  - Pipeline thị giác máy tính AI ANPR đa tầng (YOLOv8s + Homography Perspective Transform + CRNN/SVTR OCR) tối ưu biển số Việt Nam 1 dòng & 2 dòng, độ trễ TensorRT ~55ms.
  - AI Face Recognition & Liveness Detection 3D chống giả mạo, mã hóa AES-GCM-256 tuân thủ Luật Bảo vệ dữ liệu cá nhân VN 91/2025/QH15.
  - Tích hợp Barrier, Vòng từ an toàn kép chống kẹt xe (Anti-smash interlock), bảng LED làn và bản đồ thanh ghi Modbus RTU/TCP.
  - Kiến trúc Golang Edge Agent Daemon, cơ chế vận hành Offline Local Cache và đồng bộ hai chiều Idempotent MQTT QoS 1.
- 🚀 **[SPM Development Master Plan (Gói 04)](file:///e:/Project/SmartParking/docs/DEV_PLAN/SPM_DEVELOPMENT_MASTER_PLAN.md):**
  - Lộ trình 12 Sprints Agile Scrum (24 tuần / 6 tháng đến Production MVP).
  - Cơ cấu đội ngũ kỹ thuật và Ma trận RACI.
  - Quy chuẩn Git Branching Strategy (GitFlow + Trunk-based), Conventional Commits và tiêu chuẩn Clean Architecture.
  - Kiến trúc CI/CD Pipeline (GitHub Actions) và Multi-stage Docker Deployment.

---

## 🏗️ CẤU TRÚC MONOREPO ĐÃ KHỞI TẠO (TURBOREPO)

```
SmartParking/
├── apps/
│   ├── admin-web/            # Web quản trị nền tảng & doanh nghiệp (Next.js + Tailwind + Shadcn/ui)
│   ├── staff-web/            # Web bốt kiểm soát cabin bãi xe (React + Ergonomic Dark Mode + WebRTC)
│   ├── customer-mobile/      # Ứng dụng di động cho chủ phương tiện (Flutter iOS & Android)
│   ├── staff-mobile/         # Ứng dụng di động cho nhân viên tuần tra bãi xe (Flutter)
│   ├── backend-api/          # Cloud API trung tâm (NestJS + TypeScript + PostgreSQL + Redis)
│   └── edge-agent/           # Ứng dụng điều khiển tại trạm bãi xe (Go + SQLite / Local PG)
├── services/
│   ├── ai-anpr/              # Dịch vụ nhận diện biển số xe (YOLOv8 + TensorRT + OCR Engine)
│   ├── ai-face/              # Dịch vụ nhận diện khuôn mặt & liveness detection (ArcFace + Liveness)
│   ├── device-gateway/       # Dịch vụ giao tiếp thiết bị phần cứng (MQTT, Modbus, TCP/IP)
│   ├── payment-service/      # Dịch vụ tích hợp cổng thanh toán & đối soát ngân hàng
│   ├── notification-service/ # Dịch vụ thông báo đa kênh (FCM, SMS Brandname, Zalo ZNS, Telegram)
│   └── analytics-service/    # Dịch vụ phân tích dữ liệu & BI
├── packages/
│   ├── shared-types/         # [@spm/shared-types] Định nghĩa kiểu TypeScript (User, Session, Vehicle...)
│   ├── design-tokens/        # [@spm/design-tokens] Hệ thống Design Tokens (Colors, Spacing, Typography)
│   ├── validation/           # [@spm/validation] Bộ schema Zod kiểm tra tính hợp lệ dữ liệu vào
│   └── ui-components/        # Thư viện UI components dùng chung cho Web
├── infrastructure/
│   ├── docker/               # [docker-compose.yml] PostgreSQL 16 PostGIS, Redis, RabbitMQ, Mosquitto, MinIO
│   ├── cloud/                # Cấu hình Kubernetes, Terraform và Cloud Services
│   ├── monitoring/           # Prometheus, Grafana dashboards và Loki logging
│   └── database/             # Migrations, Seeding scripts và ERD diagrams
├── docs/                     # Toàn bộ tài liệu PRD, UI/UX, DATABASE, API, AI_IOT, DEV_PLAN
├── .github/workflows/ci.yml  # GitHub Actions CI Workflow tự động kiểm tra code
├── package.json              # Root Monorepo configuration (PNPM + Turborepo)
├── pnpm-workspace.yaml       # PNPM Workspaces definition
└── turbo.json                # Turborepo task pipeline configuration
```

---

## 🏁 BẮT ĐẦU PHÁT TRIỂN (QUICK START)

1. Khởi động toàn bộ cụm hạ tầng cục bộ (Database, Cache, Message Queue, Object Storage, MQTT):
   ```bash
   cd infrastructure/docker
   docker compose up -d
   ```
2. Cài đặt các gói phụ thuộc monorepo:
   ```bash
   pnpm install
   ```
3. (Tuỳ chọn) cấu hình endpoint backend cho Admin Web:
   ```bash
   # apps/admin-web/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```
   Nếu API chưa sẵn sàng, màn hình Digital Twin sẽ hiển thị dữ liệu demo và gắn nhãn `DEMO DATA`.
4. Chạy build kiểm tra toàn bộ packages:
   ```bash
   pnpm build
   ```

### Backend foundation cho Sprint 03

Backend hiện đã có nền tảng `Vehicle` và `Recognition Events` để nhận kết quả từ AI/Edge:

- `POST /api/v1/vehicles`: đăng ký phương tiện theo tenant.
- `GET /api/v1/vehicles?q=51H98765`: tìm kiếm phương tiện theo biển số.
- `POST /api/v1/recognition-events`: ghi nhận kết quả nhận diện vào/ra.
- `GET /api/v1/recognition-events/sites/:siteId/recent`: xem sự kiện nhận diện gần nhất.
- `POST /api/v1/parking-sessions/entry`: tạo phiên khi xe vào.
- `POST /api/v1/parking-sessions/exit-check`: khớp phiên khi xe ra.
- `GET /api/v1/parking-sessions/sites/:siteId/active`: danh sách phiên đang hoạt động.
- `POST /api/v1/pricing-rules`: tạo quy tắc tính phí.
- `GET /api/v1/pricing-rules/sites/:siteId`: danh sách quy tắc theo bãi.
- `POST /api/v1/pricing-rules/calculate`: tính phí thử theo quy tắc hiện hành.
- `POST /api/v1/payments/sessions/:sessionId/invoice`: tạo hóa đơn/VietQR.
- `POST /api/v1/payments/cash-confirm`: xác nhận thu tiền mặt.
- `POST /api/v1/payments/vietqr/webhook`: webhook VietQR có HMAC-SHA256.

Migration `CreateVehicleRecognitionTables1732000000000` tạo bảng `vehicles` và
`recognition_logs`. Khi chuyển sang môi trường production, chạy migration thay vì
dựa vào TypeORM `synchronize`.

### Parking Sessions core

Luồng phiên hiện tại:

```text
Recognition IN → parking session ACTIVE
Recognition OUT → khớp phiên ACTIVE → PENDING_PAYMENT
```

Pricing Rules đã được nối vào `exit-check`. Payment vẫn chưa được triển khai;
phiên xe ra chuyển sang `PENDING_PAYMENT` với `payment_status = UNPAID` cho tới
khi payment engine xác nhận giao dịch.

Các tariff model hỗ trợ:

- `FLAT`: `{ "amount": 50000 }`
- `TIME_BLOCK`: `{ "block_minutes": 60, "block_rate": 20000 }`
- `HOURLY_PROGRESSIVE`: `{ "first_hour_rate": 20000, "additional_hour_rate": 15000 }`
- `OVERNIGHT`: `{ "overnight_fee": 100000, "hourly_rate": 20000 }`

Mọi quy tắc đều hỗ trợ `grace_period_minutes`, mặc định 15 phút.

### Payment Engine

Payment Engine hoàn tất vòng đời thanh toán:

```text
PENDING_PAYMENT → Invoice/VietQR → PAID → COMPLETED → OPEN_EXIT_BARRIER
```

Webhook ngân hàng là public endpoint nhưng bắt buộc chữ ký
`X-Signature = HMAC-SHA256(raw JSON body, VIETQR_WEBHOOK_SECRET)`.
Không dùng `X-Tenant-Id` cho webhook; tenant được lấy từ invoice sau khi signature
được xác minh.

### Staff Cabin Web

`@spm/staff-web` hiện cung cấp màn hình cabin split-view:

- Làn vào/làn ra và trạng thái phần cứng.
- Gọi Parking Sessions, Invoice và Cash Confirmation API.
- Khi backend khả dụng, Socket.IO realtime là kênh chính; polling fallback mỗi 30 giây thay cho polling 5 giây liên tục.
- Phím tắt `F1` xử lý xe vào, `SPACE` xử lý xe ra, `F4` xác nhận tiền mặt.
- Khi Staff Cabin có JWT hợp lệ, Socket.IO namespace `/cabin` nhận event realtime `cabin.event`.
- Polling fallback còn chạy mỗi 30 giây để bảo đảm đồng bộ nếu mất WebSocket.

Chạy bằng:

```bash
pnpm --filter @spm/staff-web build
pnpm --filter @spm/staff-web dev
```

Biến môi trường frontend:

- `VITE_API_URL`: mặc định `http://localhost:8000/api/v1`.
- `VITE_SITE_ID`, `VITE_ENTRY_LANE_ID`, `VITE_EXIT_LANE_ID`.
- `VITE_TENANT_ID`: tenant context khi không lấy từ local storage.
- `VITE_WS_URL`: mặc định `http://localhost:8000`.

### Barrier Control và Audit

```text
POST /api/v1/operations/barriers/:laneId/control
GET  /api/v1/operations/audit-logs
```

Barrier control yêu cầu JWT và tenant context; body tối thiểu:

```json
{
  "site_id": "uuid",
  "action": "OPEN",
  "reason": "Xe đã thanh toán",
  "operator_note": "Staff cabin"
}
```

Mọi lệnh barrier được ghi vào bảng `audit_logs` và phát realtime event `BARRIER_CONTROL`
qua namespace `/cabin`. WebSocket xác thực JWT và chỉ cho phép socket tham gia tenant/site
được xác thực.

### ANPR service skeleton

Service `@spm/ai-anpr` cung cấp pipeline:

```text
image_url -> ANPR engine adapter -> normalize plate -> POST recognition event -> parking session
```

Chạy service ở chế độ mock để kiểm thử luồng tích hợp:

```bash
pnpm --filter @spm/ai-anpr build
pnpm --filter @spm/ai-anpr test
pnpm --filter @spm/ai-anpr start
```

Endpoint:

```text
GET  http://localhost:8100/health
POST http://localhost:8100/v1/anpr/recognize
```

Request mock tối thiểu cần `site_id`, `lane_id`, `direction` (`IN`/`OUT`) và
`image_url` dạng `https://.../frame.jpg?plate=51H-987.65`. Service chỉ sử dụng
query `plate` trong mock engine; adapter model thật sẽ thay thế `MockAnprEngine`
khi pipeline YOLO/OCR được tích hợp.

Biến môi trường:

- `BACKEND_API_URL`: mặc định `http://localhost:8000/api/v1`.
- `BACKEND_API_TOKEN`: access token gọi backend.
- `BACKEND_TENANT_ID`: tenant bắt buộc khi ghi recognition event.
- `ANPR_ENGINE`: mặc định `mock`; giá trị khác sẽ báo lỗi cho tới khi adapter model thật được thêm.

### Database migration production

Backend production luôn dùng `synchronize: false`. Chạy migration bằng TypeORM:

```bash
pnpm --filter @spm/backend-api migration:show
pnpm --filter @spm/backend-api migration:run
pnpm --filter @spm/backend-api migration:revert
```

Biến môi trường database:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SCHEMA`.
- `DB_SYNCHRONIZE=true` chỉ được dùng trong môi trường development nội bộ.
- `DB_MIGRATIONS_RUN=true` để tự chạy migration khi bootstrap ứng dụng.
- `DB_LOGGING=true` để bật SQL logging.

### Edge Agent Go

Thư mục `services/edge-agent` chứa daemon offline-first bằng Go:

- SQLite local outbox với idempotent `edge_event_id`.
- Modbus TCP barrier/loop register map.
- Khóa cứng Loop 2 trước mọi lệnh hạ cần.
- MQTT QoS 1 cho event detected và nhận lệnh barrier.
- Exponential backoff retry: 2, 5, 15, 30, 60 giây.

Chạy và kiểm thử:

```bash
cd services/edge-agent
go mod tidy
go test ./...
go run ./cmd/edge-agent
```

Biến môi trường Edge Agent:

- `EDGE_DB_PATH`, `EDGE_TENANT_ID`, `EDGE_SITE_ID`, `EDGE_LANE_ID`.
- `MODBUS_ADDRESS`: mặc định `127.0.0.1:502`.
- `MQTT_BROKER`, `MQTT_CLIENT_ID`, `MQTT_USERNAME`, `MQTT_PASSWORD`.

### MQTT Cloud Ingestion

Backend có thể lắng nghe trực tiếp MQTT bằng `MQTT_BROKER`:

```text
spm/{tenant_id}/{site_id}/lane/{lane_id}/event/detected
spm/{tenant_id}/{site_id}/device/{device_id}/telemetry
```

Mọi payload đều phải có `edge_event_id` dạng UUID. Backend lưu receipt unique để phát lại
MQTT không tạo trùng Recognition Event hoặc Parking Session. Có thể kiểm tra qua REST:

```text
POST /api/v1/operations/edge/events
GET  /api/v1/operations/edge/receipts
GET  /api/v1/operations/edge/heartbeats
```

Biến môi trường bổ sung:

- `MQTT_BROKER`: ví dụ `mqtt://mosquitto:1883`.
- `MQTT_USERNAME`, `MQTT_PASSWORD`.
- `MQTT_INGESTION_CLIENT_ID`.

## Public Repository Security

- Không commit `.env`, private key, password, JWT secret hoặc webhook signature.
- Tạo secret ngẫu nhiên bằng một secrets manager hoặc lệnh tạo 32-byte random:

```bash
openssl rand -hex 32
```

- Development Docker:

```bash
cp infrastructure/docker/.env.example infrastructure/docker/.env
mosquitto_passwd -c infrastructure/docker/mosquitto/passwd spm-edge
docker compose --env-file infrastructure/docker/.env -f infrastructure/docker/docker-compose.yml up -d
```

- Production phải đặt `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DB_PASSWORD`,
  `MQTT_USERNAME`, `MQTT_PASSWORD`, `VIETQR_WEBHOOK_SECRET` và tất cả credential
  Docker qua secret manager. Không dùng giá trị từ `.env.example`.
- Bắt buộc cấu hình `CORS_ORIGIN` với danh sách origin chính xác; không dùng `*`
  cho deployment production.
- Các secret mặc định đã từng xuất hiện trong repository phải được rotate ngay,
  kể cả khi đã xóa khỏi working tree; lịch sử Git cũ vẫn cần được rewrite.
