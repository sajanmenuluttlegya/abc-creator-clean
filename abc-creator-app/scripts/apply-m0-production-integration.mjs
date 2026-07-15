import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const appRoot = path.join(repoRoot, "abc-creator-app");
const componentsRoot = path.join(appRoot, "components");

const M0_CREDITS = '{ "360p": 2, "480p": 3, "720p": 4, "1080p": 5 }';

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function replaceRequired(content, from, to, label) {
  if (content.includes(to)) return content;
  if (!content.includes(from)) {
    throw new Error(`Missing expected pattern for ${label}`);
  }
  return content.replace(from, to);
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

function patchImageModels() {
  const file = path.join(appRoot, "lib/image-tools/image-models.ts");
  let content = read(file);

  content = replaceRequired(
    content,
    'export type ImageModelKey = "M1" | "M2" | "M3" | "M4" | "M5" | "M6";',
    'export type ImageModelKey = "M0" | "M1" | "M2" | "M3" | "M4" | "M5" | "M6";',
    "shared ImageModelKey",
  );

  if (!content.includes("  M0: {")) {
    content = replaceRequired(
      content,
      '}> = {\n  M1: {',
      `}> = {\n  M0: {\n    label: "M0",\n    modelId: "Tongyi-MAI/Z-Image-Turbo",\n    defaultSteps: 4,\n    creditByResolution: ${M0_CREDITS},\n  },\n  M1: {`,
      "M0 model registry entry",
    );
  }

  write(file, content);
}

function createM0Client() {
  const file = path.join(appRoot, "lib/image-tools/m0-image-client.ts");
  const content = `import sharp from "sharp";
import { getActiveM0Worker } from "./m0-worker-registry";
import {
  getImageDimensions,
  type ImageAspectRatio,
  type ImageResolution,
} from "./image-models";

export type M0GenerateImageInput = {
  prompt: string;
  negativePrompt?: string;
  resolution: ImageResolution;
  aspectRatio: ImageAspectRatio;
  style?: string;
  seed?: string;
  operation?: "generate" | "edit" | "combine";
};

const M0_MODEL_ID = "Tongyi-MAI/Z-Image-Turbo";
const DEFAULT_TIMEOUT_MS = 285_000;
const MAX_PROMPT_CHARS = 1_900;

function requestTimeoutMs() {
  const configured = Number(process.env.M0_WORKER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(configured)) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(Math.floor(configured), 30_000), 295_000);
}

function stableSeed(value: string | undefined) {
  const text = (value || "").trim();
  if (!text) return Math.floor(Math.random() * 2_147_483_646) + 1;

  const numeric = Number(text);
  if (Number.isFinite(numeric)) {
    return Math.min(Math.max(Math.floor(Math.abs(numeric)), 1), 2_147_483_647);
  }

  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2_147_483_647 || 1;
}

function workerDimensions(width: number, height: number) {
  if (width === height) return { width: 512, height: 512 };
  return width > height
    ? { width: 512, height: 384 }
    : { width: 384, height: 512 };
}

function workerPrompt(input: M0GenerateImageInput) {
  const combined = [
    input.prompt.trim(),
    input.style?.trim() ? `Style: ${input.style.trim()}` : "",
    input.negativePrompt?.trim() ? `Avoid: ${input.negativePrompt.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  return combined.length <= MAX_PROMPT_CHARS
    ? combined
    : `${combined.slice(0, MAX_PROMPT_CHARS - 1).trim()}…`;
}

async function workerError(response: Response) {
  const raw = (await response.text().catch(() => "")).trim();
  let detail = raw;

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { detail?: unknown; error?: unknown; message?: unknown };
      detail = String(parsed.detail || parsed.error || parsed.message || raw);
    } catch {
      detail = raw;
    }
  }

  if (response.status === 401) return "M0 worker authentication failed. Check M0_WORKER_API_KEY in Vercel.";
  if (response.status === 429) return "M0 is currently generating another image. Try again shortly.";
  if (response.status === 503) return "M0 is temporarily outside its active worker window.";
  return detail || `M0 worker returned HTTP ${response.status}.`;
}

export async function generateM0Image(input: M0GenerateImageInput) {
  if ((input.operation || "generate") !== "generate") {
    throw new Error("M0 supports text-to-image generation only. Use M1 or M2 for reference-image editing.");
  }

  const workerKey = process.env.M0_WORKER_API_KEY?.trim();
  if (!workerKey) {
    throw new Error("M0 is not configured on the server. Add M0_WORKER_API_KEY to Vercel.");
  }

  const worker = await getActiveM0Worker();
  if (!worker) {
    throw new Error("M0 is temporarily offline. No healthy registered worker is available.");
  }

  const target = getImageDimensions(input.resolution, input.aspectRatio);
  const native = workerDimensions(target.width, target.height);
  const seed = stableSeed(input.seed);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs());

  try {
    const response = await fetch(`${worker.publicUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-key": workerKey,
      },
      body: JSON.stringify({
        prompt: workerPrompt(input),
        width: native.width,
        height: native.height,
        steps: 4,
        seed,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await workerError(response));
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/") && !contentType.startsWith("application/octet-stream")) {
      throw new Error("M0 worker returned an invalid non-image response.");
    }

    const source = Buffer.from(await response.arrayBuffer());
    if (source.length < 100) {
      throw new Error("M0 worker returned an empty image.");
    }

    const metadata = await sharp(source).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error("M0 worker returned an unreadable image.");
    }

    const output = await sharp(source)
      .resize(target.width, target.height, {
        fit: "cover",
        position: "centre",
        withoutEnlargement: false,
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    return {
      ok: true as const,
      dataUrl: `data:image/png;base64,${output.toString("base64")}`,
      modelId: M0_MODEL_ID,
      modelKey: "M0" as const,
      requestedModelKey: "M0" as const,
      credentialSlot: worker.workerName,
      workerName: worker.workerName,
      width: target.width,
      height: target.height,
      seed,
      fallbackModelUsed: false,
      promptRescueUsed: false,
      provider: "kaggle-m0-worker" as const,
      postProcess: "sharp-resize" as const,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("M0 generation timed out before the worker returned an image.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
`;

  write(file, content);
}

function patchCloudflareClient() {
  const file = path.join(appRoot, "lib/image-tools/cloudflare-image-client.ts");
  let content = read(file);

  if (!content.includes('from "./m0-image-client"')) {
    content = replaceRequired(
      content,
      'import { getActiveCloudflareAICredentials, type CloudflareAICredential } from "./cloudflare-credentials";\n',
      'import { getActiveCloudflareAICredentials, type CloudflareAICredential } from "./cloudflare-credentials";\nimport { generateM0Image } from "./m0-image-client";\n',
      "M0 client import",
    );
  }

  content = replaceRequired(
    content,
    "type GenerateImageInput = {",
    "export type GenerateImageInput = {",
    "export generation input type",
  );

  content = replaceRequired(
    content,
    "const MODEL_REQUEST_FORMAT: Record<ImageModelKey, RequestFormat> = {",
    'const MODEL_REQUEST_FORMAT: Record<Exclude<ImageModelKey, "M0">, RequestFormat> = {',
    "Cloudflare-only model request map",
  );

  if (!content.includes('if (input.model === "M0") throw new Error("M0 must be routed through the dedicated worker client.");')) {
    content = replaceRequired(
      content,
      "function buildRequestFields(input: GenerateImageInput) {\n  const model = IMAGE_MODEL_OPTIONS[input.model];",
      'function buildRequestFields(input: GenerateImageInput) {\n  if (input.model === "M0") throw new Error("M0 must be routed through the dedicated worker client.");\n  const model = IMAGE_MODEL_OPTIONS[input.model];',
      "Cloudflare M0 guard",
    );
  }

  if (!content.includes("return generateM0Image(input);")) {
    content = replaceRequired(
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
        postProcess: resultIsM0 ? "sharp-resize" : "provider-native",
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

  content = replaceRequired(content, oldBlock, newBlock, "M0 response metadata");

  if (!content.includes("const usedM0 = actualModelLabels.has(\"M0\");")) {
    content = replaceRequired(
      content,
      "    const actualModelSummary = Array.from(actualModelLabels).join(\",\") || effectiveModel;\n    const spendResponse = await supabase.rpc(\"spend_reserved_credits\", {",
      '    const actualModelSummary = Array.from(actualModelLabels).join(",") || effectiveModel;\n    const usedM0 = actualModelLabels.has("M0");\n    const spendResponse = await supabase.rpc("spend_reserved_credits", {',
      "M0 ledger provider flag",
    );
  }

  content = replaceRequired(
    content,
    '      p_provider: operation === "edit" ? "image:premium-edit:cloudflare-workers-ai" : "image:premium-generation:cloudflare-workers-ai",',
    '      p_provider: usedM0 ? "image:premium-generation:kaggle-m0-worker" : operation === "edit" ? "image:premium-edit:cloudflare-workers-ai" : "image:premium-generation:cloudflare-workers-ai",',
    "M0 ledger provider",
  );

  content = replaceRequired(
    content,
    '      outputPolish: "provider-native",',
    '      outputPolish: usedM0 ? "sharp-resize" : "provider-native",',
    "M0 output polish metadata",
  );

  write(file, content);
}

function patchMainPanel(content) {
  if (!content.includes("const EDIT_MODEL_OPTIONS = MODEL_OPTIONS.filter")) {
    const marker = "];\nconst RESOLUTION_OPTIONS:";
    content = replaceRequired(
      content,
      marker,
      '];\nconst EDIT_MODEL_OPTIONS = MODEL_OPTIONS.filter((option) => option.value === "M1" || option.value === "M2");\nconst RESOLUTION_OPTIONS:',
      "main edit model options",
    );
  }

  const requestNeedle = "negativePrompt, model, resolution, aspectRatio, imageCount: 1";
  if (content.includes(requestNeedle)) {
    content = content.replace(
      requestNeedle,
      'negativePrompt, model: model === "M0" ? "M2" : model, resolution, aspectRatio, imageCount: 1',
    );
  }

  const dropdownNeedle = '<ImageComposerDropdown label="Model" value={model} options={MODEL_OPTIONS} onChange={(value) => setModel(value as ImageModelKey)} />';
  const last = content.lastIndexOf(dropdownNeedle);
  if (last >= 0) {
    const replacement = '<ImageComposerDropdown label="Model" value={model === "M0" ? "M2" : model} options={EDIT_MODEL_OPTIONS} onChange={(value) => setModel(value as ImageModelKey)} />';
    content = `${content.slice(0, last)}${replacement}${content.slice(last + dropdownNeedle.length)}`;
  }

  return content;
}

function patchComponentModelSelectors() {
  const skip = new Set([
    "ImageCombinePanel.tsx",
    "ProfessionalHeadshotGeneratorPanel.tsx",
  ]);
  const patched = [];

  for (const file of listFiles(componentsRoot)) {
    if (!file.endsWith(".tsx") || skip.has(path.basename(file))) continue;
    let content = read(file);
    const before = content;

    content = content.replace(
      'type ImageModelKey = "M1" | "M2" | "M3" | "M4" | "M5" | "M6";',
      'type ImageModelKey = "M0" | "M1" | "M2" | "M3" | "M4" | "M5" | "M6";',
    );

    if (!content.includes('value: "M0"') && /const\s+(?:ALL_)?MODEL_OPTIONS[^=]*=\s*\[/.test(content)) {
      content = content.replace(
        /(const\s+(?:ALL_)?MODEL_OPTIONS[^=]*=\s*\[\r?\n)/,
        (match) => {
          const arrayTail = content.slice(content.indexOf(match) + match.length, content.indexOf("];", content.indexOf(match)));
          const field = arrayTail.includes("hint:") ? "hint" : "meta";
          return `${match}  { label: "M0 — Z-Image Turbo", value: "M0", ${field}: "Private fast worker" },\n`;
        },
      );
    }

    if (!content.includes(`M0: ${M0_CREDITS}`) && /const\s+CREDIT_MAP[^=]*=\s*\{\r?\n/.test(content)) {
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
      patched.push(path.relative(appRoot, file));
    }
  }

  if (patched.length < 7) {
    throw new Error(`Expected at least 7 image UI files to be patched, got ${patched.length}: ${patched.join(", ")}`);
  }

  console.log(`Patched M0 selectors in ${patched.length} UI files:`);
  patched.forEach((file) => console.log(`  - ${file}`));
}

function patchEnvironmentExample() {
  const candidates = [
    path.join(repoRoot, ".env.m0.example"),
    path.join(appRoot, ".env.m0.example"),
  ];
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) return;

  let content = read(file).trimEnd();
  if (!content.includes("M0_WORKER_API_KEY=")) {
    content += "\nM0_WORKER_API_KEY=replace-with-private-worker-key";
  }
  if (!content.includes("M0_WORKER_TIMEOUT_MS=")) {
    content += "\nM0_WORKER_TIMEOUT_MS=285000";
  }
  write(file, `${content}\n`);
}

function validate() {
  const imageModels = read(path.join(appRoot, "lib/image-tools/image-models.ts"));
  const cloudflareClient = read(path.join(appRoot, "lib/image-tools/cloudflare-image-client.ts"));
  const mainRoute = read(path.join(appRoot, "app/api/image/text-to-image/route.ts"));
  const mainPanel = read(path.join(appRoot, "components/ImageTextToImagePanel.tsx"));
  const m0Client = read(path.join(appRoot, "lib/image-tools/m0-image-client.ts"));

  const checks = {
    sharedType: imageModels.includes('"M0" | "M1"'),
    sharedRegistry: imageModels.includes("  M0: {") && imageModels.includes("Tongyi-MAI/Z-Image-Turbo"),
    providerRouting: cloudflareClient.includes('if (input.model === "M0")') && cloudflareClient.includes("return generateM0Image(input);"),
    m0Auth: m0Client.includes('"x-worker-key": workerKey'),
    m0Registry: m0Client.includes("getActiveM0Worker"),
    m0Resize: m0Client.includes("sharp(source)") && m0Client.includes("getImageDimensions"),
    routeMetadata: mainRoute.includes('provider: resultIsM0 ? "kaggle-m0-worker"'),
    routeRefund: mainRoute.includes('refundIfReserved("text_to_image_generation_failed")'),
    editSafety: mainPanel.includes('model: model === "M0" ? "M2" : model') && mainPanel.includes("options={EDIT_MODEL_OPTIONS}"),
  };

  if (!Object.values(checks).every(Boolean)) {
    throw new Error(`M0 integration validation failed: ${JSON.stringify(checks)}`);
  }

  console.log("M0 integration validation passed:", checks);
}

patchImageModels();
createM0Client();
patchCloudflareClient();
patchTextToImageRoute();
patchComponentModelSelectors();
patchEnvironmentExample();
validate();

console.log("M0 production website integration patch completed.");
