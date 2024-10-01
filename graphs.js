const puppeteer = require('puppeteer');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

EventEmitter.defaultMaxListeners = 20;  // Or some other number greater than your current max.

const graphsDir = './graphs';

// Ensure the graphs directory exists
if (!fs.existsSync(graphsDir)) {
    fs.mkdirSync(graphsDir);
}

// Function to prompt user input for year and month
function askUserInput(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// Map number to month name
function getMonthName(monthNumber) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthNumber - 1];  // Convert 1-based index to 0-based
}

async function generateLineChart(data, inputMonth, inputYear) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const yAxisLabels = {
        "Total Network Monthly Rewards": "BZZ",
        "Monthly Median Win Values": "BZZ / Win Event",
        "Monthly Average Win Values": "BZZ / Win Event",
        "Number of Staking Nodes by Month": "Unique Staking Nodes",
        "Total Active Nodes by Month": "Total Active Nodes",
        "Avg Total Earnings per Node": "BZZ"
    };

    const yLabel = yAxisLabels[data.title];

    // Convert user input month number to month name
    const monthName = getMonthName(parseInt(inputMonth));

    // Dynamically highlight the user input month
    const highlightIndex = data.months.indexOf(monthName);

    const traces = [{
        x: data.months,
        y: data.values,
        type: 'scatter',
        mode: 'lines+markers',
        marker: {
            size: 10,
            color: '#FFA500' // Standard Orange for markers
        },
        line: {
            color: '#FF8C00' // Dark Orange for lines
        },
        showlegend: false
    }];

    // Highlight the specified month if found
    if (highlightIndex !== -1 && highlightIndex > 0) {
        traces.push({
            x: data.months.slice(highlightIndex - 1, highlightIndex + 1),
            y: data.values.slice(highlightIndex - 1, highlightIndex + 1),
            type: 'scatter',
            mode: 'lines',
            fill: 'tozeroy',
            fillcolor: 'rgba(255,165,0,0.2)', // Light Orange for fill
            line: {
                color: '#FFA500' // Standard Orange
            },
            showlegend: false
        });
    }

    await page.setContent(`
        <html>
            <head>
                <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            </head>
            <body>
                <div id="plotly-div" style="width: 100%; height: 500px;"></div>
                <script>
                    const traces = ${JSON.stringify(traces)};
                    
                    Plotly.newPlot('plotly-div', traces, {
                        title: '${data.title}',
                        xaxis: {
                            title: 'Month',
                            color: '#333333' // Dark color for text
                        },
                        yaxis: {
                            title: '${yLabel}',
                            color: '#333333' // Dark color for text
                        },
                        paper_bgcolor: 'white', // Light background color
                        plot_bgcolor: 'white', // Light background color
                        font: {
                            color: '#333333' // Dark color for text
                        },
                        showlegend: false
                    });
                </script>
            </body>
        </html>
    `);

    await page.waitForSelector('#plotly-div .plot');

    // Create the filename using the month name and year
    const outputFilePath = path.join(
        graphsDir, 
        `chart-${data.title.replace(/\s+/g, '-')}-${monthName}-${inputYear}.png`
    );

    const chart = await page.$('#plotly-div');
    await chart.screenshot({ path: outputFilePath });

    await browser.close();
}

async function main() {
    // Ask user for year and month input
    const inputYear = await askUserInput('Enter the year (e.g., 2024): ');
    const inputMonth = await askUserInput('Enter the month as a number (e.g., 8 for August): ');

    const months = ["March", "April", "May", "June", "July", "August"];

    const lineDatasets = [
        {
            title: "Total Network Monthly Rewards",
            values: [104657, 76024, 109209, 112037, 105855, 62093],
            months: months
        },
        {
            title: "Monthly Median Win Values",
            values: [27.43, 22.27, 32.65, 33.92, 33.67, 12.48],
            months: months
        },
        {
            title: "Monthly Average Win Values",
            values: [34.96, 25.43, 36.56, 37.07, 36.05, 19.44],
            months: months
        },
        {
            title: "Avg Total Earnings per Node",
            values: [7.71, 5.64, 10.66, 9.37, 8.22, 8.27],
            months: months
        },
        {
            title: "Total Active Staking Nodes",
            values: [13571, 13486, 10245, 11950, 12871, 7506],
            months: months
        },
        {
            title: "Number of Winning Staking Nodes by Month",
            values: [2413, 2486, 2554, 2680, 2622, 2769],
            months: months
        }
    ];

    // Generate charts using the user-provided year and month
    lineDatasets.forEach(dataset => {
        generateLineChart(dataset, inputMonth, inputYear).then(() => {
            console.log(`Line chart for ${dataset.title} generated successfully!`);
        }).catch(error => {
            console.error(`Error generating line chart for ${dataset.title}:`, error);
        });
    });
}

// Run the main function
main();
