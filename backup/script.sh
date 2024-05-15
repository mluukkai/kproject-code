#!/usr/bin/env bash
set -e

echo "DB_URL: $DB_URL"

if [ $DB_URL ]
then
  pg_dump -v $DB_URL > /usr/src/app/backup.sql

  node index.js
fi