import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-semibold">ChatJu</span>
            <span className="text-xs px-2 py-0.5 bg-stone-900 text-white rounded-full">Premium</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Pricing
            </a>
            <Link href="/auth/signin">
              <button className="btn-primary text-sm">Sign In</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-tight">
            Discover Your<br />
            <span className="serif-font italic accent-gold">Life&apos;s Blueprint</span>
          </h1>
          <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto">
            Ancient wisdom meets modern AI. Experience personalized Saju readings that illuminate your path forward.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/saju/input">
              <button className="btn-primary">Start Your Reading</button>
            </Link>
            <button className="btn-secondary">Learn More</button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-semibold text-center mb-16">
            Precision meets <span className="serif-font italic accent-gold">tradition</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl bg-stone-50">
              <h3 className="text-xl font-semibold mb-3">Authentic Calculations</h3>
              <p className="text-stone-600">
                Every reading follows traditional Saju principles with AI precision.
              </p>
            </div>
            <div className="p-8 rounded-xl bg-stone-50">
              <h3 className="text-xl font-semibold mb-3">Instant Insights</h3>
              <p className="text-stone-600">
                Comprehensive readings in minutes with our advanced AI system.
              </p>
            </div>
            <div className="p-8 rounded-xl bg-stone-50">
              <h3 className="text-xl font-semibold mb-3">Interactive Guidance</h3>
              <p className="text-stone-600">
                Ask questions through our intelligent chat interface.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-semibold text-center mb-16">
            Choose your <span className="serif-font italic accent-gold">journey</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-xl border border-stone-200 bg-white">
              <h3 className="text-lg font-semibold mb-2">Essential</h3>
              <div className="text-4xl font-semibold mb-6">$9.99</div>
              <button className="w-full py-3 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
                Get Started
              </button>
            </div>
            <div className="p-8 rounded-xl bg-stone-900 text-white relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-stone-900 text-xs rounded-full">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold mb-2">Premium</h3>
              <div className="text-4xl font-semibold mb-6">$24.99</div>
              <button className="w-full py-3 bg-white text-stone-900 rounded-lg hover:bg-stone-100 transition-colors">
                Get Started
              </button>
            </div>
            <div className="p-8 rounded-xl border border-stone-200 bg-white">
              <h3 className="text-lg font-semibold mb-2">Professional</h3>
              <div className="text-4xl font-semibold mb-6">$49.99</div>
              <button className="w-full py-3 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t border-stone-200 text-center text-sm text-stone-600">
        <div className="mb-4">
          © 2025 ChatJu Premium. All rights reserved.
        </div>
        <div className="text-xs text-stone-400">
          <Link href="/admin/settings" className="hover:text-stone-600 transition-colors">
            Admin
          </Link>
        </div>
      </footer>
    </>
  )
}
