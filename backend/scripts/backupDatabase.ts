#!/usr/bin/env node
/**
 * Automated SQLite backup for DOTVEX.
 *
 * Usage:
 *   tsx backend/scripts/backupDatabase.ts          # backup to data/backups/
 *   tsx backend/scripts/backupDatabase.ts --cron   # run via cron/systemd timer
 *
 * Cron example (run daily at 2 AM):
 *   0 2 * * * /usr/bin/node /app/dotvex/backend/scripts/backupDatabase.ts
 *
 * Or with systemd timer:
 *   [Timer]
 *   OnCalendar=daily
 *   Persistent=true
 */

import fs from 'fs';
import path from 'path';
import { config } from '../config';

function backup(): void {
  const sourcePath = config.dbPath;
  const sourceDir = path.dirname(sourcePath);
  const backupDir = path.join(sourceDir, 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  if (!fs.existsSync(sourcePath)) {
    console.error('[DOTVEX Backup] Database file not found:', sourcePath);
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `dotvex-${timestamp}.db`);

  const tmpFile = backupFile + '.tmp';
  fs.copyFileSync(sourcePath, tmpFile);

  const stats = fs.statSync(tmpFile);
  if (stats.size === 0) {
    console.error('[DOTVEX Backup] Source database is empty, skipping backup');
    fs.unlinkSync(tmpFile);
    process.exit(1);
  }

  fs.renameSync(tmpFile, backupFile);

  console.log(`[DOTVEX Backup] Created: ${backupFile} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);

  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('dotvex-') && f.endsWith('.db'))
    .sort()
    .reverse();

  const retention = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);
  const cutoff = Date.now() - retention * 24 * 60 * 60 * 1000;

  for (const file of files) {
    const fullPath = path.join(backupDir, file);
    const mtime = fs.statSync(fullPath).mtimeMs;

    if (mtime < cutoff) {
      fs.unlinkSync(fullPath);
      console.log(`[DOTVEX Backup] Deleted old backup: ${file}`);
    }
  }

  const remaining = fs.readdirSync(backupDir).filter(f => f.startsWith('dotvex-') && f.endsWith('.db'));
  console.log(`[DOTVEX Backup] ${remaining.length} backup(s) retained (retention: ${retention} days)`);
}

backup();
