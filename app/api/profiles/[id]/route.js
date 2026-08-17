import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  deleteProfileService,
  getProfileByIdService,
  updateProfileSchema,
  updateProfileService,
} from "@/modules/profiles";

export const GET = async (_, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const profile = await getProfileByIdService(id, actorUser);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to get profile");
  }
};

export const PATCH = async (req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await updateProfileSchema.validateAsync(body);
    const profile = await updateProfileService(id, payload, actorUser);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to update profile");
  }
};

export const DELETE = async (_, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    await deleteProfileService(id, actorUser);
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete profile");
  }
};
