import { hrPeopleOperationsTools, HR_PEOPLE_OPERATIONS_VISUAL_TOOL_SLUGS } from "./public-hr-people-operations-tools";

export const HR_PEOPLE_OPERATIONS_TOOL_CREDIT_COSTS: Record<string,number> = Object.fromEntries(hrPeopleOperationsTools.map(tool => [tool.slug, tool.displayCreditCost]));
export const HR_PEOPLE_OPERATIONS_TOOL_SLUGS = Object.keys(HR_PEOPLE_OPERATIONS_TOOL_CREDIT_COSTS);
const DEPTH_CREDITS:Array<[string,number]>=[["Comprehensive controlled pack",9],["Detailed people pack",7],["Standard premium",5],["Quick professional",2]];
const NODE_CREDITS:Array<[string,number]>=[["40 nodes",13],["30 nodes",11],["20 nodes",9],["10 nodes",7]];
function includes(value:string|undefined,token:string){return(value||"").toLowerCase().includes(token.toLowerCase());}
function match(value:string|undefined,table:Array<[string,number]>,fallback:number){return table.find(([token])=>includes(value,token))?.[1]??fallback;}
export function calculateHRPeopleOperationsToolCreditCost(toolSlug:string,inputs:Record<string,string>={}){const base=HR_PEOPLE_OPERATIONS_TOOL_CREDIT_COSTS[toolSlug]??1;if(!HR_PEOPLE_OPERATIONS_TOOL_SLUGS.includes(toolSlug))return 1;let credits=inputs.output_depth?Math.max(base,match(inputs.output_depth,DEPTH_CREDITS,base)):base;if(HR_PEOPLE_OPERATIONS_VISUAL_TOOL_SLUGS.includes(toolSlug as (typeof HR_PEOPLE_OPERATIONS_VISUAL_TOOL_SLUGS)[number]))credits=Math.max(credits,match(inputs.node_count,NODE_CREDITS,base));return credits;}
export function isHRPeopleOperationsTool(toolSlug:string){return HR_PEOPLE_OPERATIONS_TOOL_SLUGS.includes(toolSlug);}
export function getHRPeopleOperationsToolBaseCost(toolSlug:string){return HR_PEOPLE_OPERATIONS_TOOL_CREDIT_COSTS[toolSlug]??1;}
