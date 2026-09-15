export class CustomError extends Error {
  constructor(
    public statusCode: number,
    message: Record<string, unknown> = {},
  ) {
    super(JSON.stringify(message));
  }
}
export const handleError = (error: unknown) => {
  if (error instanceof CustomError) {
    return {
      statusCode: error.statusCode,
      body: error.message,
    };
  }
  return {
    statusCode: 500,
    body: "Virhe",
  };
};
