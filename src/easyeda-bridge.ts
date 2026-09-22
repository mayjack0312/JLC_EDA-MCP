import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { createConnection } from "node:net";
import { WebSocketServer, WebSocket } from "ws";

const SERVICE_ID = "easyeda-bridge";
const PORT_START = 49620;
const PORT_END = 49629;

interface Pending {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
  windowId: string;
}

export class EasyEdaBridge {
  private server: Server | null = null;
  private clients = new Map<string, WebSocket>();
  private pending = new Map<string, Pending>();
  private activeWindowId: string | null = null;
  private port: number | null = null;
  private startPromise: Promise<number> | null = null;

  async start(): Promise<number> {
    if (this.port) return this.port;
    if (this.startPromise) return this.startPromise;
    this.startPromise = this.startInternal();
    try { return await this.startPromise; }
    finally { this.startPromise = null; }
  }

  private async startInternal(): Promise<number> {
    for (let port = PORT_START; port <= PORT_END; port++) {
      if (await this.isPortUsed(port)) continue;
      try { await this.listen(port); return port; }
      catch (error: any) { if (error?.code !== "EADDRINUSE") throw error; }
    }
    throw new Error(`端口 ${PORT_START}-${PORT_END} 均被占用，无法启动内置EasyEDA Bridge`);
  }

  private isPortUsed(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = createConnection({ host: "127.0.0.1", port });
      socket.setTimeout(150);
      socket.once("connect", () => { socket.destroy(); resolve(true); });
      socket.once("timeout", () => { socket.destroy(); resolve(false); });
      socket.once("error", () => resolve(false));
    });
  }

  private listen(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        if (req.method === "GET" && req.url === "/health") {
          res.writeHead(200);
          res.end(JSON.stringify({ service: SERVICE_ID, status: "ok", port, edaConnected: this.clients.size > 0, edaWindowCount: this.clients.size, activeWindowId: this.activeWindowId }));
        } else if (req.method === "GET" && req.url === "/eda-windows") {
          res.writeHead(200);
          res.end(JSON.stringify(this.status()));
        } else { res.writeHead(404); res.end(JSON.stringify({ error: "Not found" })); }
      });
      const wss = new WebSocketServer({ server });
      wss.on("connection", (ws, req) => this.onConnection(ws, req.url || ""));
      server.once("error", reject);
      server.listen(port, "127.0.0.1", () => {
        server.removeListener("error", reject);
        server.on("error", (error) => console.error("EasyEDA Bridge error:", error));
        this.server = server;
        this.port = port;
        console.error(`EasyEDA Bridge listening on 127.0.0.1:${port}`);
        resolve();
      });
    });
  }

  private onConnection(ws: WebSocket, pathname: string): void {
    ws.send(JSON.stringify({ type: "handshake", service: SERVICE_ID, clientType: pathname === "/eda" ? "eda" : "agent", timestamp: Date.now() }));
    if (pathname !== "/eda") return;
    let registered: string | null = null;
    ws.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type === "register" && typeof message.windowId === "string") {
          const id = message.windowId as string;
          registered = id;
          this.clients.set(id, ws);
          if (!this.activeWindowId) this.activeWindowId = id;
          return;
        }
        if (message.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", id: message.id, timestamp: Date.now() }));
          return;
        }
        if (message.type === "pong") return;
        if ((message.type === "result" || message.type === "error") && typeof message.id === "string") {
          const pending = this.pending.get(message.id);
          if (!pending) return;
          clearTimeout(pending.timer);
          this.pending.delete(message.id);
          message.type === "result" ? pending.resolve(message.result) : pending.reject(new Error(message.error || "Unknown EDA error"));
        }
      } catch (error) { console.error("Invalid EasyEDA gateway message:", error); }
    });
    ws.on("close", () => {
      if (!registered) return;
      this.clients.delete(registered);
      if (this.activeWindowId === registered) this.activeWindowId = this.clients.keys().next().value || null;
      for (const [id, pending] of this.pending) {
        if (pending.windowId !== registered) continue;
        clearTimeout(pending.timer);
        pending.reject(new Error(`EDA窗口 ${registered} 已断开`));
        this.pending.delete(id);
      }
    });
  }

  status() {
    return {
      service: SERVICE_ID,
      port: this.port,
      activeWindowId: this.activeWindowId,
      count: this.clients.size,
      windows: [...this.clients.entries()].map(([windowId, ws]) => ({ windowId, connected: ws.readyState === WebSocket.OPEN, active: windowId === this.activeWindowId })),
    };
  }

  selectWindow(windowId: string): void {
    if (!this.clients.has(windowId)) throw new Error(`EDA窗口不存在或未连接: ${windowId}`);
    this.activeWindowId = windowId;
  }

  async execute(code: string, windowId?: string): Promise<unknown> {
    await this.start();
    const target = windowId || this.activeWindowId;
    if (!target) throw new Error("没有已连接的嘉立创EDA窗口，请安装并启用 run-api-gateway.eext");
    const ws = this.clients.get(target);
    if (!ws || ws.readyState !== WebSocket.OPEN) throw new Error(`EDA窗口不可用: ${target}`);
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const timeout = Number(process.env.EASYEDA_API_TIMEOUT_MS || 30000);
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`API调用超时（${timeout}ms）`)); }, timeout);
      this.pending.set(id, { resolve, reject, timer, windowId: target });
      ws.send(JSON.stringify({ type: "execute", id, code, windowId: target, timestamp: Date.now() }));
    });
  }
}

export const easyEdaBridge = new EasyEdaBridge();
