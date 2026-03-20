'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: "안녕하셔요, 반갑습니다. 귀하의 타고난 기운과 하늘의 흐름을 함께 짚어드릴 소명(昭明)의 AI 도사입니다. 성격, 진로, 연애 혹은 다가올 운의 흐름에 대해 무엇이든 편안하게 물어보셔요."
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestions = [
    '나에게 가장 잘 맞는 직업은?',
    '올해의 전반적인 운세가 궁금해요',
    '나의 타고난 성격적 강점은?',
    '재물운을 높이려면 어떻게 해야 할까요?'
  ]

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
    <div className="flex flex-col h-screen bg-[#F4F1ED] font-sans-ko">
      {/* Header */}
      <header className="bg-[#F4F1ED]/80 backdrop-blur-xl border-b border-[#E2DDD6]/50 px-6 py-5 flex-shrink-0 z-10 sticky top-0">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="no-underline flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-[#1A2F23] flex items-center justify-center">
                <span className="font-serif-ko text-xs text-[#C5A059] font-bold">소</span>
              </div>
              <span className="font-serif-ko text-2xl text-[#1A2F23] tracking-tighter group-hover:text-[#C5A059] transition-colors">소명</span>
            </Link>
            <div className="w-[1px] h-6 bg-[#E2DDD6]" />
            <div className="hidden sm:block">
              <h1 className="text-xs font-bold tracking-[0.2em] text-[#1A2F23] uppercase">Celestial Consultation</h1>
            </div>
          </div>
          <Link href="/saju/results" className="text-[10px] font-bold tracking-widest text-[#5C554E] hover:text-[#C5A059] transition-colors uppercase border border-[#E2DDD6] px-4 py-2 rounded-full">
            ← Registry
          </Link>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-10 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-10">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'items-start gap-4'} animate-fade-in`}
            >
              {message.role === 'ai' && (
                <div className="w-10 h-10 rounded-full bg-[#1A2F23] border border-[#C5A059]/20 flex items-center justify-center flex-shrink-0 shadow-lg mt-1">
                  <span className="text-[10px] text-[#C5A059] font-bold font-serif-ko">도사</span>
                </div>
              )}
              <div className={`max-w-[85%] sm:max-w-[75%] px-6 py-4 rounded-[1.5rem] relative ${message.role === 'user'
                  ? 'bg-[#1A2F23] text-white rounded-tr-none'
                  : 'bg-[#FFFFFF] border border-[#E2DDD6] text-[#2D2A26] rounded-tl-none font-serif-ko leading-[1.8]'
                }`}>
                {message.role === 'ai' && (
                  <div className="absolute -top-6 left-0 text-[10px] font-bold text-[#C5A059] tracking-widest uppercase">The Insight</div>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Show suggestions only after first AI message */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 justify-center pt-4">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-5 py-2.5 bg-[#FFFFFF] border border-[#E2DDD6] rounded-full text-xs font-bold text-[#5C554E] hover:border-[#C5A059] hover:text-[#C5A059] transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-[#1A2F23] flex items-center justify-center flex-shrink-0 border border-[#C5A059]/20">
                <span className="text-[10px] text-[#C5A059] font-bold font-serif-ko">도사</span>
              </div>
              <div className="bg-[#FFFFFF]/50 border border-[#E2DDD6] px-6 py-4 rounded-[1.5rem] rounded-tl-none">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-bounce delay-150" />
                  <div className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-bounce delay-300" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-[#FFFFFF] border-t border-[#E2DDD6]/50 px-6 py-8 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="하늘의 뜻을 물으셔요..."
              className="w-full px-6 py-5 bg-[#F4F1ED]/50 border border-[#E2DDD6] rounded-[2rem] resize-none max-h-48 focus:outline-none focus:border-[#C5A059] focus:ring-4 focus:ring-[#C5A059]/5 transition-all font-serif-ko text-lg pr-20"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-3 bottom-3 w-12 h-12 bg-[#1A2F23] text-[#C5A059] rounded-full flex items-center justify-center hover:bg-[#C5A059] hover:text-[#1A2F23] disabled:bg-[#E2DDD6] disabled:text-white transition-all shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-[10px] font-bold text-[#1A2F23]/20 tracking-[0.3em] uppercase">Private & Eternal Channel</p>
            <div className="h-[1px] w-12 bg-[#E2DDD6]" />
          </div>
        </div>
      </div>
    </div>
  )
}
