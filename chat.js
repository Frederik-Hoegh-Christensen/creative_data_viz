// Define dimensions and margins
var w = 1000;
var h = 700;
var margin = {top: 50, right: 50, bottom: 50, left: 50};
var innerWidth = w - margin.left - margin.right;
var innerHeight = h - margin.top - margin.bottom;

// Create scales
let x = d3.scaleLinear()
    .domain([-20, 20])
    .range([margin.left, innerWidth + margin.left]);

let y = d3.scaleBand()
    .domain(d3.range(5)) // Accommodate 5 horizontal bars
    .range([margin.top, innerHeight + margin.top])
    .padding(0.1);

// Create the SVG canvas
var svg = d3.select("#canvas")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .style("background-color", "beige");

// Define mock data objects
var obj2 = {1949 : {
    
    temp_avg: 10
}};
var obj3 = {1949 : {
    year: 1949,
    temp_avg: 13
}};
var obj4 = {1949 : {
    
    temp_avg: -3
}};
var obj5 = {1949 : {
    year: 1949,
    temp_avg: 20
}};

// Load JSON data and combine with mock data
d3.json("copenhagen.json")
    .then(function(data) {
        myData = [data, obj2, obj3, obj4, obj5];
        console.log(myData);
        draw();
    })
    .catch(function(error) {
        console.error('Error loading JSON data:', error);
    });

function draw() {
    // Bind data and create bars
    svg.selectAll("rect")
        .data(myData)
        .join("rect")
        .attr("x", d => x(-20)) // Adjust x position based on temperature
        .attr("y", (d, i) => y(i)) // Adjust y position based on index
        //.attr("width", d => x(d[1949].temp_avg)) // Width based on temperature
        .attr("width", d => x(d[1949].temp_avg) - x(-20)) // Width based on temperature relative to -20°C
        .attr("height", y.bandwidth()) // Height based on y scale band
        .attr("fill", "black");

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${innerHeight + margin.top})`)
        .call(d3.axisBottom(x).ticks(10));

    // Add y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(() => ""));
}
