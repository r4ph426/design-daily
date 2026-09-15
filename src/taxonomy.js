export const CATEGORIES = Object.freeze(["UI", "UX", "Process", "Culture"]);

const categorySet = new Set(CATEGORIES);

export function validateCategoryRecord(record, label = "record", { requireAiLens = true } = {}) {
  if (!categorySet.has(record?.category)) {
    throw new Error(`${label} has invalid category: ${record?.category ?? "missing"}`);
  }
  if (!Array.isArray(record.tags) || record.tags.some((tag) => !categorySet.has(tag))) {
    throw new Error(`${label} has invalid category tags`);
  }
  if (requireAiLens && typeof record.aiLens !== "boolean") {
    throw new Error(`${label} must declare aiLens as a boolean`);
  }
  return record;
}

export function validateEditionTaxonomy(edition) {
  if (!Array.isArray(edition?.questions)) throw new Error("Edition questions are missing");
  edition.questions.forEach((question, index) => validateCategoryRecord(question, `question ${index + 1}`));
  return edition;
}
