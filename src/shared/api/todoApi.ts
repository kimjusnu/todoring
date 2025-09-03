import { supabase } from "@/shared/config/supabase";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority?: "low" | "medium" | "high";
  due_date?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const todoApi = {
  async getTodos(): Promise<Todo[]> {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("due_date", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getTodosByDate(date: string): Promise<Todo[]> {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("due_date", date)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createTodo(todoData: {
    title: string;
    due_date?: string;
    priority?: "low" | "medium" | "high";
    completed?: boolean;
  }): Promise<Todo> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("todos")
      .insert([
        {
          ...todoData,
          user_id: user.id,
          priority: todoData.priority || "medium",
          completed: todoData.completed || false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTodo(
    id: string,
    updates: Partial<
      Pick<Todo, "title" | "completed" | "priority" | "due_date">
    >
  ): Promise<Todo> {
    const { data, error } = await supabase
      .from("todos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTodo(id: string): Promise<void> {
    const { error } = await supabase.from("todos").delete().eq("id", id);

    if (error) throw error;
  },
};
