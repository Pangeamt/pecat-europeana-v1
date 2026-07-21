import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  exportGlossaryAsCsvService,
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
    const csvContent = await exportGlossaryAsCsvService(
      glossaryId,
      actorUser,
      format,
    );

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${glossaryId}.${format}"`,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
};
