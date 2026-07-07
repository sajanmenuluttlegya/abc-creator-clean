type AiPromptInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type AiPromptTool = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  detailEmoji: string;
  category: string;
  displayCreditCost: number;
  outputType: "text";
  aliases?: string[];
  inputs: AiPromptInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const videoTypeOptions = ["Product ad", "Cinematic scene", "YouTube intro", "Short-form social video", "Explainer video", "Documentary scene", "Animation prompt", "3D animation prompt", "Storyboard prompt"];
const aspectRatioOptions = ["16:9", "9:16", "1:1", "4:5", "21:9", "Custom in brief"];
const styleOptions = ["Cinematic realistic", "Premium product commercial", "Clean studio", "Documentary", "Anime-inspired", "3D animation", "Motion graphics", "Luxury editorial", "UGC-style"];
const promptDepthOptions = ["Simple prompt", "Detailed prompt", "Shot-by-shot prompt", "Prompt pack with variations"];
const promptVariationOptions = ["1 variation", "3 variations", "5 variations", "10 variations"];

export const aiPromptBatchTools: AiPromptTool[] = [
  {
    id: "video-prompt-generator",
    slug: "video-prompt-generator",
    name: "Video Prompt Generator",
    description: "Create text-only video generation prompts, shot prompts, storyboard prompts, and prompt packs for future video tools.",
    icon: "spark",
    detailEmoji: "🎞️",
    category: "AI Tools",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["ai-video-prompt-generator", "text-to-video-prompt-generator", "video-generation-prompt", "video-prompt-maker"],
    inputs: [
      { id: "video_brief", label: "Video Brief", type: "textarea", placeholder: "Describe the video idea, product/scene, subject, action, setting, mood, camera movement, and key details.", required: true },
      { id: "video_type", label: "Video Type", type: "select", required: true, options: videoTypeOptions },
      { id: "visual_style", label: "Visual Style", type: "select", required: true, options: styleOptions },
      { id: "aspect_ratio", label: "Aspect Ratio", type: "select", required: true, options: aspectRatioOptions },
      { id: "duration", label: "Target Duration", type: "text", placeholder: "e.g., 5 seconds, 10 seconds, 30 seconds", required: true },
      { id: "prompt_depth", label: "Prompt Depth", type: "select", required: true, options: promptDepthOptions },
      { id: "prompt_variations", label: "Prompt Variations", type: "select", required: true, options: promptVariationOptions },
      { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: camera motion, colors, lighting, brand style, scene details, product details, negative prompt needs.", required: false },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: text in image, logos, watermark, extra fingers, distortions, unsafe visuals, wrong style, or banned elements.", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
];
