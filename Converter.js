const fs = require('fs');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

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
    // Add more formats as needed
    return content;
}

module.exports = { parseDocx, parsePdf, convertToHtml }; 
