const fs = require('fs');
const path = require('path');
const readline = require('readline');
const cliProgress = require('cli-progress');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptUser(question) {
    return new Promise(resolve => rl.question(question, answer => resolve(answer)));
}

async function analyzeDumps() {
    try {
        // Ask user for year and month
        const year = await promptUser('Enter year (e.g., 2024): ');
        let month = await promptUser('Enter month (e.g., 7 for July): ');

        // Normalize month to two digits
        month = month.padStart(2, '0');

        // Set folder path
        const folderPath = path.join('C:', 'Users', 'noahm', 'Documents', 'metrics-reports', 'network', 'dumps', year, month);

        // Check if the folder exists
        if (!fs.existsSync(folderPath)) {
            console.log('The specified folder does not exist.');
            process.exit(1);
        }

        // Get list of files in the folder
        const files = fs.readdirSync(folderPath).filter(file => path.extname(file) === '.json');

        // Initialize a set to store unique overlays
        const uniqueOverlays = new Set();

        // Initialize the progress bar
        const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        progressBar.start(files.length, 0);

        // Analyze each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filePath = path.join(folderPath, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            // Extract overlays from each file and add to set
            data.nodes.forEach(node => {
                if (node.overlay) {
                    uniqueOverlays.add(node.overlay);
                }
            });

            // Update the progress bar
            progressBar.update(i + 1);
        }

        // Stop the progress bar
        progressBar.stop();

        // Output the number of unique overlays
        console.log(`Number of unique overlays: ${uniqueOverlays.size}`);
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        rl.close();
    }
}

// Run the analysis
analyzeDumps();
