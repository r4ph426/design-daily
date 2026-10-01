export function HighlightedText({ text, as: Tag = "strong" }) {
  // Preserve existing React copy; parse edition emphasis without rendering HTML.
  if (typeof text !== "string") return text ?? null;
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith("**") && part.endsWith("**")
    ? <Tag key={index}>{part.slice(2, -2)}</Tag>
    : part);
}
