import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  importTmFromFilesService,
  tmImportFormSchema,
} from "@/modules/memory/tm";

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
      actorUser: user,
    });
    return Response.json({ status: "success", data });
  } catch (error) {
    return toErrorResponse(error);
  }
};
