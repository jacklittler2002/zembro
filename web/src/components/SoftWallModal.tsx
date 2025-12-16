import React from "react";

interface SoftWallModalProps {
  open: boolean;
  type: "credits" | "upgrade";
  message: string;
  onClose: () => void;
  onBilling: () => void;
}

export const SoftWallModal: React.FC<SoftWallModalProps> = ({ open, type, message, onClose, onBilling }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">
          {type === "credits" ? "Not Enough Credits" : "Upgrade Required"}
        </h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onBilling}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Billing
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
