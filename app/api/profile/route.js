import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { updateProfileSchema } from "@/modules/users/schemas";
import { updateProfileService } from "@/modules/users/service";

export const PATCH = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await updateProfileSchema.validateAsync(body);
    const result = await updateProfileService(actorUser, payload);
    return NextResponse.json({ status: "success", ...result }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to update profile");
  }
};
