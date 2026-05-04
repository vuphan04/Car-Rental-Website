# Hướng dẫn cho Codex trong repo này

Trước khi phân tích, sửa code, thiết kế tính năng mới hoặc cập nhật tài liệu trong repo này, hãy đọc và đối chiếu các file đặc tả sau:

- `.md/requirements.md`: yêu cầu chính, quy tắc làm việc, tiêu chuẩn code, UI/UX và kiểm thử.
- `.md/future-features.md`: định hướng mở rộng và các tính năng có thể phát triển trong tương lai.
- `.md/bmad-workflow.md`: quy trình làm việc tổng theo BMAD Method.

## Cách áp dụng

- Ưu tiên làm đúng yêu cầu hiện tại của người dùng.
- Nếu yêu cầu hiện tại có liên quan đến đặc tả trong các file `.md`, phải tuân theo các file đó.
- Nếu yêu cầu hiện tại mâu thuẫn với các file `.md`, hãy báo rõ điểm mâu thuẫn trước khi tiếp tục.
- Nếu các file `.md` mâu thuẫn với code thực tế, hãy báo lại và ưu tiên không tự ý đổi kiến trúc lớn nếu người dùng chưa yêu cầu.
- Không tự ý đổi cấu trúc thư mục, công nghệ chính, database hoặc luồng nghiệp vụ quan trọng nếu chưa có yêu cầu rõ ràng.
- Với tính năng lớn, hãy xác định phạm vi MVP, luồng người dùng, dữ liệu liên quan và cách kiểm thử trước khi implement.
- Sau khi thay đổi logic, phạm vi, API, database hoặc định hướng tính năng, hãy cập nhật tài liệu `.md` liên quan nếu phù hợp.

## Ghi chú hiện tại

- Code hiện tại đang dùng Node.js, Express và SQLite.
- Nếu tài liệu yêu cầu MySQL nhưng code vẫn đang dùng SQLite, cần hỏi hoặc báo lại trước khi chuyển database.

