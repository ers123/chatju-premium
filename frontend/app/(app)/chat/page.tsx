'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/app/lib/i18n/context'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
}

export default function ChatPage() {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredSuggestion, setHoveredSuggestion] = useState<number | null>(null)
  const [sendHovered, setSendHovered] = useState(false)
  const [registryHovered, setRegistryHovered] = useState(false)
  const [logoHovered, setLogoHovered] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Set welcome message based on language
  useEffect(() => {
    setMessages([{
      id: '1',
      role: 'ai',
      content: t.chat.welcomeMessage
    }])
  }, [t.chat.welcomeMessage])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response - in production this would call the backend API
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: '귀하의 사주는 강인한 금(金)의 기운과 포용력 있는 토(土)의 기운이 조화를 이루고 있습니다. 이는 냉철한 판단력과 따뜻한 인간미를 동시에 갖추었음을 의미하지요. 특히 다가오는 시기에는 목(木)의 기운이 들어와 새로운 기회와 성장의 발판이 마련될 것으로 보입니다. 조급해하기보다 흐름을 타는 것이 현명합니다.'
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#FDFCFA', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(235,229,223,0.6)',
        padding: '1.25rem 1.5rem',
        flexShrink: 0
      }}>
        <div style={{ maxWidth: '36rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
            >
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background: '#1A3D2E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>☯</span>
              </div>
              <span style={{
                fontFamily: 'serif',
                fontSize: '1.5rem',
                color: logoHovered ? '#C5A059' : '#1A3D2E',
                letterSpacing: '-0.05em',
                transition: 'color 0.2s'
              }}>SoMyung</span>
            </Link>
            <div style={{ width: '1px', height: '1.5rem', background: '#EBE5DF' }} />
            <div>
              <h1 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em', color: '#1A3D2E', textTransform: 'uppercase', margin: 0 }}>{t.chat.headerTitle}</h1>
            </div>
          </div>
          <Link
            href="/saju/results"
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: registryHovered ? '#C5A059' : '#6B5E52',
              border: registryHovered ? '1px solid #C5A059' : '1px solid rgba(235,229,223,0.6)',
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              textDecoration: 'none',
              textTransform: 'uppercase',
              transition: 'all 0.2s'
            }}
            onMouseEnter={() => setRegistryHovered(true)}
            onMouseLeave={() => setRegistryHovered(false)}
          >
            {t.chat.registry}
          </Link>
        </div>
      </header>

      {/* Chat Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem 1.5rem', scrollBehavior: 'smooth' }}>
        <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: message.role === 'ai' ? 'flex-start' : undefined,
                gap: message.role === 'ai' ? '1rem' : undefined,
                marginBottom: '2.5rem',
                animation: 'fadeIn 0.3s ease-in'
              }}
            >
              {message.role === 'ai' && (
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  background: '#1A3D2E',
                  border: '1px solid rgba(197,160,89,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  marginTop: '0.25rem'
                }}>
                  <span style={{ fontSize: '10px', color: '#C5A059', fontWeight: 700, fontFamily: 'serif' }}>{t.chat.avatarLabel}</span>
                </div>
              )}
              <div style={{
                maxWidth: '75%',
                padding: '1rem 1.5rem',
                borderRadius: '1.5rem',
                position: 'relative',
                ...(message.role === 'user'
                  ? {
                      background: '#1A3D2E',
                      color: '#FFFFFF',
                      borderTopRightRadius: 0
                    }
                  : {
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid rgba(235,229,223,0.6)',
                      color: '#2D3A35',
                      borderTopLeftRadius: 0,
                      fontFamily: 'serif',
                      lineHeight: 1.8
                    }
                )
              }}>
                {message.role === 'ai' && (
                  <div style={{
                    position: 'absolute',
                    top: '-1.5rem',
                    left: 0,
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#C5A059',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                  }}>{t.chat.insightLabel}</div>
                )}
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{message.content}</p>
              </div>
            </div>
          ))}

          {/* Show suggestions only after first AI message */}
          {messages.length === 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', paddingTop: '1rem' }}>
              {t.chat.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setHoveredSuggestion(index)}
                  onMouseLeave={() => setHoveredSuggestion(null)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    background: 'rgba(255,255,255,0.95)',
                    border: hoveredSuggestion === index ? '1px solid #C5A059' : '1px solid rgba(235,229,223,0.6)',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: hoveredSuggestion === index ? '#C5A059' : '#6B5E52',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2.5rem' }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                background: '#1A3D2E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid rgba(197,160,89,0.2)'
              }}>
                <span style={{ fontSize: '10px', color: '#C5A059', fontWeight: 700, fontFamily: 'serif' }}>{t.chat.avatarLabel}</span>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(235,229,223,0.6)',
                padding: '1rem 1.5rem',
                borderRadius: '1.5rem',
                borderTopLeftRadius: 0
              }}>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <div style={{ width: '0.375rem', height: '0.375rem', background: '#C5A059', borderRadius: '50%', animation: 'bounce 1s infinite' }} />
                  <div style={{ width: '0.375rem', height: '0.375rem', background: '#C5A059', borderRadius: '50%', animation: 'bounce 1s infinite 0.15s' }} />
                  <div style={{ width: '0.375rem', height: '0.375rem', background: '#C5A059', borderRadius: '50%', animation: 'bounce 1s infinite 0.3s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div style={{
        background: '#FFFFFF',
        borderTop: '1px solid rgba(235,229,223,0.5)',
        padding: '2rem 1.5rem',
        flexShrink: 0
      }}>
        <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={t.chat.placeholder}
              style={{
                width: '100%',
                padding: '1.25rem 5rem 1.25rem 1.5rem',
                background: 'rgba(253,252,250,0.5)',
                border: inputFocused ? '1px solid #C5A059' : '1px solid rgba(235,229,223,0.6)',
                borderRadius: '2rem',
                resize: 'none',
                maxHeight: '12rem',
                outline: 'none',
                boxShadow: inputFocused ? '0 0 0 4px rgba(197,160,89,0.05)' : 'none',
                transition: 'all 0.2s',
                fontFamily: 'serif',
                fontSize: '1.125rem',
                lineHeight: 1.5,
                boxSizing: 'border-box',
                color: '#2D3A35'
              }}
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              onMouseEnter={() => setSendHovered(true)}
              onMouseLeave={() => setSendHovered(false)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                bottom: '0.75rem',
                width: '3rem',
                height: '3rem',
                background: (!input.trim() || isLoading)
                  ? '#E2DDD6'
                  : sendHovered ? '#C5A059' : '#1A3D2E',
                color: (!input.trim() || isLoading)
                  ? '#FFFFFF'
                  : sendHovered ? '#1A3D2E' : '#C5A059',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: (!input.trim() || isLoading) ? 'default' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,61,46,0.2)', letterSpacing: '0.3em', textTransform: 'uppercase', margin: 0 }}>{t.chat.footerLabel}</p>
            <div style={{ height: '1px', width: '3rem', background: '#EBE5DF' }} />
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
