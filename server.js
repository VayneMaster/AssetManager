const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const PORT = 3000;

const SHARE_DIR = '\\\\fs01-vhe\\users\\damy.vanschaijk\\hardware_fotos';

const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'inventmgmt';

fs.mkdirSync(SHARE_DIR, { recursive: true });

const allowed = new Set(['image/png','image/jpeg','image/jpg','image/webp','image/gif']);
const storage = multer.diskStorage({
  destination(req, file, cb) { cb(null, SHARE_DIR); },
  filename(req, file, cb) {
    const time = Date.now();
    const clean = file.originalname.replace(/[^\w.\-]/g, '_');
    cb(null, `${time}-${clean}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!allowed.has(file.mimetype)) return cb(new Error('Alleen afbeeldingen zijn toegestaan'), false);
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const app = express();
app.use(cors()); // zodat fetch vanaf file:// of een andere origin werkt
app.use(express.json());

// Maak externe map bereikbaar onder een URL-pad:
app.use('/hardware_fotos', express.static(SHARE_DIR, {
  fallthrough: false,
  setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'),
}));

let db;
MongoClient.connect(MONGO_URL).then(client => {
  db = client.db(DB_NAME);
  app.listen(PORT, () => console.log(`API op http://localhost:${PORT}`));
}).catch(err => {
  console.error('MongoDB connect error:', err);
  process.exit(1);
});

// Upload endpoint
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'Geen bestand ontvangen' });

    const itemId = req.body.itemId; // verwacht een hardware-item ID
    const filename = req.file.filename;
    const urlPath = `/hardware_fotos/${filename}`; // publiek pad (via static)

    if (itemId) {
      await db.collection('hardware').updateOne(
        { _id: new ObjectId(itemId) },
        { $set: { photoUrl: urlPath, updatedAt: new Date() } }
      );
    }

    // Geef volledige URL terug voor frontends die via file:// draaien
    const fullUrl = `http://localhost:${PORT}${urlPath}`;
    return res.json({ ok: true, url: fullUrl, path: urlPath, filename });
  } catch (e) {
    console.error('Upload error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Snelle health check
app.get('/api/ping', (req,res)=>res.json({ok:true, time:new Date().toISOString()}));
