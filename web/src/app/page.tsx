import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
              Zembro
            </Link>
            <nav className="flex items-center space-x-6">
              <ThemeToggle size="sm" />
              <Link href="/app" className="hover:opacity-80" style={{ color: "var(--color-text-muted)" }}>
                Product
              </Link>
              <Link href="/auth" className="hover:opacity-80" style={{ color: "var(--color-text-muted)" }}>
                Login
              </Link>
              <Link 
                href="/auth"
                className="px-6 py-2 rounded-lg font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Get started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6" style={{ color: "var(--color-text)" }}>
                AI-powered lead discovery for modern teams
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Zembro is a modern data intelligence platform that continuously scans the public web, 
                extracts verified contact and company data, and enriches it with smart AI classification.
              </p>
              <div className="flex gap-4">
                <Link 
                  href="/auth"
                  className="px-8 py-4 rounded-lg font-semibold text-white shadow-lg"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  Start for free
                </Link>
                <Link 
                  href="/app"
                  className="px-8 py-4 rounded-lg font-semibold border-2"
                  style={{ borderColor: "var(--color-text)", color: "var(--color-text)" }}
                >
                  View the product
                </Link>
              </div>
            </div>
            <div 
              className="rounded-xl p-8 h-96 flex items-center justify-center"
              style={{ backgroundColor: "var(--color-hero)", border: `2px solid var(--color-hero-border)` }}
            >
              <div className="text-center">
                <div className="text-6xl mb-4" style={{ color: "var(--color-primary)" }}>
                  <svg className="w-32 h-32 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">Product screenshot placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "var(--color-hero)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center" style={{ backgroundColor: "var(--color-accent-soft)" }}>
                <svg className="w-6 h-6" style={{ color: "var(--color-primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                Autonomous web crawling
              </h3>
              <p className="text-gray-600 text-sm">
                Our AI crawlers continuously discover and extract business data from across the web.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center" style={{ backgroundColor: "var(--color-secondary-soft)" }}>
                <svg className="w-6 h-6" style={{ color: "var(--color-secondary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                Verified contacts & companies
              </h3>
              <p className="text-gray-600 text-sm">
                Get accurate, up-to-date contact information and company details validated by AI.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center" style={{ backgroundColor: "var(--color-accent-soft)" }}>
                <svg className="w-6 h-6" style={{ color: "var(--color-primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                AI enrichment & scoring
              </h3>
              <p className="text-gray-600 text-sm">
                Smart classification, quality scoring, and enrichment using GPT-4o-mini.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center" style={{ backgroundColor: "var(--color-secondary-soft)" }}>
                <svg className="w-6 h-6" style={{ color: "var(--color-secondary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                Exports ready for outreach
              </h3>
              <p className="text-gray-600 text-sm">
                Download clean CSV files ready for your CRM or outreach tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TED Highlight */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-2 rounded-full mb-6" style={{ backgroundColor: "var(--color-secondary-soft)", color: "var(--color-secondary)" }}>
            <span className="font-semibold">Meet TED</span>
          </div>
          <h2 className="text-4xl font-bold mb-6" style={{ color: "var(--color-text)" }}>
            Your AI operator inside Zembro
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Ask TED to find leads, build lists, and export CSVs for you. 
            TED understands natural language and handles the heavy lifting so you can focus on closing deals.
          </p>
          <Link 
            href="/app/ted"
            className="inline-block px-8 py-4 rounded-lg font-semibold text-white"
            style={{ backgroundColor: "var(--color-secondary)" }}
          >
            Try TED
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "var(--color-hero)" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ color: "var(--color-text)" }}>
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                1
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
                Search
              </h3>
              <p className="text-gray-600">
                Tell Zembro what kind of leads you're looking for using natural language.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                2
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
                Crawl & Enrich
              </h3>
              <p className="text-gray-600">
                Our AI crawlers find companies, extract contacts, and enrich with verified data.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                3
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
                Export
              </h3>
              <p className="text-gray-600">
                Download your leads as CSV, ready for import into your CRM or outreach tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6" style={{ color: "var(--color-text)" }}>
            Ready to discover better leads?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join modern teams using Zembro to find their next customers.
          </p>
          <Link 
            href="/auth"
            className="inline-block px-12 py-4 rounded-lg font-semibold text-white text-lg shadow-lg"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Get started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
              Zembro
            </div>
            <div className="text-sm text-gray-500">
              © 2025 Zembro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
