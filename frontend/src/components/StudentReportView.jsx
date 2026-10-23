// campus-connect/frontend/src/components/StudentReportView.jsx
import React, { useState } from 'react';
import {
  Sparkles, Camera, AlertTriangle, CheckCircle2,
  Send, Languages, HelpCircle, Upload, Trash2,
  GitMerge, ThumbsUp, RefreshCw
} from 'lucide-react';

const QUICK_SCENARIOS = [
  {
    id: 'demo_incomplete_en',
    label: 'Incomplete Plumbing (English)',
    complaintText: 'Water is leaking really badly from a pipe near the sink and flooding the floor!',
    building: 'Hostel Block B (Bhaskara Hall)',
    specificLocation: '',
    photoPresetKey: ''
  },
  {
    id: 'demo_incomplete_hi',
    label: 'Hindi Complaint (हिंदी)',
    complaintText: 'हॉस्टल बी के वॉशरूम में बेसिन के नीचे पाइप टूट गया है और बहुत तेज पानी बह रहा है!',
    building: 'Hostel Block B (Bhaskara Hall)',
    specificLocation: '',
    photoPresetKey: ''
  },
  {
    id: 'demo_electric',
    label: 'Electricity + Photo',
    complaintText: 'The 16A power socket near the lab workbench sparked with a loud pop and has black burn marks.',
    building: 'Academic Block 1 (Turing Hall)',
    specificLocation: '2nd Floor, Lab 202',
    photoPresetKey: 'electrical_spark'
  },
  {
    id: 'demo_wifi_hinglish',
    label: 'Wi-Fi Outage (Hinglish)',
    complaintText: 'Library 1st floor reading zone mein Campus_WiFi connect ho raha hai par internet bilkul nahi chal raha, router pe red LOS light blink kar rahi hai.',
    building: 'Central Library & Learning Commons',
    specificLocation: '1st Floor Digital Zone',
    photoPresetKey: 'internet_router'
  },
  {
    id: 'demo_cleanliness',
    label: 'Cleanliness + Photo',
    complaintText: 'The dustbin near the Cafeteria handwash corridor is overflowing with trash onto the floor.',
    building: 'Student Activity Center & Cafeteria',
    specificLocation: 'Ground Floor Handwash Area',
    photoPresetKey: 'cleanliness_waste'
  }
];

const PHOTO_PRESETS = [
  { key: 'plumbing_leak', label: 'Pipe Leak Photo' },
  { key: 'electrical_spark', label: 'Burnt Socket Photo' },
  { key: 'cleanliness_waste', label: 'Overflowing Bin Photo' },
  { key: 'internet_router', label: 'Router Red Light Photo' }
];

export default function StudentReportView({
  campus,
  samplePhotos,
  onTicketCreated,
  onUpvoteExisting,
  externalDraft,
  clearExternalDraft
}) {
  const [studentName, setStudentName] = useState('Aarav Sharma');
  const [studentRoll, setStudentRoll] = useState('EIT2024CS108');
  const [complaintText, setComplaintText] = useState('');
  const [building, setBuilding] = useState('');
  const [specificLocation, setSpecificLocation] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [photoPresetKey, setPhotoPresetKey] = useState('');
  const [customPhotoData, setCustomPhotoData] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (externalDraft) {
      if (externalDraft.complaintText !== undefined) setComplaintText(externalDraft.complaintText);
      if (externalDraft.building !== undefined) setBuilding(externalDraft.building);
      if (externalDraft.specificLocation !== undefined) setSpecificLocation(externalDraft.specificLocation);
      if (externalDraft.additionalDetails !== undefined) setAdditionalDetails(externalDraft.additionalDetails);
      if (externalDraft.photoPresetKey !== undefined) {
        setPhotoPresetKey(externalDraft.photoPresetKey);
        setCustomPhotoData('');
      }
      if (externalDraft.autoAnalyze) {
        runAiAnalysis({
          complaintText: externalDraft.complaintText ?? complaintText,
          building: externalDraft.building ?? building,
          specificLocation: externalDraft.specificLocation ?? specificLocation,
          additionalDetails: externalDraft.additionalDetails ?? additionalDetails,
          photoPresetKey: externalDraft.photoPresetKey ?? photoPresetKey,
          photoData: ''
        });
      }
      clearExternalDraft && clearExternalDraft();
    }
  }, [externalDraft]);

  const activePhotoPreview = customPhotoData || (photoPresetKey && samplePhotos?.[photoPresetKey]) || '';

  const runAiAnalysis = async (override = null) => {
    const payload = override || {
      complaintText,
      building,
      specificLocation,
      additionalDetails,
      photoData: customPhotoData,
      photoPresetKey
    };

    if (!payload.complaintText?.trim() && !payload.photoData && !payload.photoPresetKey) {
      setError('Please enter a written complaint or attach a photo.');
      return;
    }

    setError('');
    setAnalyzing(true);
    try {
      const res = await fetch('/api/complaints/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze complaint');
      setAnalysis(data);
      if (!building && data.inferred_building) {
        setBuilding(data.inferred_building);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadScenario = (sc) => {
    setComplaintText(sc.complaintText);
    setBuilding(sc.building);
    setSpecificLocation(sc.specificLocation);
    setAdditionalDetails('');
    setPhotoPresetKey(sc.photoPresetKey);
    setCustomPhotoData('');
    runAiAnalysis({
      complaintText: sc.complaintText,
      building: sc.building,
      specificLocation: sc.specificLocation,
      additionalDetails: '',
      photoPresetKey: sc.photoPresetKey,
      photoData: ''
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomPhotoData(reader.result);
      setPhotoPresetKey('');
    };
    reader.readAsDataURL(file);
  };

  const handleApplySuggestion = (field, value) => {
    let nextBuilding = building;
    let nextLocation = specificLocation;
    let nextAdditional = additionalDetails;

    if (field === 'building') {
      nextBuilding = value;
      setBuilding(value);
    } else if (field === 'specific_location') {
      nextLocation = value;
      setSpecificLocation(value);
    } else {
      nextAdditional = additionalDetails ? `${additionalDetails}; ${value}` : value;
      setAdditionalDetails(nextAdditional);
    }

    runAiAnalysis({
      complaintText,
      building: nextBuilding,
      specificLocation: nextLocation,
      additionalDetails: nextAdditional,
      photoData: customPhotoData,
      photoPresetKey
    });
  };

  const handleCreateTicket = async (allowIncomplete = false) => {
    if (!complaintText.trim()) {
      setError('Please enter a written complaint.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          student_roll: studentRoll,
          original_complaint: complaintText,
          additional_details: additionalDetails,
          building,
          specific_location: specificLocation,
          photo_url: customPhotoData || null,
          photo_preset_key: photoPresetKey,
          allow_incomplete: allowIncomplete
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create ticket');
      onTicketCreated(data.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: Simple Student Complaint Form (7 cols) */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Submit a Maintenance Complaint</h2>
            <p className="text-xs text-slate-500">
              Write in English, Hindi (हिंदी), or Hinglish and optionally attach a photo.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
            <Languages className="w-3.5 h-3.5" /> EN / हिंदी
          </span>
        </div>

        {/* Sample Buttons */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-500">Load Sample Complaint:</label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SCENARIOS.map(sc => (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleLoadScenario(sc)}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 transition"
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Student Name</label>
            <input
              type="text"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Roll Number</label>
            <input
              type="text"
              value={studentRoll}
              onChange={e => setStudentRoll(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* Written Complaint */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Written Complaint *
          </label>
          <textarea
            rows={3}
            value={complaintText}
            onChange={e => setComplaintText(e.target.value)}
            placeholder="Describe the issue (e.g., Water is leaking from the pipe under the washroom sink...)"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
          />
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Building</label>
            <select
              value={building}
              onChange={e => setBuilding(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-900"
            >
              <option value="">-- Select Building --</option>
              {campus?.buildings?.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Floor / Room / Area <span className="text-slate-400">(Leave blank to test missing info)</span>
            </label>
            <input
              type="text"
              value={specificLocation}
              onChange={e => setSpecificLocation(e.target.value)}
              placeholder="e.g., 2nd Floor North Washroom"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* Optional Photograph */}
        <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-slate-600" />
              Optional Supporting Photograph
            </span>
            <label className="cursor-pointer px-3 py-1 rounded-md bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-300 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              Upload File
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PHOTO_PRESETS.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setPhotoPresetKey(photoPresetKey === p.key ? '' : p.key);
                  setCustomPhotoData('');
                }}
                className={`text-[11px] px-2.5 py-1 rounded border transition ${
                  photoPresetKey === p.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {activePhotoPreview && (
            <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-slate-900">
              <img src={activePhotoPreview} alt="Evidence" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={() => {
                  setPhotoPresetKey('');
                  setCustomPhotoData('');
                }}
                className="absolute top-2 right-2 px-2.5 py-1 rounded bg-white text-xs text-rose-600 font-medium shadow flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => runAiAnalysis()}
            disabled={analyzing}
            className="flex-1 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Complaint (Gemini AI)
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleCreateTicket(true)}
            disabled={submitting || !complaintText.trim()}
            className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Ticket
          </button>
        </div>
      </div>

      {/* RIGHT: Simple AI Analysis, Missing Info & Duplicate Alert (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        {!analysis ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-2 shadow-sm">
            <Sparkles className="w-6 h-6 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">AI Triage Preview</h3>
            <p className="text-xs text-slate-500">
              Enter a complaint or click a sample button on the left, then click <strong>Analyze Complaint</strong> to extract details, check for missing information, and suggest a department.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-bold text-slate-900">AI Ticket Summary</span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                  analysis.is_complete
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {analysis.is_complete ? 'Complete' : `${analysis.missing_fields.length} Missing Detail(s)`}
              </span>
            </div>

            {/* Missing Information Prompt */}
            {!analysis.is_complete && analysis.missing_fields?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 space-y-3">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <strong>Missing Information Needed:</strong> Please click or type the missing detail below:
                  </div>
                </div>

                {analysis.missing_fields.map((mf, i) => (
                  <div key={i} className="bg-white border border-amber-200 rounded p-2.5 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-800">{mf.question_en}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {mf.suggestions?.map((sug, j) => (
                        <button
                          key={j}
                          type="button"
                          onClick={() => handleApplySuggestion(mf.field, sug)}
                          className="text-[11px] px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium transition"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={additionalDetails}
                    onChange={e => setAdditionalDetails(e.target.value)}
                    placeholder="Or type missing floor / fixture details..."
                    className="flex-1 bg-white border border-amber-300 rounded px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => runAiAnalysis()}
                    className="px-3 py-1.5 rounded bg-slate-900 text-white text-xs font-medium"
                  >
                    Update
                  </button>
                </div>
              </div>
            )}

            {/* Duplicate Alert */}
            {analysis.potential_duplicates?.length > 0 && (
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-start gap-2">
                  <GitMerge className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-800">
                    <strong>Possible Duplicate ({analysis.potential_duplicates[0].similarity_score}% Match):</strong> Matches active ticket <strong>#{analysis.potential_duplicates[0].ticket_number}</strong> ({analysis.potential_duplicates[0].title}).
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onUpvoteExisting(analysis.potential_duplicates[0].ticket_number, studentName)}
                    className="px-3 py-1.5 rounded bg-slate-900 text-white text-xs font-medium flex items-center gap-1"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Track Existing #{analysis.potential_duplicates[0].ticket_number} (+1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateTicket(false)}
                    className="px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-700 text-xs font-medium"
                  >
                    Submit Anyway (Flag Duplicate)
                  </button>
                </div>
              </div>
            )}

            {/* Extracted Details */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 block">Extracted Issue:</span>
                <span className="font-bold text-slate-900 text-sm">{analysis.extracted_issue}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Summary:</span>
                <p className="text-slate-700 leading-relaxed">{analysis.summary}</p>
              </div>
              {analysis.english_translation && (
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Translated from {analysis.detected_language}:</span>
                  <span className="text-slate-800 italic">"{analysis.english_translation}"</span>
                </div>
              )}
            </div>

            {/* Routing Guide Suggestion */}
            <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Suggested Category</span>
                <span className="font-bold text-slate-900">{analysis.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Priority &amp; SLA</span>
                <span className="font-bold text-slate-900">{analysis.priority} ({analysis.sla_hours}h)</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200">
                <span className="text-slate-500 block text-[11px]">Responsible Department ({analysis.routing_rule_id})</span>
                <span className="font-bold text-slate-900">{analysis.department}</span>
              </div>
            </div>

            {/* Photo Findings */}
            {analysis.photo_analysis && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-semibold text-slate-800 block">Photo Inspection (Gemini Vision):</span>
                <p className="text-slate-600">{analysis.photo_analysis.visual_findings}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleCreateTicket(false)}
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm &amp; Submit Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
