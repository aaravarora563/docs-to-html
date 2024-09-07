const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const app = express();
const port = 3000;

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve the HTML page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>File Converter</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f9;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
                .container {
                    max-width: 600px;
                    width: 100%;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333;
                    text-align: center;
                }
                form {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                input[type="file"],
                select,
                button {
                    padding: 10px;
                    font-size: 16px;
                }
                button {
                    background-color: #007bff;
                    color: white;
                    border: none;
                    cursor: pointer;
                    border-radius: 4px;
                }
                button:hover {
                    background-color: #0056b3;
                }
                #result {
                    margin-top: 20px;
                    padding: 10px;
                    background: #e9ecef;
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>File Converter</h1>
                <form id="uploadForm" enctype="multipart/form-data">
                    <input type="file" name="document" required />
                    <select name="format">
                        <option value="html">HTML</option>
                    </select>
                    <button type="submit">Convert</button>
                </form>
                <div id="result"></div>
                <script>
                    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const response = await fetch('/convert', {
                            method: 'POST',
                            body: formData
                        });
                        const result = await response.text();
                        document.getElementById('result').innerHTML = result;
                    });
                </script>
            </div>
        </body>
        </html>
    `);
});

// Handle file conversion
app.post('/convert', upload.single('document'), async (req, res) => {
    try {
        const { file, body } = req;

        if (!file || !body.format) {
            return res.status(400).send('No file or format specified');
        }

        let content = '';

        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            content = await parseDocx(file.path);
        } else if (file.mimetype === 'application/pdf') {
            content = await parsePdf(file.path);
        } else {
            return res.status(400).send('Unsupported file type');
        }

        const convertedContent = convertToHtml(content, body.format);
        res.send(convertedContent);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
    } finally {
        fs.unlinkSync(req.file.path);
    }
});

// Parse DOCX files to plain text
async function parseDocx(filePath) {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}

// Parse PDF files to plain text
async function parsePdf(filePath) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
}

// Convert content to HTML format
function convertToHtml(content, format) {
    if (format === 'html') {
        return `<html><body><pre>${content}</pre></body></html>`;
    }
    return content;
}

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
