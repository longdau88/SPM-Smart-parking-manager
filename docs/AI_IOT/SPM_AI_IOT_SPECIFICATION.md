# SPM – MASTER AI & IoT TECHNICAL SPECIFICATION
**Hệ sinh thái Smart Parking Management (Enterprise Hybrid Cloud + Edge AI)**
*Document Version: 1.0.0 | Date: 2026-11-19 | Platforms: Edge IPC (NVIDIA Jetson / x86 Linux) + IoT Gateway*

---

## 1. TỔNG QUAN KIẾN TRÚC PHẦN CỨNG & HẠ TẦNG BIÊN (EDGE TOPOLOGY)

```mermaid
graph TD
    subgraph LaneIn ["Hạ tầng Làn Vào (Entry Lane)"]
        CamIn1["Camera Biển số (RTSP)"] --> Switch["Industrial PoE Switch"]
        CamIn2["Camera Toàn cảnh (RTSP)"] --> Switch
        Loop1["Loop 1: Phát hiện xe"] --> PLC["Bộ điều khiển I/O / Modbus Relay"]
        Loop2["Loop 2: Vòng từ an toàn"] --> PLC
        BarrierIn["Cần Barrier Vào"] <-- PLC
        LedIn["Bảng LED Làn Vào"] <-- PLC
        QRIn["Máy quét QR Làn Vào"] --> Switch
    end

    subgraph EdgeBox ["SPM Edge AI Box (Trạm Bãi Xe)"]
        Switch --> EdgeAgent["SPM Edge Agent Core (Go)"]
        Switch --> AIInference["AI Inference Engine (ONNX / TensorRT)"]
        EdgeAgent <--> LocalDB[("Local SQLite / PostgreSQL Cache")]
        EdgeAgent <--> AIInference
        PLC <--> EdgeAgent
    end

    subgraph CloudPlane ["SPM Cloud Platform"]
        EdgeAgent <== "MQTT (QoS 1) + HTTPS Sync" ==> CloudAPI["Central API Gateway"]
        CloudAPI --> CloudDB[("PostgreSQL 16 Cluster")]
        CloudAPI --> S3[("MinIO / S3 Object Storage")]
    end
```

### 1.1. Cấu hình Phần cứng Tiêu chuẩn tại Trạm (Hardware Bill of Materials)
| Thiết bị | Chủng loại khuyến nghị | Thông số kỹ thuật | Giao thức kết nối |
|---|---|---|---|
| **Edge AI Box** | NVIDIA Jetson Orin Nano 8GB / Orin NX 16GB hoặc Mini PC Intel Core i5 Gen 12+ (8 Core) | 8-16GB RAM, 256GB NVMe SSD, Ubuntu 24.04 LTS | Gigabit Ethernet, RS-485 |
| **Camera ANPR** | Hikvision / Dahua 4MP - 8MP Starlight IR | Cảm biến 1/1.8" Progressive CMOS, WDR 120dB, Motorized Lens 2.8 - 12mm | RTSP qua PoE (802.3af/at) |
| **Cần Barrier** | Cần gập / thẳng tốc độ cao (1.2s - 2.5s) ZKTeco, Bisen, WJDZ | Động cơ không chổi than DC Brushless, 100% Duty Cycle | Dry Contact Relay / RS-485 Modbus RTU |
| **Vòng từ (Loop Detector)** | Vòng từ kép cảm ứng từ (Dual Channel) | Tần số 20 - 130 kHz, Độ nhạy 4 cấp | Dry Contact Output nối vào PLC/Relay |
| **Bảng LED Làn** | LED Matrix 1 hoặc 2 dòng P4.75 / P7.62 | Hiển thị Biển số, Hướng dẫn, Số tiền | RS-485 / TCP-IP |
| **Bộ chuyển đổi I/O Relay** | Moxa ioLogik / ICP DAS / ZKTeco Modbus I/O | 4-8 Digital Inputs (Optocoupler), 4-8 Relay Outputs | Modbus TCP / Modbus RTU (RS-485) |

---

## 2. PIPELINE THỊ GIÁC MÁY TÍNH AI ANPR (VIETNAM LICENSE PLATE)

Quy trình nhận diện biển số xe được thiết kế theo mô hình **Multi-Stage Computer Vision Pipeline**, tối ưu riêng biệt cho cấu trúc biển số xe tại Việt Nam (biển dài 1 dòng 520x110mm, biển vuông 2 dòng 280x200mm, biển số xe máy, biển ô tô điện chữ trắng nền xanh, biển công vụ).

```mermaid
flowchart LR
    A["Khung hình RTSP 1080p"] --> B["Stage 1: YOLOv8-Vehicle\n(Phát hiện & Phân loại Xe)"]
    B --> C["Stage 2: YOLOv8-Plate-Corner\n(Định vị Biển số & 4 Góc)"]
    C --> D["Perspective Correction\n(Biến đổi Homography nắn thẳng)"]
    D --> E["Stage 3: CRNN / SVTR OCR\n(Trích xuất Ký tự Biển số)"]
    E --> F["Regex & Logic Rules\n(Chuẩn hóa định dạng VN)"]
    F --> G["Confidence Score\n& Gán Session"]
```

### 2.1. Chi tiết từng giai đoạn trong Pipeline
1. **Stage 1 – Vehicle Detection & Classification (YOLOv8s-Vehicle):**
   - Phát hiện phương tiện và phân loại: `CAR_SEDAN`, `CAR_SUV`, `MOTORCYCLE`, `TRUCK`, `BUS`.
   - Vùng quan tâm (ROI - Region of Interest): Thu hẹp phạm vi quét để giảm tải tính toán.
2. **Stage 2 – License Plate Localization & Keypoints Detection:**
   - Xác định Bounding Box biển số kèm 4 điểm góc (Top-Left, Top-Right, Bottom-Right, Bottom-Left).
   - **Hiệu chỉnh Phối cảnh (Perspective Transform - Homography):** Biến đổi hình học đưa các biển số bị nghiêng (góc camera chéo lên tới 35 độ) về dạng hình chữ nhật thẳng góc trước khi đưa vào bộ OCR.
3. **Stage 3 – Character Recognition (Lightweight CRNN / SVTR):**
   - Hỗ trợ cả 2 định dạng phổ biến của Việt Nam:
     - *Biển 1 dòng:* Dãy ký tự liền mạch (VD: `51H-987.65` -> `51H98765`).
     - *Biển 2 dòng (Xe máy / Ô tô biển vuông):* Nhận diện dòng trên (Mã tỉnh + Series chữ, VD: `29-E1`), dòng dưới (Số thứ tự đăng ký, VD: `543.21`) và tự động ghép nối chuẩn xác theo thứ tự `29E154321`.
4. **Stage 4 – Rule-based Syntax Engine (Kiểm tra Định dạng Biển số VN):**
   - Kiểm tra mã tỉnh hợp lệ (01 - 99 theo quy chuẩn Cục CSGT).
   - Biểu thức chính quy (Regex):
     - Ô tô dân sự: `^[0-9]{2}[A-Z]{1,2}[0-9]{4,5}$`
     - Xe máy dân sự: `^[0-9]{2}[A-Z][0-9][0-9]{4,5}$` hoặc `^[0-9]{2}[A-Z]{2}[0-9]{5}$`
     - Xe biển đỏ quân sự: `^[A-Z]{2}[0-9]{2}[0-9]{2}$`
     - Xe biển xanh cơ quan nhà nước, xe ngoại giao (`NG`, `QT`).

### 2.2. Tối ưu hóa Hiệu năng Suy luận (Inference Optimization)
- Mô hình được chuyển đổi từ PyTorch (`.pt`) sang **ONNX** và biên dịch sang **NVIDIA TensorRT Engine (`.engine`)** chạy ở chế độ độ chính xác bán phần **FP16** hoặc định lượng **INT8** (sử dụng tập dữ liệu hiệu chuẩn Calibration Dataset 1,000 ảnh giao thông thực tế).
- **Benchmark Latency trên NVIDIA Jetson Orin Nano (8GB):**
  - Stage 1 (Vehicle Detection): **18ms**
  - Stage 2 (Plate Corner): **12ms**
  - Homography Warp (OpenCV CUDA): **3ms**
  - Stage 3 (OCR Character): **22ms**
  - **Tổng thời gian suy luận Pipeline AI: ~55ms / frame** (đáp ứng xử lý thời gian thực > 15 FPS).

---

## 3. NHẬN DIỆN KHUÔN MẶT & BẢO VỆ SINH TRẮC HỌC (BIOMETRIC GOVERNANCE)

Hệ thống AI Face Recognition hoạt động như một lớp xác thực bảo mật thứ hai (2FA) tùy chọn cho xe cư dân hoặc xe VIP:

```mermaid
flowchart TD
    Frame["Khung hình Camera Mặt"] --> Det["RetinaFace / SCRFD\n(Phát hiện khuôn mặt)"]
    Det --> Land["5-Point Facial Landmarks Alignment"]
    Land --> Live{"3D Liveness Detection\n(Chống giả mạo)"}
    Live -- "Phát hiện Fake (Ảnh/Màn hình/Mặt nạ)" --> Reject["Bác bỏ & Kích hoạt Báo động"]
    Live -- "Người thật (Live Person)" --> Feat["ArcFace-ResNet50\n(Trích xuất 512-d Vector)"]
    Feat --> Encrypt["Mã hóa AES-GCM-256"]
    Encrypt --> Match{"So khớp Cosine Similarity\n(Ngưỡng Threshold >= 0.68)"}
    Match -- "Khớp hồ sơ" --> Grant["Xác thực Thành công"]
    Match -- "Không khớp" --> Fallback["Chuyển chế độ ANPR + Xác nhận Staff"]
```

### 3.1. Chống Giả mạo Sinh trắc học (Anti-Spoofing & Liveness Detection)
- Áp dụng mô hình **Silent-Face-Anti-Spoofing** (phân tích đa quang phổ và kết cấu vi mô của da):
  - Chống gian lận bằng ảnh in màu độ nét cao (Printed Photo attack).
  - Chống gian lận bằng video phát lại trên màn hình iPad/smartphone (Screen Replay attack).
  - Chống mặt nạ silicon 3D (3D Mask attack).
- Chỉ khi kiểm tra liveness đạt điểm tin cậy `> 0.95`, hệ thống mới tiến hành trích xuất vector khuôn mặt.

### 3.2. Cơ chế Bảo mật Tuân thủ Luật 91/2025/QH15 & Nghị định 356/2025/NĐ-CP
- **Tuyệt đối không lưu ảnh khuôn mặt gốc:** Sau khi trích xuất vector đặc trưng (Embedding 512 số thực), ảnh khuôn mặt gốc lập tức bị giải phóng khỏi bộ nhớ RAM của Edge Box.
- **Mã hóa một chiều tại chỗ (One-way Encryption at Rest):** Vector embedding được mã hóa bằng chuẩn **AES-GCM-256** với khóa được tạo và bảo vệ trong phần cứng an toàn (TPM 2.0 / Secure Enclave).
- **Xóa tức thì khi rút Consent (Right to be Forgotten):** Khi có sự kiện `CONSENT_REVOKED`, Edge Agent thực hiện ghi đè dữ liệu ngẫu nhiên (Zero-fill overwrite) lên ô nhớ chứa embedding của người dùng đó.

---

## 4. GIAO THỨC TÍCH HỢP CAMERA & STREAMING ENGINE

### 4.1. Chiến lược Luồng Kép (Dual-Stream Ingestion)
- **Main-stream (RTSP Full HD 1080p @ 25fps, Bitrate 4-6 Mbps):**
  - Dành riêng cho Edge AI Box để cắt frame biển số độ nét cao, phục vụ nhận diện chính xác và lưu trữ bằng chứng lúc vào/ra.
- **Sub-stream (RTSP D1/720p @ 12fps, Bitrate 512 Kbps):**
  - Dành cho hiển thị trên màn hình giám sát bốt trực và truyền về WebRTC Gateway để bảo vệ băng thông mạng nội bộ.

### 4.2. GStreamer Pipeline Giải mã Phần cứng (Hardware Acceleration)
Pipeline GStreamer tối ưu trên môi trường Edge Linux:
```bash
# GStreamer pipeline nhận luồng RTSP camera sử dụng NVDEC phần cứng
gst-launch-1.0 rtspsrc location="rtsp://admin:Pass1234@192.168.1.101:554/Streaming/Channels/101" latency=100 ! \
    rtph264depay ! h264parse ! nvv4l2decoder ! \
    nvvidconv ! video/x-raw(memory:NVMM), format=RGBA ! \
    appsink name=sink emit-signals=true max-buffers=2 drop=true
```

### 4.3. WebRTC Gateway Truyền hình ảnh về Bốt trực Cabin (< 300ms)
- Sử dụng **MediaSoup / WebRTC Gateway** đóng gói tại Edge Box:
  - Video từ camera được chuyển đổi sang định dạng WebRTC RTP.
  - Web Staff nhận luồng qua kênh trình duyệt với độ trễ cực thấp (< 300ms), loại bỏ hoàn toàn hiện tượng trễ 2-3 giây thường gặp khi dùng HLS/RTMP.

---

## 5. ĐIỀU KHIỂN THIẾT BỊ IOT & PHẦN CỨNG CHUYÊN DỤNG (DRIVERS)

### 5.1. Bộ điều khiển Cần Barrier (Barrier Controller Engine)

#### Sơ đồ Vòng từ An toàn Chống kẹt xe (Anti-Smash Interlock)
```
[Chiều Xe Chạy] ====> (Vòng Từ Loop 1) ===== [Cần Barrier] ===== (Vòng Từ Loop 2) ====>
                     (Phát hiện xe tới)                          (Bảo vệ an toàn & Đóng cần)
```
- **Loop 1 (Presence Loop):** Đặt trước barrier 2-3m. Khi xe đè lên vòng từ 1, cảm biến kích hoạt tín hiệu gửi về Edge Box chuẩn bị chụp ảnh và nhận diện biển số trước khi xe dừng hẳn.
- **Loop 2 (Safety Anti-smash Loop):** Đặt ngay dưới chân cần barrier. 
  > [!CAUTION]
  > **Quy tắc an toàn vật lý bất biến:** Khi xe vẫn đang đè lên Loop 2, bộ điều khiển Relay PHẢI KHÓA CỨNG tín hiệu hạ cần. Kể cả khi có lệnh đóng từ phần mềm, barrier cũng tuyệt đối không được hạ xuống để tránh va quẹt làm móp nóc xe.

#### Bản đồ Thanh ghi Modbus RTU / Modbus TCP (Modbus Register Map)
| Địa chỉ Thanh ghi | Loại | Tên tín hiệu | Ý nghĩa chức năng |
|---|---|---|---|
| `Coil 0x0001` | Output | `BARRIER_TRIGGER_OPEN` | Xuất xung 500ms kích hoạt mở cần barrier |
| `Coil 0x0002` | Output | `BARRIER_TRIGGER_CLOSE` | Xuất xung 500ms kích hoạt đóng cần barrier |
| `Coil 0x0003` | Output | `BARRIER_FORCE_LOCK` | Khóa cứng barrier ở vị trí hiện tại (Khẩn cấp) |
| `Discrete 0x1001` | Input | `BARRIER_IS_OPENED` | Tín hiệu công tắc hành trình báo cần đã mở 90 độ |
| `Discrete 0x1002` | Input | `BARRIER_IS_CLOSED` | Tín hiệu công tắc hành trình báo cần đã hạ phẳng 0 độ |
| `Discrete 0x1003` | Input | `LOOP_1_VEHICLE_PRESENCE` | Cảm biến từ Loop 1 có xe đang đứng |
| `Discrete 0x1004` | Input | `LOOP_2_SAFETY_PRESENCE` | Cảm biến từ Loop 2 an toàn đang có xe chắn |

---

### 5.2. Bảng LED Ma trận Hiển thị Làn (LED Matrix Display)
- Giao tiếp: RS-485 Baudrate 9600bps hoặc TCP Socket Port 5005.
- Cấu trúc bản tin Hex (Novastar / TuoPu Protocol):
```python
# Format chuỗi hiển thị bảng LED làn
def build_led_packet(line1_text: str, line2_text: str, color_code: int = 1) -> bytes:
    """
    color_code: 1 = Xanh lá (Green), 2 = Đỏ (Red), 3 = Vàng (Yellow)
    line1: "51H-987.65 MOI VAO"
    line2: "SO CHO TRONG: 125"
    """
    header = b'\xAA\x55'
    data = f"{line1_text}\n{line2_text}".encode('utf-8')
    checksum = sum(data) % 256
    return header + bytes([len(data), color_code]) + data + bytes([checksum]) + b'\xFF'
```

---

## 6. KIẾN TRÚC PHẦN MỀM EDGE AGENT (OFFLINE-FIRST CORE)

Edge Agent được xây dựng bằng ngôn ngữ **Go (Golang)** đảm bảo tiêu thụ tài nguyên tối thiểu (RAM < 150MB, CPU < 5%) và không bị phụ thuộc vào Garbage Collector của Java/Node.js:

```mermaid
graph TD
    subgraph EdgeAgentGo ["SPM Edge Agent (Golang Daemon)"]
        Ingest["RTSP Ingestion & Frame Grabber"]
        WorkerPool["AI Worker Pool (Cgo -> TensorRT)"]
        SM["Lane State Machine (Finite State Machine)"]
        ModbusDriver["Modbus / GPIO Driver"]
        LocalSQLite[("SQLite Local Engine")]
        SyncDaemon["Sync Queue Daemon"]

        Ingest --> WorkerPool
        WorkerPool --> SM
        SM <--> ModbusDriver
        SM --> LocalSQLite
        LocalSQLite --> SyncDaemon
    end

    SyncDaemon <== "MQTT QoS 1 / HTTPS Outbox" ==> CloudMQ["RabbitMQ / Cloud Ingestion"]
```

### 6.1. Máy trạng thái Hữu hạn Làn xe (Lane Finite State Machine - FSM)
- Các trạng thái hợp lệ: `IDLE` -> `VEHICLE_APPROACHING` -> `AI_ANALYZING` -> `ACCESS_GRANTED` -> `BARRIER_OPENING` -> `VEHICLE_PASSING` -> `BARRIER_CLOSING` -> `SESSION_COMMITTED`.
- Bất kỳ trạng thái lỗi nào (`BARRIER_TIMEOUT`, `UNAUTHORIZED_VEHICLE`) đều chuyển sang nhánh `WAITING_MANUAL_OVERRIDE` để nhân viên bốt xử lý qua phím tắt.

### 6.2. Cơ chế Đồng bộ Hai chiều Độc lập (Sync Queue Daemon)
- Bảng cục bộ `edge_outbox` lưu trữ các sự kiện phát sinh khi bãi xe mất Internet.
- **Cơ chế Retry với Exponential Backoff:**
  - Lần 1: Thử lại sau 2 giây.
  - Lần 2: Thử lại sau 5 giây.
  - Lần 3: Thử lại sau 15 giây... Tối đa sau mỗi 60 giây quét kiểm tra kết nối Cloud một lần.
- **Idempotent Ingestion tại Cloud:** Mỗi bản ghi đồng bộ kèm trường `edge_event_id (UUID)`. Cloud API sử dụng mệnh đề `ON CONFLICT (edge_event_id) DO NOTHING` để đảm bảo dù gửi lại nhiều lần dữ liệu vẫn không bị nhân đôi.

---

## 7. BỘ TIÊU CHÍ KIỂM THỬ & NGHIỆM THU AI & IoT (ACCEPTANCE MATRIX)

| Kịch bản kiểm thử | Điều kiện môi trường | Tiêu chí đạt (Acceptance Threshold) |
|---|---|---|
| **ANPR Ban ngày** | Trời nắng, tốc độ xe 15-25 km/h, góc camera 15-30 độ | Tỷ lệ nhận diện đúng biển số đầy đủ: **>= 98.5%** |
| **ANPR Ban đêm** | Đèn đường yếu, đèn pha xe chiếu ngược trực diện | Tỷ lệ nhận diện đúng biển số: **>= 96.0%** |
| **ANPR Trời mưa** | Kính xe ướt, biển dính giọt nước, gạt mưa hoạt động | Tỷ lệ nhận diện đúng biển số: **>= 95.0%** |
| **Biển số Lệch / Nghiêng** | Xe máy lượn chéo góc 35 độ vào làn | Hiệu chỉnh Homography thành công, đọc đúng: **>= 94.0%** |
| **Độ trễ Xử lý Làn** | Từ lúc xe đè Loop 1 đến khi Barrier nhận xung mở | **P95 <= 350ms** trên toàn bộ hệ thống |
| **Anti-Spoofing Face** | Dùng ảnh chụp màu A4 và iPad phát video khuôn mặt | Tỷ lệ chặn giả mạo (True Negative Rate): **>= 99.8%** |
| **Mất Internet Đột ngột** | Rút cáp quang WAN trong lúc bãi xe đang có 50 xe vào/ra | Xe vé tháng vẫn mở tự động, thu tiền mặt bình thường, 100% dữ liệu đồng bộ lên Cloud sau khi cắm lại dây mạng |
