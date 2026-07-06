# Static site image for couch-games.com — unprivileged nginx, no build step.
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Server block: listens on 8080 (non-root), security headers, /health, no SPA fallback.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Site content. .dockerignore keeps git/editor/docker meta out of the image.
COPY . /usr/share/nginx/html/

# nginx.conf must be in the build context for the COPY above, but must not be
# served as static content — strip it from the web root (needs root; the base
# image runs as the unprivileged nginx user).
USER root
RUN rm -f /usr/share/nginx/html/nginx.conf
# Numeric UID (not the name "nginx") so Kubernetes' runAsNonRoot can verify
# the container is non-root without resolving /etc/passwd.
USER 101

EXPOSE 8080
