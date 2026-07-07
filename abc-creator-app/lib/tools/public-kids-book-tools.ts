type KidsBookInput = { id: string; label: string; type: "text" | "textarea" | "select"; placeholder?: string; required: boolean; options?: string[] };
type KidsBookTool = { id: string; slug: string; name: string; description: string; icon: string; detailEmoji: string; category: string; displayCreditCost: number; outputType: "text"; aliases?: string[]; nextActions?: Array<{ label: string; href: string; description: string }>; inputs: KidsBookInput[] };

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const ageRangeOptions = ["Ages 2-4", "Ages 4-6", "Ages 6-8", "Ages 8-10", "Custom in brief"];
const readingLevelOptions = ["Very simple picture book", "Early reader", "Read-aloud bedtime", "Rhyming picture book", "Educational picture book", "Custom in brief"];
const pageCountOptions = ["8 pages", "12 pages", "16 pages", "24 pages", "32 pages", "Custom"];
const kdpTrimOptions = [
  "8 x 8 in KDP square (1:1)",
  "8.5 x 8.5 in KDP square (1:1)",
  "8 x 10 in KDP portrait (4:5)",
  "6 x 9 in KDP portrait (2:3)",
  "7.5 x 9.25 in KDP portrait (4:5)",
  "8.25 x 6 in KDP landscape (4:3)",
  "9 x 6 in KDP landscape (3:2)",
];
const artStyleOptions = ["Children’s book", "Watercolor", "Soft 3D storybook", "Pixar-like original", "Cute cartoon", "Whimsical gouache", "Flat vector", "Paper cutout", "Bedtime pastel", "Bold educational"];
const textDensityOptions = ["Minimal text (1 short line/page)", "Light text (1-2 short lines/page)", "Moderate text (2-3 short lines/page)"];
const textPlacementOptions = ["Auto-safe placement", "Top overlay", "Center overlay", "Bottom overlay", "Left page margin", "Right page margin"];
const fontOptions = ["Rounded kids font", "Storybook serif", "Clean sans", "Handwritten playful", "Bold classroom", "Custom in brief"];
const imageModelOptions = ["M1", "M2", "M3", "M4", "M5", "M6"];
const resolutionOptions = ["360p", "480p", "720p", "1080p"];
const outputLengthOptions = ["Compact output (1 credit)", "Standard output (2 credits)", "Long output (5 credits)", "Premium deep output (9 credits)"];

export const kidsBookTools: KidsBookTool[] = [
  {
    id: "kids-book-generator",
    slug: "kids-book-generator",
    name: "Kids Book Generator",
    description: "Create a page-by-page illustrated children’s book with one image on every page and editable text overlay notes.",
    icon: "book",
    detailEmoji: "🧸",
    category: "Kids Book Generator",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["children-book-generator", "kids-picture-book-generator", "picture-book-generator", "childrens-book-generator"],
    nextActions: [
      { label: "Create a book cover prompt", href: "/tools/book-cover-prompt-generator", description: "Turn the kids book visual bible into a matching cover direction." },
      { label: "Build export structure", href: "/tools/book-export-builder", description: "Prepare the final book order and print/export notes." },
    ],
    inputs: [
      { id: "book_title", label: "Book Title", type: "text", placeholder: "e.g., Luna and the Mooncake Kite", required: true },
      { id: "author_name", label: "Author Name", type: "text", placeholder: "Name shown on the title page", required: true },
      { id: "age_range", label: "Age Range", type: "select", required: true, options: ageRangeOptions },
      { id: "reading_level", label: "Reading Level", type: "select", required: true, options: readingLevelOptions },
      { id: "story_premise", label: "Story Premise", type: "textarea", placeholder: "Describe the story, character, setting, theme, lesson, or bedtime idea.", required: true },
      { id: "main_characters", label: "Main Characters", type: "textarea", placeholder: "Names, species/age, look, personality, clothing, recurring props, and any visual consistency rules.", required: true },
      { id: "theme_or_moral", label: "Theme / Moral", type: "text", placeholder: "e.g., courage, sharing, bedtime calm, learning numbers", required: true },
      { id: "page_count", label: "Page Count", type: "select", required: true, options: pageCountOptions },
      { id: "custom_page_count", label: "Custom Page Count (<49)", type: "text", placeholder: "Enter 1-48 only when Custom is selected", required: false },
      { id: "image_ratio", label: "KDP Page Trim / Image Ratio", type: "select", required: true, options: kdpTrimOptions },
      { id: "output_image_model", label: "Image Model", type: "select", required: true, options: imageModelOptions },
      { id: "output_image_resolution", label: "Image Resolution", type: "select", required: true, options: resolutionOptions },
      { id: "visual_style", label: "Art Style", type: "select", required: true, options: artStyleOptions },
      { id: "text_density", label: "Text Density", type: "select", required: true, options: textDensityOptions },
      { id: "font_style", label: "Overlay Font Style", type: "select", required: true, options: fontOptions },
      { id: "text_placement", label: "Text Placement", type: "select", required: true, options: textPlacementOptions },
      { id: "output_length", label: "Planning Depth", type: "select", required: true, options: outputLengthOptions },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
      { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: objects, page beats, characters, words, educational points, scenes, or rhyme requirements.", required: false },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: scary elements, unsafe behavior, preachy tone, visual details, topics, colors, or words to avoid.", required: false },
    ],
  },
];
