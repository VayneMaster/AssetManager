const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// MongoDB connectie
mongoose.connect('mongodb://localhost:27017/hardwarebeheer', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schema
const HardwareSchema = new mongoose.Schema({
  name: String,
  location: String,
  user: String,
  serialnumber: Number,
  quantity: Number,
  imagePath: String
});
const Hardware = mongoose.model('Hardware', HardwareSchema);

// CORS toestaan voor frontend
app.use(cors());
app.use(express.json());

// Multer configuratie
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = '\\\\fs01-vhe\\users\\damy.vanschaijk\\hardware_fotos';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    console.log("Upload route bereikt");
    console.log("Bestand:", req.file);
    console.log("Body:", req.body);

    const { name, location, user, serialnumber, quantity } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const hardware = new Hardware({
      name,
      location,
      user,
      serialnumber: parseInt(serialnumber),
      quantity: parseInt(quantity),
      imagePath
    });

    await hardware.save();
    res.status(200).json({ message: 'Hardware opgeslagen', hardware });
  } catch (err) {
    console.error("Fout bij upload:", err);
    res.status(500).json({ error: 'Fout bij opslaan' });
  }
});


// API voor ophalen van hardware
app.get('/api/hardware', async (req, res) => {
  const data = await Hardware.find();
  res.json(data);
});

// Verwijderen
app.delete('/api/hardware/:id', async (req, res) => {
  await Hardware.findByIdAndDelete(req.params.id);
  res.json({ message: 'Verwijderd' });
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
