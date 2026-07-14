"use client";

import { useEffect, useState } from "react";

type CheckStatus = "checking" | "supported" | "unsupported";
type RunStatus = "idle" | "checking" | "ready" | "generating" | "done" | "error";

type BrowserGpu = {
  requestAdapter: () => Promise<{
    requestDevice: () => Promise<unknown>;
  } | null>;
};

type NavigatorWithGpu = Navigator & {
  gpu?: BrowserGpu;
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const MLC_WEBSD_DEMO_URL = "https://websd.mlc.ai/";

export function BrowserImageGeneratorPanel() {
  const [gpuStatus, setGpuStatus] = useState<CheckStatus>("checking");
  const [runStatus, setRunStatus] = useState<RunStatus>("checking");
  const [message, setMessage] = useState("Checking browser GPU support...");
  const [details, setDetails] = useState("");
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("512x512");
  const [previewText, setPreviewText] = useState("");
  const [showRealDemo, setShowRealDemo] = useState(false);

  async function checkWebGpu() {
    setGpuStatus("checking");
    setRunStatus("checking");
    setMessage("Checking browser GPU support...");
    setDetails("");

    try {
      const nav = navigator as NavigatorWithGpu;

      if (!nav.gpu) {
        setGpuStatus("unsupported");
        setRunStatus("error");
        setMessage("WebGPU is not available in this browser.");
        setDetails("Use latest Chrome or Edge on desktop. Many phones, Safari, Firefox, and older browsers may not work.");
        return;
      }

      const adapter = await nav.gpu.requestAdapter();

      if (!adapter) {
        setGpuStatus("unsupported");
        setRunStatus("error");
        setMessage("WebGPU exists, but no compatible GPU adapter was found.");
        setDetails("This usually means the device, browser, driver, or browser settings cannot run WebGPU.");
        return;
      }

      await adapter.requestDevice();

      setGpuStatus("supported");
      setRunStatus("ready");
      setMessage("Browser GPU is supported.");
      setDetails("This device can try local browser-side image generation. Next we will connect the actual browser AI model.");
    } catch (error) {
      setGpuStatus("unsupported");
      setRunStatus("error");
      setMessage("WebGPU check failed.");
      setDetails(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleGenerate() {
    const cleanPrompt = prompt.trim();

    if (!cleanPrompt) {
      setRunStatus("error");
      setMessage("Add a prompt first.");
      setDetails("Example: a cute robot writing a blog post, neon purple lighting, clean SaaS illustration");
      return;
    }

    if (gpuStatus !== "supported") {
      await checkWebGpu();
      return;
    }

    setRunStatus("generating");
    setMessage("Preparing browser-side generation UI...");
    setDetails("Stage 2 is only a UI shell. The actual local image model will be connected in the next step.");
    setPreviewText("");

    const steps = [
      "Reading prompt...",
      "Checking selected size...",
      "Preparing local model slot...",
      "Preparing output preview...",
      "Ready for real model integration."
    ];

    let output = "";

    for (const step of steps) {
      output += `${step}\n`;
      setPreviewText(output);
      await wait(450);
    }

    setRunStatus("done");
    setMessage("UI shell is working.");
    setDetails("The next patch will replace this fake preview with the real browser image model.");
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkWebGpu();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const statusClasses =
    gpuStatus === "supported"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
      : gpuStatus === "unsupported"
        ? "border-red-400/30 bg-red-400/10 text-red-100"
        : "border-blue-400/30 bg-blue-400/10 text-blue-100";

  const canGenerate = gpuStatus === "supported" && runStatus !== "generating";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(280px,0.68fr)_minmax(0,1.32fr)] xl:grid-cols-[minmax(300px,0.58fr)_minmax(0,1.42fr)] lg:items-start">
      <div className="space-y-6">
        <div className="rounded-2xl border border-purple-500/20 bg-white/5 p-8 backdrop-blur-sm">
          <h2 className="mb-3 text-xl font-semibold text-white">Free Browser Image Generator</h2>
          <p className="text-sm leading-relaxed text-gray-400">
            This experimental tool runs on the visitor&apos;s own browser GPU. No server GPU, no paid image API,
            and no provider key are used in this browser-only path.
          </p>

          <div className={`mt-6 rounded-2xl border p-5 ${statusClasses}`}>
            <div className="text-lg font-semibold">
              {gpuStatus === "checking" ? "Checking..." : gpuStatus === "supported" ? "Supported" : "Not supported"}
            </div>
            <p className="mt-2 text-sm leading-relaxed">{message}</p>
            {details && <p className="mt-3 text-xs leading-relaxed opacity-80">{details}</p>}
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="browser-image-prompt" className="mb-2 block text-sm font-semibold text-white">
                Image Prompt
              </label>
              <textarea
                id="browser-image-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="e.g., a cute robot writing a blog post, neon purple lighting, clean SaaS illustration"
                className="h-32 w-full resize-none rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="browser-image-size" className="mb-2 block text-sm font-semibold text-white">
                Image Size
              </label>
              <select
                id="browser-image-size"
                value={size}
                onChange={(event) => setSize(event.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="512x512" className="bg-black text-white">512 × 512 — safest first test</option>
                <option value="768x768" className="bg-black text-white">768 × 768 — stronger devices</option>
                <option value="1024x1024" className="bg-black text-white">1024 × 1024 — heavy</option>
              </select>
            </div>

            <button
              type="button"
              disabled={!canGenerate}
              onClick={handleGenerate}
              className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:from-indigo-700 hover:to-purple-700 hover:shadow-purple-500/40 disabled:from-indigo-600/50 disabled:to-purple-600/50"
            >
              {runStatus === "generating" ? "Preparing..." : "Generate Locally"}
            </button>

            <button
              type="button"
              onClick={checkWebGpu}
              className="w-full rounded-full border border-purple-400/30 px-6 py-3 font-semibold text-purple-100 transition-all duration-200 hover:bg-purple-500/10"
            >
              Recheck Browser GPU
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-7 text-sm leading-relaxed text-amber-100">
          <h3 className="mb-3 text-lg font-semibold text-amber-200">Stage 3A</h3>
          <p>
            The local UI shell is ready. Now we are testing a real browser-side Stable Diffusion engine before copying heavy model assets into this repo.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-7 text-sm leading-relaxed text-emerald-100">
          <h3 className="mb-3 text-lg font-semibold text-emerald-200">Real browser model test</h3>
          <p>
            This opens the open-source MLC Web Stable Diffusion demo. It runs on your browser/device, not on our server.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a
              href={MLC_WEBSD_DEMO_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-emerald-500 px-5 py-3 text-center font-semibold text-black transition-all duration-200 hover:bg-emerald-400"
            >
              Open real WebSD demo
            </a>

            <button
              type="button"
              onClick={() => setShowRealDemo((value) => !value)}
              className="rounded-full border border-emerald-300/40 px-5 py-3 font-semibold text-emerald-100 transition-all duration-200 hover:bg-emerald-400/10"
            >
              {showRealDemo ? "Hide embed" : "Embed demo here"}
            </button>
          </div>

          <p className="mt-4 text-xs text-emerald-100/70">
            If the embed is blocked, use the open button. That is normal for some external demos.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-purple-500/20 bg-white/5 p-8 backdrop-blur-sm lg:sticky lg:top-28">
        <h3 className="mb-4 text-xl font-semibold text-white">Local Output</h3>

        <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-purple-400/30 bg-black/40 p-6 text-center">
          {runStatus === "done" ? (
            <div className="text-left">
              <div className="mb-3 text-lg font-semibold text-emerald-200">UI test complete</div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{previewText}</pre>
              <div className="mt-4 rounded-xl border border-purple-400/20 bg-purple-400/10 p-4 text-sm text-purple-100">
                Prompt: {prompt}
                {"\n"}Size: {size}
              </div>
            </div>
          ) : runStatus === "generating" ? (
            <div>
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{previewText}</pre>
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-gray-400">
              Your browser-generated image will appear here after the real model is connected.
            </div>
          )}
        </div>

        <p className="mt-5 text-xs leading-relaxed text-gray-500">
          Browser-side generation depends on the visitor&apos;s hardware. Keep 512 × 512 as the first real-model test.
        </p>

        {showRealDemo && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-400/25 bg-black">
            <iframe
              title="MLC Web Stable Diffusion demo"
              src={MLC_WEBSD_DEMO_URL}
              className="h-[720px] w-full"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
}
