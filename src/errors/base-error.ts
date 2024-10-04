export class BaseError extends Error {
  name: string;
  message: string;
  cause: unknown;

  constructor({ name, message, cause }: { name: string; message: string; cause?: unknown }) {
    super();
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}
