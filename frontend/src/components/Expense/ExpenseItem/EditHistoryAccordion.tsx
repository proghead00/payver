"use client";

import { useState } from "react";
import { ExpandMore, ExpandLess } from "@mui/icons-material";

interface IEditedByUser {
  _id: string;
  email: string;
  name?: string;
}

interface EditHistory {
  editedBy: IEditedByUser;
  timestamp: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  reason?: string;
}

interface Props {
  editHistory: EditHistory[];
  currentUserId?: string;
}

const EditHistoryAccordion: React.FC<Props> = ({
  editHistory,
  currentUserId,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  console.log("HEY ", editHistory);
  // Helper function to format values
  const formatValue = (value: any, field: string): string => {
    if (value === null || value === undefined) return "N/A";

    // Handle paidBy field (now an object with _id and name)
    if (field === "paidBy") {
      if (typeof value === "object" && value.name) {
        return value.name;
      }
      return "N/A";
    }

    // Handle splitDetails field
    if (field === "splitDetails") {
      if (Array.isArray(value)) {
        const amounts = value.map((item) => {
          const amount =
            typeof item.amount === "number"
              ? item.amount
              : item.amount?.$numberInt || item.amount?.$numberDouble || 0;
          return `₹${Number(amount).toFixed(2)}`;
        });
        return amounts.join(", ");
      }
      return "N/A";
    }

    // Handle numeric values
    if (typeof value === "number") {
      return `₹${value.toFixed(2)}`;
    }

    // Handle MongoDB numeric types
    if (value?.$numberInt) return `₹${Number(value.$numberInt).toFixed(2)}`;
    if (value?.$numberDouble)
      return `₹${Number(value.$numberDouble).toFixed(2)}`;

    // Default to string representation
    return value?.toString() || "N/A";
  };

  // Helper to summarize splitDetails changes
  const summarizeSplitDetailsChanges = (oldValue: any[], newValue: any[]) => {
    if (!Array.isArray(oldValue) || !Array.isArray(newValue))
      return "Data format error";

    const oldAmount = oldValue[0]?.amount || 0;
    const newAmount = newValue[0]?.amount || 0;

    return (
      <>
        <span className="text-gray-500 line-through">
          ₹{oldAmount.toFixed(2)}
        </span>{" "}
        <span className="text-green-600 mx-1">→</span>{" "}
        <span className="text-gray-700 font-semibold">
          ₹{newAmount.toFixed(2)}
          <span className="ml-2 text-teal-600">(per user)</span>
        </span>
      </>
    );
  };

  // Helper to check if values are actually different
  const areValuesDifferent = (oldVal: any, newVal: any): boolean => {
    return JSON.stringify(oldVal) !== JSON.stringify(newVal);
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer transition-all duration-300 hover:scale-105"
      >
        <span className="font-medium">Edit History</span>
        {isOpen ? (
          <ExpandLess className="ml-1" />
        ) : (
          <ExpandMore className="ml-1" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {editHistory.map((edit, index) => {
            console.log("Edit object:", edit.editedBy, currentUserId); // Log edit object for debugging

            return (
              <div
                key={index}
                className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100"
              >
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Edited on {new Date(edit.timestamp).toLocaleString()} by{" "}
                    <strong className="text-blue-600">
                      {edit.editedBy._id === currentUserId ? (
                        <>
                          {edit.editedBy.name}{" "}
                          <span className="text-green-600">(you)</span>
                        </>
                      ) : (
                        edit.editedBy.name
                      )}
                    </strong>
                  </p>
                </div>

                <div className="mt-3 space-y-3">
                  {edit.changes
                    .filter((change) =>
                      areValuesDifferent(change.oldValue, change.newValue)
                    )
                    .map((change, i) => (
                      <div key={i} className="mt-2">
                        <strong className="capitalize text-purple-600">
                          {change.field}:
                        </strong>
                        <div className="ml-2">
                          {change.field === "splitDetails" ? (
                            <div className="text-gray-700">
                              {summarizeSplitDetailsChanges(
                                change.oldValue,
                                change.newValue
                              )}
                            </div>
                          ) : (
                            <>
                              <span className="text-gray-500 line-through">
                                {formatValue(change.oldValue, change.field)}
                              </span>{" "}
                              <span className="text-green-600 mx-1">→</span>{" "}
                              <span className="text-gray-700 font-semibold">
                                {formatValue(change.newValue, change.field)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                  {/* Reason Field */}
                  {edit.reason && (
                    <div className="mt-3">
                      <strong className="capitalize text-purple-600">
                        Reason:
                      </strong>
                      <div className="ml-2">
                        <span className="text-gray-700 italic">
                          {edit.reason}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EditHistoryAccordion;
