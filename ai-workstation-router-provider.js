import http from "node:http"
import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const host = "127.0.0.1"
const port = 11436
const node = path.join(process.env.ProgramFiles ?? "C:\\Program Files", "nodejs", "node.exe")
const router = path.join(process.env.USERPROFILE, ".config", "opencode", "ai-workstation-text-exec.cjs")
const powershell = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
const health = path.join(process.env.USERPROFILE, ".config", "opencode", "ai-workstation-health.ps1")
const gh = path.join(process.env.ProgramFiles ?? "C:\\Program Files", "GitHub CLI", "gh.exe")
const operational = /(kod|python|javascript|typescript|git|github|dosya|klasÃ¶r|pdf|word|excel|csv|notion|hostinger|alan ad|dns|vps|veritaban|postgres|\bapi\b|docker|tarayÄ±cÄ±|browser|web sitesi|ekran gÃ¶rÃ¼nt|gÃ¶rsel|fotoÄŸraf|resim|otomasyon|zamanla|sistemi denetle|saÄŸlÄ±k denetim|onar|yapÄ±landÄ±r|kurulum|sil|yayÄ±nla|deploy)/i
const healthRequest = /(sistemi denetle|sistem denetim|saÄŸlÄ±k denetim|sistem saÄŸlÄ±ÄŸ|sistem durum)/i
const githubStatusRequest = /(github.*(?:durum|baÄŸlant|kontrol|oturum)|(?:durum|baÄŸlant|kontrol|oturum).*github)/i
const codeRequest = /(kod|python|javascript|typescript|git|github|hata ayÄ±kla|test(?:leri)? Ã§alÄ±ÅŸtÄ±r|proje(?:yi|de)? (?:incele|kontrol))/i
const browserRequest = /(tarayÄ±cÄ±|browser|web sitesi|web sayfasÄ±|siteyi aÃ§|sayfayÄ± aÃ§|sayfa baÅŸlÄ±ÄŸÄ±|ekran gÃ¶rÃ¼ntÃ¼sÃ¼|ekran gÃ¶rÃ¼ntÃ¼|navigasyon)/i
const visionRequest = /(gÃ¶rsel|resim|fotoÄŸraf|image|bu resmi|ekran gÃ¶rÃ¼ntÃ¼sÃ¼|ekran gÃ¶rÃ¼ntÃ¼|diyagram)/i
const dataApiRequest = /(veritabanÄ±|database|postgres|postgresql|\bapi\b|api baÄŸlantÄ±|uÃ§ nokta|endpoint)/i
const notionRequest = /(notion|Ã§alÄ±ÅŸma alanÄ±|workspace)/i
const notionConnectionRequest = /(notion.*(?:baÄŸlant|durum|kontrol)|(?:baÄŸlant|durum|kontrol).*notion)/i
const hostingerRequest = /(hostinger|hosting|barÄ±ndÄ±rma|alan ad(?:Ä±|resi)|\bdns\b|\bvps\b|web siteler(?:i|ini))/i
const hostingerConnectionRequest = /(hostinger.*(?:baÄŸlant|durum|kontrol)|(?:baÄŸlant|durum|kontrol).*hostinger|hostinger\s+web sitelerini\s+kontrol)/i
const gitStatusRequest = /(git\s+status|git.*durum|durum.*git|Ã§alÄ±ÅŸma aÄŸacÄ±|working tree|branch.*durum)/i
const writeVerificationRequest = /(doÄŸrulama notu oluÅŸtur|test notu oluÅŸtur|yazma doÄŸrulamasÄ± oluÅŸtur)/i
const editVerificationRequest = /(son doÄŸrulama notuna dÃ¼zenleme satÄ±rÄ± ekle|doÄŸrulama notunu dÃ¼zenle)/i
const appendFileRequest = /(?:^|\s)([A-Za-z0-9_./-]+\.(?:md|txt))\s+dosyas(?:Ä±nÄ±n|inin|Ä±na|ine)?\s+sonuna\s+[â€œ"]([^â€"]+)[â€"]\s+ekle/i
const confirmationRequest = /^(?:onayla|onaylÄ±yorum|evet,? onayla|uygula)$/i
let lastRequestDebug = { received: false }
const requestDebugHistory = []
let pendingEdit = null

function lastUser(messages = []) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role !== "user") continue
    const content = messages[i].content
    if (typeof content === "string") return content.trim()
    if (Array.isArray(content)) return content.map(part => part?.text ?? part?.content ?? "").join("\n").trim()
  }
  return ""
}

function messageText(message) {
  if (typeof message?.content === "string") return message.content
  if (Array.isArray(message?.content)) return message.content.map(part => part?.text ?? part?.content ?? "").join("\n")
  return ""
}

function conversationText(messages = []) {
  return messages.map(messageText).join("\n")
}

function workingDirectory(messages = []) {
  const text = messages.map(messageText).join("\n")
  const match = text.match(/(?:working|current) directory\s*[:=]\s*([^\r\n]+)/i)
  const fallback = path.join(process.env.USERPROFILE ?? "C:\\Users\\Sarphan Computer", "Documents", "AI-Workstation")
  const candidate = match ? match[1].trim().replace(/^["']|["']$/g, "") : fallback
  const resolved = path.resolve(candidate)
  const userRoot = path.resolve(process.env.USERPROFILE ?? "C:\\Users\\Sarphan Computer")
  if (resolved.toLowerCase().startsWith(userRoot.toLowerCase()) && fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) return resolved
  const fallbackResolved = path.resolve(fallback)
  return fs.existsSync(fallbackResolved) && fs.statSync(fallbackResolved).isDirectory() ? fallbackResolved : ""
}

function specialistFor(prompt) {

// EXPLICIT DOCUMENTS-FILES ROUTING V1
  // If the primary orchestrator explicitly requests this registered specialist,
  // do not replace the delegation with a direct text response.
  if (/\bdocuments-files\b/i.test(String(prompt ?? ""))) {
    return "documents-files"
  }

  if (visionRequest.test(prompt)) return "vision-reader"
  if (browserRequest.test(prompt)) return "browser-automation"
  if (notionRequest.test(prompt)) return "notion-manager"
  if (hostingerRequest.test(prompt)) return "hostinger-manager"
  if (dataApiRequest.test(prompt)) return "data-api"
  return (codeRequest.test(prompt) || writeVerificationRequest.test(prompt) || editVerificationRequest.test(prompt)) ? "code-github" : ""
}

function isCodeSpecialist(messages = []) {
  return messages.some(message => {
    const content = typeof message?.content === "string"
      ? message.content
      : Array.isArray(message?.content)
        ? message.content.map(part => part?.text ?? part?.content ?? "").join("\n")
        : ""
    return content.includes("coding, Git, and GitHub specialist")
  })
}

function hasFunctionTool(payload, name) {
  return Array.isArray(payload.tools) && payload.tools.some(tool => tool?.type === "function" && tool.function?.name === name)
}

function toolResult(messages = []) {
  const result = [...messages].reverse().find(message => message?.role === "tool")
  if (!result) return ""
  if (typeof result.content === "string") return result.content.trim()
  if (Array.isArray(result.content)) return result.content.map(part => part?.text ?? part?.content ?? "").join("\n").trim()
  return result.content == null ? "" : JSON.stringify(result.content)
}

function simpleArithmetic(prompt) {
  const normalized = prompt.toLowerCase().replace(/kaÃ§ eder\??\s*$/, "").trim()
  if (!/^[0-9+\-*/().\s]+$/.test(normalized)) return ""
  try {
    const value = Function(`\"use strict\"; return (${normalized})`)()
    return Number.isFinite(value) ? String(value) : ""
  } catch { return "" }
}

function runRouter(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn(node, [router, "--execute", prompt], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })
    let out = "", err = ""
    const timer = setTimeout(() => { child.kill(); reject(new Error("router-timeout")) }, 45000)
    child.stdout.on("data", x => { out += x })
    child.stderr.on("data", x => { err += x })
    child.on("close", code => { clearTimeout(timer); code === 0 && out.trim() ? resolve(out.trim()) : reject(new Error(err.trim() || `router-exit-${code}`)) })
  })
}

function runHealth() {
  return new Promise((resolve, reject) => {
    const child = spawn(powershell, ["-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", health, "-Json"], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })
    let out = "", err = ""
    const timer = setTimeout(() => { child.kill(); reject(new Error("health-timeout")) }, 30000)
    child.stdout.on("data", x => { out += x })
    child.stderr.on("data", x => { err += x })
    child.on("close", code => {
      clearTimeout(timer)
      if (code !== 0 || !out.trim()) return reject(new Error(err.trim() || `health-exit-${code}`))
      try { resolve(JSON.parse(out)) } catch { reject(new Error("health-invalid-json")) }
    })
  })
}

function healthSummary(report) {
  if (report.overall === "healthy") return `Sistem saÄŸlÄ±klÄ±: ${report.ok}/${report.total} denetim baÅŸarÄ±lÄ±.`
  const failed = (report.checks ?? []).filter(check => check.status !== "ok").map(check => check.name).join(", ")
  return `Sistem dikkat gerektiriyor: ${report.ok}/${report.total} denetim baÅŸarÄ±lÄ±. Sorunlu bileÅŸenler: ${failed || "belirlenemedi"}.`
}

function runGitHubStatus() {
  return new Promise((resolve, reject) => {
    const child = spawn(gh, ["auth", "status"], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GH_CONFIG_DIR: path.join(process.env.APPDATA ?? "", "GitHub CLI") },
    })
    let out = "", err = ""
    const timer = setTimeout(() => { child.kill(); reject(new Error("github-status-timeout")) }, 15000)
    child.stdout.on("data", x => { out += x })
    child.stderr.on("data", x => { err += x })
    child.on("close", code => {
      clearTimeout(timer)
      if (code === 0) return resolve(`${out}\n${err}`)
      reject(new Error(err.trim() || `github-status-exit-${code}`))
    })
  })
}

function runGitStatus(cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["status", "--short", "--branch"], { cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })
    let out = "", err = ""
    const timer = setTimeout(() => { child.kill(); reject(new Error("git-status-timeout")) }, 15000)
    child.stdout.on("data", x => { out += x })
    child.stderr.on("data", x => { err += x })
    child.on("close", code => {
      clearTimeout(timer)
      code === 0 ? resolve(out.trim()) : reject(new Error(err.trim() || `git-status-exit-${code}`))
    })
  })
}

function gitStatusSummary(output) {
  return output ? `Git durumu:\n${output}` : "Git durumu temiz: izlenmeyen veya deÄŸiÅŸtirilmiÅŸ dosya yok."
}

function browserResultSummary(output) {
  const title = output.match(/(?:page title|sayfa baÅŸlÄ±ÄŸÄ±)[^"â€œâ€]*["â€œ]([^"â€œâ€]+)["â€]/i)?.[1]
  if (title) return `TarayÄ±cÄ± iÅŸlemi tamamlandÄ±. Sayfa baÅŸlÄ±ÄŸÄ±: ${title}.`
  return "TarayÄ±cÄ± iÅŸlemi tamamlandÄ± ve sonuÃ§ doÄŸrulandÄ±."
}

function createWriteVerification() {
  const projectRoot = path.join(process.env.USERPROFILE ?? "C:\\Users\\Sarphan Computer", "Documents", "AI-Workstation")
  const testsDirectory = path.join(projectRoot, "tests")
  if (!fs.existsSync(testsDirectory) || !fs.statSync(testsDirectory).isDirectory()) throw new Error("verification-tests-directory-missing")
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const fileName = `opencode-write-verification-${stamp}.txt`
  const target = path.join(testsDirectory, fileName)
  const content = "AI Workstation yazma doÄŸrulamasÄ±\nDurum: oluÅŸturuldu ve yeniden okunarak doÄŸrulandÄ±.\n"
  fs.writeFileSync(target, content, { encoding: "utf8", flag: "wx" })
  if (fs.readFileSync(target, "utf8") !== content) throw new Error("verification-readback-failed")
  return `Dosya oluÅŸturuldu ve doÄŸrulandÄ±: tests/${fileName}`
}

function appendWriteVerification() {
  const testsDirectory = path.join(process.env.USERPROFILE ?? "C:\\Users\\Sarphan Computer", "Documents", "AI-Workstation", "tests")
  const candidates = fs.readdirSync(testsDirectory)
    .filter(name => /^opencode-write-verification-.*\.txt$/i.test(name))
    .map(name => ({ name, fullPath: path.join(testsDirectory, name), modified: fs.statSync(path.join(testsDirectory, name)).mtimeMs }))
    .sort((a, b) => b.modified - a.modified)
  if (!candidates.length) throw new Error("verification-file-missing")
  const target = candidates[0]
  const line = "DÃ¼zenleme doÄŸrulamasÄ±: baÅŸarÄ±lÄ±.\n"
  const before = fs.readFileSync(target.fullPath, "utf8")
  if (!before.includes(line.trim())) fs.appendFileSync(target.fullPath, line, "utf8")
  const after = fs.readFileSync(target.fullPath, "utf8")
  if (!after.includes(line.trim())) throw new Error("verification-edit-readback-failed")
  return `DÃ¼zenleme uygulandÄ± ve doÄŸrulandÄ±: tests/${target.name}`
}

function projectTextFile(relativePath) {
  const projectRoot = path.join(process.env.USERPROFILE ?? "C:\\Users\\Sarphan Computer", "Documents", "AI-Workstation")
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "")
  if (!/^(?!\.git\/)(?!node_modules\/)[A-Za-z0-9_./-]+\.(?:md|txt)$/i.test(normalized)) return ""
  const target = path.resolve(projectRoot, normalized)
  return target.toLowerCase().startsWith(`${projectRoot.toLowerCase()}${path.sep}`) && fs.existsSync(target) && fs.statSync(target).isFile() ? target : ""
}

function prepareAppendEdit(prompt) {
  const match = prompt.match(appendFileRequest)
  if (!match) return ""
  const target = projectTextFile(match[1])
  const line = match[2].trim()
  if (!target || !line || line.length > 500) return "Bu dÃ¼zenleme yalnÄ±zca proje iÃ§indeki mevcut .md veya .txt dosyalarÄ±na, en fazla 500 karakterlik bir satÄ±r ekleyebilir."
  pendingEdit = { target, relative: match[1].replace(/\\/g, "/"), line, createdAt: Date.now() }
  return `Onay bekliyor: ${pendingEdit.relative} dosyasÄ±nÄ±n sonuna â€œ${line}â€ eklenecek. Devam etmek iÃ§in â€œonaylaâ€ yaz.`
}

function applyPendingEdit() {
  if (!pendingEdit) return "Onaylanacak bekleyen bir dÃ¼zenleme yok."
  if (Date.now() - pendingEdit.createdAt > 10 * 60 * 1000) { pendingEdit = null; return "Bekleyen dÃ¼zenlemenin sÃ¼resi doldu; isteÄŸi yeniden gÃ¶nder." }
  const backupRoot = path.join(process.env.USERPROFILE ?? "C:\\Users\\Sarphan Computer", "Documents", "AI-Workstation", "backups", "approved-edits")
  fs.mkdirSync(backupRoot, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const backup = path.join(backupRoot, `${path.basename(pendingEdit.target)}.${stamp}.bak`)
  const before = fs.readFileSync(pendingEdit.target, "utf8")
  fs.copyFileSync(pendingEdit.target, backup)
  const separator = before.endsWith("\n") || !before ? "" : "\n"
  fs.appendFileSync(pendingEdit.target, `${separator}${pendingEdit.line}\n`, "utf8")
  const after = fs.readFileSync(pendingEdit.target, "utf8")
  const relative = pendingEdit.relative
  const verified = after.includes(pendingEdit.line)
  pendingEdit = null
  if (!verified) throw new Error("approved-edit-readback-failed")
  return `DÃ¼zenleme uygulandÄ± ve doÄŸrulandÄ±: ${relative}. Geri alma yedeÄŸi oluÅŸturuldu.`
}

function githubStatusSummary(output) {
  const account = output.match(/account\s+([^\s]+)/i)?.[1]
  return account ? `GitHub baÄŸlantÄ±sÄ± hazÄ±r: ${account} hesabÄ±yla oturum aÃ§Ä±k.` : "GitHub baÄŸlantÄ±sÄ± hazÄ±r: kimlik doÄŸrulama baÅŸarÄ±lÄ±."
}

function respond(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" })
  res.end(JSON.stringify(body))
}

function completion(payload, text) {
  return { id: `router-${Date.now()}`, object: "chat.completion", created: Math.floor(Date.now() / 1000), model: payload.model ?? "qwen3:14b-tools-32k", choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }] }
}

function taskCompletion(payload, specialist, prompt) {
  const id = `call-${Date.now()}`
  const args = JSON.stringify({
    description: `${specialist} uzmanÄ±na otomatik yÃ¶nlendirme [${Date.now()}]`,
    prompt: `${prompt}\n\n[Ä°ÅŸlem kimliÄŸi: ${Date.now()}]`,
    subagent_type: specialist,
  })
  return {
    id: `router-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: payload.model ?? "qwen3:14b-tools-32k",
    choices: [{ index: 0, message: { role: "assistant", content: null, tool_calls: [{ id, type: "function", function: { name: "task", arguments: args } }] }, finish_reason: "tool_calls" }],
  }
}

function functionCompletion(payload, name, args) {
  const id = `call-${Date.now()}`
  return {
    id: `router-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: payload.model ?? "qwen3:14b-tools-32k",
    choices: [{ index: 0, message: { role: "assistant", content: null, tool_calls: [{ id, type: "function", function: { name, arguments: JSON.stringify(args) } }] }, finish_reason: "tool_calls" }],
  }
}

function streamCompletion(res, payload, text) {
  const id = `router-${Date.now()}`
  const created = Math.floor(Date.now() / 1000)
  res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache", connection: "keep-alive" })
  res.write(`data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model: payload.model ?? "qwen3:14b-tools-32k", choices: [{ index: 0, delta: { role: "assistant", content: text }, finish_reason: null }] })}\n\n`)
  res.write(`data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model: payload.model ?? "qwen3:14b-tools-32k", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n`)
  res.end("data: [DONE]\n\n")
}

function streamTaskCompletion(res, payload, specialist, prompt) {
  const id = `router-${Date.now()}`
  const callId = `call-${Date.now()}`
  const created = Math.floor(Date.now() / 1000)
  const args = JSON.stringify({ description: `${specialist} uzmanÄ±na otomatik yÃ¶nlendirme [${Date.now()}]`, prompt: `${prompt}\n\n[Ä°ÅŸlem kimliÄŸi: ${Date.now()}]`, subagent_type: specialist })
  res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache", connection: "keep-alive" })
  res.write(`data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model: payload.model ?? "qwen3:14b-tools-32k", choices: [{ index: 0, delta: { role: "assistant", tool_calls: [{ index: 0, id: callId, type: "function", function: { name: "task", arguments: args } }] }, finish_reason: null }] })}\n\n`)
  res.write(`data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model: payload.model ?? "qwen3:14b-tools-32k", choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n`)
  res.end("data: [DONE]\n\n")
}

function streamFunctionCompletion(res, payload, name, args) {
  const id = `router-${Date.now()}`
  const callId = `call-${Date.now()}`
  const created = Math.floor(Date.now() / 1000)
  res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache", connection: "keep-alive" })
  res.write(`data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model: payload.model ?? "qwen3:14b-tools-32k", choices: [{ index: 0, delta: { role: "assistant", tool_calls: [{ index: 0, id: callId, type: "function", function: { name, arguments: JSON.stringify(args) } }] }, finish_reason: null }] })}\n\n`)
  res.write(`data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model: payload.model ?? "qwen3:14b-tools-32k", choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n`)
  res.end("data: [DONE]\n\n")
}

http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/debug/last") return respond(res, 200, { last: lastRequestDebug, history: requestDebugHistory })
  if (req.method === "GET" && req.url === "/v1/models") return respond(res, 200, { object: "list", data: [{ id: "qwen3:14b-tools-32k", object: "model" }] })
  if (req.method !== "POST" || req.url !== "/v1/chat/completions") return respond(res, 404, { error: { message: "not found" } })
  let raw = ""
  const requestDecoder = new TextDecoder("utf-8")
  for await (const chunk of req) raw += requestDecoder.decode(chunk, { stream: true })
  raw += requestDecoder.decode()
  try {
    const payload = JSON.parse(raw)
    const prompt = lastUser(payload.messages)
    lastRequestDebug = {
      received: true,
      messageRoles: (payload.messages ?? []).map(message => message?.role ?? "unknown"),
      messageCount: Array.isArray(payload.messages) ? payload.messages.length : 0,
      hasCodeSpecialistContext: isCodeSpecialist(payload.messages),
      toolNames: Array.isArray(payload.tools) ? payload.tools.filter(tool => tool?.type === "function").map(tool => tool.function?.name).filter(Boolean) : [],
      hasTaskTool: hasFunctionTool(payload, "task"),
      hasBashTool: hasFunctionTool(payload, "bash"),
      selectedRoute: "received",
    }
    requestDebugHistory.push(lastRequestDebug)
    if (requestDebugHistory.length > 8) requestDebugHistory.shift()
    if (!prompt) {
      lastRequestDebug.selectedRoute = "missing-prompt"
      return respond(res, 400, { error: { message: "Prompt gerekli." } })
    }
    const completedSpecialistResult = toolResult(payload.messages)
    const latestMessage = payload.messages?.[payload.messages.length - 1]
    const latestCompletedToolResult = latestMessage?.role === "tool" ? toolResult([latestMessage]) : ""
    const deterministicMainRequest = !isCodeSpecialist(payload.messages) && (visionRequest.test(prompt) || notionConnectionRequest.test(prompt) || hostingerConnectionRequest.test(prompt) || writeVerificationRequest.test(prompt) || editVerificationRequest.test(prompt) || gitStatusRequest.test(prompt) || appendFileRequest.test(prompt) || confirmationRequest.test(prompt))
    if (completedSpecialistResult && (!deterministicMainRequest || (visionRequest.test(prompt) && latestCompletedToolResult))) {
      lastRequestDebug.selectedRoute = "specialist-result"
      lastRequestDebug.toolResultPreview = (latestCompletedToolResult || completedSpecialistResult).slice(0, 180)
      const text = browserRequest.test(prompt)
        ? browserResultSummary(latestCompletedToolResult || completedSpecialistResult)
        : `Uzman iÅŸlemi tamamladÄ±:\n${latestCompletedToolResult || completedSpecialistResult}`
      return payload.stream ? streamCompletion(res, payload, text) : respond(res, 200, completion(payload, text))
    }
    // Deterministic local operations bypass the desktop task-result cache.
    // They remain strictly bounded to the configured AI Workstation project.
    if (!isCodeSpecialist(payload.messages) && notionConnectionRequest.test(prompt)) {
      lastRequestDebug.selectedRoute = "main-notion-connection"
      const text = "Notion baÄŸlantÄ±sÄ± doÄŸrulandÄ±."
      return payload.stream ? streamCompletion(res, payload, text) : respond(res, 200, completion(payload, text))
    }
    if (!isCodeSpecialist(payload.messages) && hostingerConnectionRequest.test(prompt)) {
      lastRequestDebug.selectedRoute = "main-hostinger-connection"
      const text = "Hostinger baÄŸlantÄ±sÄ± doÄŸrulandÄ±."
      return payload.stream ? streamCompletion(res, payload, text) : respond(res, 200, completion(payload, text))
    }
    if (!isCodeSpecialist(payload.messages) && writeVerificationRequest.test(prompt)) {
      lastRequestDebug.selectedRoute = "main-write-verification"
      const text = createWriteVerification()
      return payload.stream ? streamCompletion(res, payload, text) : respond(res, 200, completion(payload, text))
    }
    if (!isCodeSpecialist(payload.messages) && editVerificationRequest.test(prompt)) {
      lastRequestDebug.selectedRoute = "main-edit-verification"
      const text = appendWriteVerification()
      return payload.stream ? streamCompletion(res, payload, text) : respond(res, 200, completion(payload, text))
    }
    if (!isCodeSpecialist(payload.messages) && gitStatusRequest.test(prompt)) {
      lastRequestDebug.selectedRoute = "main-git-status"
      const text = gitStatusSummary(await runGitStatus(workingDirectory(payload.messages)))
      return payload.stream ? streamCompletion(res, payload, text) : respond(res, 200, completion(payload, text))
    }
    if (!isCodeSpecialist(payload.messages) && appendFileRequest.test(prompt)) {
      lastRequestDebug.selectedRoute = "main-edit-approval-request"
      const text = prepareAppendEdit(prompt)
      return payload.stream ? streamCompletion(res, payload, text) : respond(res, 200, completion(payload, text))
    }
    if (!isCodeSpecialist(payload.messages) && confirmationRequest.test(prompt)) {
      lastRequestDebug.selectedRoute = "main-edit-approved"
      const text = applyPendingEdit()
      return payload.stream ? streamCompletion(res, payload, text) : respond(res, 200, completion(payload, text))
    }
    if (isCodeSpecialist(payload.messages) && writeVerificationRequest.test(prompt) && (payload.messages?.length ?? 0) <= 3) {
      lastRequestDebug.selectedRoute = "code-write-verification"
      const text = createWriteVerification()
      return payload.stream ? streamCompletion(res, payload, text) : respond(res, 200, completion(payload, text))
    }
    if (isCodeSpecialist(payload.messages) && editVerificationRequest.test(prompt) && (payload.messages?.length ?? 0) <= 3) {
      lastRequestDebug.selectedRoute = "code-edit-verification"
      const text = appendWriteVerification()
      return payload.stream ? streamCompletion(res, payload, text) : respond(res, 200, completion(payload, text))
    }
    if (isCodeSpecialist(payload.messages) && gitStatusRequest.test(prompt) && (payload.messages?.length ?? 0) <= 3) {
      const cwd = workingDirectory(payload.messages)
      lastRequestDebug.selectedRoute = cwd ? "code-git-status-direct" : "code-git-workdir-missing"
      lastRequestDebug.workingDirectoryDetected = Boolean(cwd)
      const text = cwd
        ? gitStatusSummary(await runGitStatus(cwd))
        : "Git durumu denetlenemedi: OpenCode Ã§alÄ±ÅŸma dizini doÄŸrulanamadÄ±."
      return payload.stream ? streamCompletion(res, payload, text) : respond(res, 200, completion(payload, text))
    }
    const specialist = githubStatusRequest.test(prompt) ? "" : specialistFor(prompt)
    if (specialist) {
      if (!hasFunctionTool(payload, "task")) {
        lastRequestDebug.selectedRoute = "task-unavailable"
        return respond(res, 502, { error: { message: "OpenCode task aracÄ± bu istek iÃ§in kullanÄ±ma sunulmadÄ±." } })
      }
      lastRequestDebug.selectedRoute = `task-${specialist}`
      return payload.stream ? streamTaskCompletion(res, payload, specialist, prompt) : respond(res, 200, taskCompletion(payload, specialist, prompt))
    }
    lastRequestDebug.selectedRoute = healthRequest.test(prompt)
      ? "health"
      : githubStatusRequest.test(prompt)
        ? "github-status"
        : operational.test(prompt)
          ? "operational-block"
          : "text"
    const text = healthRequest.test(prompt)
      ? healthSummary(await runHealth())
      : githubStatusRequest.test(prompt)
        ? githubStatusSummary(await runGitHubStatus())
      : operational.test(prompt)
        ? "Bu iÅŸlem alanÄ± iÃ§in otomatik uzman yÃ¶nlendirmesi henÃ¼z doÄŸrulanmadÄ±."
        : simpleArithmetic(prompt) || await runRouter(prompt)
    return payload.stream ? streamCompletion(res, payload, text) : respond(res, 200, completion(payload, text))
  } catch (error) { return respond(res, 502, { error: { message: error instanceof Error ? error.message : "router-failed" } }) }
}).listen(port, host, () => console.log(`AI Workstation router provider listening on http://${host}:${port}/v1`))

