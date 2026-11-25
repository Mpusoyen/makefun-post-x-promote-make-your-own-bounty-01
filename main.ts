// Entry for post-x-promote-make-your-own-bounty-01.
// Reads POST.json from the bot directory, checks that it names a valid
// X / Twitter status URL, and copies it to the output directory where
// the gate expects to find it.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const botDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const sourcePath = join(botDir, "POST.json");

if (!existsSync(sourcePath)) {
  console.error(`error: POST.json not found in bot dir: ${sourcePath}`);
  process.exit(1);
}

let raw: string;
try {
  raw = readFileSync(sourcePath, "utf8");
} catch (err) {
  console.error(`error: could not read ${sourcePath}: ${(err as Error).message}`);
  process.exit(1);
}

let data: unknown;
try {
  data = JSON.parse(raw);
} catch {
  console.error(`error: POST.json is not valid JSON: ${sourcePath}`);
  process.exit(1);
}

const url = (data as { url?: unknown })?.url;
if (typeof url !== "string" || url.length === 0) {
  console.error('error: POST.json must contain a non-empty string field "url"');
  process.exit(1);
}

let parsed: URL;
try {
  parsed = new URL(url);
} catch {
  console.error(`error: POST.json url is not a valid URL: ${url}`);
  process.exit(1);
}

if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
  console.error(`error: POST.json url must use http(s), got protocol: ${parsed.protocol}`);
  process.exit(1);
}

const host = parsed.hostname.toLowerCase();
if (host !== "x.com" && host !== "twitter.com" && host !== "www.x.com" && host !== "www.twitter.com") {
  console.error(`error: POST.json url must be on x.com or twitter.com, got host: ${host}`);
  process.exit(1);
}

// Strict shape: exactly /<handle>/status/<digits> — no extra segments,
// a non-empty handle, and a purely numeric status id.
const parts = parsed.pathname.split("/").filter(Boolean);
if (parts.length !== 3 || parts[1] !== "status" || parts[0].length === 0) {
  console.error(`error: POST.json url must look like https://x.com/<handle>/status/<digits>, got path: ${parsed.pathname}`);
  process.exit(1);
}
if (!/^\d+$/.test(parts[2])) {
  console.error(`error: POST.json status id must be digits only, got: ${parts[2]}`);
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, "POST.json"), raw);
