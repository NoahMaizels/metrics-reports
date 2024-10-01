const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Map of month numbers to month names for matching
const monthMap = {
    1: 'january',
    2: 'february',
    3: 'march',
    4: 'april',
    5: 'may',
    6: 'june',
    7: 'july',
    8: 'august',
    9: 'september',
    10: 'october',
    11: 'november',
    12: 'december'
};

// Function to convert all keys of an object to lowercase
function convertKeysToLowercase(obj) {
    return Object.keys(obj).reduce((acc, key) => {
        acc[key.toLowerCase()] = obj[key];
        return acc;
    }, {});
}

// Function to prompt user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Prompt for month and year input
rl.question('Please enter a month (1-12): ', (monthInput) => {
    const month = parseInt(monthInput, 10);
    rl.question('Please enter a year (4 digits): ', (yearInput) => {
        const year = parseInt(yearInput, 10);

        // Scan /readsi directory for JSON files
        const dirPath = path.join(__dirname, 'readsi');
        const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.json'));

        // List files with numbers for selection
        console.log('\nAvailable JSON files:');
        files.forEach((file, index) => {
            console.log(`${index + 1}. ${file}`);
        });

        rl.question('\nPlease select a file by number: ', (fileIndexInput) => {
            const fileIndex = parseInt(fileIndexInput, 10) - 1;
            const selectedFile = files[fileIndex];

            // Get the month name from the monthMap
            const monthName = monthMap[month].toLowerCase();

            // Debug: Log selected file, month, and year
            console.log(`Selected file: ${selectedFile}`);
            console.log(`Month name (from user input): ${monthName}`);
            console.log(`Year (from user input): ${year}`);

            // Validate if the file contains the selected month name and year (case insensitive)
            if (!selectedFile.toLowerCase().includes(`${year}`) || !selectedFile.toLowerCase().includes(monthName)) {
                console.error('The selected file does not match the input month or year. Exiting.');
                rl.close();
                return;
            }

            // Proceed with file processing if it matches
            const dataPath = path.join(dirPath, selectedFile);
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

            // Convert each entry's keys to lowercase to handle legacy data with uppercase keys
            const convertedData = data.map(convertKeysToLowercase);

            // Debug: Log the total number of entries in the JSON file
            console.log(`Total number of entries in the JSON file: ${convertedData.length}`);

            // Filter data for selected month and year
            const filteredData = convertedData.filter(entry => {
                return entry.time && entry.time.startsWith(`${year}-${month.toString().padStart(2, '0')}`);
            });

            // Debug: Log the number of entries after filtering
            console.log(`Number of entries after filtering for month and year: ${filteredData.length}`);

            // Extract reward values and unique overlays
            const rewardValues = filteredData.map(entry => entry.reward);
            const uniqueOverlays = new Set(filteredData.map(entry => entry.overlay));

            // Calculate sum
            const totalReward = rewardValues.reduce((acc, reward) => acc + reward, 0);

            // Calculate mean (average)
            const meanReward = totalReward / rewardValues.length;

            // Calculate median
            rewardValues.sort((a, b) => a - b);
            let medianReward;
            const middleIndex = Math.floor(rewardValues.length / 2);

            if (rewardValues.length % 2 === 0) {
                medianReward = (rewardValues[middleIndex - 1] + rewardValues[middleIndex]) / 2;
            } else {
                medianReward = rewardValues[middleIndex];
            }

            // Count unique overlays with rewards
            const uniqueOverlayCount = uniqueOverlays.size;

            // Print the results in a table format
            console.table([
                { Metric: 'Total Reward', Value: totalReward },
                { Metric: 'Mean Reward', Value: meanReward },
                { Metric: 'Median Reward', Value: medianReward },
                { Metric: 'Unique Overlays with Rewards', Value: uniqueOverlayCount }
            ]);

            rl.close();
        });
    });
});
