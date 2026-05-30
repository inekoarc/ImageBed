const fs = require('fs');
const path = require('path');
const config = require('../config');

const DATA_FILE = path.join(config.dataDir, 'images.json');

function ensureDataFile() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  }
}

function readAll() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeAll(records) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

function getById(id) {
  const records = readAll();
  return records.find(r => r.id === id) || null;
}

function add(record) {
  const records = readAll();
  records.unshift(record);
  writeAll(records);
  return record;
}

function remove(id) {
  const records = readAll();
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return false;
  records.splice(index, 1);
  writeAll(records);
  return true;
}

function getAll({ limit, offset } = {}) {
  let records = readAll();
  records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (offset) records = records.slice(offset);
  if (limit) records = records.slice(0, limit);
  return records;
}

module.exports = { readAll, getById, add, remove, getAll };
