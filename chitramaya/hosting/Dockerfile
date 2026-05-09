FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY proxy.js ./
COPY public ./public

ENV PORT=7860
EXPOSE 7860
CMD ["node", "proxy.js"]
