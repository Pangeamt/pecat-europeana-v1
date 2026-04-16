import { Client } from "@opensearch-project/opensearch";
import { HttpError } from "../modules/shared/http-error";

function getOpenSearchConfig() {
  const host = process.env.HOST_OPENSEARCH;
  const auth = process.env.HOST_OPENSEARCH_AUTH;

  if (!host || !auth) {
    throw new HttpError(500, "OpenSearch environment variables are missing");
  }

  const separatorIndex = auth.indexOf(":");
  if (separatorIndex <= 0) {
    throw new HttpError(500, "HOST_OPENSEARCH_AUTH format must be user:password");
  }

  const username = auth.slice(0, separatorIndex);
  const password = auth.slice(separatorIndex + 1);
  const baseURL = host.startsWith("http") ? host : `https://${host}`;

  return { baseURL, username, password };
}

function createClient() {
  const { baseURL, username, password } = getOpenSearchConfig();
  return new Client({
    node: baseURL,
    auth: {
      username,
      password,
    },
  });
}

const opensearchClient = createClient();

function getErrorMessage(error, fallback) {
  const reason = error?.meta?.body?.error?.reason;
  const rootCause = error?.meta?.body?.error?.root_cause?.[0]?.reason;
  return reason || rootCause || error?.message || fallback;
}

function mapAndThrow(error, fallbackMessage = "OpenSearch request failed") {
  if (error instanceof HttpError) {
    throw error;
  }

  if (error?.meta?.statusCode) {
    throw new HttpError(
      error.meta.statusCode,
      getErrorMessage(error, fallbackMessage),
    );
  }

  throw new HttpError(500, getErrorMessage(error, fallbackMessage));
}

export async function searchDocuments(index, queryBody, size = 100) {
  try {
    const response = await opensearchClient.search({
      index,
      body: queryBody,
      size,
    });
    return response?.body ?? response;
  } catch (error) {
    mapAndThrow(error, "Failed to search documents");
  }
}

export async function indexDocument(index, body, id = undefined) {
  try {
    const response = await opensearchClient.index({
      index,
      id,
      body,
      refresh: "wait_for",
    });
    return response?.body ?? response;
  } catch (error) {
    mapAndThrow(error, "Failed to index document");
  }
}

export async function updateDocument(index, id, partialDoc) {
  try {
    const response = await opensearchClient.update({
      index,
      id,
      body: { doc: partialDoc },
      refresh: "wait_for",
    });
    return response?.body ?? response;
  } catch (error) {
    mapAndThrow(error, "Failed to update document");
  }
}

export async function deleteDocument(index, id) {
  try {
    const response = await opensearchClient.delete({
      index,
      id,
      refresh: "wait_for",
    });
    return response?.body ?? response;
  } catch (error) {
    mapAndThrow(error, "Failed to delete document");
  }
}

export async function getDocument(index, id) {
  try {
    const response = await opensearchClient.get({
      index,
      id,
    });
    return response?.body ?? response;
  } catch (error) {
    mapAndThrow(error, "Failed to get document");
  }
}

export async function bulkIndexDocuments(body) {
  try {
    const response = await opensearchClient.bulk({
      body,
      refresh: "wait_for",
    });
    return response?.body ?? response;
  } catch (error) {
    mapAndThrow(error, "Failed to bulk index documents");
  }
}
