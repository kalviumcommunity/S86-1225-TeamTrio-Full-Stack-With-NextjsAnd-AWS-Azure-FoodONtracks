/* app/services/batchService.ts */
import api from "../lib/api";

export const createBatch = (payload: any) => api.post("/batches", payload);
export const getBatch = (id: string) => api.get(`/batches/${id}`);
export const addLog = (id: string, payload: any) => api.post(`/batches/${id}/logs`, payload);
