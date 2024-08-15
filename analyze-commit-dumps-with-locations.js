const fs = require('fs');
const JSONStream = require('jsonstream');
const Table = require('cli-table3');

// Create a map to store unique overlays by country
const countryOverlayMap = {};

// Create a final map for aggregated results
const resultMap = {
    'Other': new Set(),
    'Unknown': new Set()
};

// Date range for July 2024 (start and end timestamps)
const julyStart = new Date('2024-07-01T00:00:00Z').getTime();
const julyEnd = new Date('2024-07-31T23:59:59Z').getTime();

// Variable to keep track of the total number of nodes
let totalNodes = 0;

// Variable to count the number of times a warning occurs
let warningCount = 0;

// Stream the JSON file
fs.createReadStream('swarmscan/committed-events.json')
    .pipe(JSONStream.parse('events.*'))
    .on('data', (event) => {
        // Ensure event has a blockTime and falls within July 2024
        if (event.blockTime) {
            const eventTimestamp = new Date(event.blockTime).getTime();
            if (eventTimestamp >= julyStart && eventTimestamp <= julyEnd) {
                if (event.node && event.node.overlay) {
                    const overlay = event.node.overlay;
                    const country = event.node.location && event.node.location.country ? event.node.location.country : 'Unknown';

                    if (!countryOverlayMap[country]) {
                        countryOverlayMap[country] = new Set();
                    }

                    if (!countryOverlayMap[country].has(overlay)) {
                        totalNodes++; // Increment the total node count for each unique overlay
                        countryOverlayMap[country].add(overlay);
                    }
                } else {
                    // Increment the warning counter and log the warning
                    warningCount++;
                    console.warn('Warning: Event missing node or overlay:', event);
                }
            }
        }
    })
    .on('end', () => {
        // Sort countries by the size of their overlay set in descending order
        const sortedCountries = Object.keys(countryOverlayMap)
            .filter(country => country !== 'Unknown')
            .sort((a, b) => countryOverlayMap[b].size - countryOverlayMap[a].size);

        // Add top 5 countries to the resultMap
        sortedCountries.slice(0, 5).forEach(country => {
            resultMap[country] = countryOverlayMap[country];
        });

        // Aggregate remaining countries into 'Other'
        sortedCountries.slice(5).forEach(country => {
            countryOverlayMap[country].forEach(overlay => resultMap['Other'].add(overlay));
        });

        // Include 'Unknown' in the resultMap if it exists
        if (countryOverlayMap['Unknown']) {
            resultMap['Unknown'] = countryOverlayMap['Unknown'];
        }

        // Create a table with column headers
        const table = new Table({
            head: ['Country', 'Unique Overlays'],
            colWidths: [30, 20]
        });

        Object.keys(resultMap).forEach(country => {
            table.push([country, resultMap[country].size]);
        });

        console.log('Country-wise Unique Overlays Summary:');
        console.log('-------------------------------------');
        console.log(table.toString());

        // Print the sum total number of nodes included in the results
        console.log(`\nTotal number of unique nodes included in the results: ${totalNodes}`);

        // Print the total number of warnings
        console.log(`\nTotal number of events missing node or overlay: ${warningCount}`);
    })
    .on('error', (err) => {
        console.error('Error parsing JSON:', err);
    });
