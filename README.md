# 🏫 CampusConnect: Turn Student Complaints into Trackable Action

An AI-powered campus maintenance reporting, multimodal photo inspection, missing-information follow-up, duplicate detection, and department dispatch system powered by **Google Gemini**.

---

## ✨ Minimum Requirements & Extensions Covered

1. **Written Complaint, Location & Optional Photograph Intake**:
   - Supports informal complaints in **English**, **Hindi (हिंदी)**, and **Hinglish**.
   - Supports custom photo uploads (`PNG`/`JPG`/`WEBP`) as well as 1-click **Sample Evidence Photographs** analysed by Gemini Vision.
2. **Issue Extraction, Summarisation & Missing-Information Request**:
   - Extracts a structured issue title and technical summary.
   - Detects when critical details (exact floor/room/washroom wing or fixture severity) are missing and prompts the student with interactive follow-up questions and quick-reply chips.
3. **Supplied Campus Routing Guide (`Equinox Institute of Technology — Main Campus`)**:
   - **Plumbing** (`RG-PLM-01`) &rarr; *Plumbing & Water Works Department*
   - **Electricity** (`RG-ELC-02`) &rarr; *Electrical & Power Systems Department*
   - **Cleanliness** (`RG-CLN-03`) &rarr; *Campus Sanitation & Housekeeping Department*
   - **Internet Connectivity** (`RG-NET-04`) &rarr; *Campus IT & Network Infrastructure Helpdesk*
4. **Duplicate Report Flagging & Staff Merge Review**:
   - Detects potential duplicate complaints across English, Hindi, and Hinglish at the same building/category.
   - Students can **Upvote (`+1 Affected Student`)** an existing active ticket or submit anyway (automatically flagged for staff review).
   - Staff can compare flagged duplicates side-by-side and **Merge into Primary Ticket** (syncing live status across both ticket numbers) or **Dismiss Duplicate Flag**.
5. **Staff Dispatch Dashboard**:
   - Executive KPIs, Category/Status/Duplicate filters, 1-click Technician Assignment, and Status Progression (*Needs Info &rarr; Triaged &rarr; Assigned &rarr; In Progress &rarr; Resolved*).
6. **Student Ticket Number & Progress History Tracker**:
   - 5-stage visual progress bar + full timestamped audit trail.
7. **Optional Extensions Included**:
   - **Hindi & Hinglish Complaint Entry** with automatic English operational translation.
   - **Recurring-Issue & Campus Hotspot Analysis** with AI preventive maintenance recommendations.

---

## 🚀 Quick Start

```bash
cd campus-connect
npm start
```
Then open **`http://localhost:5000`** in your browser (or double-click `campus-connect/run.bat`).
