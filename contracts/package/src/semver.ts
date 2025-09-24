export function parseSemver(version: string): {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
  build: string;
} | null {
  const match = version.match(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
  );
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] ? match[4].split(".") : [],
    build: match[5] || "",
  };
}

export function isValidSemver(version: string): boolean {
  return parseSemver(version) !== null;
}

export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa) throw new Error(`Invalid semver string: ${a}`);
  if (!pb) throw new Error(`Invalid semver string: ${b}`);

  if (pa.major !== pb.major) return pa.major > pb.major ? 1 : -1;
  if (pa.minor !== pb.minor) return pa.minor > pb.minor ? 1 : -1;
  if (pa.patch !== pb.patch) return pa.patch > pb.patch ? 1 : -1;
  if (pa.prerelease.length === 0 && pb.prerelease.length > 0) return 1;
  if (pa.prerelease.length > 0 && pb.prerelease.length === 0) return -1;
  if (pa.prerelease.length > 0 && pb.prerelease.length > 0) {
    const len = Math.min(pa.prerelease.length, pb.prerelease.length);
    for (let i = 0; i < len; i++) {
      const ai = pa.prerelease[i];
      const bi = pb.prerelease[i];
      const anum = /^\d+$/.test(ai);
      const bnum = /^\d+$/.test(bi);
      if (anum && !bnum) return -1;
      if (!anum && bnum) return 1;
      if (anum && bnum) {
        const na = parseInt(ai, 10);
        const nb = parseInt(bi, 10);
        if (na !== nb) return na > nb ? 1 : -1;
      } else {
        if (ai !== bi) return ai > bi ? 1 : -1;
      }
    }
    if (pa.prerelease.length !== pb.prerelease.length)
      return pa.prerelease.length > pb.prerelease.length ? 1 : -1;
  }
  return 0;
}
