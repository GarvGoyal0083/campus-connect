// campus-connect/backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { db, initDatabase, seedInitialTickets } = require('./database');
const { CAMPUS_INFO, ROUTING_GUIDE, SAMPLE_EVIDENCE_PHOTOS, getRoutingByCategory } = require('./routingGuide');
const { analyzeComplaintWithGemini } = require('./geminiService');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'campus_connect_jwt_secret_2026';

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Initialize SQLite database & seed data
initDatabase();

function sanitizeUser(u) {
  if (!u) return null;
  const { password_hash, ...safe } = u;
  return safe;
}

// ---------------- AUTHENTICATION (STUDENT & ADMIN LOGIN) ---------------- //
app.post('/api/auth/login', (req, res) => {
  try {
    const { email = '', password = '' } = req.body;
    const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const user = sanitizeUser(row);
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const {
      name = '',
      email = '',
      password = '',
      role = 'student',
      roll_number = '',
      department = 'Equinox Main Campus'
    } = req.body;

    if (!name.trim() || !email.trim() || !password.trim()) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const exists = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (exists) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    const validRole = role === 'admin' ? 'admin' : 'student';
    const finalRoll = roll_number.trim() || (validRole === 'admin' ? 'STAFF-ADMIN' : `EIT2026ST${Math.floor(100 + Math.random() * 900)}`);

    const info = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, roll_number, department, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name.trim(), email.trim().toLowerCase(), hash, validRole, finalRoll, department, now);

    const user = sanitizeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid));
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ user: sanitizeUser(row) });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

function parseTicket(row) {
  if (!row) return null;
  return {
    ...row,
    is_duplicate_flagged: Boolean(row.is_duplicate_flagged),
    photo_analysis: row.photo_analysis ? JSON.parse(row.photo_analysis) : null,
    ai_metadata: row.ai_metadata ? JSON.parse(row.ai_metadata) : {},
    history: row.history ? JSON.parse(row.history) : []
  };
}

function generateTicketNumber() {
  const latest = db.prepare('SELECT id FROM tickets ORDER BY id DESC LIMIT 1').get();
  const nextNum = 1041 + (latest ? latest.id : 0);
  return `CC-2026-${nextNum}`;
}

// ---------------- CONFIG & ROUTING GUIDE ---------------- //
app.get('/api/config', (req, res) => {
  res.json({
    campus: CAMPUS_INFO,
    routing_guide: ROUTING_GUIDE,
    sample_photos: SAMPLE_EVIDENCE_PHOTOS,
    gemini_configured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// ---------------- AI COMPLAINT TRIAGE & PHOTO ANALYSIS ---------------- //
app.post('/api/complaints/analyze', async (req, res) => {
  try {
    const {
      complaintText = '',
      building = '',
      specificLocation = '',
      additionalDetails = '',
      photoData = '',
      photoPresetKey = ''
    } = req.body;

    if (!complaintText.trim() && !photoData && !photoPresetKey) {
      return res.status(400).json({ error: 'Please provide a written complaint or photograph.' });
    }

    const existingTickets = db
      .prepare('SELECT * FROM tickets ORDER BY created_at DESC')
      .all()
      .map(parseTicket);

    const resolvedPhoto = photoPresetKey && SAMPLE_EVIDENCE_PHOTOS[photoPresetKey]
      ? SAMPLE_EVIDENCE_PHOTOS[photoPresetKey]
      : photoData;

    const analysis = await analyzeComplaintWithGemini({
      complaintText,
      building,
      specificLocation,
      additionalDetails,
      photoData: resolvedPhoto,
      photoPresetKey,
      existingTickets
    });

    res.json({
      ...analysis,
      resolved_photo_url: resolvedPhoto || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CREATE TICKET ---------------- //
app.post('/api/tickets', async (req, res) => {
  try {
    const {
      student_name = 'Aarav Sharma',
      student_roll = 'EIT2024CS108',
      student_email = 'aarav.sharma@equinox.edu',
      original_complaint = '',
      additional_details = '',
      building = '',
      specific_location = '',
      photo_url = null,
      photo_preset_key = '',
      allow_incomplete = false
    } = req.body;

    if (!original_complaint.trim()) {
      return res.status(400).json({ error: 'Written complaint is required.' });
    }

    const existingTickets = db
      .prepare('SELECT * FROM tickets ORDER BY created_at DESC')
      .all()
      .map(parseTicket);

    const finalPhoto = photo_preset_key && SAMPLE_EVIDENCE_PHOTOS[photo_preset_key]
      ? SAMPLE_EVIDENCE_PHOTOS[photo_preset_key]
      : photo_url;

    const analysis = await analyzeComplaintWithGemini({
      complaintText: original_complaint,
      building,
      specificLocation: specific_location,
      additionalDetails: additional_details,
      photoData: finalPhoto || '',
      photoPresetKey: photo_preset_key,
      existingTickets
    });

    const ticketNumber = generateTicketNumber();
    const now = new Date().toISOString();

    const finalBuilding = building || analysis.inferred_building || 'Campus Building (Pending Confirmation)';
    const finalSpecificLocation = specific_location || analysis.inferred_specific_location || '';

    const topDuplicate = analysis.potential_duplicates && analysis.potential_duplicates.length > 0
      ? analysis.potential_duplicates[0]
      : null;

    const isIncomplete = !analysis.is_complete && allow_incomplete;
    const initialStatus = isIncomplete ? 'Needs Info' : 'Triaged';

    const history = [
      {
        stage: 'Submitted',
        timestamp: now,
        actor: `${student_name} (${student_roll})`,
        note: `Submitted complaint in ${analysis.detected_language}${finalPhoto ? ' with supporting photo evidence' : ''}.`
      }
    ];

    if (isIncomplete) {
      history.push({
        stage: 'Needs Info',
        timestamp: now,
        actor: 'Gemini AI Triage Assistant',
        note: `Preliminary category: ${analysis.category} (${analysis.department}). Requested missing details from student: ${analysis.missing_fields.map(f => f.label).join(', ')}.`
      });
    } else {
      history.push({
        stage: 'Triaged',
        timestamp: now,
        actor: 'Gemini AI Triage Engine',
        note: `Categorized under ${analysis.category} (Rule ${analysis.routing_rule_id} → ${analysis.department}). Priority: ${analysis.priority} (${analysis.sla_hours}h SLA).${topDuplicate ? ` Flagged as ${topDuplicate.similarity_score}% potential duplicate of #${topDuplicate.ticket_number} for staff review.` : ''}`
      });
    }

    const stmt = db.prepare(`
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

    const info = stmt.run({
      ticket_number: ticketNumber,
      student_name,
      student_roll,
      student_email,
      original_complaint,
      detected_language: analysis.detected_language,
      english_translation: analysis.english_translation,
      additional_details: additional_details || null,
      title: analysis.extracted_issue,
      summary: analysis.summary,
      category: analysis.category,
      department: analysis.department,
      department_code: analysis.department_code,
      routing_rule_id: analysis.routing_rule_id,
      priority: analysis.priority,
      sla_hours: analysis.sla_hours,
      building: finalBuilding,
      specific_location: finalSpecificLocation,
      photo_url: finalPhoto || null,
      photo_analysis: analysis.photo_analysis ? JSON.stringify(analysis.photo_analysis) : null,
      ai_metadata: JSON.stringify({
        confidence: analysis.confidence,
        ai_engine: analysis.ai_engine,
        recommended_action: analysis.recommended_action,
        missing_fields: analysis.missing_fields,
        extracted_details: analysis.extracted_details,
        potential_duplicates: analysis.potential_duplicates
      }),
      status: initialStatus,
      assigned_technician: null,
      technician_phone: null,
      is_duplicate_flagged: topDuplicate ? 1 : 0,
      duplicate_of_ticket: topDuplicate ? topDuplicate.ticket_number : null,
      duplicate_similarity: topDuplicate ? topDuplicate.similarity_score : 0,
      merged_into: null,
      upvotes: 1,
      history: JSON.stringify(history),
      created_at: now,
      updated_at: now
    });

    const created = parseTicket(db.prepare('SELECT * FROM tickets WHERE id = ?').get(info.lastInsertRowid));
    res.status(201).json({ ticket: created, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- SUPPLY MISSING DETAILS TO AN INCOMPLETE TICKET ---------------- //
app.patch('/api/tickets/:ticketNumber/supply-info', async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const { building, specific_location, additional_details, photo_url, photo_preset_key } = req.body;

    const existingRow = db.prepare('SELECT * FROM tickets WHERE ticket_number = ?').get(ticketNumber);
    if (!existingRow) return res.status(404).json({ error: 'Ticket not found' });

    const ticket = parseTicket(existingRow);
    const updatedBuilding = building || ticket.building;
    const updatedLocation = specific_location || ticket.specific_location || '';
    const updatedDetails = [ticket.additional_details, additional_details].filter(Boolean).join(' | ');
    const updatedPhoto = (photo_preset_key && SAMPLE_EVIDENCE_PHOTOS[photo_preset_key]) || photo_url || ticket.photo_url;

    const otherTickets = db
      .prepare('SELECT * FROM tickets WHERE ticket_number != ? ORDER BY created_at DESC')
      .all(ticketNumber)
      .map(parseTicket);

    const analysis = await analyzeComplaintWithGemini({
      complaintText: ticket.original_complaint,
      building: updatedBuilding,
      specificLocation: updatedLocation,
      additionalDetails: updatedDetails,
      photoData: updatedPhoto || '',
      photoPresetKey: photo_preset_key || '',
      existingTickets: otherTickets
    });

    const topDuplicate = analysis.potential_duplicates && analysis.potential_duplicates.length > 0
      ? analysis.potential_duplicates[0]
      : null;

    const now = new Date().toISOString();
    const history = [...ticket.history];
    history.push({
      stage: 'Info Supplied',
      timestamp: now,
      actor: `${ticket.student_name} (Student)`,
      note: `Supplied missing details — Location: ${updatedBuilding}${updatedLocation ? ` (${updatedLocation})` : ''}${additional_details ? `, Details: "${additional_details}"` : ''}.`
    });
    history.push({
      stage: 'Triaged',
      timestamp: now,
      actor: 'Gemini AI Triage Engine',
      note: `Ticket finalized & routed to ${analysis.department} (${analysis.routing_rule_id}). Priority: ${analysis.priority}.${topDuplicate ? ` Flagged as ${topDuplicate.similarity_score}% potential duplicate of #${topDuplicate.ticket_number} for staff review.` : ''}`
    });

    db.prepare(`
      UPDATE tickets SET
        building = @building,
        specific_location = @specific_location,
        additional_details = @additional_details,
        photo_url = @photo_url,
        photo_analysis = @photo_analysis,
        title = @title,
        summary = @summary,
        category = @category,
        department = @department,
        department_code = @department_code,
        routing_rule_id = @routing_rule_id,
        priority = @priority,
        sla_hours = @sla_hours,
        ai_metadata = @ai_metadata,
        status = 'Triaged',
        is_duplicate_flagged = @is_duplicate_flagged,
        duplicate_of_ticket = @duplicate_of_ticket,
        duplicate_similarity = @duplicate_similarity,
        history = @history,
        updated_at = @updated_at
      WHERE ticket_number = @ticket_number
    `).run({
      building: updatedBuilding,
      specific_location: updatedLocation,
      additional_details: updatedDetails,
      photo_url: updatedPhoto,
      photo_analysis: analysis.photo_analysis ? JSON.stringify(analysis.photo_analysis) : ticket.photo_analysis ? JSON.stringify(ticket.photo_analysis) : null,
      title: analysis.extracted_issue,
      summary: analysis.summary,
      category: analysis.category,
      department: analysis.department,
      department_code: analysis.department_code,
      routing_rule_id: analysis.routing_rule_id,
      priority: analysis.priority,
      sla_hours: analysis.sla_hours,
      ai_metadata: JSON.stringify({
        confidence: analysis.confidence,
        ai_engine: analysis.ai_engine,
        recommended_action: analysis.recommended_action,
        missing_fields: [],
        extracted_details: analysis.extracted_details,
        potential_duplicates: analysis.potential_duplicates
      }),
      is_duplicate_flagged: topDuplicate ? 1 : ticket.is_duplicate_flagged ? 1 : 0,
      duplicate_of_ticket: topDuplicate ? topDuplicate.ticket_number : ticket.duplicate_of_ticket,
      duplicate_similarity: topDuplicate ? topDuplicate.similarity_score : ticket.duplicate_similarity,
      history: JSON.stringify(history),
      updated_at: now,
      ticket_number: ticketNumber
    });

    const updated = parseTicket(db.prepare('SELECT * FROM tickets WHERE ticket_number = ?').get(ticketNumber));
    res.json({ ticket: updated, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- UPVOTE / ME-TOO EXISTING DUPLICATE TICKET ---------------- //
app.post('/api/tickets/:ticketNumber/upvote', (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const { student_name = 'Campus Student', note = 'Confirmed experiencing the same issue at this location.' } = req.body;

    const row = db.prepare('SELECT * FROM tickets WHERE ticket_number = ?').get(ticketNumber);
    if (!row) return res.status(404).json({ error: 'Ticket not found' });

    const ticket = parseTicket(row);
    const now = new Date().toISOString();
    const history = [...ticket.history, {
      stage: 'Student Upvote (+1)',
      timestamp: now,
      actor: student_name,
      note
    }];

    db.prepare(`
      UPDATE tickets SET upvotes = upvotes + 1, history = ?, updated_at = ? WHERE ticket_number = ?
    `).run(JSON.stringify(history), now, ticketNumber);

    const updated = parseTicket(db.prepare('SELECT * FROM tickets WHERE ticket_number = ?').get(ticketNumber));
    res.json({ ticket: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- GET ALL TICKETS (WITH FILTERS) ---------------- //
app.get('/api/tickets', (req, res) => {
  try {
    const { category, status, building, priority, duplicatesOnly, search } = req.query;
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (building && building !== 'All') {
      query += ' AND building = ?';
      params.push(building);
    }
    if (priority && priority !== 'All') {
      query += ' AND priority = ?';
      params.push(priority);
    }
    if (duplicatesOnly === 'true') {
      query += ' AND (is_duplicate_flagged = 1 OR merged_into IS NOT NULL)';
    }
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      query += ' AND (ticket_number LIKE ? OR title LIKE ? OR original_complaint LIKE ? OR building LIKE ? OR specific_location LIKE ? OR student_name LIKE ? OR student_roll LIKE ?)';
      params.push(s, s, s, s, s, s, s);
    }

    query += ' ORDER BY id DESC';
    const tickets = db.prepare(query).all(...params).map(parseTicket);
    res.json({ tickets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- GET SINGLE TICKET BY NUMBER ---------------- //
app.get('/api/tickets/:ticketNumber', (req, res) => {
  try {
    const rawParam = req.params.ticketNumber.trim().toUpperCase();
    const row = db.prepare('SELECT * FROM tickets WHERE UPPER(ticket_number) = ?').get(rawParam);
    if (!row) return res.status(404).json({ error: `Ticket "${rawParam}" not found.` });

    const ticket = parseTicket(row);

    // If this ticket was merged into a primary ticket, or has a flagged duplicate target, include that target ticket
    let linkedPrimaryTicket = null;
    const refNumber = ticket.merged_into || ticket.duplicate_of_ticket;
    if (refNumber) {
      const primaryRow = db.prepare('SELECT * FROM tickets WHERE ticket_number = ?').get(refNumber);
      if (primaryRow) linkedPrimaryTicket = parseTicket(primaryRow);
    }

    // Also find any tickets merged into this ticket
    const mergedChildren = db
      .prepare('SELECT ticket_number, student_name, student_roll, original_complaint, created_at FROM tickets WHERE merged_into = ?')
      .all(ticket.ticket_number);

    res.json({
      ticket,
      linked_primary_ticket: linkedPrimaryTicket,
      merged_children: mergedChildren
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- STAFF UPDATE (ASSIGN DEPARTMENT/TECH & UPDATE STATUS) ---------------- //
app.patch('/api/tickets/:ticketNumber/staff-update', (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const {
      status,
      category,
      priority,
      assigned_technician,
      technician_phone,
      staff_note,
      staff_actor = 'Campus Facilities Dispatcher'
    } = req.body;

    const row = db.prepare('SELECT * FROM tickets WHERE ticket_number = ?').get(ticketNumber);
    if (!row) return res.status(404).json({ error: 'Ticket not found' });

    const ticket = parseTicket(row);
    const now = new Date().toISOString();

    const newCategory = category || ticket.category;
    const routingRule = getRoutingByCategory(newCategory);
    const newPriority = priority || ticket.priority;
    const newStatus = status || ticket.status;
    const newTech = assigned_technician !== undefined ? assigned_technician : ticket.assigned_technician;
    const newPhone = technician_phone !== undefined ? technician_phone : ticket.technician_phone;

    const history = [...ticket.history];
    const changes = [];
    if (category && category !== ticket.category) changes.push(`Category rerouted to ${newCategory} (${routingRule.department})`);
    if (newTech && newTech !== ticket.assigned_technician) changes.push(`Assigned to ${newTech}`);
    if (status && status !== ticket.status) changes.push(`Status updated to "${newStatus}"`);
    if (priority && priority !== ticket.priority) changes.push(`Priority set to ${newPriority}`);

    history.push({
      stage: newStatus,
      timestamp: now,
      actor: staff_actor,
      note: [changes.join(' • '), staff_note].filter(Boolean).join(' — ') || `Ticket updated to ${newStatus}.`
    });

    db.prepare(`
      UPDATE tickets SET
        status = @status,
        category = @category,
        department = @department,
        department_code = @department_code,
        routing_rule_id = @routing_rule_id,
        priority = @priority,
        sla_hours = @sla_hours,
        assigned_technician = @assigned_technician,
        technician_phone = @technician_phone,
        history = @history,
        updated_at = @updated_at
      WHERE ticket_number = @ticket_number
    `).run({
      status: newStatus,
      category: routingRule.category,
      department: routingRule.department,
      department_code: routingRule.department_code,
      routing_rule_id: routingRule.rule_id,
      priority: newPriority,
      sla_hours: routingRule.sla_hours[newPriority] || ticket.sla_hours,
      assigned_technician: newTech,
      technician_phone: newPhone,
      history: JSON.stringify(history),
      updated_at: now,
      ticket_number: ticketNumber
    });

    // If any child tickets were merged into this primary ticket, sync their status and history too!
    const mergedChildren = db.prepare('SELECT * FROM tickets WHERE merged_into = ?').all(ticketNumber).map(parseTicket);
    for (const child of mergedChildren) {
      const childHistory = [...child.history, {
        stage: newStatus,
        timestamp: now,
        actor: `${staff_actor} (Synced from Primary #${ticketNumber})`,
        note: [changes.join(' • '), staff_note].filter(Boolean).join(' — ') || `Primary ticket #${ticketNumber} updated to ${newStatus}.`
      }];
      db.prepare(`
        UPDATE tickets SET
          status = ?, assigned_technician = ?, technician_phone = ?, history = ?, updated_at = ?
        WHERE ticket_number = ?
      `).run(newStatus, newTech, newPhone, JSON.stringify(childHistory), now, child.ticket_number);
    }

    const updated = parseTicket(db.prepare('SELECT * FROM tickets WHERE ticket_number = ?').get(ticketNumber));
    res.json({ ticket: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- STAFF DUPLICATE REVIEW (MERGE OR DISMISS) ---------------- //
app.post('/api/tickets/:ticketNumber/duplicate-review', (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const { action, target_ticket_number, staff_note } = req.body;

    const row = db.prepare('SELECT * FROM tickets WHERE ticket_number = ?').get(ticketNumber);
    if (!row) return res.status(404).json({ error: 'Ticket not found' });

    const ticket = parseTicket(row);
    const now = new Date().toISOString();

    if (action === 'dismiss') {
      const history = [...ticket.history, {
        stage: 'Duplicate Flag Dismissed',
        timestamp: now,
        actor: 'Campus Facilities Dispatcher',
        note: staff_note || `Reviewed against #${ticket.duplicate_of_ticket || 'existing tickets'} and confirmed as a separate, distinct maintenance issue.`
      }];

      db.prepare(`
        UPDATE tickets SET is_duplicate_flagged = 0, history = ?, updated_at = ? WHERE ticket_number = ?
      `).run(JSON.stringify(history), now, ticketNumber);

      const updated = parseTicket(db.prepare('SELECT * FROM tickets WHERE ticket_number = ?').get(ticketNumber));
      return res.json({ ticket: updated });
    }

    if (action === 'merge') {
      const primaryNum = target_ticket_number || ticket.duplicate_of_ticket;
      const primaryRow = db.prepare('SELECT * FROM tickets WHERE ticket_number = ?').get(primaryNum);
      if (!primaryRow) return res.status(404).json({ error: `Primary ticket ${primaryNum} not found.` });

      const primaryTicket = parseTicket(primaryRow);

      // Update child ticket
      const childHistory = [...ticket.history, {
        stage: `Merged into #${primaryTicket.ticket_number}`,
        timestamp: now,
        actor: 'Campus Facilities Dispatcher',
        note: staff_note || `Confirmed duplicate report (${ticket.duplicate_similarity || 92}% match). Merged into primary ticket #${primaryTicket.ticket_number}. All status updates from #${primaryTicket.ticket_number} now sync automatically.`
      }];

      db.prepare(`
        UPDATE tickets SET
          is_duplicate_flagged = 0,
          merged_into = ?,
          status = ?,
          assigned_technician = ?,
          technician_phone = ?,
          history = ?,
          updated_at = ?
        WHERE ticket_number = ?
      `).run(
        primaryTicket.ticket_number,
        primaryTicket.status,
        primaryTicket.assigned_technician,
        primaryTicket.technician_phone,
        JSON.stringify(childHistory),
        now,
        ticketNumber
      );

      // Update primary ticket upvotes & history
      const primaryHistory = [...primaryTicket.history, {
        stage: `Duplicate Merged (#${ticket.ticket_number})`,
        timestamp: now,
        actor: 'Campus Facilities Dispatcher',
        note: `Merged duplicate report #${ticket.ticket_number} from ${ticket.student_name} (${ticket.detected_language}). Affected student count increased by +${ticket.upvotes || 1}.`
      }];

      db.prepare(`
        UPDATE tickets SET
          upvotes = upvotes + ?,
          history = ?,
          updated_at = ?
        WHERE ticket_number = ?
      `).run(ticket.upvotes || 1, JSON.stringify(primaryHistory), now, primaryTicket.ticket_number);

      const updatedChild = parseTicket(db.prepare('SELECT * FROM tickets WHERE ticket_number = ?').get(ticketNumber));
      const updatedPrimary = parseTicket(db.prepare('SELECT * FROM tickets WHERE ticket_number = ?').get(primaryTicket.ticket_number));

      return res.json({
        ticket: updatedChild,
        primary_ticket: updatedPrimary
      });
    }

    res.status(400).json({ error: 'Invalid duplicate review action. Use "merge" or "dismiss".' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ANALYTICS & RECURRING ISSUE HOTSPOTS ---------------- //
app.get('/api/analytics', (req, res) => {
  try {
    const allTickets = db.prepare('SELECT * FROM tickets ORDER BY created_at DESC').all().map(parseTicket);

    const totalTickets = allTickets.length;
    const activeTickets = allTickets.filter(t => t.status !== 'Resolved' && !t.merged_into).length;
    const resolvedTickets = allTickets.filter(t => t.status === 'Resolved').length;
    const criticalTickets = allTickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length;
    const flaggedDuplicates = allTickets.filter(t => t.is_duplicate_flagged && !t.merged_into).length;
    const mergedDuplicates = allTickets.filter(t => Boolean(t.merged_into)).length;
    const multilingualCount = allTickets.filter(t => t.detected_language && t.detected_language !== 'English').length;

    const byCategory = ROUTING_GUIDE.map(rule => {
      const matching = allTickets.filter(t => t.category === rule.category);
      return {
        category: rule.category,
        department: rule.department,
        rule_id: rule.rule_id,
        total: matching.length,
        open: matching.filter(t => t.status !== 'Resolved').length,
        resolved: matching.filter(t => t.status === 'Resolved').length
      };
    });

    // Recurring-issue hotspot clustering by Building + Category
    const clusterMap = {};
    for (const t of allTickets) {
      const key = `${t.building}__${t.category}`;
      if (!clusterMap[key]) {
        clusterMap[key] = {
          building: t.building,
          category: t.category,
          department: t.department,
          ticket_count: 0,
          affected_students: 0,
          tickets: []
        };
      }
      clusterMap[key].ticket_count += 1;
      clusterMap[key].affected_students += t.upvotes || 1;
      clusterMap[key].tickets.push(t.ticket_number);
    }

    const hotspots = Object.values(clusterMap)
      .sort((a, b) => b.ticket_count - a.ticket_count || b.affected_students - a.affected_students)
      .map(h => ({
        ...h,
        ai_preventive_insight:
          h.category === 'Plumbing'
            ? `Recurring washroom supply valve pressure spikes detected in ${h.building}. Schedule main pressure-reducing valve (PRV) calibration.`
            : h.category === 'Electricity'
            ? `Multiple electrical load/lighting reports in ${h.building}. Inspect floor distribution board MCBs and replace aging 16A sockets.`
            : h.category === 'Internet Connectivity'
            ? `High density of student devices in ${h.building}. Check fiber patch enclosure and rebalance 5GHz channel allocation.`
            : `High footfall waste accumulation in ${h.building}. Increase housekeeping clearance frequency during peak lunch/evening hours.`
      }));

    res.json({
      kpis: {
        total_tickets: totalTickets,
        active_tickets: activeTickets,
        resolved_tickets: resolvedTickets,
        critical_open: criticalTickets,
        flagged_duplicates: flaggedDuplicates,
        merged_duplicates: mergedDuplicates,
        multilingual_complaints: multilingualCount,
        avg_triage_time_sec: 1.8
      },
      category_breakdown: byCategory,
      recurring_hotspots: hotspots
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- RESET DEMO DATA ---------------- //
app.post('/api/demo/reset', (req, res) => {
  try {
    db.prepare('DELETE FROM tickets').run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name='tickets'").run();
    seedInitialTickets();
    const tickets = db.prepare('SELECT * FROM tickets ORDER BY id DESC').all().map(parseTicket);
    res.json({ message: 'Demo database reset to initial state.', tickets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CampusConnect AI Maintenance Triage API',
    campus: CAMPUS_INFO.name,
    categories: ROUTING_GUIDE.map(r => r.category),
    timestamp: new Date().toISOString()
  });
});

// Serve static frontend build in production
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(
    express.static(distPath, {
      etag: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        }
      }
    })
  );

  // Fallback for stale cached asset hashes (/assets/index-*.js or .css) so cached tabs never white-screen
  app.get('/assets/:filename', (req, res, next) => {
    const assetsDir = path.join(distPath, 'assets');
    if (!fs.existsSync(assetsDir)) return next();
    const reqFile = req.params.filename || '';
    const ext = path.extname(reqFile);
    if (ext === '.js' || ext === '.css') {
      const files = fs.readdirSync(assetsDir);
      const match = files.find(f => f.endsWith(ext));
      if (match) {
        res.setHeader('Cache-Control', 'no-cache');
        return res.sendFile(path.join(assetsDir, match));
      }
    }
    return res.status(404).end();
  });

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/assets')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[CampusConnect Server] Running on http://localhost:${PORT}`);
});
