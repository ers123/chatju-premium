'use client'

import Link from 'next/link'
import Footer from '@/components/Footer'
import { useLanguage } from '@/app/lib/i18n/context'

export default function TermsPage() {
  const { lang, t } = useLanguage()
  const ln = t.legalNotice

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FEFDFB',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(250, 250, 248, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
        padding: '20px 40px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#2C2420' }}>☯ SoMyung</span>
          </Link>
          <Link href="/" style={{ fontSize: '14px', color: '#666666', textDecoration: 'none' }}>
            {ln.backHome}
          </Link>
        </div>
      </header>

      {/* Language Notice */}
      {lang !== 'ko' && ln.noticeBar && (
        <div style={{
          maxWidth: '800px', margin: '0 auto', padding: '16px 40px 0'
        }}>
          <div style={{
            background: '#FFF8E1',
            border: '1px solid #B8922D33',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            color: '#6B5E52',
            lineHeight: 1.6
          }}>
            {ln.noticeBar}
          </div>
        </div>
      )}

      {/* Content */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#2C2420', marginBottom: '16px' }}>
          이용약관
        </h1>
        <p style={{ fontSize: '14px', color: '#888888', marginBottom: '48px' }}>
          시행일: 2025년 1월 1일 | 최종 수정: 2025년 1월 27일
        </p>

        <div style={{ fontSize: '16px', color: '#333333', lineHeight: 1.8 }}>
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              제1조 (목적)
            </h2>
            <p>
              본 약관은 하모니온(이하 "회사")이 제공하는 소명 서비스(이하 "서비스")의 이용과 관련하여
              회사와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              제2조 (서비스의 정의)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              "서비스"란 회사가 제공하는 사주 명리학 기반 기질 분석 서비스를 의미하며, 다음을 포함합니다:
            </p>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>무료 기질 분석 서비스</li>
              <li style={{ marginBottom: '8px' }}>유료 상세 분석 서비스</li>
              <li style={{ marginBottom: '8px' }}>부모-자녀 궁합 분석 서비스</li>
              <li style={{ marginBottom: '8px' }}>AI 기반 해석 및 조언 서비스</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px', background: '#FFF9E6', padding: '24px', borderRadius: '12px', border: '1px solid #F0E68C' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              제3조 (서비스의 성격 및 면책)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              <strong>본 서비스는 동양 철학(명리학)에 기반한 기질 분석 참고 자료를 제공합니다.</strong>
            </p>
            <ol style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '12px' }}>
                서비스 결과물은 <strong>의사결정의 참고 자료</strong>로만 활용하시기 바랍니다.
              </li>
              <li style={{ marginBottom: '12px' }}>
                분석 결과는 <strong>가능성과 경향성</strong>을 제시하며, 확정적 예측이 아닙니다.
              </li>
              <li style={{ marginBottom: '12px' }}>
                본 서비스는 의료, 법률, 재정 등 전문적 조언을 제공하지 않습니다.
              </li>
              <li style={{ marginBottom: '12px' }}>
                중요한 결정은 반드시 해당 분야의 전문가와 상담하시기 바랍니다.
              </li>
              <li style={{ marginBottom: '12px' }}>
                회사는 서비스 결과물의 활용으로 발생하는 결과에 대해 책임지지 않습니다.
              </li>
            </ol>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              제4조 (이용자격)
            </h2>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>본 서비스는 만 14세 이상 이용 가능합니다.</li>
              <li style={{ marginBottom: '8px' }}>만 14세 미만 아동의 정보는 법정대리인(부모)만 입력할 수 있습니다.</li>
              <li style={{ marginBottom: '8px' }}>이용자는 정확한 정보를 입력해야 합니다.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              제5조 (서비스 제공 방식)
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ background: '#F5F5F3' }}>
                  <th style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left' }}>서비스 유형</th>
                  <th style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left' }}>제공 방식</th>
                  <th style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left' }}>제공 시점</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>무료 분석</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>웹 화면 즉시 표시</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>입력 완료 즉시</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>유료 분석</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>웹 화면 + PDF 다운로드</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>결제 완료 후 즉시</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              제6조 (결제 및 환불)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              유료 서비스의 결제 및 환불에 관한 상세 사항은 <Link href="/refund" style={{ color: '#1A3D2E' }}>환불정책</Link>을 참조하시기 바랍니다.
            </p>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>결제 수단: PayPal</li>
              <li style={{ marginBottom: '8px' }}>결제 통화: 원화(KRW) 또는 미국 달러(USD)</li>
              <li style={{ marginBottom: '8px' }}>영수증: 결제 완료 후 이메일로 발송</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              제7조 (지적재산권)
            </h2>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>서비스 및 콘텐츠의 저작권은 회사에 귀속됩니다.</li>
              <li style={{ marginBottom: '8px' }}>이용자는 개인적 용도로만 결과물을 사용할 수 있습니다.</li>
              <li style={{ marginBottom: '8px' }}>무단 복제, 배포, 상업적 이용은 금지됩니다.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              제8조 (서비스 중단)
            </h2>
            <p>
              회사는 다음의 경우 서비스 제공을 일시적으로 중단할 수 있습니다:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
              <li style={{ marginBottom: '8px' }}>시스템 점검, 보수, 교체</li>
              <li style={{ marginBottom: '8px' }}>천재지변, 비상사태</li>
              <li style={{ marginBottom: '8px' }}>기술적 장애</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              제9조 (분쟁 해결)
            </h2>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>본 약관은 대한민국 법률에 따라 해석됩니다.</li>
              <li style={{ marginBottom: '8px' }}>서비스 관련 분쟁의 관할법원은 서울중앙지방법원으로 합니다.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              제10조 (약관 변경)
            </h2>
            <p>
              회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.
              약관 변경 시 적용일자 및 변경사유를 명시하여 현행 약관과 함께 서비스 내에 공지합니다.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
