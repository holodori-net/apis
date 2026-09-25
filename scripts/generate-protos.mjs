import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { create, fromBinary } from "@bufbuild/protobuf";
import {
  CodeGeneratorRequestSchema,
  FileDescriptorSetSchema,
} from "@bufbuild/protobuf/wkt";
import { protoCamelCase } from "@bufbuild/protobuf/reflect";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const descriptorPath = join(rootDirectory, "proto", "descriptor-set.pb");
const descriptorMetadataPath = join(
  rootDirectory,
  "proto",
  "descriptor-set.source.json",
);
const outputDirectory = join(rootDirectory, "src", "protos", "gen");
const checkOnly = process.argv.includes("--check");

const apiFiles = [
  "account_migration",
  "asset",
  "auth",
  "card",
  "chase",
  "circuit",
  "combo_card_game",
  "cooking_puzzle",
  "event",
  "exchange",
  "gacha",
  "gift",
  "health",
  "home",
  "jump_rope",
  "live",
  "marathon",
  "master",
  "membership",
  "multi_game",
  "music",
  "music_creative_chart",
  "notice",
  "notification",
  "park_permanence",
  "profile",
  "shop",
  "splash_ball",
  "system",
  "user",
].map((name) => `rpc/api/${name}.gen.proto`);

const descriptorData = readFileSync(descriptorPath);
verifyDescriptorMetadata(descriptorData);
const descriptorSet = fromBinary(FileDescriptorSetSchema, descriptorData);
for (const descriptor of descriptorSet.file) normalizeJsonNames(descriptor);
const descriptorsByName = new Map(
  descriptorSet.file.map((descriptor) => [descriptor.name, descriptor]),
);
const selectedNames = new Set();
const visitingNames = new Set();

for (const name of apiFiles) selectWithDependencies(name);

const selectedDescriptors = [...selectedNames].map((name) => {
  const descriptor = descriptorsByName.get(name);
  if (!descriptor) throw new Error(`missing descriptor ${name}`);
  return descriptor;
});
const request = create(CodeGeneratorRequestSchema, {
  fileToGenerate: [...selectedNames],
  parameter: "target=ts,import_extension=js",
});
// Keep the parsed descriptor messages intact. Treating them as initializers
// would turn absent proto2 scalar fields into explicitly present defaults.
request.protoFile = selectedDescriptors;
const response = loadGenerator().run(request);
if (response.error) throw new Error(response.error);

const generatedFiles = new Map();
for (const file of response.file) {
  if (!file.name) throw new Error("generated protobuf file has no name");
  assertRelativePath(file.name);
  generatedFiles.set(file.name, `${file.content.trimEnd()}\n`);
}

if (checkOnly) {
  checkGeneratedFiles(generatedFiles);
  console.log(
    `Generated protos are current (${generatedFiles.size} files from ${selectedDescriptors.length} descriptors).`,
  );
} else {
  replaceGeneratedFiles(generatedFiles);
  console.log(
    `Generated ${generatedFiles.size} protobuf files from ${selectedDescriptors.length} descriptors.`,
  );
}

function selectWithDependencies(name) {
  if (selectedNames.has(name)) return;
  if (visitingNames.has(name)) {
    throw new Error(`cyclic protobuf dependency involving ${name}`);
  }
  const descriptor = descriptorsByName.get(name);
  if (!descriptor) throw new Error(`missing descriptor ${name}`);
  visitingNames.add(name);
  for (const dependency of descriptor.dependency) {
    selectWithDependencies(dependency);
  }
  visitingNames.delete(name);
  selectedNames.add(name);
}

function verifyDescriptorMetadata(descriptorData) {
  const metadata = JSON.parse(readFileSync(descriptorMetadataPath, "utf8"));
  if (metadata.schemaVersion !== 1) {
    throw new Error("unsupported descriptor source metadata schema");
  }
  if (metadata.repository !== "holodori-net/android-protos") {
    throw new Error("descriptor source metadata has an invalid repository");
  }
  if (!/^[0-9a-f]{40}$/.test(metadata.commit)) {
    throw new Error("descriptor source metadata has an invalid commit");
  }
  if (
    typeof metadata.versionName !== "string" ||
    !/^[0-9A-Za-z][0-9A-Za-z._+-]*$/.test(metadata.versionName) ||
    !Number.isSafeInteger(metadata.versionCode) ||
    metadata.versionCode < 0
  ) {
    throw new Error("descriptor source metadata has an invalid app version");
  }
  if (!/^[0-9a-f]{64}$/.test(metadata.sha256)) {
    throw new Error("descriptor source metadata has an invalid SHA-256");
  }
  const actualSha256 = createHash("sha256")
    .update(descriptorData)
    .digest("hex");
  if (metadata.sha256 !== actualSha256) {
    throw new Error(
      "descriptor-set.pb does not match descriptor-set.source.json",
    );
  }
}

function normalizeJsonNames(file) {
  for (const field of file.extension) normalizeFieldJsonName(field);
  for (const message of file.messageType) normalizeMessageJsonNames(message);
}

function normalizeMessageJsonNames(message) {
  for (const field of [...message.field, ...message.extension]) {
    normalizeFieldJsonName(field);
  }
  for (const nested of message.nestedType) normalizeMessageJsonNames(nested);
}

function normalizeFieldJsonName(field) {
  if (!Object.hasOwn(field, "jsonName")) {
    field.jsonName = protoCamelCase(field.name);
  }
}

function loadGenerator() {
  const require = createRequire(import.meta.url);
  const packageDirectory = dirname(
    require.resolve("@bufbuild/protoc-gen-es/package.json"),
  );
  const generatorPath = join(
    packageDirectory,
    "dist",
    "cjs",
    "src",
    "protoc-gen-es-plugin.js",
  );
  return require(generatorPath).protocGenEs;
}

function replaceGeneratedFiles(files) {
  assertOutputDirectory();
  rmSync(outputDirectory, { force: true, recursive: true });
  for (const [name, content] of files) {
    const outputPath = join(outputDirectory, name);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, content);
  }
}

function checkGeneratedFiles(files) {
  const actualNames = existsSync(outputDirectory)
    ? listFiles(outputDirectory).map((path) =>
        relative(outputDirectory, path).split(sep).join("/"),
      )
    : [];
  const expectedNames = [...files.keys()].sort();
  actualNames.sort();
  const stale = [];

  for (const name of new Set([...actualNames, ...expectedNames])) {
    const expected = files.get(name);
    const path = join(outputDirectory, name);
    const actual = existsSync(path) ? readFileSync(path, "utf8") : undefined;
    if (actual !== expected) stale.push(name);
  }

  if (stale.length > 0) {
    throw new Error(
      `generated protos are stale; run pnpm protos:generate (${stale.join(", ")})`,
    );
  }
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function assertRelativePath(path) {
  if (
    path.length === 0 ||
    path.startsWith("/") ||
    path.split("/").some((component) => component === "..")
  ) {
    throw new Error(`unsafe generated protobuf path: ${path}`);
  }
}

function assertOutputDirectory() {
  const expected = join(rootDirectory, "src", "protos", "gen");
  if (
    outputDirectory !== expected ||
    !outputDirectory.startsWith(rootDirectory)
  ) {
    throw new Error(
      `refusing to replace unexpected directory ${outputDirectory}`,
    );
  }
}
