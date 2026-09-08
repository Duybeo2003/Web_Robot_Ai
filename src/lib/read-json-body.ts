import "server-only";

export class RequestBodyError extends Error {
  constructor(
    public readonly status: 400 | 413,
    message: string,
  ) {
    super(message);
    this.name = "RequestBodyError";
  }
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (!Number.isInteger(parsedLength) || parsedLength < 0) {
      throw new RequestBodyError(400, "Content-Length không hợp lệ.");
    }
    if (parsedLength > maxBytes) {
      throw new RequestBodyError(413, "Nội dung yêu cầu vượt quá giới hạn.");
    }
  }

  if (!request.body) throw new RequestBodyError(400, "Thiếu nội dung yêu cầu.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new RequestBodyError(413, "Nội dung yêu cầu vượt quá giới hạn.");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new RequestBodyError(400, "JSON không hợp lệ.");
  }
}
