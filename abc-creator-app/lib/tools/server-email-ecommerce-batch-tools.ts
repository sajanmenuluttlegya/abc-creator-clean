type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const rules = `
ABC Creator premium email and e-commerce rules:
- Use the user's supplied context, product facts, audience, tone, keywords, must-include, and avoid fields as the source of truth.
- Do not invent product specs, prices, guarantees, reviews, ratings, testimonials, customer experiences, medical claims, financial claims, legal claims, discounts, delivery terms, marketplace policy claims, or compliance approvals.
- For product review outputs, do not fake ownership, hands-on testing, star ratings, customer quotes, or personal experience unless the user supplied it.
- For marketplace outputs, create copy-ready listing drafts but do not claim Amazon, Shopify, or platform policy compliance as guaranteed.
- Make the output premium, professional, conversion-aware, specific, clear, and ready to copy.
- Avoid spam, fake urgency, manipulative pressure, keyword stuffing, unsupported superlatives, and generic filler.
- Use placeholders like [verify price], [add proof], [confirm warranty], or [insert verified customer quote] when evidence is missing.`;

function p(name: string, creditCost: number, requiredInputs: ToolFieldRule[], task: string, outputGuide: string): ServerPrompt {
  return { creditCost, requiredInputs, system: `You are ABC Creator's elite ${name} specialist.${rules}\n\nTask: ${task}`, outputGuide };
}

const languageField: ToolFieldRule = { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 };
const avoidField: ToolFieldRule = { id: "avoid", label: "Avoid", required: false, maxLength: 3000 };
const mustField: ToolFieldRule = { id: "must_include", label: "Must include", required: false, maxLength: 4000 };

const emailFields: ToolFieldRule[] = [
  { id: "email_context", label: "Email context", required: true, minLength: 10, maxLength: 12000 },
  { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 160 },
  { id: "email_type", label: "Email type", required: true, minLength: 2, maxLength: 120 },
  { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
  { id: "output_count", label: "Output count", required: true, minLength: 2, maxLength: 80 },
  mustField,
  avoidField,
  languageField,
];

const productFields: ToolFieldRule[] = [
  { id: "product_name", label: "Product name", required: true, minLength: 2, maxLength: 250 },
  { id: "product_facts", label: "Product facts", required: true, minLength: 20, maxLength: 14000 },
  { id: "audience", label: "Target customer", required: true, minLength: 2, maxLength: 160 },
  { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
  { id: "output_count", label: "Output count", required: true, minLength: 2, maxLength: 80 },
  { id: "keywords", label: "SEO keywords", required: false, maxLength: 4000 },
  mustField,
  avoidField,
  languageField,
];

export const serverEmailEcommerceBatchTools: Record<string, ServerPrompt> = {
  "ai-email-generator": p("AI Email Generator", 2, emailFields, "Write professional emails for business, marketing, support, announcements, and everyday communication using only supplied context.", "Return Markdown with: # Email Drafts; ## Recommended Version; ## Alternative Versions; ## Subject Lines; ## CTA Notes; ## Risk/Verification Notes."),
  "email-campaign-writer": p("Email Campaign Writer", 3, [
    { id: "campaign_context", label: "Campaign context", required: true, minLength: 20, maxLength: 14000 },
    { id: "campaign_goal", label: "Campaign goal", required: true, minLength: 2, maxLength: 160 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
    { id: "sequence_length", label: "Campaign length", required: true, minLength: 2, maxLength: 80 },
    mustField,
    avoidField,
    languageField,
  ], "Create a multi-email campaign with sequence strategy, subject lines, body copy, CTAs, and timing notes without spam or fake urgency.", "Return Markdown with: # Email Campaign; ## Strategy; ## Sequence Overview; ## Email 1..N; ## Subject Line Options; ## CTA Plan; ## Compliance/Risk Notes."),
  "product-description-generator": p("Product Description Generator", 3, productFields, "Write premium product descriptions with positioning, benefits, features, SEO terms, and conversion-ready copy from supplied facts only.", "Return Markdown with: # Product Description; ## Best Version; ## Alternative Versions; ## Feature-to-Benefit Bullets; ## SEO Meta Description; ## Verification Notes."),
  "amazon-product-listing-generator": p("Amazon Product Listing Generator", 4, productFields, "Create Amazon-style listing copy from supplied facts: title options, bullets, description, backend keyword ideas, and improvement notes.", "Return Markdown with: # Amazon Product Listing; ## Title Options; ## Bullet Points; ## Product Description; ## Search Term Ideas; ## Listing Improvement Notes; ## Verification Notes."),
  "shopify-product-description-generator": p("Shopify Product Description Generator", 3, productFields, "Write Shopify-ready product page copy with hero section, benefit blocks, details, SEO copy, FAQ ideas, and CTA from supplied facts.", "Return Markdown with: # Shopify Product Page Copy; ## Hero Copy; ## Product Description; ## Benefits; ## Details; ## SEO Title/Description; ## FAQ Ideas; ## CTA."),
  "product-benefit-generator": p("Product Benefit Generator", 2, productFields, "Convert product facts into benefits, outcomes, use cases, emotional triggers, sales bullets, and copy angles.", "Return Markdown with: # Product Benefits; ## Benefit Map; ## Customer Outcomes; ## Use Cases; ## Emotional Triggers; ## Sales Bullets; ## Verification Notes."),
  "product-review-writer": p("Product Review Writer", 3, [
    { id: "product_name", label: "Product name", required: true, minLength: 2, maxLength: 250 },
    { id: "review_source_notes", label: "Review source notes", required: true, minLength: 20, maxLength: 14000 },
    { id: "review_type", label: "Review type", required: true, minLength: 2, maxLength: 160 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
    mustField,
    avoidField,
    languageField,
  ], "Create an honest review-style draft from supplied notes, including pros, cons, best-fit buyer, caveats, and verdict without fake experience.", "Return Markdown with: # Product Review Draft; ## Summary; ## Pros; ## Cons; ## Who It Is For; ## Who Should Skip It; ## Verdict; ## Disclosure/Verification Notes."),
  "product-comparison-writer": p("Product Comparison Writer", 3, [
    { id: "comparison_topic", label: "Comparison topic", required: true, minLength: 2, maxLength: 300 },
    { id: "products_to_compare", label: "Products to compare", required: true, minLength: 20, maxLength: 16000 },
    { id: "audience", label: "Target customer", required: true, minLength: 2, maxLength: 160 },
    { id: "comparison_goal", label: "Comparison goal", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
    mustField,
    avoidField,
    languageField,
  ], "Write a fair product comparison using supplied facts, decision criteria, pros and cons, best-fit recommendations, and buying guidance.", "Return Markdown with: # Product Comparison; ## Quick Verdict; ## Comparison Table; ## Pros and Cons; ## Best For; ## Buying Recommendation; ## Verification Notes."),
};
