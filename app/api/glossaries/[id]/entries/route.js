import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  glossaryEntriesQuerySchema,
  listGlossaryEntriesService,
} from "@/modules/memory/glossary";

export const GET = async (req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const { searchParams } = new URL(req.url);
    const query = await glossaryEntriesQuerySchema.validateAsync({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      filter: searchParams.get("filter"),
    });
    const data = await listGlossaryEntriesService(id, actorUser, query);
    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
};
