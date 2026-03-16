const Schedule = require('../models/Schedule');
const ScheduleChange = require('../models/ScheduleChange');
const ServiceAlias = require('../models/ServiceAlias');
const { extractFromPdf } = require('../services/pdfExtractor.service');
const { normalizeServiceName, normalizeScheduleRow } = require('../utils/serviceNameNormalizer');
const { normalizePersonName, normalizeSchedulePersonRow } = require('../utils/personNameNormalizer');
const { normalizeRank, normalizeScheduleRankRow } = require('../utils/rankNormalizer');

async function uploadPdf(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    const aliasEntries = await ServiceAlias.aliasEntries();
    const { results, pdfType } = await extractFromPdf(filePath);
    const rows = results
      .map((row) => normalizeScheduleRow(row, aliasEntries))
      .map(normalizeSchedulePersonRow)
      .map(normalizeScheduleRankRow);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'No data extracted from PDF' });
    }

    // Get existing schedules to detect changes
    const existingSchedules = (await Schedule.all())
      .map((row) => normalizeScheduleRow(row, aliasEntries))
      .map(normalizeSchedulePersonRow)
      .map(normalizeScheduleRankRow);
    
    // Get unique dates from incoming data
    const incomingDates = [...new Set(rows.map(r => r.date))];
    
    // If Boletim Interno: delete all schedules for the same date(s)
    // Boletim is the DEFINITIVE schedule, replacing any "Previsão" data
    if (pdfType === 'boletim_interno') {
      console.log(`\nBoletim Interno detectado! Deletando escalas existentes para: ${incomingDates.join(', ')}\n`);
      
      for (const date of incomingDates) {
        await Schedule.deleteByDate(date);
      }
    } else {
      // If Previsão: check if any incoming date already has Boletim Interno data
      // Boletim data is identified by services containing "Cia Sup"
      const blockedDates = [];
      
      for (const date of incomingDates) {
        const existingForDate = existingSchedules.filter(s => s.date === date);
        const hasBoletimData = existingForDate.some(s => 
          s.service && (s.service.includes('1ª Cia Sup') || s.service.includes('2ª Cia Sup'))
        );
        
        if (hasBoletimData) {
          blockedDates.push(date);
        }
      }
      
      if (blockedDates.length > 0) {
        return res.status(400).json({
          error: 'Cannot upload Previsão data for dates that already have Boletim Interno data',
          blockedDates: blockedDates,
          message: `As datas ${blockedDates.join(', ')} já possuem dados de Boletim Interno (escala definitiva). Não é possível sobrescrever com Previsão da Escala.`
        });
      }
    }

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
        const normalizedNewService = normalizeServiceName(r.service, aliasEntries);
        // Detect if anything changed between old and new
        if (oldSchedule.service !== normalizedNewService || 
            oldSchedule.date !== r.date || 
            oldSchedule.time !== r.time) {
          await ScheduleChange.create({
            schedule_id: created.id,
            old_service: oldSchedule.service,
            new_service: normalizedNewService,
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
    const { name, rank, military_id } = req.user;
    const normalizedUserName = normalizePersonName(name);
    const normalizedUserRank = normalizeRank(rank);
    
    let mySchedules;
    // Priority: rank+name > military_id > name
    // Changed priority because military_id may not be populated in schedules table
    if (normalizedUserRank && normalizedUserName) {
      mySchedules = await Schedule.findByRankAndName(normalizedUserRank, normalizedUserName);
    } else if (military_id) {
      mySchedules = await Schedule.findByMilitaryId(military_id);
    } else if (normalizedUserName) {
      mySchedules = await Schedule.findByName(normalizedUserName);
    } else {
      return res.status(400).json({ error: 'User has no identifiable information' });
    }
    
    // For each schedule, find ALL people in the same service+date (to show substitutions)
    const enrichedSchedules = [];
    const allSchedules = await Schedule.all();
    
    for (const mySchedule of mySchedules) {
      // Find all schedules with same service and date
      const related = allSchedules.filter(s => 
        s.service === mySchedule.service && s.date === mySchedule.date
      ).sort((a, b) => a.id - b.id); // Sort by ID to maintain order
      
      // Add all related schedules (for substitution display)
      related.forEach(r => {
        // Mark which one is the current user
        const isCurrentUser = (normalizedUserRank && r.rank === normalizedUserRank && r.name === normalizedUserName) || 
                              (military_id && r.military_id === military_id) ||
                              (r.name === normalizedUserName);
        enrichedSchedules.push({ ...r, isCurrentUser });
      });
    }
    
    // Remove duplicates (same service+date might be added multiple times)
    const unique = enrichedSchedules.filter((item, index, self) =>
      index === self.findIndex(t => t.id === item.id)
    );
    
    return res.json(unique);
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

async function getReport(req, res) {
  try {
    const { date_from, date_to, service_types } = req.query;
    if (!date_from || !date_to) {
      return res.status(400).json({ error: 'date_from e date_to são obrigatórios (YYYY-MM-DD)' });
    }

    const serviceTypes = typeof service_types === 'string'
      ? service_types.split(',').map((serviceType) => serviceType.trim()).filter(Boolean)
      : [];

    const [byPerson, byRank] = await Promise.all([
      Schedule.reportByPerson({ dateFrom: date_from, dateTo: date_to, serviceTypes }),
      Schedule.reportByRank({ dateFrom: date_from, dateTo: date_to, serviceTypes }),
    ]);
    res.json({ date_from, date_to, service_types: serviceTypes, by_person: byPerson, by_rank: byRank });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getReportDateRange(req, res) {
  try {
    const range = await Schedule.reportDateRange();
    res.json(range);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getReportServiceTypes(req, res) {
  try {
    const serviceTypes = await Schedule.reportServiceTypes();
    res.json(serviceTypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { uploadPdf, listSchedules, getMySchedules, getChanges, getReport, getReportDateRange, getReportServiceTypes };