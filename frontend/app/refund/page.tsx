'use client'

import Link from 'next/link'
import Footer from '@/components/Footer'
import { useLanguage } from '@/app/lib/i18n/context'

export default function RefundPolicyPage() {
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
          환불정책
        </h1>
        <p style={{ fontSize: '14px', color: '#888888', marginBottom: '48px' }}>
          시행일: 2025년 1월 1일 | 최종 수정: 2025년 1월 27일
        </p>

        <div style={{ fontSize: '16px', color: '#333333', lineHeight: 1.8 }}>
          {/* Summary Box */}
          <section style={{
            marginBottom: '48px',
            background: '#E8F5E9',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #A5D6A7'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1A3D2E', marginBottom: '16px' }}>
              환불 요약
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid #C8E6C9', fontWeight: 600 }}>
                    결과 생성 전
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #C8E6C9', color: '#1A3D2E', fontWeight: 700 }}>
                    100% 환불 가능
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid #C8E6C9', fontWeight: 600 }}>
                    결과 생성 후 7일 이내
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #C8E6C9' }}>
                    서비스 오류 시에만 환불
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', fontWeight: 600 }}>
                    결과 생성 후 7일 이후
                  </td>
                  <td style={{ padding: '12px' }}>
                    환불 불가
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              1. 환불 가능 조건
            </h2>
            <p style={{ marginBottom: '16px' }}>다음의 경우 전액 환불을 받으실 수 있습니다:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '12px' }}>
                <strong>결과 생성 전 취소</strong>: 결제 후 분석 결과가 생성되기 전에 취소 요청하신 경우
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>중복 결제</strong>: 동일 상품에 대해 2회 이상 결제된 경우
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>서비스 오류</strong>: 시스템 오류로 결과가 제공되지 않거나 불완전한 경우
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>결과 미제공</strong>: 결제 후 24시간 이내 결과가 제공되지 않은 경우
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px', background: '#FFF3E0', padding: '24px', borderRadius: '12px', border: '1px solid #FFCC80' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#E65100', marginBottom: '16px' }}>
              2. 환불 제한 사유 (청약철회 제한)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              다음의 경우 전자상거래법 제17조에 따라 환불이 제한됩니다:
            </p>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '12px' }}>
                <strong>디지털 콘텐츠 제공 개시 후</strong>: 분석 결과가 생성되어 화면에 표시되거나 PDF로 제공된 이후
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>용역 제공 완료</strong>: AI 분석이 완료되어 결과가 전달된 경우
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>단순 변심</strong>: 결과 내용이 기대와 다르다는 이유
              </li>
            </ul>
            <p style={{ fontSize: '14px', color: '#666666', marginTop: '16px' }}>
              ※ 결제 시 "결과 생성 시작 시 청약철회가 제한될 수 있습니다"에 대한 동의를 받습니다.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              3. 환불 절차
            </h2>
            <ol style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '16px' }}>
                <strong>환불 요청</strong><br />
                이메일(support@harmonyon.kr)로 다음 정보와 함께 요청:
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  <li>주문번호 또는 결제일시</li>
                  <li>결제 수단</li>
                  <li>환불 사유</li>
                </ul>
              </li>
              <li style={{ marginBottom: '16px' }}>
                <strong>검토 및 승인</strong><br />
                요청일로부터 영업일 기준 3일 이내 검토 후 결과 안내
              </li>
              <li style={{ marginBottom: '16px' }}>
                <strong>환불 처리</strong><br />
                승인일로부터 영업일 기준 7일 이내 환불 완료
              </li>
            </ol>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              4. 환불 방법
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F5F5F3' }}>
                  <th style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left' }}>결제 수단</th>
                  <th style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left' }}>환불 방법</th>
                  <th style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left' }}>소요 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>신용카드</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>결제 취소 (카드사 처리)</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>3~7일</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>계좌이체</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>동일 계좌로 환불</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>3~5일</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>PayPal</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>PayPal 계정으로 환불</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>5~10일</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              5. 취소 버튼 안내
            </h2>
            <p>
              결제 완료 후 결과 생성 대기 화면에서 <strong>"분석 취소"</strong> 버튼을 클릭하시면
              결과 생성 전까지 즉시 취소 및 환불이 가능합니다.
            </p>
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: '#F5F5F3',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <span style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#FFFFFF',
                border: '2px solid #E5E5E5',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#666666'
              }}>
                분석 취소 (결과 생성 전에만 가능)
              </span>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              6. 문의처
            </h2>
            <div style={{ background: '#F5F5F3', padding: '20px', borderRadius: '8px' }}>
              <p style={{ marginBottom: '8px' }}><strong>이메일</strong>: support@harmonyon.kr</p>
              <p style={{ marginBottom: '8px' }}><strong>운영시간</strong>: 평일 10:00 - 18:00 (주말/공휴일 휴무)</p>
              <p><strong>응답 시간</strong>: 영업일 기준 24시간 이내</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
