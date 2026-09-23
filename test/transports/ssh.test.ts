import assert from "node:assert/strict";
import { test } from "vitest";

import { buildSshForwardArguments } from "../../src/transports/ssh.js";

void test("builds a non-interactive OpenSSH stdio-forward command", () => {
  const args = buildSshForwardArguments(
    {
      target: "tpe",
      configFile: "/tmp/ssh-config",
      options: ["ConnectTimeout=10"],
    },
    "api.example:443",
  );
  assert.deepEqual(args, [
    "-F",
    "/tmp/ssh-config",
    "-T",
    "-o",
    "BatchMode=yes",
    "-o",
    "NumberOfPasswordPrompts=0",
    "-o",
    "StrictHostKeyChecking=yes",
    "-o",
    "ConnectTimeout=10",
    "-W",
    "api.example:443",
    "tpe",
  ]);
});

void test("rejects unsafe or interactive SSH options", () => {
  assert.throws(
    () =>
      buildSshForwardArguments(
        { target: "-oProxyCommand=bad" },
        "api.example:443",
      ),
    /invalid SSH target/,
  );
  assert.throws(
    () =>
      buildSshForwardArguments(
        { target: "tpe", options: ["BatchMode=no"] },
        "api.example:443",
      ),
    /controlled by the SDK/,
  );
  assert.throws(
    () =>
      buildSshForwardArguments(
        { target: "tpe", options: ["bad\nvalue"] },
        "api.example:443",
      ),
    /invalid SSH option/,
  );
});
