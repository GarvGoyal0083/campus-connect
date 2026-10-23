// campus-connect/frontend/src/components/StudentTrackerView.jsx
import React, { useState, useEffect } from 'react';
import {
  Search, CheckCircle2, Clock, HelpCircle, GitMerge, Send
} from 'lucide-react';

const STAGES = ['Submitted', 'Triaged', 'Assigned', 'In Progress', 'Resolved'];

function getStageIndex(status) {
  if (status === 'Needs Info') return 0;
  const idx = STAGES.indexOf(status);
  return idx === -1 ? 1 : idx;
}

export default function StudentTrackerView({
  tickets,
  selectedTicketNumber,
  onSelectTicket,
  onSupplyMissingInfo
}) {
  const [searchInput, setSearchInput] = useState(selectedTicketNumber || '');
  const [detailedData, setDetailedData] = useState(null);
  const [supplyLocation, setSupplyLocation] = useState('');
  const [supplyNotes, setSupplyNotes] = useState('');
  const [submittingInfo, setSubmittingInfo] = useState(false);

  const activeTicketNumber = selectedTicketNumber || tickets?.[0]?.ticket_number || 'CC-2026-1041';

  useEffect(() => {
    if (activeTicketNumber) {
      setSearchInput(activeTicketNumber);
      fetchTicketDetails(activeTicketNumber);
    }
  }, [activeTicketNumber, tickets]);

  const fetchTicketDetails = async (tNum) => {
    if (!tNum) return;
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(tNum)}`);
      if (res.ok) {
        const data = await res.json();
        setDetailedData(data);
        setSupplyLocation(data.ticket.specific_location || '');
      }
    } catch (_) {
      // ignore
    }
  };

  const handleSupplySubmit = async (e) => {
    e.preventDefault();
    if (!detailedData?.ticket) return;
    setSubmittingInfo(true);
    try {
      await onSupplyMissingInfo(detailedData.ticket.ticket_number, {
        building: detailedData.ticket.building,
        specific_location: supplyLocation || '2nd Floor, North Wing Washroom (Sink #2)',
        additional_details: supplyNotes || 'Under-sink supply pipe leaking onto floor',
        photo_preset_key: 'plumbing_leak'
      });
      setSupplyNotes('');
      await fetchTicketDetails(detailedData.ticket.ticket_number);
    } finally {
      setSubmittingInfo(false);
    }
  };

  const ticket = detailedData?.ticket || tickets?.find(t => t.ticket_number === activeTicketNumber) || tickets?.[0];
  const currentStageIdx = ticket ? getStageIndex(ticket.status) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: Simple Ticket List (4 cols) */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Select or Search Ticket</h2>

        <form
          onSubmit={e => {
            e.preventDefault();
            if (searchInput.trim()) onSelectTicket(searchInput.trim().toUpperCase());
          }}
          className="flex gap-1.5"
        >
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Ticket # (e.g. CC-2026-1041)"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono"
          />
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium">
            Find
          </button>
        </form>

        <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
          {tickets?.map(t => {
            const isSelected = ticket?.ticket_number === t.ticket_number;
            return (
              <button
                key={t.ticket_number}
                type="button"
                onClick={() => onSelectTicket(t.ticket_number)}
                className={`w-full text-left p-3 rounded-lg border text-xs transition space-y-1 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold">#{t.ticket_number}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      t.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'Needs Info'
                        ? 'bg-amber-100 text-amber-800'
                        : isSelected
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <div className="font-medium line-clamp-1">{t.title}</div>
                <div className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {t.category} • {t.building?.split('(')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Ticket Details & Progress History (8 cols) */}
      <div className="lg:col-span-8 space-y-4">
        {ticket && (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      Ticket #{ticket.ticket_number}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {ticket.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {ticket.priority} Priority
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">{ticket.title}</h2>
                  <p className="text-xs text-slate-500">
                    {ticket.building} {ticket.specific_location ? `• ${ticket.specific_location}` : ''}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Status</span>
                  <span className="text-sm font-bold text-slate-900">{ticket.status}</span>
                </div>
              </div>

              {/* 5-Stage Progress Bar */}
              <div className="grid grid-cols-5 gap-2">
                {STAGES.map((stage, idx) => {
                  const done = idx <= currentStageIdx || ticket.status === 'Resolved';
                  return (
                    <div
                      key={stage}
                      className={`p-2.5 rounded-lg border text-center text-xs font-semibold ${
                        done
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      {idx + 1}. {stage}
                    </div>
                  );
                })}
              </div>

              {/* Supply Missing Details Box if Incomplete */}
              {(ticket.status === 'Needs Info' || !ticket.specific_location) && (
                <form
                  onSubmit={handleSupplySubmit}
                  className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3"
                >
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    Supply Missing Details for Ticket #{ticket.ticket_number}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={supplyLocation}
                      onChange={e => setSupplyLocation(e.target.value)}
                      placeholder="Exact Floor / Room (e.g. 2nd Floor North Washroom)"
                      className="bg-white border border-amber-300 rounded px-3 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={supplyNotes}
                      onChange={e => setSupplyNotes(e.target.value)}
                      placeholder="Fixture details (e.g. Under-sink pipe burst)"
                      className="bg-white border border-amber-300 rounded px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSupplyLocation('2nd Floor, North Wing Washroom (Sink #2)');
                        setSupplyNotes('Under-sink supply pipe burst');
                      }}
                      className="text-xs text-amber-800 underline"
                    >
                      Auto-fill sample details
                    </button>
                    <button
                      type="submit"
                      disabled={submittingInfo}
                      className="px-3.5 py-1.5 rounded bg-slate-900 text-white text-xs font-medium"
                    >
                      Save Missing Info
                    </button>
                  </div>
                </form>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Responsible Department:</span>
                  <span className="font-semibold text-slate-900">{ticket.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Assigned Staff / Technician:</span>
                  <span className="font-semibold text-slate-900">
                    {ticket.assigned_technician || 'Pending Assignment'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block">AI Summary:</span>
                  <span className="text-slate-800">{ticket.summary}</span>
                </div>
                {ticket.english_translation && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block">English Translation ({ticket.detected_language}):</span>
                    <span className="text-slate-800 italic">"{ticket.english_translation}"</span>
                  </div>
                )}
              </div>

              {ticket.photo_url && (
                <div>
                  <span className="text-xs font-medium text-slate-500 block mb-1">Attached Photograph:</span>
                  <img src={ticket.photo_url} alt="Evidence" className="max-h-44 rounded-lg border border-slate-200" />
                </div>
              )}
            </div>

            {/* Simple Progress History List */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Progress History</h3>
              <div className="space-y-2.5">
                {ticket.history?.map((h, i) => (
                  <div key={i} className="border-l-2 border-slate-900 pl-3 py-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{h.stage}</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {h.actor}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{h.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
