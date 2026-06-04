import type { WineCategory } from '@/data/wineData';
const CAT_CONFIG:Record<WineCategory,{bg:string;text:string}>={Rosso:{bg:'bg-primary/10',text:'text-primary'},Bianco:{bg:'bg-accent/20',text:'text-amber-800'},Rosé:{bg:'bg-pink-100',text:'text-pink-700'},Spumante:{bg:'bg-blue-100',text:'text-blue-700'},Dolce:{bg:'bg-amber-100',text:'text-amber-800'}};
export default function CategoryBadge({category}:{category:WineCategory}){const c=CAT_CONFIG[category];return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${c.bg} ${c.text}`}>{category}</span>}
