"use client";

import { useState } from "react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title} 🎓`)}&url=${encodeURIComponent(url)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copy} className="btn-secondary">
        {copied ? "Copied!" : "Copy verification link"}
      </button>
      <a href={linkedin} target="_blank" rel="noreferrer" className="btn-secondary">
        Share on LinkedIn
      </a>
      <a href={x} target="_blank" rel="noreferrer" className="btn-secondary">
        Post on X
      </a>
    </div>
  );
}
