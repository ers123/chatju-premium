'use client'

import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import LegalDocument from '@/components/legal/LegalDocument'
import { useLanguage } from '@/app/lib/i18n/context'
import { getPrivacyContent } from '@/app/lib/legal/content'
import { apiClient } from '@/lib/api'

export default function PrivacyPolicyPage() {
  const { lang, t } = useLanguage()
  const content = getPrivacyContent(lang)
  const [deleting, setDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState<'success' | 'error' | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('chatju_token'))
  }, [])

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      lang === 'ko'
        ? '정말로 계정을 삭제하시겠습니까? 분석 리포트와 계정 정보가 삭제되며, 법령상 필요한 결제 기록은 최소한으로 보관될 수 있습니다.'
        : 'Are you sure you want to delete your account? Reports and account data will be deleted, while legally required payment records may be retained in minimized form.'
    )
    if (!confirmed) return

    try {
      setDeleting(true)
      await apiClient.deleteAccount()
      localStorage.removeItem('chatju_token')
      setDeleteResult('success')
    } catch {
      setDeleteResult('error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <LegalDocument content={content} backHome={t.legalNotice.backHome}>
        <div style={{ marginTop: '24px', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#FAFAFA' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '12px' }}>
            {lang === 'ko' ? '계정 및 리포트 삭제' : 'Delete Account and Reports'}
          </h2>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6B5E52', lineHeight: 1.7 }}>
            {lang === 'ko'
              ? '로그인한 사용자는 이 페이지에서 계정과 연결된 리포트를 삭제할 수 있습니다. 결제/거래 기록은 법령상 필요한 범위에서 최소한으로 보관될 수 있습니다.'
              : 'Signed-in users can delete their account and linked reports here. Payment and transaction records may be retained in minimized form where legally required.'}
          </p>

          {deleteResult === 'success' ? (
            <p style={{ color: '#059669', fontWeight: 500 }}>
              {lang === 'ko' ? '계정 삭제 요청이 처리되었습니다.' : 'Your account deletion request has been processed.'}
            </p>
          ) : deleteResult === 'error' ? (
            <p style={{ color: '#DC2626', fontSize: '14px' }}>
              {lang === 'ko'
                ? '삭제에 실패했습니다. support@somyung.cc로 문의해주세요.'
                : 'Deletion failed. Please contact support@somyung.cc.'}
            </p>
          ) : isLoggedIn ? (
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: '1px solid #DC2626',
                background: 'white',
                color: '#DC2626',
                fontSize: '14px',
                fontWeight: 500,
                cursor: deleting ? 'wait' : 'pointer',
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting
                ? (lang === 'ko' ? '삭제 중...' : 'Deleting...')
                : (lang === 'ko' ? '계정 삭제하기' : 'Delete My Account')}
            </button>
          ) : (
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
              {lang === 'ko'
                ? '로그인 후 이 페이지에서 계정을 삭제할 수 있습니다. 비회원 리포트 삭제는 support@somyung.cc로 요청해주세요.'
                : 'Sign in to delete your account here. For guest report deletion, email support@somyung.cc.'}
            </p>
          )}
        </div>
      </LegalDocument>
      <Footer />
    </>
  )
}
