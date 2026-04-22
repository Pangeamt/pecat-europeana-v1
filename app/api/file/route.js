import { toErrorResponse } from "@/modules/shared";
import { fileDownloadQuerySchema } from "@/modules/files/schemas";
import { buildProjectDownloadService } from "@/modules/files/service";

export const GET = async (req) => {
  try {
    const { uuid, projectId } = await fileDownloadQuerySchema.validateAsync(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const fileResponse = await buildProjectDownloadService({ uuid, projectId });
    return new Response(fileResponse.body, { headers: fileResponse.headers });
  } catch (error) {
    return toErrorResponse(error);
  }
};
