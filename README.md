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
3. Chạy build kiểm tra toàn bộ packages:
   ```bash
   pnpm build
   ```
