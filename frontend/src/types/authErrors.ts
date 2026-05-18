export class EmailNotVerifiedError extends Error {
  readonly email: string;

  constructor(email: string) {
    super('Please verify your email before continuing. Check your inbox for the verification link.');
    this.name = 'EmailNotVerifiedError';
    this.email = email;
  }
}

export interface RegisterResult {
  needsEmailVerification: true;
  email: string;
}
