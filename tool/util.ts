export async function readDependencies(packageJson: any) {
  const dependencies = packageJson.dependencies || {};
  return Object.entries(dependencies).map(([name, versionStr]) => {
    const version = versionStr as string;
    const isNpm5 = /\/typeHash:0x[0-9a-fA-F]{64}$/.test(version);
    if (isNpm5) {
      const parts = version.split("/typeHash:");
      const cleanVersion = parts[0];
      const typeHash = parts[1];
      return {
        name,
        version: cleanVersion,
        isNpm5,
        typeHash,
      };
    } else {
      return {
        name,
        version,
        isNpm5,
      };
    }
  });
}
