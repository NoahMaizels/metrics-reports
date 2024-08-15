const fs = require('fs');
const path = require('path');
const { table } = require('console');

// Load the JSON file
const dataPath = path.join(__dirname, 'readsi/rewards-july-2024.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Filter data for July 2024
const july2024Data = data.filter(entry => entry.Time.startsWith('2024-07'));

// Extract reward values
const rewardValues = july2024Data.map(entry => entry.Reward);

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

// Print the results in a table format
console.table([
    { Metric: 'Total Reward', Value: totalReward },
    { Metric: 'Mean Reward', Value: meanReward },
    { Metric: 'Median Reward', Value: medianReward }
]);
