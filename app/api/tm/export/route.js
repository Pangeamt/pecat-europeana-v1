import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  exportTmAsXmlService,
  tmExportQuerySchema,
} from "@/modules/memory/tm";

export const GET = async (req) => {
  try {
    const actorUser = await requireAuthUser();

    const { searchParams } = new URL(req.url);
    const { tmId, format } = await tmExportQuerySchema.validateAsync({
      tmId: searchParams.get("tmId"),
      format: searchParams.get("format") ?? undefined,
    });
    const tmxContent = await exportTmAsXmlService(tmId, actorUser, format);

    return new Response(tmxContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="${tmId}.${format}"`,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
};
