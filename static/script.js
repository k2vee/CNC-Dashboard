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

// -- Chart functions --
// C: Creates ??datasets??
function createDatasets(data, motors) { 
    const datasets = [];

    // Colors for each
    const colors = {
        X: '#FFC3A0', // Soft green-blue
        Y: '#A0FFC3', // Soft orange
        Z: '#A0C3FF', // Soft lavender
        Spindle: '#e78ac3', // Soft pink
    };

    // Splits motor data 
    motors.forEach((motor, index) => {
        // Filter data for the current motor
        const motorData = data.filter(row => {
            const isMotor = isMotorNodeId(row.NodeId, motor);
            console.log(`Checking NodeId ${row.NodeId} for Motor ${motor}: ${isMotor}`);
            return isMotor;
        });

        console.log(`Filtered data for ${motor}:`, motorData);
        
        if (motorData.length > 0) {
            datasets.push({
                label: `Motor ${motor}`,
                borderColor: colors[motor],
                data: motorData.map(row => row.Value)
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
        console.log(groupedData);
        // Create a dataset for each selected motor
        const colors = {
            X: '#FFC3A0', // Soft green-blue
            Y: '#A0FFC3', // Soft orange
            Z: '#A0C3FF', // Soft lavender
            Spindle: '#e78ac3', // Soft pink
        };
        
        for (const motor in data) {
            if (data[motor].length > 0) {
                const values = data[motor].map(row => row.Value);
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
    //const speedX = data.find(row => row.NodeKey === 36)?.Value || 0;
    //const speedY = data.find(row => row.NodeKey === 37)?.Value || 0;
    //const speedZ = data.find(row => row.NodeKey === 38)?.Value || 0;

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

// -- Filtering Functions --
// Function to toggle motor selection
function toggleMotorSelection(canvasId, data, chartTitle) {
    // Update the line chart with the selected data
    const selectedData = getSelectedData(data);
    const dataset = createDatasets(selectedData, getSelectedMotors());
    const labels = Array.from({ length: data.length }, (_, i) => i + 1); // Sequential x-axis values

    //updateLineChart(selectedData, chartId, chartTitle);
    createLineChart(canvasId, labels, dataset, chartTitle);
}

// Function to get selected data based on button states
function getSelectedData(data) {
    const selectedMotors = getSelectedMotors();

    // Filter data based on selected motors
    const selectedData = data.filter(row => {
        let nodeIdInMotor;
        for (let i = 0; i < selectedMotors.length; i++)   {
            nodeIdInMotor = isMotorNodeId(row.NodeId, selectedMotors[i]);
            if(nodeIdInMotor)   {
                return true;
            }
        }
        return false;
    });
    
    return selectedData;
}

function isMotorNodeId(nodeId, motor) {
    const motorMap = {
        X: ['Current1', 'CYCCNT1', 'MAXCUR21', 'MACPOS1', 'MATPOS1', 'SCAPOS1', 'RemainCommand1', 'CurrentPosition1', 'ServoMonitor_Gain1', 'ServoMonitor_Droop1', 'Speed1'],
        Y: ['Current2', 'CYCCNT2', 'MAXCUR22', 'MACPOS2', 'MATPOS2', 'SCAPOS2', 'RemainCommand2', 'CurrentPosition2', 'Gain2', 'Droop2', 'Speed1'],
        Z: ['Current3', 'CYCCNT3', 'MAXCUR23', 'MACPOS3', 'MATPOS3', 'SCAPOS3', 'RemainCommand3', 'CurrentPosition3', 'Gain3', 'Droop3', 'Speed1'],
        Spindle: ['SpindleMonitor_Gain1', 'SpindleMonitor_Droop1', 'LEDDisplay1', 'ControlInput11', 'ControlOutput11', 'ControlOutput41', 'CycleCount1', 'ControlOutput21', 'Load1'] // Include the node key for the 'Spindle' motor
    };

    // Check if motor is defined before accessing its properties
    if (motor in motorMap)   {
        // If the nodeId is included in the associated motor list, return true. Otherwise, false.
        return motorMap[motor].some(v => nodeId.includes(v));
    }

    return false;
}

function getSelectedMotors()    {
    return(['X', 'Y', 'Z', 'Spindle'].filter(motor => {
        const button = document.getElementById(`button${motor}`);
        return button.classList.contains('selected-button');
    })); 
}

// -- For updating latest values on each page --
function updateCurrentValues(data) {
    const X = findLatestValue(data.filter(row => row.NodeId.includes('Current1')));
    const Y = findLatestValue(data.filter(row => row.NodeId.includes('Current2')));
    const Z = findLatestValue(data.filter(row => row.NodeId.includes('Current3')));

    document.getElementById('latest-X').innerText = X;
    document.getElementById('latest-Y').innerText = Y;
    document.getElementById('latest-Z').innerText = Z;
}

function updateCycleCountValues(data) {
    const X = findLatestValue(data.filter(row => row.NodeId.includes('CYCCNT1')));
    const Y = findLatestValue(data.filter(row => row.NodeId.includes('CYCCNT2')));
    const Z = findLatestValue(data.filter(row => row.NodeId.includes('CYCCNT3')));

    document.getElementById('latest-X').innerText = X;
    document.getElementById('latest-Y').innerText = Y;
    document.getElementById('latest-Z').innerText = Z;
    //document.getElementById('latest-Spindle').innerText = findLatestValue(data.filter(row => row.NodeId == `Current1`));
}

function findLatestValue(filteredData)  {
    let latestValue = 0;
    for(time_t0 = 0, i = 0; i < filteredData.length; i++)    {
        let time_t1 = filteredData[i].ServerTimeStamp;
        if(time_t1 > time_t0)
            latestValue = filteredData[i].Value;
        time_t0 = time_t1;
    }
    return latestValue;
}

// This function will remain unused
function updateLatestValues(data, servoKey, spindleKey)   {
    const XNewVal = findLatestValue(data.filter(row => row.NodeId == `${servoKey}1`));
    const YNewVal = findLatestValue(data.filter(row => row.NodeId == `${servoKey}2`));
    const ZNewVal = findLatestValue(data.filter(row => row.NodeId == `${servoKey}3`));
    const spindleNewVal = findLatestValue(data.filter(row => row.NodeId == `${spindleKey}1`));

    document.getElementById('latest-Spindle').innerText = spindleNewVal;
    document.getElementById('latest-X').innerText = XNewVal;
    document.getElementById('latest-Y').innerText = YNewVal;
    document.getElementById('latest-Z').innerText = ZNewVal;
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