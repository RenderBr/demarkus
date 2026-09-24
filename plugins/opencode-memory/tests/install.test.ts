import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const plugin = join(dirname(fileURLToPath(import.meta.url)), "..");

test("installer exposes V2 Markdown commands without replacing user commands", () => {
  const home = mkdtempSync(join(tmpdir(), "demarkus-v2-install-"));
  const config = join(home, ".config", "opencode");
  const commands = join(config, "commands");
  mkdirSync(commands, { recursive: true });
  writeFileSync(join(commands, "soul-status.md"), "My own status command\n");
  const install = (args: string[] = []) => execFileSync("bash", [join(plugin, "install.sh"), ...args], {
    env: { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, ".config") },
    stdio: "pipe",
  });
  try {
    install();
    assert.match(readFileSync(join(commands, "promote.md"), "utf8"), /\$ARGUMENTS/);
    assert.equal(readFileSync(join(commands, "soul-status.md"), "utf8"), "My own status command\n");
    assert.match(readFileSync(join(config, "plugins", "demarkus-memory.ts"), "utf8"), /setupV2/);
    install(["--uninstall"]);
    assert.equal(existsSync(join(commands, "promote.md")), false);
    assert.equal(readFileSync(join(commands, "soul-status.md"), "utf8"), "My own status command\n");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
