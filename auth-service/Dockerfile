FROM node:18-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY --from=deps /app/package*.json ./

COPY src/ ./src/

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

CMD ["node", "src/index.js"]
