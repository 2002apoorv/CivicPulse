export const CATEGORY_COLORS = {
  "Roads and Potholes": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500" },
  "Garbage and Waste": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" },
  "Water Supply": { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200", dot: "bg-cyan-500" },
  "Drainage and Sewage": { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200", dot: "bg-teal-500" },
  "Streetlights": { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200", dot: "bg-yellow-500" },
  "Public Sanitation": { bg: "bg-green-50", text: "text-green-800", border: "border-green-200", dot: "bg-green-500" },
  "Traffic and Road Safety": { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200", dot: "bg-orange-500" },
  "Public Infrastructure": { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200", dot: "bg-indigo-500" },
  "Electricity": { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200", dot: "bg-rose-500" },
  "Other": { bg: "bg-slate-50", text: "text-slate-800", border: "border-slate-200", dot: "bg-slate-500" },
};

export const PRIORITY_STYLES = {
  low: { label: "Low", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", badge: "bg-slate-50 text-slate-700 border-slate-200" },
  medium: { label: "Medium", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  high: { label: "High", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  critical: { label: "Critical", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", badge: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const STATUS_STYLES = {
  submitted: { label: "Submitted", color: "bg-slate-100 text-slate-700 border-slate-200" },
  under_review: { label: "Under Review", color: "bg-amber-50 text-amber-700 border-amber-200" },
  assigned: { label: "Assigned", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  in_progress: { label: "In Progress", color: "bg-blue-50 text-blue-700 border-blue-200" },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

export const VARANASI_CENTER = [25.3176, 82.9739];

export const POPULAR_LOCALITIES = [
  { name: "Lanka", lat: 25.2798, lon: 82.9996 },
  { name: "Godowlia", lat: 25.3094, lon: 83.0069 },
  { name: "Assi Ghat", lat: 25.2905, lon: 83.0065 },
  { name: "Sigra", lat: 25.3168, lon: 82.9863 },
  { name: "Cantonment", lat: 25.3267, lon: 82.9863 },
  { name: "Pandeypur", lat: 25.3472, lon: 82.9984 },
  { name: "Bhelupur", lat: 25.2974, lon: 82.9926 },
  { name: "Mahmoorganj", lat: 25.3061, lon: 82.9785 },
  { name: "Orderly Bazar", lat: 25.3411, lon: 82.9882 },
  { name: "Dashashwamedh", lat: 25.3075, lon: 83.0105 },
  { name: "Durgakund", lat: 25.2891, lon: 82.9981 },
  { name: "Shivpur", lat: 25.3621, lon: 82.9554 },
  { name: "Sarnath", lat: 25.3716, lon: 83.0253 },
];

export const CIVIC_CATEGORIES = [
  "Roads and Potholes",
  "Garbage and Waste",
  "Water Supply",
  "Drainage and Sewage",
  "Streetlights",
  "Public Sanitation",
  "Traffic and Road Safety",
  "Public Infrastructure",
  "Electricity",
  "Other",
];
