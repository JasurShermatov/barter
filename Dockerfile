# TXT Barter — Next.js + Prisma
FROM node:22-alpine

# Prisma uchun openssl, to'g'ri sana uchun tzdata
RUN apk add --no-cache openssl tzdata
ENV TZ=Asia/Tashkent
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# 1) Bog'liqliklar (postinstall `prisma generate` ni chaqiradi — shuning uchun schema oldin)
COPY package.json ./
COPY prisma ./prisma
RUN npm install --no-audit --no-fund

# 2) Kod va build
COPY . .
# Build paytida Prisma klienti yaratilishi uchun DATABASE_URL mavjud bo'lishi kerak.
# Bu soxta qiymat; ishga tushganda docker-compose/.env dagi haqiqiysi bilan almashtiriladi.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

RUN chmod +x ./docker-entrypoint.sh
CMD ["sh", "./docker-entrypoint.sh"]
