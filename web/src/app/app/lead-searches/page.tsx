"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { LowCreditWarning } from "@/components/LowCreditWarning";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function LeadSearchesPage() {
  const { loading: authLoading, user } = useRequireAuth();
  const [leadSearches, setLeadSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  useEffect(() => {
    async function fetchLeadSearches() {
      if (authLoading || !user) return;

      try {
        const supabase = await getSupabaseClient();
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        const res = await fetch(`${API_BASE}/api/lead-searches`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setLeadSearches(data.leadSearches || []);
        }

        // Fetch credit balance
        const balanceRes = await fetch(`${API_BASE}/api/ted/balance`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          setCreditBalance(balanceData.balance);
        }
      } catch (error) {
        console.error("Failed to fetch lead searches:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeadSearches();
  }, [authLoading, user]);

  const handleDownloadCSV = async (searchId: string) => {
    try {
      const supabase = await getSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const res = await fetch(`${API_BASE}/api/lead-searches/${searchId}/export`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lead-search-${searchId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download CSV:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-8 flex items-center justify-center">
            <div className="text-sidebar">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Low credit warning */}
        {creditBalance !== null && <LowCreditWarning creditBalance={creditBalance} />}
        
          <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-ui">Lead Searches</h2>
          <Link href="/app/lead-searches/new" className="btn btn-primary">Create New Search</Link>
        </div>

        {leadSearches.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center border-ui">
              <p className="text-lg mb-4 text-ui">No lead searches yet</p>
            <Link href="/app/lead-searches/new" className="hover:underline text-accent">Create your first search →</Link>
          </div>
        ) : (
          <div className="bg-white border rounded-lg overflow-hidden border-ui">
            <table className="w-full">
              <thead className="bg-hero">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-ui">Query</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-ui">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-ui">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-ui">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {leadSearches.map((search: any) => (
                  <tr key={search.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-ui">{search.query}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        search.status === "DONE" ? "bg-green-500/20 text-green-400" :
                        search.status === "RUNNING" ? "bg-blue-500/20 text-blue-400" :
                        search.status === "FAILED" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {search.status}
                      </span>
                    </td>
                      <td className="px-6 py-4 text-ui">
                      {new Date(search.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/app/lead-searches/${search.id}`} className="hover:underline text-sm text-accent">View</Link>
                      <button onClick={() => handleDownloadCSV(search.id)} className="hover:underline text-sm text-secondary">Download CSV</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
