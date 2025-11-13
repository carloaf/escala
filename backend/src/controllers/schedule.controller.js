const Schedule = require('../models/Schedule');
const ScheduleChange = require('../models/ScheduleChange');
const { extractFromPdf } = require('../services/pdfExtractor.service');

async function uploadPdf(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    const rows = await extractFromPdf(filePath);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'No data extracted from PDF' });
    }

    // Get existing schedules to detect changes
    const existingSchedules = await Schedule.all();

    // Insert new schedules, but preserve previous records (do not delete)
    // ON CONFLICT in Schedule.insert handles duplicates automatically
    const inserted = [];
    const skipped = [];
    for (const r of rows) {
      const created = await Schedule.insert(r);
      
      if (!created) {
        // Duplicate was skipped by ON CONFLICT
        skipped.push(r);
        continue;
      }

      inserted.push(created);

      // Check for changes by matching on name or military_id with previous schedules
      const oldSchedule = existingSchedules.find(old => 
        (old.name && r.name && old.name === r.name) || (old.military_id && r.military_id && old.military_id === r.military_id)
      );

      if (oldSchedule) {
        // Detect if anything changed between old and new
        if (oldSchedule.service !== r.service || 
            oldSchedule.date !== r.date || 
            oldSchedule.time !== r.time) {
          await ScheduleChange.create({
            schedule_id: created.id,
            old_service: oldSchedule.service,
            new_service: r.service,
            old_date: oldSchedule.date,
            new_date: r.date,
            old_time: oldSchedule.time,
            new_time: r.time,
            old_name: oldSchedule.name,
            new_name: r.name
          });
        }
      }
    }

    return res.json({ 
      success: true, 
      count: inserted.length,
      skipped: skipped.length,
      total_extracted: rows.length,
      message: `Successfully processed ${rows.length} entries: ${inserted.length} inserted, ${skipped.length} duplicates skipped`,
      rows: inserted 
    });
  } catch (err) {
    console.error('uploadPdf error', err);
    return res.status(500).json({ error: 'Failed to process PDF', details: err.message });
  }
}

async function listSchedules(req, res) {
  try {
    const schedules = await Schedule.all();
    return res.json(schedules);
  } catch (err) {
    console.error('listSchedules error', err);
    return res.status(500).json({ error: 'Failed to fetch schedules' });
  }
}

async function getMySchedules(req, res) {
  try {
    const { name, military_id } = req.user;
    
    let schedules;
    if (military_id) {
      schedules = await Schedule.findByMilitaryId(military_id);
    } else if (name) {
      schedules = await Schedule.findByName(name);
    } else {
      return res.status(400).json({ error: 'User has no identifiable information' });
    }
    
    return res.json(schedules);
  } catch (err) {
    console.error('getMySchedules error', err);
    return res.status(500).json({ error: 'Failed to fetch your schedules' });
  }
}

async function getChanges(req, res) {
  try {
    const changes = await ScheduleChange.findUnnotified();
    return res.json(changes);
  } catch (err) {
    console.error('getChanges error', err);
    return res.status(500).json({ error: 'Failed to fetch changes' });
  }
}

module.exports = { uploadPdf, listSchedules, getMySchedules, getChanges };