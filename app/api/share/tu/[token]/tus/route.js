import { toErrorResponse } from "@/modules/shared";
import {
  listTusByShareTokenService,
  updateTuStatusByShareTokenService,
  updateTuSchema,
} from "@/modules/tus";
import {
  appendTranslationUnitByShareTokenService,
  appendTuSchema,
} from "@/modules/memory/tu";

// Public "share as translator" link — no requireAuthUser(), the token is
// the authorization (mirrors app/api/file/route.js's uuid-only bypass).
export const GET = async (_req, { params }) => {
  try {
    const { token } = await params;
    const result = await listTusByShareTokenService(token);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const POST = async (req, { params }) => {
  try {
    const { token } = await params;
    const body = await req.json();
    const payload = await appendTuSchema.validateAsync(body);
    const result = await appendTranslationUnitByShareTokenService(
      token,
      payload,
    );
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const PATCH = async (req, { params }) => {
  try {
    const { token } = await params;
    const body = await req.json();
    const payload = await updateTuSchema.validateAsync(body);
    const result = await updateTuStatusByShareTokenService(token, payload);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
