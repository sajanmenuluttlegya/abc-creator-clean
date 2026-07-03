type ToolInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type Tool = {
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
  inputs: ToolInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const audienceOptions = ["Cold audience", "Warm audience", "Existing customers", "B2B buyers", "E-commerce shoppers", "Premium buyers", "Small business owners", "General audience"];
const toneOptions = ["Professional", "Premium", "Friendly", "Persuasive", "Luxury", "Clear and practical", "Warm", "Bold but respectful"];
const emailTypeOptions = ["Plain text", "Newsletter", "Promotional", "Announcement", "Nurture", "Sales", "Support", "Internal business"];
const countOptions = ["1 version", "3 versions", "5 versions", "10 versions"];
const campaignGoalOptions = ["Launch", "Nurture leads", "Win back customers", "Promote offer", "Educate audience", "Drive bookings", "Increase sales", "Community update"];
const productToneOptions = ["Premium", "Conversion-focused", "SEO-friendly", "Amazon-style", "Shopify-style", "Luxury", "Simple and clear", "Technical"];

function emailInputs(mainLabel: string): ToolInput[] {
  return [
    { id: "email_context", label: mainLabel, type: "textarea", placeholder: "Describe the email purpose, audience, offer, product, background, and exact facts to include.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "email_type", label: "Email Type", type: "select", required: true, options: emailTypeOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "output_count", label: "How Many Versions?", type: "select", required: true, options: countOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: CTA, deadline, product facts, offer, proof, links, names, or exact wording.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: spam words, fake urgency, unsupported claims, legal/compliance limits, or words to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function productInputs(mainLabel: string): ToolInput[] {
  return [
    { id: "product_name", label: "Product Name", type: "text", placeholder: "e.g., Premium Wireless Headphones", required: true },
    { id: "product_facts", label: mainLabel, type: "textarea", placeholder: "Paste exact product features, materials, specs, use cases, audience, proof, ingredients, dimensions, compatibility, and limitations. The tool will not invent facts.", required: true },
    { id: "audience", label: "Target Customer", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone / Style", type: "select", required: true, options: productToneOptions },
    { id: "output_count", label: "How Many Versions?", type: "select", required: true, options: countOptions },
    { id: "keywords", label: "SEO Keywords", type: "textarea", placeholder: "Optional: keywords, search terms, product modifiers, marketplace phrases, or category terms.", required: false },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: benefits, proof, CTA, warranty notes, bundle, offer, or compliance wording.", required: false },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: claims, prohibited words, medical/financial claims, competitor names, guarantees, or unsupported promises.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function tool(slug: string, name: string, description: string, category: string, icon: string, emoji: string, credits: number, inputs: ToolInput[], aliases: string[] = []): Tool {
  return {
    id: slug,
    slug,
    name,
    description,
    icon,
    detailEmoji: emoji,
    category,
    displayCreditCost: credits,
    outputType: "text",
    aliases: [`ai-${slug}`, `${slug}-tool`, ...aliases],
    inputs,
  };
}

export const emailEcommerceBatchTools: Tool[] = [
  tool("ai-email-generator", "AI Email Generator", "Write polished professional emails for business, marketing, support, announcements, and everyday communication.", "Email Tools", "email", "✉️", 2, emailInputs("Email Brief / Context"), ["email-generator", "professional-email-generator", "email-writer"]),
  tool("email-campaign-writer", "Email Campaign Writer", "Create a premium multi-email campaign with sequence strategy, subject lines, body copy, CTAs, and send-flow notes.", "Email Tools", "email", "📬", 3, [
    { id: "campaign_context", label: "Campaign Context", type: "textarea", placeholder: "Describe the campaign, audience, offer, product, timeline, goal, and exact facts.", required: true },
    { id: "campaign_goal", label: "Campaign Goal", type: "select", required: true, options: campaignGoalOptions },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "sequence_length", label: "Campaign Length", type: "select", required: true, options: ["3 emails", "5 emails", "7 emails", "10 emails"] },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: offer, CTA, launch date, product facts, objections, proof, links, or brand rules.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: spam words, fake urgency, unsupported claims, aggressive pressure, or compliance limits.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["email-sequence-generator", "email-campaign-generator", "campaign-email-writer"]),
  tool("product-description-generator", "Product Description Generator", "Write premium product descriptions with clear positioning, benefits, SEO terms, and conversion-ready copy.", "E-Commerce Tools", "product", "🛍️", 3, productInputs("Product Facts / Features"), ["premium-product-description-generator", "ecommerce-product-description"]),
  tool("amazon-product-listing-generator", "Amazon Product Listing Generator", "Create Amazon-style product titles, bullets, descriptions, backend keyword ideas, and listing improvement notes from supplied facts.", "E-Commerce Tools", "product", "📦", 4, productInputs("Amazon Listing Facts"), ["amazon-listing-generator", "amazon-description-generator", "amazon-product-copy"]),
  tool("shopify-product-description-generator", "Shopify Product Description Generator", "Write Shopify-ready product page copy with hero section, benefits, details, SEO description, and conversion CTA.", "E-Commerce Tools", "product", "🛒", 3, productInputs("Shopify Product Facts"), ["shopify-description-generator", "shopify-product-copy", "shopify-listing-generator"]),
  tool("product-benefit-generator", "Product Benefit Generator", "Convert product facts into customer benefits, outcomes, use cases, emotional triggers, and sales-ready copy points.", "E-Commerce Tools", "product", "💎", 2, productInputs("Product Features / Facts"), ["benefit-generator", "product-benefits", "features-to-benefits-product"]),
  tool("product-review-writer", "Product Review Writer", "Create honest review-style drafts from supplied product experience, specs, pros, cons, and verified notes without fake testimonials.", "E-Commerce Tools", "product", "⭐", 3, [
    { id: "product_name", label: "Product Name", type: "text", placeholder: "Product name", required: true },
    { id: "review_source_notes", label: "Review Source Notes", type: "textarea", placeholder: "Paste real usage notes, product facts, pros/cons, customer feedback, limitations, specs, or verified observations. Do not invent user experience.", required: true },
    { id: "review_type", label: "Review Type", type: "select", required: true, options: ["Editorial review", "Buyer guide review", "Pros and cons review", "Comparison-style review", "Short marketplace review", "Detailed blog review"] },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: productToneOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: pros, cons, caveats, rating criteria, use cases, or CTA.", required: false },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: fake ownership, fake results, inflated claims, medical/financial claims, or competitor attacks.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["review-writer", "product-review-generator", "review-style-product-copy"]),
  tool("product-comparison-writer", "Product Comparison Writer", "Write product comparisons with decision criteria, pros/cons, best-fit recommendations, and fair buying guidance.", "E-Commerce Tools", "product", "⚖️", 3, [
    { id: "comparison_topic", label: "Comparison Topic", type: "text", placeholder: "e.g., Product A vs Product B, best projectors under budget", required: true },
    { id: "products_to_compare", label: "Products / Options to Compare", type: "textarea", placeholder: "List the products, features, prices if verified, pros/cons, specs, and notes. The tool will not invent product facts.", required: true },
    { id: "audience", label: "Target Customer", type: "select", required: true, options: audienceOptions },
    { id: "comparison_goal", label: "Comparison Goal", type: "select", required: true, options: ["Best overall", "Best budget", "Best premium", "Best for beginners", "Best for professionals", "Fair neutral comparison"] },
    { id: "tone", label: "Tone", type: "select", required: true, options: productToneOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: decision criteria, use cases, benefits, CTA, keywords, or caveats.", required: false },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: unsupported rankings, fake prices, exaggerated claims, or competitor attacks.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["product-comparison-generator", "comparison-writer", "ecommerce-comparison-writer"]),
];
