import { Robot } from "@phosphor-icons/react";

export function AiLensBadge() {
  return (
    <span className="ai-lens-badge">
      <Robot size={13} weight="bold" aria-hidden="true" />
      <span>AI lens</span>
    </span>
  );
}
