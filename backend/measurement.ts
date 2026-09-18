import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { CustomError, handleError } from "./error";
import { documentClient } from "./database";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { sendEmail } from "./email";
import { Measurement } from "./types/measurement";

const dynamodb = documentClient;
const tableName = process.env.DYNAMODB_TABLE_NAME;
const sensorsTableName = process.env.DYNAMODB_SENSORS_TABLE_NAME;
const limitsTableName = process.env.DYNAMODB_TABLE_NAME_LIMITS;

const authorization_key = process.env.PRIVATE_KEY;
// measurement/{sensorId} GET
export const getMeasurementById = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    // haetaan mittaustulokset valitulla measurementIdllä
    // measurementId:string
    const measurementId = event.pathParameters?.measurementId;
    if (!measurementId)
      throw new CustomError(404, {
        message: "Tarkista mittaustuloksen tunniste.",
      });
    if (!tableName)
      throw new CustomError(404, { message: "Tarkista ympäristömuuttujat." });
    const output = await dynamodb.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          measurementId: measurementId,
        },
      }),
    );
    if (!output.Item)
      throw new CustomError(404, { message: "Mittaustulosta ei löytynyt." });
    return {
      statusCode: 200,
      body: JSON.stringify(output.Item),
    };
  } catch (error) {
    return handleError(error);
  }
};
// /measurement POST
export const createMeasurement = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  /*
  {
  sensorId:string,
  sensorName:number,
  temperature:number,
  humidity:number
  sensorName:string
  }
  */

  // VAADITAAN authorization header
  if (
    !event.headers?.authorization ||
    event.headers.authorization != authorization_key
  )
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Et ole tervetullut.",
      }),
    };

  try {
    const data: Measurement = JSON.parse(event.body as string);
    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: data,
      }),
    );
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Mittaustulos tallennettu onnistuneesti.",
      }),
    };
  } catch (error) {
    return handleError(error);
  }
};

// /measurements/{sensorId} GET
export const getAllMeasurements = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    // haetaan kaikki mittaustulokset annetulle sensorille
    // aina taulukko []
    //const output = await dynamodb.send(
    //  new ScanCommand({
    //    TableName: tableName,
    //    Limit: 10,
    //  }),
    //);
    let sensorId = event.queryStringParameters?.sensorId;
    if (!sensorId) {
      // haetaan ensimmäinen löytynyt sensori
      const output = await dynamodb.send(
        new ScanCommand({
          TableName: sensorsTableName,
          ProjectionExpression: "sensorId",
          Limit: 1,
        }),
      );
      if (!output.Items)
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Sensoreita ei löytynyt." }),
        };
      sensorId = output.Items[0]?.sensorId;
    }
    const output = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "sensorId = :sensorId",
        ExpressionAttributeValues: {
          ":sensorId": sensorId,
        },
        Limit: 100,
      }),
    );
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(output.Items),
    };
  } catch (error) {
    return handleError(error);
  }
};
