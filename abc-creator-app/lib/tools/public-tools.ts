export interface Tool {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  inputs: ToolInput[];
}

export interface ToolInput {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export const publicTools: Tool[] = [
  {
    id: "blog-topic-ideas",
    slug: "blog-topic-ideas",
    name: "Blog Topic Ideas",
    description: "Generate creative blog topic ideas based on your niche and keywords",
    icon: "📝",
    category: "Content",
    inputs: [
      {
        id: "niche",
        label: "Niche / Industry",
        type: "text",
        placeholder: "e.g., Technology, Marketing, Health",
        required: true,
      },
      {
        id: "keywords",
        label: "Target Keywords",
        type: "textarea",
        placeholder: "e.g., AI, machine learning, automation",
        required: true,
      },
      {
        id: "tone",
        label: "Tone",
        type: "select",
        required: false,
        options: ["Professional", "Casual", "Educational", "Entertaining"],
      },
    ],
  },
  {
    id: "facebook-ad-copy",
    slug: "facebook-ad-copy",
    name: "Facebook Ad Copy",
    description: "Create compelling Facebook ad copy that drives clicks and conversions",
    icon: "📢",
    category: "Marketing",
    inputs: [
      {
        id: "product",
        label: "Product / Service",
        type: "text",
        placeholder: "What are you promoting?",
        required: true,
      },
      {
        id: "audience",
        label: "Target Audience",
        type: "text",
        placeholder: "e.g., Small business owners, fitness enthusiasts",
        required: true,
      },
      {
        id: "cta",
        label: "Call-to-Action",
        type: "select",
        required: false,
        options: ["Learn More", "Shop Now", "Sign Up", "Get Started", "Download"],
      },
    ],
  },
  {
    id: "product-description",
    slug: "product-description",
    name: "Product Description",
    description: "Write SEO-optimized product descriptions that sell",
    icon: "🛍️",
    category: "Ecommerce",
    inputs: [
      {
        id: "productName",
        label: "Product Name",
        type: "text",
        placeholder: "e.g., Premium Wireless Headphones",
        required: true,
      },
      {
        id: "features",
        label: "Key Features",
        type: "textarea",
        placeholder: "Noise cancellation, 30hr battery, bluetooth 5.0",
        required: true,
      },
      {
        id: "targetKeywords",
        label: "Target Keywords",
        type: "textarea",
        placeholder: "e.g., wireless headphones, noise cancelling",
        required: false,
      },
    ],
  },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return publicTools.find((tool) => tool.slug === slug);
}
