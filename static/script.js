// Pass the group of data requested and returns it
async function fetchDataGroup(group)    {
    try{
        const response = await fetch(`/api/data?group=${group}`);
        const data = await response.json();
        return(data.data);
    }   catch(error)    {
        console.log(`Error fetching ${group} data:`, error);
    }
}

/* To resolve
    : - Where 'getSelectedData' and 'updateCurrentValues' come into the picture when loading pages
    : - Dead function
*/
async function showMotorCurrents() {
        // :Truncate from here onwards and return data.data
        // Update the current values with the selected data
        const selectedData = getSelectedData();
        // Latest values of each data point displayed in some lines
        updateCurrentValues(selectedData);
}

/* To resolve
    : - Where 'getSelectedData' and 'updateCycleCountValues' come into the picture when loading pages
    : - Dead function
*/ 
async function showCycleCounts()    {
    // Update the current values with the selected data
    const selectedData = getSelectedData();
    updateCycleCountValues(selectedData);
}

// -- Chart functions --
// C: Creates ??datasets??
function createDatasets(data, motors, colors) {
    console.log('All data:', data);

    const datasets = [];

    motors.forEach((motor, index) => {
        // Filter data for the current motor
        const motorData = data.filter(row => {
            const isMotor = isMotorNodeKey(row.NodeKey, motor);
            console.log(`Checking NodeKey ${row.NodeKey} for Motor ${motor}: ${isMotor}`);
            return isMotor;
        });

        console.log(`Filtered data for ${motor}:`, motorData);

        if (motorData.length > 0) {
            datasets.push({
                label: `Motor ${motor}`,
                borderColor: colors[index],
                data: motorData.map(row => row.Value),
            });
        } else {
            console.log(`No data found for ${motor}.`);
        }
    });

    console.log('Final datasets:', datasets);

    return datasets;
}

// Function to update the line chart with data
function createLineChart(canvasId, labels, datasets, chartTitle) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    // Find the existing instance of the chart with the same canvas ID
    const existingChart = Chart.getChart(ctx);

    // Destroy the existing chart with the same canvas ID
    if (existingChart) {
        existingChart.destroy();
    }

    // Create line chart with datasets and animation
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets.filter(dataset => dataset !== null), // Filter out null datasets
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        color: 'white', // Set x-axis label color
                    },
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    ticks: {
                        color: 'white', // Set y-axis label color
                    },
                },
            },
            animation: {
                duration: 400, // Set the duration of the animation in milliseconds
                easing: 'easeInOutQuad', // Set the easing function for the animation
            },
            plugins: {
                title: {
                    display: true,
                    text: chartTitle, // Update title here
                    color: '#fff', // Set title text color
                    font: {
                        size: 22, // Set the font size for the title
                    },
                },
                legend: {
                    labels: {
                        color: '#fff', // Set legend text color
                    },
                },
            },
        },
    });
}

// Function that destroys current chart and creates a new one
function updateLineChart(data, chartId, chartTitle) {
    // Get the canvas element
    const canvas = document.getElementById(chartId);
    const ctx = canvas.getContext('2d');

    // Find the existing instance of the chart with the same canvas ID
    const existingChart = Chart.getChart(ctx);

    // Destroy the existing chart with the same canvas ID
    if (existingChart) {
        existingChart.destroy();
    }

    // Check if data is defined and has a valid length
    if (data && data.length > 0) {
        // Extract data for the chart
        const labels = Array.from({ length: data.length }, (_, i) => i + 1); // Sequential x-axis values

        // Create datasets based on the selected motors
        const datasets = [];

        // Define motor selection
        const motorSelection = {
            X: document.getElementById('buttonX').classList.contains('selected-button'),
            Y: document.getElementById('buttonY').classList.contains('selected-button'),
            Z: document.getElementById('buttonZ').classList.contains('selected-button'),
            Spindle: document.getElementById('buttonSpindle').classList.contains('selected-button'),
        };

        // Example: Group into X, Y, Z, and Spindle motors based on selection
        const groupedData = {
            X: motorSelection.X ? data.filter(row => [2, 6, 7, 9, 12, 15, 18, 21, 30, 33, 36, 39].includes(row.NodeKey)) : [],
            Y: motorSelection.Y ? data.filter(row => [1, 3, 10, 13, 16, 19, 22, 31, 34, 37, 40, 42].includes(row.NodeKey)) : [],
            Z: motorSelection.Z ? data.filter(row => [4, 5, 8, 11, 14, 17, 20, 23, 32, 35, 38, 41].includes(row.NodeKey)) : [],
            Spindle: motorSelection.Spindle ? data.filter(row => [24, 25, 26, 27, 28, 29, 43, 44, 45].includes(row.NodeKey)) : [],
        };

        // Create a dataset for each selected motor
        const colors = {
            X: '#FFC3A0', // Soft green-blue
            Y: '#A0FFC3', // Soft orange
            Z: '#A0C3FF', // Soft lavender
            Spindle: '#e78ac3', // Soft pink
        };

        for (const motor in groupedData) {
            if (groupedData[motor].length > 0) {
                const values = groupedData[motor].map(row => row.Value);
                datasets.push({
                    label: `Motor ${motor}`,
                    borderColor: colors[motor],
                    data: values,
                });
            }
        }

        // Create line chart with datasets and animation
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        ticks: {
                            color: 'white', // Set x-axis label color
                        },
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        ticks: {
                            color: 'white', // Set y-axis label color
                        },
                    },
                },
                animation: {
                    duration: 400, // Set the duration of the animation in milliseconds
                    easing: 'easeInOutQuad', // Set the easing function for the animation
                },
                plugins: {
                    title: {
                        display: true,
                        text: chartTitle, // Update title here
                        color: '#fff', // Set title text color
                        font: {
                            size: 22, // Set the font size for the title
                        },
                    },
                    legend: {
                        labels: {
                            color: '#fff', // Set legend text color
                        },
                    },
                },
            },
        });

    } else {
        // If no data, clear the line chart
        clearLineChart(chartId);
    }
    // Clear existing gauges
    //clearGauges();

    // Extract speed values for motors X, Y, and Z
    const speedX = data.find(row => row.NodeKey === 36)?.Value || 0;
    const speedY = data.find(row => row.NodeKey === 37)?.Value || 0;
    const speedZ = data.find(row => row.NodeKey === 38)?.Value || 0;

    // Update or create speedometer gauges
    //updateSpeedometerGauges(speedX, speedY, speedZ);
}

// Function to clear the line chart
function clearLineChart(chartId) {
    // Get the canvas element
    const canvas = document.getElementById(chartId);
    const ctx = canvas.getContext('2d');

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// -- CSV functions --
// Function to convert data to CSV format
function convertToCSV(data) {
    const csv = [];
    const header = Object.keys(data[0]);
    csv.push(header.join(','));

    data.forEach(row => {
        const values = header.map(key => row[key]);
        csv.push(values.join(','));
    });

    return csv.join('\n');
}

// Function to trigger CSV download
function downloadCSV() {
    // Get the table data
    const table = document.getElementById('data-table');
    const rows = table.getElementsByTagName('tr');
    const data = [];

    // Iterate through rows and cells to collect data
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        const rowData = {};

        for (let j = 0; j < cells.length; j++) {
            const cell = cells[j];
            const header = table.rows[0].cells[j].innerText;
            rowData[header] = cell.innerText;
        }

        data.push(rowData);
    }

    // Convert data to CSV format
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(convertToCSV(data));

    // Create a hidden link element and trigger the download
    const link = document.createElement('a');
    link.href = csvContent;
    link.download = 'table_data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// -- Filtering Functions --
// Function to toggle motor selection
function toggleMotorSelection(data, chartId, chartTitle) {
    // Update the line chart with the selected data
    const selectedData = getSelectedData(data);
    // updateCurrentValues(selectedData);       <-
    // updateCycleCountValues(selectedData);    <- simplify and break up function so that it is applicable for all chart pages
    updateLineChart(selectedData, chartId, chartTitle);
}

// Function to get selected data based on button states
function getSelectedData(data) {
    const selectedMotors = ['X', 'Y', 'Z', 'Spindle'].filter(motor => {
        const button = document.getElementById(`button${motor}`);
        return button.classList.contains('selected-button');
    });

    // Filter data based on selected motors
    const selectedData = data.filter(row => {
        let nodeKeyInMotor;
        for (let i = 0; i < selectedMotors.length; i++)   {
            nodeKeyInMotor = isMotorNodeKey(row.NodeKey, selectedMotors[i]);
            if(nodeKeyInMotor)   {
                return true;
            }
        }
        return false;
        // return selectedMotors.some(motor => isMotorNodeKey(row.NodeKey, motor));
    });
    
    return selectedData;
}

function isMotorNodeKey(nodeKey, motor) {
    const motorMap = {
        X: [7, 2, 6, 39, 9, 12, 15, 18, 21, 30, 33, 36],
        Y: [1, 3, 40, 42, 10, 13, 16, 19, 22, 31, 34, 37],
        Z: [5, 4, 8, 41, 11, 14, 17, 20, 23, 32, 35, 38],
        Spindle: [24, 25, 26, 27, 28, 29, 43, 44, 45] // Include the node key for the 'Spindle' motor
    };

    // Check if motor is defined before accessing its properties
    if (motor in motorMap)   {
        // If the nodeKey is included in the associated motor list, return true. Otherwise, false.
        return motorMap[motor].includes(nodeKey);
    }

    return false;
}

// -- TBC --
function updateCurrentValues(data) {
    const currentValueX = globalData.data.find(row => row.NodeKey === 7)?.Value;
    const currentValueY = globalData.data.find(row => row.NodeKey === 1)?.Value;
    const currentValueZ = globalData.data.find(row => row.NodeKey === 5)?.Value;

    document.getElementById('currentX').querySelector('.current-value').innerText = currentValueX;
    document.getElementById('currentY').querySelector('.current-value').innerText = currentValueY;
    document.getElementById('currentZ').querySelector('.current-value').innerText = currentValueZ;
}

// C: This thing also doesn't work I think
function updateCycleCountValues(data) {
    const cycleCountValueSpindle = globalData.data.find(row => row.NodeKey === 43)?.Value || 0;
    const CYCCNTX = globalData.data.find(row => row.NodeKey === 2)?.Value || 0;
    const CYCCNTY = globalData.data.find(row => row.NodeKey === 3)?.Value || 0;
    const CYCCNTZ = globalData.data.find(row => row.NodeKey === 4)?.Value || 0;
    document.getElementById('cycleCountsSpindle').querySelector('.cycle-count-value').innerText = cycleCountValueSpindle;
    document.getElementById('cycleCountsX').querySelector('.cycle-count-value').innerText = CYCCNTX;
    document.getElementById('cycleCountsY').querySelector('.cycle-count-value').innerText = CYCCNTY;
    document.getElementById('cycleCountsZ').querySelector('.cycle-count-value').innerText = CYCCNTZ;
}

function updateLatestValues(data)   {
    const spindleNewVal = data.find();
    const XNewVal = data.find();
    const YNewVal = data.find();
    const ZNewVal = data.find();

    document.getElementById('latest-Spindle').innerText = cycleCountValueSpindle;
    document.getElementById('latest-X').innerText = CYCCNTX;
    document.getElementById('latest-Y').innerText = CYCCNTY;
    document.getElementById('latest-Z').innerText = CYCCNTZ;
}