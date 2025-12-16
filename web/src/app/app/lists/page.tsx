"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SoftWallModal } from "../../components/SoftWallModal";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabaseBrowser } from "@/lib/supabaseClient";
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
      const data = await fetchLeadLists();
      setLists(
        data.map((l) => ({
          ...l,
          color: l.color || "#3B82F6",
          leads: [],
        }))
      );
    } catch (error: any) {
      console.error("Error loading lists:", error);
      alert(error.message);
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading lists...</p>
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lists</h1>
            <p className="text-gray-600 mt-1">
              Organize leads into collections for campaigns
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Create List
          </button>
        </div>

        {/* List Grid or Detail View */}
        {!selectedList ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-600 mb-4">No lists yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Your First List
                </button>
              </div>
            ) : (
              lists.map((list) => (
                <div
                  key={list.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => loadListDetails(list.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: list.color }}
                      />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {list.name}
                      </h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(list.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>

                  {list.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {list.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {list.leadCount} {list.leadCount === 1 ? "lead" : "leads"}
                    </span>
                    <span className="text-blue-600 font-medium">
                      View →
                    </span>
                  </div>

                  {/* Preview of first few companies */}
                  {list.leads && list.leads.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Preview:</p>
                      {list.leads.slice(0, 3).map((lead) => (
                        <div key={lead.id} className="text-xs text-gray-600 truncate">
                          • {lead.company.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          // List Detail View
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setSelectedList(null);
                    setSelectedLeads(new Set());
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Back to Lists
                </button>
                {!isEditingMeta ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: selectedList.color }} />
                    <h2 className="text-2xl font-bold text-gray-900">{selectedList.name}</h2>
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
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
              <p className="text-gray-600 mb-6">{selectedList.description}</p>
            )}

            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                {selectedList.leadCount} {selectedList.leadCount === 1 ? "lead" : "leads"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={selectAllLeads}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllLeads}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Leads Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Select
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Industry
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Added
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedList.leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No leads in this list yet
                      </td>
                    </tr>
                  ) : (
                    selectedList.leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => toggleLeadSelection(lead.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {lead.company.name}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {lead.contact
                            ? `${lead.contact.firstName || ""} ${lead.contact.lastName || ""}`.trim() || "N/A"
                            : "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {lead.contact?.email || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {lead.company.industry || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
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
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Create New List</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Delete List?</h3>
              <p className="text-gray-600 mb-6">
                This will permanently delete this list and all its leads. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
