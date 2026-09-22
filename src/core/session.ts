export interface SessionSnapshot {
  readonly credential: string | undefined;
  readonly gameAuthToken: string | undefined;
  readonly masterVersion: string | undefined;
}

export class ApiSession {
  private credential: string | undefined;
  private gameAuthToken: string | undefined;
  private masterVersion: string | undefined;

  constructor(initial: Partial<SessionSnapshot> = {}) {
    this.credential = initial.credential;
    this.gameAuthToken = initial.gameAuthToken;
    this.masterVersion = initial.masterVersion;
  }

  get snapshot(): SessionSnapshot {
    return {
      credential: this.credential,
      gameAuthToken: this.gameAuthToken,
      masterVersion: this.masterVersion,
    };
  }

  get credentialValue(): string | undefined {
    return this.credential;
  }

  get gameAuthTokenValue(): string | undefined {
    return this.gameAuthToken;
  }

  get masterVersionValue(): string | undefined {
    return this.masterVersion;
  }

  setCredential(credential: string): void {
    this.credential = credential;
  }

  setGameAuthToken(gameAuthToken: string): void {
    this.gameAuthToken = gameAuthToken;
  }

  setMasterVersion(masterVersion: string): void {
    this.masterVersion = masterVersion;
  }

  replaceCredentialAfterMigration(credential: string): void {
    this.credential = credential;
    this.gameAuthToken = undefined;
    this.masterVersion = undefined;
  }
}
