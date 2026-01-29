"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product, ProductType, ProductProgress, Probability } from "@prisma/client";

interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  productType?: ProductType;
  progress?: ProductProgress;
  dealId?: string;
  probability?: Probability;
}

interface ProductWithRelations extends Product {
  deal?: {
    id: string;
    name: string;
    customer?: { id: string; name: string; clientNo: string };
  };
  salesRep?: { id: string; name: string | null; email: string };
  officeRep?: { id: string; name: string | null; email: string };
}

interface ListResponse {
  success: boolean;
  data?: ProductWithRelations[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

async function fetchProducts(params: ProductListParams): Promise<ListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.productType) searchParams.set("productType", params.productType);
  if (params.progress) searchParams.set("progress", params.progress);
  if (params.dealId) searchParams.set("dealId", params.dealId);
  if (params.probability) searchParams.set("probability", params.probability);

  const res = await fetch(`/api/products?${searchParams.toString()}`);
  return res.json();
}

async function fetchProduct(id: string): Promise<{ success: boolean; data?: ProductWithRelations; error?: string }> {
  const res = await fetch(`/api/products/${id}`);
  return res.json();
}

async function createProduct(data: Partial<Product> & { templateId?: string }): Promise<{ success: boolean; data?: Product; error?: string }> {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function updateProduct({ id, ...data }: { id: string } & Partial<Product>): Promise<{ success: boolean; data?: Product; error?: string }> {
  const res = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`/api/products/${id}`, {
    method: "DELETE",
  });
  return res.json();
}

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchProducts(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}
