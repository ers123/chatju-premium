# Level 7 Setup Guide - Real Payment Integration

**Document Version**: 1.0
**Date**: November 10, 2025
**Purpose**: Guide for implementing real payment processing with Toss Payments and Stripe

---

## Overview

Level 7 implements real payment gateway integration for ChatJu Premium, supporting:
- **Toss Payments** - For Korean users (KRW)
- **Stripe** - For international users (USD, EUR, etc.)
- **Webhook handling** - For payment confirmations
- **Payment history** - Track all user payments

---

## Prerequisites

- ✅ Level 6 completed (Authentication with Supabase Auth)
- ✅ Supabase database with payments table
- ✅ Backend server running
- ✅ axios and stripe npm packages installed

---

## Part 1: Toss Payments Setup (Korean Users)

### 1.1 Create Toss Payments Account

1. Go to [Toss Payments Developer](https://developers.tosspayments.com)
2. Sign up for developer account
3. Complete business verification (for production)
4. Access Dashboard

### 1.2 Get API Keys

1. Navigate to **Settings** → **API Keys**
2. Copy your credentials:
   - **Client Key** (test_ck_...)
   - **Secret Key** (test_sk_...)

### 1.3 Configure Environment Variables

Add to `.env`:
```
TOSS_CLIENT_KEY=test_ck_your_key_here
TOSS_SECRET_KEY=test_sk_your_key_here
FRONTEND_URL=https://chatju.pages.dev
```

### 1.4 Test Toss Payment Flow

**Create payment order:**
```bash
curl -X POST http://localhost:3000/payment/toss/create \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 13000,
    "orderName": "사주팔자 프리미엄 해석"
  }'
```

**Response:**
```json
{
  "success": true,
  "orderId": "ord_1699999999_abc123",
  "paymentId": "uuid",
  "amount": 13000,
  "currency": "KRW",
  "tossConfig": {
    "clientKey": "test_ck_...",
    "orderId": "ord_...",
    "orderName": "사주팔자 프리미엄 해석",
    "amount": 13000,
    "successUrl": "https://chatju.pages.dev/payment/success",
    "failUrl": "https://chatju.pages.dev/payment/fail"
  }
}
```

### 1.5 Integrate Toss Payments Widget (Frontend)

In your frontend code:
```javascript
// Load Toss Payments SDK
const tossPayments = TossPayments(clientKey);

// Create payment
const response = await fetch('/payment/toss/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 13000,
    orderName: '사주팔자 프리미엄 해석'
  })
});

const { tossConfig } = await response.json();

// Show payment widget
await tossPayments.requestPayment('카드', {
  amount: tossConfig.amount,
  orderId: tossConfig.orderId,
  orderName: tossConfig.orderName,
  successUrl: tossConfig.successUrl,
  failUrl: tossConfig.failUrl
});
```

### 1.6 Handle Payment Success

When user completes payment, Toss redirects to `successUrl` with query params:
- `paymentKey` - Toss payment identifier
- `orderId` - Your order ID
- `amount` - Payment amount

**Confirm payment:**
```javascript
// In your success page
const urlParams = new URLSearchParams(window.location.search);
const paymentKey = urlParams.get('paymentKey');
const orderId = urlParams.get('orderId');
const amount = urlParams.get('amount');

// Confirm with backend
const response = await fetch('/payment/toss/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ paymentKey, orderId, amount })
});

if (response.ok) {
  // Payment confirmed! Show success message
  console.log('Payment successful!');
}
```

### 1.7 Configure Webhook

1. Go to Toss Dashboard → **Settings** → **Webhooks**
2. Add webhook URL: `https://your-api.com/payment/toss/webhook`
3. Select events:
   - ✅ Payment completed
   - ✅ Payment failed
   - ✅ Payment cancelled
4. Save and test webhook

---

## Part 2: Stripe Setup (International Users)

### 2.1 Create Stripe Account

1. Go to [Stripe](https://stripe.com)
2. Sign up for account
3. Complete business verification
4. Access Dashboard

### 2.2 Get API Keys

1. Navigate to **Developers** → **API Keys**
2. Copy your credentials:
   - **Publishable Key** (pk_test_...)
   - **Secret Key** (sk_test_...)

### 2.3 Configure Environment Variables

Add to `.env`:
```
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 2.4 Test Stripe Payment Flow

**Create payment intent:**
```bash
curl -X POST http://localhost:3000/payment/stripe/create \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "description": "Premium Fortune Reading"
  }'
```

**Response:**
```json
{
  "success": true,
  "orderId": "ord_1699999999_abc123",
  "paymentId": "uuid",
  "amount": 1000,
  "currency": "USD",
  "clientSecret": "pi_xxx_secret_xxx",
  "publishableKey": "pk_test_..."
}
```

### 2.5 Integrate Stripe Elements (Frontend)

In your frontend code:
```javascript
// Load Stripe.js
const stripe = Stripe(publishableKey);

// Create payment
const response = await fetch('/payment/stripe/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 1000, // $10.00 in cents
    description: 'Premium Fortune Reading'
  })
});

const { clientSecret } = await response.json();

// Show Stripe payment form
const { error, paymentIntent } = await stripe.confirmCardPayment(
  clientSecret,
  {
    payment_method: {
      card: cardElement, // Stripe card element
      billing_details: { name: 'User Name' }
    }
  }
);

if (error) {
  console.error('Payment failed:', error);
} else if (paymentIntent.status === 'succeeded') {
  console.log('Payment successful!');
}
```

### 2.6 Configure Webhook

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Add endpoint: `https://your-api.com/payment/stripe/webhook`
3. Select events:
   - ✅ payment_intent.succeeded
   - ✅ payment_intent.payment_failed
4. Copy webhook secret: `whsec_...`
5. Add to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

---

## Part 3: API Endpoints Reference

### Toss Payments Endpoints

#### POST /payment/toss/create
Create Toss payment order

**Headers:**
- Authorization: Bearer {access_token}

**Body:**
```json
{
  "amount": 13000,
  "orderName": "사주팔자 프리미엄 해석"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "ord_...",
  "paymentId": "uuid",
  "amount": 13000,
  "currency": "KRW",
  "tossConfig": { ... }
}
```

#### POST /payment/toss/confirm
Confirm Toss payment after user approval

**Body:**
```json
{
  "paymentKey": "payment_key_from_toss",
  "orderId": "ord_...",
  "amount": 13000
}
```

**Response:**
```json
{
  "success": true,
  "payment": { ... },
  "tossPayment": { ... }
}
```

#### POST /payment/toss/webhook
Webhook for Toss payment events (called by Toss)

### Stripe Endpoints

#### POST /payment/stripe/create
Create Stripe payment intent

**Headers:**
- Authorization: Bearer {access_token}

**Body:**
```json
{
  "amount": 1000,
  "description": "Premium Fortune Reading"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "ord_...",
  "paymentId": "uuid",
  "amount": 1000,
  "currency": "USD",
  "clientSecret": "pi_xxx_secret_xxx",
  "publishableKey": "pk_test_..."
}
```

#### POST /payment/stripe/webhook
Webhook for Stripe events (called by Stripe)

### Common Endpoints

#### GET /payment/:orderId
Get payment status by order ID

**Headers:**
- Authorization: Bearer {access_token}

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "order_id": "ord_...",
    "user_id": "uuid",
    "amount": 13000,
    "currency": "KRW",
    "status": "completed",
    "payment_method": "toss",
    "created_at": "2025-11-10T...",
    "confirmed_at": "2025-11-10T..."
  }
}
```

#### GET /payment/history/me
Get current user's payment history

**Headers:**
- Authorization: Bearer {access_token}

**Response:**
```json
{
  "success": true,
  "count": 5,
  "payments": [
    { ... },
    { ... }
  ]
}
```

---

## Part 4: Testing

### 4.1 Test with Test Cards

**Toss Payments Test Cards:**
- Card number: `4500990000000086`
- Expiry: Any future date
- CVC: Any 3 digits

**Stripe Test Cards:**
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Expiry: Any future date
- CVC: Any 3 digits

### 4.2 Run Level 7 Tests

```bash
npm test tests/test-level7-payments.js
```

Expected output:
```
✅ Tests Passed: 9/9
✅ LEVEL 7 SETUP COMPLETE!
```

---

## Part 5: Production Checklist

### Before Going Live

- [ ] Replace test API keys with live keys
- [ ] Configure webhooks with production URLs
- [ ] Test with real payment methods
- [ ] Set up SSL/HTTPS for all endpoints
- [ ] Enable webhook signature verification
- [ ] Set up payment failure notifications
- [ ] Configure refund handling
- [ ] Add rate limiting to payment endpoints
- [ ] Set up payment monitoring and alerts
- [ ] Test currency conversions (if applicable)
- [ ] Review and comply with PCI DSS requirements
- [ ] Add payment receipt emails
- [ ] Test webhook reliability

---

## Troubleshooting

### Issue: "Payment not found"
**Solution:** Check that payment was created successfully and order_id matches

### Issue: "Invalid client key"
**Solution:** Verify TOSS_CLIENT_KEY in .env is correct

### Issue: "Stripe webhook signature verification failed"
**Solution:** Ensure STRIPE_WEBHOOK_SECRET is configured correctly

### Issue: "Payment confirmation failed"
**Solution:** Check that amount matches exactly (no floating point issues)

---

## Security Best Practices

1. **Never expose secret keys** to frontend
2. **Always verify webhook signatures** in production
3. **Validate payment amounts** on backend before confirming
4. **Use HTTPS** for all payment-related endpoints
5. **Log all payment attempts** for auditing
6. **Implement rate limiting** on payment endpoints
7. **Store sensitive data encrypted** in database
8. **Use environment variables** for all credentials
9. **Test in sandbox/test mode** before going live
10. **Monitor for suspicious payment patterns**

---

## Next Steps

After Level 7 is complete:

1. **Frontend Integration**: Add payment UI to chatju.pages.dev
2. **Receipt Generation**: Create payment receipts
3. **Refund System**: Implement refund handling
4. **Payment Analytics**: Track conversion rates
5. **Multi-currency Support**: Add more currencies
6. **Subscription Model**: Implement recurring payments (optional)
7. **Production Deployment**: Deploy to AWS Lambda

---

**Status**: Ready for Implementation
**Last Updated**: November 10, 2025
**Next**: Get payment gateway credentials and test!
