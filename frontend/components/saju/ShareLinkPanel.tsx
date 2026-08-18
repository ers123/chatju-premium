'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api'

/**
 * 공유 링크 패널.
 *
 * 왜 있는가: 지금까지 공유는 **이미지 한 장**이었다. 받은 사람이 눌러 들어올 링크가
 * 없으니 루프가 닫히지 않았다. Threads 팔로워 0인 상태에서 이 루프가 팔로워를
 * 필요로 하지 않는 유일한 배포 경로다.
 *
 * 개인정보 설계(docs/DPIA_2026-08-13.md):
 *   - 링크가 보여주는 것은 오행 결과뿐이다. **아이 이름·생년월일은 서버가 아예
 *     내보내지 않는다** — 이 컴포넌트가 실수할 여지가 없다.
 *   - 옵트인: 버튼을 누르기 전에는 링크가 존재하지 않는다.
 *   - 철회 가능: 끄면 그 URL은 즉시 홈으로 튕긴다.
 */
type ShareCopy = {
  shareLinkTitle?: string; shareLinkDesc?: string; shareLinkCreate?: string
  shareLinkCopy?: string; shareLinkCopied?: string; shareLinkRevoke?: string
  shareLinkNeedsReport?: string; shareLinkFailed?: string
}

export default function ShareLinkPanel({ copy }: { copy: ShareCopy }) {
  const [link, setLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  // 결과 화면이 이미 들고 있는 소유 증명을 그대로 쓴다. 새 로그인을 만들지 않는다.
  const proof = (): { token?: string; claimKey?: string } | null => {
    try {
      const completed = JSON.parse(sessionStorage.getItem('completed_payment') || '{}')
      if (completed.claimKey) return { claimKey: completed.claimKey }
      const reportToken = sessionStorage.getItem('report_access_token')
      if (reportToken) return { token: reportToken }
    } catch { /* sessionStorage 접근 불가 — 아래에서 안내 */ }
    return null
  }

  const create = async () => {
    const p = proof()
    if (!p) { setError(copy.shareLinkNeedsReport || '리포트를 먼저 받아주세요.'); return }
    setBusy(true); setError('')
    try {
      const { shareToken } = await apiClient.createShareLink(p)
      setLink(`https://somyung.cc/saju/share/${shareToken}/`)
    } catch {
      setError(copy.shareLinkFailed || '링크를 만들지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally { setBusy(false) }
  }

  const copyLink = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch { /* 클립보드 거부 — 링크는 화면에 보이므로 직접 복사 가능 */ }
  }

  const revoke = async () => {
    const p = proof()
    if (!p) return
    setBusy(true)
    try { await apiClient.revokeShareLink(p); setLink(null) } catch { /* 무시 */ }
    finally { setBusy(false) }
  }

  return (
    <div style={{
      background: 'rgba(90, 122, 102, 0.05)',
      border: '1px solid rgba(90, 122, 102, 0.18)',
      borderRadius: '12px',
      padding: '1.25rem',
      marginTop: '1rem',
    }}>
      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2C2420', margin: '0 0 0.35rem' }}>
        {copy.shareLinkTitle || '링크로 공유하기'}
      </p>
      <p style={{ fontSize: '0.8rem', color: '#6B6560', lineHeight: 1.6, margin: '0 0 0.9rem' }}>
        {copy.shareLinkDesc || '아이 이름과 생년월일은 링크에 포함되지 않습니다. 오행 결과만 보여집니다.'}
      </p>

      {!link ? (
        <button
          type="button" onClick={create} disabled={busy}
          style={{
            width: '100%', padding: '0.75rem', borderRadius: '10px', border: 'none',
            background: '#1A3D2E', color: '#fff', fontWeight: 600, fontSize: '0.9rem',
            cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? '...' : (copy.shareLinkCreate || '공유 링크 만들기')}
        </button>
      ) : (
        <>
          <div style={{
            display: 'flex', gap: '0.5rem', alignItems: 'center',
            background: '#fff', border: '1px solid rgba(44,36,32,0.12)',
            borderRadius: '8px', padding: '0.6rem 0.75rem', marginBottom: '0.6rem',
          }}>
            <span style={{
              flex: 1, fontSize: '0.78rem', color: '#4A443F',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{link}</span>
            <button
              type="button" onClick={copyLink}
              style={{
                padding: '0.35rem 0.7rem', borderRadius: '6px', border: '1px solid #1A3D2E',
                background: copied ? '#1A3D2E' : 'transparent', color: copied ? '#fff' : '#1A3D2E',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >{copied ? (copy.shareLinkCopied || '복사됨') : (copy.shareLinkCopy || '복사')}</button>
          </div>
          <button
            type="button" onClick={revoke} disabled={busy}
            style={{
              background: 'none', border: 'none', color: '#9B948E',
              fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', padding: 0,
            }}
          >{copy.shareLinkRevoke || '링크 끄기'}</button>
        </>
      )}

      {error && <p style={{ fontSize: '0.78rem', color: '#A85544', margin: '0.6rem 0 0' }}>{error}</p>}
    </div>
  )
}
