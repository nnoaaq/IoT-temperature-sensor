import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { documentClient } from "./database";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";

const dynamodb = documentClient;
const tableName = process.env.DYNAMODB_TABLE_NAME;
const headers = {
  "content-type": "application/json",
};

class MyError extends Error {
  constructor(
    public statusCode: number,
    body: Record<string, unknown> = {},
  ) {
    super(JSON.stringify(body));
  }
}
const handleError = (error: unknown) => {
  if (error instanceof MyError) {
    return {
      statusCode: error.statusCode,
      body: error.message,
    };
  }

  return {
    statusCode: 500,
    body: JSON.stringify({
      message: "Tuntematon virhe tapahtunut",
    }),
  };
};

export const createMeasurement = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    // /measurement POST

    const measurementId = crypto.randomUUID();
    const measurementData = JSON.parse(event.body as string);

    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          measurementId: measurementId,
          measurementData: measurementData,
        },
      }),
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        measurementId: measurementId,
        measurementData: measurementData,
      }),
    };
  } catch (error) {
    return handleError(error);
  }
};

const getMeasurementById = async (measurementId: string) => {
  const output = await dynamodb.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        measurementId: measurementId,
      },
    }),
  );
  if (!output.Item)
    throw new MyError(404, { message: "Mittaustuloksia ei löytynyt." });
  return output.Item;
};

export const getMeasurement = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    // /measurement/measurementId GET
    const measurementId = event.pathParameters?.measurementId as string;

    const output = await getMeasurementById(measurementId);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(output),
    };
  } catch (error) {
    return handleError(error);
  }
};

export const deleteMeasurement = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    // /measurement/measurementId DELETE

    const measurementId = event.pathParameters?.measurementId;

    await dynamodb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: {
          measurementId: measurementId,
        },
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Mittaustulokset poistettu.",
      }),
    };
  } catch (error) {
    return handleError(error);
  }
};

export const updateMeasurement = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    // measurement/measurementId PUT
    const measurementId = event.pathParameters?.measurementId as string;
    const newMeasurementData = JSON.parse(event.body as string);
    const fieldsToUpdate = Object.keys(newMeasurementData);
    const updateExpression =
      "SET " +
      fieldsToUpdate
        .map((fieldName) => `measurementData.${fieldName} = :${fieldName}`)
        .join(", ");

    // Object.entries(newMeasurementData) ==>>
    // [
    //    ["annettu kentän nimi", annettu kentän arvo],
    //    ["annettu kentän nimi 2",annettu kentän arvo 2]
    // ]

    const expressionAttributeValues = Object.entries(newMeasurementData).reduce(
      (accumulator, [key, value]) => {
        // {}
        // {":kentän nimi":kentän arvo}
        // {":kentän nimi":kentän arvo, ":kentän nimi 2":kentän arvo 2}
        // {":kentän nimi":kentän arvo, ":kentän nimi 2":kentän arvo 2, ":kentän nimi 3":kentän arvo 3}

        accumulator[`:${key}`] = value;
        return accumulator;
      },
      {} as Record<string, unknown>,
    );
    const output = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          measurementId,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW", // kaikki tiedot
        ConditionExpression: "attribute_exists(measurementId)", // varmistetaan että on olemassa
      }),
    );
    if (!output.Attributes)
      throw new MyError(404, { message: "Mittaustuloksia ei löytynyt." });
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(output.Attributes),
    };
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      return handleError(
        new MyError(404, {
          message: "Mittaustuloksia ei löytynyt.",
        }),
      );
    }
    return handleError(error);
  }
};
export const getAllMeasurements = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    // /measurements GET
    const output = await dynamodb.send(
      new ScanCommand({
        TableName: tableName,
      }),
    );
    if (!output.Count)
      throw new MyError(404, { message: "Mittaustuloksia ei löytynyt." });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(output.Items),
    };
  } catch (error) {
    return handleError(error);
  }
};
