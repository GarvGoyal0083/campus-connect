// campus-connect/frontend/src/components/RoutingGuideModal.jsx
import React from 'react';
import {
  X, Building2, Droplets, Zap, Sparkles, Wifi, Clock,
  UserCheck, CheckCircle2, ShieldAlert, BookOpen
} from 'lucide-react';

const CATEGORY_ICONS = {
  Plumbing: { icon: Droplets, badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  Electricity: { icon: Zap, badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  Cleanliness: { icon: Sparkles, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Internet Connectivity': { icon: Wifi, badge: 'bg-violet-50 text-violet-700 border-violet-200' }
};

export default function RoutingGuideModal({ isOpen, onClose, campus, routingGuide }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#0b132b]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0b132b] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-sky-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                Supplied Campus Routing Guide &amp; SLA Matrix
                <span className="text-xs px-3 py-0.5 rounded-full bg-white/15 text-sky-200 font-mono">
                  Gemini System Context
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Single Campus Scope: <span className="text-white font-semibold">{campus?.name}</span> • 4 Official Maintenance Categories
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-[#fbfdff]">
          {/* Campus Buildings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0b132b] mb-3">
              <Building2 className="w-4 h-4 text-sky-600" />
              Supported Campus Buildings &amp; Zones ({campus?.code})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {campus?.buildings?.map(b => (
                <div key={b.id} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <div className="text-xs font-mono font-bold text-sky-700">{b.id}</div>
                  <div className="text-sm font-bold text-[#0b132b] mt-0.5">{b.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {b.zones.slice(0, 4).join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Categories Routing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routingGuide?.map(rule => {
              const meta = CATEGORY_ICONS[rule.category] || CATEGORY_ICONS.Plumbing;
              const Icon = meta.icon;
              return (
                <div
                  key={rule.rule_id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`p-2.5 rounded-xl border ${meta.badge}`}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-extrabold text-[#0b132b]">{rule.category}</span>
                            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#0b132b] text-white font-semibold">
                              {rule.rule_id}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-sky-700 mt-0.5">
                            {rule.department}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rule.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-semibold">Department Head</span>
                        <span className="text-[#0b132b] font-bold">{rule.head_of_department}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-semibold">Dispatch Contact</span>
                        <span className="text-[#0b132b] font-mono text-[11px]">{rule.contact_ext}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                        Required Information Checklist (AI Verification)
                      </div>
                      <ul className="space-y-1">
                        {rule.required_details_checklist.map((item, idx) => (
                          <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-sky-600" /> Target SLA Windows:
                      </span>
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          Crit: {rule.sla_hours.Critical}h
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          High: {rule.sla_hours.High}h
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                          Med: {rule.sla_hours.Medium}h
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold mb-1 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> On-Duty Field Technicians:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rule.technicians.map(t => (
                          <span
                            key={t.id}
                            className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0b132b] font-medium"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Gemini uses this exact routing guide to classify complaints, detect missing details, and assign departments.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#0b132b] hover:bg-[#17254e] text-white text-xs font-bold transition"
          >
            Close Routing Guide
          </button>
        </div>
      </div>
    </div>
  );
}
