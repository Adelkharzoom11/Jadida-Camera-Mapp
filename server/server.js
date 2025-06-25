const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection URI - عدل كلمة السر حسب بياناتك
const mongoURI = 'mongodb+srv://adeladel963963:adeladel963963@cluster0.2yf004q.mongodb.net/pointsDB?retryWrites=true&w=majority&appName=Cluster0';

console.log('📌 Trying to connect to MongoDB with URI:', mongoURI);

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

mongoose.connection.on('error', err => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.once('open', () => {
  console.log('✅ Mongoose connection is open and ready');
});

// Schema and Model
const pointSchema = new mongoose.Schema({
  Latitude: { type: Number, required: true },
  Longitude: { type: Number, required: true },
  Color: { type: String, required: true },
  Note: { type: String, default: '' }
}, { timestamps: true });

const Point = mongoose.model('Point', pointSchema);

// GET all points
app.get('/api/locations', async (req, res) => {
  try {
    const points = await Point.find();
    res.json(points);
  } catch (err) {
    console.error('❌ Error fetching points:', err);
    res.status(500).json({ error: 'Failed to fetch points', details: err.message });
  }
});

// POST new point
app.post('/api/locations', async (req, res) => {
  const { Latitude, Longitude, Color, Note } = req.body;

  if (Latitude == null || Longitude == null || !Color) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newPoint = new Point({
      Latitude,
      Longitude,
      Color,
      Note: Note || ''
    });

    await newPoint.save();
    res.json(newPoint);
  } catch (err) {
    console.error('❌ Error saving point:', err);
    res.status(500).json({ error: 'Failed to save point', details: err.message });
  }
});

// PUT update point color
app.put('/api/locations', async (req, res) => {
  const { id, Color, Note } = req.body;
  try {
    await Location.findByIdAndUpdate(id, {
      Color: Color,
      Note: Note  // ✅ تحديث الملاحظة أيضاً
    });
    res.json({ message: 'تم تحديث اللون والملاحظة.' });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء التحديث.' });
  }
});


// DELETE point
app.delete('/api/locations', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  try {
    const deletedPoint = await Point.findByIdAndDelete(id);
    if (!deletedPoint) {
      return res.status(404).json({ error: 'Point not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting point:', err);
    res.status(500).json({ error: 'Failed to delete point', details: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});



// const express = require('express');
// const fs = require('fs');
// const path = require('path');
// const bodyParser = require('body-parser');
// const cors = require('cors');

// const app = express();
// const PORT = process.env.PORT || 3000;
// const DATA_FILE = path.join(__dirname, 'points.json');

// app.use(cors());
// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, '../public')));

// function loadPoints() {
//   try {
//     return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
//   } catch {
//     return [];
//   }
// }

// function savePoints(points) {
//   fs.writeFileSync(DATA_FILE, JSON.stringify(points,null,2));
// }

// // GET - استرجاع كل النقاط
// app.get('/api/locations', (req, res) => {
//   const points = loadPoints();
//   res.json(points);
// });

// // POST - إضافة نقطة جديدة
// app.post('/api/locations', (req, res) => {
//   const { Latitude, Longitude, Color } = req.body;
//   if (!Latitude || !Longitude || !Color) {
//     return res.status(400).json({ error: 'Missing fields' });
//   }

//   const points = loadPoints();
//   const newPoint = {
//     id: Date.now(),
//     Latitude,
//     Longitude,
//     Color
//   };
//   points.push(newPoint);
//   savePoints(points);
//   res.json(newPoint);
// });

// // PUT - تحديث لون نقطة
// app.put('/api/locations', (req, res) => {
//   const { id, Color } = req.body;
//   if (!id || !Color) {
//     return res.status(400).json({ error: 'Missing fields' });
//   }

//   const points = loadPoints();
//   const index = points.findIndex(p => p.id === id);
//   if (index === -1) {
//     return res.status(404).json({ error: 'Not found' });
//   }

//   points[index].Color = Color;
//   savePoints(points);
//   res.json({ success: true });
// });

// // DELETE - حذف نقطة
// app.delete('/api/locations', (req, res) => {
//   const { id } = req.body;
//   if (!id) {
//     return res.status(400).json({ error: 'Missing id' });
//   }

//   let points = loadPoints();
//   const before = points.length;
//   points = points.filter(p => p.id !== id);
//   if (before === points.length) {
//     return res.status(404).json({ error: 'Not found' });
//   }

//   savePoints(points);
//   res.json({ success: true });
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server is running at http://localhost:${PORT}`);
// });
