import { toErrorResponse } from "@/modules/shared";
import {
  buildProjectDownloadService,
  documentDownloadQuerySchema,
} from "@/modules/extraction";

export const GET = async (req) => {
  try {
    const { uuid, projectId } = await documentDownloadQuerySchema.validateAsync(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const fileResponse = await buildProjectDownloadService({ uuid, projectId });
    return new Response(fileResponse.body, { headers: fileResponse.headers });
  } catch (error) {
    return toErrorResponse(error);
  }
};
