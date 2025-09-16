# Stage 1: Build
FROM node:23.11.0-alpine AS build-stage

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install

COPY prisma ./prisma/
COPY src ./src/
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:23.11.0-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build-stage /app/prisma ./prisma
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build-stage /app/node_modules/.prisma ./node_modules/.prisma

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh
EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]