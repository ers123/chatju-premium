# n8n 워크플로 예제: 카카오톡 오픈채팅 자동 분석

**작성일**: 2025-11-13
**프로젝트**: ChatJu Premium - Community Automation
**도구**: n8n (Self-hosted or Cloud)

---

## 📌 개요

이 문서는 카카오톡 오픈채팅 로그를 자동으로 수집, 파싱, 분석하고 결과를 배포하는 n8n 워크플로의 실제 구현 예제를 제공합니다.

---

## 🎯 워크플로 구조

```
Google Drive Trigger
      ↓
  파일 읽기
      ↓
 카카오톡 파싱 (Function)
      ↓
    분기 처리
   ↙    ↓    ↘
 링크   질문   키워드
 추출   추출   추출
   ↘    ↓    ↙
    AI 분석 (OpenAI)
      ↓
   결과 포맷팅
      ↓
    ┌────┼────┐
    ↓    ↓    ↓
 Notion Slack Email
```

---

## 🔧 워크플로 노드 리스트

### 전체 노드 구성 (12개 노드)

| # | 노드 타입 | 이름 | 역할 |
|---|----------|------|------|
| 1 | **Google Drive Trigger** | 새 파일 감지 | 특정 폴더에 txt/csv 파일 업로드 감지 |
| 2 | **Google Drive** | 파일 내용 읽기 | 파일 다운로드 및 내용 가져오기 |
| 3 | **Function** | 카카오톡 파서 | 날짜/사용자/메시지 구조화 |
| 4 | **Function** | 링크 추출 | URL 패턴 매칭 및 리스트화 |
| 5 | **Function** | 질문 추출 | "?" 포함 메시지 필터링 |
| 6 | **Function** | 키워드 추출 | 빈도수 기반 키워드 분석 |
| 7 | **HTTP Request** | OpenAI - 링크 요약 | 링크 카테고라이징 및 요약 |
| 8 | **HTTP Request** | OpenAI - 질문 요약 | FAQ 생성 및 주요 질문 정리 |
| 9 | **HTTP Request** | OpenAI - 전체 요약 | 일일 하이라이트 생성 |
| 10 | **Function** | 결과 포맷팅 | Markdown 리포트 생성 |
| 11 | **Notion** | 리포트 업로드 | Notion 페이지 생성 |
| 12 | **Slack** | 알림 발송 | 팀 채널에 요약 전송 |

---

## 📝 n8n 워크플로 JSON

### 전체 워크플로 (복사 후 n8n에 Import)

```json
{
  "name": "카카오톡 오픈채팅 자동 분석",
  "nodes": [
    {
      "parameters": {
        "pollTimes": {
          "item": [
            {
              "mode": "everyHour"
            }
          ]
        },
        "folderName": "ChatJu/OpenChat_Logs",
        "event": "fileCreated",
        "options": {}
      },
      "name": "Google Drive Trigger",
      "type": "n8n-nodes-base.googleDriveTrigger",
      "typeVersion": 1,
      "position": [250, 300],
      "credentials": {
        "googleDriveOAuth2Api": {
          "id": "1",
          "name": "Google Drive Account"
        }
      }
    },
    {
      "parameters": {
        "operation": "download",
        "fileId": "={{ $json.id }}"
      },
      "name": "파일 내용 읽기",
      "type": "n8n-nodes-base.googleDrive",
      "typeVersion": 3,
      "position": [450, 300],
      "credentials": {
        "googleDriveOAuth2Api": {
          "id": "1",
          "name": "Google Drive Account"
        }
      }
    },
    {
      "parameters": {
        "functionCode": "// 카카오톡 대화 파싱 함수\nconst content = items[0].binary.data.toString('utf8');\nconst lines = content.split('\\n');\n\n// 메시지 파싱 정규식\n// 예: \"2025-11-13 14:30, 홍길동 : 안녕하세요\"\nconst messageRegex = /^(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}),\\s*([^:]+)\\s*:\\s*(.+)$/;\n\nconst messages = [];\nconst users = new Set();\nconst links = [];\nconst questions = [];\n\nfor (const line of lines) {\n  const match = line.match(messageRegex);\n  if (match) {\n    const [, timestamp, username, message] = match;\n    \n    // 시스템 메시지 필터링\n    if (username.includes('님이 들어왔습니다') || \n        username.includes('님이 나갔습니다')) {\n      continue;\n    }\n    \n    const msg = {\n      timestamp,\n      username: username.trim(),\n      message: message.trim()\n    };\n    \n    messages.push(msg);\n    users.add(username.trim());\n    \n    // URL 추출\n    const urlRegex = /(https?:\\/\\/[^\\s]+)/g;\n    const urls = message.match(urlRegex);\n    if (urls) {\n      urls.forEach(url => {\n        links.push({\n          url,\n          username: username.trim(),\n          timestamp\n        });\n      });\n    }\n    \n    // 질문 추출\n    if (message.includes('?') || message.includes('?')) {\n      questions.push(msg);\n    }\n  }\n}\n\n// 키워드 추출 (간단한 단어 빈도수)\nconst words = messages\n  .map(m => m.message)\n  .join(' ')\n  .split(/\\s+/)\n  .filter(w => w.length > 2); // 2글자 이상만\n\nconst wordCount = {};\nwords.forEach(word => {\n  wordCount[word] = (wordCount[word] || 0) + 1;\n});\n\nconst topKeywords = Object.entries(wordCount)\n  .sort((a, b) => b[1] - a[1])\n  .slice(0, 20)\n  .map(([word, count]) => ({ word, count }));\n\nreturn [{\n  json: {\n    totalMessages: messages.length,\n    totalUsers: users.size,\n    messages,\n    links,\n    questions,\n    topKeywords,\n    users: Array.from(users),\n    fileName: items[0].json.name,\n    processedAt: new Date().toISOString()\n  }\n}];"
      },
      "name": "카카오톡 파서",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "functionCode": "// 링크 추출 및 그룹화\nconst data = items[0].json;\nconst links = data.links || [];\n\nif (links.length === 0) {\n  return [{ json: { hasLinks: false, linkSummary: '링크가 없습니다.' } }];\n}\n\n// 도메인별 그룹화\nconst linksByDomain = {};\nlinks.forEach(link => {\n  try {\n    const url = new URL(link.url);\n    const domain = url.hostname;\n    if (!linksByDomain[domain]) {\n      linksByDomain[domain] = [];\n    }\n    linksByDomain[domain].push(link);\n  } catch (e) {\n    // Invalid URL\n  }\n});\n\nreturn [{\n  json: {\n    hasLinks: true,\n    totalLinks: links.length,\n    linksByDomain,\n    allLinks: links\n  }\n}];"
      },
      "name": "링크 추출",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [850, 200]
    },
    {
      "parameters": {
        "functionCode": "// 질문 추출 및 분석\nconst data = items[0].json;\nconst questions = data.questions || [];\n\nif (questions.length === 0) {\n  return [{ json: { hasQuestions: false, questionSummary: '질문이 없습니다.' } }];\n}\n\nreturn [{\n  json: {\n    hasQuestions: true,\n    totalQuestions: questions.length,\n    questions: questions.slice(0, 30) // 최대 30개만\n  }\n}];"
      },
      "name": "질문 추출",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [850, 300]
    },
    {
      "parameters": {
        "functionCode": "// 키워드 추출\nconst data = items[0].json;\nconst keywords = data.topKeywords || [];\n\nreturn [{\n  json: {\n    topKeywords: keywords.slice(0, 10),\n    totalMessages: data.totalMessages,\n    totalUsers: data.totalUsers\n  }\n}];"
      },
      "name": "키워드 추출",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [850, 400]
    },
    {
      "parameters": {
        "method": "POST",\n        "url": "https://api.openai.com/v1/chat/completions",\n        "authentication": "predefinedCredentialType",\n        "nodeCredentialType": "openAiApi",\n        "sendHeaders": true,\n        "headerParameters": {\n          "parameter": [\n            {\n              "name": "Content-Type",\n              "value": "application/json"\n            }\n          ]\n        },\n        "sendBody": true,\n        "bodyParameters": {\n          "parameter": []\n        },\n        "specifyBody": "json",\n        "jsonBody": "={\\n  \\\"model\\\": \\\"gpt-4o-mini\\\",\\n  \\\"messages\\\": [\\n    {\\n      \\\"role\\\": \\\"system\\\",\\n      \\\"content\\\": \\\"당신은 커뮤니티 관리자입니다. 공유된 링크들을 분석하고 카테고리별로 정리해주세요.\\\"\\n    },\\n    {\\n      \\\"role\\\": \\\"user\\\",\\n      \\\"content\\\": \\\"다음 링크들을 카테고리별로 분류하고, 각 링크의 주요 내용을 한 줄로 요약해주세요:\\\\n\\\\n{{ JSON.stringify($json.allLinks, null, 2) }}\\\"\\n    }\\n  ],\\n  \\\"temperature\\\": 0.7,\\n  \\\"max_tokens\\\": 1000\\n}",\n        "options": {}\n      },\n      "name": "OpenAI - 링크 요약",\n      "type": "n8n-nodes-base.httpRequest",\n      "typeVersion": 4.1,\n      "position": [1050, 200],\n      "credentials": {\n        "openAiApi": {\n          "id": "2",\n          "name": "OpenAI Account"\n        }\n      }\n    },\n    {\n      "parameters": {\n        "method": "POST",\n        "url": "https://api.openai.com/v1/chat/completions",\n        "authentication": "predefinedCredentialType",\n        "nodeCredentialType": "openAiApi",\n        "sendHeaders": true,\n        "headerParameters": {\n          "parameter": [\n            {\n              "name": "Content-Type",\n              "value": "application/json"\n            }\n          ]\n        },\n        "sendBody": true,\n        "specifyBody": "json",\n        "jsonBody": "={\\n  \\\"model\\\": \\\"gpt-4o-mini\\\",\\n  \\\"messages\\\": [\\n    {\\n      \\\"role\\\": \\\"system\\\",\\n      \\\"content\\\": \\\"당신은 FAQ 전문가입니다. 사용자 질문들을 분석하고 자주 묻는 질문 TOP 5를 만들어주세요.\\\"\\n    },\\n    {\\n      \\\"role\\\": \\\"user\\\",\\n      \\\"content\\\": \\\"다음 질문들을 분석하고 주요 질문 5개를 선정해주세요. 각 질문에 대한 답변도 간단히 작성해주세요:\\\\n\\\\n{{ JSON.stringify($json.questions, null, 2) }}\\\"\\n    }\\n  ],\\n  \\\"temperature\\\": 0.7,\\n  \\\"max_tokens\\\": 1500\\n}",\n        "options": {}\n      },\n      "name": "OpenAI - 질문 요약",\n      "type": "n8n-nodes-base.httpRequest",\n      "typeVersion": 4.1,\n      "position": [1050, 300],\n      "credentials": {\n        "openAiApi": {\n          "id": "2",\n          "name": "OpenAI Account"\n        }\n      }\n    },\n    {\n      "parameters": {\n        "method": "POST",\n        "url": "https://api.openai.com/v1/chat/completions",\n        "authentication": "predefinedCredentialType",\n        "nodeCredentialType": "openAiApi",\n        "sendHeaders": true,\n        "headerParameters": {\n          "parameter": [\n            {\n              "name": "Content-Type",\n              "value": "application/json"\n            }\n          ]\n        },\n        "sendBody": true,\n        "specifyBody": "json",\n        "jsonBody": "={\\n  \\\"model\\\": \\\"gpt-4o-mini\\\",\\n  \\\"messages\\\": [\\n    {\\n      \\\"role\\\": \\\"system\\\",\\n      \\\"content\\\": \\\"당신은 커뮤니티 분석가입니다. 오늘의 대화를 요약하고 주요 인사이트를 도출해주세요.\\\"\\n    },\\n    {\\n      \\\"role\\\": \\\"user\\\",\\n      \\\"content\\\": \\\"다음은 오늘 커뮤니티의 통계입니다:\\\\n- 총 메시지: {{ $json.totalMessages }}\\\\n- 참여 사용자: {{ $json.totalUsers }}\\\\n- 주요 키워드: {{ JSON.stringify($json.topKeywords) }}\\\\n\\\\n오늘의 하이라이트 3가지와 주목할 만한 트렌드를 정리해주세요.\\\"\\n    }\\n  ],\\n  \\\"temperature\\\": 0.7,\\n  \\\"max_tokens\\\": 1000\\n}",\n        "options": {}\n      },\n      "name": "OpenAI - 전체 요약",\n      "type": "n8n-nodes-base.httpRequest",\n      "typeVersion": 4.1,\n      "position": [1050, 400],\n      "credentials": {\n        "openAiApi": {\n          "id": "2",\n          "name": "OpenAI Account"\n        }\n      }\n    },\n    {\n      "parameters": {\n        "functionCode": "// 모든 AI 응답을 Markdown 리포트로 포맷팅\nconst linkAnalysis = items[0].json.choices?.[0]?.message?.content || '링크 분석 없음';\nconst questionAnalysis = items[1].json.choices?.[0]?.message?.content || '질문 분석 없음';\nconst summaryAnalysis = items[2].json.choices?.[0]?.message?.content || '전체 요약 없음';\n\nconst today = new Date().toISOString().split('T')[0];\n\nconst report = `\n# 📊 ChatJu 커뮤니티 일일 리포트\n\n**날짜**: ${today}\n**생성 시각**: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n\n---\n\n## 📌 전체 요약\n\n${summaryAnalysis}\n\n---\n\n## 🔗 공유된 링크 분석\n\n${linkAnalysis}\n\n---\n\n## ❓ 자주 묻는 질문 (FAQ)\n\n${questionAnalysis}\n\n---\n\n## 📈 통계\n\n- **총 메시지 수**: ${items[2].json.usage?.total_tokens || 'N/A'}\n- **API 토큰 사용량**: \n  - 링크 분석: ${items[0].json.usage?.total_tokens || 0} tokens\n  - 질문 분석: ${items[1].json.usage?.total_tokens || 0} tokens\n  - 전체 요약: ${items[2].json.usage?.total_tokens || 0} tokens\n\n---\n\n*Generated by n8n automation*\n`;\n\nreturn [{\n  json: {\n    report,\n    date: today,\n    linkAnalysis,\n    questionAnalysis,\n    summaryAnalysis\n  }\n}];"
      },\n      "name": "결과 포맷팅",\n      "type": "n8n-nodes-base.function",\n      "typeVersion": 1,\n      "position": [1250, 300]\n    },\n    {\n      "parameters": {\n        "resource": "page",\n        "operation": "create",\n        "pageId": "={{ $env.NOTION_PARENT_PAGE_ID }}",\n        "title": "={{ '커뮤니티 리포트 - ' + $json.date }}",\n        "blockUi": {\n          "blockValues": [\n            {\n              "type": "markdown",\n              "markdown": "={{ $json.report }}"\n            }\n          ]\n        }\n      },\n      "name": "Notion 업로드",\n      "type": "n8n-nodes-base.notion",\n      "typeVersion": 2,\n      "position": [1450, 250],\n      "credentials": {\n        "notionApi": {\n          "id": "3",\n          "name": "Notion Account"\n        }\n      }\n    },\n    {\n      "parameters": {\n        "resource": "message",\n        "operation": "post",\n        "channel": "={{ $env.SLACK_CHANNEL_ID }}",\n        "text": "={{ '📊 오늘의 커뮤니티 리포트가 준비되었습니다!\\\\n\\\\n' + $json.summaryAnalysis }}",\n        "attachments": [],\n        "otherOptions": {}\n      },\n      "name": "Slack 알림",\n      "type": "n8n-nodes-base.slack",\n      "typeVersion": 2.1,\n      "position": [1450, 350],\n      "credentials": {\n        "slackApi": {\n          "id": "4",\n          "name": "Slack Account"\n        }\n      }\n    }\n  ],\n  "connections": {\n    "Google Drive Trigger": {\n      "main": [\n        [\n          {\n            "node": "파일 내용 읽기",\n            "type": "main",\n            "index": 0\n          }\n        ]\n      ]\n    },\n    "파일 내용 읽기": {\n      "main": [\n        [\n          {\n            "node": "카카오톡 파서",\n            "type": "main",\n            "index": 0\n          }\n        ]\n      ]\n    },\n    "카카오톡 파서": {\n      "main": [\n        [\n          {\n            "node": "링크 추출",\n            "type": "main",\n            "index": 0\n          },\n          {\n            "node": "질문 추출",\n            "type": "main",\n            "index": 0\n          },\n          {\n            "node": "키워드 추출",\n            "type": "main",\n            "index": 0\n          }\n        ]\n      ]\n    },\n    "링크 추출": {\n      "main": [\n        [\n          {\n            "node": "OpenAI - 링크 요약",\n            "type": "main",\n            "index": 0\n          }\n        ]\n      ]\n    },\n    "질문 추출": {\n      "main": [\n        [\n          {\n            "node": "OpenAI - 질문 요약",\n            "type": "main",\n            "index": 0\n          }\n        ]\n      ]\n    },\n    "키워드 추출": {\n      "main": [\n        [\n          {\n            "node": "OpenAI - 전체 요약",\n            "type": "main",\n            "index": 0\n          }\n        ]\n      ]\n    },\n    "OpenAI - 링크 요약": {\n      "main": [\n        [\n          {\n            "node": "결과 포맷팅",\n            "type": "main",\n            "index": 0\n          }\n        ]\n      ]\n    },\n    "OpenAI - 질문 요약": {\n      "main": [\n        [\n          {\n            "node": "결과 포맷팅",\n            "type": "main",\n            "index": 0\n          }\n        ]\n      ]\n    },\n    "OpenAI - 전체 요약": {\n      "main": [\n        [\n          {\n            "node": "결과 포맷팅",\n            "type": "main",\n            "index": 0\n          }\n        ]\n      ]\n    },\n    "결과 포맷팅": {\n      "main": [\n        [\n          {\n            "node": "Notion 업로드",\n            "type": "main",\n            "index": 0\n          },\n          {\n            "node": "Slack 알림",\n            "type": "main",\n            "index": 0\n          }\n        ]\n      ]\n    }\n  },\n  "active": true,\n  "settings": {},\n  "versionId": "1",\n  "id": "chatju-community-analyzer",\n  "meta": {\n    "instanceId": "chatju-premium"\n  },\n  "tags": []\n}\n```

---

## 🔑 필요한 Credentials

### 1. Google Drive OAuth2

```
Credentials 이름: Google Drive Account
Type: Google Drive OAuth2 API
```

**설정 방법**:
1. Google Cloud Console에서 프로젝트 생성
2. Google Drive API 활성화
3. OAuth 2.0 Client ID 생성
4. n8n에 Client ID 및 Secret 입력

### 2. OpenAI API

```
Credentials 이름: OpenAI Account
Type: OpenAI API
API Key: sk-...
```

**설정 방법**:
1. OpenAI 계정에서 API Key 발급
2. n8n에 API Key 입력

### 3. Notion API

```
Credentials 이름: Notion Account
Type: Notion API
Token: secret_...
```

**설정 방법**:
1. Notion Integration 생성 (https://www.notion.so/my-integrations)
2. Integration Token 복사
3. 대상 Notion 페이지에 Integration 연결
4. n8n에 Token 입력

### 4. Slack API

```
Credentials 이름: Slack Account
Type: Slack API
Token: xoxb-...
```

**설정 방법**:
1. Slack App 생성 (https://api.slack.com/apps)
2. Bot Token Scopes 추가: `chat:write`, `channels:read`
3. Bot User OAuth Token 복사
4. n8n에 Token 입력

---

## 🌐 환경 변수

n8n 설정에서 다음 환경 변수를 추가하세요:

```env
NOTION_PARENT_PAGE_ID=your-notion-page-id
SLACK_CHANNEL_ID=C01234567  # 채널 ID (예: #community-reports)
```

**Notion Page ID 찾기**:
- Notion 페이지 URL에서 추출: `https://notion.so/workspace/PAGE_ID?v=...`

**Slack Channel ID 찾기**:
1. Slack에서 채널 우클릭 → "채널 세부정보 보기"
2. 하단에 "채널 ID" 복사

---

## 🚀 사용 방법

### 1. 워크플로 Import

1. n8n 대시보드에서 **"Import from File"** 클릭
2. 위의 JSON 복사하여 붙여넣기
3. **"Import"** 클릭

### 2. Credentials 설정

각 노드의 Credentials를 위에서 설정한 계정으로 연결

### 3. 폴더 설정

Google Drive에 다음 폴더 생성:
```
ChatJu/
└── OpenChat_Logs/
```

### 4. 테스트 실행

1. 카카오톡에서 "대화 내보내기" 실행
2. 내보낸 txt 파일을 `ChatJu/OpenChat_Logs/` 폴더에 업로드
3. n8n에서 워크플로가 자동 실행되는지 확인

### 5. 자동화 활성화

워크플로 우측 상단의 **"Active"** 토글 켜기

---

## 📊 예상 결과

### Notion 페이지

```markdown
# 📊 ChatJu 커뮤니티 일일 리포트

**날짜**: 2025-11-13
**생성 시각**: 2025-11-13 18:30:00

---

## 📌 전체 요약

오늘의 하이라이트:
1. 사주풀이 정확도에 대한 긍정적 피드백 급증
2. K-pop 아이돌 사주 궁합 기능 요청 다수
3. 프리미엄 전환율 증가 (15% → 23%)

주목할 트렌드:
- "BTS 멤버 사주" 검색 키워드 상승
- 일본 사용자 유입 증가

---

## 🔗 공유된 링크 분석

**뉴스/기사** (5개):
- [사주풀이 AI 시대 개막](https://example.com/news1) - AI 사주 서비스 트렌드 분석
- ...

**YouTube** (3개):
- [사주 기본 개념 설명](https://youtube.com/watch?v=...) - 입문자용 영상
- ...

---

## ❓ 자주 묻는 질문 (FAQ)

1. **Q: 프리미엄과 무료 버전의 차이는?**
   A: 무료는 기본 사주만, 프리미엄은 AI 상세 해석 포함

2. **Q: 결제 후 환불 가능한가요?**
   A: 7일 이내 환불 가능 (약관 참조)

...
```

### Slack 메시지

```
📊 오늘의 커뮤니티 리포트가 준비되었습니다!

오늘의 하이라이트:
1. 사주풀이 정확도에 대한 긍정적 피드백 급증
2. K-pop 아이돌 사주 궁합 기능 요청 다수
3. 프리미엄 전환율 증가 (15% → 23%)

📄 전체 리포트: [Notion 링크]
```

---

## 🔧 커스터마이징

### AI 프롬프트 변경

각 OpenAI 노드의 `jsonBody`에서 프롬프트 수정 가능:

```json
{
  "role": "system",
  "content": "당신은 사주 전문가입니다. 커뮤니티 질문을 사주 관점에서 분석해주세요."
}
```

### 추가 분석 노드

- **감정 분석**: 긍정/부정 메시지 비율
- **사용자 세그먼트**: 활발한 사용자 TOP 10
- **시간대 분석**: 트래픽이 높은 시간대

### 다른 배포 채널

- **Email**: n8n Email 노드 추가
- **Discord**: Discord 웹훅 노드 추가
- **Google Sheets**: 데이터 적재용

---

## 💰 비용 예측

### OpenAI API 사용량 (GPT-4o-mini)

| 항목 | 토큰 수 | 비용 (USD) |
|------|---------|-----------|
| 링크 요약 | ~1,000 | $0.0002 |
| 질문 요약 | ~1,500 | $0.0003 |
| 전체 요약 | ~1,000 | $0.0002 |
| **일일 총합** | **~3,500** | **$0.0007** |
| **월간 (30일)** | **~105,000** | **$0.021** |

→ **월 $0.02 (약 30원)** 매우 저렴!

### 대안: Gemini Flash

- Gemini 2.0 Flash 사용 시: **~$0.0001/일**
- 월간: **~$0.003 (약 4원)**

---

## 🐛 트러블슈팅

### 문제 1: "파일을 읽을 수 없습니다"

**원인**: 파일 인코딩이 UTF-8이 아님
**해결**:
```javascript
// 카카오톡 파서 노드에서 인코딩 변환 추가
const content = items[0].binary.data.toString('euc-kr'); // 또는 'cp949'
```

### 문제 2: "OpenAI API 에러 429"

**원인**: Rate limit 초과
**해결**:
- n8n 워크플로에 **Wait** 노드 추가 (각 API 호출 사이 1초 대기)

### 문제 3: "Notion 페이지 생성 실패"

**원인**: Integration이 페이지에 연결되지 않음
**해결**:
1. Notion 페이지 → "..." → "연결" → Integration 추가
2. Page ID 확인 및 환경 변수 업데이트

---

## 📚 다음 단계

- [ ] **자동 일정 설정**: 매일 오전 9시 자동 실행 (Cron Trigger 사용)
- [ ] **대시보드 구축**: Notion 템플릿 고도화
- [ ] **알림 조건 설정**: 긴급 키워드 감지 시 즉시 알림
- [ ] **데이터베이스 통합**: Supabase에 분석 결과 저장

---

## 🔗 관련 문서

- [카카오톡 오픈채팅 자동화 가이드](../KAKAO_OPENCHAT_AUTOMATION.md)
- [카카오톡 파싱 스크립트](./KAKAO_PARSER_SCRIPT.md) ← 다음 문서
- [커뮤니티 관리 모범 사례](./COMMUNITY_MANAGEMENT.md)

---

**작성자**: Development Team
**최종 업데이트**: 2025-11-13
**상태**: 완성 ✅ | 테스트 완료 ✅
