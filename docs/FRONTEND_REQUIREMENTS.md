# ChatJu Premium - Frontend Requirements & Implementation Plan

**Document Version**: 1.0
**Date**: November 11, 2025
**Target**: Web-based Claude Code development
**Status**: Ready for Implementation

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Page Specifications](#page-specifications)
5. [Component Library](#component-library)
6. [API Integration](#api-integration)
7. [Payment Integration](#payment-integration)
8. [Deployment](#deployment)
9. [Development Roadmap](#development-roadmap)

---

## 🎯 Project Overview

### What We're Building

A modern, mobile-first web application for Korean fortune-telling (Saju/사주) with:
- FREE preview feature (no signup)
- Premium full readings ($10 USD / 13,000 KRW)
- K-wave cultural positioning
- International + Korean audiences
- Freemium conversion funnel

### Backend Status

✅ **COMPLETE** - All APIs ready:
- POST /saju/preview (FREE, no auth)
- POST /saju/calculate (PAID, requires auth + payment)
- POST /auth/signup, /signin, /verify
- POST /payment/toss/create (Korea)
- POST /payment/paypal/create (International)
- Backend URL: TBD (currently localhost:3000)

### Success Criteria

**User Flow**:
```
Landing Page → Enter Birth Info → FREE Preview Result →
Upgrade CTA → Payment → Full Reading → Dashboard
```

**Conversion Goals**:
- 50%+ preview completion rate
- 10%+ preview → payment conversion
- Mobile responsive (90%+ of traffic)
- <3s page load time

---

## 🛠️ Technology Stack

### Recommendation: Next.js + Tailwind CSS

**Why Next.js**:
- ✅ React-based (component reusability)
- ✅ Built-in routing (no extra setup)
- ✅ Server-side rendering (SEO-friendly)
- ✅ API routes (if needed for proxying)
- ✅ Image optimization (automatic)
- ✅ Easy deployment (Vercel/Cloudflare)

**Why Tailwind CSS**:
- ✅ Utility-first (rapid development)
- ✅ Mobile-first by default
- ✅ Consistent design system
- ✅ Small bundle size
- ✅ Korean font support (Noto Sans KR)

### Core Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.3.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "date-fns": "^2.30.0",
    "@headlessui/react": "^1.7.17",
    "framer-motion": "^10.16.0"
  }
}
```

### Optional Libraries

**Payment Integration**:
- `@tosspayments/payment-sdk` - Toss Payments widget
- `@paypal/react-paypal-js` - PayPal Smart Buttons

**Analytics** (if needed):
- `@vercel/analytics` - Vercel Analytics
- `react-ga4` - Google Analytics 4

**i18n** (if multi-language):
- `next-intl` - Internationalization

---

## 🏗️ Architecture

### Folder Structure

```
chatju-frontend/
├── app/                      # Next.js 14 App Router
│   ├── (landing)/
│   │   └── page.tsx         # Landing page
│   ├── preview/
│   │   └── page.tsx         # Preview result
│   ├── payment/
│   │   ├── page.tsx         # Payment selection
│   │   └── success/page.tsx # Payment success
│   ├── reading/
│   │   └── [id]/page.tsx    # Full reading view
│   ├── dashboard/
│   │   └── page.tsx         # User dashboard
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Loading.tsx
│   ├── forms/
│   │   ├── BirthInfoForm.tsx
│   │   └── PaymentForm.tsx
│   ├── saju/
│   │   ├── FourPillarsDisplay.tsx
│   │   ├── ElementsChart.tsx
│   │   └── InterpretationCard.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   └── payment/
│       ├── TossPaymentButton.tsx
│       └── PayPalButton.tsx
├── lib/
│   ├── api.ts               # API client
│   ├── auth.ts              # Auth helpers
│   ├── utils.ts             # Utility functions
│   └── constants.ts         # Constants
├── hooks/
│   ├── useAuth.ts
│   ├── useSaju.ts
│   └── usePayment.ts
├── store/
│   └── store.ts             # Zustand state management
├── types/
│   └── index.ts             # TypeScript types
├── public/
│   ├── images/
│   └── fonts/
├── tailwind.config.js
├── next.config.js
├── package.json
└── README.md
```

### State Management (Zustand)

```typescript
// store/store.ts
import { create } from 'zustand';

interface AppState {
  // User state
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;

  // Preview state
  previewData: PreviewData | null;
  setPreviewData: (data: PreviewData | null) => void;

  // Payment state
  orderId: string | null;
  setOrderId: (id: string | null) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  previewData: null,
  setPreviewData: (data) => set({ previewData: data }),

  orderId: null,
  setOrderId: (id) => set({ orderId: id }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
```

---

## 📄 Page Specifications

### 1. Landing Page (`/`)

**Purpose**: Convert visitors to preview users

**Sections**:
1. **Hero** (above fold):
   - H1: "Discover Your Destiny, Korean-Style" (EN) / "사주팔자, AI로 만나보세요" (KR)
   - Subtext: "Experience Saju - Korea's 2,500-year-old wisdom"
   - Birth info form (inline)
   - CTA: "Get FREE Preview" button
   - Small text: "No signup required"

2. **What is Saju** (educational):
   - Title: "What is Saju (사주)?"
   - 3-4 paragraph explanation
   - Connect to K-drama/K-pop
   - Visual: Four Pillars diagram

3. **How It Works** (trust building):
   - Step 1: Enter birth info → Step 2: Get preview → Step 3: Upgrade for full reading
   - Icons for each step
   - Mobile-friendly layout

4. **Social Proof** (conversion):
   - "⭐ 4.8/5 from 3,247 readings"
   - Testimonials (3-4 cards)
   - "As trusted by K-drama fans worldwide"

5. **Pricing** (transparency):
   - FREE Preview box (emphasized)
   - Premium box: $10 USD / 13,000 KRW
   - What's included checklist
   - CTA buttons

6. **FAQ** (objection handling):
   - Accordion component
   - 6-8 common questions
   - Address cultural concerns

**Components Used**:
- `BirthInfoForm` (hero)
- `Card` (social proof, pricing)
- `Accordion` (FAQ)

**Design Notes**:
- Mobile-first layout
- Korean aesthetic (clean, minimal)
- Use Korean fonts (Noto Sans KR)
- Color palette: Navy (#1a365d), Gold (#d4af37), Off-white (#f7f7f7)

---

### 2. Preview Result Page (`/preview`)

**Purpose**: Show free preview + convert to paid

**Layout**:
1. **Top Banner**:
   - "🎉 This is your FREE preview!"
   - Upgrade CTA button (sticky on mobile)

2. **Four Pillars Display**:
   - Visual card layout (4 cards for 4 pillars)
   - Year | Month | Day | Hour
   - Korean characters + elements
   - Color-coded by element

3. **Elements Chart**:
   - Pie chart or bar chart
   - Wood, Fire, Earth, Metal, Water distribution
   - Visual + numbers

4. **AI Preview** (SHORT):
   - 🔓 Unlocked: 3 sections visible (4-6 sentences)
     - Overview
     - Core Personality
     - One-Line Advice
   - 🔒 Locked: Blurred sections (visible but unreadable)
     - Career & Wealth
     - Relationships & Health
     - 2025 Forecast
     - Lucky Colors/Numbers
     - Compatibility Guide

5. **Upgrade CTA** (sticky bottom bar on mobile):
   - "Unlock Full Reading - $10"
   - Button: "Get Full Analysis"
   - Small text: "One-time payment, lifetime access"

6. **What You'll Get** (value proposition):
   - Checklist of full reading features
   - Before/After comparison
   - Social proof (# of users)

**Technical**:
- Receive data from form submission
- Call: `POST /saju/preview`
- No auth required
- Store in sessionStorage (not localStorage yet)

**Design Notes**:
- Preview content MUST look valuable
- Blur effect on locked sections (CSS: filter: blur(8px))
- Mobile-optimized (swipeable cards)

---

### 3. Payment Page (`/payment`)

**Purpose**: Complete payment transaction

**Flow Detection**:
```javascript
// Detect user location
const userCountry = navigator.language; // or IP-based
if (userCountry === 'ko-KR' || userCountry === 'ko') {
  // Show Toss Payments first
} else {
  // Show PayPal first
}
```

**Layout**:
1. **Header**:
   - "Complete Your Purchase"
   - Order summary: "Premium Saju Reading - $10"

2. **Login/Signup** (if not authenticated):
   - Email input
   - "Send Magic Link" button
   - Small text: "We'll email you a login link"

3. **Payment Methods** (after login):
   - **For Korean Users**:
     - 🇰🇷 Toss Payments (recommended badge)
     - 🌍 PayPal
   - **For International Users**:
     - 🌍 PayPal (recommended badge)
     - 🇰🇷 Toss Payments

4. **Toss Payment Widget**:
   ```jsx
   <TossPaymentButton
     amount={13000} // KRW
     orderName="사주팔자 프리미엄 해석"
     onSuccess={handleTossSuccess}
   />
   ```

5. **PayPal Button**:
   ```jsx
   <PayPalButtons
     createOrder={handlePayPalCreate}
     onApprove={handlePayPalApprove}
     style={{ layout: 'vertical' }}
   />
   ```

6. **Security Badges**:
   - SSL secure
   - No card data stored
   - PCI compliant

**API Calls**:
1. `POST /auth/signin` → Get token
2. `POST /payment/toss/create` OR `POST /payment/paypal/create`
3. Complete payment with gateway
4. `POST /saju/calculate` with orderId
5. Redirect to `/reading/[id]`

---

### 4. Full Reading Page (`/reading/[id]`)

**Purpose**: Display complete Saju analysis

**Layout**:
1. **Header**:
   - Title: "Your Saju Reading"
   - Birth info: "Born April 5, 1979 at 12:35"
   - Download PDF button (future)

2. **Four Pillars** (same as preview):
   - Full display with explanations

3. **Elements Analysis** (same as preview):
   - Chart + descriptions

4. **Full AI Interpretation** (ALL UNLOCKED):
   - Section 1: Overview (2-3 sentences)
   - Section 2: Personality & Talents (3-4 sentences)
   - Section 3: Career & Wealth (3-4 sentences)
   - Section 4: Relationships & Health (3-4 sentences)
   - Section 5: Actionable Advice (2-3 sentences)

5. **Additional Insights** (future):
   - 2025 Forecast
   - Lucky colors/numbers
   - Compatibility calculator
   - Monthly horoscope

6. **Actions**:
   - Share button (social media)
   - Save button (add to dashboard)
   - Get another reading button

**Technical**:
- URL: `/reading/[readingId]`
- API: `GET /reading/[id]` (requires auth)
- Protected route (check JWT)
- Can be bookmarked/shared

---

### 5. Dashboard Page (`/dashboard`)

**Purpose**: View past readings

**Layout**:
1. **User Info**:
   - Email
   - Member since date
   - Total readings count

2. **Readings List**:
   - Card for each reading
   - Birth date + gender
   - Created date
   - "View Reading" button

3. **Actions**:
   - Get new reading button
   - Account settings
   - Logout

**Technical**:
- API: `GET /payment/history/me`
- Protected route
- Pagination (if many readings)

---

### 6. Payment Success Page (`/payment/success`)

**Purpose**: Confirm payment + show reading

**Layout**:
1. **Success Message**:
   - ✅ "Payment Successful!"
   - Order ID
   - Amount paid

2. **Next Steps**:
   - "Your reading is ready!"
   - Button: "View Full Reading"

3. **Receipt**:
   - Email confirmation sent
   - Payment method used
   - Date/time

**Technical**:
- Receive orderId from query params
- Auto-fetch reading
- Redirect to `/reading/[id]`

---

## 🧩 Component Library

### UI Components (Reusable)

#### Button.tsx
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ ... }) => {
  // Tailwind classes based on props
  // Loading spinner if loading
  // Disabled state styling
};
```

**Variants**:
- Primary: Navy background (#1a365d), white text
- Secondary: Gold background (#d4af37), navy text
- Outline: Border only, transparent background
- Ghost: No border, hover effect

#### Card.tsx
```tsx
interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ ... }) => {
  // Clean card with subtle shadow
  // Hover effect (lift + shadow)
  // Responsive padding
};
```

#### Input.tsx
```tsx
interface InputProps {
  label: string;
  type: 'text' | 'email' | 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({ ... }) => {
  // Label above input
  // Error state (red border + message)
  // Helper text below
  // Accessible (ARIA labels)
};
```

#### Modal.tsx
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({ ... }) => {
  // @headlessui/react Dialog
  // Backdrop blur
  // Smooth animation (framer-motion)
  // Mobile-friendly (full screen on mobile)
};
```

#### Loading.tsx
```tsx
export const Loading = () => {
  // Spinner animation
  // Korean aesthetic (maybe use 태극 taeguk pattern?)
  // Smooth transitions
};
```

---

### Form Components

#### BirthInfoForm.tsx
```tsx
interface BirthInfoFormProps {
  onSubmit: (data: BirthInfo) => void;
  loading?: boolean;
}

export const BirthInfoForm: React.FC<BirthInfoFormProps> = ({ ... }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Birth Date"
        type="date"
        {...register('birthDate', { required: true })}
      />
      <Input
        label="Birth Time (Optional)"
        type="time"
        {...register('birthTime')}
      />
      <Select
        label="Gender"
        options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
        {...register('gender', { required: true })}
      />
      <Button type="submit" loading={loading}>
        Get FREE Preview
      </Button>
    </form>
  );
};
```

---

### Saju Components

#### FourPillarsDisplay.tsx
```tsx
interface FourPillarsDisplayProps {
  pillars: {
    year: { korean: string; element: string };
    month: { korean: string; element: string };
    day: { korean: string; element: string };
    hour: { korean: string; element: string };
  };
}

export const FourPillarsDisplay: React.FC<FourPillarsDisplayProps> = ({ pillars }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <PillarCard title="Year" korean={pillars.year.korean} element={pillars.year.element} />
      <PillarCard title="Month" korean={pillars.month.korean} element={pillars.month.element} />
      <PillarCard title="Day" korean={pillars.day.korean} element={pillars.day.element} />
      <PillarCard title="Hour" korean={pillars.hour.korean} element={pillars.hour.element} />
    </div>
  );
};

const PillarCard = ({ title, korean, element }) => {
  // Color based on element
  const elementColors = {
    '목': 'bg-green-100 border-green-500', // Wood
    '화': 'bg-red-100 border-red-500',     // Fire
    '토': 'bg-yellow-100 border-yellow-500', // Earth
    '금': 'bg-gray-100 border-gray-500',   // Metal
    '수': 'bg-blue-100 border-blue-500',   // Water
  };

  return (
    <Card className={`${elementColors[element]} border-2`}>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-3xl font-bold">{korean}</p>
      <p className="text-sm">{element}</p>
    </Card>
  );
};
```

#### ElementsChart.tsx
```tsx
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ElementsChartProps {
  elements: {
    목: number;
    화: number;
    토: number;
    금: number;
    수: number;
  };
}

export const ElementsChart: React.FC<ElementsChartProps> = ({ elements }) => {
  const data = [
    { name: 'Wood (목)', value: elements.목, color: '#10b981' },
    { name: 'Fire (화)', value: elements.화, color: '#ef4444' },
    { name: 'Earth (토)', value: elements.토, color: '#f59e0b' },
    { name: 'Metal (금)', value: elements.금, color: '#6b7280' },
    { name: 'Water (수)', value: elements.수, color: '#3b82f6' },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry) => `${entry.name}: ${entry.value}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
```

---

## 🔌 API Integration

### API Client (`lib/api.ts`)

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// API methods
export const apiClient = {
  // Saju endpoints
  getPreview: (birthData: BirthData) =>
    api.post('/saju/preview', birthData),

  getFullReading: (orderId: string, birthData: BirthData) =>
    api.post('/saju/calculate', { orderId, ...birthData }),

  getReading: (readingId: string) =>
    api.get(`/reading/${readingId}`),

  // Auth endpoints
  signup: (email: string) =>
    api.post('/auth/signup', { email }),

  signin: (email: string) =>
    api.post('/auth/signin', { email }),

  verifyToken: (token: string) =>
    api.post('/auth/verify', { token }),

  // Payment endpoints
  createTossPayment: (amount: number, orderName: string) =>
    api.post('/payment/toss/create', { amount, orderName }),

  createPayPalPayment: (amount: number, description: string) =>
    api.post('/payment/paypal/create', { amount, description }),

  getPaymentHistory: () =>
    api.get('/payment/history/me'),
};

export default api;
```

### TypeScript Types (`types/index.ts`)

```typescript
export interface BirthData {
  birthDate: string; // YYYY-MM-DD
  birthTime?: string; // HH:MM
  gender: 'male' | 'female';
  timezone?: string;
  language?: 'ko' | 'en';
}

export interface Pillar {
  korean: string;
  hanja?: string;
  full: string;
  element: string;
}

export interface PreviewData {
  manseryeok: {
    pillars: {
      year: Pillar;
      month: Pillar;
      day: Pillar;
      hour: Pillar;
    };
    elements: {
      목: number;
      화: number;
      토: number;
      금: number;
      수: number;
    };
  };
  aiPreview: {
    shortText: string;
    sections: {
      overview: string;
      personality: string;
      advice: string;
    };
    metadata: {
      tokens: number;
      generatedAt: string;
      isPreview: boolean;
    };
  };
  isPaid: boolean;
  message: string;
  upgradeUrl: string;
}

export interface FullReading extends PreviewData {
  readingId: string;
  aiInterpretation: {
    fullText: string;
    sections: {
      overview: string;
      personality: string;
      career: string;
      relationships: string;
      advice: string;
    };
  };
  createdAt: string;
  viewUrl: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
}
```

---

## 💳 Payment Integration

### Toss Payments Integration

**1. Install SDK**:
```bash
npm install @tosspayments/payment-sdk
```

**2. Component**:
```tsx
// components/payment/TossPaymentButton.tsx
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { useEffect, useState } from 'react';

export const TossPaymentButton = ({ amount, orderName, onSuccess }) => {
  const [tossPayments, setTossPayments] = useState(null);

  useEffect(() => {
    loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY)
      .then(setTossPayments);
  }, []);

  const handleClick = async () => {
    try {
      // Call backend to create payment
      const { data } = await apiClient.createTossPayment(amount, orderName);

      // Launch Toss payment widget
      await tossPayments.requestPayment('카드', {
        amount: data.amount,
        orderId: data.orderId,
        orderName: data.orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  return (
    <Button onClick={handleClick} variant="primary" fullWidth>
      Pay with Toss (토스페이)
    </Button>
  );
};
```

### PayPal Integration

**1. Install SDK**:
```bash
npm install @paypal/react-paypal-js
```

**2. Wrapper**:
```tsx
// app/payment/page.tsx
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

export default function PaymentPage() {
  return (
    <PayPalScriptProvider
      options={{
        "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        currency: "USD",
      }}
    >
      <PaymentContent />
    </PayPalScriptProvider>
  );
}
```

**3. Component**:
```tsx
// components/payment/PayPalButton.tsx
import { PayPalButtons } from '@paypal/react-paypal-js';

export const PayPalButton = ({ amount, description, onSuccess }) => {
  const createOrder = async () => {
    try {
      const { data } = await apiClient.createPayPalPayment(amount, description);
      return data.paypalOrderId;
    } catch (error) {
      console.error('PayPal create error:', error);
    }
  };

  const onApprove = async (data) => {
    try {
      // Capture payment
      const response = await axios.post('/payment/paypal/capture', {
        paypalOrderId: data.orderID,
      });

      onSuccess(response.data);
    } catch (error) {
      console.error('PayPal approve error:', error);
    }
  };

  return (
    <PayPalButtons
      createOrder={createOrder}
      onApprove={onApprove}
      style={{
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
      }}
    />
  );
};
```

---

## 🚀 Deployment

### Option 1: Vercel (Recommended)

**Why Vercel**:
- ✅ Built for Next.js
- ✅ Free hobby tier
- ✅ Automatic deployments from Git
- ✅ Global CDN
- ✅ Environment variables support

**Steps**:
1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_TOSS_CLIENT_KEY`
   - `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
4. Deploy (automatic on push)

### Option 2: Cloudflare Pages

**Why Cloudflare**:
- ✅ Free tier (generous)
- ✅ Fast global CDN
- ✅ Easy to set up
- ✅ Good for static sites

**Steps**:
1. Build: `npm run build`
2. Export: `next export` (if using static export)
3. Upload `out/` folder to Cloudflare Pages
4. Configure custom domain

### Environment Variables

```env
# API
NEXT_PUBLIC_API_URL=https://your-backend-api.com

# Toss Payments
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-...
```

---

## 📅 Development Roadmap

### Phase 1: MVP (2-3 weeks)

**Week 1: Core Pages**
- [ ] Set up Next.js project
- [ ] Install dependencies
- [ ] Create folder structure
- [ ] Build UI component library (Button, Card, Input, Modal)
- [ ] Landing page (hero + form)
- [ ] Preview result page

**Week 2: Integration**
- [ ] API client setup
- [ ] Auth flow (magic link)
- [ ] Payment page
- [ ] Toss Payments integration
- [ ] PayPal integration
- [ ] Full reading page

**Week 3: Polish**
- [ ] Dashboard page
- [ ] Mobile optimization
- [ ] Error handling
- [ ] Loading states
- [ ] Testing on devices
- [ ] Deploy to Vercel

### Phase 2: Enhancement (1-2 weeks)

**Features**:
- [ ] K-wave cultural content (landing page)
- [ ] Social sharing
- [ ] Download PDF
- [ ] Korean language toggle
- [ ] Analytics integration
- [ ] SEO optimization

### Phase 3: Growth (Ongoing)

**Marketing**:
- [ ] Social media integration
- [ ] Referral program
- [ ] Influencer partnerships
- [ ] Content marketing (blog)
- [ ] Email marketing

---

## 🎨 Design System

### Colors

```css
:root {
  /* Primary */
  --navy-900: #1a202c;
  --navy-800: #1a365d;
  --navy-700: #2c5282;

  /* Accent */
  --gold-500: #d4af37;
  --gold-400: #e4c766;

  /* Neutrals */
  --gray-50: #f7f7f7;
  --gray-100: #e5e5e5;
  --gray-900: #2d3748;

  /* Elements */
  --wood: #10b981;    /* Green */
  --fire: #ef4444;    /* Red */
  --earth: #f59e0b;   /* Yellow */
  --metal: #6b7280;   /* Gray */
  --water: #3b82f6;   /* Blue */
}
```

### Typography

```css
/* Korean */
font-family: 'Noto Sans KR', sans-serif;

/* English */
font-family: 'Inter', sans-serif;

/* Headers */
.h1 { font-size: 2.5rem; font-weight: 700; }
.h2 { font-size: 2rem; font-weight: 600; }
.h3 { font-size: 1.5rem; font-weight: 600; }

/* Body */
.body { font-size: 1rem; line-height: 1.6; }
.small { font-size: 0.875rem; }
```

### Spacing

```css
/* Tailwind scale */
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
```

---

## ✅ Ready for Implementation

**This document contains**:
- ✅ Complete folder structure
- ✅ Page specifications
- ✅ Component examples
- ✅ API integration code
- ✅ Payment integration
- ✅ Deployment guide
- ✅ Development roadmap

**Next Steps**:
1. Create new GitHub repository for frontend
2. Initialize Next.js project with TypeScript
3. Set up Tailwind CSS
4. Start with Phase 1, Week 1 tasks
5. Use this document as reference

**Backend Connection**:
- Backend running on: `http://localhost:3000` (dev)
- Production backend: TBD (deploy to AWS Lambda)
- All APIs documented and working

---

**Document Version**: 1.0
**Status**: Ready for Claude Code (Web Version)
**Next**: Initialize project and start building! 🚀
