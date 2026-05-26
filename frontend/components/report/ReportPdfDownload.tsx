'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { Language } from '@/app/lib/i18n/translations'
import { localizedLegalPath } from '@/app/lib/i18n/routes'

type Copy = {
  title: string
  preparing: string
  ready: string
  error: string
  retry: string
  privacy: string
}

const copyByLang: Record<Language, Copy> = {
  ko: { title: 'SoMyung 리포트 PDF', preparing: 'PDF 다운로드를 준비하고 있습니다.', ready: '다운로드가 시작되지 않으면 다시 시도해주세요.', error: 'PDF를 열 수 없습니다. 링크가 만료되었거나 잘못되었습니다.', retry: '다시 다운로드', privacy: '개인정보처리방침' },
  en: { title: 'SoMyung Report PDF', preparing: 'Preparing your PDF download.', ready: 'If the download does not start, try again.', error: 'We could not open this PDF. The link may be expired or invalid.', retry: 'Download again', privacy: 'Privacy Policy' },
  ja: { title: 'SoMyung レポートPDF', preparing: 'PDFダウンロードを準備しています。', ready: 'ダウンロードが始まらない場合は、もう一度お試しください。', error: 'PDFを開けません。リンクが期限切れ、または無効な可能性があります。', retry: '再ダウンロード', privacy: 'プライバシーポリシー' },
  zh: { title: 'SoMyung 报告 PDF', preparing: '正在准备 PDF 下载。', ready: '如果下载未开始，请重试。', error: '无法打开此 PDF。链接可能已过期或无效。', retry: '重新下载', privacy: '隐私政策' },
  vi: { title: 'PDF báo cáo SoMyung', preparing: 'Đang chuẩn bị tải PDF.', ready: 'Nếu tải xuống chưa bắt đầu, hãy thử lại.', error: 'Không thể mở PDF này. Liên kết có thể đã hết hạn hoặc không hợp lệ.', retry: 'Tải lại', privacy: 'Chính sách bảo mật' },
  id: { title: 'PDF Laporan SoMyung', preparing: 'Menyiapkan unduhan PDF.', ready: 'Jika unduhan tidak dimulai, coba lagi.', error: 'PDF tidak dapat dibuka. Tautan mungkin kedaluwarsa atau tidak valid.', retry: 'Unduh lagi', privacy: 'Kebijakan Privasi' },
  es: { title: 'PDF del informe SoMyung', preparing: 'Preparando la descarga del PDF.', ready: 'Si la descarga no comienza, inténtalo de nuevo.', error: 'No pudimos abrir este PDF. El enlace puede estar vencido o no ser válido.', retry: 'Descargar de nuevo', privacy: 'Política de Privacidad' },
  pt: { title: 'PDF do relatório SoMyung', preparing: 'Preparando o download do PDF.', ready: 'Se o download não começar, tente novamente.', error: 'Não foi possível abrir este PDF. O link pode estar expirado ou inválido.', retry: 'Baixar novamente', privacy: 'Política de Privacidade' },
  fr: { title: 'PDF du rapport SoMyung', preparing: 'Préparation du téléchargement PDF.', ready: 'Si le téléchargement ne démarre pas, réessayez.', error: 'Impossible d’ouvrir ce PDF. Le lien peut être expiré ou invalide.', retry: 'Télécharger à nouveau', privacy: 'Politique de confidentialité' },
  th: { title: 'PDF รายงาน SoMyung', preparing: 'กำลังเตรียมดาวน์โหลด PDF', ready: 'หากการดาวน์โหลดไม่เริ่ม โปรดลองอีกครั้ง', error: 'ไม่สามารถเปิด PDF นี้ได้ ลิงก์อาจหมดอายุหรือไม่ถูกต้อง', retry: 'ดาวน์โหลดอีกครั้ง', privacy: 'นโยบายความเป็นส่วนตัว' },
}

function resolveLang(value: string | null): Language {
  return value && value in copyByLang ? (value as Language) : 'en'
}

export default function ReportPdfDownload() {
  const searchParams = useSearchParams()
  const readingId = searchParams.get('readingId')
  const token = searchParams.get('token')
  const lang = resolveLang(searchParams.get('lang'))
  const copy = copyByLang[lang]
  const [status, setStatus] = useState<'preparing' | 'ready' | 'error'>('preparing')

  const pdfUrl = useMemo(() => {
    if (!readingId || !token) return ''
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    return `${apiUrl}/saju/reading/${encodeURIComponent(readingId)}/pdf?token=${encodeURIComponent(token)}`
  }, [readingId, token])

  const download = async () => {
    if (!pdfUrl) {
      setStatus('error')
      return
    }
    try {
      setStatus('preparing')
      const response = await fetch(pdfUrl)
      if (!response.ok) throw new Error('PDF download failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `SoMyung_Report_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => {
    download()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfUrl])

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', background: '#FEFDFB', color: '#2C2420' }}>
      <section style={{ width: '100%', maxWidth: '420px', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '28px', background: '#FFFFFF', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>{copy.title}</h1>
        <p style={{ fontSize: '15px', lineHeight: 1.7, color: status === 'error' ? '#B42318' : '#6B5E52', marginBottom: '20px' }}>
          {status === 'preparing' ? copy.preparing : status === 'ready' ? copy.ready : copy.error}
        </p>
        <button
          type="button"
          onClick={download}
          style={{ width: '100%', border: 'none', borderRadius: '10px', background: '#2D3A35', color: '#C5A059', padding: '12px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: '14px' }}
        >
          {copy.retry}
        </button>
        <Link href={localizedLegalPath(lang, 'privacy')} style={{ fontSize: '13px', color: '#8B8580' }}>
          {copy.privacy}
        </Link>
      </section>
    </main>
  )
}
