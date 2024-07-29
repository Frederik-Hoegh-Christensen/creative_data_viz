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
// // Create scales
let x_scale = d3.scaleLinear()
    .domain([0, 4000])
    .range([margin.left, innerWidth + margin.left]);

let y_scale = d3.scaleLinear()
    .domain([50, -5]) // Accommodate 5 horizontal bars
    .range([margin.top, innerHeight + margin.top]);
    


// // Define mock data objects
// var obj2 = {1949 : {
    
//     temp_avg: 10
// }};
// var obj3 = {1949 : {
//     year: 1949,
//     temp_avg: 13
// }};
// var obj4 = {1949 : {
    
//     temp_avg: -3
// }};
// var obj5 = {1949 : {
//     year: 1949,
//     temp_avg: 20
// }};

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

    draw(groupedData);

    console.log(groupedData);
})
.catch(function(error) {
    console.error('Error loading JSON data:', error);
});


function draw(data) {
    // Bind data and create bars
    svg.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cy", d => y_scale(d["temp"][0]["Annual Average Mean Surface Air Temperature"])) // Adjust x position based on temperature
        .attr("cx", d => x_scale(d["pp"][0]["Annual Precipitation"])) // Adjust y position based on index
        .attr("r", 10) // Adjust y position based on index
        //.attr("width", d => x(d[1949].temp_avg)) // Width based on temperature

        .attr("fill", "black");

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${innerHeight + margin.top})`)
        .call(d3.axisBottom(x_scale).ticks(10));

    // Add y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y_scale).ticks(10));
};
