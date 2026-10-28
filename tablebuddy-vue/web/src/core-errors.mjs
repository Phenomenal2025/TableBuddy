export class CoreError extends Error {
  constructor(code) {
    super(code);
    this.name = 'CoreError';
    this.code = code;
  }
}
