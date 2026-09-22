import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { listPresetsService } from "@/modules/profiles";

// DAAIT quality presets a profile can point to (active and available ones).
export const GET = async () => {
  try {
    const actorUser = await requireAuthUser();
    const presets = await listPresetsService(actorUser);
    return NextResponse.json({ presets }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to get DAAIT presets");
  }
};
