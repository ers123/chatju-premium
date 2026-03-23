'use client'

import Link from 'next/link'
import Footer from '@/components/Footer'
import { useLanguage } from '@/app/lib/i18n/context'

export default function PrivacyPolicyPage() {
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
          개인정보처리방침
        </h1>
        <p style={{ fontSize: '14px', color: '#888888', marginBottom: '48px' }}>
          시행일: 2025년 1월 1일 | 최종 수정: 2025년 1월 27일
        </p>

        <div style={{ fontSize: '16px', color: '#333333', lineHeight: 1.8 }}>
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              1. 개인정보의 수집 항목 및 수집 방법
            </h2>
            <p style={{ marginBottom: '16px' }}>
              하모니온(이하 "회사")은 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ background: '#F5F5F3' }}>
                  <th style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left' }}>수집 항목</th>
                  <th style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left' }}>수집 목적</th>
                  <th style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left' }}>보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>생년월일, 출생시간, 성별</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>사주 기질 분석</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}><strong>분석 완료 후 즉시 삭제</strong></td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>이메일 주소 (회원가입 시)</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>계정 관리, 분석 결과 저장</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>회원 탈퇴 시까지</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>결제 정보</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>유료 서비스 제공</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>관계 법령에 따름 (5년)</td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: '14px', color: '#666666' }}>
              ※ 회원가입 없이도 무료 분석 서비스를 이용할 수 있으며, 이 경우 입력 정보는 서버에 저장되지 않습니다.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              2. 개인정보의 처리 및 보유 기간
            </h2>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>무료 분석</strong>: 분석 완료 즉시 입력 정보 삭제 (서버 미저장)
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>유료 분석</strong>: 분석 결과 1년간 보관 후 자동 삭제, 원본 입력 정보는 분석 완료 후 7일 이내 삭제
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>회원 탈퇴 요청 시</strong>: 요청일로부터 30일 이내 모든 정보 파기
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>데이터 삭제 요청</strong>: support@harmonyon.kr로 요청 시 24시간 이내 처리
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px', background: '#FFF9E6', padding: '24px', borderRadius: '12px', border: '1px solid #F0E68C' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              3. 개인정보의 국외 이전 (중요)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              회사는 AI 기반 분석을 위해 아래와 같이 개인정보를 국외로 이전할 수 있습니다.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', background: '#FFFFFF' }}>
              <thead>
                <tr style={{ background: '#F5F5F3' }}>
                  <th style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left' }}>이전받는 자</th>
                  <th style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left' }}>이전 국가</th>
                  <th style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left' }}>이전 항목</th>
                  <th style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left' }}>이전 목적</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>Google LLC</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>미국</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>익명화된 사주 데이터</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>AI 분석 (Gemini API)</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>OpenAI Inc.</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>미국</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>익명화된 사주 데이터</td>
                  <td style={{ padding: '12px', border: '1px solid #E5E5E5' }}>AI 분석 (GPT API)</td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: '14px', color: '#666666' }}>
              ※ 이름, 연락처 등 개인 식별 정보는 전송되지 않으며, 사주 분석에 필요한 최소한의 정보(생년월일시, 성별)만
              익명화되어 전송됩니다.<br />
              ※ 귀하는 국외 이전에 대한 동의를 거부할 권리가 있으며, 동의 거부 시 AI 분석 서비스 이용이 제한될 수 있습니다.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              4. 개인정보의 파기 절차 및 방법
            </h2>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>파기 절차</strong>: 보유 기간 만료 또는 사용자 요청 시 즉시 파기
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>파기 방법</strong>: 전자적 파일은 복구 불가능한 방법으로 영구 삭제
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>즉시 삭제 요청</strong>: support@harmonyon.kr로 요청 시 24시간 이내 처리
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              5. 정보주체의 권리와 행사 방법
            </h2>
            <p style={{ marginBottom: '16px' }}>귀하는 다음과 같은 권리를 행사할 수 있습니다:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>개인정보 열람 요청권</li>
              <li style={{ marginBottom: '8px' }}>개인정보 정정/삭제 요청권</li>
              <li style={{ marginBottom: '8px' }}>개인정보 처리 정지 요청권</li>
              <li style={{ marginBottom: '8px' }}>동의 철회권</li>
            </ul>
            <p style={{ marginTop: '16px', fontSize: '14px', color: '#666666' }}>
              권리 행사는 이메일(support@harmonyon.kr)로 요청하실 수 있으며,
              요청 접수 후 10일 이내에 처리 결과를 안내드립니다.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              6. 개인정보 보호책임자
            </h2>
            <div style={{ background: '#F5F5F3', padding: '20px', borderRadius: '8px' }}>
              <p style={{ marginBottom: '8px' }}><strong>성명</strong>: 이요한</p>
              <p style={{ marginBottom: '8px' }}><strong>직책</strong>: 대표</p>
              <p style={{ marginBottom: '8px' }}><strong>이메일</strong>: privacy@harmonyon.kr</p>
              <p><strong>전화</strong>: 추후 안내</p>
            </div>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              7. 아동의 개인정보 보호
            </h2>
            <p>
              본 서비스는 만 14세 미만 아동의 직접 가입 및 이용을 허용하지 않습니다.
              부모 또는 법정대리인이 아동의 정보를 입력하여 분석을 요청할 수 있으며,
              이 경우 법정대리인의 동의가 필요합니다.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
              8. 개인정보처리방침 변경
            </h2>
            <p>
              본 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 내용이 변경될 수 있습니다.
              변경 사항은 서비스 내 공지사항을 통해 안내드립니다.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
