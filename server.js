const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Determine static root directory (hacathon if present, else current dir)
const staticDir = fs.existsSync(path.join(__dirname, 'hacathon')) 
    ? path.join(__dirname, 'hacathon') 
    : __dirname;

app.use(express.static(staticDir));
app.use(express.static(__dirname));

// Serve index.html for all routes (Single Page Application support)
app.get('*', (req, res) => {
    if (fs.existsSync(path.join(staticDir, 'index.html'))) {
        res.sendFile(path.join(staticDir, 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`DriveSetu Production Server running on port ${PORT}`);
});
