FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_BACKEND_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmjs.org/ && \
    npm ci --include=dev --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
COPY public/runtime-config.js /usr/share/nginx/html/runtime-config.js
COPY runtime-env.sh /docker-entrypoint.d/30-runtime-env.sh
RUN chmod +x /docker-entrypoint.d/30-runtime-env.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
