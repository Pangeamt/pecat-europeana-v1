import { HttpError } from "./http-error";

// USER is a restricted "translator/reviewer" role: it can only work the
// documents it's assigned to (see buildDocumentScopeWhere /
// buildProjectScopeWhere) and has no access to workspace-wide assets (TMs,
// glossaries, profiles) or to creating projects/documents. Call this at the
// top of any service function reachable by an end user for those assets.
export function assertWorkspaceAssetAccess(actorUser) {
  if (String(actorUser?.role || "").toUpperCase() === "USER") {
    throw new HttpError(
      403,
      "Your role does not have access to this resource",
    );
  }
}
