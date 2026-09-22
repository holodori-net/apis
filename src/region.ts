export enum Region {
  Unknown = 0,
  Jp = 1,
  Us = 2,
  As = 3,
}

const REGION_HOSTS: Readonly<Record<number, string>> = {
  [Region.Jp]: "jp.game-hololive-dreams.com",
  [Region.Us]: "us.game-hololive-dreams.com",
  [Region.As]: "as.game-hololive-dreams.com",
};

export type RegionBaseUrlResolver = (region: number) => string | undefined;

export function normalizeBaseUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new TypeError(
      "baseUrl must be an HTTPS origin without credentials or a path",
    );
  }
  return url.toString().replace(/\/$/, "");
}

export function officialBaseUrlForRegion(region: number): string | undefined {
  const host = REGION_HOSTS[region];
  return host === undefined ? undefined : `https://${host}`;
}

export function isOfficialBaseUrl(baseUrl: string): boolean {
  const url = new URL(baseUrl);
  return (
    !url.port &&
    Object.values(REGION_HOSTS).some((host) => url.hostname === host)
  );
}
