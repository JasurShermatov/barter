# Serverga joylash — qadam-baqadam

Serverda allaqachon boshqa loyihalar ishlayotgani hisobga olingan:
**hech qanday port bandlik to'qnashuvi bo'lmaydi.**

- Postgres umuman tashqariga chiqarilmaydi (faqat ichki Docker tarmog'i).
- Ilova `127.0.0.1:3210` ga bog'lanadi — internetdan to'g'ridan-to'g'ri ochilmaydi.
- Nginx `8080` portida turadi va ilovaga proksi qiladi. 80/443 portlarga tegilmaydi,
  ya'ni boshqa loyihalaringiz o'z holicha ishlayveradi.

Ikkala raqamni ham o'zgartirsangiz bo'ladi (pastda ko'rsatilgan).

---

## 0. Band portlarni tekshirish

Serverda:

```bash
sudo ss -tlnp | sort -k4
```

`3210` va `8080` ro'yxatda bo'lmasa — shundayligicha davom eting.
Band bo'lsa, ikkita joyda o'zgartiring:

| Nima | Qayerda |
|---|---|
| Ilova porti | `.env` → `APP_PORT=3210` **va** `deploy/nginx/barter.conf` → `upstream` ichidagi `127.0.0.1:3210` |
| Sayt porti | `deploy/nginx/barter.conf` → `listen 8080;` (ikkita qator) |

---

## 1. Fayllarni serverga ko'chirish

Kompyuteringizdan (loyiha papkasi ichidan):

```bash
rsync -avz --delete \
  --exclude 'node_modules' --exclude '.next' --exclude '.env' \
  --exclude 'backups' --exclude '.git' \
  ./ root@SERVER_IP:/opt/barter/
```

`SERVER_IP` ni o'zingiznikiga almashtiring. `/opt/barter` — server papkasi, xohlagan
joyni tanlashingiz mumkin.

> `node_modules` va `.next` ataylab yuborilmaydi — ular serverda build paytida
> qaytadan yaratiladi. `package-lock.json` esa yuboriladi, shuning uchun serverda
> aynan sizdagi versiyalar o'rnatiladi.

---

## 2. Serverda sozlash

```bash
ssh root@SERVER_IP
cd /opt/barter

cp deploy/env-namuna.txt .env
nano .env
```

`.env` da to'ldirilishi shart:

```ini
POSTGRES_PASSWORD=<openssl rand -base64 24 natijasi>
APP_PORT=3210
SECURE_COOKIES=false          # HTTP da MAJBURIY false
ALLOWED_ORIGINS=SERVER_IP:8080
```

`ALLOWED_ORIGINS` ni to'ldirishni unutmang — aks holda formalarni saqlashda
«Invalid Server Actions request» xatosi chiqishi mumkin.

Parol yaratish:

```bash
openssl rand -base64 24
```

---

## 3. Ishga tushirish

```bash
cd /opt/barter
docker compose -f docker-compose.prod.yml up -d --build
```

Birinchi build 5–10 daqiqa oladi. Kuzatish:

```bash
docker compose -f docker-compose.prod.yml logs -f web
```

`Server ishga tushmoqda…` chiqsa — tayyor. Tekshirish:

```bash
curl http://127.0.0.1:3210/api/health
# {"ok":true,"db":"up", ...}
```

---

## 4. Nginx

```bash
sudo cp deploy/nginx/barter.conf /etc/nginx/sites-available/barter.conf
sudo ln -s /etc/nginx/sites-available/barter.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` **OK** desa — brauzerda oching:

```
http://SERVER_IP:8080
```

Kirish: `admin` / `admin` → darhol «Mening kabinetim» dan parolni almashtiring.

Firewall yoqilgan bo'lsa portni oching:

```bash
sudo ufw allow 8080/tcp
```

---

## 5. Kundalik buyruqlar

```bash
cd /opt/barter
COMPOSE="docker compose -f docker-compose.prod.yml"

$COMPOSE ps                    # holati
$COMPOSE logs -f web           # loglar
$COMPOSE restart web           # qayta ishga tushirish
$COMPOSE down                  # to'xtatish (ma'lumotlar saqlanadi)
$COMPOSE up -d                 # qayta yoqish
```

**Kodni yangilash** (rsync bilan yangi fayllarni yuborgandan keyin):

```bash
$COMPOSE up -d --build
```

Baza saqlanib qoladi — `barter_pgdata` volume'ida.

---

## 6. Zaxira nusxa

```bash
chmod +x deploy/backup.sh
./deploy/backup.sh
```

Har kuni avtomatik:

```bash
crontab -e
# quyidagi qatorni qo'shing:
0 3 * * * cd /opt/barter && ./deploy/backup.sh >> /var/log/barter-backup.log 2>&1
```

Tiklash:

```bash
gunzip -c backups/barter_20260922_0300.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db psql -U barter -d barter
```

---

## 7. Keyinchalik domen va HTTPS ulash

1. Domenning A-yozuvini server IP siga yo'naltiring.
2. `deploy/nginx/barter.conf` ni oching — fayl oxiridagi izohga olingan blokni
   yoqing, yuqoridagi `listen 8080` blokini o'chiring, `server_name` ga domenni yozing.
3. ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d barter.sizning-domen.uz
   ```
4. `.env` da ikkita qatorni o'zgartiring va konteynerni qayta yoqing:
   ```ini
   SECURE_COOKIES=true
   ALLOWED_ORIGINS=barter.sizning-domen.uz
   ```
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

---

## Muammolar

| Belgi | Sabab va yechim |
|---|---|
| `502 Bad Gateway` | Ilova ko'tarilmagan. `$COMPOSE logs web` ni qarang. `APP_PORT` va nginx `upstream` bir xilmi? |
| Login qabul qilinmaydi, sahifa qaytadan kirish so'raydi | `.env` da `SECURE_COOKIES=true` turibdi, lekin HTTPS yo'q. `false` qiling va `$COMPOSE up -d`. |
| «Invalid Server Actions request» | `.env` da `ALLOWED_ORIGINS=SERVER_IP:8080` ni to'ldiring, `$COMPOSE up -d`. |
| Excel import «413» xatosi | nginx `client_max_body_size` — konfigda 30m qo'yilgan, o'zgartirgan bo'lsangiz tekshiring. |
| `port is already allocated` | `APP_PORT` band. `.env` da boshqa raqam qo'ying va nginx konfigini ham yangilang. |
| Bot ishlamayapti | `.env` da `ENABLE_BOT=true` mi? Saytdagi «Bot sozlamalari» da token va Chat ID kiritilganmi? `$COMPOSE logs web \| grep bot` |
