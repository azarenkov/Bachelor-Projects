FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy static frontend files
COPY app/public /usr/share/nginx/html

EXPOSE 80
