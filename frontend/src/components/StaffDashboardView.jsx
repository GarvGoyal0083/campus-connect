// campus-connect/frontend/src/components/StaffDashboardView.jsx
import React, { useState } from 'react';
import { GitMerge, Search, ArrowUpRight } from 'lucide-react';

const STATUS_OPTIONS = ['Needs Info', 'Triaged', 'Assigned', 'In Progress', 'Resolved'];

export default function StaffDashboardView({
  tickets,
  analytics,
  routingGuide,
  onStaffUpdateTicket,
  onOpenDuplicateModal,
  onViewInStudentTracker
}) {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingTicket, setUpdatingTicket] = useState('');

  const flaggedDuplicates = tickets?.filter(t => t.is_duplicate_flagged && !t.merged_into) || [];

  const filteredTickets = (tickets || []).filter(t => {
    if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (duplicatesOnly && !t.is_duplicate_flagged && !t.merged_into) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hay = `${t.ticket_number} ${t.title} ${t.original_complaint} ${t.building} ${t.student_name}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const getTechniciansForCategory = (cat) => {
    const rule = routingGuide?.find(r => r.category === cat) || routingGuide?.[0];
    return rule?.technicians || [];
  };

  const handleUpdate = async (ticket, updates) => {
    setUpdatingTicket(ticket.ticket_number);
    try {
      await onStaffUpdateTicket(ticket.ticket_number, updates);
    } finally {
      setUpdatingTicket('');
    }
  };

  return (
    <div className="space-y-5">
      {/* Simple 4 Summary Boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-500">Active Tickets</span>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">
            {analytics?.kpis?.active_tickets ?? tickets?.filter(t => t.status !== 'Resolved').length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-500">Critical Priority</span>
          <div className="text-2xl font-bold text-rose-600 mt-0.5">
            {analytics?.kpis?.critical_open ?? 0}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-500">Flagged Duplicates</span>
          <div className="text-2xl font-bold text-amber-600 mt-0.5">
            {flaggedDuplicates.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-500">Hindi / Hinglish Reports</span>
          <div className="text-2xl font-bold text-emerald-600 mt-0.5">
            {analytics?.kpis?.multilingual_complaints ?? 0}
          </div>
        </div>
      </div>

      {/* Duplicate Review Notice */}
      {flaggedDuplicates.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-amber-900">
            <strong>Duplicate Alert:</strong> Ticket <strong>#{flaggedDuplicates[0].ticket_number}</strong> is a {flaggedDuplicates[0].duplicate_similarity}% match with active ticket <strong>#{flaggedDuplicates[0].duplicate_of_ticket}</strong>.
          </div>
          <button
            type="button"
            onClick={() => onOpenDuplicateModal(flaggedDuplicates[0])}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <GitMerge className="w-3.5 h-3.5" />
            Review Duplicate (#{flaggedDuplicates[0].ticket_number})
          </button>
        </div>
      )}

      {/* Simple Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
          >
            <option value="All">All Categories (4)</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electricity">Electricity</option>
            <option value="Cleanliness">Cleanliness</option>
            <option value="Internet Connectivity">Internet Connectivity</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer px-2">
            <input
              type="checkbox"
              checked={duplicatesOnly}
              onChange={e => setDuplicatesOnly(e.target.checked)}
              className="rounded"
            />
            Duplicates Only
          </label>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search ticket #, location..."
            className="border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Simple Ticket List for Staff */}
      <div className="space-y-3">
        {filteredTickets.map(ticket => {
          const technicians = getTechniciansForCategory(ticket.category);
          const isUpdating = updatingTicket === ticket.ticket_number;

          return (
            <div
              key={ticket.ticket_number}
              className={`bg-white border rounded-xl p-4 shadow-sm space-y-3 ${
                ticket.is_duplicate_flagged ? 'border-amber-400' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                      #{ticket.ticket_number}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {ticket.category} → {ticket.department}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {ticket.priority} Priority
                    </span>
                    {ticket.is_duplicate_flagged && (
                      <button
                        type="button"
                        onClick={() => onOpenDuplicateModal(ticket)}
                        className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300"
                      >
                        ⚠ Potential Duplicate of #{ticket.duplicate_of_ticket} (Review)
                      </button>
                    )}
                    {ticket.merged_into && (
                      <span className="text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">
                        Merged into #{ticket.merged_into}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{ticket.title}</h3>
                  <p className="text-xs text-slate-500">
                    {ticket.building} {ticket.specific_location ? `• ${ticket.specific_location}` : ''} • Reported by {ticket.student_name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onViewInStudentTracker(ticket.ticket_number)}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 border border-slate-200 rounded-lg px-2.5 py-1"
                >
                  Track View <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div><strong>Summary:</strong> {ticket.summary}</div>
                {ticket.english_translation && (
                  <div className="text-emerald-800">
                    <strong>Translated ({ticket.detected_language}):</strong> "{ticket.english_translation}"
                  </div>
                )}
              </div>

              {/* Staff Controls: Assign Technician & Update Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-600">Assign Staff:</label>
                  <select
                    value={ticket.assigned_technician || ''}
                    disabled={isUpdating}
                    onChange={e => {
                      const chosen = technicians.find(t => `${t.name} (${t.role})` === e.target.value);
                      handleUpdate(ticket, {
                        assigned_technician: e.target.value,
                        technician_phone: chosen?.phone || '',
                        status: ticket.status === 'Triaged' ? 'Assigned' : ticket.status,
                        staff_note: `Assigned to ${e.target.value}.`
                      });
                    }}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                  >
                    <option value="">-- Select Technician --</option>
                    {technicians.map(tech => {
                      const label = `${tech.name} (${tech.role})`;
                      return (
                        <option key={tech.id} value={label}>{label}</option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-slate-600 mr-1">Status:</span>
                  {STATUS_OPTIONS.map(st => (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => {
                        const defaultTech =
                          !ticket.assigned_technician && (st === 'Assigned' || st === 'In Progress' || st === 'Resolved')
                            ? `${technicians[0]?.name} (${technicians[0]?.role})`
                            : ticket.assigned_technician;
                        handleUpdate(ticket, {
                          status: st,
                          assigned_technician: defaultTech,
                          staff_note: `Status updated to ${st}.`
                        });
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                        ticket.status === st
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simple Recurring Issues Section */}
      {analytics?.recurring_hotspots?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Recurring-Issue Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {analytics.recurring_hotspots.slice(0, 3).map((h, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs space-y-1">
                <div className="font-bold text-slate-900">{h.building}</div>
                <div className="text-slate-600">
                  {h.category} • {h.ticket_count} Ticket(s) ({h.affected_students} students)
                </div>
                <p className="text-slate-500 pt-1">{h.ai_preventive_insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
