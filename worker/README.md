# Cloudflare Worker RSVP (lanthanh-rsvp)

Worker thu thập phản hồi tham dự (RSVP) và lời chúc từ website đám cưới `https://lanthanh.pages.dev`, lưu trực tiếp vào Cloudflare KV (`RSVP`) để cô dâu chú rể tra cứu qua CLI mà không để lộ dữ liệu ra public web.

## Deployed URL
- Endpoint: `https://lanthanh-rsvp.hoanglan9569.workers.dev`
- KV Namespace ID: `e8e1be01346f4d75910289ba12c85ce7`

## Tính năng
- Hỗ trợ CORS cho `https://lanthanh.pages.dev`, các deployment preview `https://*.lanthanh.pages.dev`, và localhost preview (`http://127.0.0.1:4173`, `http://127.0.0.1:5273`).
- Endpoint `GET /`: Kiểm tra trạng thái worker (`lanthanh rsvp ok`).
- Endpoint `POST /` & `POST /rsvp`: Tiếp nhận JSON `{ name, side, attend, guests, wish, at }`. Kiểm tra kích thước body (<= 4000 bytes), chuẩn hoá chuỗi (name tối đa 120 ký tự, wish 600 ký tự, guests 1-20), đính kèm IP & User-Agent, lưu vào KV với key `reply:<ISO timestamp>:<random 6 ký tự>`.
- Bảo mật: Không có endpoint nào public danh sách phản hồi (chỉ đọc qua CLI với tài khoản Cloudflare đã đăng nhập).

## Tra cứu phản hồi bằng Wrangler CLI

Thực hiện bên trong thư mục `worker/` (hoặc chỉ định đường dẫn tới wrangler):

1. **Liệt kê danh sách phản hồi:**
   ```powershell
   wrangler kv key list --binding RSVP --remote
   ```

2. **Xem chi tiết một phản hồi:**
   ```powershell
   wrangler kv key get "<key>" --binding RSVP --remote
   ```
   *(Ví dụ: `wrangler kv key get "reply:2026-11-04T08:49:38.656Z:9f5d8a" --binding RSVP --remote`)*

3. **Xoá một phản hồi:**
   ```powershell
   wrangler kv key delete "<key>" --binding RSVP --remote
   ```

*(Lưu ý: Với Wrangler v4, cờ `--remote` đảm bảo thao tác trực tiếp trên Cloudflare KV remote thay vì local storage).*

## Deploy lại khi cập nhật mã nguồn

Khi chỉnh sửa code trong `worker/`:
```powershell
cd worker
wrangler deploy
```
