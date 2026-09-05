import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { documentClient } from "./database";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const dynamodb = documentClient;
const tableName = process.env.DYNAMODB_TABLE_NAME;
const headers = {
  "content-type": "application/json",
};

class HttpError extends Error {
  constructor(
    public statusCode: number,
    body: Record<string, unknown> = {},
  ) {
    super(JSON.stringify(body));
  }
}
const handleError = (error: unknown) => {
  console.log("VIRHE::", error);

  if (error instanceof HttpError) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify(error.message),
    };
  }
  return {
    statusCode: 400,
    headers,
    body: "",
  };
};
export const getMeasurement = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    // haetaan measurementId /measurement/{measurementId}
    const measurementId = event.pathParameters?.measurementId;

    const command = new GetCommand({
      TableName: tableName,
      Key: {
        measurementId: measurementId,
      },
    });
    const data = await dynamodb.send(command);
    if (!data.Item) {
      // Ei löytynyt
      throw new HttpError(404, {
        message: "Mittaustuloksia ei löytynyt annetulla tunnisteella.",
      });
    }
    return {
      statusCode: 200,
      headers,

      body: JSON.stringify(data.Item),
    };
  } catch (error) {
    return handleError(error);
  }
};

export const createMeasurement = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const body = JSON.parse(event.body ?? "{}");
  const itemData = {
    measurementId: crypto.randomUUID(),
    measurementData: body,
  };
  try {
    // lisätään tietokantaan uusi mittaustulos, käytetään tietoja body - kentästä.
    const command = new PutCommand({
      TableName: tableName,
      Item: itemData,
    });
    await dynamodb.send(command);
  } catch (error) {
    return handleError(error);
  }
  return { statusCode: 201, headers, body: JSON.stringify(itemData) };
};
