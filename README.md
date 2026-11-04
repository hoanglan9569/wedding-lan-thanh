# Thiệp cưới online · Hoàng Lân & Trần Kim Thanh

Trang thiệp cưới một trang (single page), tiếng Việt, chỉ theme sáng, chạy mượt trên điện thoại.
Lễ thành hôn 09:00 và tiệc cưới 11:00, Chủ Nhật 29.11.2026, Kim Center - Sảnh Grand Opera, Đồng Nai.

**Đang chạy tại: https://lanthanh.pages.dev**
Công cụ tạo link mời riêng cho từng khách: https://lanthanh.pages.dev/moi.html

## Chạy thử

```bash
bun install
bun run dev        # http://127.0.0.1:5273
bun run build      # dist/
bun run preview    # http://127.0.0.1:4173
bun run typecheck
```

## Có gì trong trang

| Phần | Nội dung |
| --- | --- |
| Màn mở thiệp | Tên khách mời lấy từ đường dẫn, nút "Mở thiệp", bật nhạc nền |
| Hero | Ảnh cưới toàn màn hình, ken burns + parallax, mưa cánh sen trên canvas |
| Đếm ngược | Đếm tới 11:00 ngày 29.11.2026, nút tải `.ics` và Google Calendar |
| Lời ngỏ | Thư ngỏ gửi khách mời |
| Chú rể & Cô dâu | Hai ảnh đơn, tên cha mẹ hai bên |
| Thiệp mời | Bản web của thiệp giấy: hai nhà, lễ tại tư gia, tiệc tại Kim Center |
| Chương trình | Mốc 09:00 và 11:00, nút chỉ đường từng nơi |
| Album | 4 ảnh, lightbox có phím mũi tên và vuốt trên điện thoại |
| Địa điểm | Bản đồ giấy (bấm để phóng to), nút mở Google Maps |
| Xác nhận tham dự | Form RSVP + sổ lưu bút lời chúc |

### Mời riêng từng khách

Thêm `?to=` vào cuối đường dẫn, tên sẽ hiện ở màn mở thiệp và trong thiệp:

```
https://<ten-mien>/?to=Anh%20Nam%20%2B%20Gia%20%C4%91%C3%ACnh
```

Nhận cả `?guest=`, `?khach=`, `?name=`.

## Sửa nội dung

- Chữ cố định (thiệp mời, lời ngỏ, chân trang): `index.html`.
- Dữ liệu động (ngày giờ, địa chỉ, bản đồ, album, nhạc, RSVP): `src/data/wedding.ts`.
- Màu, phông chữ, nhịp khoảng cách: `src/styles/base.css` (phần `:root`).

## Ảnh

Ảnh gốc (4600x6900, ~65 MB) không nằm trong git. Tải lại từ Google Drive rồi đặt vào
`assets-src/originals/` với đúng tên:

| Tệp | Google Drive file id |
| --- | --- |
| VAN06601.jpg | `1zJK2RQD_LVWN7YkjzNsKBjnmclOmj-Z6` |
| VAN06795.jpg | `1sqSGUPb_AqRHXzzAE2EaE2fl5OUdi2kT` |
| VAN06896.jpg | `1KokRSp56JL15_25SDHNBQ1tYrsJNZvH9` |
| VAN09249.jpg | `1tUq4BFBNZXA2rh2pK7JMf5z5wN8ef6py` |

Sinh lại ảnh web (webp nhiều kích thước + ảnh mờ LQIP):

```bash
bun run optimize
```

Kết quả nằm trong `public/photos`, `public/map`, `public/invitation` và `src/data/images.json`.

## Nhạc nền

`public/audio/canon-in-d.mp3` - Canon in D (Pachelbel) do US Air Force Band Strolling Strings trình bày,
thuộc phạm vi công cộng. Nguồn và giấy phép: `public/audio/CREDITS.md`.
Đổi bài: thay tệp đó rồi sửa `music.src` trong `src/data/wedding.ts`.

## RSVP

Khách bấm gửi thì phản hồi đi hai nơi: hiện ngay ở phần "Lời chúc" trên máy khách, và gửi về
Cloudflare Worker `lanthanh-rsvp` (https://lanthanh-rsvp.hoanglan9569.workers.dev) lưu trong KV.
Worker không có đường nào đọc ngược dữ liệu ra, nên không cần mật khẩu nào cả.

Đọc phản hồi trên máy đã đăng nhập wrangler:

```bash
bun run rsvp:list                                   # liệt kê các khoá reply:...
cd worker && bunx wrangler kv key get "<khoá>" --binding RSVP --remote
```

Mã nguồn và hướng dẫn: `worker/` (`bun run rsvp:deploy` để đẩy lại).
Đổi chỗ nhận: đặt `VITE_RSVP_ENDPOINT=https://...` trong `.env`.
Endpoint nhận `POST` JSON: `{ name, side, attend, guests, wish, at }`.

## Đưa lên mạng

Trang chạy trên Cloudflare Pages (dự án `lanthanh`, tài khoản hoanglan9569@gmail.com):

```bash
bun run deploy       # build rồi đẩy thư mục dist lên Cloudflare Pages
```

Muốn gắn tên miền riêng: Cloudflare dashboard > Workers & Pages > lanthanh > Custom domains.
Sau khi đổi tên miền nhớ sửa `canonical`, `og:url`, `og:image` trong `index.html`.

## Kiểm tra giao diện

```bash
bun run preview
bun scripts/shots.ts            # ảnh chụp desktop + iPhone vào out/wedding-shots
```

Script báo lỗi console và tràn ngang; cần Playwright (`bun add -d playwright`).

## Kỹ thuật

Vite 8 + TypeScript 7, GSAP 3.15 (ScrollTrigger, SplitText), Lenis 1.3, phông tự host
(Cormorant Garamond, Be Vietnam Pro, Dancing Script - đủ dấu tiếng Việt).
Mọi hiệu ứng tôn trọng `prefers-reduced-motion`; canvas cánh hoa tự dừng khi rời màn hình hoặc ẩn tab.
