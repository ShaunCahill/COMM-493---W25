import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ENDPOINT_NAME = "blazingtext-classification"

def lambda_handler(event, context):
    logger.info("Received event: %s", event)

    try:
        # If this is called through API Gateway, event has a "body" field
        if "body" in event:
            body = event["body"]
            if isinstance(body, str):
                body = json.loads(body)
        else:
            body = event

        # Expecting a JSON object with "instances" as a list of text strings
        instances = body.get("instances")

    except Exception as e:
        logger.error("Failed to parse input or extract instances: %s", e)
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Invalid input format."})
        }

    if not instances:
        error_message = "No instances provided in the event."
        logger.error(error_message)
        return {
            "statusCode": 400,
            "body": json.dumps({"error": error_message})
        }

    # Prepare the JSON payload
    payload = {
        "instances": instances
    }
    logger.info("Payload prepared: %s", payload)

    # Call the SageMaker endpoint
    try:
        runtime = boto3.client("sagemaker-runtime")
        response = runtime.invoke_endpoint(
            EndpointName=ENDPOINT_NAME,
            ContentType="application/json",  # Using JSON here
            Body=json.dumps(payload)
        )
        logger.info("BlazingText response received")

        # Parse the response
        result = json.loads(response["Body"].read().decode("utf-8"))
        logger.info("Decoded response: %s", result)

        # Return the raw predictions
        return {
            "statusCode": 200,
            "body": json.dumps({"predictions": result})
        }

    except Exception as e:
        error_message = f"Exception during SageMaker invocation: {str(e)}"
        logger.error(error_message)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": error_message})
        }
