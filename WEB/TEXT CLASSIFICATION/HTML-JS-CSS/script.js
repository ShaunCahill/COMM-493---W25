// Set your API endpoint URL here. 
// CHANGE THIS to your actual API endpoint.
const API_URL = "https://7lvg1tje6b.execute-api.us-east-1.amazonaws.com/prod/inference";

/**
 * Converts the raw text input into a JSON object expected by the API.
 * It splits the text by newlines, trims each line, and filters out any empty lines.
 * 
 * Students: If your API requires a different JSON structure, change the returned object accordingly.
 */
function parseTextInput(raw) {
  // Split the input on newline, remove extra spaces, and exclude blank lines
  const lines = raw.split("\n").map(line => line.trim()).filter(line => line);
  // Return an object with the key "instances" (update this key if your API expects a different name)
  return { instances: lines };
}

/**
 * Sends a POST request with JSON data to the given URL.
 * 
 * Students: If your API needs additional headers (like authentication tokens) or other configurations,
 * modify the fetch options accordingly.
 */
async function postData(url, data) {
  const response = await fetch(url, {
    method: "POST", // Using POST method to send data
    headers: { "Content-Type": "application/json" }, // Modify header if needed
    body: JSON.stringify(data) // Convert data object to JSON string
  });
  // Check for unsuccessful HTTP responses and throw an error if necessary
  if (!response.ok) {
    throw new Error("HTTP error! Status: " + response.status);
  }
  // Return the parsed JSON response
  return response.json();
}

/**
 * Processes the API response and formats it into an HTML table.
 * It expects the API response to have a 'predictions' array.
 * 
 * Students: If your API returns a different response structure, adjust the parsing logic accordingly.
 */
function formatResponse(responseData) {
  let parsedData = responseData;

  // Check if the response has a 'body' property; if so, attempt to parse it as JSON
  if (responseData.body) {
    try {
      parsedData = JSON.parse(responseData.body);
    } catch (err) {
      return "<p>Error parsing response body.</p>";
    }
  }

  // Start building the HTML table
  let tableHTML = "<table>";
  
  // Verify that predictions exist and are in an array
  if (parsedData.predictions && Array.isArray(parsedData.predictions)) {
    // Loop through each prediction item
    parsedData.predictions.forEach((predictionItem, index) => {
      // If an item is an array (multiple predictions per input), iterate through each one
      if (Array.isArray(predictionItem)) {
        predictionItem.forEach((prediction, subIndex) => {
          tableHTML += parseSinglePrediction(
            prediction,
            `Input #${index + 1} - ${subIndex + 1}` // Label for each sub-prediction
          );
        });
      } else {
        // Otherwise, treat the item as a single prediction
        tableHTML += parseSinglePrediction(predictionItem, `Input #${index + 1}`);
      }
    });
  } else {
    // Fallback message if no predictions are found in the response
    tableHTML += "<tr><td colspan='2'>No predictions found</td></tr>";
  }
  
  tableHTML += "</table>";
  return tableHTML;
}

/**
 * Generates an HTML table row for a single prediction.
 * It logs the prediction for debugging purposes and maps raw prediction labels to friendlier text.
 * 
 * Students: If your API uses different properties for labels or probabilities, update this function accordingly.
 */
function parseSinglePrediction(prediction, label) {
  // Output the prediction object to the console for debugging
  console.log("Prediction object:", prediction);
  
  // Convert the prediction label to a string; default to "Unknown" if not available
  const rawLabel = prediction.label ? String(prediction.label).trim() : "Unknown";
  
  // Map raw labels to friendlier versions. Change this logic if your API uses different labels.
  const friendlyLabel = rawLabel.toLowerCase().includes("positive")
    ? "Positive"
    : rawLabel.toLowerCase().includes("negative")
      ? "Negative"
      : rawLabel;
  
  // Convert probability to a percentage (with two decimals) if available; otherwise, show "N/A"
  const confidence = prediction.prob ? (prediction.prob * 100).toFixed(2) + "%" : "N/A";
  
  // Return the table row as an HTML string
  return `<tr><td>${label}</td><td>${friendlyLabel} (Confidence: ${confidence})</td></tr>`;
}

/**
 * Main function to handle the entire prediction process:
 * - Retrieves input from the textarea.
 * - Converts the text to JSON using parseTextInput.
 * - Sends the JSON data to the API using postData.
 * - Processes and displays the API response using formatResponse.
 * 
 * Students: If your UI elements have different IDs or if you need to change the flow, update this function accordingly.
 */
async function makePrediction() {
  // Retrieve UI elements for the button and response display area
  const btn = document.getElementById("submitBtn");
  const respElem = document.getElementById("response");
  
  // Disable the button and indicate that the API call is in progress
  btn.disabled = true;
  btn.innerText = "Loading...";

  // Get and trim the user input from the textarea (assumed to have id "inputData")
  const rawInput = document.getElementById("inputData").value.trim();
  let data;
  try {
    data = parseTextInput(rawInput);
  } catch (error) {
    respElem.innerHTML = `<p>${error}</p>`;
    btn.disabled = false;
    btn.innerText = "Submit to API";
    return;
  }

  try {
    // Send the prepared data to the API
    const result = await postData(API_URL, data);
    // Format the API response into an HTML table and display it
    respElem.innerHTML = formatResponse(result);
  } catch (error) {
    // Display any errors encountered during the API call
    respElem.innerHTML = `<p>Error: ${error}</p>`;
  } finally {
    // Re-enable the button and reset its text
    btn.disabled = false;
    btn.innerText = "Submit to API";
  }
}

// Attach a click event listener to the button with id "submitBtn"
// Students: Make sure your HTML contains an element with id="submitBtn"
document.getElementById("submitBtn").addEventListener("click", makePrediction);
