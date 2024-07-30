

// Define dimensions and margins
var h = 800;
var w = 1500;
var margin = {top: 50, right: 50, bottom: 50, left: 50};
var innerWidth = w - margin.left - margin.right;
var innerHeight = h - margin.top - margin.bottom;

// Create the SVG canvas
var svg = d3.select("#canvas")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .style("background-color", "beige");

// Create scales
let x_scale = d3.scaleLinear()
    .domain([-50, 35]) // percentage change scale for precipitation
    .range([margin.left, innerWidth + margin.left]);

let y_scale = d3.scaleLinear()
    .domain([-20, 30]) // percentage change scale for temperature
    .range([innerHeight + margin.top, margin.top]);

// Load JSON data and combine with mock data
const fileNames = [
    "data_json/australia_temp_Sheet1.json",
    "data_json/australia_p_Sheet1.json", 
    "data_json/brazil_temp_Sheet1.json", 
    "data_json/brazil_p_Sheet1.json", 
    "data_json/colombia_p_Sheet1.json",
    "data_json/colombia_temp_Sheet1.json",
    "data_json/congo_p_Sheet1.json",
    "data_json/congo_temp_Sheet1.json",
    "data_json/dk_p_Sheet1.json",
    "data_json/dk_temp_Sheet1.json",
    "data_json/greece_p_Sheet1.json",
    "data_json/greece_temp_Sheet1.json",
    "data_json/india_p_Sheet1.json",
    "data_json/india_temp_Sheet1.json",
    "data_json/sudan_p_Sheet1.json",
    "data_json/sudan_temp_Sheet1.json"
];

Promise.all([
    ...fileNames.map(fileName => d3.json(fileName)),
    d3.csv("data_csv/co-emissions-per-capita.csv") // Load the CO2 emissions CSV file
])
.then(function(files) {
    let countryData = {};
    const co2Data = files.pop(); // Extract CO2 data

    files.forEach((data, index) => {
        const fileName = fileNames[index];
        let country, type, color;
        // Oceania = blue
        // South America = yellow
        // Europe = green
        // Africa = red
        // Asia = pink
        // Extract country and type from the file name
        if (fileName.includes("australia")) {
            country = "Australia";
            color = "blue"
        } else if (fileName.includes("brazil")) {
            country = "Brazil";
            color = "yellow";
        } else if (fileName.includes("colombia")){
            country = "Colombia";
            color = "yellow";
        } else if (fileName.includes("congo")){
            country = "Congo";
            color = "red"
        } else if (fileName.includes("dk")){
            country = "Denmark";
            color = "green"
        } else if (fileName.includes("greece")){
            country = "Greece";
            color = "green"
        } else if (fileName.includes("india")){
            country = "India";
            color = "pink"
        } else if (fileName.includes("sudan")){
            country = "Sudan";
            color = "red"
        }
            
        if (fileName.includes("temp")) {
            type = "temp";
        } else if (fileName.includes("_p_")) {
            type = "pp";
        }

        // Initialize the country entry if it doesn't exist
        if (!countryData[country]) {
            countryData[country] = { temp: [], pp: [], co2: {}, color: color };
        }

        // Add data to the appropriate field
        if (type === "temp") {
            countryData[country].temp = data;
        } else if (type === "pp") {
            countryData[country].pp = data;
        }
    });

    // Map CO2 data to the countryData object
    co2Data.forEach(d => {
        const country = d.Entity;
        const year = +d.Year;
        const co2Emission = +d["Annual CO₂ emissions (per capita)"];
        if (countryData[country]) {
            countryData[country].co2[year] = co2Emission;
        }
    });

    // Calculate percentage change and CO2 trend for each country data
    for (const country in countryData) {
        const tempData = countryData[country].temp;
        const ppData = countryData[country].pp;

        // Debug logs to inspect data structure
        console.log(`Processing ${country} data:`);
        console.log("Temperature data:", tempData);
        console.log("Precipitation data:", ppData);

        const tempBase = tempData[1]["Trend 1951-2020"];
        const ppBase = ppData[1]["Trend 1951-2020"];
        
        // Debug logs to inspect base values
        console.log(`Base temperature for ${country}:`, tempBase);
        console.log(`Base precipitation for ${country}:`, ppBase);
        
        if (isNaN(tempBase) || isNaN(ppBase)) {
            console.error(`Invalid base values for ${country}. Skipping percentage calculation.`);
            continue;
        }

        countryData[country].temp = tempData.map(d => ({
            ...d,
            "Percentage Change": ((d["Trend 1951-2020"] - tempBase) / tempBase) * 100
        }));
        countryData[country].pp = ppData.map(d => ({
            ...d,
            "Percentage Change": ((d["Trend 1951-2020"] - ppBase) / ppBase) * 100
        }));

        // Calculate CO2 trend using linear regression
        const co2Years = Object.keys(countryData[country].co2).map(Number);
        const co2Values = co2Years.map(year => countryData[country].co2[year]);

        if (co2Years.length > 1) {
            const co2Trend = linearRegression(co2Years, co2Values);
            countryData[country].co2Trend = co2Trend.slope;
        } else {
            countryData[country].co2Trend = 0;
        }

        // Debug logs to inspect calculated data
        console.log(`Calculated percentage change for ${country} temperature:`, countryData[country].temp);
        console.log(`Calculated percentage change for ${country} precipitation:`, countryData[country].pp);
        console.log(`Calculated CO2 trend for ${country}:`, countryData[country].co2Trend);
    }

    // Convert the countryData object to an array
    const groupedData = Object.keys(countryData).map(country => ({
        country: country,
        temp: countryData[country].temp,
        pp: countryData[country].pp,
        co2: countryData[country].co2,
        co2Trend: countryData[country].co2Trend,
        color: countryData[country].color // Include color
    }));

    // Start the animation
    animateCircles(groupedData);

    console.log(groupedData);
})
.catch(function(error) {
    console.error('Error loading JSON data:', error);
});

function animateCircles(data) {
    let counter = 0;

    // Create a text element to display the counter
    const counterText = svg.append("text")
        .attr("x", w / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style("fill", "black");

    function update() {
        // Update the text element with the current counter value
        counterText.text(`Year: ${counter + 1950}`);

        const circles = svg.selectAll("circle")
            .data(data)
            .join("circle")
            .transition()
            .duration(800) // Duration of the transition
            .ease(d3.easeLinear) // Linear easing for smooth transition
            .attr("cy", d => y_scale(d["temp"][counter]["Percentage Change"]))
            .attr("cx", d => x_scale(d["pp"][counter]["Percentage Change"]))
            .attr("r", 10)
            .attr("fill", d => d.color);

        // Add or update the text elements for the country names
        const countryTexts = svg.selectAll(".country-text")
            .data(data)
            .join(
                enter => enter.append("text")
                    .attr("class", "country-text")
                    .attr("text-anchor", "middle")
                    .style("font-size", "12px")
                    .style("fill", "black"),
                update => update,
                exit => exit.remove()
            )
            .transition()
            .duration(800) // Duration of the transition
            .ease(d3.easeLinear) // Linear
            .attr("x", d => x_scale(d["pp"][counter]["Percentage Change"]))
            .attr("y", d => y_scale(d["temp"][counter]["Percentage Change"]) - 15) // Position above the circle
            .text(d => d.country);

        // Increment the counter and restart the update function after the duration
        counter = (counter + 1) % data[0].temp.length;
        setTimeout(update, 800); // Ensure the function runs every 2000ms
    }

    update();
    

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${innerHeight + margin.top})`)
        .call(d3.axisBottom(x_scale).ticks(10).tickFormat(d => d + '%'));

    // Add y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y_scale).ticks(10).tickFormat(d => d + '%'));

    // Add x-axis label
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", w / 2)
        .attr("y", h - margin.bottom / 2)
        .style("font-size", "20px")
        .style("fill", "black")
        .text("Precipitation");

    // Add y-axis label
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -h / 2)
        .attr("y", margin.left / 2)
        .style("font-size", "20px")
        .style("fill", "black")
        .text("Temperature");
}

function linearRegression(x, y) {
    const n = x.length;
    const sumX = d3.sum(x);
    const sumY = d3.sum(y);
    const sumXY = d3.sum(x.map((xi, i) => xi * y[i]));
    const sumXX = d3.sum(x.map(xi => xi * xi));

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}
