/* app/types/index.d.ts */
export interface IUser {
  id: string;
  name: string;
  email: string;
  role: "supplier" | "kitchen" | "vendor" | "admin";
}

export interface IBatch {
  id: string;
  createdBy: string;
  createdAt: string;
  status: string;
  items?: { name: string; qty: number }[];
}

export interface ILogEntry {
  id: string;
  batchId: string;
  action: string;
  actorId?: string;
  timestamp: string;
  notes?: string;
}
