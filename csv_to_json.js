const csv = require('csvtojson');
const fs = require('fs');
const path = require('path');

// Define the paths to the directories
const csvDir = 'data_csv';
const jsonDir = 'data_json';

// Create the JSON directory if it doesn't exist
if (!fs.existsSync(jsonDir)){
  fs.mkdirSync(jsonDir);
}

// Read all files in the CSV directory
fs.readdir(csvDir, (err, files) => {
  if (err) {
    return console.error('Unable to scan directory:', err);
  }

  // Process each file in the directory
  files.forEach((file) => {
    const csvFilePath = path.join(csvDir, file);
    const jsonFilePath = path.join(jsonDir, file.replace('.csv', '.json'));

    // Check if the file has a .csv extension
    if (path.extname(file) === '.csv') {
      csv()
        .fromFile(csvFilePath)
        .then((jsonObj) => {
          fs.writeFileSync(jsonFilePath, JSON.stringify(jsonObj, null, 2));
          console.log(`CSV file ${file} has been converted to JSON.`);
        })
        .catch((error) => {
          console.error(`Error converting ${file} to JSON:`, error);
        });
    }
  });
});
