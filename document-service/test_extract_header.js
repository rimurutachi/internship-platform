const fs = require('fs');
const JSZip = require('jszip');
const mammoth = require('mammoth');
const path = require('path');

async function testExtraction() {
    try {
        const docxPath = path.join(__dirname, '..', '..', 'Student-Internship-MOA-CvSU Bacoor-CS Group-and-Individual (1).docx');
        if (!fs.existsSync(docxPath)) {
            console.log("File not found, searching Desktop...");
            return;
        }

        const data = fs.readFileSync(docxPath);
        const zip = await JSZip.loadAsync(data);
        
        let headerXml = zip.file("word/header1.xml");
        if (headerXml) {
            console.log("Found header1.xml");
            const headerContent = await headerXml.async("string");
            
            // Swap document.xml with header1.xml
            zip.file("word/document.xml", headerContent);
            
            // Also need to swap the rels if we want images to work, but let's see if it parses text first.
            const newZipBuffer = await zip.generateAsync({type: "nodebuffer"});
            
            const result = await mammoth.convertToHtml({ buffer: newZipBuffer });
            console.log("HEADER HTML:", result.value);
        } else {
            console.log("No header1.xml found");
        }
        
    } catch (e) {
        console.error(e);
    }
}

testExtraction();
