"use client";

import Link from "next/link";

interface LowCreditWarningProps {
  creditBalance: number;
  requiredCredits?: number;
}

export function LowCreditWarning({ creditBalance, requiredCredits }: LowCreditWarningProps) {
  // Show warning if balance is low
  const isLow = creditBalance < 100;
  const isInsufficient = requiredCredits && creditBalance < requiredCredits;

  if (!isLow && !isInsufficient) {
    return null;
  }

  return (
    <div className={`rounded-lg p-4 mb-6 border ${isInsufficient ? 'bg-error-soft border-error' : 'bg-warning-soft border-warning'}`}>
      <div className="flex items-start">
        <svg className={`w-6 h-6 mr-3 flex-shrink-0 ${isInsufficient ? 'text-error' : 'text-warning'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
        <div className="flex-1">
          <h3
            className={`font-semibold mb-1 ${isInsufficient ? 'text-error' : 'text-warning'}`}
          >
            {isInsufficient ? "Insufficient Credits" : "Low Credit Balance"}
          </h3>
          <p className="text-sm mb-3 text-ui-muted">
            {isInsufficient
              ? `This action requires ${requiredCredits} credits but you only have ${creditBalance} remaining.`
              : `You have only ${creditBalance} credits remaining. Upgrade to continue generating leads.`}
          </p>
          <Link
            href="/app/billing"
            className="inline-block px-4 py-2 rounded-lg font-semibold text-white text-sm bg-accent"
          >
            Buy Credits or Upgrade Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
