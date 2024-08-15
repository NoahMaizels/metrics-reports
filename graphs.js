const puppeteer = require('puppeteer');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

EventEmitter.defaultMaxListeners = 20;  // Or some other number greater than your current max.

const graphsDir = './graphs';

// Ensure the graphs directory exists
if (!fs.existsSync(graphsDir)) {
    fs.mkdirSync(graphsDir);
}

async function generateLineChart(data) {
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

    const highlightIndex = data.months.indexOf('July');
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

    const chart = await page.$('#plotly-div');
    const outputFilePath = path.join(graphsDir, `chart-${data.title.replace(/\s+/g, '-')}.png`);
    await chart.screenshot({ path: outputFilePath });

    await browser.close();
}

const months = ["February", "March", "April", "May", "June", "July"];

const lineDatasets = [
    {
        title: "Total Network Monthly Rewards",
        values: [152974, 104657, 76024, 109209, 112037, 105855],
        months: months
    },
    {
        title: "Monthly Median Win Values",
        values: [49.15, 27.43, 22.27, 32.65, 33.92, 33.67],
        months: months
    },
    {
        title: "Monthly Average Win Values",
        values: [54.42, 34.96, 25.43, 36.56, 37.07, 36.05],
        months: months
    },
    {
        title: "Avg Total Earnings per Node",
        values: [13.21, 7.71, 5.64, 10.66, 9.37, 8.22],
        months: months
    },
    {
        title: "Total Active Staking Nodes",
        values: [11576, 13571, 13486, 10245, 11950, 12871],
        months: months
    },
    {
        title: "Number of Winning Staking Nodes by Month",
        values: [2814, 2413, 2486, 2554, 2680, 2622],
        months: months
    }
];

lineDatasets.forEach(dataset => {
    generateLineChart(dataset).then(() => {
        console.log(`Line chart for ${dataset.title} generated successfully!`);
    }).catch(error => {
        console.error(`Error generating line chart for ${dataset.title}:`, error);
    });
});
