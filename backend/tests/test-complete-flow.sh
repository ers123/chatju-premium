#!/bin/bash
# backend/tests/test-complete-flow.sh
# 전체 Flow 테스트: Mock Payment → Saju Calculation → AI Interpretation

echo "🧪 ChatJu Premium - Complete Flow Test"
echo "========================================"
echo ""

# 서버 URL
API_URL="http://localhost:3000"

# 1. Health Check
echo "📍 Step 1: Health Check"
curl -s $API_URL/ | jq '.message'
echo ""

# 2. Mock Payment 생성
echo "📍 Step 2: Create Mock Payment"
ORDER_ID="ORD-test-$(date +%s)"
echo "Order ID: $ORDER_ID"

PAYMENT_RESPONSE=$(curl -s -X POST $API_URL/payment/mock/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"amount\": 13000
  }")

echo "$PAYMENT_RESPONSE" | jq '.'
echo ""

# 3. Saju 계산 요청
echo "📍 Step 3: Request Saju Reading"
SAJU_RESPONSE=$(curl -s -X POST $API_URL/saju/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"birthDate\": \"1990-05-15\",
    \"birthTime\": \"14:30\",
    \"gender\": \"male\",
    \"language\": \"ko\",
    \"subjectName\": \"홍길동\"
  }")

echo "$SAJU_RESPONSE" | jq '.'
echo ""

# 4. 결과 검증
echo "📍 Step 4: Validation"

# Reading ID 확인
READING_ID=$(echo "$SAJU_RESPONSE" | jq -r '.readingId')
if [ "$READING_ID" != "null" ]; then
  echo "✅ Reading ID: $READING_ID"
else
  echo "❌ Reading ID not found"
fi

# Manseryeok 확인
YEAR_PILLAR=$(echo "$SAJU_RESPONSE" | jq -r '.manseryeok.pillars.year.korean')
if [ "$YEAR_PILLAR" != "null" ]; then
  echo "✅ Year Pillar: $YEAR_PILLAR"
else
  echo "❌ Manseryeok data not found"
fi

# AI Interpretation 확인
AI_TEXT=$(echo "$SAJU_RESPONSE" | jq -r '.aiInterpretation.fullText')
if [ "$AI_TEXT" != "null" ] && [ "$AI_TEXT" != "" ]; then
  echo "✅ AI Interpretation generated (${#AI_TEXT} characters)"
else
  echo "❌ AI Interpretation not found"
fi

echo ""
echo "========================================"
echo "✅ Complete Flow Test Finished"
echo "========================================"
