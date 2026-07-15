export const PRESENTATION_PITCH_VISUAL_PRESETS:Record<string,{title:string;eyebrow:string;description:string;mode:"story"|"pitch"|"data"|"architecture"}>={
"presentation-story-arc-map-generator":{title:"Presentation Story Arc Studio",eyebrow:"Context, tension, evidence, choice and action",description:"Build a source-grounded narrative map before writing slides.",mode:"story"},
"investor-pitch-narrative-map-generator":{title:"Investor Pitch Narrative Studio",eyebrow:"Evidence-controlled fundraising logic",description:"Map the pitch without inventing traction, market, financial, or investor claims.",mode:"pitch"},
"data-story-evidence-flow-map-generator":{title:"Data Story & Evidence Flow Studio",eyebrow:"Decision-led evidence architecture",description:"Connect measures, findings, caveats and actions without misleading causal claims.",mode:"data"},
"slide-architecture-visual-hierarchy-map-generator":{title:"Slide Architecture Studio",eyebrow:"Sections, slide roles, hierarchy and dependencies",description:"Design the deck's information architecture before visual production.",mode:"architecture"}
};
