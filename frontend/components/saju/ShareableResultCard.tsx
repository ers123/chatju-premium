'use client'

import { useRef, useCallback, useState } from 'react'
import { YinYangIcon } from '@/components/ui/YinYangIcon'

interface ShareableCardProps {
  childName: string
  dominantElement: string
  elementEmoji: string
  elementColor: string
  elementBgColor: string
  traits: string[]
  ohaengBalance: Record<string, number>
  elementLabel: string
  shareText: string
  shareTitle: string
  buttonLabel: string
  downloadLabel: string
}

const elementVisuals: Record<string, { emoji: string; color: string; bgImage: string }> = {
  '목': { emoji: '🌿', color: '#5A7A66', bgImage: '/assets/images/marketing/element-wood.png' },
  '화': { emoji: '🔥', color: '#A85544', bgImage: '/assets/images/marketing/element-fire.png' },
  '토': { emoji: '🏔️', color: '#8A6A45', bgImage: '/assets/images/marketing/element-earth.png' },
  '금': { emoji: '⚔️', color: '#6B7578', bgImage: '/assets/images/marketing/element-metal.png' },
  '수': { emoji: '💧', color: '#556B7E', bgImage: '/assets/images/marketing/element-water.png' },
}

export default function ShareableResultCard({
  childName,
  dominantElement,
  elementEmoji,
  elementColor,
  elementBgColor,
  traits,
  ohaengBalance,
  elementLabel,
  shareText,
  shareTitle,
  buttonLabel,
  downloadLabel,
}: ShareableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null
    // Temporarily make the card visible for html2canvas capture
    const wrapper = cardRef.current.parentElement
    if (wrapper) {
      wrapper.style.height = 'auto'
      wrapper.style.overflow = 'visible'
      wrapper.style.position = 'absolute'
      wrapper.style.left = '-9999px'
    }
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#F7F4EE',
      width: 540,
      height: 540,
    })
    // Restore hidden state
    if (wrapper) {
      wrapper.style.height = '0'
      wrapper.style.overflow = 'hidden'
      wrapper.style.position = ''
      wrapper.style.left = ''
    }
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  }, [])

  const handleShare = useCallback(async () => {
    setGenerating(true)
    try {
      const blob = await generateImage()
      if (!blob) return

      const file = new File([blob], `somyung-${childName}.png`, { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file],
        })
      } else {
        // Desktop fallback: download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `somyung-${childName}.png`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      // user cancelled share — ignore
    } finally {
      setGenerating(false)
    }
  }, [generateImage, childName, shareText, shareTitle])

  const maxBalance = Math.max(...Object.values(ohaengBalance), 1)

  return (
    <div>
      {/* Off-screen card for rendering — hidden via overflow to keep in document flow for html2canvas */}
      <div style={{ overflow: 'hidden', height: 0 }}>
        <div
          ref={cardRef}
          style={{
            width: '540px',
            height: '540px',
            background: '#F7F4EE',
            fontFamily: '"Pretendard", -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Element background image — subtle watermark */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${elementVisuals[dominantElement]?.bgImage || ''})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.08,
            pointerEvents: 'none',
          }} />

          {/* Top accent bar */}
          <div style={{
            height: '4px',
            background: `linear-gradient(90deg, ${elementColor}, #8A6A45)`,
            position: 'relative',
            zIndex: 1,
          }} />

          {/* Header */}
          <div style={{
            padding: '28px 36px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#33302A',
              letterSpacing: '-0.03em',
            }}>
              <YinYangIcon size={16} color="#33302A" /> SoMyung
            </span>
            <span style={{
              fontSize: '11px',
              color: '#9B8B7A',
              letterSpacing: '0.05em',
            }}>
              somyung.cc
            </span>
          </div>

          {/* Main content */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 36px 20px',
            gap: '16px',
          }}>
            {/* Element icon */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: elementBgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
            }}>
              {elementEmoji}
            </div>

            {/* Child name + element */}
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#33302A',
                fontFamily: '"Nanum Myeongjo", serif',
                marginBottom: '4px',
                letterSpacing: '-0.03em',
              }}>
                {childName}
              </p>
              <p style={{
                fontSize: '15px',
                fontWeight: 600,
                color: elementColor,
              }}>
                {elementLabel}
              </p>
            </div>

            {/* Trait pills */}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              {traits.slice(0, 3).map((trait, i) => (
                <span key={i} style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: elementColor,
                  background: `${elementColor}12`,
                  border: `1px solid ${elementColor}25`,
                }}>
                  {trait}
                </span>
              ))}
            </div>

            {/* Mini ohaeng balance */}
            <div style={{
              width: '100%',
              maxWidth: '360px',
              display: 'flex',
              gap: '6px',
              alignItems: 'flex-end',
              justifyContent: 'center',
              height: '48px',
              marginTop: '4px',
            }}>
              {Object.entries(ohaengBalance).map(([key, value]) => {
                const visual = elementVisuals[key]
                const height = Math.max((value / maxBalance) * 44, 4)
                return (
                  <div key={key} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    flex: 1,
                  }}>
                    <div style={{
                      width: '100%',
                      maxWidth: '48px',
                      height: `${height}px`,
                      borderRadius: '4px 4px 2px 2px',
                      background: visual?.color || '#ccc',
                      opacity: key === dominantElement ? 1 : 0.4,
                      transition: 'height 0.5s',
                    }} />
                    <span style={{
                      fontSize: '10px',
                      color: '#9B8B7A',
                    }}>
                      {visual?.emoji}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom branding */}
          <div style={{
            padding: '16px 36px',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: '11px',
              color: '#9B8B7A',
            }}>
              518,400 combinations
            </span>
            <span style={{
              fontSize: '11px',
              color: '#8A6A45',
              fontWeight: 600,
            }}>
              Discover yours at somyung.cc
            </span>
          </div>
        </div>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        disabled={generating}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '6px',
          fontWeight: 600,
          border: '2px solid #8A6A45',
          color: '#8A6A45',
          background: 'none',
          cursor: generating ? 'wait' : 'pointer',
          fontSize: '1rem',
          opacity: generating ? 0.6 : 1,
          transition: 'opacity 0.2s',
          width: '100%',
        }}
      >
        {generating ? '...' : buttonLabel}
      </button>
    </div>
  )
}
