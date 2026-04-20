import { NextResponse } from "next/server";
import { HttpError } from "./http-error";

export function toErrorResponse(
  error,
  fallbackMessage = "Internal server error",
) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.status },
    );
  }

  if (error?.isJoi) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: error.message,
        details: error.details?.map((d) => ({
          path: d.path,
          message: d.message,
        })),
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      code: "INTERNAL_ERROR",
      message: error?.message || fallbackMessage,
    },
    { status: 500 },
  );
}
