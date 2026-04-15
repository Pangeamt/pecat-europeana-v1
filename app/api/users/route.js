import { NextResponse } from "next/server";
import { requireAuthUser } from "../../../modules/shared/auth";
import { toErrorResponse } from "../../../modules/shared/http";
import { createUserSchema, updateUserSchema } from "../../../modules/users/schemas";
import {
  createUserService,
  listUsersService,
  updateUserService,
} from "../../../modules/users/service";

export const GET = async () => {
  try {
    await requireAuthUser();
    const users = await listUsersService();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to get users");
  }
};

export const POST = async (req) => {
  try {
    await requireAuthUser();
    const body = await req.json();
    const payload = await createUserSchema.validateAsync(body);
    const newUser = await createUserService(payload);
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to create user");
  }
};

export const PATCH = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await updateUserSchema.validateAsync(body);
    await updateUserService(actorUser, payload);
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
