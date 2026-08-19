# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM node:22-alpine AS backend-dependencies

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci
RUN DATABASE_URL="postgresql://docker:docker@localhost:5432/docker" npx --no-install prisma generate


FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=backend-dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY backend ./backend
COPY docker-entrypoint.sh ./
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

USER node

ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
