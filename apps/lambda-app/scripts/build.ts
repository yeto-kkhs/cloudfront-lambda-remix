import path from "node:path";
import url from "node:url";
import { build } from "esbuild";
import { $, cd } from "zx";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
function p(rp: string) {
  return path.resolve(__dirname, "..", rp);
}

await $`rm -rf ${p("tmp")}`.nothrow();
await $`rm -rf ${p("build")}`.nothrow();

try {
  await $`pnpm remix vite:build`;
  await $`mkdir -p ${p("build/remix")}`;
  await $`cp -r ${p("tmp")}/* ${p("build/remix")}`;
  await $`cp -r ${p("server")}/* ${p("build")}`;
} finally {
  await $`rm -rf ${p("tmp")}`;
}

await build({
  entryPoints: [p("build/server.lambda.ts")],
  bundle: true,
  minify: true,
  platform: "node",
  target: "node20",
  outfile: "build/index.js",
});

cd(p("build"));
await $`zip -r lambda.zip index.js`;
