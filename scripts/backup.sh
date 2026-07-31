#!/bin/bash
# Backup script for Web Robot AI Database
# This script should be run via cron on the host machine.
# Example cron: 0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1

# Configuration
BACKUP_DIR="/var/backups/roboed"
DB_CONTAINER="roboed-db"
DB_NAME="web_robot_ai"
DB_USER="root"
DB_PASS="${DB_ROOT_PASSWORD:-root_password_123}"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${DATE}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Dump database from the docker container and compress
echo "[$(date)] Starting backup of $DB_NAME..."
docker exec "$DB_CONTAINER" /usr/bin/mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "[$(date)] Backup completed successfully: $BACKUP_FILE"
  
  # Remove backups older than 7 days
  find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql.gz" -type f -mtime +7 -delete
  echo "[$(date)] Cleaned up old backups."
else
  echo "[$(date)] Backup failed!"
  # Optional: Send alert email here or ping a Slack webhook
  exit 1
fi
