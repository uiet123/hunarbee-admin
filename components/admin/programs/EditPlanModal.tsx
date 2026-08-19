"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditPlanModalProps {
  plan: { id: string; name: string; price: number; duration_months: number; total_days: number };
  onClose: () => void;
  onSave: (planId: string, data: { price: number; duration_months: number; total_days: number }) => Promise<void>;
}

export function EditPlanModal({ plan, onClose, onSave }: EditPlanModalProps) {
  const [price, setPrice] = useState(plan.price.toString());
  const [durationMonths, setDurationMonths] = useState(plan.duration_months.toString());
  const [totalDays, setTotalDays] = useState(plan.total_days.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!price || !durationMonths || !totalDays) return;
    setSaving(true);
    try {
      await onSave(plan.id, {
        price: Number(price),
        duration_months: Number(durationMonths),
        total_days: Number(totalDays),
      });
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = price && durationMonths && totalDays;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="text-xl font-bold text-navy">Edit Plan</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate hover:bg-navy/5 hover:text-navy transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">

          <div>
            <label className="block text-sm font-semibold text-navy mb-1">Price (INR) <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 5000"
              min="0"
              className="block w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm text-navy focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">Duration (Months) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={durationMonths}
                onChange={(e) => {
                  setDurationMonths(e.target.value);
                  if (e.target.value) {
                    setTotalDays((Number(e.target.value) * 30).toString());
                  } else {
                    setTotalDays("");
                  }
                }}
                placeholder="e.g. 1"
                min="1"
                className="block w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm text-navy focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">Total Days <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={totalDays}
                readOnly
                placeholder="e.g. 30"
                className="block w-full rounded-lg border border-navy/20 bg-slate-50 px-4 py-2 text-sm text-navy/70 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-navy/10 bg-slate-50 px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !isFormValid}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
