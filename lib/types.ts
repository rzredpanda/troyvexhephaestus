export type Role = "owner" | "admin" | "member";
export type Scope = "overall" | "team";
export type Action = "add" | "withdraw" | "return" | "adjust" | "trade_in" | "trade_out" | "import";
export type LogStatus = "attempted" | "approved" | "rejected";
export type Condition = "new" | "good" | "fair" | "damaged";

export interface Team {
  id: string;
  name: string;
  archived: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  team_id: string | null;
  created_at: string;
}

export interface CatalogItem {
  id: string;
  sku: string;
  part_id: string | null;
  name: string;
  unit_price: number;
  category: string | null;
  image_url: string | null;
}

export interface InventoryItem {
  id: string;
  team_id: string;
  catalog_item_id: string;
  quantity: number;
  threshold: number;
  room: string | null;
  updated_at: string;
  catalog_item?: CatalogItem;
  team?: Team;
}

export interface InventoryLog {
  id: string;
  team_id: string;
  catalog_item_id: string;
  user_id: string;
  action: Action;
  quantity: number;
  condition: Condition | null;
  note: string | null;
  photo_url: string | null;
  status: LogStatus;
  created_at: string;
  profile?: Profile;
  catalog_item?: CatalogItem;
  team?: Team;
}

export interface WantedItem {
  id: string;
  team_id: string;
  catalog_item_id: string;
  quantity_needed: number;
  priority: "low" | "medium" | "high";
  note: string | null;
  created_at: string;
  catalog_item?: CatalogItem;
}

export interface ChecklistItem {
  id: string;
  team_id: string | null;
  label: string;
  checked: boolean;
  event_name: string | null;
  created_at: string;
}

export interface BOMItem {
  id: string;
  team_id: string;
  catalog_item_id: string;
  quantity_needed: number;
  bom_name: string;
  created_at: string;
  catalog_item?: CatalogItem;
}
