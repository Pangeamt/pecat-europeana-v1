import { HttpError } from '../shared/http-error';
import { DOCUMENT_STATUS } from '../../lib/document-status';
import { findDocumentForActor, findTusByDocumentId } from './repository';
import { isSpliceFormat } from '../../lib/utils';
import { exportSdlxliffWithReport, skippedSegments } from './sdlxliff-service';

// Returns { text, skipped }: `skipped` = segments with a translation that were
// NOT written (tags that do not match the source, rows imported before inline
// tags existed...). The route sends it as X-Pecat-Skipped-Segments so the UI
// can tell the reviewer; the gate itself (writer.js) is unchanged.
export async function exportDocumentAsSdlxliffService(documentId, actorUser) {
  if (!documentId) {
    throw new HttpError(400, 'documentId is required');
  }

  const document = await findDocumentForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, 'Document not found');
  }

  if (!isSpliceFormat(document.extension)) {
    throw new HttpError(
      400,
      `Document is not an SDLXLIFF/XLIFF document. Current format: ${document.extension}`
    );
  }

  if (document.status !== DOCUMENT_STATUS.READY) {
    throw new HttpError(
      409,
      'Document is not ready yet. Wait until background processing finishes.'
    );
  }

  const tus = await findTusByDocumentId(documentId);
  if (!tus || tus.length === 0) {
    throw new HttpError(404, 'No translation units found in document');
  }

  try {
    const { text, report } = await exportSdlxliffWithReport(document.filePath, tus);
    return { text, skipped: skippedSegments(report) };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(500, `Failed to generate SDLXLIFF export: ${error.message}`);
  }
}

export async function exportDocumentAsJsonService(documentId, actorUser) {
  if (!documentId) {
    throw new HttpError(400, 'documentId is required');
  }

  const document = await findDocumentForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, 'Document not found');
  }

  if (document.status !== DOCUMENT_STATUS.READY) {
    throw new HttpError(
      409,
      'Document is not ready yet. Wait until background processing finishes.'
    );
  }

  const tus = await findTusByDocumentId(documentId);

  return {
    documentName: document.filename,
    sourceLanguage: document.sourceLanguage,
    targetLanguage: document.targetLanguage,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    status: document.status,
    totalUnits: tus.length,
    units: tus.map((tu) => ({
      id: tu.id,
      externalId: tu.externalId,
      source: tu.srcLiteral,
      target: tu.translatedLiteral,
      status: tu.Status,
      score: tu.mtqeV2Score,
      review: tu.reviewLiteral,
      tmInfo: tu.tmInfo,
      glossaryInfo: tu.glossaryInfo,
      visible: tu.visible,
      hiddenBy: tu.hiddenBy,
    })),
  };
}
