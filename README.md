# TXT BARTER BY EZZYJON — Next.js versiyasi

Qurilish kompaniyasi uchun barter shartnomalari, material/ish hajmi (abyom) tushumlari va
qoldiq qarzni hisoblash tizimi. Avvalgi Django monoliti **to'liq Next.js 15 + Prisma +
PostgreSQL** ga ko'chirildi. Dizayn (qora/oq rejim, KPI kartalari, modal oyna) o'zgarmagan.

## Nima o'zgardi

| Avval (Django) | Hozir (Next.js) |
|---|---|
| Django + HTMX + Django template | Next.js 15 App Router + React 19 (Server Components + Server Actions) |
| Django ORM + SQLite/Postgres | Prisma ORM + PostgreSQL |
| `django.contrib.auth` | O'z sessiyasi (DB'da saqlanadi, cookie'da faqat ID), parol `scrypt` bilan |
| `openpyxl` | `exceljs` |
| Lucide CDN + Chart.js CDN | `lucide-react` + `chart.js` (npm) |
| `manage.py run_bot` (alohida jarayon) | Server ichida `instrumentation.ts` (ENABLE_BOT=true) |
| — | **Mening kabinetim**: profil va parolni almashtirish |
| — | Admin foydalanuvchining parolini tiklay oladi |

## Tez ishga tushirish — Docker (tavsiya etiladi)

```bash
cp .env.example .env
# .env ichida POSTGRES_PASSWORD ni almashtiring

docker compose up -d --build
```

Keyin brauzerda: <http://localhost:3000>

**Birinchi kirish: `admin` / `admin`** — tizim darhol parolni almashtirishni so'raydi
(«Mening kabinetim» sahifasi). Boshqa boshlang'ich parol kerak bo'lsa, `.env` da
`ADMIN_PASSWORD` ni o'zgartiring (baza birinchi marta yaratilishidan oldin).

Konteyner ishga tushganda avtomatik bajariladi:

1. Bazani kutadi;
2. `prisma db push` — jadvallarni yaratadi;
3. `scripts/seed.mjs` — admin va bot sozlamalari yozuvini yaratadi (takroriy ishga tushirish xavfsiz);
4. `next start`.

Loglar: `docker compose logs -f web`

## Lokal ishga tushirish (Docker'siz)

Node.js 20+ va ishlayotgan PostgreSQL kerak.

```bash
cp .env.example .env         # DATABASE_URL ni to'g'rilang
npm install
npx prisma db push
node scripts/seed.mjs
npm run dev                  # http://localhost:3000
```

Ishlab chiqarish uchun: `npm run build && npm run start`.

## Bo'limlar

| Bo'lim | Manzil | Kim ko'radi |
|---|---|---|
| Dashboard | `/` | hamma |
| Barterlar (filtr, Excel, modal oyna) | `/barterlar` | hamma (import — admin) |
| Yangi / tahrir | `/barterlar/yangi`, `/barterlar/<id>/tahrir` | hamma |
| To'lovlar | `/tolovlar` | hamma (o'chirish — admin) |
| Trend va tahlil | `/trend` | hamma |
| Oylik hisobot | `/oylik-hisobot` | hamma |
| Foydalanuvchilar | `/foydalanuvchilar` | admin |
| Audit log | `/audit` | admin |
| Bot sozlamalari | `/bot` | admin |
| Mening kabinetim | `/kabinet` | hamma |

Menejer faqat o'ziga biriktirilgan TJMlardagi shartnomalarni ko'radi va ular bilan ishlaydi.

## Pul mantig'i (o'zgarmagan)

Barcha o'zgarishlar `src/lib/services.ts` orqali o'tadi — atomik tranzaksiya + qatorni
qulflash (`SELECT … FOR UPDATE`) + audit yozuvi:

- **Qoldiq summa** = umumiy summa − yopilgan qism (chek + barcha tushumlar).
- **Qarzdorlik** = grafik bo'yicha muddati o'tib to'lanmagan summa
  (`monthlyAmount` − `debtSetAt` dan keyingi tushumlar), qoldiqdan oshmaydi.
- Tushum **avval qarzdorlikni yopadi**, qoldiq esa har doim kamayadi.
- Tushum qoldiqdan katta bo'la olmaydi. Qoldiq 0 bo'lsa, shartnoma avtomatik yopiladi
  (formadagi belgi bilan boshqariladi).
- Tushumni o'chirish (faqat admin) qoldiqni tiklaydi; «Majburiyat bajarildi» sababi bilan
  yopilgan shartnoma qayta ochiladi.
- Yopish sabablari: majburiyat bajarildi (qoldiq 0 bo'lishi shart), uy qaytarildi,
  bekor qilindi (oxirgi ikkisida izoh majburiy).

## Excel import

`/barterlar/import` (faqat admin). Asl `txt_barter.xlsx` ham, tozalangan fayl (`Import`
varag'i) ham qabul qilinadi. Avval «Faqat tekshirish» bilan ishga tushiring — bazaga hech
narsa yozilmaydi.

Qoidalar avvalgidek: ustunlar nomi bo'yicha aniqlanadi, shartnoma **TJM + raqam** bo'yicha
topiladi, qayta import xavfsiz, tizimda tushum kiritilgan shartnomalarning summalari
Exceldan yangilanmaydi, to'liq dublikat qatorlar o'tkazib yuboriladi. Avtomatik tuzatishlar
(telefon formatlari, `23,12,2025` kabi sanalar, kirillcha harfli raqamlar, `GAZABLOK →
GAZOBLOK` va h.k.) `src/lib/cleaning.ts` da.

## Telegram bot

1. @BotFather → `/newbot` → token oling.
2. Saytda **Bot sozlamalari** → token va Chat ID larni kiriting → Saqlash → «Test xabari».
3. `.env` da `ENABLE_BOT=true` bo'lsa, bot server bilan birga ishlaydi (alohida konteyner
   kerak emas).

Kunlik va haftalik hisobotlar belgilangan vaqtda yuboriladi; yangi tushum, yangi shartnoma
va yopilish haqida darhol xabar boradi. Buyruqlar: `/bugun`, `/kecha`, `/hafta`, `/qarz`,
`/qarz Crystal`.

> Bir nechta nusxada (replica) ishlatsangiz, `ENABLE_BOT=true` ni faqat bittasida yoqing —
> aks holda hisobot bir necha marta yuboriladi.

## Tuzilma

```
prisma/schema.prisma      ma'lumotlar bazasi sxemasi
scripts/seed.mjs          admin/admin va bot sozlamalari
src/app/                  sahifalar (App Router)
  (app)/                  kirish talab qilinadigan sahifalar + sidebar
  kirish/                 login
  api/contract/[id]/      modal oyna uchun JSON
  api/export/             .xlsx eksportlar
src/actions/              server actions (forma yuborishlar)
src/components/           UI komponentlari (modal, filtrlar, grafiklar)
src/lib/
  services.ts             pul o'zgarishlari (yagona manba)
  selectors.ts            dashboard, trend, oylik hisobot hisoblari
  cleaning.ts             Excel tozalash (bazaga bog'liq emas)
  importer.ts             Excel → baza
  exports.ts              .xlsx eksportlar
  telegram.ts, botReports.ts, scheduler.ts, notify.ts
  auth.ts, permissions.ts, audit.ts
  format.ts, dates.ts, constants.ts
```

## Xavfsizlik bo'yicha eslatmalar

- HTTPS ortida ishlatilsa `.env` da `SECURE_COOKIES=true` qiling.
- `admin/admin` — faqat birinchi kirish uchun. Parolni albatta almashtiring.
- Admin foydalanuvchining parolini tiklaganda uning barcha sessiyalari yopiladi.

## Ma'lum cheklovlar

- `next.config.mjs` da `typescript.ignoreBuildErrors` va `eslint.ignoreDuringBuilds`
  yoqilgan — build muhitida tip tekshiruvi build'ni to'xtatmasligi uchun. Qat'iy tekshiruv
  kerak bo'lsa, ularni `false` qiling va `npx tsc --noEmit` ni ishlating.
- Sxema `prisma migrate` emas, `prisma db push` bilan qo'llanadi. Kelajakda ma'lumot
  yo'qolishi mumkin bo'lgan o'zgarish kerak bo'lsa, `npx prisma migrate dev` ga o'tish
  tavsiya etiladi.
- Sana hisob-kitoblari jarayonning `TZ` o'zgaruvchisiga tayanadi (Docker'da
  `Asia/Tashkent`). Boshqa mintaqada ishlatsangiz, `TZ` ni mos ravishda o'rnating.
# barter
