import { useEffect, useState } from "react";

export interface LeadSearchProgress {
  id: string;
  status: string;
  discoveredCount: number;
  crawledCount: number;
  enrichedCount: number;
  contactsFoundCount: number;
  maxLeads: number;
  createdAt: string;
  updatedAt: string;
  isComplete: boolean;
}

export function LeadSearchProgressBar({ leadSearchId, apiBase = "http://localhost:4000" }: { leadSearchId: string; apiBase?: string }) {
  const [progress, setProgress] = useState<LeadSearchProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchProgress() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/api/lead-searches/${leadSearchId}/progress`);
        if (!res.ok) throw new Error("Failed to fetch progress");
        const data = await res.json();
        setProgress(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch progress");
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
    interval = setInterval(fetchProgress, 3000);
    return () => clearInterval(interval);
  }, [leadSearchId, apiBase]);

  if (loading && !progress) return <div>Loading progress...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!progress) return null;

  const percent = Math.min(100, Math.round((progress.contactsFoundCount / Math.max(1, progress.maxLeads)) * 100));

  return (
    <div className="my-4">
      <div className="flex items-center gap-3">
        <span className="text-gray-500">Progress</span>
        <span className="w-40 h-2 bg-gray-200 rounded overflow-hidden">
          <span className="block h-2 bg-blue-500 transition-all duration-500" style={{ width: `${percent}%` }} />
        </span>
        <span className="text-gray-500">{percent}%</span>
        {progress.isComplete && <span className="ml-2 text-green-600 font-semibold">Ready to export!</span>}
      </div>
      <div className="text-xs text-gray-500 mt-1 flex gap-4">
        <span>Discovered: {progress.discoveredCount}</span>
        <span>Crawled: {progress.crawledCount}</span>
        <span>Enriched: {progress.enrichedCount}</span>
        <span>Contacts: {progress.contactsFoundCount}</span>
      </div>
    </div>
  );
}
