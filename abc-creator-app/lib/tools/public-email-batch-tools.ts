import { creativeEmailBatchTools } from "./public-creative-email-batch-tools";

export const emailBatchTools = creativeEmailBatchTools.filter((tool) => tool.slug.includes("email"));
