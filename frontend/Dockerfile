# Stage 1: Build React Vite App
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve using lightweight Nginx
FROM nginx:alpine

# Copy built dist files to nginx serve directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for client-side routing & reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
