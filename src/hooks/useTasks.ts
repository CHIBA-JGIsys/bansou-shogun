"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task, TaskStatus, TaskType } from "@prisma/client";

interface TaskListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: TaskStatus;
  taskType?: TaskType;
  assigneeId?: string;
  dealId?: string;
  productId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

interface TaskWithRelations extends Task {
  assignee?: { id: string; name: string | null; email: string };
  creator?: { id: string; name: string | null; email: string };
  deal?: { id: string; name: string };
  product?: { id: string; name: string };
}

interface ListResponse {
  success: boolean;
  data?: TaskWithRelations[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

async function fetchTasks(params: TaskListParams): Promise<ListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.status) searchParams.set("status", params.status);
  if (params.taskType) searchParams.set("taskType", params.taskType);
  if (params.assigneeId) searchParams.set("assigneeId", params.assigneeId);
  if (params.dealId) searchParams.set("dealId", params.dealId);
  if (params.productId) searchParams.set("productId", params.productId);
  if (params.dueDateFrom) searchParams.set("dueDateFrom", params.dueDateFrom);
  if (params.dueDateTo) searchParams.set("dueDateTo", params.dueDateTo);

  const res = await fetch(`/api/tasks?${searchParams.toString()}`);
  return res.json();
}

async function fetchTask(id: string): Promise<{ success: boolean; data?: TaskWithRelations; error?: string }> {
  const res = await fetch(`/api/tasks/${id}`);
  return res.json();
}

async function createTask(data: Partial<Task>): Promise<{ success: boolean; data?: Task; error?: string }> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function updateTask({ id, ...data }: { id: string } & Partial<Task>): Promise<{ success: boolean; data?: Task; error?: string }> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function deleteTask(id: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
  });
  return res.json();
}

export function useTasks(params: TaskListParams = {}) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => fetchTasks(params),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => fetchTask(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTask,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
