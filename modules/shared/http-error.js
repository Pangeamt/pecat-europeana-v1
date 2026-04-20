export class HttpError extends Error {
  constructor(status, message, code = null) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code || defaultCodeForStatus(status);
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
