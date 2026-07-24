cat << 'EOF' > /etc/nginx/sites-available/web_robot_ai
server {
    listen 80;
    server_name roboeq.com.vn www.roboeq.com.vn;

    # Cấu hình HTTPS do Certbot tự sinh ra ở dưới, phần này giữ nguyên
}

server {
    server_name roboeq.com.vn www.roboeq.com.vn;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        
        # 3 dòng siêu quan trọng để Google Login hoạt động:
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/roboeq.com.vn/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/roboeq.com.vn/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.roboeq.com.vn) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = roboeq.com.vn) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name roboeq.com.vn www.roboeq.com.vn;
    return 404; # managed by Certbot
}
EOF

systemctl reload nginx
echo "✅ Đã sửa và nạp lại cấu hình NGINX thành công!"
