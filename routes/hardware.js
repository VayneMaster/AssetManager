const express = require('express');
const router = express.Router();
const Hardware = require('../models/Hardware');

// Alle hardware ophalen
router.get('/', async (req, res) => {
  const items = await Hardware.find();
  res.json(items);
});

// Nieuwe hardware toevoegen
router.post('/', async (req, res) => {
  const newItem = new Hardware(req.body);
  await newItem.save();
  res.json(newItem);
});

// Hardware updaten
router.put('/:id', async (req, res) => {
  const updated = await Hardware.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Hardware verwijderen
router.delete('/:id', async (req, res) => {
  await Hardware.findByIdAndDelete(req.params.id);
  res.json({ message: 'Verwijderd' });
});

module.exports = router;
