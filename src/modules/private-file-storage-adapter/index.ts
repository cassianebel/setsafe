import { e2eState } from "@/test-support/e2e-state";

export interface PublishedFile {
  productionId: string;
  resourceId: string;
  versionId: string;
  content: ReadableStream<Uint8Array>;
  contentType: string;
}

export interface AuthorizedFileStream {
  content: ReadableStream<Uint8Array>;
  contentType: string;
}

function notImplemented(operation: string): never {
  const error = new Error(`${operation} is not implemented`);
  error.name = "NotImplementedError";
  throw error;
}

export function storePublishedFile(file: PublishedFile): Promise<string> {
  void file;
  return notImplemented("storePublishedFile");
}

export function streamAuthorizedFile(
  productionId: string,
  resourceId: string,
  versionId: string,
): Promise<AuthorizedFileStream> {
  if (process.env.SETSAFE_E2E_TEST_MODE !== "1") {
    return notImplemented("streamAuthorizedFile");
  }

  const resource = e2eState.resources.find(
    (candidate) =>
      candidate.productionId === productionId && candidate.id === resourceId,
  );
  const version = resource?.versions.find(
    (candidate) => candidate.id === versionId,
  );
  if (!version) {
    const error = new Error("The published version was not found.");
    error.name = "ResourceNotFoundError";
    throw error;
  }

  const bytes = new TextEncoder().encode(version.content);
  const content = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  return Promise.resolve({ content, contentType: version.contentType });
}
