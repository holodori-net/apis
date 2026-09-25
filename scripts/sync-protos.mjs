import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const descriptorRelativePath = "descriptor-set.pb";
const manifestRelativePath = "manifest.json";
const destinationDescriptor = join(
  rootDirectory,
  "proto",
  descriptorRelativePath,
);
const destinationMetadata = join(
  rootDirectory,
  "proto",
  "descriptor-set.source.json",
);

try {
  const options = parseArguments(process.argv.slice(2));
  const upstreamDirectory = resolve(options.upstream);
  const sourceDescriptor = join(upstreamDirectory, descriptorRelativePath);
  const sourceManifest = join(upstreamDirectory, manifestRelativePath);
  assertContainedPath(upstreamDirectory, sourceDescriptor);
  assertContainedPath(upstreamDirectory, sourceManifest);

  if (!existsSync(sourceDescriptor)) {
    throw new Error(`descriptor not found: ${sourceDescriptor}`);
  }
  if (!existsSync(sourceManifest)) {
    throw new Error(`manifest not found: ${sourceManifest}`);
  }
  if (!lstatSync(sourceDescriptor).isFile()) {
    throw new Error(`descriptor must be a regular file: ${sourceDescriptor}`);
  }
  if (!lstatSync(sourceManifest).isFile()) {
    throw new Error(`manifest must be a regular file: ${sourceManifest}`);
  }

  const manifest = JSON.parse(readFileSync(sourceManifest, "utf8"));
  const versionName = manifest.app?.versionName;
  const versionCode = manifest.app?.versionCode;
  if (
    typeof versionName !== "string" ||
    !/^[0-9A-Za-z][0-9A-Za-z._+-]*$/.test(versionName)
  ) {
    throw new Error("manifest.app.versionName has an invalid format");
  }
  if (!Number.isSafeInteger(versionCode) || versionCode < 0) {
    throw new Error("manifest.app.versionCode must be a non-negative integer");
  }

  const commit = options.commit ?? getDescriptorCommit(upstreamDirectory);
  if (!/^[0-9a-f]{40}$/i.test(commit)) {
    throw new Error("descriptor commit must be a full 40-character Git SHA");
  }
  const actualCommit = getDescriptorCommit(upstreamDirectory);
  if (actualCommit.toLowerCase() !== commit.toLowerCase()) {
    throw new Error(
      `provided commit ${commit} is not the last commit touching ${descriptorRelativePath} (${actualCommit})`,
    );
  }

  const sha256 = createHash("sha256")
    .update(readFileSync(sourceDescriptor))
    .digest("hex");
  const metadata = {
    schemaVersion: 1,
    repository: "holodori-net/android-protos",
    commit: commit.toLowerCase(),
    versionName,
    versionCode,
    sha256,
  };

  mkdirSync(dirname(destinationDescriptor), { recursive: true });
  replaceFileIfChanged(sourceDescriptor, destinationDescriptor);
  replaceJsonIfChanged(destinationMetadata, metadata);
  console.log(
    `Synchronized android-protos ${versionName} (${versionCode}) at ${metadata.commit.slice(0, 12)}; descriptor sha256 ${sha256}.`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown error";
  console.error(`proto sync failed: ${message}`);
  process.exitCode = 1;
}

function parseArguments(args) {
  let upstream;
  let commit;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--upstream") {
      upstream = args[index + 1];
      index += 1;
    } else if (argument === "--commit") {
      commit = args[index + 1];
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      console.log(
        "Usage: pnpm protos:sync --upstream <android-protos-checkout> [--commit <descriptor-commit>]",
      );
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!upstream) {
    throw new Error("--upstream <android-protos-checkout> is required");
  }
  return {
    upstream: isAbsolute(upstream)
      ? upstream
      : resolve(process.cwd(), upstream),
    commit,
  };
}

function getDescriptorCommit(upstreamDirectory) {
  return execFileSync(
    "git",
    [
      "-C",
      upstreamDirectory,
      "log",
      "-1",
      "--format=%H",
      "--",
      descriptorRelativePath,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
}

function assertContainedPath(directory, path) {
  const relativePath = relative(directory, path);
  if (
    relativePath === "" ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new Error(`path escapes upstream checkout: ${path}`);
  }
}

function replaceFileIfChanged(source, destination) {
  if (
    existsSync(destination) &&
    createHash("sha256").update(readFileSync(source)).digest("hex") ===
      createHash("sha256").update(readFileSync(destination)).digest("hex")
  ) {
    return;
  }
  const temporaryPath = `${destination}.tmp`;
  try {
    copyFileSync(source, temporaryPath);
    renameSync(temporaryPath, destination);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}

function replaceJsonIfChanged(destination, value) {
  const content = `${JSON.stringify(value, null, 2)}\n`;
  if (
    existsSync(destination) &&
    readFileSync(destination, "utf8") === content
  ) {
    return;
  }
  const temporaryPath = `${destination}.tmp`;
  try {
    writeFileSync(temporaryPath, content);
    renameSync(temporaryPath, destination);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}
