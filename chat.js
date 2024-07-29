// Define dimensions and margins
var h = 1000;
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
    .domain([0, 2100])
    .range([margin.left, innerWidth + margin.left]);

let y_scale = d3.scaleLinear()
    .domain([28, 20])
    .range([margin.top, innerHeight + margin.top]);

// Load JSON data and combine with mock data
const fileNames = ["data_json/australia_temp_Sheet1.json", "data_json/australia_p_Sheet1.json", "data_json/brazil_temp_Sheet1.json", "data_json/brazil_p_Sheet1.json"];

Promise.all(fileNames.map(fileName => d3.json(fileName)))
.then(function(files) {
    let countryData = {};

    files.forEach((data, index) => {
        const fileName = fileNames[index];
        let country, type;

        // Extract country and type from the file name
        if (fileName.includes("australia")) {
            country = "australia";
        } else if (fileName.includes("brazil")) {
            country = "brazil";
        }
        if (fileName.includes("temp")) {
            type = "temp";
        } else if (fileName.includes("_p_")) {
            type = "pp";
        }

        // Initialize the country entry if it doesn't exist
        if (!countryData[country]) {
            countryData[country] = { temp: [], pp: [] };
        }

        // Add data to the appropriate field
        if (type === "temp") {
            countryData[country].temp = data;
        } else if (type === "pp") {
            countryData[country].pp = data;
        }
    });

    // Convert the countryData object to an array
    const groupedData = Object.keys(countryData).map(country => ({
        country: country,
        temp: countryData[country].temp,
        pp: countryData[country].pp
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

        svg.selectAll("circle")
            .data(data)
            .join("circle")
            .transition()
            .duration(100) // Duration of the transition
            .ease(d3.easeLinear) // Linear easing for smooth transition
            .attr("cy", d => y_scale(d["temp"][counter]["Trend 1951-2020"]))
            .attr("cx", d => x_scale(d["pp"][counter]["Trend 1951-2020"]))
            .attr("r", 10)
            .attr("fill", "black");

        // Increment the counter and restart the update function after the duration
        counter = (counter + 1) % data[0].temp.length;
        setTimeout(update, 100); // Ensure the function runs every 2000ms
    }

    update();

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${innerHeight + margin.top})`)
        .call(d3.axisBottom(x_scale).ticks(10));

    // Add y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y_scale).ticks(10));
}
