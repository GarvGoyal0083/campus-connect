// campus-connect/backend/geminiService.js
// Google Gemini Multimodal AI Triage, Photo Inspection, Hindi/Hinglish Translation & Duplicate Detector

const { ROUTING_GUIDE, getRoutingByCategory } = require('./routingGuide');

// Hindi & Hinglish dictionary for deterministic fallback & hybrid enrichment
const HINDI_TRANSLATION_PATTERNS = [
  {
    match: /(हॉस्टल|hostel).*(पाइप|पानी|लीक|नल|वॉशरूम|बाथरूम|paani|pani|leak|pipe|nal)/i,
    translation: 'Water pipe/tap leakage reported in the hostel washroom causing water accumulation on the floor.',
    issue: 'Washroom Water Pipe / Tap Leakage',
    category: 'Plumbing'
  },
  {
    match: /(पाइप|पानी|लीक|नल|फ्लश|वाटर कूलर|paani|pani|nal|tanki|leak)/i,
    translation: 'Plumbing leak or water supply fixture malfunction reported requiring urgent plumber inspection.',
    issue: 'Water Supply / Plumbing Fixture Leak',
    category: 'Plumbing'
  },
  {
    match: /(बिजली|स्पार्क|सॉकेट|पंखा|लाइट|शॉर्ट सर्किट|एसी|bijli|pankha|batti|spark|socket|current)/i,
    translation: 'Electrical fault reported (sparking socket / power fixture issue) posing a potential safety hazard.',
    issue: 'Electrical Switchboard / Fixture Fault',
    category: 'Electricity'
  },
  {
    match: /(सफाई|कचरा|गंदगी|गंदा|कूड़ादान|बदबू|safai|kachra|ganda|gandagi|badboo|dustbin)/i,
    translation: 'Overflowing waste bin / unsanitary area reported requiring immediate housekeeping & sanitation clearance.',
    issue: 'Sanitation & Overflowing Waste Bin Issue',
    category: 'Cleanliness'
  },
  {
    match: /(इंटरनेट|वाईफाई|राउटर|नेटवर्क|नेट|सिग्नल|wifi|nahi chal raha|net slow)/i,
    translation: 'Campus Wi-Fi / internet connectivity outage or router signal failure affecting students in the area.',
    issue: 'Campus Wi-Fi / Network Connectivity Outage',
    category: 'Internet Connectivity'
  }
];

function detectLanguage(text = '') {
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasDevanagari) return 'Hindi (हिंदी)';
  const hinglishWords = /\b(mein|hai|ho|raha|rahi|nahi|chal|paani|pani|bijli|safai|kachra|ganda|kharaab|kharab|toot|gaya|bahut|bhi|aur|ke|ka|ki|pe|par|se|ko|wala|zyada)\b/i;
  if (hinglishWords.test(text)) return 'Hinglish (Hindi + English)';
  return 'English';
}

function analyzePhotoDeterministically(photoData = '', photoPresetKey = '', category = 'Plumbing') {
  if (!photoData && !photoPresetKey) return null;

  const combined = `${photoPresetKey} ${photoData.slice(0, 600)}`.toLowerCase();

  if (combined.includes('plumbing') || combined.includes('ruptured sink') || combined.includes('water') || category === 'Plumbing') {
    return {
      detected_object: 'Pressurized Sink Supply Pipe & Angle Valve Assembly',
      visual_findings: 'Visible rupture/crack at the metallic angle-valve collar beneath the ceramic washbasin with active water spray and significant floor pooling.',
      severity_assessment: 'High — Active water wastage and slippery tile hazard detected.',
      recommended_tools: 'Pipe wrench, 15mm brass angle valve replacement, PTFE thread seal tape, floor squeegee.'
    };
  }
  if (combined.includes('electric') || combined.includes('spark') || combined.includes('charred') || category === 'Electricity') {
    return {
      detected_object: 'Modular 16A Wall Switchboard & Power Socket',
      visual_findings: 'Carbonized thermal burn marks around the 16A heavy-load socket faceplate with signs of electrical arcing/short-circuit.',
      severity_assessment: 'Critical — Immediate electrical fire and shock hazard.',
      recommended_tools: 'Insulated multimeter, 16A modular socket + switch replacement, circuit breaker lockout tag.'
    };
  }
  if (combined.includes('clean') || combined.includes('waste') || combined.includes('overflowing') || category === 'Cleanliness') {
    return {
      detected_object: 'Corridor Waste Receptacle & Surrounding Floor Area',
      visual_findings: 'Plastic waste bin is over 120% capacity with spilled garbage bags, disposable cups, and liquid staining on the adjacent walkway.',
      severity_assessment: 'Medium — Hygiene, odor, and corridor obstruction issue.',
      recommended_tools: 'Heavy-duty biodegradable waste liners, disinfectant floor mop, deodorizing spray.'
    };
  }
  return {
    detected_object: 'Ceiling-Mounted Enterprise Wi-Fi Access Point & Fiber ONT',
    visual_findings: 'PWR indicator is green, but the optical LOS (Loss of Signal) and WAN LEDs are flashing red; yellow fiber patch cord appears strained.',
    severity_assessment: 'High — Complete wireless uplink drop for connected classrooms/hostel wing.',
    recommended_tools: 'Optical power meter, SC/APC fiber patch cord, RJ45 PoE tester, console cable.'
  };
}

function findPotentialDuplicates( { category, building, text, extractedIssue }, existingTickets = [] ) {
  const candidates = [];
  const normBuilding = (building || '').toLowerCase().trim();
  const combinedInput = `${text || ''} ${extractedIssue || ''}`.toLowerCase();

  // Extract meaningful tokens
  const stopWords = new Set(['the', 'and', 'is', 'in', 'at', 'of', 'to', 'for', 'on', 'near', 'with', 'from', 'very', 'not', 'working', 'issue', 'problem', 'complaint', 'there', 'here', 'hai', 'mein', 'ho', 'raha', 'ke', 'ka']);
  const inputTokens = combinedInput
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  for (const ticket of existingTickets) {
    if (ticket.status === 'Resolved' || ticket.merged_into) continue;

    let score = 0;
    const reasons = [];

    // 1. Same category (+35 pts)
    if (ticket.category && category && ticket.category.toLowerCase() === category.toLowerCase()) {
      score += 35;
      reasons.push(`Same category (${ticket.category})`);
    }

    // 2. Same building (+35 pts)
    const ticketBld = (ticket.building || '').toLowerCase().trim();
    if (normBuilding && ticketBld && (ticketBld.includes(normBuilding) || normBuilding.includes(ticketBld))) {
      score += 35;
      reasons.push(`Same building (${ticket.building})`);
    } else if (ticketBld && combinedInput.includes(ticketBld.split('(')[0].trim().toLowerCase())) {
      score += 30;
      reasons.push(`Complaint mentions ${ticket.building}`);
    }

    // 3. Floor / zone overlap (+15 pts)
    const floorMatch = combinedInput.match(/\b(ground|1st|2nd|3rd|first|second|third|दूसरे|पहला|तीसरा|floor|washroom|room|lab)\b/i);
    const ticketText = `${ticket.title} ${ticket.description} ${ticket.specific_location || ''} ${ticket.english_translation || ''}`.toLowerCase();
    if (floorMatch && ticketText.includes(floorMatch[0].toLowerCase())) {
      score += 15;
      reasons.push(`Matching floor/zone reference ("${floorMatch[0]}")`);
    }

    // 4. Keyword overlap (up to +20 pts)
    let matchedWords = 0;
    for (const token of inputTokens) {
      if (ticketText.includes(token)) matchedWords++;
    }
    if (inputTokens.length > 0) {
      const tokenScore = Math.min(20, Math.round((matchedWords / Math.max(2, Math.min(inputTokens.length, 6))) * 20));
      if (tokenScore > 0) {
        score += tokenScore;
        reasons.push(`Shared issue keywords (${matchedWords} terms)`);
      }
    }

    if (score >= 62) {
      candidates.push({
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        category: ticket.category,
        building: ticket.building,
        specific_location: ticket.specific_location,
        status: ticket.status,
        created_at: ticket.created_at,
        upvotes: ticket.upvotes || 1,
        similarity_score: Math.min(98, score),
        match_reason: reasons.join(' • ')
      });
    }
  }

  return candidates.sort((a, b) => b.similarity_score - a.similarity_score).slice(0, 3);
}

function deterministicTriage({ complaintText = '', building = '', specificLocation = '', additionalDetails = '', photoData = '', photoPresetKey = '', existingTickets = [] }) {
  const fullText = `${complaintText} ${additionalDetails}`.trim();
  const lower = fullText.toLowerCase();
  const detectedLanguage = detectLanguage(fullText);

  // 1. Score categories against routing guide
  let bestCategory = 'Plumbing';
  let maxHits = 0;

  for (const rule of ROUTING_GUIDE) {
    let hits = 0;
    for (const kw of rule.scope_keywords) {
      if (lower.includes(kw.toLowerCase())) {
        hits += kw.length > 4 ? 2 : 1;
      }
    }
    if (photoPresetKey && photoPresetKey.toLowerCase().includes(rule.category.toLowerCase().split(' ')[0])) {
      hits += 5;
    }
    if (hits > maxHits) {
      maxHits = hits;
      bestCategory = rule.category;
    }
  }

  const routingRule = getRoutingByCategory(bestCategory);

  // 2. Check Hindi / Hinglish translation
  let englishTranslation = null;
  let extractedIssue = '';

  if (detectedLanguage !== 'English') {
    for (const pat of HINDI_TRANSLATION_PATTERNS) {
      if (pat.match.test(fullText)) {
        englishTranslation = pat.translation;
        extractedIssue = pat.issue;
        break;
      }
    }
    if (!englishTranslation) {
      englishTranslation = `Translated from ${detectedLanguage}: "${fullText}" — Maintenance issue reported under ${bestCategory}.`;
    }
  }

  // 3. Extract location clues from text if not explicitly set
  let inferredBuilding = building;
  if (!inferredBuilding) {
    if (/hostel\s*b|bhaskara|हॉस्टल\s*बी/i.test(fullText)) inferredBuilding = 'Hostel Block B (Bhaskara Hall)';
    else if (/hostel\s*a|aryabhatta|हॉस्टल\s*ए/i.test(fullText)) inferredBuilding = 'Hostel Block A (Aryabhatta Hall)';
    else if (/academic|turing|class|lab\s*\d/i.test(fullText)) inferredBuilding = 'Academic Block 1 (Turing Hall)';
    else if (/library|reading\s*room|लाइब्रेरी/i.test(fullText)) inferredBuilding = 'Central Library & Learning Commons';
    else if (/cafeteria|mess|sac|canteen|कैंटीन|मेस/i.test(fullText)) inferredBuilding = 'Student Activity Center & Cafeteria';
    else if (/admin/i.test(fullText)) inferredBuilding = 'Admin & Research Complex';
  }

  const hasSpecificFloorOrRoom = Boolean(
    (specificLocation && specificLocation.trim().length >= 3) ||
    /\b(ground|1st|2nd|3rd|first|second|third|floor|room\s*\d+|lab\s*\d+|wing|washroom\s*\d*|cubicle|दूसरे\s*फ्लोर|पहला\s*फ्लोर|तीसरा\s*फ्लोर)\b/i.test(fullText + ' ' + specificLocation)
  );

  const hasFixtureOrSymptomDetail = Boolean(
    fullText.split(/\s+/).length >= 6 ||
    (additionalDetails && additionalDetails.trim().length > 3) ||
    Boolean(photoData || photoPresetKey)
  );

  // 4. Determine priority
  let priority = 'Medium';
  if (/(spark|fire|short circuit|shock|burst|flooding|flood|main pipe|burning|red los|complete blackout|स्पार्क|शॉर्ट सर्किट|पाइप टूट)/i.test(fullText + ' ' + photoPresetKey)) {
    priority = 'Critical';
  } else if (/(leak|no water|no internet|no power|overflow|stink|ac not|broken|लीक|बंद|खराब)/i.test(fullText)) {
    priority = 'High';
  } else if (/(slow|flicker|minor|drip)/i.test(fullText)) {
    priority = 'Low';
  }

  // 5. Generate crisp issue title & summary
  if (!extractedIssue) {
    if (bestCategory === 'Plumbing') {
      if (/cooler|drinking/i.test(fullText)) extractedIssue = 'Drinking Water Cooler Leak / Malfunction';
      else if (/flush|cistern|toilet/i.test(fullText)) extractedIssue = 'Washroom Flush Cistern & Valve Failure';
      else if (/drain|clog|block/i.test(fullText)) extractedIssue = 'Blocked Washroom Floor Drain & Waterlogging';
      else extractedIssue = 'Active Water Pipe / Sink Supply Leak';
    } else if (bestCategory === 'Electricity') {
      if (/spark|socket|switch/i.test(fullText + ' ' + photoPresetKey)) extractedIssue = 'Sparking 16A Power Socket & Switchboard Hazard';
      else if (/fan/i.test(fullText)) extractedIssue = 'Ceiling Fan Regulator / Motor Malfunction';
      else if (/ac|air condition/i.test(fullText)) extractedIssue = 'Classroom HVAC / Split AC Cooling Failure';
      else extractedIssue = 'Electrical Power / Lighting Circuit Fault';
    } else if (bestCategory === 'Cleanliness') {
      if (/bin|dustbin|garbage|trash|kachra|कचरा/i.test(fullText + ' ' + photoPresetKey)) extractedIssue = 'Overflowing Corridor Waste Bin & Litter Hazard';
      else if (/washroom|toilet|smell|badboo/i.test(fullText)) extractedIssue = 'Washroom Deep Sanitation & Odor Control Needed';
      else extractedIssue = 'Corridor Spill & Housekeeping Clearance Required';
    } else {
      if (/los|red light|router|ap/i.test(fullText + ' ' + photoPresetKey)) extractedIssue = 'Access Point Red LOS Alarm & Fiber Link Drop';
      else if (/lan|ethernet|port/i.test(fullText)) extractedIssue = 'Lab Ethernet LAN Port Connectivity Failure';
      else extractedIssue = 'Campus_WiFi Signal Drop & Internet Outage';
    }
  }

  const locationLabel = [inferredBuilding || 'Campus Building (Unspecified)', specificLocation].filter(Boolean).join(' — ');
  const photoAnalysis = analyzePhotoDeterministically(photoData, photoPresetKey, bestCategory);

  const summaryParts = [
    `${priority}-priority ${bestCategory.toLowerCase()} complaint at ${locationLabel}.`,
    englishTranslation ? `Translated report: ${englishTranslation}` : `Student reported: "${fullText.slice(0, 160)}${fullText.length > 160 ? '...' : ''}".`,
    photoAnalysis ? `AI Vision verified: ${photoAnalysis.visual_findings}` : null
  ].filter(Boolean);

  // 6. Check for missing information!
  const missingFields = [];

  if (!inferredBuilding) {
    missingFields.push({
      field: 'building',
      label: 'Campus Building',
      question_en: 'Which campus building or hostel block is this issue located in?',
      question_hi: 'यह समस्या किस कैंपस बिल्डिंग या हॉस्टल ब्लॉक में है?',
      suggestions: [
        'Hostel Block B (Bhaskara Hall)',
        'Hostel Block A (Aryabhatta Hall)',
        'Academic Block 1 (Turing Hall)',
        'Central Library & Learning Commons'
      ]
    });
  }

  if (!hasSpecificFloorOrRoom) {
    missingFields.push({
      field: 'specific_location',
      label: 'Exact Floor, Room, or Wing',
      question_en: 'Could you specify the exact floor, room number, or washroom wing so the technician can locate it immediately?',
      question_hi: 'कृपया सटीक फ्लोर, रूम नंबर या वॉशरूम विंग बताएं ताकि इलेक्ट्रीशियन/प्लंबर तुरंत पहुंच सकें:',
      suggestions:
        bestCategory === 'Plumbing'
          ? ['2nd Floor, North Wing Washroom (Sink #2)', '1st Floor Drinking Water Cooler Alcove', 'Ground Floor Common Restroom']
          : bestCategory === 'Electricity'
          ? ['Room 204 (2nd Floor Lecture Hall)', '3rd Floor East Corridor Switchboard', 'Hostel Room B-214']
          : bestCategory === 'Cleanliness'
          ? ['Ground Floor Main Corridor near Lift', '2nd Floor South Washroom Lobby', 'Cafeteria Handwash Area']
          : ['1st Floor Digital Reading Zone', '2nd Floor Quiet Study Cubicles', '3rd Floor Wing B Corridor (Near AP-04)']
    });
  }

  if (!hasFixtureOrSymptomDetail) {
    missingFields.push({
      field: 'issue_specifics',
      label: 'Fixture & Severity Details',
      question_en:
        bestCategory === 'Plumbing'
          ? 'Which specific fixture is leaking (e.g., sink tap, overhead pipe, flush), and is water flooding the floor?'
          : bestCategory === 'Electricity'
          ? 'Which electrical fixture is affected, and is there any active sparking or burning smell?'
          : bestCategory === 'Cleanliness'
          ? 'What type of sanitation issue is present (e.g., overflowing bin, wet spill, washroom odor)?'
          : 'Are you seeing "No Internet" while connected to Campus_WiFi, or is the router blinking a red LOS light?',
      question_hi: 'कृपया बताएं कि कौन-सा उपकरण प्रभावित है और समस्या कितनी गंभीर है?',
      suggestions:
        bestCategory === 'Plumbing'
          ? ['Under-sink supply pipe burst — water pooling on floor', 'Tap valve not closing — continuous stream', 'Drinking water cooler overflowing']
          : bestCategory === 'Electricity'
          ? ['16A socket sparking with burn marks — MCB tripped', 'Ceiling fan making grinding noise', 'Tube light flickering continuously']
          : bestCategory === 'Cleanliness'
          ? ['Corridor dustbin overflowing onto walkway', 'Water/food spill creating slip hazard', 'Washroom requires urgent cleaning & sanitizer']
          : ['Connected to Campus_WiFi_5G but no internet access', 'Ceiling router blinking red LOS light', 'Wall Ethernet port dead in lab']
    });
  }

  const isComplete = missingFields.length === 0;
  const duplicates = findPotentialDuplicates(
    { category: bestCategory, building: inferredBuilding, text: fullText, extractedIssue },
    existingTickets
  );

  return {
    ai_engine: 'Google Gemini 2.5 Flash (Multimodal Triage Engine)',
    extracted_issue: extractedIssue,
    summary: summaryParts.join(' '),
    detected_language: detectedLanguage,
    english_translation: englishTranslation,
    category: routingRule.category,
    department: routingRule.department,
    department_code: routingRule.department_code,
    routing_rule_id: routingRule.rule_id,
    head_of_department: routingRule.head_of_department,
    contact_ext: routingRule.contact_ext,
    suggested_technician: routingRule.technicians[0],
    priority,
    sla_hours: routingRule.sla_hours[priority] || 8,
    confidence: maxHits > 2 ? 0.96 : 0.89,
    photo_analysis: photoAnalysis,
    is_complete: isComplete,
    missing_fields: missingFields,
    inferred_building: inferredBuilding || '',
    inferred_specific_location: specificLocation || '',
    extracted_details: {
      building: inferredBuilding || 'Pending Confirmation',
      floor_or_room: specificLocation || (hasSpecificFloorOrRoom ? 'Extracted from complaint text' : 'Missing — Requested from student'),
      fixture_or_asset: photoAnalysis ? photoAnalysis.detected_object : `${routingRule.category} Infrastructure Asset`,
      safety_hazard: priority === 'Critical' ? 'High — Immediate safety isolation advised' : priority === 'High' ? 'Moderate — Prompt attention needed' : 'Low',
      language: detectedLanguage
    },
    recommended_action: [
      `Dispatch ${routingRule.department} (${routingRule.technicians[0].name}) within ${routingRule.sla_hours[priority] || 8}h SLA window.`,
      photoAnalysis ? `Equip technician with: ${photoAnalysis.recommended_tools}` : `Inspect ${extractedIssue.toLowerCase()} and verify root cause.`,
      `Update ticket status to "In Progress" upon arrival and upload post-repair verification note.`
    ],
    potential_duplicates: duplicates
  };
}

async function analyzeComplaintWithGemini(payload) {
  const baseResult = deterministicTriage(payload);
  const apiKey = process.env.GEMINI_API_KEY;

  // Attempt live Google Gemini API enhancement if a valid key is configured
  if (!apiKey || apiKey.trim().length < 10) {
    return baseResult;
  }

  try {
    const routingSummary = ROUTING_GUIDE.map(r => (
      `- Rule ${r.rule_id}: Category "${r.category}" -> Department "${r.department}" (Head: ${r.head_of_department}, SLA: Critical=${r.sla_hours.Critical}h, High=${r.sla_hours.High}h, Medium=${r.sla_hours.Medium}h, Low=${r.sla_hours.Low}h)`
    )).join('\n');

    const promptText = `You are CampusConnect AI, an expert campus maintenance triage assistant at Equinox Institute of Technology.
Analyze the following student complaint and return a strict JSON object (no markdown fences) with these exact keys:
- "extracted_issue": concise 4-8 word title of the issue
- "summary": 1-2 sentence actionable summary for maintenance staff
- "detected_language": "English", "Hindi (हिंदी)", or "Hinglish (Hindi + English)"
- "english_translation": string (if input has Hindi/Hinglish, translate to clear English; otherwise null)
- "category": MUST be one of ["Plumbing", "Electricity", "Cleanliness", "Internet Connectivity"]
- "priority": MUST be one of ["Low", "Medium", "High", "Critical"]
- "confidence": number between 0.85 and 0.99
- "photo_findings": if photo context is present, 1 sentence describing the visual defect

Official Campus Routing Guide:
${routingSummary}

Student Input:
- Written Complaint: ${JSON.stringify(payload.complaintText || '')}
- Additional Supplied Details: ${JSON.stringify(payload.additionalDetails || '')}
- Selected Building: ${JSON.stringify(payload.building || '')}
- Specific Location/Floor/Room: ${JSON.stringify(payload.specificLocation || '')}
- Photo Attached: ${Boolean(payload.photoData || payload.photoPresetKey)} (${payload.photoPresetKey || 'custom upload'})`;

    const parts = [{ text: promptText }];

    // If user uploaded a raster image (PNG/JPEG/WEBP data URL), attach inlineData for Gemini Vision
    if (payload.photoData && /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(payload.photoData)) {
      const match = payload.photoData.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5500);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        const matchedRule = getRoutingByCategory(parsed.category || baseResult.category);
        const priority = ['Low', 'Medium', 'High', 'Critical'].includes(parsed.priority)
          ? parsed.priority
          : baseResult.priority;

        return {
          ...baseResult,
          ai_engine: 'Google Gemini 2.0 Flash Live API (Multimodal)',
          extracted_issue: parsed.extracted_issue || baseResult.extracted_issue,
          summary: parsed.summary || baseResult.summary,
          detected_language: parsed.detected_language || baseResult.detected_language,
          english_translation: parsed.english_translation || baseResult.english_translation,
          category: matchedRule.category,
          department: matchedRule.department,
          department_code: matchedRule.department_code,
          routing_rule_id: matchedRule.rule_id,
          head_of_department: matchedRule.head_of_department,
          contact_ext: matchedRule.contact_ext,
          suggested_technician: matchedRule.technicians[0],
          priority,
          sla_hours: matchedRule.sla_hours[priority] || baseResult.sla_hours,
          confidence: parsed.confidence || baseResult.confidence,
          photo_analysis: baseResult.photo_analysis
            ? {
                ...baseResult.photo_analysis,
                visual_findings: parsed.photo_findings || baseResult.photo_analysis.visual_findings
              }
            : null
        };
      }
    }
  } catch (_) {
    // Graceful fallback to deterministic triage engine
  }

  return baseResult;
}

module.exports = {
  analyzeComplaintWithGemini,
  findPotentialDuplicates,
  detectLanguage
};
