'use client'

import Link from 'next/link'
import { useLanguage } from '@/app/lib/i18n/context'

export default function Footer() {
  const { t } = useLanguage()
  const f = t.footerDetail

  return (
    <footer style={{
      width: '100%',
      background: '#2A2420',
      padding: '48px 40px 32px',
      borderTop: '1px solid rgba(255, 255, 255, 0.06)'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Business Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '32px',
          marginBottom: '32px'
        }}>
          {/* Brand */}
          <div>
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>
              {f.brand}
            </h4>
            <p style={{ fontSize: '14px', color: '#888888', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {f.brandDesc}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>
              {f.service}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '10px' }}>
                <Link href="/saju/input" style={{ fontSize: '14px', color: '#888888', textDecoration: 'none' }}>
                  {f.freeAnalysis}
                </Link>
              </li>
              <li style={{ marginBottom: '10px' }}>
                <Link href="/#pricing" style={{ fontSize: '14px', color: '#888888', textDecoration: 'none' }}>
                  {f.pricingGuide}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>
              {f.legal}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '10px' }}>
                <Link href="/terms" style={{ fontSize: '14px', color: '#888888', textDecoration: 'none' }}>
                  {t.footer.terms}
                </Link>
              </li>
              <li style={{ marginBottom: '10px' }}>
                <Link href="/privacy" style={{ fontSize: '14px', color: '#888888', textDecoration: 'none' }}>
                  {t.footer.privacy}
                </Link>
              </li>
              <li style={{ marginBottom: '10px' }}>
                <Link href="/refund" style={{ fontSize: '14px', color: '#888888', textDecoration: 'none' }}>
                  {t.footer.refund}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>
              {f.support}
            </h4>
            <p style={{ fontSize: '14px', color: '#888888', lineHeight: 1.8 }}>
              {f.email}<br />
              {f.hours}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', marginBottom: '24px' }} />

        {/* Business Registration Info */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '12px', color: '#666666', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            <strong style={{ color: '#888888' }}>{f.bizInfo}</strong><br />
            {f.bizDetail}
          </p>
        </div>

        {/* Disclaimer */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{ fontSize: '12px', color: '#666666', lineHeight: 1.7 }}>
            <strong style={{ color: '#888888' }}>{f.serviceNotice}</strong><br />
            {f.serviceNoticeText}
          </p>
        </div>

        {/* Copyright */}
        <p style={{ fontSize: '12px', color: '#555555', textAlign: 'center' }}>
          {f.copyright}
        </p>
      </div>
    </footer>
  )
}
