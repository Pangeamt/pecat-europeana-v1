import { NextResponse } from "next/server";
import { HttpError } from "./http-error";

export function toErrorResponse(error, fallbackMessage = "Internal server error") {
  if (error instanceof HttpError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  if (error?.isJoi) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json(
    { message: error?.message || fallbackMessage },
    { status: 500 }
  );
}

