// Main entry point of the extension
import {
  useElement,
  useLayout,
  useEffect,
  useSelections,
} from "@nebula.js/stardust";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import properties from "./object-properties";
import data from "./data";

// This is the main function that Nebula calls
export default function supernova() {
  return {
    qae: {
      properties,
      data,
    },
    component() {
      // Get the HTML element where we'll render the map
      const element = useElement();

      // Get the layout of the object (which contains our data)
      const layout = useLayout();

      // Get the selections object to make selections in Qlik Sense
      const selections = useSelections();

      // Use React-like useEffect hook to create and update the map
      useEffect(() => {
        // Clear the element before rendering
        element.innerHTML = "";

        // Create the map when the component renders
        createMap(element, layout);

        // Cleanup function that will run when component is destroyed
        return () => {
          element.innerHTML = "";
        };
      }, [layout]);
    },
  };
}

// Function to create the US map with address points
async function createMap(element, layout) {
  // Check if we have data
  if (
    !layout.qHyperCube ||
    !layout.qHyperCube.qDataPages ||
    !layout.qHyperCube.qDataPages[0]
  ) {
    element.innerHTML = "<div>No data available</div>";
    return;
  }

  // Clear any previous content
  element.innerHTML = "";

  // Set up dimensions for the map
  const width = element.clientWidth || 975;
  const height = element.clientHeight || 610;

  // Create SVG element
  const svg = d3
    .select(element)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, 975, 610])
    .attr("style", "width: 100%; height: auto; max-height: 100%;");

  // Create a group element for the map
  const g = svg.append("g");

  try {
    // Fetch the US TopoJSON data
    const response = await fetch(
      "https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json"
    );
    if (!response.ok) {
      throw new Error(`Failed to load map data: ${response.statusText}`);
    }
    const us = await response.json();

    if (!us || !us.objects || !us.objects.states) {
      throw new Error("Invalid map data format");
    }

    // Extract the state data from the TopoJSON
    const states = topojson.feature(us, us.objects.states).features;

    // Get our data from the Qlik hypercube
    const qMatrix = layout.qHyperCube.qDataPages[0].qMatrix;
    console.log("Qlik data:", qMatrix);

    // Draw the state boundaries
    g.selectAll("path.state")
      .data(states)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("d", d3.geoPath())
      .attr("fill", "#f0f0f0") // Light gray fill
      .attr("stroke", "#999") // Darker gray borders
      .attr("stroke-width", 0.5);

    // Function to extract address components
    function parseAddress(addressString) {
      // Example: "1 Mills Circle Suite 904A Ontario, California 91764"
      const cityStateZipRegex = /([^,]+),\s*([^,]+)\s+(\d{5})/;
      const match = addressString.match(cityStateZipRegex);

      if (match) {
        return {
          city: match[1].trim(),
          state: match[2].trim(),
          zipCode: match[3].trim(),
          fullAddress: addressString,
        };
      }

      return {
        fullAddress: addressString,
      };
    }

    // Function to get coordinates based on address components
    // This is a simple lookup approximation based on known locations
    function getCoordinates(addressInfo) {
      // This is a simplified geocoding based on US states
      const stateCoordinates = {
        Alabama: { lat: 32.806671, lng: -86.79113 },
        Alaska: { lat: 61.370716, lng: -152.404419 },
        Arizona: { lat: 33.729759, lng: -111.431221 },
        Arkansas: { lat: 34.969704, lng: -92.373123 },
        California: { lat: 36.116203, lng: -119.681564 },
        Colorado: { lat: 39.059811, lng: -105.311104 },
        Connecticut: { lat: 41.597782, lng: -72.755371 },
        Delaware: { lat: 39.318523, lng: -75.507141 },
        Florida: { lat: 27.766279, lng: -81.686783 },
        Georgia: { lat: 33.040619, lng: -83.643074 },
        Hawaii: { lat: 21.094318, lng: -157.498337 },
        Idaho: { lat: 44.240459, lng: -114.478828 },
        Illinois: { lat: 40.349457, lng: -88.986137 },
        Indiana: { lat: 39.849426, lng: -86.258278 },
        Iowa: { lat: 42.011539, lng: -93.210526 },
        Kansas: { lat: 38.5266, lng: -96.726486 },
        Kentucky: { lat: 37.66814, lng: -84.670067 },
        Louisiana: { lat: 31.169546, lng: -91.867805 },
        Maine: { lat: 44.693947, lng: -69.381927 },
        Maryland: { lat: 39.063946, lng: -76.802101 },
        Massachusetts: { lat: 42.230171, lng: -71.530106 },
        Michigan: { lat: 43.326618, lng: -84.536095 },
        Minnesota: { lat: 45.694454, lng: -93.900192 },
        Mississippi: { lat: 32.741646, lng: -89.678696 },
        Missouri: { lat: 38.456085, lng: -92.288368 },
        Montana: { lat: 46.921925, lng: -110.454353 },
        Nebraska: { lat: 41.12537, lng: -98.268082 },
        Nevada: { lat: 38.313515, lng: -117.055374 },
        "New Hampshire": { lat: 43.452492, lng: -71.563896 },
        "New Jersey": { lat: 40.298904, lng: -74.521011 },
        "New Mexico": { lat: 34.840515, lng: -106.248482 },
        "New York": { lat: 42.165726, lng: -74.948051 },
        "North Carolina": { lat: 35.630066, lng: -79.806419 },
        "North Dakota": { lat: 47.528912, lng: -99.784012 },
        Ohio: { lat: 40.388783, lng: -82.764915 },
        Oklahoma: { lat: 35.565342, lng: -96.928917 },
        Oregon: { lat: 44.572021, lng: -122.070938 },
        Pennsylvania: { lat: 40.590752, lng: -77.209755 },
        "Rhode Island": { lat: 41.680893, lng: -71.51178 },
        "South Carolina": { lat: 33.856892, lng: -80.945007 },
        "South Dakota": { lat: 44.299782, lng: -99.438828 },
        Tennessee: { lat: 35.747845, lng: -86.692345 },
        Texas: { lat: 31.054487, lng: -97.563461 },
        Utah: { lat: 40.150032, lng: -111.862434 },
        Vermont: { lat: 44.045876, lng: -72.710686 },
        Virginia: { lat: 37.769337, lng: -78.169968 },
        Washington: { lat: 47.400902, lng: -121.490494 },
        "West Virginia": { lat: 38.491226, lng: -80.954453 },
        Wisconsin: { lat: 44.268543, lng: -89.616508 },
        Wyoming: { lat: 42.755966, lng: -107.30249 },
      };

      // Known cities in California
      const californiaCoordinates = {
        Ontario: { lat: 34.0633, lng: -117.5916 },
        Orange: { lat: 33.7879, lng: -117.8907 },
        "Los Angeles": { lat: 34.0211, lng: -118.1506 },
        Vacaville: { lat: 38.3568, lng: -121.9796 },
        Milpitas: { lat: 37.4149, lng: -121.9018 },
        Gilroy: { lat: 37.0199, lng: -121.5662 },
        Camarillo: { lat: 34.2333, lng: -119.0678 },
        Livermore: { lat: 37.7061, lng: -121.8241 },
      };

      // Known cities in Connecticut
      const connecticutCoordinates = {
        Clinton: { lat: 41.2897, lng: -72.5285 },
      };

      // If we recognize the city in California
      if (
        addressInfo.state === "California" &&
        californiaCoordinates[addressInfo.city]
      ) {
        return californiaCoordinates[addressInfo.city];
      }

      // If we recognize the city in Connecticut
      if (
        addressInfo.state === "Connecticut" &&
        connecticutCoordinates[addressInfo.city]
      ) {
        return connecticutCoordinates[addressInfo.city];
      }

      // If we recognize the state
      if (addressInfo.state && stateCoordinates[addressInfo.state]) {
        return stateCoordinates[addressInfo.state];
      }

      // Fallback to a point in the US
      return { lat: 39.8283, lng: -98.5795 }; // Geographic center of the United States
    }

    // Process the address data from Qlik
    const processedData = qMatrix.map((row) => {
      const addressText = row[0].qText;
      const value = row[1].qNum;

      const addressInfo = parseAddress(addressText);
      const coordinates = getCoordinates(addressInfo);

      return {
        address: addressText,
        value: value,
        lat: coordinates.lat,
        lng: coordinates.lng,
      };
    });

    console.log("Processed address data:", processedData);

    // Create projection
    const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);

    // Create a value-based scale for circle size
    const valueExtent = d3.extent(processedData, (d) => d.value);
    const circleScale = d3.scaleSqrt().domain(valueExtent).range([5, 20]); // Min and max circle radius

    // Create a color scale for the circles
    const colorScale = d3
      .scaleSequential(d3.interpolateYlOrRd)
      .domain(valueExtent);

    // Add the points to the map
    g.selectAll("circle")
      .data(processedData)
      .enter()
      .append("circle")
      .attr("cx", (d) => {
        const point = projection([d.lng, d.lat]);
        return point ? point[0] : null;
      })
      .attr("cy", (d) => {
        const point = projection([d.lng, d.lat]);
        return point ? point[1] : null;
      })
      .attr("r", (d) => circleScale(d.value))
      .attr("fill", (d) => colorScale(d.value))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.8)
      .on("mouseover", function (event, d) {
        // Highlight circle on hover
        d3.select(this)
          .attr("stroke", "#000")
          .attr("stroke-width", 2)
          .attr("opacity", 1);

        // Show tooltip
        const tooltip = d3
          .select(element)
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "white")
          .style("border", "1px solid #ddd")
          .style("border-radius", "4px")
          .style("padding", "8px")
          .style("pointer-events", "none")
          .style("box-shadow", "0 2px 10px rgba(0,0,0,0.1)")
          .style("z-index", 1000)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");

        tooltip.html(`
          <strong>${d.address}</strong><br/>
          Value: ${d.value.toLocaleString()}
        `);
      })
      .on("mouseout", function () {
        // Remove highlight on mouseout
        d3.select(this)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.8);

        // Remove tooltip
        d3.select(element).selectAll(".tooltip").remove();
      })
      .on("click", function (event, d) {
        // Make selection in Qlik Sense using the element number
        if (selections) {
          // Begin the selection process
          selections.begin("/qHyperCubeDef");

          // Select the dimension value (address)
          // The first parameter is the dimension index (0 for first dimension)
          // The second parameter is an array of element numbers to select
          // The third parameter is a boolean to toggle selection
          selections.select(0, [d.qElemNumber], false);

          // Confirm the selection to apply it
          selections.confirm();

          // Visual feedback for selection
          // d3.select(this)
          //   .transition()
          //   .duration(200)
          //   .attr("r", circleScale(d.value) * 1.3)
          //   .attr("stroke", "#333")
          //   .attr("stroke-width", 3)
          //   .transition()
          //   .duration(200)
          //   .attr("r", circleScale(d.value))
          //   .attr("stroke", "#fff")
          //   .attr("stroke-width", 1.5);
        }

        // Find the corresponding row in our data
        const rowIndex = processedData.indexOf(d);

        if (rowIndex >= 0) {
          // Make selection in Qlik Sense
          layout.selectHyperCubeValues("/qHyperCubeDef", 0, [rowIndex], true);
        }
      });

    // Add a legend for circle sizes
    const legendX = 50;
    const legendY = height - 100;

    const legend = svg
      .append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    // Add title
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -30)
      .attr("font-weight", "bold")
      .attr("font-size", "14px")
      .text("Location Values");

    // Define legend sizes
    const legendValues = [
      d3.min(processedData, (d) => d.value),
      d3.median(processedData, (d) => d.value),
      d3.max(processedData, (d) => d.value),
    ];

    // Add circles to legend
    legend
      .selectAll("circle.legend")
      .data(legendValues)
      .enter()
      .append("circle")
      .attr("class", "legend")
      .attr("cx", 0)
      .attr("cy", (d, i) => i * 25)
      .attr("r", (d) => circleScale(d))
      .attr("fill", (d) => colorScale(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.8);

    // Add labels to legend
    legend
      .selectAll("text.legend-label")
      .data(legendValues)
      .enter()
      .append("text")
      .attr("class", "legend-label")
      .attr("x", 30)
      .attr("y", (d, i) => i * 25)
      .attr("dy", "0.35em")
      .attr("font-size", "12px")
      .text((d) => d.toLocaleString());
  } catch (error) {
    console.error("Error loading map:", error);
    element.innerHTML = `<div style="color: red; padding: 20px;">Error loading map: ${error.message}</div>`;
  }
}
