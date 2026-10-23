// campus-connect/backend/database.js
const Database = require('better-sqlite3');
const path = require('path');
const { SAMPLE_EVIDENCE_PHOTOS } = require('./routingGuide');

const dbPath = path.join(__dirname, 'campusconnect.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE NOT NULL,
      student_name TEXT NOT NULL,
      student_roll TEXT NOT NULL,
      student_email TEXT,
      original_complaint TEXT NOT NULL,
      detected_language TEXT DEFAULT 'English',
      english_translation TEXT,
      additional_details TEXT,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      category TEXT NOT NULL,
      department TEXT NOT NULL,
      department_code TEXT NOT NULL,
      routing_rule_id TEXT NOT NULL,
      priority TEXT DEFAULT 'Medium',
      sla_hours INTEGER DEFAULT 8,
      building TEXT NOT NULL,
      specific_location TEXT,
      photo_url TEXT,
      photo_analysis TEXT,
      ai_metadata TEXT,
      status TEXT DEFAULT 'Triaged',
      assigned_technician TEXT,
      technician_phone TEXT,
      is_duplicate_flagged INTEGER DEFAULT 0,
      duplicate_of_ticket TEXT,
      duplicate_similarity INTEGER DEFAULT 0,
      merged_into TEXT,
      upvotes INTEGER DEFAULT 1,
      history TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const countRow = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
  if (countRow.count === 0) {
    seedInitialTickets();
  }
}

function seedInitialTickets() {
  const now = Date.now();
  const isoAgo = (mins) => new Date(now - mins * 60 * 1000).toISOString();

  const initialTickets = [
    {
      ticket_number: 'CC-2026-1041',
      student_name: 'Aarav Sharma',
      student_roll: 'EIT2024CS108',
      student_email: 'aarav.sharma@equinox.edu',
      original_complaint: 'Water is spraying out from the pipe under the middle washbasin in Hostel B 2nd floor washroom. Floor is completely flooded.',
      detected_language: 'English',
      english_translation: null,
      additional_details: '2nd Floor, North Wing Washroom (Sink #2). Angle valve collar is cracked.',
      title: 'Ruptured Under-Sink Supply Pipe & Washroom Flooding',
      summary: 'Critical-priority plumbing complaint at Hostel Block B (Bhaskara Hall) — 2nd Floor, North Wing Washroom (Sink #2). Active pressurized water leak from cracked angle valve causing floor pooling.',
      category: 'Plumbing',
      department: 'Plumbing & Water Works Department',
      department_code: 'DEPT-PLM',
      routing_rule_id: 'RG-PLM-01',
      priority: 'Critical',
      sla_hours: 2,
      building: 'Hostel Block B (Bhaskara Hall)',
      specific_location: '2nd Floor, North Wing Washroom (Sink #2)',
      photo_url: SAMPLE_EVIDENCE_PHOTOS.plumbing_leak,
      photo_analysis: JSON.stringify({
        detected_object: 'Pressurized Sink Supply Pipe & Angle Valve Assembly',
        visual_findings: 'Visible rupture/crack at the metallic angle-valve collar beneath the ceramic washbasin with active water spray and significant floor pooling.',
        severity_assessment: 'High — Active water wastage and slippery tile hazard detected.',
        recommended_tools: 'Pipe wrench, 15mm brass angle valve replacement, PTFE thread seal tape, floor squeegee.'
      }),
      ai_metadata: JSON.stringify({
        confidence: 0.97,
        ai_engine: 'Google Gemini 2.5 Flash (Multimodal)',
        recommended_action: [
          'Shut off 2nd floor North Wing isolation valve immediately.',
          'Replace ruptured 15mm angle valve collar under Sink #2.',
          'Clear standing water from washroom floor.'
        ]
      }),
      status: 'Assigned',
      assigned_technician: 'Ramesh Kumar (Senior Master Plumber)',
      technician_phone: '+91 98110-44101',
      is_duplicate_flagged: 0,
      duplicate_of_ticket: null,
      duplicate_similarity: 0,
      merged_into: null,
      upvotes: 3,
      history: JSON.stringify([
        {
          stage: 'Submitted',
          timestamp: isoAgo(95),
          actor: 'Aarav Sharma (Student)',
          note: 'Complaint submitted with supporting photograph of ruptured under-sink pipe.'
        },
        {
          stage: 'Triaged',
          timestamp: isoAgo(94),
          actor: 'Gemini AI Triage Engine',
          note: 'Categorized as Plumbing (Rule RG-PLM-01 → Plumbing & Water Works Department). Priority elevated to Critical due to active flooding detected in photo.'
        },
        {
          stage: 'Assigned',
          timestamp: isoAgo(70),
          actor: 'Er. Rajesh Sharma (Dept Head)',
          note: 'Assigned to Senior Master Plumber Ramesh Kumar. Technician dispatched with replacement 15mm brass valve.'
        }
      ]),
      created_at: isoAgo(95),
      updated_at: isoAgo(70)
    },
    {
      ticket_number: 'CC-2026-1042',
      student_name: 'Priyanshu Verma',
      student_roll: 'EIT2024ME054',
      student_email: 'priyanshu.v@equinox.edu',
      original_complaint: 'हॉस्टल बी के दूसरे फ्लोर के वॉशरूम में बेसिन के नीचे पाइप टूट गया है और पूरे फर्श पर पानी भर रहा है, जल्दी किसी को भेजो!',
      detected_language: 'Hindi (हिंदी)',
      english_translation: 'In Hostel B 2nd floor washroom, the pipe beneath the washbasin has broken and water is flooding the entire floor, please send someone urgently!',
      additional_details: '2nd Floor North Wing Washroom near Room B-208',
      title: 'Washroom Basin Pipe Leak & Floor Flooding (Hindi Report)',
      summary: 'Critical-priority plumbing complaint at Hostel Block B (Bhaskara Hall) — 2nd Floor North Wing Washroom. Translated from Hindi: Under-basin pipe burst causing floor flooding. Flagged as 94% match with active ticket #CC-2026-1041.',
      category: 'Plumbing',
      department: 'Plumbing & Water Works Department',
      department_code: 'DEPT-PLM',
      routing_rule_id: 'RG-PLM-01',
      priority: 'Critical',
      sla_hours: 2,
      building: 'Hostel Block B (Bhaskara Hall)',
      specific_location: '2nd Floor, North Wing Washroom',
      photo_url: SAMPLE_EVIDENCE_PHOTOS.plumbing_leak,
      photo_analysis: JSON.stringify({
        detected_object: 'Under-Sink Supply Valve & Flooded Tile Floor',
        visual_findings: 'Same washbasin supply line rupture on 2nd floor washroom with water pooling.',
        severity_assessment: 'High — Active water leak matching existing report.',
        recommended_tools: 'Pipe wrench, 15mm angle valve.'
      }),
      ai_metadata: JSON.stringify({
        confidence: 0.96,
        ai_engine: 'Google Gemini 2.5 Flash (Multimodal + Hindi NLP)',
        recommended_action: [
          'Review potential duplicate match with #CC-2026-1041 (94% similarity).',
          'Merge ticket to consolidate student notifications under primary work order.'
        ]
      }),
      status: 'Triaged',
      assigned_technician: null,
      technician_phone: null,
      is_duplicate_flagged: 1,
      duplicate_of_ticket: 'CC-2026-1041',
      duplicate_similarity: 94,
      merged_into: null,
      upvotes: 1,
      history: JSON.stringify([
        {
          stage: 'Submitted',
          timestamp: isoAgo(42),
          actor: 'Priyanshu Verma (Student)',
          note: 'Submitted complaint in Hindi (हिंदी) with location details.'
        },
        {
          stage: 'Triaged',
          timestamp: isoAgo(41),
          actor: 'Gemini AI Triage Engine',
          note: 'Auto-translated from Hindi to English. Routed to Plumbing & Water Works Department (RG-PLM-01). Flagged as 94% Potential Duplicate of #CC-2026-1041 for staff review.'
        }
      ]),
      created_at: isoAgo(42),
      updated_at: isoAgo(41)
    },
    {
      ticket_number: 'CC-2026-1043',
      student_name: 'Ananya Krishnan',
      student_roll: 'EIT2023EC019',
      student_email: 'ananya.k@equinox.edu',
      original_complaint: 'The 16A switchboard near the podium in Academic Block 1 Room 204 sparked loudly when plugging in the lab equipment. Black burn marks are visible.',
      detected_language: 'English',
      english_translation: null,
      additional_details: '2nd Floor, Lecture Hall 204 (Front Podium Wall Socket)',
      title: 'Sparking 16A Podium Socket & Thermal Burn Hazard',
      summary: 'Critical-priority electricity complaint at Academic Block 1 (Turing Hall) — Room 204. AI Vision confirmed charred 16A socket faceplate with electrical arcing risk.',
      category: 'Electricity',
      department: 'Electrical & Power Systems Department',
      department_code: 'DEPT-ELC',
      routing_rule_id: 'RG-ELC-02',
      priority: 'Critical',
      sla_hours: 1,
      building: 'Academic Block 1 (Turing Hall)',
      specific_location: '2nd Floor, Room 204 (Podium Switchboard)',
      photo_url: SAMPLE_EVIDENCE_PHOTOS.electrical_spark,
      photo_analysis: JSON.stringify({
        detected_object: 'Modular 16A Wall Switchboard & Power Socket',
        visual_findings: 'Carbonized thermal burn marks around the 16A heavy-load socket faceplate with signs of electrical arcing/short-circuit.',
        severity_assessment: 'Critical — Immediate electrical fire and shock hazard.',
        recommended_tools: 'Insulated multimeter, 16A modular socket + switch replacement, circuit breaker lockout tag.'
      }),
      ai_metadata: JSON.stringify({
        confidence: 0.98,
        ai_engine: 'Google Gemini 2.5 Flash (Multimodal)',
        recommended_action: [
          'Isolate Room 204 podium MCB breaker immediately.',
          'Replace charred 16A socket module and inspect internal phase wiring insulation.'
        ]
      }),
      status: 'In Progress',
      assigned_technician: 'Anil Vishwakarma (High-Voltage Electrician)',
      technician_phone: '+91 98110-44201',
      is_duplicate_flagged: 0,
      duplicate_of_ticket: null,
      duplicate_similarity: 0,
      merged_into: null,
      upvotes: 4,
      history: JSON.stringify([
        {
          stage: 'Submitted',
          timestamp: isoAgo(130),
          actor: 'Ananya Krishnan (Student)',
          note: 'Reported sparking 16A socket with photo evidence.'
        },
        {
          stage: 'Triaged',
          timestamp: isoAgo(129),
          actor: 'Gemini AI Triage Engine',
          note: 'Matched Rule RG-ELC-02 → Electrical & Power Systems Department. Marked Critical (1h SLA) due to thermal burn marks detected in photo.'
        },
        {
          stage: 'Assigned',
          timestamp: isoAgo(115),
          actor: 'Er. Vikram Nair (Dept Head)',
          note: 'Assigned to High-Voltage Electrician Anil Vishwakarma.'
        },
        {
          stage: 'In Progress',
          timestamp: isoAgo(85),
          actor: 'Anil Vishwakarma (Technician)',
          note: 'Floor MCB isolated safely. Replacing damaged 16A modular socket and terminal block.'
        }
      ]),
      created_at: isoAgo(130),
      updated_at: isoAgo(85)
    },
    {
      ticket_number: 'CC-2026-1044',
      student_name: 'Rohan Kulkarni',
      student_roll: 'EIT2025AI082',
      student_email: 'rohan.k@equinox.edu',
      original_complaint: 'Library 1st floor digital zone mein Campus_WiFi connect ho raha hai par internet bilkul nahi chal raha. Ceiling router pe red LOS light blink kar rahi hai.',
      detected_language: 'Hinglish (Hindi + English)',
      english_translation: 'In the Library 1st floor digital zone, Campus_WiFi connects but there is no internet access at all. The ceiling router is blinking a red LOS (Loss of Signal) light.',
      additional_details: '1st Floor Digital Reading Zone (Ceiling AP-LIB-02)',
      title: 'Library Ceiling AP Red LOS Alarm & Wi-Fi Outage',
      summary: 'High-priority internet connectivity complaint at Central Library & Learning Commons — 1st Floor Digital Zone. Translated from Hinglish: Fiber uplink LOS alarm on ceiling access point causing Wi-Fi outage.',
      category: 'Internet Connectivity',
      department: 'Campus IT & Network Infrastructure Helpdesk',
      department_code: 'DEPT-NET',
      routing_rule_id: 'RG-NET-04',
      priority: 'High',
      sla_hours: 4,
      building: 'Central Library & Learning Commons',
      specific_location: '1st Floor Digital Zone (Near Ceiling AP-LIB-02)',
      photo_url: SAMPLE_EVIDENCE_PHOTOS.internet_router,
      photo_analysis: JSON.stringify({
        detected_object: 'Ceiling-Mounted Enterprise Wi-Fi Access Point & Fiber ONT',
        visual_findings: 'PWR indicator is green, but the optical LOS (Loss of Signal) and WAN LEDs are flashing red; yellow fiber patch cord appears strained.',
        severity_assessment: 'High — Complete wireless uplink drop for connected study zone.',
        recommended_tools: 'Optical power meter, SC/APC fiber patch cord, RJ45 PoE tester.'
      }),
      ai_metadata: JSON.stringify({
        confidence: 0.95,
        ai_engine: 'Google Gemini 2.5 Flash (Multimodal + Hinglish NLP)',
        recommended_action: [
          'Inspect SC/APC fiber patch cord at ceiling enclosure AP-LIB-02.',
          'Verify core switch uplink port status in Admin Server Room.'
        ]
      }),
      status: 'Assigned',
      assigned_technician: 'Siddharth Verma (Senior Wireless & Fiber Engineer)',
      technician_phone: '+91 98110-44401',
      is_duplicate_flagged: 0,
      duplicate_of_ticket: null,
      duplicate_similarity: 0,
      merged_into: null,
      upvotes: 6,
      history: JSON.stringify([
        {
          stage: 'Submitted',
          timestamp: isoAgo(65),
          actor: 'Rohan Kulkarni (Student)',
          note: 'Submitted Hinglish complaint with photo of blinking red LOS light on router.'
        },
        {
          stage: 'Triaged',
          timestamp: isoAgo(64),
          actor: 'Gemini AI Triage Engine',
          note: 'Translated Hinglish report and matched Rule RG-NET-04 → Campus IT & Network Infrastructure Helpdesk.'
        },
        {
          stage: 'Assigned',
          timestamp: isoAgo(50),
          actor: 'Er. Arjun Mehta (IT Helpdesk Lead)',
          note: 'Assigned to Senior Wireless & Fiber Engineer Siddharth Verma.'
        }
      ]),
      created_at: isoAgo(65),
      updated_at: isoAgo(50)
    },
    {
      ticket_number: 'CC-2026-1045',
      student_name: 'Meera Nair',
      student_roll: 'EIT2024BT031',
      student_email: 'meera.nair@equinox.edu',
      original_complaint: 'The large green dustbin outside the Cafeteria handwash station is completely overflowing with food plates and cups onto the walkway.',
      detected_language: 'English',
      english_translation: null,
      additional_details: 'Ground Floor Main Dining Hall Exit & Handwash Corridor',
      title: 'Overflowing Cafeteria Corridor Waste Bin & Litter Hazard',
      summary: 'Medium-priority cleanliness complaint at Student Activity Center & Cafeteria — Handwash Station Corridor. Overflowing waste receptacle causing odor and walkway obstruction.',
      category: 'Cleanliness',
      department: 'Campus Sanitation & Housekeeping Department',
      department_code: 'DEPT-CLN',
      routing_rule_id: 'RG-CLN-03',
      priority: 'Medium',
      sla_hours: 6,
      building: 'Student Activity Center & Cafeteria',
      specific_location: 'Ground Floor Handwash Station Corridor',
      photo_url: SAMPLE_EVIDENCE_PHOTOS.cleanliness_waste,
      photo_analysis: JSON.stringify({
        detected_object: 'Corridor Waste Receptacle & Surrounding Floor Area',
        visual_findings: 'Plastic waste bin is over 120% capacity with spilled garbage bags, disposable cups, and liquid staining on the adjacent walkway.',
        severity_assessment: 'Medium — Hygiene, odor, and corridor obstruction issue.',
        recommended_tools: 'Heavy-duty biodegradable waste liners, disinfectant floor mop, deodorizing spray.'
      }),
      ai_metadata: JSON.stringify({
        confidence: 0.94,
        ai_engine: 'Google Gemini 2.5 Flash (Multimodal)',
        recommended_action: [
          'Clear overflowing bin and replace liner bag.',
          'Mop and sanitize adjacent handwash walkway.'
        ]
      }),
      status: 'In Progress',
      assigned_technician: 'Raju Balmiki (Rapid Spill & Waste Clearance Crew)',
      technician_phone: '+91 98110-44303',
      is_duplicate_flagged: 0,
      duplicate_of_ticket: null,
      duplicate_similarity: 0,
      merged_into: null,
      upvotes: 2,
      history: JSON.stringify([
        {
          stage: 'Submitted',
          timestamp: isoAgo(180),
          actor: 'Meera Nair (Student)',
          note: 'Submitted complaint with photo of overflowing corridor waste bin.'
        },
        {
          stage: 'Triaged',
          timestamp: isoAgo(179),
          actor: 'Gemini AI Triage Engine',
          note: 'Categorized under Cleanliness (Rule RG-CLN-03 → Campus Sanitation & Housekeeping Department).'
        },
        {
          stage: 'Assigned',
          timestamp: isoAgo(150),
          actor: 'Ms. Sunita Devi (Housekeeping Lead)',
          note: 'Assigned to Rapid Spill & Waste Clearance Crew (Raju Balmiki).'
        },
        {
          stage: 'In Progress',
          timestamp: isoAgo(120),
          actor: 'Raju Balmiki (Crew Lead)',
          note: 'Waste bags cleared; wet disinfection mopping of handwash corridor in progress.'
        }
      ]),
      created_at: isoAgo(180),
      updated_at: isoAgo(120)
    },
    {
      ticket_number: 'CC-2026-1046',
      student_name: 'Devansh Gupta',
      student_roll: 'EIT2023CS045',
      student_email: 'devansh.g@equinox.edu',
      original_complaint: 'Hostel B 2nd floor corridor tube light near staircase is flickering non-stop and making a buzzing sound.',
      detected_language: 'English',
      english_translation: null,
      additional_details: '2nd Floor Main Staircase Landing (Fixture EL-HB2-09)',
      title: 'Flickering Staircase LED Batten & Choke Buzzing',
      summary: 'Low-priority electricity complaint at Hostel Block B (Bhaskara Hall) — 2nd Floor Staircase Landing. Faulty LED tube driver replaced and tested.',
      category: 'Electricity',
      department: 'Electrical & Power Systems Department',
      department_code: 'DEPT-ELC',
      routing_rule_id: 'RG-ELC-02',
      priority: 'Low',
      sla_hours: 16,
      building: 'Hostel Block B (Bhaskara Hall)',
      specific_location: '2nd Floor Staircase Landing',
      photo_url: null,
      photo_analysis: null,
      ai_metadata: JSON.stringify({
        confidence: 0.93,
        ai_engine: 'Google Gemini 2.5 Flash',
        recommended_action: ['Replace 20W LED batten tube on 2nd floor landing.']
      }),
      status: 'Resolved',
      assigned_technician: 'Manoj Tiwari (Hostel Electrical Maintenance Lead)',
      technician_phone: '+91 98110-44203',
      is_duplicate_flagged: 0,
      duplicate_of_ticket: null,
      duplicate_similarity: 0,
      merged_into: null,
      upvotes: 1,
      history: JSON.stringify([
        {
          stage: 'Submitted',
          timestamp: isoAgo(360),
          actor: 'Devansh Gupta (Student)',
          note: 'Reported flickering tube light near 2nd floor staircase.'
        },
        {
          stage: 'Triaged',
          timestamp: isoAgo(359),
          actor: 'Gemini AI Triage Engine',
          note: 'Routed to Electrical & Power Systems Department (Rule RG-ELC-02).'
        },
        {
          stage: 'Assigned',
          timestamp: isoAgo(310),
          actor: 'Er. Vikram Nair (Dept Head)',
          note: 'Assigned to Manoj Tiwari.'
        },
        {
          stage: 'In Progress',
          timestamp: isoAgo(260),
          actor: 'Manoj Tiwari (Technician)',
          note: 'Inspecting faulty LED driver unit.'
        },
        {
          stage: 'Resolved',
          timestamp: isoAgo(220),
          actor: 'Manoj Tiwari (Technician)',
          note: 'Installed new 20W Philips LED batten fixture. Verified steady illumination with zero flicker.'
        }
      ]),
      created_at: isoAgo(360),
      updated_at: isoAgo(220)
    }
  ];

  const insertStmt = db.prepare(`
    INSERT INTO tickets (
      ticket_number, student_name, student_roll, student_email,
      original_complaint, detected_language, english_translation, additional_details,
      title, summary, category, department, department_code, routing_rule_id,
      priority, sla_hours, building, specific_location,
      photo_url, photo_analysis, ai_metadata, status,
      assigned_technician, technician_phone,
      is_duplicate_flagged, duplicate_of_ticket, duplicate_similarity, merged_into,
      upvotes, history, created_at, updated_at
    ) VALUES (
      @ticket_number, @student_name, @student_roll, @student_email,
      @original_complaint, @detected_language, @english_translation, @additional_details,
      @title, @summary, @category, @department, @department_code, @routing_rule_id,
      @priority, @sla_hours, @building, @specific_location,
      @photo_url, @photo_analysis, @ai_metadata, @status,
      @assigned_technician, @technician_phone,
      @is_duplicate_flagged, @duplicate_of_ticket, @duplicate_similarity, @merged_into,
      @upvotes, @history, @created_at, @updated_at
    )
  `);

  const tx = db.transaction((rows) => {
    for (const row of rows) insertStmt.run(row);
  });
  tx(initialTickets);
}

module.exports = {
  db,
  initDatabase,
  seedInitialTickets
};
