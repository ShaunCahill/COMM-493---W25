/**
 * ************************************************************
 * INSTRUCTION:
 * Update the API_URL constant below with your new API endpoint URL if needed.
 * ************************************************************
 */
const API_URL = "https://x9ycjx8qta.execute-api.us-east-1.amazonaws.com/prod/inference";

/**
 * Parses the CSV input.
 *
 * Expects a string of comma-separated numbers.
 * 
 * INSTRUCTION:
 * If your API expects a different input format, update this function accordingly.
 *
 * @param {string} raw - The raw input string from the user.
 * @returns {object} - A JSON object formatted as { instances: [numbers] }.
 */
function parseCSVInput(raw) {
  const numbers = raw.split(",").map(num => {
    const val = parseFloat(num.trim());
    if (isNaN(val)) {
      // INSTRUCTION: This error indicates that the input is invalid.
      throw new Error("Invalid number encountered: " + num);
    }
    return val;
  });
  // Return object in the format expected by the API.
  return { instances: [numbers] };
}

/**
 * Makes a POST request to the API.
 *
 * INSTRUCTION:
 * If your API requires additional headers, a different HTTP method,
 * or other options, update the fetch configuration in this function.
 *
 * @param {string} url - The API endpoint URL.
 * @param {object} data - The JSON data to send.
 * @returns {Promise<object>} - The parsed JSON response.
 */
async function postData(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw new Error("HTTP error! Status: " + res.status);
  }
  return res.json();
}

/**
 * Formats the API response into an HTML table.
 *
 * Expected API response format:
 * {
 *   "statusCode": 200,
 *   "body": "{\"predictions\": [value1, value2, ...]}"
 * }
 *
 * The table will have one row per prediction with two cells:
 * the first cell contains the fixed text "Prediction" and the second cell contains the prediction value.
 *
 * INSTRUCTION:
 * If your API returns data in a different structure, update this function accordingly.
 *
 * @param {object} responseData - The API response.
 * @returns {string} - The HTML string representing the table.
 */
function formatResponse(responseData) {
  let parsedData;
  // Check if the response contains a 'body' key (common with API Gateway responses)
  if (responseData.body) {
    try {
      parsedData = JSON.parse(responseData.body);
    } catch (err) {
      return "<p>Error parsing response body.</p>";
    }
  } else {
    parsedData = responseData;
  }

  let tableHTML = "<table>";
  if (parsedData.predictions && Array.isArray(parsedData.predictions)) {
    parsedData.predictions.forEach(function(prediction) {
      tableHTML += "<tr><td>Prediction</td><td>" + prediction + "</td></tr>";
    });
  } else {
    tableHTML += "<tr><td colspan='2'>No predictions found</td></tr>";
  }
  tableHTML += "</table>";
  return tableHTML;
}

/**
 * Main function to handle the prediction process.
 *
 * Retrieves the input from the textarea, calls the API, and formats the response.
 *
 * INSTRUCTION:
 * If you change the input format or the API response structure, update this function and the helper functions accordingly.
 */
async function makePrediction() {
  const btn = document.getElementById("submitBtn");
  const respElem = document.getElementById("response");
  btn.disabled = true;
  btn.innerText = "Loading...";

  // Retrieve and trim the user input
  const rawInput = document.getElementById("inputData").value.trim();
  let data;
  try {
    // Convert the CSV string to the JSON structure expected by the API.
    data = parseCSVInput(rawInput);
  } catch (error) {
    respElem.innerHTML = "<p>" + error + "</p>";
    btn.disabled = false;
    btn.innerText = "Submit to API";
    return;
  }

  try {
    // Make the API call.
    const result = await postData(API_URL, data);
    // Format the API response into an HTML table.
    respElem.innerHTML = formatResponse(result);
  } catch (error) {
    respElem.innerHTML = "<p>Error: " + error + "</p>";
  } finally {
    btn.disabled = false;
    btn.innerText = "Submit to API";
  }
}

// INSTRUCTION:
// If you want to trigger the API call using a different event (for example, on input change),
// update the event listener below.
document.getElementById("submitBtn").addEventListener("click", makePrediction);
