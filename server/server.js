



const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'points.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

function loadPoints() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function savePoints(points) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(points,null,2));
}

// GET - استرجاع كل النقاط
app.get('/api/locations', (req, res) => {
  const points = loadPoints();
  res.json(points);
});

// POST - إضافة نقطة جديدة
app.post('/api/locations', (req, res) => {
  const { Latitude, Longitude, Color } = req.body;
  if (!Latitude || !Longitude || !Color) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const points = loadPoints();
  const newPoint = {
    id: Date.now(),
    Latitude,
    Longitude,
    Color
  };
  points.push(newPoint);
  savePoints(points);
  res.json(newPoint);
});

// PUT - تحديث لون نقطة
app.put('/api/locations', (req, res) => {
  const { id, Color } = req.body;
  if (!id || !Color) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const points = loadPoints();
  const index = points.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Not found' });
  }

  points[index].Color = Color;
  savePoints(points);
  res.json({ success: true });
});

// DELETE - حذف نقطة
app.delete('/api/locations', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  let points = loadPoints();
  const before = points.length;
  points = points.filter(p => p.id !== id);
  if (before === points.length) {
    return res.status(404).json({ error: 'Not found' });
  }

  savePoints(points);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
