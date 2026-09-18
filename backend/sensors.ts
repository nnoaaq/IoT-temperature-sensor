import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { CustomError, handleError } from "./error";
import { documentClient } from "./database";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

const dynamodb = documentClient;
const tableName = process.env.DYNAMODB_SENSORS_TABLE_NAME;
// /sensors GET
export const getAllSensors = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    // HAETAAN KAIKKI SENSORIT TIETOKANNASTA
    const output = await dynamodb.send(
      new ScanCommand({
        TableName: tableName,
      }),
    );
    if (!output.Items)
      throw new CustomError(404, { message: "Sensoreita ei löytynyt" });
    return {
      statusCode: 200,
      body: JSON.stringify(output.Items),
    };
  } catch (error) {
    return handleError(error);
  }
};
