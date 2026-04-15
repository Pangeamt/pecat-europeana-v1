import { requireAuthUser } from "../../../../modules/shared/auth";
import { toErrorResponse } from "../../../../modules/shared/http";
import { exportTmAsXmlService } from "../../../../modules/tm/service";
import { tmExportQuerySchema } from "../../../../modules/tm/schemas";

export const GET = async (req) => {
  try {
    await requireAuthUser();

    const { searchParams } = new URL(req.url);
    const { tmId: tmID } = await tmExportQuerySchema.validateAsync({
      tmId: searchParams.get("tmId"),
    });
    const tmxContent = await exportTmAsXmlService(tmID);
    return new Response(tmxContent, {
        status: 200,
        headers: {
          "Content-Type": "application/xml",
          "Content-Disposition": `attachment; filename="${tmID}.tmx"`,
        },
      });

  } catch (error) {
    return toErrorResponse(error);
  }
};
