import Link from 'next/link'
import type { LegalPageContent } from '@/app/lib/legal/content'
import { YinYangIcon } from '@/components/ui/YinYangIcon'

function LegalTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: '16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
        <thead>
          <tr style={{ background: '#F5F5F3' }}>
            {headers.map((header) => (
              <th key={header} style={{ padding: '12px', border: '1px solid #E5E5E5', textAlign: 'left', fontSize: '14px' }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} style={{ padding: '12px', border: '1px solid #E5E5E5', verticalAlign: 'top', fontSize: '14px' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function LegalDocument({
  content,
  backHome,
  children,
}: {
  content: LegalPageContent
  backHome: string
  children?: React.ReactNode
}) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FEFDFB',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <header style={{
        background: 'rgba(250, 250, 248, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
        padding: '20px 40px'
      }}>
        <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" className="logo-link" style={{ textDecoration: 'none', color: '#2C2420' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#2C2420' }}><YinYangIcon size={20} /> SoMyung</span>
          </Link>
          <Link href="/" style={{ fontSize: '14px', color: '#666666', textDecoration: 'none' }}>
            {backHome}
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '880px', margin: '0 auto', padding: '56px 40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#2C2420', marginBottom: '16px' }}>
          {content.title}
        </h1>
        <p style={{ fontSize: '14px', color: '#767676', marginBottom: '24px' }}>
          Effective: {content.effectiveDate} | Updated: {content.updatedDate}
        </p>
        <p style={{ fontSize: '16px', color: '#333333', lineHeight: 1.8, marginBottom: '44px' }}>
          {content.intro}
        </p>

        <div style={{ fontSize: '16px', color: '#333333', lineHeight: 1.8 }}>
          {content.sections.map((section) => (
            <section key={section.title} style={{ marginBottom: '44px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '16px' }}>
                {section.title}
              </h2>
              {section.body?.map((paragraph) => (
                <p key={paragraph} style={{ marginBottom: '12px' }}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
                  {section.bullets.map((item) => (
                    <li key={item} style={{ marginBottom: '8px' }}>{item}</li>
                  ))}
                </ul>
              )}
              {section.table && <LegalTable headers={section.table.headers} rows={section.table.rows} />}
            </section>
          ))}
        </div>

        {children}
      </main>
    </div>
  )
}
