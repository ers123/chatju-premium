#!/usr/bin/env node
// QA·검증으로 생긴 테스트 행을 지운다.
//
// 지우기 전에 대상을 화면에 나열하고 전체 컬럼을 JSON으로 백업한다. 백업 파일이
// 실제로 쓰이지 않았으면 삭제를 거부한다. 되돌릴 수 없는 작업이라서다.
//
// 기본은 DRY RUN이다. APPLY=1 일 때만 지운다.
//
//   npm run cleanup:test-rows              # 드라이런 — 무엇이 지워질지만 보여준다
//   APPLY=1 npm run cleanup:test-rows      # 실제 삭제
//
// 대상 판별은 delivery_email / user_email 접두사다. 실제 고객 이메일이 이 접두사로
// 시작할 일은 없다.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const fs = require('fs');
const { supabaseAdmin } = require('../src/config/supabase');

const APPLY = process.env.APPLY === '1';
const BACKUP_PATH = process.env.BACKUP_PATH
  || path.join(__dirname, '../../output/db-backups/test-rows-deleted.json');

const TEST_EMAIL = /^(qa-|qatest@|test@|e2e-|smoketest-|deploy-verify)/i;

(async () => {
  const { data: readings, error: e1 } = await supabaseAdmin
    .from('readings').select('*').order('created_at', { ascending: false });
  if (e1) throw new Error(`readings query: ${e1.message}`);

  const doomed = readings.filter((r) => TEST_EMAIL.test(r.delivery_email || ''));
  const ids = doomed.map((r) => r.id);

  const { data: usage, error: e2 } = await supabaseAdmin.from('promo_usage').select('*');
  if (e2) throw new Error(`promo_usage query: ${e2.message}`);
  const doomedUsage = usage.filter(
    (u) => TEST_EMAIL.test(u.user_email || '') || ids.includes(u.reading_id)
  );

  console.log(`readings: ${readings.length} total, ${doomed.length} test`);
  doomed.forEach((r) => console.log(`  - ${String(r.created_at).slice(0, 16)}  ${r.language}  ${r.delivery_email}`));
  console.log(`promo_usage: ${usage.length} total, ${doomedUsage.length} test`);
  doomedUsage.forEach((u) => console.log(`  - ${String(u.used_at).slice(0, 16)}  ${u.user_email}`));

  if (!doomed.length && !doomedUsage.length) {
    console.log('\n지울 것이 없습니다.');
    return;
  }

  fs.mkdirSync(path.dirname(BACKUP_PATH), { recursive: true });
  fs.writeFileSync(BACKUP_PATH, JSON.stringify({ readings: doomed, promo_usage: doomedUsage }, null, 2));
  console.log(`\n백업: ${BACKUP_PATH} (${fs.statSync(BACKUP_PATH).size} bytes)`);

  if (!APPLY) {
    console.log('DRY RUN — 아무것도 지우지 않았습니다. 실제로 지우려면 APPLY=1 을 붙이세요.');
    return;
  }
  if (!fs.existsSync(BACKUP_PATH)) throw new Error('백업이 기록되지 않아 삭제를 중단합니다');

  // promo_usage 먼저 — readings를 참조한다.
  if (doomedUsage.length) {
    const { error: d1 } = await supabaseAdmin
      .from('promo_usage').delete().in('id', doomedUsage.map((u) => u.id));
    if (d1) throw new Error(`promo_usage delete: ${d1.message}`);
  }
  if (ids.length) {
    const { error: d2 } = await supabaseAdmin.from('readings').delete().in('id', ids);
    if (d2) throw new Error(`readings delete: ${d2.message}`);
  }

  const { count: rc } = await supabaseAdmin.from('readings').select('*', { count: 'exact', head: true });
  const { count: uc } = await supabaseAdmin.from('promo_usage').select('*', { count: 'exact', head: true });
  console.log(`\n삭제 완료. readings ${rc}건, promo_usage ${uc}건 남음.`);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
