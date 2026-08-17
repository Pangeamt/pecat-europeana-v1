import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  createProfileSchema,
  createProfileService,
  listProfilesQuerySchema,
  listProfilesService,
} from "@/modules/profiles";

export const GET = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const { searchParams } = new URL(req.url);
    const query = await listProfilesQuerySchema.validateAsync({
      workspaceId: searchParams.get("workspaceId"),
    });
    const profiles = await listProfilesService(query, actorUser);
    return NextResponse.json({ profiles }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to get profiles");
  }
};

export const POST = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await createProfileSchema.validateAsync(body);
    const profile = await createProfileService(payload, actorUser);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to create profile");
  }
};
