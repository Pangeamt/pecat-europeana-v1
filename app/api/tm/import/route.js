import { requireAuthUser } from "../../../../modules/shared/auth";
import { toErrorResponse } from "../../../../modules/shared/http";
import { importTmFromFilesService } from "../../../../modules/tm/service";
import { tmImportFormSchema } from "../../../../modules/tm/schemas";

export const POST = async (req) => {
  try {
    const user = await requireAuthUser();
    const formData = await req.formData();
    const files = formData.getAll("file");
    const parsedForm = await tmImportFormSchema.validateAsync({
      tmId: formData.get("tm"),
    });
    const tmId = parsedForm.tmId || 0;
    const data = await importTmFromFilesService({
      files,
      tmId,
      userEmail: user.email,
    });
    return Response.json({ status: "success", data });
  } catch (error) {
    return toErrorResponse(error);
  }
};
