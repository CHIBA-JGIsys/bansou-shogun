"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Customer, Industry, BusinessScale } from "@prisma/client";

interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  industry?: Industry;
  scale?: BusinessScale;
  mainSalesRepId?: string;
}

interface CustomerWithRelations extends Customer {
  mainSalesRep?: { id: string; name: string | null; email: string };
  subRep?: { id: string; name: string | null; email: string };
  _count?: { deals: number };
}

interface ListResponse {
  success: boolean;
  data?: CustomerWithRelations[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

async function fetchCustomers(params: CustomerListParams): Promise<ListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.industry) searchParams.set("industry", params.industry);
  if (params.scale) searchParams.set("scale", params.scale);
  if (params.mainSalesRepId) searchParams.set("mainSalesRepId", params.mainSalesRepId);

  const res = await fetch(`/api/customers?${searchParams.toString()}`);
  return res.json();
}

async function fetchCustomer(id: string): Promise<{ success: boolean; data?: CustomerWithRelations; error?: string }> {
  const res = await fetch(`/api/customers/${id}`);
  return res.json();
}

async function createCustomer(data: Partial<Customer>): Promise<{ success: boolean; data?: Customer; error?: string }> {
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function updateCustomer({ id, ...data }: { id: string } & Partial<Customer>): Promise<{ success: boolean; data?: Customer; error?: string }> {
  const res = await fetch(`/api/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`/api/customers/${id}`, {
    method: "DELETE",
  });
  return res.json();
}

export function useCustomers(params: CustomerListParams = {}) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => fetchCustomers(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => fetchCustomer(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCustomer,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", variables.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
