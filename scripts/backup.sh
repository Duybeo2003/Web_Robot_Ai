#!/usr/bin/env bash
set -Eeuo pipefail

: "${DB_ROOT_PASSWORD:?DB_ROOT_PASSWORD is required}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/roboeq}"
DB_NAME="${DB_NAME:-web_robot_ai}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
STAMP="$(date -u +'%Y%m%dT%H%M%SZ')"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${STAMP}.sql.gz"
TEMP_FILE="${BACKUP_FILE}.tmp"

mkdir -p "$BACKUP_DIR"
trap 'rm -f "$TEMP_FILE"' EXIT

docker compose exec -T \
  -e MYSQL_PWD="$DB_ROOT_PASSWORD" \
  mysql mysqldump \
  --user=root \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  "$DB_NAME" | gzip -9 > "$TEMP_FILE"

gzip -t "$TEMP_FILE"
mv "$TEMP_FILE" "$BACKUP_FILE"
find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.sql.gz" -mtime "+$RETENTION_DAYS" -delete

echo "Backup created: $BACKUP_FILE"
