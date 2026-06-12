export type SortField = "browses" | "likes" | "createdAt";
export type SortOrder = "asc" | "desc";

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "browses", label: "最多瀏覽" },
  { value: "likes", label: "最受歡迎" },
  { value: "createdAt", label: "最新建立" },
];
