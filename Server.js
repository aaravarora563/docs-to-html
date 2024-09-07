const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { parseDocx, parsePdf, convertToHtml } = require('./converter');

const app = express();
const port = 3000;

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files from the root directory
app.use(express.static('.'));

// Handle file conversion
app.post('/convert', upload.single('document'), async (req, res) => {
    try {
        const { file, body } = req;

        // Check if file and format are provided
        if (!file || !body.format) {
            return res.status(400).send('No file or format specified');
        }

        let content = '';

        // Process different file types
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            content = await parseDocx(file.path);
        } else if (file.mimetype === 'application/pdf') {
            content = await parsePdf(file.path);
        } else {
            return res.status(400).send('Unsupported file type');
        }

        // Convert content to desired format
        const convertedContent = convertToHtml(content, body.format);

        // Send converted content as response
        res.send(convertedContent);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
    } finally {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
