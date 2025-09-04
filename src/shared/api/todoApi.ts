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
  is_shared?: boolean;
  shared_with?: string[];
  owner_id?: string;
  owner_name?: string;
  owner_email?: string;
  is_own_todo?: boolean;
  owner?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export const todoApi = {
  async getTodos(): Promise<Todo[]> {
    // 현재 사용자 ID 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // 데이터 변환
    return (data || []).map((todo) => ({
      ...todo,
      owner_name: "내 할일",
      owner_email: "",
      is_own_todo: true,
    }));
  },

  async getTodosByDate(date: string): Promise<Todo[]> {
    // 현재 사용자 ID 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .eq("due_date", date)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // 데이터 변환
    return (data || []).map((todo) => ({
      ...todo,
      owner_name: "내 할일",
      owner_email: "",
      is_own_todo: true,
    }));
  },

  async getFriendsTodos(): Promise<Todo[]> {
    // 현재 사용자 ID 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      // 친구 연결 테이블에서 친구들의 할일 가져오기
      const { data: connections, error: connectionError } = await supabase
        .from("user_connections")
        .select("connected_user_id")
        .eq("user_id", user.id);

      if (connectionError || !connections?.length) {
        return [];
      }

      const friendIds = connections.map((conn) => conn.connected_user_id);

      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .in("user_id", friendIds)
        .order("created_at", { ascending: true });

      if (error) {
        return [];
      }

      // 데이터 변환
      const friendsTodos = (data || []).map((todo) => ({
        ...todo,
        owner_name: "친구",
        owner_email: "",
        is_own_todo: false,
      }));

      return friendsTodos;
    } catch (error) {
      console.error("Error in getFriendsTodos:", error);
      return [];
    }
  },

  async getFriendsTodosByDate(date: string): Promise<Todo[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      // 친구 연결 테이블에서 친구들의 할일 가져오기
      const { data: connections, error: connectionError } = await supabase
        .from("user_connections")
        .select("connected_user_id")
        .eq("user_id", user.id);

      if (connectionError || !connections?.length) {
        return [];
      }

      const friendIds = connections.map((conn) => conn.connected_user_id);

      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .in("user_id", friendIds)
        .eq("due_date", date)
        .order("created_at", { ascending: true });

      if (error) {
        return [];
      }

      // 데이터 변환
      const friendsTodos = (data || []).map((todo) => ({
        ...todo,
        owner_name: "친구",
        owner_email: "",
        is_own_todo: false,
      }));

      return friendsTodos;
    } catch (error) {
      console.error("Error in getFriendsTodosByDate:", error);
      return [];
    }
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
          owner_id: user.id, // owner_id도 user_id와 동일하게 설정
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
    // 본인의 할일만 수정 가능하도록 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("todos")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id) // 본인의 할일만 수정 가능
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTodo(id: string): Promise<void> {
    // 본인의 할일만 삭제 가능하도록 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // 본인의 할일만 삭제 가능

    if (error) throw error;
  },

  // 공유 설정에 따라 할일을 자동으로 공유 (임시로 비활성화)
  async createTodoWithSharing(todoData: {
    title: string;
    due_date?: string;
    priority?: "low" | "medium" | "high";
    completed?: boolean;
  }): Promise<Todo> {
    // 임시로 일반 createTodo 사용
    return this.createTodo(todoData);
  },

  // 공유된 할일만 조회 (임시로 비활성화)
  async getSharedTodos(): Promise<Todo[]> {
    // 임시로 빈 배열 반환
    return [];
  },
};
