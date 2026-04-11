export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export const NotFound = (msg = "not found") => new HttpError(404, "not_found", msg);
export const Unauthorized = (msg = "unauthorized") => new HttpError(401, "unauthorized", msg);
export const BadRequest = (msg: string, fields?: Record<string, string[]>) =>
  new HttpError(400, "bad_request", msg, fields);
