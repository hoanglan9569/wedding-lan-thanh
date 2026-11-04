# Thiệp cưới online · Hoàng Lân & Trần Kim Thanh

Trang thiệp cưới một trang (single page), tiếng Việt, chỉ theme sáng, chạy mượt trên điện thoại.
Lễ thành hôn 09:00 và tiệc cưới 11:00, Chủ Nhật 29.11.2026, Kim Center - Sảnh Grand Opera, Đồng Nai.

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

Mặc định form lưu phản hồi trên máy khách (localStorage) và hiện ngay ở phần "Lời chúc".
Muốn nhận phản hồi về một nơi tập trung, tạo `.env`:

```
VITE_RSVP_ENDPOINT=https://<worker-cua-ban>/rsvp
```

Endpoint nhận `POST` JSON: `{ name, side, attend, guests, wish, at }`.

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
