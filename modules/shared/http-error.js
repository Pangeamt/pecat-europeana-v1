export class HttpError extends Error {
  // `data` (optional): facts behind the error the client shows in its own
  // words and language (e.g. how many segments are still pending).
  constructor(status, message, code = null, data = null) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code || defaultCodeForStatus(status);
    this.data = data;
  }
}

function defaultCodeForStatus(status) {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "UNPROCESSABLE_ENTITY";
    default:
      return status >= 500 ? "INTERNAL_ERROR" : "ERROR";
  }
}
