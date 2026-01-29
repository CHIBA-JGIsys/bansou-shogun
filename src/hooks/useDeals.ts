"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Deal, DealProgress } from "@prisma/client";

interface DealListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  progress?: DealProgress;
  salesRepId?: string;
  customerId?: string;
}

interface DealWithRelations extends Deal {
  customer?: { id: string; name: string; clientNo: string };
  salesRep?: { id: string; name: string | null; email: string };
  officeRep?: { id: string; name: string | null; email: string };
  _count?: { products: number; tasks: number };
}

interface ListResponse {
  success: boolean;
  data?: DealWithRelations[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

async function fetchDeals(params: DealListParams): Promise<ListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.progress) searchParams.set("progress", params.progress);
  if (params.salesRepId) searchParams.set("salesRepId", params.salesRepId);
  if (params.customerId) searchParams.set("customerId", params.customerId);

  const res = await fetch(`/api/deals?${searchParams.toString()}`);
  return res.json();
}

async function fetchDeal(id: string): Promise<{ success: boolean; data?: DealWithRelations; error?: string }> {
  const res = await fetch(`/api/deals/${id}`);
  return res.json();
}

async function createDeal(data: Partial<Deal>): Promise<{ success: boolean; data?: Deal; error?: string }> {
  const res = await fetch("/api/deals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function updateDeal({ id, ...data }: { id: string } & Partial<Deal>): Promise<{ success: boolean; data?: Deal; error?: string }> {
  const res = await fetch(`/api/deals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function deleteDeal(id: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`/api/deals/${id}`, {
    method: "DELETE",
  });
  return res.json();
}

export function useDeals(params: DealListParams = {}) {
  return useQuery({
    queryKey: ["deals", params],
    queryFn: () => fetchDeals(params),
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ["deals", id],
    queryFn: () => fetchDeal(id),
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDeal,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["deals", variables.id] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}
