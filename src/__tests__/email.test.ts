import { createServer } from "node:net";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it("delivers an account message through the SMTP transport", async () => {
  // Local SMTP sink: no message can leave this machine.
  let message = "";
  const commands: string[] = [];
  const server = createServer(socket => {
    socket.setEncoding("utf8");
    socket.write("220 localhost ESMTP\r\n");
    let pending = "", receiving = false;
    socket.on("data", chunk => {
      pending += chunk;
      let end;
      while ((end = pending.indexOf("\r\n")) >= 0) {
        const line = pending.slice(0, end); pending = pending.slice(end + 2);
        if (receiving && line !== ".") { message += line + "\r\n"; continue; }
        if (receiving) { receiving = false; socket.write("250 accepted\r\n"); continue; }
        commands.push(line);
        if (line.startsWith("EHLO")) socket.write("250-localhost\r\n250 AUTH PLAIN\r\n");
        else if (line.startsWith("AUTH")) socket.write("235 authenticated\r\n");
        else if (line === "DATA") { receiving = true; socket.write("354 send message\r\n"); }
        else if (line === "QUIT") { socket.end("221 bye\r\n"); }
        else socket.write("250 ok\r\n");
      }
    });
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No SMTP test port");
    vi.stubEnv("SMTP_HOST", "127.0.0.1"); vi.stubEnv("SMTP_PORT", String(address.port));
    vi.stubEnv("SMTP_USER", "test-user"); vi.stubEnv("SMTP_PASS", "test-password");
    vi.stubEnv("SMTP_FROM", "Paddock <sender@example.invalid>");
    const { sendEmail } = await import("@/lib/email");
    expect(await sendEmail({ to: "staff@example.invalid", subject: "Your Paddock invitation", text: "Open your invitation link.", html: "<p>Open your invitation link.</p>" })).toBe(true);
    expect(commands).toContain("RCPT TO:<staff@example.invalid>");
    expect(message).toContain("Subject: Your Paddock invitation");
    expect(message).toContain("Open your invitation link.");
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

it("reports unavailable email delivery without SMTP credentials", async () => {
  vi.stubEnv("SMTP_HOST", ""); vi.stubEnv("SMTP_USER", ""); vi.stubEnv("SMTP_PASS", "");
  const { emailEnabled, sendEmail } = await import("@/lib/email");
  expect(emailEnabled).toBe(false);
  expect(await sendEmail({ to: "staff@example.invalid", subject: "Test", text: "Test" })).toBe(false);
});
