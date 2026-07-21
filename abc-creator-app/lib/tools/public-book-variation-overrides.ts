type BookInput = { id: string; label: string; type: "text" | "textarea" | "select"; placeholder?: string; required: boolean; options?: string[] };
type BookTool = { id: string; slug: string; name: string; description: string; icon: string; detailEmoji: string; category: string; displayCreditCost: number; outputType: "text"; aliases?: string[]; nextActions?: Array<{ label: string; href: string; description: string }>; inputs: BookInput[] };

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const allNicheGenreOptions = ["All genres / custom", "Fantasy", "Sci-fi", "Romance", "Thriller", "Mystery", "Horror", "Adventure", "Historical fiction", "Contemporary fiction", "Literary fiction", "Young adult", "Middle grade", "Children's book", "Non-fiction", "Self-help", "Business", "Memoir", "Spiritual", "Comedy", "Drama", "Fan-fiction style original", "Other"];
const audienceOptions = ["Adults", "Young adults", "Middle grade", "Children", "Writers / creators", "General readers", "Niche audience from brief"];
const authorVoiceOptions = ["Natural bestselling author", "Cinematic literary", "Commercial page-turner", "Emotional first-person", "Clean third-person", "Dark atmospheric", "Funny and warm", "Epic fantasy", "Romance-forward", "Thriller-tight", "Children's storyteller", "Custom from brief"];
const bookSizeOptions = ["5 x 8", "5.25 x 8", "5.5 x 8.5", "6 x 9", "7 x 10", "8 x 10", "8.5 x 11", "Custom in brief"];
const fontOptions = ["Classic Serif", "Modern Serif", "Elegant Fantasy", "Clean Sans", "Children's Book", "Mystery / Thriller", "Romance", "Sci-Fi", "Custom in brief"];
const bookOutputLengthOptions = ["Compact output (1 credit)", "Standard output (2 credits)", "Long output (5 credits)", "Premium deep output (9 credits)"];
const variationOptions = ["1 variation", "3 variations", "5 variations", "10 variations"];
const imageStyleOptions = ["Auto from book bible", "Cinematic realistic", "Fantasy concept art", "Children's book illustration", "Anime-inspired", "Graphic novel", "Watercolor", "Oil-painting look", "Dark atmospheric", "Clean premium editorial"];

const commonBookInputs: BookInput[] = [
  { id: "book_title", label: "Book Title", type: "text", placeholder: "Title shown on the centered title page", required: true },
  { id: "author_name", label: "Author Name", type: "text", placeholder: "Name shown below the title", required: true },
  { id: "book_size", label: "Book Size", type: "select", required: true, options: bookSizeOptions },
  { id: "font_style", label: "Title Page Font", type: "select", required: true, options: fontOptions },
  { id: "genre", label: "Genre / Niche", type: "select", required: true, options: allNicheGenreOptions },
  { id: "target_audience", label: "Target Audience", type: "select", required: true, options: audienceOptions },
  { id: "author_voice", label: "Author Voice", type: "select", required: true, options: authorVoiceOptions },
  { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
];

export const bookVariationOverrideTools: BookTool[] = [
  {
    id: "book-idea-generator",
    slug: "book-idea-generator",
    name: "Book Idea Generator",
    description: "Generate exact premium book concept variations for any niche, genre, audience, and author style.",
    icon: "book",
    detailEmoji: "💡",
    category: "Book Tools",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["book-ideas", "novel-idea-generator", "story-idea-generator"],
    nextActions: [{ label: "Build a book outline", href: "/tools/book-outline-generator", description: "Turn the best idea into a full structure." }],
    inputs: [
      ...commonBookInputs,
      { id: "variation_count", label: "Variations", type: "select", required: true, options: variationOptions },
      { id: "output_length", label: "Output Depth", type: "select", required: true, options: bookOutputLengthOptions },
      { id: "core_idea", label: "Core Idea / Theme", type: "textarea", placeholder: "Describe the seed idea, theme, conflict, message, niche, or market angle.", required: true },
      { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: tropes, setting, characters, market notes, reader promise, series idea.", required: false },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: clichés, topics, tropes, tones, or plot directions to avoid.", required: false },
    ],
  },
  {
    id: "book-cover-prompt-generator",
    slug: "book-cover-prompt-generator",
    name: "Book Cover Prompt Generator",
    description: "Create exact premium book cover prompt variations with cover, typography, composition, and negative prompts.",
    icon: "image-brief",
    detailEmoji: "🎨",
    category: "Book Tools",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["cover-prompt-generator", "book-cover-generator-prompt", "kdp-cover-prompt"],
    inputs: [
      ...commonBookInputs,
      { id: "prompt_variations", label: "Prompt Variations", type: "select", required: true, options: variationOptions },
      { id: "output_length", label: "Output Depth", type: "select", required: true, options: bookOutputLengthOptions },
      { id: "book_summary", label: "Book Summary / Visual Bible", type: "textarea", placeholder: "Paste the story summary, visual bible, characters, symbols, world, cover mood, and must-avoid notes.", required: true },
      { id: "cover_style", label: "Cover Style", type: "select", required: true, options: imageStyleOptions },
      { id: "cover_format", label: "Cover Format", type: "select", required: true, options: ["Front cover only", "Front + back + spine", "Ebook cover", "Paperback wraparound", "Series cover system"] },
      { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: symbols, characters, colors, objects, mood, typography notes.", required: false },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: visual clichés, wrong character details, spoilers, text problems, style issues.", required: false },
    ],
  },
  {
    id: "book-title-generator",
    slug: "book-title-generator",
    name: "Book Title Generator",
    description: "Generate an exact number of book-title options with concise supporting notes.",
    icon: "book",
    detailEmoji: "🏷️",
    category: "Book Tools",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["novel-title-generator", "book-name-generator"],
    nextActions: [{ label: "Build a book outline", href: "/tools/book-outline-generator", description: "Turn the selected title direction into a structured book plan." }],
    inputs: [
      ...commonBookInputs,
      { id: "title_count", label: "Number of Titles", type: "select", required: true, options: ["1 title (1 credit)", "3 titles (2 credits)", "5 titles (3 credits)", "10 titles (5 credits)"] },
      { id: "book_brief", label: "Book Brief", type: "textarea", placeholder: "Describe the plot, topic, themes, audience, world, tone, and market angle.", required: true },
      { id: "title_style", label: "Title Style", type: "select", required: true, options: ["Commercial", "Literary", "Fantasy", "Thriller", "Romance", "Children's", "Non-fiction authority", "Short and punchy", "Poetic", "Mixed"] },
    ],
  },

];
