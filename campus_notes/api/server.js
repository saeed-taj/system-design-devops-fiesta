const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB on the private network
// Note that 'mongo' is the service name defined in docker-compose
const MONGO_URI = process.env.MONGO_URI || 'mongodb://campus_mongo:27017/campus_notes';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Note Schema & Model
const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', noteSchema);

// Routes here
//  Get all notes
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } 
  
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Add a new note
app.post('/api/notes', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Note text is required' });
    
    const newNote = new Note({ text });
    await newNote.save();
    res.status(201).json(newNote);
  } 
  
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Stats endpoint (reports how many notes exist)
app.get('/api/stats', async (req, res) => {
  try {
    
    const count = await Note.countDocuments();
    res.json({ totalNotes: count });
  } 
  
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});