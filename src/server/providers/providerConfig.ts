export function envFlagEnabled(value: string | undefined, defaultValue = false) {
  if (typeof value === "undefined") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on", "enabled"].includes(value.trim().toLowerCase());
}

export function getFotonProviderConfig() {
  return {
    exaEnabled: envFlagEnabled(process.env.FOTON_EXA_ENABLED, false),
    notionEnabled: envFlagEnabled(process.env.FOTON_NOTION_ENABLED, false),
    exaMaxResults: Math.min(Math.max(Number(process.env.FOTON_EXA_MAX_RESULTS || 3), 1), 5),
    notionMaxResults: Math.min(Math.max(Number(process.env.FOTON_NOTION_MAX_RESULTS || 3), 1), 5),
    maxQuestionLength: Math.min(Math.max(Number(process.env.FOTON_MAX_QUESTION_LENGTH || 500), 80), 1000),
  };
}

export function trimQuestionForProvider(question: string) {
  const { maxQuestionLength } = getFotonProviderConfig();
  return question.trim().slice(0, maxQuestionLength);
}
