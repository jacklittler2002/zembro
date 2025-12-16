"use client";

import { useState, useEffect, useRef } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { LowCreditWarning } from "@/components/LowCreditWarning";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface Message {
  role: "user" | "assistant";
  content: string;
  csv?: string;
  upgradeUrl?: string;
}

export default function TedPage() {
  const { loading: authLoading } = useRequireAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    async function fetchCreditBalance() {
      try {
        const { data: session } = await supabaseBrowser.auth.getSession();
        const token = session.session?.access_token;

        const res = await fetch(`${API_BASE}/api/ted/balance`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setCreditBalance(data.balance);
        }
      } catch (error) {
        console.error("Failed to fetch credit balance:", error);
      }
    }

    if (!authLoading) {
      fetchCreditBalance();
    }
  }, [authLoading]);

  // Load conversation list
  useEffect(() => {
    async function loadConversations() {
      try {
        setIsLoadingConversations(true);
        const { data: session } = await supabaseBrowser.auth.getSession();
        const token = session.session?.access_token;
        const res = await fetch(`${API_BASE}/api/ted/conversations`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (res.ok) {
          const data = await res.json();
          setConversations((data.conversations || []).map((c: any) => ({ id: c.id, title: c.title, createdAt: c.createdAt })));
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoadingConversations(false);
      }
    }
    if (!authLoading) loadConversations();
  }, [authLoading]);

  const loadConversation = async (id: string) => {
    try {
      const { data: session } = await supabaseBrowser.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch(`${API_BASE}/api/ted/conversation/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (res.ok) {
        const data = await res.json();
        const conv = data.conversation;
        const msgs = (conv?.messages || []).map((m: any) => ({ role: m.role, content: m.content }));
        setMessages(msgs);
        setConversationId(id);
      }
    } catch (e) {
      // ignore
    }
  };

  if (authLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div style={{ color: "var(--color-sidebar-border)" }}>Loading...</div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: session } = await supabaseBrowser.auth.getSession();
      const token = session.session?.access_token;

      const res = await fetch(`${API_BASE}/api/ted/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update conversation ID if this is the first message
        if (!conversationId && data.conversationId) {
          setConversationId(data.conversationId);
        }

        // Update credit balance
        if (typeof data.remainingBalance === "number") {
          setCreditBalance(data.remainingBalance);
        }

        // Add assistant message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.assistantMessage,
            csv: data.csv,
            upgradeUrl: data.upgradeUrl,
          },
        ]);
      } else {
        // Handle errors
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${data.error || "Something went wrong"}`,
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to connect to TED. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCsv = (csv: string, filename: string = "leads.csv") => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar: Conversations */}
          <aside className="md:col-span-1">
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Conversations</h3>
                <button
                  onClick={() => { setConversationId(null); setMessages([]); }}
                  className="text-xs px-2 py-1 rounded border"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-sidebar-border)" }}
                >New</button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {isLoadingConversations ? (
                  <div className="p-4 text-sm text-gray-500">Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No conversations yet</div>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => loadConversation(c.id)}
                      className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 ${conversationId === c.id ? "bg-gray-50" : ""}`}
                      style={{ borderColor: "#F0F2F5" }}
                    >
                      <div className="text-sm" style={{ color: "var(--color-text)" }}>{c.title || "Chat with TED"}</div>
                      <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* Chat Area */}
          <div className="md:col-span-3">
            <div className="max-w-4xl mx-auto">
          {/* Low credit warning */}
          {creditBalance !== null && <LowCreditWarning creditBalance={creditBalance} />}
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
              Chat with TED
            </h2>
            <p style={{ color: "var(--color-sidebar-border)" }}>
              Ask TED to find leads, build lists, or answer questions about your data.
            </p>
            {/* Credit Widget */}
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setShowCreditModal(true)}
                className="px-3 py-1.5 rounded-lg text-sm bg-white border hover:bg-gray-50"
                style={{ borderColor: "var(--color-border)", color: "var(--color-sidebar-border)" }}
              >
                💳 Credits: {creditBalance ?? "..."}
              </button>
              <button
                onClick={() => setMessage("I need more credits")}
                className="px-3 py-1.5 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700"
              >
                Get Credits
              </button>
            </div>
            {/* Quick Actions Toolbar */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => { setMessage("Find me 50 dentists in London"); }}
                className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50"
                style={{ borderColor: "var(--color-border)", color: "var(--color-sidebar-border)" }}
              >
                🔎 Search Leads
              </button>
              <button
                onClick={() => { setMessage("Check my credits"); }}
                className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50"
                style={{ borderColor: "var(--color-border)", color: "var(--color-sidebar-border)" }}
              >
                💳 Check Credits
              </button>
              <button
                onClick={() => { setMessage("Show my latest results"); }}
                className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50"
                style={{ borderColor: "var(--color-border)", color: "var(--color-sidebar-border)" }}
              >
                📊 View Results
              </button>
              <button
                onClick={() => { setMessage("Export these leads to CSV"); }}
                className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50"
                style={{ borderColor: "var(--color-border)", color: "var(--color-sidebar-border)" }}
              >
                📥 Export CSV
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4 mb-24">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4 flex justify-center">
                  <svg className="w-24 h-24" fill="var(--color-secondary)" viewBox="0 0 64 64">
                    <circle cx="16" cy="16" r="8"/>
                    <circle cx="48" cy="16" r="8"/>
                    <circle cx="32" cy="36" r="20"/>
                    <circle cx="26" cy="32" r="2.5" fill="white"/>
                    <circle cx="38" cy="32" r="2.5" fill="white"/>
                    <path d="M24 40 Q32 46 40 40" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-lg mb-4" style={{ color: "var(--color-sidebar-border)" }}>
                  Start a conversation with TED
                </p>
                <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <button
                    onClick={() => setMessage("Find me 50 dentists in London")}
                    className="p-4 bg-white border rounded-lg text-left hover:shadow-md transition-shadow"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <p className="font-medium mb-1" style={{ color: "var(--color-text)" }}>
                      Find leads
                    </p>
                    <p className="text-sm" style={{ color: "var(--color-sidebar-border)" }}>
                      "Find me 50 dentists in London"
                    </p>
                  </button>
                  <button
                    onClick={() => setMessage("Check my credits")}
                    className="p-4 bg-white border rounded-lg text-left hover:shadow-md transition-shadow"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <p className="font-medium mb-1" style={{ color: "var(--color-text)" }}>
                      Check balance
                    </p>
                    <p className="text-sm" style={{ color: "var(--color-sidebar-border)" }}>
                      "Check my credits"
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="max-w-2xl px-4 py-3 rounded-lg"
                      style={{
                        backgroundColor: msg.role === "user" ? "var(--color-accent)" : "var(--color-hero)",
                        color: msg.role === "user" ? "white" : "var(--color-text)",
                      }}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      
                      {/* CSV Download Button */}
                      {msg.csv && (
                        <button
                          onClick={() => downloadCsv(msg.csv!, `leads-${Date.now()}.csv`)}
                          className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          📥 Download CSV
                        </button>
                      )}

                      {/* Upgrade/Top-up Banner */}
                      {msg.upgradeUrl && (
                        <a
                          href={msg.upgradeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block px-4 py-2 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          🚀 Upgrade or Top-up Credits
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-2xl px-4 py-3 rounded-lg" style={{ backgroundColor: "var(--color-hero)" }}>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t p-4 bg-white" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-4xl mx-auto flex gap-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask TED anything..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-gray-700 hover:border-gray-400 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="px-8 py-3 rounded-lg font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--color-secondary)" }}
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-center mt-2" style={{ color: "var(--color-sidebar-border)" }}>
          Each message costs 1 credit. Current balance: {creditBalance ?? "..."} credits
        </p>
      </div>
      {/* Credit Details Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Credit Balance</h3>
            <p className="mt-2" style={{ color: "var(--color-sidebar-border)" }}>Current balance: <strong>{creditBalance ?? "..."}</strong> credits</p>
            <ul className="mt-4 text-sm" style={{ color: "var(--color-sidebar-border)" }}>
              <li>• TED message: 1 credit</li>
              <li>• Discovery/Crawl/Enrich may use more credits depending on quantity</li>
              <li>• Export CSV: small credit cost per lead</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCreditModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                style={{ borderColor: "var(--color-border)", color: "var(--color-sidebar-border)" }}
              >
                Close
              </button>
              <button
                onClick={() => { setShowCreditModal(false); setMessage("I need more credits"); }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Get Credits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
