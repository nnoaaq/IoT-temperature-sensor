import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { CustomError, handleError } from "./error";
import { documentClient } from "./database";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const dynamodb = documentClient;
const tableName = process.env.DYNAMODB_TABLE_NAME_LIMITS;

// /sensor/{sensorId} GET
export const getLimitsBySensor = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    // haetaan sensorId - perusteella raja-arvot
    // TemperatureLimitTable
    // sensorId:string
    // maxTemperature:number, minTemperature:number
    const sensorId = event.pathParameters?.sensorId;
    if (!sensorId) throw new CustomError(404, { message: "SensorId puuttuu." }); // ei sensorIdtä
    if (!tableName)
      throw new CustomError(404, { message: "Tarkista ympäristomuuttujat" });
    const output = await dynamodb.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          sensorId: sensorId,
        },
      }),
    );
    if (!output.Item)
      throw new CustomError(404, { message: "Raja-arvoja ei tallennettu." });
    return {
      statusCode: 200,
      body: JSON.stringify(output.Item),
    };
  } catch (error) {
    return handleError(error);
  }
};

// /sensor POST
export const createSensorLimits = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    // sensorin raja-arvojen lisäys / päivitys
    // jos arvoja ei tallennettu > luodaan
    // jos arvot tallennettu > over-ride
    // sensorId:string
    // maxTemperature:number, minTemperature:number
    const { sensorId, ...fields } = JSON.parse(event.body as string);
    if (!sensorId)
      throw new CustomError(404, { message: "Tarkista sensorin tunniste." });
    console.log({
      TableName: tableName,
      Item: {
        sensorId: sensorId,
        ...fields,
      },
      ReturnValues: "ALL_NEW",
    });
    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          sensorId: sensorId,
          ...fields,
        },
        ReturnValues: "ALL_OLD",
      }),
    );
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Raja-arvot tallennettu.",
      }),
    };
  } catch (error) {
    console.log("VIRHE", error);
    return handleError(error);
  }
};

// /sensor/{sensorId} PUT

export const updateSensorLimits = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const sensorId = event.pathParameters?.sensorId;
    const body = JSON.parse(event.body as string);
    const temperatureKey = Object.keys(body)[0]; // maxTemperature / minTemperature riippuen kumpi annettu
    const value = body[temperatureKey as keyof typeof body]; // sen arvo
    const updateExpression = `SET ${temperatureKey} = :value`;
    if (!sensorId)
      throw new CustomError(404, { message: "Sensorin tunniste vaaditaan." });

    const output = dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          sensorId: sensorId,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: {
          ":value": value,
        },
        ReturnValues: "ALL_NEW",
      }),
    );
    return {
      statusCode: 200,
      body: JSON.stringify((await output).Attributes),
    };
  } catch (error) {
    return handleError(error);
  }
};
