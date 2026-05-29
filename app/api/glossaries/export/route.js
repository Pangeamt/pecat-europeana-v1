import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  exportGlossaryAsXlsxService,
  glossaryExportQuerySchema,
} from "@/modules/memory/glossary";

export const GET = async (req) => {
  try {
    const actorUser = await requireAuthUser();

    const { searchParams } = new URL(req.url);
    const { glossaryId, format } = await glossaryExportQuerySchema.validateAsync({
      glossaryId: searchParams.get("glossaryId"),
      format: searchParams.get("format") ?? undefined,
    });
    const xlsxContent = await exportGlossaryAsXlsxService(
      glossaryId,
      actorUser,
      format,
    );

    return new Response(xlsxContent, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${glossaryId}.${format}"`,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
};
