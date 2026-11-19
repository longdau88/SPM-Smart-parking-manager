# PRODUCT BLUEPRINT – SPM (SMART PARKING MANAGEMENT)
**Full Enterprise Product | Hybrid Cloud + Edge AI | Web + Mobile**

---

## TỔNG QUAN ĐỊNH HƯỚNG
Xây dựng nền tảng quản lý bãi đỗ xe thông minh toàn diện, có khả năng triển khai linh động từ bãi xe nhỏ đến hệ thống nhiều bãi xe, nhiều doanh nghiệp và quy mô Enterprise.

SPM không đơn thuần là phần mềm quản lý bãi đỗ xe. Sản phẩm là một hệ sinh thái kết hợp AI, IoT, Computer Vision, Payment và Business Intelligence.

Tài liệu này đóng vai trò nền tảng để triển khai 4 nhóm công việc:
1. **Product & Business:** Xác định sản phẩm, nghiệp vụ và quy tắc vận hành.
2. **UI/UX:** Thiết kế toàn bộ màn hình Web Admin, Staff và Mobile App.
3. **Engineering:** Xây dựng kiến trúc, database, API, backend và frontend.
4. **AI & IoT:** Phát triển AI nhận diện và tích hợp thiết bị thực tế.

---

## PHẦN I. PRODUCT VISION & PRODUCT STRATEGY

### 1.1. Tầm nhìn sản phẩm
Xây dựng một nền tảng Smart Parking có khả năng:
- Quản lý không giới hạn về mặt thiết kế số lượng doanh nghiệp và bãi xe (Multi-tenant SaaS).
- Tự động nhận diện phương tiện bằng AI ANPR (Automatic Number Plate Recognition).
- Nhận diện khuôn mặt phục vụ xác thực tài xế/chủ phương tiện.
- Kiểm soát phương tiện vào/ra không cần thẻ (Ticketless Parking).
- Quản lý nhiều làn xe đồng thời theo thời gian thực.
- Tự động tính phí linh hoạt và thanh toán đa kênh (QR tĩnh/động, VietQR, Ví điện tử, Thẻ ngân hàng).
- Quản lý thiết bị IoT và camera tập trung.
- Giám sát hoạt động theo thời gian thực qua Live Video & Metrics.
- Phân tích và dự báo lưu lượng bằng AI / Business Intelligence.
- Quản lý vận hành tập trung từ Cloud.
- Vẫn duy trì khả năng hoạt động độc lập tại bãi xe khi mất kết nối Internet (Edge Offline Resilience).

### 1.2. Định vị sản phẩm
- **Sản phẩm:** SPM (Smart Parking Management) - AI-Powered Parking Infrastructure Platform.
- **Bốn trụ cột cốt lõi:**
  1. **AI (Intelligent Recognition):** Nhận diện biển số, nhận diện khuôn mặt, phát hiện gian lận và tối ưu luồng xe.
  2. **IoT (Smart Device Control):** Điều khiển barrier, vòng từ (loop detector), cảm biến đỗ, bảng LED thông báo, máy quét mã.
  3. **Cloud (Centralized Management):** Quản lý tập trung đa doanh nghiệp, thanh toán, tài chính và phân tích dữ liệu vĩ mô.
  4. **Edge (Local Intelligence):** Bộ xử lý biên tại bãi xe đảm bảo tốc độ phản hồi <500ms và không gián đoạn khi offline.

### 1.3. Nhóm khách hàng mục tiêu & Nhu cầu
| Nhóm khách hàng | Đặc thù nghiệp vụ & Nhu cầu cốt lõi |
|---|---|
| **Chung cư / Khu dân cư** | Quản lý phương tiện cư dân theo căn hộ, vé tháng, khách vãng lai, quản lý xe phụ xe chính. |
| **Tòa nhà văn phòng** | Quản lý thẻ nhân viên, xe hợp đồng công ty, đăng ký khách viếng thăm trước (Guest pre-registration). |
| **Trung tâm thương mại** | Lưu lượng xe cực lớn giờ cao điểm, tích hợp voucher giảm giá mua sắm, thanh toán không chạm. |
| **Bệnh viện** | Khách vãng lai biến động cao, làn ưu tiên xe cấp cứu, chính sách miễn giảm phí bệnh nhân. |
| **Trường học / Đại học** | Quản lý phương tiện học sinh, phụ huynh đưa đón theo khung giờ, cán bộ giảng viên. |
| **Khách sạn / Resort** | Tích hợp hệ thống PMS phòng nghỉ, khách lưu trú miễn phí, khách sự kiện. |
| **Khu công nghiệp / Cảng** | Phương tiện trọng tải lớn, xe container, kiểm soát tài xế vào/ra xuất nhập kho. |
| **Bãi xe công cộng** | Quản lý lượt xe vãng lai, bảng LED hiển thị chỗ trống ngoài cổng, thanh toán QR tự động. |
| **Sân bay / Nhà ga** | Phân làn đón/trả khách nhanh (Drop-off 5-10 phút), lưu bãi dài ngày, phân vùng ga đến/ga đi. |
| **Nhà cung cấp dịch vụ đỗ xe** | Quản lý tập trung danh mục nhiều bãi đỗ của nhiều chủ đầu tư khác nhau (MSP Model). |

### 1.4. Mô hình kinh doanh
Hỗ trợ Multi-tenant SaaS, On-premise và Hybrid:
- **SaaS Subscription:** Thuê bao phần mềm theo tháng/năm theo quy mô.
- **Site Licensing:** Bản quyền tính theo số lượng điểm bãi đỗ xe.
- **Lane Licensing:** Bản quyền phân chia theo số làn xe vận hành đồng thời.
- **AI Licensing:** Thu phí theo số camera AI kết nối hoặc lưu lượng xe xử lý.
- **Hardware Integration & Services:** Triển khai trọn gói thiết bị phần cứng, Edge AI Box và bảo trì 24/7.
- **Enterprise Licensing:** Bản quyền trọn đời đóng gói riêng cho các tập đoàn lớn có hạ tầng máy chủ riêng.

---

## PHẦN II. HỆ SINH THÁI VÀ CẤU TRÚC PHÂN HỆ

### 2.1. Danh sách 18 phân hệ chính
1. **CORE-DASH:** Tổng quan hệ thống (Executive & Operational Dashboards)
2. **CORE-ORG:** Quản lý doanh nghiệp & tổ chức thuê bao (Tenant Management)
3. **PARK-SITE:** Quản lý cơ sở bãi xe (Sites, Config, Operational Hours)
4. **PARK-LAYOUT:** Quản lý sơ đồ bãi xe, tầng, khu vực & vị trí đỗ (Spatial Digital Twin)
5. **PARK-LANE:** Quản lý làn xe và gán thiết bị phần cứng (Lane Controller Engine)
6. **VEHICLE:** Quản lý phương tiện, biển số, danh sách VIP / Blacklist
7. **AI-ANPR:** Động cơ AI nhận diện biển số ô tô, xe máy, chuẩn hóa ký tự
8. **AI-FACE:** Động cơ AI nhận diện khuôn mặt tài xế (Liveness, Consent, Verification)
9. **PARK-SESSION:** Quản lý phiên gửi xe vào/ra, đối soát trạng thái
10. **CRM:** Quản lý hồ sơ khách hàng, chủ sở hữu phương tiện, khiếu nại
11. **SUBSCRIPTION:** Quản lý hợp đồng vé tháng, gia hạn tự động, công nợ
12. **BILLING:** Bảng giá động, chính sách biểu phí, thanh toán đa kênh, hóa đơn
13. **IOT:** Quản lý và giám sát thiết bị phần cứng (Camera, Barrier, Sensor, LED, Gateway)
14. **MONITOR:** Trung tâm giám sát luồng camera và lưu lượng thời gian thực (CCTV Wall)
15. **ALERT:** Trung tâm quản lý cảnh báo và xử lý sự cố (Incident Management)
16. **ANALYTICS:** Báo cáo thông minh, phân tích doanh thu và dự báo bằng AI
17. **IAM:** Quản trị danh tính, vai trò và phân quyền đa tầng (RBAC + Data Scope)
18. **SYSTEM:** Cấu hình hệ thống, thương hiệu, tích hợp bên thứ ba, Audit Logs

---

## PHẦN III - V. CƠ CHẾ VẬN HÀNH, QUYỀN HẠN & KIẾN TRÚC KỸ THUẬT

### 5 Đối tượng nghiệp vụ cốt lõi (Core Domain Backbone):
1. **Parking Site:** Địa điểm vận hành vật lý.
2. **Vehicle:** Thực thể phương tiện được số hóa.
3. **Recognition Event:** Sự kiện quan sát từ Camera AI (biển số, khuôn mặt, góc chụp, confidence).
4. **Parking Session:** Thực thể phiên gửi xe (liên kết Entry Event và Exit Event).
5. **Payment Transaction:** Giao dịch thanh toán liên kết phiên gửi xe.

### Kiến trúc Hybrid Cloud + Edge:
- **Cloud Control Plane:** Cung cấp API quản lý tập trung, quản lý tenant, đối soát tài chính, đồng bộ dữ liệu vĩ mô và lưu trữ đám mây.
- **Edge Data Plane:** Chạy trên IPC/Edge Box tại bãi xe, xử lý luồng RTSP camera, suy luận AI (ANPR, Face), điều khiển PLC/Relay đóng mở barrier, và có cơ sở dữ liệu cục bộ hoạt động trơn tru ngay cả khi đứt cáp Internet.
- **Tuân thủ pháp lý:** Tuân thủ Luật Bảo vệ dữ liệu cá nhân Việt Nam số 91/2025/QH15 và Nghị định 356/2025/NĐ-CP (hiệu lực từ 01/01/2026), đảm bảo quyền rút lại consent sinh trắc học và thời hạn lưu trữ dữ liệu an toàn.
