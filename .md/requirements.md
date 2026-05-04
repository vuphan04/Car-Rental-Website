# Yêu cầu làm việc

Ghi các đặc tả, quy tắc và ưu tiên của bạn tại đây. Mỗi khi bạn yêu cầu tôi làm việc trong repo này, tôi sẽ đọc và tuân theo file này nếu có liên quan.

## Mục tiêu dự án

- Hiển thị danh sách ô tô cũ đang bán
- Slider xe ở trang chủ chỉ hiển thị tối đa 10 xe mới nhất từ cơ sở dữ liệu
- Khi nhấn "Xem tất cả" trong mục mua xe, hệ thống mở trang con danh sách xe có ô tìm kiếm theo tên xe và bộ lọc cơ bản
- Cho phép người dùng tìm kiếm, lọc và xem chi tiết xe
- Khi người dùng nhấn vào card xe, hệ thống mở trang chi tiết riêng tại `/cars/:id` để xem ảnh, mô tả và thông số đầy đủ của xe.
- Cho phép người dùng đăng ký, đăng nhập, quản lý tài khoản
- Cho phép người dùng đã đăng nhập xem họ tên, email và cập nhật hồ sơ cá nhân: số điện thoại, số CCCD, ngày sinh, giới tính, ảnh đại diện và địa chỉ liên hệ.
- Cho phép người dùng đã đăng nhập lưu xe yêu thích và xem danh sách xe yêu thích của chính mình.
- Cho phép người dùng liên hệ mua xe hoặc đặt lịch xem xe
- Có trang quản trị để quản lý xe, người dùng, đơn liên hệ và dữ liệu hệ thống
- Trang quản trị cho phép admin nhấn vào khách hàng trong danh sách khách hàng để xem popup chi tiết hồ sơ khách hàng.
- Form thêm/sửa xe trong trang admin phải có trường nhập hãng xe là trường đầu tiên
- Form thêm/sửa xe trong trang admin cho phép nhập mô tả xe để lưu thông tin tình trạng, tiện nghi hoặc ghi chú bán xe.
- Form thêm/sửa xe trong trang admin dùng lựa chọn cố định cho phân khúc, kiểu vận hành, nhiên liệu, số chỗ, hộp số, xuất xứ, tình trạng và nút hành động để hạn chế nhập sai dữ liệu.
- Cho phép admin tải lên một hoặc nhiều ảnh cho mỗi xe bằng nút chọn ảnh
- Có chức năng thanh toán qua ngân hàng hoặc các ví điện tử
## Quy tắc chung

- Viết code rõ ràng, dễ hiểu, dễ bảo trì.
- Không viết code quá phức tạp nếu chưa cần thiết.
- Ưu tiên hoàn thành đúng chức năng trước, sau đó mới tối ưu giao diện hoặc hiệu năng.
- Không tự ý đổi cấu trúc thư mục nếu không cần.
- Không tự ý đổi tên file, tên bảng database, tên biến quan trọng nếu không được yêu cầu.
- Nếu cần tạo file mới, đặt tên rõ nghĩa theo chức năng.
- Code phải chạy được trên môi trường Node.js, Express.js và SQLite.
- Không hard-code thông tin nhạy cảm như mật khẩu database, secret key, token.
- Các cấu hình quan trọng nên đặt trong file `.env`.

## Tiêu chuẩn code
- Code phải rõ ràng, dễ đọc, dễ hiểu và dễ bảo trì.
- Đặt tên biến, tên hàm, tên file có ý nghĩa, đúng với chức năng.
- Không viết code quá dài trong một file nếu có thể tách nhỏ.
- Không lặp lại code nhiều lần, nên tách thành hàm dùng lại khi cần.
- Không tự ý thay đổi cấu trúc thư mục nếu không cần thiết.
- Không tự ý xóa file hoặc sửa logic quan trọng khi chưa được yêu cầu.
- Ưu tiên cách làm đơn giản, phù hợp với đồ án tốt nghiệp.

### Frontend

- Sử dụng HTML, CSS, JavaScript thuần.
- Không dùng React, Vue, Angular hoặc framework frontend khác nếu không được yêu cầu.
- HTML cần viết đúng cấu trúc, dễ đọc.
- CSS đặt class rõ nghĩa, tránh viết style inline quá nhiều.
- JavaScript nên tách ra file riêng, hạn chế viết trực tiếp trong HTML.
- Giao diện cần responsive cơ bản cho desktop, tablet và mobile.
- Form cần có kiểm tra dữ liệu cơ bản trước khi gửi lên server.

### Backend

- Sử dụng Node.js và Express.js.
- Tách code theo chức năng nếu dự án đủ lớn:
  - routes
  - controllers
  - models
  - middlewares
  - config
- API trả về JSON thống nhất.
- Luôn kiểm tra dữ liệu đầu vào từ client.
- Không để server bị crash khi người dùng nhập sai dữ liệu.
- Xử lý lỗi rõ ràng và trả về thông báo dễ hiểu.

### Database

- Sử dụng SQLite theo cấu trúc hiện tại của dự án.
- Tên bảng và tên cột viết rõ nghĩa, thống nhất.
- Dùng khóa chính `id` cho các bảng.
- Dùng khóa ngoại khi cần liên kết dữ liệu.
- Không lưu mật khẩu dạng plain text.
- Mật khẩu phải được hash trước khi lưu. Code hiện tại đang dùng `scryptSync` của Node.js.
- Dùng prepared statement hoặc API database an toàn để tránh SQL Injection.
- Bảng `users` có cột `role` để phân quyền tài khoản: `customer`, `staff`, `admin`.
- Bảng `users` lưu thêm hồ sơ khách hàng trong các cột `phone`, `citizen_id`, `birth_date`, `gender`, `avatar_url`, `address_province`, `address_district`, `address_ward`, `address_detail`, `updated_at`.
- Bảng `users` lưu thêm hồ sơ nhân viên kinh doanh hiển thị trang chủ trong các cột `sales_title`, `sales_experience`, `sales_bio`, `show_on_home`, `home_display_order`. Cột `sales_specialty` có thể còn tồn tại ở database cũ nhưng không hiển thị trên giao diện.
- Bảng `cars` lưu hãng xe trong cột `brand`, mô tả xe trong cột `description`, ảnh chính trong cột `image` và danh sách nhiều ảnh trong cột `images_json`.
- Bảng `user_favorite_cars` lưu xe yêu thích của khách hàng bằng `user_id`, `car_id`, `created_at`, có khóa ngoại tới `users` và `cars`.
- Ảnh xe được upload local vào thư mục `storage/uploads/cars` hoặc thư mục được cấu hình bằng `OKXE_UPLOAD_DIR`.
- Ảnh đại diện người dùng được upload local vào thư mục `storage/uploads/avatars` hoặc thư mục upload được cấu hình bằng `OKXE_UPLOAD_DIR`.

### Bảo mật

- Không hard-code mật khẩu database, token hoặc secret key trong code.
- Thông tin cấu hình nên để trong file `.env`.
- Phân quyền rõ ràng giữa người dùng thường, nhân viên và admin.
- Người dùng thường không được truy cập chức năng quản trị. Chỉ tài khoản có `role` là `staff` hoặc `admin` mới được vào trang admin và gọi API quản trị.
- Trang quản trị sử dụng trang đăng nhập nhân viên riêng tại `/admin-login`.
- Email nhân viên/admin có thể được cấu hình bằng `STAFF_EMAILS` và `ADMIN_EMAILS` trong `.env` để tự gán quyền khi tài khoản đăng ký hoặc khi server khởi động.
- Quyền `staff` được quản lý xe trong admin. Quyền `admin` được quản lý xe và quản lý tài khoản nhân viên, bao gồm tạo tài khoản nhân viên/admin, chỉnh sửa họ tên/email/mật khẩu/role, đổi role nhanh và xóa tài khoản.
- Hệ thống không cho xóa hoặc hạ quyền admin cuối cùng để tránh khóa mất quyền quản trị.
- Không hiển thị lỗi kỹ thuật chi tiết cho người dùng cuối.

### Quy ước khi sửa code

- Khi sửa lỗi, chỉ sửa đúng phần liên quan đến lỗi.
- Khi thêm chức năng mới, cần đảm bảo không làm hỏng chức năng cũ.
- Nếu thay đổi database, cần ghi rõ câu lệnh SQL cần chạy.
- Nếu tạo file mới, đặt tên file rõ nghĩa theo chức năng.
- Sau khi sửa xong, cần kiểm tra lại chức năng liên quan.

## UI/UX

- Giao diện hiện đại, dễ nhìn, phù hợp chủ đề ô tô.
- Màu sắc ưu tiên theo giao diện đã được làm trước đó. Khi thêm chức năng phải được sử dụng theo giao diện trước đó.
- Website cần responsive cơ bản cho desktop, tablet và mobile.

## Kiểm thử

- Trước khi báo hoàn thành task, cần tự kiểm tra các nội dung sau:

- Chạy website và đảm bảo không có lỗi nghiêm trọng.
- Kiểm tra console trình duyệt, không để lỗi JavaScript nghiêm trọng.
- Kiểm tra backend không bị crash khi thao tác sai dữ liệu.
- Kiểm tra API trả về đúng dữ liệu và đúng định dạng JSON.
- Kiểm tra form đăng ký, đăng nhập hoạt động đúng.
- Kiểm tra chức năng thêm, sửa, xóa xe hoạt động đúng.
- Kiểm tra chức năng upload một hoặc nhiều ảnh xe trong trang admin hoạt động đúng.
- Kiểm tra dữ liệu được lưu, sửa, xóa đúng trong SQLite.
- Kiểm tra phân quyền: người dùng thường không được vào trang admin.
- Kiểm tra giao diện responsive cơ bản trên desktop, tablet và mobile.
- Nếu có sửa chức năng cũ, cần đảm bảo chức năng cũ vẫn hoạt động bình thường.

Nếu có thay đổi database, bắt buộc ghi rõ:

- Tên bảng bị thay đổi.
- Tên cột được thêm, sửa hoặc xóa.
- Câu lệnh SQL cần chạy.
- Lý do cần thay đổi database.

## Ghi chú khác
- Đây là đồ án tốt nghiệp nên ưu tiên code dễ giải thích khi bảo vệ.
- Không dùng công nghệ quá phức tạp ngoài HTML, CSS, JavaScript, Node.js, Express.js và SQLite nếu không được yêu cầu.
- Không tự ý thêm framework frontend như React, Vue, Angular.
- Không tự ý thay đổi toàn bộ giao diện hoặc kiến trúc dự án nếu task chỉ yêu cầu sửa một phần nhỏ.
- Khi tạo chức năng mới, cần đảm bảo phù hợp với website bán ô tô cũ.
- Khi không chắc yêu cầu, hãy chọn cách đơn giản, dễ hiểu và dễ bảo trì nhất.
