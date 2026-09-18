import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { CustomError, handleError } from "./error";
import { documentClient } from "./database";
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { sendEmail } from "./email";

const dynamodb = documentClient;
const tableName = process.env.DYNAMODB_TABLE_NAME;
const limitsTableName = process.env.DYNAMODB_TABLE_NAME_LIMITS;
const privateKey = process.env.PRIVATE_KEY;
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
  // VAADITAAN OMA TOKENI
  if (event.headers?.authorization !== privateKey)
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Et ole tervetullut.",
      }),
    };
  try {
    // tallennetaan mittaustulos
    // sensorId:string VAADITTU, loput kentät valinnaisia
    const measurementId = crypto.randomUUID(); // satunnainen tunniste
    const measurementData = JSON.parse(event.body as string);
    if (!measurementData.sensorId)
      throw new CustomError(404, { message: "Sensorin tunniste vaaditaan." });
    // luodaan uusi mittaustulos
    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          measurementId: measurementId,
          measurementData: measurementData,
        },
      }),
    );
    const sensorLimits = await dynamodb.send(
      new GetCommand({
        TableName: limitsTableName,
        Key: {
          sensorId: measurementData.sensorId,
        },
      }),
    );
    if (sensorLimits.Item) {
      // raja-arvot olemassa
      // lähetetään sähköposti JOS mittaustulos näiden ulkopuolella
      const { maxTemperature, minTemperature } = sensorLimits.Item;
      const { temperature } = measurementData;
      if (temperature > maxTemperature || temperature < minTemperature) {
        await sendEmail(
          "Mittaus raja-arvojen ulkopuolella",
          `<p>Sensorin ${measurementData.sensorName} (${measurementData.sensorId}) lämpötila ${measurementData.temperature} °C raja-arvojen ${minTemperature} °C - ${maxTemperature} °C ulkopuolella.</p>`,
        );
      }
    }
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

// /measurements/ GET
export const getAllMeasurements = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    // haetaan kaikki mittaustulokset
    // aina taulukko []
    const output = await dynamodb.send(
      new ScanCommand({
        TableName: tableName,
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
