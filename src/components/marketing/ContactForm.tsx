"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TOPICS = [
  { value: "general", label: "General" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "partnerships", label: "Partnerships" },
  { value: "compliance", label: "Compliance" },
] as const;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState<string>("general");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot.trim()) return;
    setStatus("loading");
    setErrMsg(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          topic,
          message: message.trim(),
          website: honeypot,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || data.success === false) {
        setStatus("err");
        setErrMsg(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }
      setStatus("ok");
      setMessage("");
    } catch {
      setStatus("err");
      setErrMsg("Network error. Try again.");
    }
  }

  if (status === "ok") {
    return (
      <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground" role="status">
        Sent. Check your inbox for a confirmation email.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-lg space-y-4">
      <div className="hidden" aria-hidden>
        <Label htmlFor="contact-website">Company website</Label>
        <Input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          name="name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={120}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-company">Company (optional)</Label>
        <Input
          id="contact-company"
          name="company"
          autoComplete="organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          maxLength={200}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-topic">Topic</Label>
        <select
          id="contact-topic"
          name="topic"
          required
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minLength={20}
          maxLength={8000}
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {errMsg ? (
        <p className="text-sm text-destructive" role="alert">
          {errMsg}
        </p>
      ) : null}
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
