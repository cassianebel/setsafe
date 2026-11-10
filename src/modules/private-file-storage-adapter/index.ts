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
  void productionId;
  void resourceId;
  void versionId;
  return notImplemented("streamAuthorizedFile");
}
