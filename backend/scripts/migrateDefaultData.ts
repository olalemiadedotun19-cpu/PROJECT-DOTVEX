import { getDatabase } from '../database';

function migrateDefaultData(targetUid: string): void {
  if (!targetUid || targetUid === 'default') {
    console.error('[DOTVEX] Invalid target UID for migration.');
    process.exit(1);
  }

  const db = getDatabase();

  try {
    db.exec('BEGIN TRANSACTION');

    const convCount = db.prepare('SELECT COUNT(*) as cnt FROM conversations WHERE user_id = ?').get('default') as any;
    console.log(`[DOTVEX] Migrating ${convCount?.cnt || 0} conversations to UID: ${targetUid}`);

    db.prepare('UPDATE conversations SET user_id = ? WHERE user_id = ?').run(targetUid, 'default');

    const msgCount = db.prepare('SELECT COUNT(*) as cnt FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.user_id = ?').get(targetUid) as any;
    console.log(`[DOTVEX] Messages in migrated conversations: ${msgCount?.cnt || 0}`);

    const memCount = db.prepare('SELECT COUNT(*) as cnt FROM memories WHERE user_id = ?').get('default') as any;
    console.log(`[DOTVEX] Migrating ${memCount?.cnt || 0} memories to UID: ${targetUid}`);

    db.prepare('UPDATE memories SET user_id = ? WHERE user_id = ?').run(targetUid, 'default');

    const learningCount = db.prepare('SELECT COUNT(*) as cnt FROM learning_events WHERE user_id = ?').get('default') as any;
    console.log(`[DOTVEX] Migrating ${learningCount?.cnt || 0} learning events to UID: ${targetUid}`);

    db.prepare('UPDATE learning_events SET user_id = ? WHERE user_id = ?').run(targetUid, 'default');

    db.exec('COMMIT');
    console.log('[DOTVEX] Migration complete.');
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('[DOTVEX] Migration failed:', error);
    process.exit(1);
  }
}

const targetUid = process.argv[2];
if (!targetUid) {
  console.log('Usage: npx tsx backend/scripts/migrateDefaultData.ts <firebase-uid>');
  console.log('Example: npx tsx backend/scripts/migrateDefaultData.ts abc123xyz');
  process.exit(1);
}

migrateDefaultData(targetUid);
