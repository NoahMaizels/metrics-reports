const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const readline = require('readline');
const { promisify } = require('util');
const ProgressBar = require('progress');
const pipeline = promisify(require('stream').pipeline);

// Setup readline for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask user for input and validate it
const askUserInput = () => {
  return new Promise((resolve, reject) => {
    rl.question('Enter the year (e.g., 2024): ', (year) => {
      rl.question('Enter the month (1-12): ', (month) => {
        // Validate input
        const yearInt = parseInt(year, 10);
        const monthInt = parseInt(month, 10);

        if (yearInt >= 2020 && yearInt <= new Date().getFullYear() && monthInt >= 1 && monthInt <= 12) {
          resolve({ year: yearInt, month: monthInt });
        } else {
          console.error('Invalid year or month. Please enter values in the correct range.');
          reject();
        }
      });
    });
  });
};

// Function to format bytes to megabytes
const formatBytesToMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

// Function to create directory if it does not exist
const ensureDirectoryExists = (dirPath) => {
  return fs.promises.mkdir(dirPath, { recursive: true });
};

// Function to check if a directory is empty
const isDirectoryEmpty = async (dirPath) => {
  const files = await fs.promises.readdir(dirPath);
  return files.length === 0;
};

// Function to delete all files in a directory
const deleteFilesInDirectory = async (dirPath) => {
  const files = await fs.promises.readdir(dirPath);
  await Promise.all(files.map(file => fs.promises.unlink(path.join(dirPath, file))));
};

// Function to ask user if they want to overwrite existing data
const askOverwriteConfirmation = async (dirPath) => {
  return new Promise((resolve) => {
    rl.question(`The directory ${dirPath} is not empty. Do you want to delete existing files and continue? (yes/no): `, (answer) => {
      const response = answer.trim().toLowerCase();
      resolve(response === 'yes' || response === 'y');
    });
  });
};

// Function to download a file from a URL with progress
const downloadFile = (url, filePath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const totalBytes = parseInt(response.headers['content-length'], 10);
        let downloadedBytes = 0;

        const bar = new ProgressBar(':bar :speed MB/s', {
          total: totalBytes,
          width: 40,
          complete: '=',
          incomplete: ' ',
          renderThrottle: 100,
        });

        const startTime = Date.now();

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
          const speed = (downloadedBytes / (1024 * 1024)) / elapsedTime; // MB/s

          bar.tick(chunk.length, {
            speed: speed.toFixed(2)
          });
        });

        pipeline(response, fs.createWriteStream(filePath))
          .then(() => {
            console.log('\nDownload completed.');
            resolve();
          })
          .catch(reject);
      } else {
        reject(new Error(`Failed to get file from URL: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
};

// Function to decompress .gz files to .json
const decompressFile = (sourcePath, destPath) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(sourcePath)
      .pipe(zlib.createGunzip())
      .pipe(fs.createWriteStream(destPath))
      .on('finish', resolve)
      .on('error', reject);
  });
};

// Function to delete a file
const deleteFile = (filePath) => {
  return fs.promises.unlink(filePath);
};

// Main function
const main = async () => {
  try {
    const { year, month } = await askUserInput();
    
    const dirPath = path.join('network', 'dumps', `${year}`, `${String(month).padStart(2, '0')}`);
    await ensureDirectoryExists(dirPath);

    if (!(await isDirectoryEmpty(dirPath))) {
      const overwrite = await askOverwriteConfirmation(dirPath);
      if (overwrite) {
        console.log(`Deleting existing files in ${dirPath}`);
        await deleteFilesInDirectory(dirPath);
      } else {
        console.log('Exiting script.');
        rl.close();
        return;
      }
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      for (let hour = 0; hour < 24; hour += 12) {
        const fileName = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}-${String(hour).padStart(2, '0')}.json.gz`;
        const fileUrl = `https://swarmscan.sos-ch-dk-2.exo.io/network/dumps/${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${fileName}`;
        const filePath = path.join(dirPath, fileName);
        const jsonFilePath = path.join(dirPath, `${fileName.replace('.gz', '')}`);
        
        console.log(`Downloading file: ${fileName}`);
        await downloadFile(fileUrl, filePath);
        
        console.log(`Decompressing file: ${fileName}`);
        await decompressFile(filePath, jsonFilePath);

        console.log(`Deleting compressed file: ${fileName}`);
        await deleteFile(filePath);
      }
    }

    rl.close();
  } catch (error) {
    console.error(error.message);
    rl.close();
  }
};

main();
