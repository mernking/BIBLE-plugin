import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "lib/data");

export function loadAllBibles() {
  const bibles = {};

  function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith(".json")) {
        const raw = fs.readFileSync(fullPath, "utf8");
        const parsed = JSON.parse(raw);
        const shortname = parsed.metadata?.shortname || file.replace(".json", "");
        bibles[shortname] = parsed;
      }
    });
  }

  walk(dataDir);
  return bibles;
}