# Quy trình BMAD cho dự án

File này là quy trình tổng để định hướng cách làm việc trong dự án Website Bán Ô Tô Cũ. Khi làm việc trong repo này, cần đọc và đối chiếu các file sau nếu có liên quan:

- `.md/requirements.md`: yêu cầu, quy tắc và tiêu chuẩn làm việc.
- `.md/future-features.md`: tính năng mở rộng, kế hoạch và định hướng phát triển.
- `.md/bmad-workflow.md`: quy trình tổng theo BMAD Method.

## Nguyên tắc làm việc

- Trước khi sửa code hoặc thiết kế tính năng mới, cần xác định công việc đang thuộc phase nào.
- Nếu yêu cầu mới mâu thuẫn với các file `.md`, cần báo lại trước khi tiếp tục.
- Ưu tiên giải pháp dễ mở rộng cho các tính năng tương lai đã ghi trong `.md/future-features.md`.
- Không thêm refactor lớn nếu không phục vụ trực tiếp cho yêu cầu hiện tại.
- Với tính năng lớn, cần làm rõ MVP, phạm vi, user flow, data model và cách kiểm thử trước khi implement.
- Sau khi hoàn thành thay đổi quan trọng, cần cập nhật tài liệu `.md` nếu logic, phạm vi hoặc định hướng dự án thay đổi.

## Phase 1: Discovery

Dùng khi cần làm rõ ý tưởng, mục tiêu, đối tượng người dùng hoặc tính năng cốt lõi.

Các đầu việc có thể gồm:

- Brainstorm ý tưởng và mục tiêu website.
- Research thị trường xe cũ, đối thủ và khách hàng.
- Xác định yêu cầu ban đầu và tính năng cốt lõi.
- Xác định MVP và phạm vi phiên bản đầu tiên.
- Tạo Product Brief nếu cần tóm tắt ý tưởng sản phẩm.

## Phase 2: Planning

Dùng khi cần lập kế hoạch trước khi thiết kế hoặc code.

Các đầu việc có thể gồm:

- Tạo PRD hoặc mô tả yêu cầu sản phẩm.
- Review và chốt PRD trước khi chuyển sang UI hoặc giải pháp kỹ thuật.
- Xác định giao diện UI nếu tính năng có liên quan đến frontend.
- Tạo UX Specification: user flow, wireframe, mockup.
- Thiết kế UI: style guide, component, layout.
- Review UI/UX; nếu chưa đạt yêu cầu thì quay lại điều chỉnh user flow, wireframe hoặc component.
- Cập nhật mục `Lập kế hoạch` trong `.md/future-features.md` nếu có kế hoạch mới.

## Phase 3: Solutioning

Dùng khi cần chuyển yêu cầu thành giải pháp kỹ thuật và backlog có thể implement.

Các đầu việc có thể gồm:

- Thiết kế kiến trúc hệ thống.
- Xác định công nghệ, database và infrastructure.
- Thiết kế data model và entity chính, ví dụ: User, Seller, Dealer, Car, Brand, Model, Listing, Image, Inquiry, Favorite.
- Xác định roles và permissions, ví dụ: khách hàng, người bán cá nhân, salon, admin, moderator.
- Xác định API, luồng dữ liệu và tích hợp chính nếu có backend hoặc dịch vụ bên ngoài.
- Chia nhỏ Epic thành các nhóm tính năng lớn.
- Viết User Stories chi tiết.
- Thiết kế test case cho chức năng và phi chức năng.
- Đánh giá mức độ sẵn sàng triển khai: PRD rõ, UI rõ, architecture rõ, story đủ nhỏ, test case có thể kiểm tra.

## Phase 4: Implementation

Dùng khi bắt đầu lập trình, test và hoàn thiện tính năng.

Vòng lặp Story:

- Lập kế hoạch Sprint nếu cần.
- Tạo Story rõ ràng trước khi code nếu tính năng lớn.
- Phát triển Story theo phạm vi đã thống nhất.
- Review code, ưu tiên bug, risk và regression.
- Chạy test tự động nếu có, kiểm tra regression và kiểm thử thủ công các luồng quan trọng.
- Kiểm thử và QA theo acceptance criteria.
- Nếu chưa đạt yêu cầu, quay lại sửa Story.
- Nếu còn Story trong Epic, tiếp tục vòng lặp.
- Nếu hết Epic, đánh giá và retrospective.
- Cập nhật tài liệu, changelog hoặc các file `.md` nếu có thay đổi về yêu cầu, scope, kiến trúc hoặc tính năng tương lai.

## Nhóm tính năng tham chiếu

### Dành cho khách hàng

- Tìm kiếm và lọc xe theo hãng, dòng, năm sản xuất, giá, km, khu vực.
- Xem chi tiết xe: hình ảnh, thông tin, lịch sử, tình trạng, giấy tờ.
- So sánh xe.
- Yêu thích hoặc lưu xe.
- Gửi yêu cầu báo giá hoặc liên hệ.
- Đánh giá người bán hoặc xe.

### Dành cho người bán hoặc salon

- Đăng ký và xác thực tài khoản.
- Đăng tin bán xe.
- Quản lý tin đăng và kho xe.
- Quản lý liên hệ và báo giá.
- Thống kê hiệu suất tin đăng.

### Quản trị hệ thống

- Quản lý người dùng và salon.
- Duyệt tin đăng, quản lý nội dung.
- Quản lý danh mục hãng xe, dòng xe và tỉnh thành.
- Quản lý báo cáo và khiếu nại.
- Cấu hình hệ thống.

### Tiện ích

- Blog hoặc tin tức về ô tô.
- Bảng giá xe tham khảo.
- Công cụ định giá xe.
- Tính toán chi phí sang tên, vay ngân hàng.
- Chat hoặc hotline hỗ trợ.

### Yêu cầu phi chức năng

- Bảo mật và phân quyền.
- Hiệu năng và khả năng mở rộng.
- Tối ưu SEO.
- Responsive, ưu tiên mobile-first.
- Backup và recovery.
- Logging và monitoring.
- Tuân thủ pháp lý nếu có.

## Cách áp dụng trong mỗi yêu cầu

Khi nhận một yêu cầu mới:

1. Đọc các file `.md` liên quan.
2. Xác định phase BMAD phù hợp.
3. Nếu yêu cầu nhỏ và rõ ràng, thực hiện trực tiếp nhưng vẫn giữ đúng định hướng.
4. Nếu yêu cầu lớn hoặc mơ hồ, tách thành planning, solutioning và implementation.
5. Sau khi làm xong, nếu có thay đổi về định hướng hoặc tính năng tương lai, đề xuất cập nhật file `.md` phù hợp.
