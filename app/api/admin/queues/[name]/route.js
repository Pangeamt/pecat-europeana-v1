import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  actOnQueueJobService,
  listQueueJobsQuerySchema,
  listQueueJobsService,
  queueJobActionSchema,
} from "@/modules/queues";

export const GET = async (req, { params }) => {
  try {
    const { name } = await params;
    const actorUser = await requireAuthUser();
    const { searchParams } = new URL(req.url);
    const query = await listQueueJobsQuerySchema.validateAsync({
      state: searchParams.get("state") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });
    const result = await listQueueJobsService({ name, ...query }, actorUser);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to list queue jobs");
  }
};

export const POST = async (req, { params }) => {
  try {
    const { name } = await params;
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await queueJobActionSchema.validateAsync(body);
    const result = await actOnQueueJobService({ name, ...payload }, actorUser);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to run queue action");
  }
};
