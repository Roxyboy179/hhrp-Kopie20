'use client';

import { SystemStatusView } from '@/components/system-status/SystemStatusView';
import { ArrowLeft, Activity } from 'lucide-react';
import Link from 'next/link';

export default function SystemStatusPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Subtle background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(102, 126, 234, 0.08), transparent 60%), radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.06), transparent 50%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Zurück zur Startseite
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(168, 85, 247, 0.15))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">System Status</h1>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                Hamburg Horizon RP · Service Health
              </p>
            </div>
          </div>
        </div>

        {/* Main View */}
        <SystemStatusView />
      </div>
    </div>
  );
}
