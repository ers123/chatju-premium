# ChatJu Premium 커뮤니티 관리 통합 가이드

**작성일**: 2025-11-13
**프로젝트**: ChatJu Premium
**버전**: 1.0.0

---

## 📌 개요

이 문서는 ChatJu Premium 사주팔자 서비스와 카카오톡 오픈채팅 자동화를 통합하여 효과적인 커뮤니티 관리 시스템을 구축하는 방법을 설명합니다.

---

## 🎯 목표

### 비즈니스 목표
1. **사용자 피드백 자동 수집** - 서비스 개선 인사이트 확보
2. **커뮤니티 활성화** - K-wave 팬덤 중심의 유기적 커뮤니티 형성
3. **프리미엄 전환율 향상** - 커뮤니티 내 자연스러운 업셀
4. **FAQ 자동 생성** - 고객 지원 효율화

### 기술 목표
1. **자동화 파이프라인 구축** - 수동 작업 최소화
2. **AI 분석 통합** - OpenAI/Gemini를 활용한 인사이트 도출
3. **데이터 축적** - Supabase에 분석 결과 저장
4. **대시보드 구축** - 실시간 커뮤니티 현황 모니터링

---

## 🏗️ 시스템 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                  ChatJu Premium 생태계                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐        ┌──────────────┐              │
│  │   Frontend   │ ←──→   │   Backend    │              │
│  │  (Next.js)   │        │  (Express)   │              │
│  └──────────────┘        └──────┬───────┘              │
│                                  │                       │
│                                  ↓                       │
│                         ┌────────────────┐              │
│                         │   Supabase     │              │
│                         │  PostgreSQL    │              │
│                         └────────┬───────┘              │
│                                  │                       │
└──────────────────────────────────┼───────────────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                   │
                ↓                  ↓                   ↓
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │  Readings    │  │   Payments   │  │  Community   │
        │    Data      │  │     Data     │  │   Analytics  │
        └──────────────┘  └──────────────┘  └──────┬───────┘
                                                    │
        ┌───────────────────────────────────────────┘
        │
        ↓
┌─────────────────────────────────────────────────────────┐
│              커뮤니티 관리 자동화 시스템                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐        ┌──────────────┐              │
│  │  KakaoTalk   │  →→→   │  Google      │              │
│  │  OpenChat    │  내보내기  │  Drive       │              │
│  └──────────────┘        └──────┬───────┘              │
│                                  │                       │
│                                  ↓                       │
│                         ┌────────────────┐              │
│                         │  n8n Workflow  │              │
│                         └────────┬───────┘              │
│                                  │                       │
│                  ┌───────────────┼───────────────┐      │
│                  ↓               ↓               ↓      │
│          ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│          │   Parser    │ │   AI LLM    │ │   Export    ││
│          │  (Node.js)  │ │  (OpenAI)   │ │  (Notion)   ││
│          └─────────────┘ └─────────────┘ └─────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 구현 로드맵

### Phase 1: 기본 인프라 구축 (1주)

#### 1.1 오픈채팅방 개설
```
목표: ChatJu 공식 커뮤니티 오픈채팅방 운영 시작

작업:
- [ ] 카카오톡 오픈채팅방 생성
- [ ] 방 이름: "ChatJu 사주풀이 | K-pop 궁합 커뮤니티"
- [ ] 방 설명: "AI 사주 서비스 ChatJu 공식 커뮤니티. 사주 질문, K-pop 아이돌 궁합 토론, 프리미엄 혜택 안내"
- [ ] 운영 규칙 공지
- [ ] 관리자 2명 이상 지정

운영 규칙 예시:
1. 스팸/광고 금지
2. 상호 존중
3. 대화 로그는 서비스 개선 목적으로 분석됨 (개인정보 제외)
4. 프리미엄 사용자 전용 혜택 안내
```

#### 1.2 초기 사용자 모집
```
목표: 50-100명 초기 멤버 확보

채널:
- Reddit (r/kpop, r/kdrama)
- Twitter/X (K-pop 해시태그)
- 기존 사주 커뮤니티 크로스 포스팅
- 친구/지인 초대

인센티브:
- 초기 멤버 한정 프리미엄 30% 할인
- 베타 테스터 배지
- 월간 우수 멤버 무료 프리미엄 제공
```

#### 1.3 Supabase 테이블 생성

**새 테이블: `community_analytics`**

```sql
-- 커뮤니티 분석 결과 테이블
CREATE TABLE community_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_date DATE NOT NULL,
  source_file TEXT,
  total_messages INTEGER,
  total_users INTEGER,
  total_links INTEGER,
  total_questions INTEGER,
  top_keywords JSONB,
  ai_summary TEXT,
  ai_link_analysis TEXT,
  ai_question_analysis TEXT,
  sentiment_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_community_analytics_date ON community_analytics(analysis_date);
CREATE INDEX idx_community_analytics_created ON community_analytics(created_at);

-- 커뮤니티 FAQ 테이블
CREATE TABLE community_faq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT,
  frequency INTEGER DEFAULT 1,
  source_analysis_id UUID REFERENCES community_analytics(id),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 커뮤니티 피드백 테이블
CREATE TABLE community_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_type TEXT, -- bug, feature_request, praise, complaint
  content TEXT NOT NULL,
  username TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  source_analysis_id UUID REFERENCES community_analytics(id),
  status TEXT DEFAULT 'new', -- new, in_progress, resolved, wont_fix
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE community_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_feedback ENABLE ROW LEVEL SECURITY;

-- Policies (관리자만 접근)
CREATE POLICY "Admin access to community_analytics" ON community_analytics
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admin access to community_faq" ON community_faq
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admin access to community_feedback" ON community_feedback
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
```

---

### Phase 2: n8n 워크플로 구축 (3-5일)

#### 2.1 n8n 설치

**옵션 A: Self-hosted (Docker)**
```bash
# Docker Compose로 n8n 설치
cd /path/to/chatju-premium
mkdir -p automation/n8n
cd automation/n8n

cat > docker-compose.yml <<EOF
version: '3.8'

services:
  n8n:
    image: n8nio/n8n
    container_name: chatju-n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=changeme123
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://localhost:5678/
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped

volumes:
  n8n_data:
EOF

# 실행
docker-compose up -d

# 접속: http://localhost:5678
```

**옵션 B: n8n Cloud (추천)**
```
1. https://n8n.io 회원가입
2. 워크스페이스 생성
3. 무료 플랜으로 시작 (월 5,000 실행까지 무료)
```

#### 2.2 워크플로 Import

```bash
# docs/community/N8N_WORKFLOW_EXAMPLE.md 파일의 JSON 복사
# n8n 대시보드에서 "Import from File" 클릭
# JSON 붙여넣기 → Import
```

#### 2.3 Credentials 설정

| Credential | 발급 방법 | 설정 위치 |
|-----------|----------|---------|
| **Google Drive OAuth2** | [Google Cloud Console](https://console.cloud.google.com) | n8n → Credentials → Add |
| **OpenAI API** | [OpenAI Platform](https://platform.openai.com/api-keys) | n8n → Credentials → Add |
| **Notion API** | [Notion Integrations](https://www.notion.so/my-integrations) | n8n → Credentials → Add |
| **Slack API** | [Slack Apps](https://api.slack.com/apps) | n8n → Credentials → Add |

#### 2.4 환경 변수 설정

n8n 설정에서 추가:
```env
NOTION_PARENT_PAGE_ID=your-notion-page-id
SLACK_CHANNEL_ID=C01234567
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

---

### Phase 3: 백엔드 API 통합 (2-3일)

#### 3.1 새 API 엔드포인트 추가

**파일: `backend/src/routes/community.routes.js`**

```javascript
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const communityService = require('../services/community.service');

// 관리자 전용 미들웨어
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// 커뮤니티 분석 결과 조회
router.get('/analytics', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    const analytics = await communityService.getAnalytics({
      startDate,
      endDate,
      limit: parseInt(limit)
    });
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 날짜의 분석 결과 조회
router.get('/analytics/:date', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { date } = req.params;
    const analysis = await communityService.getAnalysisByDate(date);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FAQ 조회
router.get('/faq', async (req, res) => {
  try {
    const { status = 'approved', limit = 10 } = req.query;
    const faqs = await communityService.getFAQs({
      status,
      limit: parseInt(limit)
    });
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FAQ 승인/거부 (관리자)
router.patch('/faq/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, answer } = req.body;
    const updated = await communityService.updateFAQ(id, { status, answer });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 피드백 조회 (관리자)
router.get('/feedback', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { status, type, limit = 50 } = req.query;
    const feedback = await communityService.getFeedback({
      status,
      type,
      limit: parseInt(limit)
    });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 피드백 상태 업데이트 (관리자)
router.patch('/feedback/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to } = req.body;
    const updated = await communityService.updateFeedback(id, { status, assigned_to });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// n8n webhook - 분석 결과 저장 (n8n에서 호출)
router.post('/webhook/analysis', async (req, res) => {
  try {
    // n8n에서 전송한 분석 결과 저장
    const analysisData = req.body;
    const result = await communityService.saveAnalysis(analysisData);
    res.json({ success: true, id: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

**파일: `backend/src/services/community.service.js`**

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * 커뮤니티 분석 서비스
 */
class CommunityService {
  /**
   * 분석 결과 저장
   */
  async saveAnalysis(data) {
    const { data: result, error } = await supabase
      .from('community_analytics')
      .insert([{
        analysis_date: data.date,
        source_file: data.source_file,
        total_messages: data.total_messages,
        total_users: data.total_users,
        total_links: data.total_links,
        total_questions: data.total_questions,
        top_keywords: data.top_keywords,
        ai_summary: data.ai_summary,
        ai_link_analysis: data.ai_link_analysis,
        ai_question_analysis: data.ai_question_analysis,
        sentiment_score: data.sentiment_score || 0
      }])
      .select()
      .single();

    if (error) throw error;

    // FAQ 저장
    if (data.questions && data.questions.length > 0) {
      await this.saveFAQs(data.questions, result.id);
    }

    return result;
  }

  /**
   * FAQ 저장
   */
  async saveFAQs(questions, analysisId) {
    const faqData = questions.map(q => ({
      question: q.question,
      source_analysis_id: analysisId,
      status: 'pending'
    }));

    const { error } = await supabase
      .from('community_faq')
      .insert(faqData);

    if (error) throw error;
  }

  /**
   * 분석 결과 조회
   */
  async getAnalytics({ startDate, endDate, limit }) {
    let query = supabase
      .from('community_analytics')
      .select('*')
      .order('analysis_date', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('analysis_date', startDate);
    }
    if (endDate) {
      query = query.lte('analysis_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * 특정 날짜 분석 결과 조회
   */
  async getAnalysisByDate(date) {
    const { data, error } = await supabase
      .from('community_analytics')
      .select('*')
      .eq('analysis_date', date)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * FAQ 조회
   */
  async getFAQs({ status, limit }) {
    const { data, error } = await supabase
      .from('community_faq')
      .select('*')
      .eq('status', status)
      .order('frequency', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * FAQ 업데이트
   */
  async updateFAQ(id, updates) {
    const { data, error } = await supabase
      .from('community_faq')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 피드백 조회
   */
  async getFeedback({ status, type, limit }) {
    let query = supabase
      .from('community_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('feedback_type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * 피드백 업데이트
   */
  async updateFeedback(id, updates) {
    const { data, error } = await supabase
      .from('community_feedback')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new CommunityService();
```

#### 3.2 라우트 등록

**파일: `backend/index.js`**

```javascript
// ... 기존 코드

// 라우트 추가
const communityRoutes = require('./src/routes/community.routes');
app.use('/community', communityRoutes);

// ... 기존 코드
```

---

### Phase 4: 프론트엔드 대시보드 (3-5일)

#### 4.1 관리자 대시보드 페이지

**파일: `frontend/app/admin/community/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';

interface Analytics {
  id: string;
  analysis_date: string;
  total_messages: number;
  total_users: number;
  total_links: number;
  total_questions: number;
  top_keywords: { word: string; count: number }[];
  ai_summary: string;
}

export default function CommunityDashboard() {
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await apiClient.get<Analytics[]>('/community/analytics?limit=30');
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading variant="spinner" />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">커뮤니티 대시보드</h1>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">총 분석 일수</p>
            <p className="text-2xl font-bold">{analytics.length}일</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">총 메시지</p>
            <p className="text-2xl font-bold">
              {analytics.reduce((sum, a) => sum + a.total_messages, 0)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">평균 활성 사용자</p>
            <p className="text-2xl font-bold">
              {Math.round(analytics.reduce((sum, a) => sum + a.total_users, 0) / analytics.length)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">총 공유 링크</p>
            <p className="text-2xl font-bold">
              {analytics.reduce((sum, a) => sum + a.total_links, 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* 일별 분석 */}
      <h2 className="text-2xl font-bold mb-4">일별 분석</h2>
      <div className="space-y-4">
        {analytics.map((item) => (
          <Card key={item.id}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{item.analysis_date}</h3>
                  <p className="text-sm text-gray-600">
                    메시지: {item.total_messages} | 사용자: {item.total_users} |
                    링크: {item.total_links} | 질문: {item.total_questions}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">AI 요약</h4>
                <p className="text-gray-700 whitespace-pre-line">{item.ai_summary}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">주요 키워드</h4>
                <div className="flex flex-wrap gap-2">
                  {item.top_keywords?.slice(0, 10).map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-navy-light text-white rounded-full text-sm"
                    >
                      {kw.word} ({kw.count})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### 4.2 FAQ 관리 페이지

**파일: `frontend/app/admin/community/faq/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface FAQ {
  id: string;
  question: string;
  answer?: string;
  frequency: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function FAQManagement() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadFAQs();
  }, [filter]);

  const loadFAQs = async () => {
    const data = await apiClient.get<FAQ[]>(`/community/faq?status=${filter}&limit=50`);
    setFaqs(data);
  };

  const updateFAQ = async (id: string, status: string, answer?: string) => {
    await apiClient.patch(`/community/faq/${id}`, { status, answer });
    loadFAQs();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">FAQ 관리</h1>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'pending' ? 'primary' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          대기 중
        </Button>
        <Button
          variant={filter === 'approved' ? 'primary' : 'outline'}
          onClick={() => setFilter('approved')}
        >
          승인됨
        </Button>
        <Button
          variant={filter === 'rejected' ? 'primary' : 'outline'}
          onClick={() => setFilter('rejected')}
        >
          거부됨
        </Button>
      </div>

      {/* FAQ 리스트 */}
      <div className="space-y-4">
        {faqs.map((faq) => (
          <Card key={faq.id}>
            <div className="p-6">
              <p className="font-semibold mb-2">{faq.question}</p>
              <p className="text-sm text-gray-600 mb-4">빈도: {faq.frequency}</p>

              {faq.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => updateFAQ(faq.id, 'approved')}
                  >
                    승인
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateFAQ(faq.id, 'rejected')}
                  >
                    거부
                  </Button>
                </div>
              )}

              {faq.answer && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <p className="text-sm">{faq.answer}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 🚀 운영 가이드

### 일일 운영 체크리스트

#### 아침 (09:00)
- [ ] 전날 커뮤니티 리포트 확인 (Notion/Slack)
- [ ] 긴급 피드백 확인 (버그, 결제 문제 등)
- [ ] FAQ 대기 목록 검토 및 승인
- [ ] 주요 키워드 트렌드 확인

#### 점심 (12:00)
- [ ] 실시간 커뮤니티 모니터링 (부적절한 내용 확인)
- [ ] 사용자 질문에 답변
- [ ] 프리미엄 관련 문의 우선 처리

#### 저녁 (18:00)
- [ ] 오늘 대화 내보내기 실행
- [ ] Google Drive에 업로드 (n8n 트리거)
- [ ] 분석 결과 대기 (30분 소요)
- [ ] 결과 검토 및 대응 사항 정리

#### 주간 (금요일)
- [ ] 주간 커뮤니티 리포트 생성
- [ ] 인기 주제 TOP 5 정리
- [ ] 프리미엄 전환율 분석
- [ ] 다음 주 이벤트 계획

---

## 💡 Best Practices

### 커뮤니티 활성화 전략

#### 1. 정기 이벤트
```
매주 월요일: "이번 주 운세" 무료 프리뷰
매주 수요일: "K-pop 아이돌 사주 분석" 투표
매주 금요일: "주간 우수 멤버" 프리미엄 증정
```

#### 2. 콘텐츠 시딩
```
- 관리자가 흥미로운 주제 먼저 던지기
- 예: "BTS 멤버 중 누가 리더십 운이 가장 강할까요?"
- 예: "K-drama에 나온 사주 장면 분석해보기"
```

#### 3. 프리미엄 유도
```
- 무료 사용자의 질문에 "프리미엄에서는 더 자세한 분석이 나와요!" 자연스럽게 언급
- 월 1회 "프리미엄 체험 데이" (24시간 무료 체험)
```

### 데이터 개인정보 보호

#### ⚠️ 중요 사항
```
✅ DO:
- 통계 데이터만 저장 (메시지 개수, 키워드 빈도)
- AI 요약에서 개인 식별 정보 제거
- 사용자에게 분석 목적 명시 및 동의 획득

❌ DON'T:
- 개인 생년월일 등 민감 정보 로그 저장
- 제3자에게 원본 대화 로그 공유
- 마케팅 목적으로 개인 정보 활용
```

---

## 📊 성과 측정 (KPIs)

### 커뮤니티 건강도
| 지표 | 목표 | 측정 방법 |
|-----|------|---------|
| 일일 활성 사용자 (DAU) | 50명 | `total_users` 평균 |
| 일일 메시지 수 | 200개 | `total_messages` |
| 질문 응답률 | 80% | FAQ 승인율 |
| 프리미엄 전환율 | 5% | 커뮤니티 멤버 → 결제 비율 |

### 비즈니스 임팩트
| 지표 | 목표 | 측정 방법 |
|-----|------|---------|
| 커뮤니티 유입 신규 가입 | 월 100명 | 커뮤니티 링크로 가입한 사용자 추적 |
| FAQ 기반 고객 지원 감소 | 30% 감소 | 중복 문의 감소율 |
| 평균 사용자 유지 기간 | 3개월+ | 커뮤니티 참여자 retention |

---

## 🔧 트러블슈팅

### 문제 1: n8n 워크플로 실패
**증상**: 파일 업로드했는데 분석 안 됨
**해결**:
1. n8n 실행 로그 확인
2. Google Drive Trigger 상태 확인
3. OpenAI API 키 유효성 확인
4. Supabase 연결 확인

### 문제 2: 파싱 실패
**증상**: 메시지 개수가 0으로 나옴
**해결**:
1. 카카오톡 내보내기 포맷 확인 (날짜 형식)
2. 파일 인코딩 확인 (UTF-8 vs EUC-KR)
3. 정규식 패턴 조정 필요

### 문제 3: 대시보드 접근 불가
**증상**: 403 Forbidden
**해결**:
1. JWT 토큰 확인
2. 사용자 role이 'admin'인지 확인
3. Supabase RLS 정책 확인

---

## 📚 다음 단계

### 단기 (1개월)
- [ ] 커뮤니티 100명 달성
- [ ] 일일 자동 리포트 안정화
- [ ] FAQ 50개 이상 축적
- [ ] 프리미엄 전환율 5% 달성

### 중기 (3개월)
- [ ] 커뮤니티 500명 달성
- [ ] 실시간 대시보드 구축
- [ ] AI 챗봇 자동 응답 시스템
- [ ] 커뮤니티 레벨/배지 시스템

### 장기 (6개월)
- [ ] 커뮤니티 1,000명+ 달성
- [ ] 다국어 커뮤니티 (일본, 영어)
- [ ] 커뮤니티 주도 콘텐츠 생성
- [ ] 오프라인 이벤트 연계

---

## 🔗 관련 문서

- [카카오톡 오픈채팅 자동화 가이드](../KAKAO_OPENCHAT_AUTOMATION.md)
- [n8n 워크플로 예제](./N8N_WORKFLOW_EXAMPLE.md)
- [카카오톡 파싱 스크립트](./KAKAO_PARSER_SCRIPT.md)
- [마케팅 전략](../../marketing/README.md)
- [프론트엔드 요구사항](../FRONTEND_REQUIREMENTS.md)

---

**작성자**: Development Team
**최종 업데이트**: 2025-11-13
**상태**: 완성 ✅ | 실전 배포 준비 완료 ✅

**문의**: aimihigh9@gmail.com
