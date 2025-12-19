"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SoftWallModal } from "../../../components/SoftWallModal";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  fetchLeadLists,
  fetchLeadList,
  createLeadList,
  removeLeadsFromList as removeLeadsFromListApi,
  exportLeadList,
    updateLeadListMeta,
    deleteLeadList as deleteLeadListApi,
} from "@/lib/api/lists";

interface List {
  id: string;
  name: string;
  description: string | null;
  color: string;
  leadCount: number;
  createdAt: string;
  leads: Array<{
    id: string;
    companyId: string;
    contactId: string | null;
    notes: string | null;
    addedAt: string;
    company: {
      id: string;
      name: string;
      domain: string | null;
      industry: string | null;
    };
    contact: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      role: string | null;
    } | null;
  }>;
}

export default function ListsPage() {
  const { user } = useRequireAuth();
  const router = useRouter();

  const [lists, setLists] = useState<List[]>([]);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [softWallModal, setSoftWallModal] = useState<null | { type: 'credits' | 'upgrade', message: string }>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("#3B82F6");
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());

  // Create list form
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [newListColor, setNewListColor] = useState("#3B82F6");

  useEffect(() => {
    if (user) {
      loadLists();
    }
  }, [user]);

  async function loadLists() {
    try {
      setError(null);
      const data = await fetchLeadLists();

      // Fetch a small preview (first 3 leads) for each list so the grid shows a preview
      const withPreviews = await Promise.all(
        data.map(async (l) => {
          try {
            const full = await fetchLeadList(l.id);
            return {
              ...l,
              color: l.color || "#3B82F6",
              leads: (full.leads || []).slice(0, 3),
            } as List;
          } catch (e) {
            // Fallback to no preview if detail fetch fails
            return {
              ...l,
              color: l.color || "#3B82F6",
              leads: [],
            } as List;
          }
        })
      );

      setLists(withPreviews);
    } catch (error: any) {
      console.error("Error loading lists:", error);
      setError(error.message || "Failed to load lists.");
    } finally {
      setLoading(false);
    }
  }

  async function loadListDetails(listId: string) {
    try {
      const list = await fetchLeadList(listId);
      setSelectedList({ ...list, color: list.color || "#3B82F6" });
      // Sync edit buffers if currently editing
      setEditName(list.name || "");
      setEditDescription(list.description || "");
      setEditColor(list.color || "#3B82F6");
    } catch (error: any) {
      console.error("Error loading list details:", error);
      alert(error.message);
    }
  }

  async function renameOrStyleList(updates: { name?: string; description?: string | null; color?: string }) {
    if (!selectedList) return;
    try {
      await updateLeadListMeta(selectedList.id, {
        name: updates.name,
        description: updates.description,
      });
      await loadListDetails(selectedList.id);
      await loadLists();
    } catch (error: any) {
      console.error("Error updating list:", error);
      alert(error.message);
    }
  }

  async function exportListCsv() {
    if (!selectedList) return;
    try {
      const result = await exportLeadList(selectedList.id);
      if (!result.ok) {
        if (result.error === "INSUFFICIENT_CREDITS") {
          setSoftWallModal({
            type: 'credits',
            message: `Not enough credits to export. Required: ${result.required}, Available: ${result.available}. Please top up or upgrade.`,
          });
          return;
        }
        if (result.error === "UPGRADE_REQUIRED") {
          setSoftWallModal({
            type: 'upgrade',
            message: "This export exceeds your plan limits. Please upgrade to increase export limits.",
          });
          return;
        }
        setSoftWallModal({ type: 'upgrade', message: result.error || 'Export failed' });
        return;
      }

      const blobUrl = window.URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.message?.includes("UPGRADE_REQUIRED")) {
        setSoftWallModal({
          type: 'upgrade',
          message: "This export exceeds your plan limits. Please upgrade to increase export limits.",
        });
        return;
      }
      console.error("Failed to export list:", err);
      setSoftWallModal({ type: 'upgrade', message: err.message || 'Failed to export list' });
    }
  }
        {/* Soft Wall Modal for Credits/Upgrade */}
        <SoftWallModal
          open={!!softWallModal}
          type={softWallModal?.type || 'upgrade'}
          message={softWallModal?.message || ''}
          onClose={() => setSoftWallModal(null)}
          onBilling={() => {
            setSoftWallModal(null);
            router.push('/app/billing');
          }}
        />

  async function createList() {
    if (!newListName.trim()) {
      alert("Please enter a list name");
      return;
    }

    try {
      await createLeadList({
        name: newListName,
        description: newListDescription || null,
      });
      setNewListName("");
      setNewListDescription("");
      setNewListColor("#3B82F6");
      setShowCreateModal(false);
      loadLists();
    } catch (error: any) {
      console.error("Error creating list:", error);
      alert(error.message);
    }
  }

  async function deleteList(listId: string) {
    try {
      await deleteLeadListApi(listId);

      if (selectedList?.id === listId) {
        setSelectedList(null);
      }
      setShowDeleteConfirm(null);
      loadLists();
    } catch (error: any) {
      console.error("Error deleting list:", error);
      alert(error.message);
    }
  }

  async function removeLeadsFromList(listId: string, leadIds: string[]) {
    try {
      await removeLeadsFromListApi(listId, leadIds);
      setSelectedLeads(new Set());
      loadListDetails(listId);
      loadLists();
    } catch (error: any) {
      console.error("Error removing leads:", error);
      alert(error.message);
    }
  }

  const filteredLists = lists.filter(list =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  function toggleListSelect(id: string) {
    const newSelected = new Set(selectedLists);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedLists(newSelected);
  }

  function selectAllLists() {
    if (selectedLists.size === filteredLists.length) {
      setSelectedLists(new Set());
    } else {
      setSelectedLists(new Set(filteredLists.map(l => l.id)));
    }
  }

  async function bulkDeleteLists() {
    if (selectedLists.size === 0) return;
    if (!confirm(`Delete ${selectedLists.size} lists?`)) return;
    try {
      await Promise.all(Array.from(selectedLists).map(id => deleteLeadListApi(id)));
      setSelectedLists(new Set());
      loadLists();
    } catch (error: any) {
      console.error("Error deleting lists:", error);
      alert(error.message);
    }
  }

  function toggleLeadSelection(leadId: string) {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeads(newSelection);
  }

  function selectAllLeads() {
    if (!selectedList) return;
    const allLeadIds = selectedList.leads.map((l) => l.id);
    setSelectedLeads(new Set(allLeadIds));
  }

  function deselectAllLeads() {
    setSelectedLeads(new Set());
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ui p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-accent">Loading lists...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ui p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-error-soft border border-error rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-2 text-error">Error Loading Lists</h2>
            <p className="mb-4 text-ui">{error}</p>
            <button
              onClick={loadLists}
              className="btn btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const colorOptions = [
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#10B981" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Red", value: "#EF4444" },
    { name: "Orange", value: "#F59E0B" },
    { name: "Pink", value: "#EC4899" },
  ];

  return (
    <div className="min-h-screen bg-ui p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-accent">Lists</h1>
            <p className="mt-1 text-accent">Organize leads into collections for campaigns</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Create List
          </button>
        </div>

        {/* List Grid or Detail View */}
        {!selectedList ? (
          <>
            {/* Filters and Search */}
            <div className="bg-surface border border-ui rounded-lg p-6 mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedLists.size === filteredLists.length && filteredLists.length > 0}
                    onChange={selectAllLists}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm text-accent">Select All</label>
                </div>
                <div className="flex-1 min-w-64">
                  <input
                    type="text"
                    placeholder="Search lists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-ui rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {selectedLists.size > 0 && (
                  <button onClick={bulkDeleteLists} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Delete Selected ({selectedLists.size})
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredLists.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-surface rounded-lg border-2 border-dashed border-ui">
                  <p className="mb-4 text-accent">No lists yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                  >
                    Create Your First List
                  </button>
                </div>
              ) : (
                filteredLists.map((list) => (
                  <div
                    key={list.id}
                    className="bg-surface rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-ui"
                    onClick={() => loadListDetails(list.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedLists.has(list.id)}
                            onChange={(e) => { e.stopPropagation(); toggleListSelect(list.id); }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                          />
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: list.color }}
                          />
                          <h3 className="text-lg font-semibold text-accent truncate">{list.name}</h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(list.id);
                          }}
                          className="text-red-600 hover:text-red-800 flex-shrink-0 ml-2"
                        >
                          Delete
                        </button>
                      </div>

                      {list.description && (
                        <p className="text-sm mb-4 line-clamp-2 text-sidebar leading-relaxed">{list.description}</p>
                      )}

                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-sidebar font-medium">{list.leadCount} {list.leadCount === 1 ? "lead" : "leads"}</span>
                        <span className="font-medium text-accent">View →</span>
                      </div>

                      {/* Preview of first few companies */}
                      {list.leads && list.leads.length > 0 && (
                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-xs mb-2 text-sidebar font-medium">Preview:</p>
                            {list.leads.slice(0, 3).map((lead) => (
                              <div key={lead.id} className="text-xs truncate text-sidebar mb-1">• {lead.company.name}</div>
                            ))}
                      </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          // List Detail View
          <div className="bg-surface rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setSelectedList(null);
                    setSelectedLeads(new Set());
                  }}
                  className="text-sidebar hover:underline"
                >
                  Back to Lists
                </button>
                {!isEditingMeta ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: selectedList.color }} />
                    <h2 className="text-2xl font-bold text-ui">{selectedList.name}</h2>
                    <button
                      onClick={() => {
                        setIsEditingMeta(true);
                        setEditName(selectedList.name || "");
                        setEditDescription(selectedList.description || "");
                        setEditColor(selectedList.color || "#3B82F6");
                      }}
                      className="ml-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-end gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="List name"
                        className="px-3 py-2 border rounded-lg"
                      />
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-10 h-10 p-1 border rounded"
                        title="List color"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await renameOrStyleList({ name: editName, description: editDescription, color: editColor });
                          setIsEditingMeta(false);
                        }}
                        className="btn btn-primary"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingMeta(false);
                          setEditName(selectedList.name || "");
                          setEditDescription(selectedList.description || "");
                          setEditColor(selectedList.color || "#3B82F6");
                        }}
                        className="btn btn-ghost"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportListCsv}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Export All CSV
                </button>
                {selectedLeads.size > 0 && (
                  <button
                    onClick={() =>
                      removeLeadsFromList(
                        selectedList.id,
                        Array.from(selectedLeads)
                      )
                    }
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Remove Selected ({selectedLeads.size})
                  </button>
                )}
                <button
                  onClick={() => router.push(`/app/campaigns/new?listId=${selectedList.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Campaign from List
                </button>
              </div>
            </div>

            {selectedList.description && !isEditingMeta && (
              <p className="mb-6 text-sidebar">{selectedList.description}</p>
            )}

            <div className="mb-4 flex items-center justify-between">
              <p className="text-sidebar">{selectedList.leadCount} {selectedList.leadCount === 1 ? "lead" : "leads"}</p>
              <div className="flex gap-2">
                <button onClick={selectAllLeads} className="text-sm font-medium text-accent">Select All</button>
                <button onClick={deselectAllLeads} className="text-sm font-medium text-sidebar">Deselect All</button>
              </div>
            </div>

            {/* Leads Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-sidebar">Select</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-accent">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: "var(--color-sidebar-border)" }}>
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: "var(--color-sidebar-border)" }}>
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: "var(--color-sidebar-border)" }}>
                      Industry
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: "var(--color-sidebar-border)" }}>
                      Added
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-ui">
                  {selectedList.leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center" style={{ color: "var(--color-sidebar-border)" }}>
                        No leads in this list yet
                      </td>
                    </tr>
                  ) : (
                    selectedList.leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-surface-muted">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => toggleLeadSelection(lead.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {lead.company.name}
                        </td>
                        <td className="px-4 py-4 text-sm" style={{ color: "var(--color-sidebar-border)" }}>
                          {lead.contact
                            ? `${lead.contact.firstName || ""} ${lead.contact.lastName || ""}`.trim() || "N/A"
                            : "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm" style={{ color: "var(--color-sidebar-border)" }}>
                          {lead.contact?.email || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm" style={{ color: "var(--color-sidebar-border)" }}>
                          {lead.company.industry || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm" style={{ color: "var(--color-sidebar-border)" }}>
                          {new Date(lead.addedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create List Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-ui">Create New List</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                    List Name *
                  </label>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., Marketing Q1 Prospects"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                    Description
                  </label>
                  <textarea
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
                    Color
                  </label>
                  <div className="flex gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewListColor(color.value)}
                        className={`w-10 h-10 rounded-lg ${
                          newListColor === color.value
                            ? "ring-2 ring-offset-2 ring-gray-400"
                            : ""
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewListName("");
                    setNewListDescription("");
                    setNewListColor("#3B82F6");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createList}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create List
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-ui">Delete List?</h3>
              <p className="mb-6" style={{ color: "var(--color-error)" }}>
                This will permanently delete this list and all its leads. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-ui rounded-lg hover:bg-surface-muted text-ui"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteList(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
