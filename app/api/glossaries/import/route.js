import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  glossaryImportFormSchema,
  importGlossaryFromFilesService,
} from "@/modules/memory/glossary";

export const POST = async (req) => {
  try {
    const user = await requireAuthUser();
    const formData = await req.formData();
    const files = formData.getAll("file");
    const parsedForm = await glossaryImportFormSchema.validateAsync({
      glossaryId: formData.get("glossary"),
      name: formData.get("name"),
      project: formData.get("project"),
      domain: formData.get("domain"),
      source: formData.get("source"),
      target: formData.get("target"),
    });

    const glossaryId = parsedForm.glossaryId || 0;
    const data = await importGlossaryFromFilesService({
      files,
      glossaryId,
      form: parsedForm,
      actorUser: user,
    });
    return Response.json({ status: "success", data });
  } catch (error) {
    return toErrorResponse(error);
  }
};
