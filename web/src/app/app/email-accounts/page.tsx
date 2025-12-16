"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useState, useEffect } from "react";

interface EmailAccount {
  id: string;
  email: string;
  fromName: string | null;
  provider: string | null;
  status: string;
  dailySentCount: number;
  dailySendLimit: number;
  bounceRate: number;
  replyRate: number;
  openRate: number;
  createdAt: string;
  isInstantlyAccount: boolean;
}

export default function EmailAccountsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [connectionType, setConnectionType] = useState<"gmail" | "outlook" | "smtp">("gmail");
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  // BYOE form state
  const [formData, setFormData] = useState({
    email: "",
    fromName: "",
    smtpHost: "",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    dailySendLimit: 50,
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchAccounts();
    }
  }, [authLoading, user]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/email-accounts", {
        headers: {
          Authorization: `Bearer ${user?.access_token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionTypeChange = (type: "gmail" | "outlook" | "smtp") => {
    setConnectionType(type);
    setConnectionError("");

    if (type === "gmail") {
      setFormData({
        ...formData,
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
      });
    } else if (type === "outlook") {
      setFormData({
        ...formData,
        smtpHost: "smtp-mail.outlook.com",
        smtpPort: 587,
      });
    } else {
      setFormData({
        ...formData,
        smtpHost: "",
        smtpPort: 587,
      });
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionError("");

    try {
      const response = await fetch("/api/email-accounts/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          smtpHost: formData.smtpHost,
          smtpPort: formData.smtpPort,
          smtpUsername: formData.smtpUsername,
          smtpPassword: formData.smtpPassword,
        }),
      });

      const data = await response.json();

      if (data.success && data.valid) {
        alert("✅ Connection successful! You can now add this account.");
      } else {
        setConnectionError(data.error || "Connection test failed");
      }
    } catch (error: any) {
      setConnectionError(error.message || "Connection test failed");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleAddAccount = async () => {
    try {
      const response = await fetch("/api/email-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ Email account added successfully!");
        setShowAddModal(false);
        setFormData({
          email: "",
          fromName: "",
          smtpHost: "",
          smtpPort: 587,
          smtpUsername: "",
          smtpPassword: "",
          dailySendLimit: 50,
        });
        fetchAccounts();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this email account?")) {
      return;
    }

    try {
      const response = await fetch(`/api/email-accounts/${accountId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.access_token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchAccounts();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handlePurchaseAccounts = async () => {
    const quantity = prompt("How many email accounts? (5 min, $8 each)");
    
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 5) {
      alert("Invalid quantity. Minimum 5 accounts.");
      return;
    }

    const cost = Number(quantity) * 8;
    
    if (!confirm(`Purchase ${quantity} accounts for $${cost}?`)) {
      return;
    }

    try {
      const response = await fetch("/api/email-accounts/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({ quantity: Number(quantity) }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Order placed! Accounts will arrive in 24h. Order ID: ${data.orderId}`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading email accounts...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
            Email Accounts
          </h1>
          <p className="text-gray-600">
            Connect your own accounts (free) or purchase pre-warmed accounts
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-white rounded hover:opacity-90"
            style={{ background: "var(--color-accent)", color: "var(--color-on-accent)" }}
          >
            + Connect Account
          </button>
          <button
            onClick={handlePurchaseAccounts}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            💳 Buy Accounts
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📮</div>
          <p className="text-gray-600 mb-4">No email accounts connected yet</p>
          <p className="text-sm text-gray-500 mb-6">
            Connect your own account (free) or purchase pre-warmed accounts ($8/account)
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 rounded-lg font-medium"
            style={{ background: "var(--color-strong)", color: "var(--color-on-strong)" }}
          >
            Connect First Account
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Daily Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Health
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {account.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {account.fromName || "No display name"}
                        {account.isInstantlyAccount && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Instantly
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : account.status === "WARMING_UP"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {account.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.dailySentCount} / {account.dailySendLimit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-3">
                      <span title="Bounce Rate">📉 {account.bounceRate.toFixed(1)}%</span>
                      <span title="Reply Rate">💬 {account.replyRate.toFixed(1)}%</span>
                      <span title="Open Rate">📧 {account.openRate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Connect Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                  Connect Email Account
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Connection Type Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => handleConnectionTypeChange("gmail")}
                  className={`px-4 py-2 rounded ${
                    connectionType === "gmail"
                      ? "text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  style={
                    connectionType === "gmail"
                      ? { background: "var(--color-accent)", color: "var(--color-on-accent)" }
                      : {}
                  }
                >
                  Gmail
                </button>
                <button
                  onClick={() => handleConnectionTypeChange("outlook")}
                  className={`px-4 py-2 rounded ${
                    connectionType === "outlook"
                      ? "text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  style={
                    connectionType === "outlook"
                      ? { background: "var(--color-accent)", color: "var(--color-on-accent)" }
                      : {}
                  }
                >
                  Outlook
                </button>
                <button
                  onClick={() => handleConnectionTypeChange("smtp")}
                  className={`px-4 py-2 rounded ${
                    connectionType === "smtp"
                      ? "text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  style={
                    connectionType === "smtp"
                      ? { background: "var(--color-accent)", color: "var(--color-on-accent)" }
                      : {}
                  }
                >
                  Custom SMTP
                </button>
              </div>

              {/* Help Text */}
              {connectionType === "gmail" && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="font-medium mb-1">Gmail Setup:</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Enable 2FA on your Google account</li>
                    <li>Generate App Password at myaccount.google.com/apppasswords</li>
                    <li>Use Gmail address as username and App Password below</li>
                  </ol>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your Name"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Host *
                    </label>
                    <input
                      type="text"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port *
                    </label>
                    <input
                      type="number"
                      value={formData.smtpPort}
                      onChange={(e) =>
                        setFormData({ ...formData, smtpPort: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Username *
                  </label>
                  <input
                    type="text"
                    value={formData.smtpUsername}
                    onChange={(e) =>
                      setFormData({ ...formData, smtpUsername: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Password *
                  </label>
                  <input
                    type="password"
                    value={formData.smtpPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, smtpPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Send Limit
                  </label>
                  <input
                    type="number"
                    value={formData.dailySendLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, dailySendLimit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: 50 for new, 100-200 for warmed
                  </p>
                </div>

                {connectionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {connectionError}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  {testingConnection ? "Testing..." : "Test Connection"}
                </button>
                <button
                  onClick={handleAddAccount}
                  className="px-4 py-2 text-white rounded hover:opacity-90"
                  style={{ background: "var(--color-accent)", color: "var(--color-on-accent)" }}
                >
                  Add Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
