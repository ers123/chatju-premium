#!/usr/bin/env node
/**
 * Threads 반자동 파이프라인 v2 — 맥미니 전용 (THREADS_ACCESS_TOKEN 필요)
 *
 * 사람이 하는 일: 승인 파일에서 [ ] → [x] 로 바꾸는 것뿐.
 * 봇이 하는 일: 검색·초안 매칭·(승인된 것만) 발행.
 *
 * 1) node search-and-draft.mjs search
 *    → Threads keyword search API로 후보 글 수집 → drafts-YYYY-MM-DD.md 생성
 *      (글 요약 + comment-bank에서 매칭한 초안 + 체크박스)
 * 2) 사람: drafts 파일 열어 개인화·승인([x]) — 하루 3~5개만
 * 3) node search-and-draft.mjs publish drafts-YYYY-MM-DD.md
 *    → [x]만 발행. 발행 간격 3~7분 랜덤(버스트 방지). 로그 남김.
 *
 * 안전장치:
 * - 하루 발행 상한 5개 (DAILY_CAP). 초과분은 무시하고 경고.
 * - reply_to_id 없는 항목은 발행 불가(원본 게시 금지 단계).
 * - 링크 포함 초안은 발행 거부.
 */
import fs from 'node:fs';

const TOKEN = process.env.THREADS_ACCESS_TOKEN;
const API = 'https://graph.threads.net/v1.0';
const DAILY_CAP = 5;
const KEYWORDS = ['아이 고집', '훈육', '등원 거부', '숙제', '아이 게임', '아이 기질', '육아 번아웃', '예민한 아이'];

async function tapi(path, params = {}, method = 'GET') {
  const url = new URL(`${API}${path}`);
  url.searchParams.set('access_token', TOKEN);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { method });
  const body = await res.json();
  if (!res.ok) throw new Error(`${path}: ${JSON.stringify(body.error || body)}`);
  return body;
}

async function search() {
  const today = new Date().toISOString().slice(0, 10);
  const rows = [];
  for (const q of KEYWORDS.slice(0, 4)) { // 쿼터 절약: 하루 4키워드
    try {
      const r = await tapi('/keyword_search', { q, search_type: 'TOP', fields: 'id,text,username,permalink,timestamp' });
      for (const p of (r.data || []).slice(0, 5)) {
        if (!p.text || p.text.length < 40) continue;          // 저정보 글 제외
        if (/의사|병원|진단|ADHD|자폐/.test(p.text)) continue; // 의료 영역 제외
        rows.push({ keyword: q, ...p });
      }
    } catch (e) { console.error(`search "${q}" failed:`, e.message); }
  }
  const out = [`# Threads 초안 승인 파일 — ${today}`, '',
    '개인화 후 `[ ]`를 `[x]`로 바꾸면 발행 대상. 하루 5개까지만.', ''];
  for (const r of rows) {
    out.push(`## [ ] ${r.username} (${r.keyword})`);
    out.push(`> ${r.text.replace(/\n/g, ' ').slice(0, 200)}`);
    out.push(`- permalink: ${r.permalink}`);
    out.push(`- reply_to_id: ${r.id}`);
    out.push(`- draft: (comment-bank에서 골라 개인화해 여기 붙여넣기)`);
    out.push('');
  }
  const file = `drafts-${today}.md`;
  fs.writeFileSync(new URL(file, import.meta.url), out.join('\n'));
  console.log(`${rows.length} candidates → ${file}`);
}

async function publish(file) {
  const src = fs.readFileSync(file, 'utf8');
  const blocks = src.split(/^## /m).slice(1).filter((b) => b.startsWith('[x]'));
  if (!blocks.length) return console.log('승인([x])된 항목 없음');
  let published = 0;
  for (const b of blocks) {
    if (published >= DAILY_CAP) { console.warn('DAILY_CAP 도달 — 나머지 무시'); break; }
    const replyTo = b.match(/reply_to_id: (\d+)/)?.[1];
    const draft = b.match(/- draft: ([\s\S]*?)(?=\n##|\n*$)/)?.[1]?.trim();
    if (!replyTo || !draft || draft.startsWith('(')) { console.warn('skip: 초안/대상 누락'); continue; }
    if (/https?:\/\//.test(draft)) { console.warn('skip: 링크 포함 초안은 발행 금지'); continue; }
    const c = await tapi('/me/threads', { media_type: 'TEXT', text: draft, reply_to_id: replyTo }, 'POST');
    await tapi('/me/threads_publish', { creation_id: c.id }, 'POST');
    published += 1;
    console.log(`published reply → ${replyTo}`);
    const wait = (3 + Math.random() * 4) * 60_000; // 3~7분
    await new Promise((r) => setTimeout(r, wait));
  }
  console.log(`done: ${published} published`);
}

const [, , cmd, arg] = process.argv;
if (!TOKEN) { console.error('THREADS_ACCESS_TOKEN 없음 — 맥미니에서 실행하세요'); process.exit(1); }
if (cmd === 'search') search();
else if (cmd === 'publish' && arg) publish(arg);
else console.log('usage: node search-and-draft.mjs search | publish <drafts-file.md>');
