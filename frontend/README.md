# ChatJu Premium - Frontend

**사주팔자 (Saju) AI Fortune-Telling Platform - Frontend Application**

Built with Next.js 14, TypeScript, Tailwind CSS, and Korean-inspired modern minimalist design.

---

## 🌟 Features

- **FREE Saju Preview**: Get a glimpse of your destiny (Four Pillars + short interpretation)
- **Premium Full Reading**: Complete AI-powered Saju analysis with detailed interpretation
- **K-Wave Cultural Context**: Authentic Korean wisdom meets modern UX
- **Dual Payment Methods**: Toss Payments (Korea) + PayPal (International)
- **Bilingual Support**: Korean (ko) and English (en)
- **Modern Design**: Clean, minimalist Korean aesthetic inspired by Toss/Kakao apps

---

## 📁 Project Structure

```
chatju-frontend/
├── app/                    # Next.js 14 App Router
│   ├── page.tsx           # Landing page (hero + preview form)
│   ├── preview/           # FREE preview result
│   ├── payment/           # Payment gateway selection
│   ├── reading/           # Full reading (after payment)
│   ├── dashboard/         # User's past readings
│   └── auth/              # Login/Signup
├── components/
│   ├── ui/                # Base UI components
│   │   ├── Button.tsx     # Primary, secondary, outline, ghost
│   │   ├── Card.tsx       # Container with Korean divider
│   │   ├── Input.tsx      # Form input with validation
│   │   ├── Modal.tsx      # Accessible dialog (Headless UI)
│   │   └── Loading.tsx    # Spinner, dots, pulse + Skeleton
│   ├── forms/             # Form components
│   │   ├── BirthInfoForm.tsx
│   │   └── PaymentForm.tsx
│   ├── saju/              # Saju-specific components
│   │   ├── FourPillarsDisplay.tsx
│   │   ├── ElementsChart.tsx
│   │   └── InterpretationCard.tsx
│   ├── layout/            # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── LanguageToggle.tsx
│   └── payment/           # Payment components
│       ├── TossPaymentButton.tsx
│       └── PayPalButton.tsx
├── lib/
│   ├── api.ts             # API client (axios)
│   └── utils.ts           # Utility functions
├── hooks/
│   ├── useAuth.ts         # Authentication hook
│   ├── useSaju.ts         # Saju operations hook
│   └── usePayment.ts      # Payment operations hook
├── store/
│   └── store.ts           # Zustand global state
├── types/
│   └── index.ts           # TypeScript definitions
└── public/
    └── images/            # Static assets
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running at `http://localhost:3000`

### Installation

1. **Clone and navigate**:
   ```bash
   cd /path/to/chatju-premium/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME=ChatJu Premium
   NEXT_PUBLIC_DEFAULT_LANGUAGE=ko
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   ```
   http://localhost:3001
   ```

---

## 🎨 Design System

### Brand Colors

```css
--navy: #1a365d      /* Primary - Trust, tradition */
--gold: #d4af37      /* Accent - Premium, royal */
--off-white: #f7f7f7 /* Background - Clean, modern */
--charcoal: #2d3748  /* Text - Readability */
```

### Element Colors (五行 - Five Elements)

```css
--wood: #10b981   /* 목(木) - Emerald green */
--fire: #ef4444   /* 화(火) - Red */
--earth: #f59e0b  /* 토(土) - Amber yellow */
--metal: #6b7280  /* 금(金) - Gray */
--water: #3b82f6  /* 수(水) - Blue */
```

### Typography

- **Korean**: Noto Sans KR (300-700 weights)
- **English**: Inter (300-700 weights)
- **Fallback**: System UI fonts

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **State Management** | Zustand |
| **Forms** | React Hook Form |
| **HTTP Client** | Axios |
| **UI Components** | Headless UI |
| **Animations** | Framer Motion |
| **Date Handling** | date-fns |

---

## 📡 API Integration

The frontend connects to the backend API at `http://localhost:3000`.

### Key Endpoints

```typescript
// FREE Preview (no auth required)
POST /saju/preview
Body: { birthDate, birthTime?, gender, language }

// PAID Full Reading (auth required)
POST /saju/calculate
Body: { orderId, birthDate, birthTime?, gender, language }

// Authentication
POST /auth/signup
POST /auth/login
GET /auth/me

// Payment - Toss (Korea)
POST /payment/toss/create
POST /payment/toss/confirm

// Payment - PayPal (International)
POST /payment/paypal/create
POST /payment/paypal/capture
```

See [lib/api.ts](lib/api.ts) for complete API client documentation.

---

## 🔐 Authentication Flow

1. User signs up/logs in → receives JWT token
2. Token stored in `localStorage` as `chatju_token`
3. API client automatically attaches token to requests
4. On 401 error → clears token and redirects to login

---

## 💳 Payment Integration

### Toss Payments (PRIMARY - Korea)

```typescript
import { apiClient } from '@/lib/api';

const payment = await apiClient.createTossPayment({
  amount: 13000,
  orderName: '사주팔자 프리미엄 해석'
});

// Redirect user to payment.successUrl
```

### PayPal (PRIMARY - International)

```typescript
const payment = await apiClient.createPayPalPayment({
  amount: 10.00,
  description: 'Premium Fortune Reading'
});

// Redirect user to payment.approvalUrl
```

---

## 🌐 Internationalization (i18n)

Currently supports:
- **Korean (ko)**: Default language
- **English (en)**: International users

Language detection:
1. User preference (if logged in)
2. Browser language (`navigator.language`)
3. Fallback to Korean

```typescript
import { t, getBrowserLanguage } from '@/lib/utils';

const language = getBrowserLanguage(); // 'ko' or 'en'
const greeting = t('welcome', language);
```

---

## 📦 Component Usage Examples

### Button

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="lg" onClick={handleClick}>
  무료 미리보기
</Button>
```

### Input

```tsx
import { Input } from '@/components/ui';

<Input
  label="생년월일"
  type="date"
  name="birthDate"
  required
  error={errors.birthDate}
/>
```

### Modal

```tsx
import { Modal } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="알림"
  size="md"
>
  <p>결제가 완료되었습니다!</p>
</Modal>
```

### Loading

```tsx
import { Loading } from '@/components/ui';

<Loading
  size="lg"
  variant="spinner"
  text="사주를 분석하는 중..."
  fullScreen
/>
```

---

## 🧪 Development Workflow

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

---

## 📝 Environment Variables

### Required Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Optional Variables

```env
NEXT_PUBLIC_TOSS_CLIENT_KEY=your-toss-client-key
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
NEXT_PUBLIC_ENABLE_STRIPE=false
NEXT_PUBLIC_ENABLE_PREVIEW=true
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect to GitHub**:
   ```bash
   vercel
   ```

2. **Configure environment variables** in Vercel dashboard

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### Cloudflare Pages (Alternative)

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Pages**:
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set output directory: `.next`

---

## 📚 Additional Documentation

- [Backend API Documentation](../backend/README.md)
- [Frontend Requirements](../docs/FRONTEND_REQUIREMENTS.md)
- [K-Wave Cultural Context](../docs/CULTURAL_CONTEXT_KWAVE.md)
- [Payment Integration Guide](../backend/docs/level7/PAYMENT_HIERARCHY_UPDATE.md)

---

## 🎯 Development Roadmap

### Phase 1: MVP (Current)
- [x] Project setup and folder structure
- [x] Design system and Tailwind configuration
- [x] TypeScript types and API client
- [x] Base UI components (Button, Card, Input, Modal, Loading)
- [ ] Landing page with FREE preview form
- [ ] Preview result page with upgrade CTA
- [ ] Payment gateway integration
- [ ] Full reading display page

### Phase 2: Enhancement
- [ ] User dashboard with reading history
- [ ] Authentication pages (login/signup)
- [ ] Payment success/failure pages
- [ ] Mobile optimization
- [ ] Loading states and error handling

### Phase 3: Growth
- [ ] SEO optimization
- [ ] Analytics integration
- [ ] Social sharing features
- [ ] Testimonials and reviews
- [ ] Blog/educational content

---

## 👥 Contributing

This is a private project. For questions or issues, contact:
- **Email**: aimihigh9@gmail.com
- **Developer**: Yohan Lee

---

## 📄 License

Proprietary - All Rights Reserved

---

**Document Version**: 1.0
**Last Updated**: November 11, 2025
**Status**: Frontend Initial Setup Complete ✅
