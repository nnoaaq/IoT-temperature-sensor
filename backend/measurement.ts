import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { CustomError, handleError } from "./error";
import { documentClient } from "./database";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { sendEmail } from "./email";
import { Measurement } from "./types/measurement";

const dynamodb = documentClient;
const tableName = process.env.DYNAMODB_TABLE_NAME;
const sensorsTableName = process.env.DYNAMODB_SENSORS_TABLE_NAME;
const limitsTableName = process.env.DYNAMODB_TABLE_NAME_LIMITS;
const authorization_key = process.env.PRIVATE_KEY;

export const convertUnixTimestamp = (timestamp: number) => {
  // palauttaa ajan dd.mm.yyyy muodossa
  try {
    const timeObj = new Date(Number(timestamp) * 1000);
    return new Intl.DateTimeFormat("fi-FI", {
      timeZone: "Europe/Helsinki",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(timeObj);
  } catch (error) {
    return "0";
  }
};

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

    // MITTATULOKSET-TAULU
    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: data,
      }),
    );

    // SENSORIT-TAULU
    // sensorId:string, sensorName:string, measurementDates:set<string>
    await dynamodb.send(
      new UpdateCommand({
        TableName: sensorsTableName,
        Key: {
          sensorId: data.sensorId,
        },
        UpdateExpression:
          "SET sensorName = :sensorName ADD measurementDates :date ",
        ExpressionAttributeValues: {
          ":date": new Set([convertUnixTimestamp(data.timeStamp)]),
          ":sensorName": data.sensorName,
        },
      }),
    );

    // RAJA-ARVOJEN TARKISTUS
    const limits = await dynamodb.send(
      new GetCommand({
        TableName: limitsTableName,
        Key: {
          sensorId: data.sensorId,
        },
      }),
    );
    if (limits.Item) {
      // raja-arvot olemassa
      const minLimit = limits.Item?.minTemperature;
      const maxLimit = limits.Item?.maxTemperature;
      if (data.temperature > maxLimit || data.temperature < minLimit) {
        await sendEmail(
          "HÄLYTYS",
          `Lämpötila ${data.temperature} °C on raja-arvojen ${minLimit} °C - ${maxLimit} °C ulkopuolella. (${data.sensorName} #${data.sensorId})`,
        );
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Mittaustulos tallennettu onnistuneesti.",
      }),
    };
  } catch (error) {
    console.log("..", error);
    return handleError(error);
  }
};

// /measurements/{sensorId} GET
export const getAllMeasurements = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    // HAETAAN MITTAUSTULOKSET ANNETULLE SENSORILLE TAI HAETAAN SENSORS-TAULUSTA ENSIMMÄINEN SENSORI
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
      }),
    );
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sensorId: sensorId, measurements: output.Items }),
    };
  } catch (error) {
    return handleError(error);
  }
};
