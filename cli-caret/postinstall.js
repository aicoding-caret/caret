#!/usr/bin/env node

const { spawnSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const distDir = path.join(__dirname, "dist-standalone")
const moduleDir = path.join(distDir, "node_modules", "better-sqlite3")

if (!fs.existsSync(distDir) || !fs.existsSync(moduleDir)) {
	console.log("[caret-cli] dist-standalone or better-sqlite3 not found; skipping rebuild")
	process.exit(0)
}

const npmExecPath = process.env.npm_execpath
const command = npmExecPath ? process.execPath : "npm"
const args = npmExecPath
	? [npmExecPath, "rebuild", "better-sqlite3", "--build-from-source", "--unsafe-perm"]
	: ["rebuild", "better-sqlite3", "--build-from-source", "--unsafe-perm"]

console.log("[caret-cli] Rebuilding better-sqlite3 for local Node.js...")
const result = spawnSync(command, args, { cwd: distDir, stdio: "inherit" })

if (result.status !== 0) {
	process.exit(result.status ?? 1)
}
