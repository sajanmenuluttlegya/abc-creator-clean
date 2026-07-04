type PublicCampaignToolInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "image";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type PublicCampaignTool = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  detailEmoji: string;
  category: string;
  displayCreditCost: number;
  outputType?: "text";
  aliases?: string[];
  nextActions?: Array<{ label: string; href: string; description: string }>;
  inputs: PublicCampaignToolInput[];
};

// Public ad tools now live only in public-ad-copy-batch-tools.ts under the Ad Copy category.
// Keep this export empty so old campaign/ad duplicates do not render as separate cards.
export const campaignTools: PublicCampaignTool[] = [];
