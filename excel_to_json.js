const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Define the directories
const excelDir = 'data_excel';
const jsonDir = 'data_json';

// Create the JSON directory if it doesn't exist
if (!fs.existsSync(jsonDir)) {
  fs.mkdirSync(jsonDir);
}

// Read all files in the Excel directory
fs.readdir(excelDir, (err, files) => {
  if (err) {
    return console.error('Unable to scan directory:', err);
  }

  // Process each file in the directory
  files.forEach((file) => {
    const excelFilePath = path.join(excelDir, file);

    // Check if the file has an Excel extension
    if (path.extname(file) === '.xlsx' || path.extname(file) === '.xls') {
      // Read the Excel file
      const workbook = xlsx.readFile(excelFilePath);

      // Convert each sheet to JSON and save
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: null, blankrows: false });
        const jsonFilePath = path.join(jsonDir, `${path.basename(file, path.extname(file))}_${sheetName}.json`);

        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
        console.log(`File ${file}, sheet ${sheetName} has been converted to JSON.`);
      });
    }
  });
});
