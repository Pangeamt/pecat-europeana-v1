import { HttpError } from '../shared/http-error';
import { DOCUMENT_STATUS } from '../../lib/document-status';
import { findDocumentForActor, findTusByDocumentId } from './repository';
import { exportSdlxliffForDownload } from './sdlxliff-service';

export async function exportDocumentAsSdlxliffService(documentId, actorUser) {
  if (!documentId) {
    throw new HttpError(400, 'documentId is required');
  }

  const document = await findDocumentForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, 'Document not found');
  }

  if (document.extension !== 'sdlxliff') {
    throw new HttpError(
      400,
      `Document is not an SDLXLIFF document. Current format: ${document.extension}`
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
    const sdlxliffContent = await exportSdlxliffForDownload(document.filePath, tus);
    return sdlxliffContent;
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
      score: tu.translationScorePercent,
      review: tu.reviewLiteral,
      tmInfo: tu.tmInfo,
      glossaryInfo: tu.glossaryInfo,
      visible: tu.visible,
      hiddenBy: tu.hiddenBy,
    })),
  };
}
