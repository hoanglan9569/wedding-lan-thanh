/**
 * Toàn bộ dữ liệu của thiệp cưới.
 * Sửa file này là đổi được nội dung động (đếm ngược, lịch, bản đồ, album, RSVP).
 * Phần chữ cố định nằm trong index.html.
 */

export interface PhotoDef {
  slug: string;
  alt: string;
  caption: string;
}

export interface EventDef {
  id: string;
  time: string;
  title: string;
  place: string;
  address: string;
  mapQuery: string;
  /** ISO local, dùng cho đếm ngược và file lịch */
  startsAt: string;
  durationMinutes: number;
}

export const couple = {
  groom: {
    name: 'Hoàng Lân',
    fullName: 'Hoàng Lân',
    role: 'Út Nam',
    father: 'Ông: Hoàng Văn Vẽ',
    mother: 'Bà: Nguyễn Thị Phương',
    address: 'Tổ 18, Khu phố 6, Tam Hiệp, Đồng Nai',
    photo: 'van09249',
  },
  bride: {
    name: 'Kim Thanh',
    fullName: 'Trần Kim Thanh',
    role: 'Trưởng Nữ',
    father: 'Ông: Trần Công Dứt',
    mother: 'Bà: Nguyễn Thị Hiền',
    address: 'Tổ 19, KP. Vườn Dừa, Phước Tân, Đồng Nai',
    photo: 'van06601',
  },
} as const;

export const weddingDate = {
  /** Mốc chính cho đếm ngược: tiệc cưới 11:00 ngày 29/11/2026 (GMT+7) */
  isoMain: '2026-11-29T11:00:00+07:00',
  day: 29,
  month: 11,
  year: 2026,
  weekday: 'Chủ Nhật',
  lunar: 'Nhằm ngày 21 tháng 10 năm Bính Ngọ',
  display: '29 . 11 . 2026',
} as const;

export const events: EventDef[] = [
  {
    id: 'le-thanh-hon',
    time: '09:00',
    title: 'Lễ Thành Hôn',
    place: 'Tư gia nhà trai',
    address: 'Tổ 18, Khu phố 6, Tam Hiệp, Đồng Nai',
    mapQuery: 'Tổ 18, Khu phố 6, Tam Hiệp, Đồng Nai',
    startsAt: '2026-11-29T09:00:00+07:00',
    durationMinutes: 90,
  },
  {
    id: 'tiec-cuoi',
    time: '11:00',
    title: 'Tiệc Cưới',
    place: 'Kim Center · Sảnh Grand Opera - Lầu 2',
    address: '628 Phạm Văn Thuận, KP. 5, Tam Hiệp, Đồng Nai',
    mapQuery: 'Kim Center 628 Phạm Văn Thuận, Tam Hiệp, Biên Hòa, Đồng Nai',
    startsAt: '2026-11-29T11:00:00+07:00',
    durationMinutes: 180,
  },
];

export const venue = {
  name: 'KIM CENTER',
  hall: 'Sảnh Grand Opera - Lầu 2',
  address: '628 Phạm Văn Thuận, KP. 5, Tam Hiệp, Đồng Nai',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Kim%20Center%20628%20Ph%E1%BA%A1m%20V%C4%83n%20Thu%E1%BA%ADn%20T%C3%A2n%20Hi%E1%BB%87p%20Bi%C3%AAn%20H%C3%B2a%20%C4%90%E1%BB%93ng%20Nai',
} as const;

export const album: PhotoDef[] = [
  { slug: 'van06601', alt: 'Cô dâu Kim Thanh', caption: 'Cô dâu' },
  { slug: 'van06896', alt: 'Cô dâu chú rể sau bó hoa cưới', caption: 'Lời thì thầm' },
  { slug: 'van06795', alt: 'Hoàng Lân và Kim Thanh trong vườn', caption: 'Nắm tay nhau' },
  { slug: 'van09249', alt: 'Chú rể Hoàng Lân', caption: 'Chú rể' },
];

export const music = {
  /** Public domain: US Air Force Band Strolling Strings - xem public/audio/CREDITS.md */
  src: '/audio/canon-in-d.mp3',
  title: 'Canon in D · Pachelbel',
  volume: 0.42,
} as const;

export const rsvp = {
  /**
   * Nơi nhận phản hồi: Cloudflare Worker lanthanh-rsvp (ghi vào KV).
   * Đọc phản hồi bằng `bun run rsvp:list` - xem worker/README.md.
   * Đổi chỗ nhận thì đặt VITE_RSVP_ENDPOINT trong .env
   */
  endpoint:
    import.meta.env.VITE_RSVP_ENDPOINT ?? 'https://lanthanh-rsvp.hoanglan9569.workers.dev/rsvp',
  contactPhone: '',
  deadline: '20 . 11 . 2026',
} as const;

export const site = {
  title: 'Hoàng Lân & Kim Thanh · 29.11.2026',
  description:
    'Thiệp cưới online của Hoàng Lân và Trần Kim Thanh. Lễ thành hôn 09:00 và tiệc cưới 11:00, Chủ Nhật 29.11.2026 tại Kim Center, Đồng Nai.',
  hashtag: '#LanThanh2026',
} as const;
