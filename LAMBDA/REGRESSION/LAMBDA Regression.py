import json
import boto3
import os
import logging
import csv
from io import StringIO

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize the SageMaker runtime client
runtime = boto3.client("runtime.sagemaker")

# Load SageMaker endpoint name from environment variable
SAGEMAKER_ENDPOINT = "linear-learner-endpoint"

def convert_to_csv(instances):
    """Convert a list of lists (instances) to CSV format."""
    output = StringIO()
    csv_writer = csv.writer(output)
    csv_writer.writerows(instances)
    return output.getvalue().encode("utf-8")

def lambda_handler(event, context):
    try:
        # Extract the body from the event
        body = event.get("body")

        # If the body is a string, parse it as JSON
        if isinstance(body, str):
            body = json.loads(body)
        
        # Ensure body is a dictionary
        if not isinstance(body, dict):
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Invalid request body format. Expected a JSON object."})
            }
        
        # Extract instances
        instances = body.get("instances", [])

        # Validate instances format
        if not isinstance(instances, list) or not all(isinstance(row, list) for row in instances):
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Invalid format for 'instances'. Expected a list of lists."})
            }

        # Convert instances to CSV format
        csv_payload = convert_to_csv(instances)

        # Invoke the SageMaker endpoint
        response = runtime.invoke_endpoint(
            EndpointName=SAGEMAKER_ENDPOINT,
            Body=csv_payload,
            ContentType="text/csv"
        )

        # Read and parse the response
        response_body = response["Body"].read().decode("utf-8")
        prediction = json.loads(response_body)

        return {
            "statusCode": 200,
            "body": json.dumps({"prediction": prediction})
        }

    except Exception as e:
        logger.error(f"Error invoking SageMaker endpoint: {str(e)}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
