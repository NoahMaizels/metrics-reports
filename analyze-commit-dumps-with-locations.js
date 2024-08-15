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

// Stream the JSON file
fs.createReadStream('swarmscan/swarmscan-events-redistribution-committed-2024-08-15-03-24-47.json')
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
                    console.warn('Warning: Event missing node or overlay:', event);
                }
            }
        }
    })
    .on('end', () => {
        Object.keys(countryOverlayMap).forEach(country => {
            if (country !== 'Unknown') {
                const overlaySet = countryOverlayMap[country];
                if (overlaySet.size >= 100) {
                    resultMap[country] = overlaySet;
                } else {
                    overlaySet.forEach(overlay => resultMap['Other'].add(overlay));
                }
            } else {
                resultMap['Unknown'] = countryOverlayMap['Unknown'];
            }
        });

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
    })
    .on('error', (err) => {
        console.error('Error parsing JSON:', err);
    });
