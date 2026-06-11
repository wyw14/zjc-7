const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../utils/storage');

const router = express.Router();

router.get('/', (req, res) => {
  const borrows = readJSON('borrows.json', []);
  const instruments = readJSON('instruments.json', []);
  const users = readJSON('users.json', []);
  const { borrowerId, ownerId, status } = req.query;
  
  let result = borrows;
  
  if (borrowerId) {
    result = result.filter(b => b.borrowerId === borrowerId);
  }
  if (ownerId) {
    result = result.filter(b => b.ownerId === ownerId);
  }
  if (status) {
    result = result.filter(b => b.status === status);
  }
  
  const enriched = result.map(b => ({
    ...b,
    instrument: instruments.find(i => i.id === b.instrumentId) || null,
    borrower: users.find(u => u.id === b.borrowerId) || null,
    owner: users.find(u => u.id === b.ownerId) || null
  }));
  
  res.json(enriched);
});

router.get('/:id', (req, res) => {
  const borrows = readJSON('borrows.json', []);
  const instruments = readJSON('instruments.json', []);
  const users = readJSON('users.json', []);
  const borrow = borrows.find(b => b.id === req.params.id);
  
  if (!borrow) {
    return res.status(404).json({ error: '借用记录不存在' });
  }
  
  const result = {
    ...borrow,
    instrument: instruments.find(i => i.id === borrow.instrumentId) || null,
    borrower: users.find(u => u.id === borrow.borrowerId) || null,
    owner: users.find(u => u.id === borrow.ownerId) || null
  };
  
  res.json(result);
});

router.post('/', (req, res) => {
  const borrows = readJSON('borrows.json', []);
  const instruments = readJSON('instruments.json', []);
  
  const newBorrow = {
    id: 'b' + uuidv4().slice(0, 8),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  borrows.push(newBorrow);
  writeJSON('borrows.json', borrows);
  
  res.json({ success: true, borrow: newBorrow });
});

router.put('/:id', (req, res) => {
  const borrows = readJSON('borrows.json', []);
  const instruments = readJSON('instruments.json', []);
  const idx = borrows.findIndex(b => b.id === req.params.id);
  
  if (idx === -1) {
    return res.status(404).json({ error: '借用记录不存在' });
  }
  
  const newStatus = req.body.status;
  const oldStatus = borrows[idx].status;
  
  borrows[idx] = { ...borrows[idx], ...req.body, id: borrows[idx].id };
  
  if (newStatus === 'confirmed' && oldStatus !== 'confirmed') {
    borrows[idx].confirmedAt = new Date().toISOString();
    const instIdx = instruments.findIndex(i => i.id === borrows[idx].instrumentId);
    if (instIdx !== -1) {
      instruments[instIdx].status = 'borrowed';
      writeJSON('instruments.json', instruments);
    }
  }
  
  if (newStatus === 'returned' && oldStatus !== 'returned') {
    borrows[idx].returnedAt = new Date().toISOString();
    const instIdx = instruments.findIndex(i => i.id === borrows[idx].instrumentId);
    if (instIdx !== -1) {
      instruments[instIdx].status = 'available';
      writeJSON('instruments.json', instruments);
    }
  }
  
  writeJSON('borrows.json', borrows);
  res.json({ success: true, borrow: borrows[idx] });
});

module.exports = router;
