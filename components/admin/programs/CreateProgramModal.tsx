"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateProgramModalProps {
  onClose: () => void;
  onSave: (program: { name: string; description: string; duration: string; mode: string; highlights: string[] }) => Promise<void>;
}

export function CreateProgramModal({ onClose, onSave }: CreateProgramModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [mode, setMode] = useState("");
  const [highlights, setHighlights] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  const handleAddHighlight = () => {
    setHighlights([...highlights, ""]);
  };

  const handleHighlightChange = (index: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[index] = value;
    setHighlights(newHighlights);
  };

  const handleRemoveHighlight = (index: number) => {
    const newHighlights = highlights.filter((_, i) => i !== index);
    setHighlights(newHighlights);
  };

  const handleSave = async () => {
    if (!name || !description) return;
    setSaving(true);
    try {
      const validHighlights = highlights.filter((h) => h.trim() !== "");
      await onSave({ name, description, duration, mode, highlights: validHighlights });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="text-xl font-bold text-navy">Create New Program</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate hover:bg-navy/5 hover:text-navy transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-navy">Program Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Frontend Development"
                className="mt-1 block w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm text-navy focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-navy">Description <span className="text-red-500">*</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description for the landing page..."
                rows={3}
                className="mt-1 block w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm text-navy focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 8–12 weeks"
                  className="mt-1 block w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm text-navy focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy">Mode</label>
                <input
                  type="text"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  placeholder="e.g. Remote · Live"
                  className="mt-1 block w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm text-navy focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Highlights (Landing Page Bullets)</label>
              <div className="space-y-2">
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={highlight}
                      onChange={(e) => handleHighlightChange(index, e.target.value)}
                      placeholder="e.g. Live Projects"
                      className="block w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm text-navy focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey"
                    />
                    <button
                      onClick={() => handleRemoveHighlight(index)}
                      className="p-2 text-slate hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={handleAddHighlight} className="mt-2 text-xs">
                  <Plus className="mr-1 h-3 w-3" /> Add Highlight
                </Button>
              </div>
            </div>

          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-navy/10 bg-slate-50 px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !name || !description}>
            {saving ? "Creating..." : "Create Program"}
          </Button>
        </div>
      </div>
    </div>
  );
}
