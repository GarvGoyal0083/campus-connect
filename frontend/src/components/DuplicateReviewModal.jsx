// campus-connect/frontend/src/components/DuplicateReviewModal.jsx
import React, { useState } from 'react';
import {
  X, GitMerge, MapPin, User, Languages, Sparkles, ShieldCheck
} from 'lucide-react';

export default function DuplicateReviewModal({
  isOpen,
  onClose,
  flaggedTicket,
  primaryTicket,
  onMerge,
  onDismiss
}) {
  const [staffNote, setStaffNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !flaggedTicket) return null;

  const handleAction = async (actionType) => {
    setSubmitting(true);
    try {
      if (actionType === 'merge') {
        await onMerge(flaggedTicket.ticket_number, primaryTicket?.ticket_number || flaggedTicket.duplicate_of_ticket, staffNote);
      } else {
        await onDismiss(flaggedTicket.ticket_number, staffNote);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden text-[#0b132b]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0b132b] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">Staff Duplicate Report Review</h2>
                <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-400 text-slate-950">
                  {flaggedTicket.duplicate_similarity || 92}% AI Similarity Match
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Compare incoming report <span className="text-amber-300 font-mono font-bold">#{flaggedTicket.ticket_number}</span> against active primary ticket <span className="text-sky-300 font-mono font-bold">#{primaryTicket?.ticket_number || flaggedTicket.duplicate_of_ticket}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto bg-[#fbfdff]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Flagged Incoming Ticket */}
            <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-900">
                  Flagged Incoming Report
                </span>
                <span className="font-mono text-sm font-extrabold text-[#0b132b]">
                  #{flaggedTicket.ticket_number}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-[#0b132b]">{flaggedTicket.title}</h3>
                <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{flaggedTicket.building} • {flaggedTicket.specific_location || 'Same Zone'}</span>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                  <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>{flaggedTicket.student_name} ({flaggedTicket.student_roll})</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Original Student Message:</span>
                  <span className="flex items-center gap-1 text-sky-700">
                    <Languages className="w-3 h-3" /> {flaggedTicket.detected_language}
                  </span>
                </div>
                <p className="text-xs text-[#0b132b] italic">"{flaggedTicket.original_complaint}"</p>
                {flaggedTicket.english_translation && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] text-emerald-700 font-bold block">
                      Gemini English Translation:
                    </span>
                    <p className="text-xs text-slate-700 mt-0.5">
                      "{flaggedTicket.english_translation}"
                    </p>
                  </div>
                )}
              </div>

              {flaggedTicket.photo_url && (
                <img
                  src={flaggedTicket.photo_url}
                  alt="Flagged ticket evidence"
                  className="w-full h-32 object-cover rounded-xl border border-slate-200"
                />
              )}
            </div>

            {/* Active Primary Ticket */}
            <div className="bg-[#0b132b] text-white rounded-2xl p-4 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/15 text-sky-200">
                  Existing Active Primary Ticket
                </span>
                <span className="font-mono text-sm font-extrabold text-sky-300">
                  #{primaryTicket?.ticket_number || flaggedTicket.duplicate_of_ticket}
                </span>
              </div>

              {primaryTicket ? (
                <>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{primaryTicket.title}</h3>
                    <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{primaryTicket.building} • {primaryTicket.specific_location}</span>
                    </div>
                    <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                      <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        Reported by {primaryTicket.student_name} • Status:{' '}
                        <strong className="text-emerald-300">{primaryTicket.status}</strong> ({primaryTicket.upvotes || 1} students)
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/10 rounded-xl p-3 space-y-2">
                    <span className="text-[11px] text-slate-300 block font-semibold">Primary Complaint Description:</span>
                    <p className="text-xs text-white italic">"{primaryTicket.original_complaint}"</p>
                    {primaryTicket.assigned_technician && (
                      <div className="pt-2 border-t border-white/10 text-xs text-sky-300">
                        Assigned Technician: <strong>{primaryTicket.assigned_technician}</strong>
                      </div>
                    )}
                  </div>

                  {primaryTicket.photo_url && (
                    <img
                      src={primaryTicket.photo_url}
                      alt="Primary ticket evidence"
                      className="w-full h-32 object-cover rounded-xl border border-white/15"
                    />
                  )}
                </>
              ) : (
                <div className="text-xs text-slate-300 py-8 text-center">
                  Primary Ticket #{flaggedTicket.duplicate_of_ticket} shares the same building, floor, and category.
                </div>
              )}
            </div>
          </div>

          {/* Why Gemini Flagged This */}
          <div className="bg-[#eef6ff] border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1">
              <div className="font-extrabold text-[#0b132b]">
                Why Gemini AI Flagged This as a Duplicate ({flaggedTicket.duplicate_similarity || 92}% Confidence):
              </div>
              <p>
                Both reports reference <strong className="text-[#0b132b]">{flaggedTicket.building}</strong> ({flaggedTicket.specific_location || '2nd Floor Washroom'}), belong to category <strong className="text-[#0b132b]">{flaggedTicket.category}</strong>, and describe the same physical defect across {flaggedTicket.detected_language} and English.
              </p>
            </div>
          </div>

          {/* Optional Staff Audit Note */}
          <div>
            <label className="block text-xs font-bold text-[#0b132b] mb-1.5">
              Staff Review Note (logged in student &amp; staff ticket history):
            </label>
            <input
              type="text"
              value={staffNote}
              onChange={e => setStaffNote(e.target.value)}
              placeholder="e.g., Confirmed same 2nd floor North Washroom pipe leak. Consolidating under #CC-2026-1041."
              className="w-full bg-white border border-slate-300 rounded-full px-4 py-2.5 text-xs text-[#0b132b] focus:outline-none focus:border-[#0b132b]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => handleAction('dismiss')}
            disabled={submitting}
            className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#0b132b] text-xs font-bold transition flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            Keep as Separate Ticket (Dismiss Flag)
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-slate-500 hover:text-[#0b132b] text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAction('merge')}
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-[#0b132b] hover:bg-[#17254e] text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
            >
              <GitMerge className="w-4 h-4 text-amber-300" />
              Merge into #{primaryTicket?.ticket_number || flaggedTicket.duplicate_of_ticket} (+1 Student)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
