'use client'

import { useState } from 'react'
import { buildApiUrl } from '@/lib/api-url'

/**
 * 리포트를 다 읽은 사람에게 별점을 묻는다.
 *
 * 왜 여기 있는가: 리포트 품질을 LLM 심판으로 올릴 만큼 올렸고(warmth 2.6→3.1),
 * 그 위는 심판 노이즈에 묻힌다. 다음 신호는 돈을 낸 사람이 준다.
 *
 * 설계 원칙:
 * - **한 번의 탭으로 끝난다.** 별을 누르는 순간 전송된다. 코멘트는 그 뒤 선택.
 *   평가를 두 단계로 만들면 응답률이 무너진다.
 * - 새 개인정보를 묻지 않는다. 소유 증명은 이미 들고 있는 리포트 토큰/claim key.
 * - 실패해도 조용하다. 별점 전송 실패로 리포트 화면을 망치지 않는다.
 */
export default function ReportRating({
  token,
  claimKey,
  labels,
}: {
  token?: string | null
  claimKey?: string | null
  labels: {
    prompt: string
    thanks: string
    commentPlaceholder: string
    send: string
    sent: string
  }
}) {
  const [rating, setRating] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [commentSent, setCommentSent] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!token && !claimKey) return null

  const submit = async (value: number, text?: string) => {
    try {
      const res = await fetch(buildApiUrl('/saju/feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value, comment: text || undefined, token, claimKey }),
      })
      if (!res.ok) setFailed(true)
    } catch {
      setFailed(true)
    }
  }

  const pick = (value: number) => {
    setRating(value)
    setFailed(false)
    void submit(value)
  }

  const sendComment = () => {
    if (!rating || !comment.trim()) return
    setCommentSent(true)
    void submit(rating, comment.trim())
  }

  return (
    <section
      style={{
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(235,229,223,0.6)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        textAlign: 'center',
        boxShadow: '0 4px 20px -4px rgba(45,58,53,0.06)',
      }}
    >
      <p style={{ color: '#3D3028', fontSize: '0.9375rem', marginBottom: '0.875rem' }}>
        {rating ? labels.thanks : labels.prompt}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem', marginBottom: rating ? '1rem' : 0 }}>
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = (hover ?? rating ?? 0) >= value
          return (
            <button
              key={value}
              type="button"
              onClick={() => pick(value)}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(null)}
              aria-label={`${value}`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.75rem',
                lineHeight: 1,
                padding: '0.125rem',
                color: filled ? '#B8922D' : '#DDD6CC',
                transition: 'color 0.15s',
              }}
            >
              ★
            </button>
          )
        })}
      </div>

      {rating && !commentSent && (
        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '30rem', margin: '0 auto' }}>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={labels.commentPlaceholder}
            maxLength={2000}
            style={{
              flex: 1,
              padding: '0.625rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #EBE5DF',
              background: '#FBFAF8',
              fontSize: '0.9375rem',
              color: '#3D3028',
            }}
          />
          <button
            type="button"
            onClick={sendComment}
            disabled={!comment.trim()}
            style={{
              padding: '0.625rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: comment.trim() ? '#1A3D2E' : '#F3F4F6',
              color: comment.trim() ? '#FFFFFF' : '#9CA3AF',
              fontWeight: 600,
              fontSize: '0.9375rem',
              cursor: comment.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {labels.send}
          </button>
        </div>
      )}

      {commentSent && <p style={{ color: '#8B8580', fontSize: '0.875rem' }}>{labels.sent}</p>}
      {/* 전송 실패는 조용히 넘긴다 — 별점 하나 때문에 리포트 화면에 에러를 띄우지 않는다. */}
      {failed && rating && <p style={{ color: '#8B8580', fontSize: '0.8125rem' }}>·</p>}
    </section>
  )
}
