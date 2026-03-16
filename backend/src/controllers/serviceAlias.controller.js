const ServiceAlias = require('../models/ServiceAlias');
const Schedule = require('../models/Schedule');
const { normalizeBaseServiceName, normalizeServiceName } = require('../utils/serviceNameNormalizer');

async function listServiceAliases(req, res) {
  try {
    const [aliases, canonicalServices] = await Promise.all([
      ServiceAlias.all(),
      Schedule.reportServiceTypes()
    ]);

    res.json({ aliases, canonical_services: canonicalServices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createOrUpdateServiceAlias(req, res) {
  try {
    const aliasName = normalizeBaseServiceName(req.body.alias_name);
    const canonicalName = normalizeBaseServiceName(req.body.canonical_name);

    if (!aliasName || !canonicalName) {
      return res.status(400).json({ error: 'alias_name e canonical_name são obrigatórios' });
    }

    if (normalizeServiceName(aliasName) === normalizeServiceName(canonicalName)) {
      return res.status(400).json({ error: 'O alias informado já corresponde ao nome canônico atual' });
    }

    const [alias, applied] = await Promise.all([
      ServiceAlias.upsert({ aliasName, canonicalName }),
      ServiceAlias.applyAliasToExistingData({ aliasName, canonicalName })
    ]);

    const canonicalServices = await Schedule.reportServiceTypes();

    res.status(201).json({ alias, applied, canonical_services: canonicalServices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteServiceAlias(req, res) {
  try {
    const removed = await ServiceAlias.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: 'Alias não encontrado' });
    }
    res.json({ success: true, removed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listServiceAliases, createOrUpdateServiceAlias, deleteServiceAlias };