const express = require('express');
const fetch = require('node-fetch');
const app = express();

const API_URL = process.env.API_URL || 'http://api:3000/api/stats';

app.get('/', async (req, res) => {
  try {
    
    // Calls the API, never Mongo directly!
    
    const response = await fetch(API_URL);
    const data = await response.json();
    
    res.send(`<h1>CampusNotes Statistics</h1><p>Total Notes in Database: <b>${data.totalNotes}</b></p><p><a href="/">Refresh</a></p>`);
  } 
  
  catch (err) {
    res.status(500).send(`Error fetching stats from API: ${err.message}`);
  }
});

app.listen(3001, () => {
  console.log('Stats service running on port 3001');
});