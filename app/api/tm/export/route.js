import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  exportTmAsXmlService,
  tmExportQuerySchema,
} from "@/modules/memory/tm";

export const GET = async (req) => {
  try {
    const actorUser = await requireAuthUser();

    const { searchParams } = new URL(req.url);
    const { tmId } = await tmExportQuerySchema.validateAsync({
      tmId: searchParams.get("tmId"),
    });
    const tmxContent = await exportTmAsXmlService(tmId, actorUser);

    return new Response(tmxContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="${tmId}.tmx"`,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
};
