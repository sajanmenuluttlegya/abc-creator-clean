import {
  routeToImage as baseRouteToImage,
  type ImageGenerationRequest,
} from "./routeToImage";

export type { GeneratedImage, ImageGenerationRequest } from "./routeToImage";

const TEXTLESS_ILLUSTRATION_GUARD = `

Textless illustration requirement:
Create only a clean editorial illustration. Avoid typography, signage, interface text, chart labels, headings, annotations, captions, logos, and any readable text inside the image. If the idea needs labels or exact wording, that belongs in the app's coded diagram renderer, not in this image.`;

export function routeToImage(request: ImageGenerationRequest) {
  return baseRouteToImage({
    ...request,
    prompt: `${request.prompt || ""}${TEXTLESS_ILLUSTRATION_GUARD}`,
  });
}
