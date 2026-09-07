import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { getQueuesOverviewService } from "@/modules/queues";

export const GET = async () => {
  try {
    const actorUser = await requireAuthUser();
    const overview = await getQueuesOverviewService(actorUser);
    return NextResponse.json(overview, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to get queues overview");
  }
};
