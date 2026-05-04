# Tính năng mở rộng trong tương lai

Ghi các ý tưởng, tính năng có thể phát triển thêm và định hướng mở rộng dự án tại đây. Khi bạn yêu cầu tôi làm việc, tôi sẽ tham chiếu file này để tránh làm lệch hướng phát triển dài hạn.

## Tính năng ưu tiên cao

- Tìm kiếm + lọc nâng cao theo: hãng, loại xe, năm, giá, nhiên liệu, hộp số, xuất xứ, màu, tình trạng
- Trang chi tiết xe riêng với ảnh lớn, thông số kỹ thuật, mô tả, liên hệ ngay
- Form đặt hẹn xem xe / liên hệ tư vấn
- Quản lý kho xe admin: upload nhiều ảnh đã có ở mức cơ bản; tiếp tục bổ sung trạng thái xe (còn hàng / đã bán / đang giữ)
- Đăng ký/đăng nhập người dùng với trang hồ sơ cá nhânTìm kiếm + lọc nâng cao theo: hãng, loại xe, năm, giá, nhiên liệu, hộp số, xuất xứ, màu, tình trạng
- Người dùng có thể chỉnh sửa thông tin cá nhân.

## Lập kế hoạch

- Hệ thống đánh giá & bình luận khách hàng cho từng xe
- Danh sách yêu thích / so sánh xe cho người dùng
- Dashboard admin hiển thị số liệu như: lượt xem, lượt liên hệ, xe bán chạy, doanh thu ước tính
- Lịch sử phiên đăng nhập & quản lý session cho người dùng
- Thống kê khách hàng & hoạt động (CRM cơ bản)

## Tính năng có thể làm sau

- Thanh toán / đặt cọc trực tuyến
- Chat trực tiếp hoặc chatbot hỗ trợ mua xe
- Hệ thống ưu đãi, mã giảm giá, chương trình khuyến mãi
- Blog tin tức ô tô, hướng dẫn mua xe, đánh giá xe
- Hệ thống đăng bán xe cũ cho người dùng cá nhân
- Ứng dụng mobile (iOS/Android)

## Cải tiến UI/UX

- Làm responsive tốt cho mobile/tablet
- Thêm trải nghiệm tìm kiếm nhanh, lọc real-time
- Form nhẹ nhàng, thông báo rõ ràng khi gửi yêu cầu/đăng nhập
- Chế độ tối (dark mode)
- Cải thiện truy cập bàn phím và hỗ trợ screen reader
- Thiết kế admin trực quan hơn: bảng, biểu đồ, filter, bulk actions

## Cải tiến kỹ thuật

- Sử dụng database migration / schema versioning thay vì copy trực tiếp SQLite
- Thêm validation chuỗi dữ liệu phía server và client
- Tối ưu cache cho danh sách xe
- Xử lý upload ảnh thực tế, lưu trữ file/đám mây
- Xây dựng REST API rõ ràng, tách frontend/backend
- Bổ sung logging, error tracking, health check
- Viết unit tests & integration tests

## Tích hợp bên ngoài

- Google/Facebook login
- API thanh toán (MoMo, VNPay, ZaloPay, Stripe)
- Google Maps / định vị showroom
- CRM hoặc hệ thống quản lý khách hàng
- Dịch vụ email marketing / thông báo tin mới
- API kiểm tra giá trị xe, lịch sử xe cũ

## Ghi chú về khả năng mở rộng

- Thiết kế module sao cho dễ đổi database (SQLite -> PostgreSQL / MySQL)
- Tách front-end thành SPA riêng nếu cần
- Chuẩn bị để triển khai lên hosting / cloud (Heroku, Vercel, Azure, AWS)
- Quản lý cấu hình admin qua biến môi trường hoặc dashboard
- Cấu trúc folder rõ ràng: routes, controllers, models, views
