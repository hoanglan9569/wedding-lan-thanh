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
| Màn mở thiệp | Phong bì có dấu niêm phong: bẻ dấu, mở nắp, tấm thiệp trượt lên rồi tan vào ảnh cưới. Mở được bằng cách chạm dấu niêm phong, cuộn xuống hoặc nhấn phím. Tên khách lấy từ đường dẫn |
| Hero | Ảnh cưới toàn màn hình, ken burns + parallax, mưa cánh sen trên canvas |
| Đếm ngược | Đếm tới 11:00 ngày 29.11.2026, nút tải `.ics` và Google Calendar |
| Lời ngỏ | Thư ngỏ gửi khách mời |
| Chú rể & Cô dâu | Hai ảnh đơn, tên cha mẹ hai bên |
| Thiệp mời | Bản web của thiệp giấy: hai nhà, lễ tại tư gia, tiệc tại Kim Center |
| Chương trình | Mốc 09:00 và 11:00, nút chỉ đường từng nơi |
| Album | 4 ảnh, lightbox có phím mũi tên và vuốt trên điện thoại |
| Địa điểm | Bản đồ giấy (bấm để phóng to), nút mở Google Maps |
| Xác nhận tham dự | Form RSVP gửi thẳng về Cloudflare Worker |
| Sổ lưu bút | Chỉ hiện lời chúc đã được gia đình duyệt |

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

## RSVP và duyệt lời chúc

Khách gửi phản hồi thì bản ghi vào Cloudflare Worker `lanthanh-rsvp`
(https://lanthanh-rsvp.hoanglan9569.workers.dev) với trạng thái `pending`. Trang chỉ hiển thị lời chúc
đã `approved`, nên không ai đăng bậy lên trang được.

**Trang duyệt: https://lanthanh.pages.dev/admin.html**

- Lần đầu vào sẽ hỏi đặt mật khẩu (ít nhất 8 ký tự). Worker chỉ lưu bản băm SHA-256 kèm muối,
  không lưu mật khẩu gốc, và khoá IP 10 phút sau 10 lần nhập sai.
- Mỗi lời chúc có nút **Duyệt**, **Ẩn**, **Lưu sửa** (sửa chữ trong ô văn bản) và **Xoá**.
- Lời chúc vừa duyệt xuất hiện trên trang sau tối đa 30 giây (bộ nhớ đệm của Cloudflare).
- Quên mật khẩu: xoá khoá `admin:auth` rồi đặt lại
  (`cd worker && bunx wrangler kv key delete "admin:auth" --binding RSVP --remote`).

Đọc thẳng dữ liệu từ máy đã đăng nhập wrangler:

```bash
bun run rsvp:list                                   # liệt kê các khoá reply:...
cd worker && bunx wrangler kv key get "<khoá>" --binding RSVP --remote
```

Mã nguồn và hướng dẫn: `worker/` (`bun run rsvp:deploy` để đẩy lại).
Đổi chỗ nhận: đặt `VITE_RSVP_ENDPOINT=https://...` trong `.env`.
Endpoint nhận `POST` JSON: `{ name, side, attend, guests, wish, at }`.

## Tranh trang trí

`public/art/*.webp` là tranh màu nước do Krea 2 vẽ (hoa sen, lá bạch đàn, cánh hoa rơi, dấu niêm phong),
đã tách nền trong suốt. Bản gốc nằm ở `assets-src/art/`. Vẽ lại hoặc thay tranh thì chép vào
`assets-src/art/` đúng tên rồi chạy:

```bash
bun run optimize:art
```

Các tranh được đặt bằng nền CSS trong `src/styles/ornaments.css`: thiếu tệp nào thì chỗ đó chỉ trống,
bố cục không vỡ.

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
