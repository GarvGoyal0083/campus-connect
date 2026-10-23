// campus-connect/backend/routingGuide.js
// Official Single-Campus Routing Guide & Multimodal Sample Evidence Presets

const CAMPUS_INFO = {
  name: 'Equinox Institute of Technology — Main Campus',
  code: 'EIT-MAIN',
  buildings: [
    {
      id: 'BLD-HOSTEL-B',
      name: 'Hostel Block B (Bhaskara Hall)',
      zones: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', 'North Wing Washrooms', 'South Wing Washrooms', 'Common Room', 'Mess Corridor']
    },
    {
      id: 'BLD-HOSTEL-A',
      name: 'Hostel Block A (Aryabhatta Hall)',
      zones: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', 'East Wing Washrooms', 'West Wing Washrooms', 'Water Cooler Alcove']
    },
    {
      id: 'BLD-ACAD-1',
      name: 'Academic Block 1 (Turing Hall)',
      zones: ['Ground Floor Lobby', '1st Floor Classrooms (101–108)', '2nd Floor Labs (201–206)', '3rd Floor Seminar Halls', 'Faculty Wing']
    },
    {
      id: 'BLD-LIBRARY',
      name: 'Central Library & Learning Commons',
      zones: ['Ground Floor Reading Room', '1st Floor Digital Zone', '2nd Floor Quiet Study Cubicles', 'Restroom Lobby']
    },
    {
      id: 'BLD-SAC',
      name: 'Student Activity Center & Cafeteria',
      zones: ['Main Dining Hall', 'Handwash Station', 'Indoor Sports Arena', 'Club Rooms Corridor']
    },
    {
      id: 'BLD-ADMIN',
      name: 'Admin & Research Complex',
      zones: ['Student Affairs Counter', 'Server & Network Core Room', '1st Floor Conference Hall', 'Basement Parking Corridor']
    }
  ]
};

// Realistic inline SVG Data-URI Evidence Photos for instant multimodal demos & seeded tickets
const SAMPLE_EVIDENCE_PHOTOS = {
  plumbing_leak: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <rect width="640" height="420" fill="url(#wall)"/>
      <!-- Tile grid -->
      <g stroke="#334155" stroke-width="1" opacity="0.5">
        <line x1="0" y1="80" x2="640" y2="80"/><line x1="0" y1="160" x2="640" y2="160"/>
        <line x1="0" y1="240" x2="640" y2="240"/><line x1="0" y1="320" x2="640" y2="320"/>
        <line x1="128" y1="0" x2="128" y2="320"/><line x1="256" y1="0" x2="256" y2="320"/>
        <line x1="384" y1="0" x2="384" y2="320"/><line x1="512" y1="0" x2="512" y2="320"/>
      </g>
      <!-- Floor -->
      <rect x="0" y="320" width="640" height="100" fill="#090d16"/>
      <!-- Puddle on floor -->
      <ellipse cx="330" cy="365" rx="210" ry="34" fill="url(#water)" opacity="0.75"/>
      <ellipse cx="340" cy="365" rx="145" ry="20" fill="#7dd3fc" opacity="0.35"/>
      <!-- Washbasin Pedestal & Sink -->
      <rect x="275" y="190" width="70" height="135" rx="8" fill="#cbd5e1"/>
      <path d="M210 130 Q310 225 410 130 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="4"/>
      <!-- Exposed Metal Supply Pipe with Ruptured Joint -->
      <rect x="130" y="220" width="180" height="22" rx="6" fill="#64748b" stroke="#475569" stroke-width="2"/>
      <rect x="295" y="175" width="22" height="65" rx="4" fill="#64748b" stroke="#475569" stroke-width="2"/>
      <!-- Cracked Valve Collar -->
      <rect x="288" y="212" width="36" height="36" rx="5" fill="#dc2626" stroke="#fca5a5" stroke-width="2"/>
      <!-- High-pressure water spray jets -->
      <path d="M306 230 Q250 265 220 350" stroke="#38bdf8" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M306 230 Q355 260 395 355" stroke="#7dd3fc" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M306 225 Q275 190 235 235" stroke="#bae6fd" stroke-width="4" fill="none" stroke-dasharray="6,4"/>
      <circle cx="306" cy="230" r="38" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="6,4"/>
      <!-- AI Vision Detection Overlay Tag -->
      <rect x="24" y="22" width="370" height="54" rx="10" fill="#0f172a" fill-opacity="0.9" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="42" y="45" fill="#38bdf8" font-family="monospace" font-size="13" font-weight="bold">EVIDENCE PHOTO: RUPTURED SINK SUPPLY VALVE</text>
      <text x="42" y="64" fill="#cbd5e1" font-family="sans-serif" font-size="12">Active pressurized water leak + floor pooling hazard</text>
    </svg>
  `)}`,
  electrical_spark: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <rect width="640" height="420" fill="#111827"/>
      <!-- Wall panel -->
      <rect x="170" y="95" width="300" height="230" rx="14" fill="#e5e7eb" stroke="#9ca3af" stroke-width="4"/>
      <!-- Scorch / burn mark around right socket -->
      <ellipse cx="375" cy="215" rx="68" ry="62" fill="#1f2937" opacity="0.75"/>
      <ellipse cx="375" cy="215" rx="42" ry="40" fill="#030712" opacity="0.9"/>
      <!-- Switches on left -->
      <rect x="210" y="140" width="42" height="65" rx="6" fill="#f9fafb" stroke="#6b7280" stroke-width="2"/>
      <rect x="265" y="140" width="42" height="65" rx="6" fill="#f9fafb" stroke="#6b7280" stroke-width="2"/>
      <rect x="210" y="225" width="97" height="55" rx="6" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
      <!-- Damaged 16A Socket on right -->
      <rect x="335" y="170" width="82" height="90" rx="8" fill="#374151" stroke="#f59e0b" stroke-width="2.5"/>
      <circle cx="376" cy="195" r="8" fill="#111827"/>
      <circle cx="358" cy="230" r="6" fill="#111827"/>
      <circle cx="394" cy="230" r="6" fill="#111827"/>
      <!-- Electric sparks -->
      <polyline points="376,210 415,175 398,165 445,130" stroke="#facc15" stroke-width="4" fill="none"/>
      <polyline points="376,215 430,225 415,240 465,255" stroke="#fb923c" stroke-width="4" fill="none"/>
      <polyline points="365,215 325,260 345,275 310,310" stroke="#fde047" stroke-width="3.5" fill="none"/>
      <circle cx="376" cy="215" r="54" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="6,4"/>
      <rect x="24" y="22" width="390" height="54" rx="10" fill="#0f172a" fill-opacity="0.9" stroke="#f59e0b" stroke-width="1.5"/>
      <text x="42" y="45" fill="#fbbf24" font-family="monospace" font-size="13" font-weight="bold">EVIDENCE PHOTO: CHARRED 16A AC SOCKET &amp; SPARKS</text>
      <text x="42" y="64" fill="#cbd5e1" font-family="sans-serif" font-size="12">Thermal burn marks on faceplate — High fire hazard</text>
    </svg>
  `)}`,
  cleanliness_waste: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <rect width="640" height="420" fill="#0f172a"/>
      <rect x="0" y="310" width="640" height="110" fill="#1e293b"/>
      <!-- Corridor bin -->
      <path d="M240 165 L260 345 L380 345 L400 165 Z" fill="#059669" stroke="#34d399" stroke-width="3"/>
      <!-- Overflowing trash bags & cups -->
      <circle cx="290" cy="155" r="36" fill="#334155" stroke="#64748b" stroke-width="2"/>
      <circle cx="345" cy="148" r="42" fill="#1f2937" stroke="#475569" stroke-width="2"/>
      <rect x="305" y="110" width="38" height="46" rx="4" transform="rotate(18 305 110)" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
      <rect x="210" y="325" width="44" height="28" rx="5" fill="#fbbf24"/>
      <circle cx="425" cy="342" r="22" fill="#94a3b8"/>
      <ellipse cx="185" cy="355" rx="48" ry="16" fill="#84cc16" opacity="0.45"/>
      <rect x="24" y="22" width="390" height="54" rx="10" fill="#0f172a" fill-opacity="0.9" stroke="#10b981" stroke-width="1.5"/>
      <text x="42" y="45" fill="#34d399" font-family="monospace" font-size="13" font-weight="bold">EVIDENCE PHOTO: OVERFLOWING CORRIDOR WASTE BIN</text>
      <text x="42" y="64" fill="#cbd5e1" font-family="sans-serif" font-size="12">Sanitation &amp; odor issue near walkway — Needs clearance</text>
    </svg>
  `)}`,
  internet_router: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <rect width="640" height="420" fill="#090d16"/>
      <!-- Ceiling / Wall Mount Enterprise Wi-Fi Access Point & Fiber Box -->
      <rect x="175" y="135" width="290" height="145" rx="22" fill="#1e293b" stroke="#475569" stroke-width="3"/>
      <!-- Antennas -->
      <rect x="205" y="70" width="14" height="70" rx="6" fill="#334155"/>
      <rect x="420" y="70" width="14" height="70" rx="6" fill="#334155"/>
      <!-- Status LEDs -->
      <circle cx="235" cy="205" r="9" fill="#22c55e"/>
      <text x="222" y="232" fill="#94a3b8" font-family="monospace" font-size="11">PWR</text>
      <circle cx="290" cy="205" r="9" fill="#ef4444"/>
      <circle cx="290" cy="205" r="18" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="4,3"/>
      <text x="278" y="232" fill="#f87171" font-family="monospace" font-size="11" font-weight="bold">LOS!</text>
      <circle cx="345" cy="205" r="9" fill="#ef4444"/>
      <text x="333" y="232" fill="#f87171" font-family="monospace" font-size="11">WAN</text>
      <circle cx="400" cy="205" r="9" fill="#eab308"/>
      <text x="386" y="232" fill="#94a3b8" font-family="monospace" font-size="11">WIFI</text>
      <!-- Loose fiber patch cable -->
      <path d="M320 280 Q325 345 410 365" stroke="#facc15" stroke-width="5" fill="none"/>
      <rect x="24" y="22" width="405" height="54" rx="10" fill="#0f172a" fill-opacity="0.9" stroke="#a855f7" stroke-width="1.5"/>
      <text x="42" y="45" fill="#c084fc" font-family="monospace" font-size="13" font-weight="bold">EVIDENCE PHOTO: AP RED 'LOS' ALARM &amp; WAN DOWN</text>
      <text x="42" y="64" fill="#cbd5e1" font-family="sans-serif" font-size="12">Fiber uplink loss detected on ceiling access point</text>
    </svg>
  `)}`
};

const ROUTING_GUIDE = [
  {
    rule_id: 'RG-PLM-01',
    category: 'Plumbing',
    department: 'Plumbing & Water Works Department',
    department_code: 'DEPT-PLM',
    head_of_department: 'Er. Rajesh Sharma',
    contact_ext: 'Ext. 4102 (plumbing@equinox.edu)',
    sla_hours: { Critical: 2, High: 4, Medium: 8, Low: 24 },
    color: 'sky',
    description: 'Handles burst pipes, washroom/sink leaks, water cooler malfunctions, drainage blockages, cistern flush failures, and low water pressure.',
    scope_keywords: [
      'water', 'leak', 'pipe', 'tap', 'faucet', 'sink', 'washroom', 'toilet', 'flush', 'drain', 'clogged',
      'overflow', 'geyser', 'cooler', 'seepage', 'valve', 'cistern', 'plumber',
      'paani', 'pani', 'nal', 'tanki', 'pipeline', 'leakage', 'washroom', 'बाथरूम', 'पानी', 'पाइप', 'नल', 'लीक', 'टंकी', 'फ्लश'
    ],
    required_details_checklist: [
      'Exact Floor & Wing / Room or Washroom identifier',
      'Specific fixture affected (e.g., sink tap, overhead pipe, flush valve, drinking water cooler)',
      'Severity / whether water is actively flooding or main valve needs shutoff'
    ],
    technicians: [
      { id: 'TECH-PLM-1', name: 'Ramesh Kumar', role: 'Senior Master Plumber', phone: '+91 98110-44101' },
      { id: 'TECH-PLM-2', name: 'Suresh Yadav', role: 'Water Supply & Valve Specialist', phone: '+91 98110-44102' },
      { id: 'TECH-PLM-3', name: 'Dinesh Verma', role: 'Drainage & RO Cooler Technician', phone: '+91 98110-44103' }
    ]
  },
  {
    rule_id: 'RG-ELC-02',
    category: 'Electricity',
    department: 'Electrical & Power Systems Department',
    department_code: 'DEPT-ELC',
    head_of_department: 'Er. Vikram Nair',
    contact_ext: 'Ext. 4205 (electrical@equinox.edu)',
    sla_hours: { Critical: 1, High: 3, Medium: 6, Low: 16 },
    color: 'amber',
    description: 'Handles power outages, sparking sockets/switchboards, ceiling fans, tube lights, AC units, MCB tripping, and corridor lighting.',
    scope_keywords: [
      'electricity', 'power', 'spark', 'sparking', 'socket', 'switch', 'switchboard', 'fan', 'light', 'tubelight',
      'bulb', 'ac', 'air conditioner', 'mcb', 'trip', 'short circuit', 'wire', 'voltage', 'shock', 'blackout',
      'bijli', 'pankha', 'batti', 'current', 'tar', 'बिजली', 'पंखा', 'लाइट', 'सॉकेट', 'स्पार्क', 'शॉर्ट सर्किट', 'एसी'
    ],
    required_details_checklist: [
      'Exact Room Number / Lab / Corridor Floor',
      'Specific electrical appliance or switchboard affected (e.g., 16A socket, ceiling fan, tube light, MCB)',
      'Safety hazard status (any active sparking, burning smell, or exposed live wires)'
    ],
    technicians: [
      { id: 'TECH-ELC-1', name: 'Anil विश्वकर्मा (Anil Vishwakarma)', role: 'High-Voltage & Switchgear Electrician', phone: '+91 98110-44201' },
      { id: 'TECH-ELC-2', name: 'Prakash Joshi', role: 'HVAC & Classroom Electrical Tech', phone: '+91 98110-44202' },
      { id: 'TECH-ELC-3', name: 'Manoj Tiwari', role: 'Hostel Electrical Maintenance Lead', phone: '+91 98110-44203' }
    ]
  },
  {
    rule_id: 'RG-CLN-03',
    category: 'Cleanliness',
    department: 'Campus Sanitation & Housekeeping Department',
    department_code: 'DEPT-CLN',
    head_of_department: 'Ms. Sunita Devi',
    contact_ext: 'Ext. 4308 (housekeeping@equinox.edu)',
    sla_hours: { Critical: 2, High: 4, Medium: 6, Low: 12 },
    color: 'emerald',
    description: 'Handles overflowing dustbins, washroom sanitation, corridor spills, classroom sweeping/mopping, odor control, and pest/hygiene issues.',
    scope_keywords: [
      'clean', 'cleanliness', 'dirty', 'garbage', 'trash', 'dustbin', 'bin', 'waste', 'smell', 'odor', 'stink',
      'spill', 'mop', 'sweep', 'hygiene', 'stain', 'litter', 'pest', 'sanitation', 'housekeeping',
      'safai', 'kachra', 'ganda', 'gandagi', 'badboo', 'dustbin', 'सफाई', 'कचरा', 'गंदगी', 'गंदा', 'कूड़ादान', 'बदबू'
    ],
    required_details_checklist: [
      'Exact Floor, Corridor, or Room/Washroom location',
      'Nature of sanitation issue (e.g., overflowing waste bin, wet floor spill, washroom deep cleaning needed)',
      'Whether it blocks pedestrian access or poses a slip/hygiene hazard'
    ],
    technicians: [
      { id: 'TECH-CLN-1', name: 'Kavita Bai', role: 'Hostel Sanitation Supervisor', phone: '+91 98110-44301' },
      { id: 'TECH-CLN-2', name: 'Mahesh Solanki', role: 'Academic & Library Housekeeping Lead', phone: '+91 98110-44302' },
      { id: 'TECH-CLN-3', name: 'Raju Balmiki', role: 'Rapid Spill & Waste Clearance Crew', phone: '+91 98110-44303' }
    ]
  },
  {
    rule_id: 'RG-NET-04',
    category: 'Internet Connectivity',
    department: 'Campus IT & Network Infrastructure Helpdesk',
    department_code: 'DEPT-NET',
    head_of_department: 'Er. Arjun Mehta',
    contact_ext: 'Ext. 4401 (netops@equinox.edu)',
    sla_hours: { Critical: 2, High: 4, Medium: 8, Low: 16 },
    color: 'violet',
    description: 'Handles Campus_WiFi dead zones, router/access point LOS red light alarms, lab Ethernet LAN port failures, captive portal login errors, and packet loss.',
    scope_keywords: [
      'internet', 'wifi', 'wi-fi', 'network', 'lan', 'ethernet', 'router', 'access point', 'ap', 'ping',
      'slow', 'disconnect', 'disconnected', 'no internet', 'los', 'fiber', 'portal', 'login', 'bandwidth', 'signal',
      'net', 'wifi nahi chal raha', 'नेट', 'इंटरनेट', 'वाईफाई', 'राउटर', 'नेटवर्क', 'सिग्नल'
    ],
    required_details_checklist: [
      'Exact Building, Floor, and Room/Study Zone',
      'Connection type & SSID/Port (e.g., Campus_WiFi_5G, Lab LAN Port, Ceiling Access Point LED status)',
      'Symptom observed (e.g., No Wi-Fi signal, connected without internet, red blinking LOS light on router)'
    ],
    technicians: [
      { id: 'TECH-NET-1', name: 'Siddharth Verma', role: 'Senior Wireless & Fiber Engineer', phone: '+91 98110-44401' },
      { id: 'TECH-NET-2', name: 'Neha Kulkarni', role: 'Switch & LAN Infrastructure Specialist', phone: '+91 98110-44402' },
      { id: 'TECH-NET-3', name: 'Rohan Das', role: 'Hostel Wi-Fi Support Technician', phone: '+91 98110-44403' }
    ]
  }
];

function getRoutingByCategory(categoryName) {
  if (!categoryName) return ROUTING_GUIDE[0];
  const normalized = categoryName.toLowerCase().trim();
  return (
    ROUTING_GUIDE.find(r => r.category.toLowerCase() === normalized) ||
    ROUTING_GUIDE.find(r => normalized.includes(r.category.toLowerCase().split(' ')[0])) ||
    ROUTING_GUIDE[0]
  );
}

module.exports = {
  CAMPUS_INFO,
  ROUTING_GUIDE,
  SAMPLE_EVIDENCE_PHOTOS,
  getRoutingByCategory
};
