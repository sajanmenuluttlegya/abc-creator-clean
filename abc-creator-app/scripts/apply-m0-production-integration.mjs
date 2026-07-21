import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const appRoot = path.join(repoRoot, "abc-creator-app");
const componentsRoot = path.join(appRoot, "components");
const M0_CREDITS = '{ "360p": 9, "480p": 11, "720p": 13, "1080p": 15 }';

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, content) {
  fs.writeFileSync(file, content, "utf8");
}

function requiredReplace(content, from, to, label) {
  if (content.includes(to)) return content;
  if (!content.includes(from)) throw new Error(`Missing expected pattern: ${label}`);
  return content.replace(from, to);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function patchImageModels() {
  const file = path.join(appRoot, "lib/image-tools/image-models.ts");
  let content = read(file);

  content = requiredReplace(
    content,
    'export type ImageModelKey = "M1" | "M2" | "M3" | "M4" | "M5" | "M6";',
    'export type ImageModelKey = "M0" | "M1" | "M2" | "M3" | "M4" | "M5" | "M6";',
    "shared ImageModelKey",
  );

  if (!content.includes("  M0: {")) {
    content = requiredReplace(
      content,
      '}> = {\n  M1: {',
      `}> = {\n  M0: {\n    label: "M0",\n    modelId: "Tongyi-MAI/Z-Image-Turbo",\n    defaultSteps: 8,\n    creditByResolution: ${M0_CREDITS},\n  },\n  M1: {`,
      "M0 shared model registry entry",
    );
  }

  write(file, content);
}

function patchCloudflareClient() {
  const file = path.join(appRoot, "lib/image-tools/cloudflare-image-client.ts");
  let content = read(file);

  if (!content.includes('from "./m0-image-client"')) {
    content = requiredReplace(
      content,
      'import { getActiveCloudflareAICredentials, type CloudflareAICredential } from "./cloudflare-credentials";\n',
      'import { getActiveCloudflareAICredentials, type CloudflareAICredential } from "./cloudflare-credentials";\nimport { generateM0Image } from "./m0-image-client";\n',
      "M0 client import",
    );
  }

  content = requiredReplace(
    content,
    "type GenerateImageInput = {",
    "export type GenerateImageInput = {",
    "export GenerateImageInput",
  );

  content = requiredReplace(
    content,
    "const MODEL_REQUEST_FORMAT: Record<ImageModelKey, RequestFormat> = {",
    'const MODEL_REQUEST_FORMAT: Record<Exclude<ImageModelKey, "M0">, RequestFormat> = {',
    "Cloudflare-only model map",
  );

  if (!content.includes('M0 must be routed through the dedicated worker client.')) {
    content = requiredReplace(
      content,
      "function buildRequestFields(input: GenerateImageInput) {\n  const model = IMAGE_MODEL_OPTIONS[input.model];",
      'function buildRequestFields(input: GenerateImageInput) {\n  if (input.model === "M0") throw new Error("M0 must be routed through the dedicated worker client.");\n  const model = IMAGE_MODEL_OPTIONS[input.model];',
      "Cloudflare M0 guard",
    );
  }

  if (!content.includes("return generateM0Image(input);")) {
    content = requiredReplace(
      content,
      "export async function generateCloudflareImageWithManualFailover(input: GenerateImageInput) {\n  const credentials = await getActiveCloudflareAICredentials();",
      'export async function generateCloudflareImageWithManualFailover(input: GenerateImageInput) {\n  if (input.model === "M0") {\n    return generateM0Image(input);\n  }\n\n  const credentials = await getActiveCloudflareAICredentials();',
      "M0 provider routing",
    );
  }

  write(file, content);
}

function patchTextToImageRoute() {
  const file = path.join(appRoot, "app/api/image/text-to-image/route.ts");
  let content = read(file);

  const oldBlock = `      actualModelLabels.add(result.modelKey || effectiveModel);
      usedPromptRescue = usedPromptRescue || Boolean(result.promptRescueUsed);
      usedModelFallback = usedModelFallback || Boolean(result.fallbackModelUsed);

      images.push({
        index: index + 1,
        dataUrl: result.dataUrl,
        filename: operation === "edit" ? \`image-edit-\${result.modelKey || effectiveModel}-\${resolution}-\${index + 1}.png\` : \`text-to-image-\${result.modelKey || effectiveModel}-\${resolution}-\${index + 1}.png\`,
        provider: "cloudflare-workers-ai",
        postProcess: "provider-native",
        model: result.modelId,
        modelLabel: result.modelKey || effectiveModel,
        requestedModel,
        modelUsed: result.modelKey || effectiveModel,
        effectiveModel,
        fallbackModelUsed: result.fallbackModelUsed,
        promptRescueUsed: result.promptRescueUsed,
        credentialSlot: result.credentialSlot,
        width: result.width,
        height: result.height,
      });`;

  const newBlock = `      const resultModel = result.modelKey || effectiveModel;
      const resultIsM0 = resultModel === "M0";
      actualModelLabels.add(resultModel);
      usedPromptRescue = usedPromptRescue || Boolean(result.promptRescueUsed);
      usedModelFallback = usedModelFallback || Boolean(result.fallbackModelUsed);

      images.push({
        index: index + 1,
        dataUrl: result.dataUrl,
        filename: operation === "edit" ? \`image-edit-\${resultModel}-\${resolution}-\${index + 1}.png\` : \`text-to-image-\${resultModel}-\${resolution}-\${index + 1}.png\`,
        provider: resultIsM0 ? "kaggle-m0-worker" : "cloudflare-workers-ai",
        postProcess: resultIsM0 ? "native-aligned-crop" : "provider-native",
        model: result.modelId,
        modelLabel: resultModel,
        requestedModel,
        modelUsed: resultModel,
        effectiveModel,
        fallbackModelUsed: result.fallbackModelUsed,
        promptRescueUsed: result.promptRescueUsed,
        credentialSlot: result.credentialSlot,
        width: result.width,
        height: result.height,
      });`;

  content = requiredReplace(content, oldBlock, newBlock, "text-to-image M0 response metadata");

  if (!content.includes('const usedM0 = actualModelLabels.has("M0");')) {
    content = requiredReplace(
      content,
      '    const actualModelSummary = Array.from(actualModelLabels).join(",") || effectiveModel;\n    const spendResponse = await supabase.rpc("spend_reserved_credits", {',
      '    const actualModelSummary = Array.from(actualModelLabels).join(",") || effectiveModel;\n    const usedM0 = actualModelLabels.has("M0");\n    const spendResponse = await supabase.rpc("spend_reserved_credits", {',
      "M0 spend provider flag",
    );
  }

  content = requiredReplace(
    content,
    '      p_provider: operation === "edit" ? "image:premium-edit:cloudflare-workers-ai" : "image:premium-generation:cloudflare-workers-ai",',
    '      p_provider: usedM0 ? "image:premium-generation:kaggle-m0-worker" : operation === "edit" ? "image:premium-edit:cloudflare-workers-ai" : "image:premium-generation:cloudflare-workers-ai",',
    "M0 spend provider",
  );

  content = requiredReplace(
    content,
    '      outputPolish: "provider-native",',
    '      outputPolish: usedM0 ? "native-aligned-crop" : "provider-native",',
    "M0 output metadata",
  );

  write(file, content);
}

function patchMainPanel(content) {
  if (!content.includes("const EDIT_MODEL_OPTIONS = MODEL_OPTIONS.filter")) {
    content = requiredReplace(
      content,
      "];\nconst RESOLUTION_OPTIONS:",
      '];\nconst EDIT_MODEL_OPTIONS = MODEL_OPTIONS.filter((option) => option.value === "M1" || option.value === "M2");\nconst RESOLUTION_OPTIONS:',
      "main edit model options",
    );
  }

  content = content.replace(
    "negativePrompt, model, resolution, aspectRatio, imageCount: 1",
    'negativePrompt, model: model === "M0" ? "M2" : model, resolution, aspectRatio, imageCount: 1',
  );

  const dropdown = '<ImageComposerDropdown label="Model" value={model} options={MODEL_OPTIONS} onChange={(value) => setModel(value as ImageModelKey)} />';
  const last = content.lastIndexOf(dropdown);
  if (last >= 0) {
    const replacement = '<ImageComposerDropdown label="Model" value={model === "M0" ? "M2" : model} options={EDIT_MODEL_OPTIONS} onChange={(value) => setModel(value as ImageModelKey)} />';
    content = content.slice(0, last) + replacement + content.slice(last + dropdown.length);
  }

  return content;
}

function patchComponents() {
  const skip = new Set(["ImageCombinePanel.tsx", "ProfessionalHeadshotGeneratorPanel.tsx"]);
  const changed = [];

  for (const file of walk(componentsRoot)) {
    if (!file.endsWith(".tsx") || skip.has(path.basename(file))) continue;
    let content = read(file);
    const before = content;

    content = content.replace(
      'type ImageModelKey = "M1" | "M2" | "M3" | "M4" | "M5" | "M6";',
      'type ImageModelKey = "M0" | "M1" | "M2" | "M3" | "M4" | "M5" | "M6";',
    );

    if (!content.includes('value: "M0"')) {
      content = content.replace(
        /(const\s+(?:ALL_)?MODEL_OPTIONS[^=]*=\s*\[\r?\n)(\s*\{[^\n]*value:\s*"M1"[^\n]*\r?\n?)/,
        (match, prefix, first) => {
          const field = first.includes("hint:") ? "hint" : "meta";
          return `${prefix}  { label: "M0", value: "M0", ${field}: "Private fast worker" },\n${first}`;
        },
      );
    }

    if (!content.includes(`M0: ${M0_CREDITS}`)) {
      content = content.replace(
        /(const\s+CREDIT_MAP[^=]*=\s*\{\r?\n)/,
        `$1  M0: ${M0_CREDITS},\n`,
      );
    }

    content = content.replace(
      "const EDIT_MODEL_OPTIONS = ALL_MODEL_OPTIONS.slice(0, 2);",
      'const EDIT_MODEL_OPTIONS = ALL_MODEL_OPTIONS.filter((option) => option.value === "M1" || option.value === "M2");',
    );

    if (path.basename(file) === "ImageTextToImagePanel.tsx") {
      content = patchMainPanel(content);
    }

    if (content !== before) {
      write(file, content);
      changed.push(path.relative(appRoot, file));
    }
  }

  if (changed.length < 7) {
    throw new Error(`Only ${changed.length} image UI files were patched: ${changed.join(", ")}`);
  }

  console.log(`Patched ${changed.length} image UI files:`);
  changed.forEach((item) => console.log(`  - ${item}`));
}

function patchEnvExample() {
  const files = [path.join(repoRoot, ".env.m0.example"), path.join(appRoot, ".env.m0.example")];
  const file = files.find((candidate) => fs.existsSync(candidate));
  if (!file) return;

  let content = read(file).trimEnd();
  if (!content.includes("M0_WORKER_API_KEY=")) content += "\nM0_WORKER_API_KEY=replace-with-private-worker-key";
  if (!content.includes("M0_WORKER_TIMEOUT_MS=")) content += "\nM0_WORKER_TIMEOUT_MS=285000";
  write(file, `${content}\n`);
}

function validate() {
  const imageModels = read(path.join(appRoot, "lib/image-tools/image-models.ts"));
  const cloudflare = read(path.join(appRoot, "lib/image-tools/cloudflare-image-client.ts"));
  const route = read(path.join(appRoot, "app/api/image/text-to-image/route.ts"));
  const panel = read(path.join(appRoot, "components/ImageTextToImagePanel.tsx"));
  const client = read(path.join(appRoot, "lib/image-tools/m0-image-client.ts"));

  const checks = {
    sharedModel: imageModels.includes('"M0" | "M1"') && imageModels.includes("Tongyi-MAI/Z-Image-Turbo"),
    providerRoute: cloudflare.includes("return generateM0Image(input);"),
    workerAuth: client.includes('"x-worker-key": workerKey'),
    workerRegistry: client.includes("getActiveM0Worker"),
    exactNativeOutput: client.includes("M0_16_9_DIMENSIONS") && client.includes("metadata.width !== target.width"),
    responseMetadata: route.includes('provider: resultIsM0 ? "kaggle-m0-worker"'),
    refundPath: route.includes('refundIfReserved("text_to_image_generation_failed")'),
    editSafety: panel.includes('model: model === "M0" ? "M2" : model') && panel.includes("options={EDIT_MODEL_OPTIONS}"),
  };

  if (!Object.values(checks).every(Boolean)) {
    throw new Error(`Validation failed: ${JSON.stringify(checks)}`);
  }

  console.log("M0 integration validation passed:", checks);
}

patchImageModels();
patchCloudflareClient();
patchTextToImageRoute();
patchComponents();
patchEnvExample();
validate();
console.log("M0 production website integration patch completed.");
