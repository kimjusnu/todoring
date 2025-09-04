"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/config/supabase";
import type { User } from "@supabase/supabase-js";

import { todoApi, type Todo } from "@/shared/api/todoApi";
import { Calendar } from "@/widgets/calendar";
import { DailyTodos } from "@/widgets/daily-todos";
import { TodoModal } from "@/features/todo";

const HomePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [dailyTodos, setDailyTodos] = useState<Todo[]>([]);
  const [todosByDate, setTodosByDate] = useState<Record<string, number>>({});
  const [todosDataByDate, setTodosDataByDate] = useState<
    Record<
      string,
      Array<{ title: string; completed: boolean; priority?: string }>
    >
  >({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const router = useRouter();

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/onboarding");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadAllTodos = async () => {
    try {
      const data = await todoApi.getTodos();
      // 처음 올린 순서로 정렬 (created_at 기준 오름차순)
      const sortedData = data.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setTodos(sortedData);

      // 날짜별 Todo 개수 계산
      const countByDate: Record<string, number> = {};
      const dataByDate: Record<
        string,
        Array<{ title: string; completed: boolean; priority?: string }>
      > = {};

      sortedData.forEach((todo) => {
        if (todo.due_date) {
          // due_date는 이미 YYYY-MM-DD 형식
          const dateKey = todo.due_date;
          countByDate[dateKey] = (countByDate[dateKey] || 0) + 1;

          if (!dataByDate[dateKey]) {
            dataByDate[dateKey] = [];
          }
          dataByDate[dateKey].push({
            title: todo.title,
            completed: todo.completed,
            priority: todo.priority,
          });
        }
      });

      setTodosByDate(countByDate);
      setTodosDataByDate(dataByDate);
    } catch (error) {
      console.error("Failed to load todos:", error);
    }
  };

  // 로컬 시간 기준으로 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDateToLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadDailyTodos = async (date: Date) => {
    try {
      setLoading(true);
      // 로컬 시간 기준으로 날짜 변환
      const dateString = formatDateToLocal(date);
      console.log("Loading todos for date:", dateString, "from date:", date);
      const data = await todoApi.getTodosByDate(dateString);
      // 처음 올린 순서로 정렬 (created_at 기준 오름차순)
      const sortedData = data.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      console.log("loadDailyTodos - raw data:", data);
      console.log("loadDailyTodos - sorted data:", sortedData);
      setDailyTodos(sortedData);
    } catch (error) {
      console.error("Failed to load daily todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendsTodos = async () => {
    try {
      const data = await todoApi.getFriendsTodos();
      console.log("Friends todos loaded:", data);
      // 친구 할일을 별도로 저장 (기존 할일과 섞지 않음)
      setTodos((prevTodos) => {
        // 기존 친구 할일 제거 후 새로 추가
        const ownTodos = prevTodos.filter((todo) => todo.is_own_todo !== false);
        return [...ownTodos, ...data];
      });
    } catch (error) {
      console.error("Failed to load friends todos:", error);
    }
  };

  const loadFriendsTodosByDate = async (date: Date) => {
    try {
      const dateString = formatDateToLocal(date);
      const allFriendsTodos = await todoApi.getFriendsTodos();
      // 해당 날짜의 친구 할일만 필터링
      const friendsTodosForDate = allFriendsTodos.filter(
        (todo) => todo.due_date === dateString
      );
      console.log("Friends todos for date:", friendsTodosForDate);
      // 친구 할일을 일일 할일 목록에 추가
      setDailyTodos((prevTodos) => {
        // 기존 친구 할일 제거 후 새로 추가
        const ownTodos = prevTodos.filter((todo) => todo.is_own_todo !== false);
        return [...ownTodos, ...friendsTodosForDate];
      });
    } catch (error) {
      console.error("Failed to load friends todos by date:", error);
    }
  };


  // 모든 Todo 데이터 로드 (본인 + 친구)
  useEffect(() => {
    if (user) {
      loadAllTodos();
      loadFriendsTodos();
    }
  }, [user]);

  // 선택된 날짜의 Todo 로드 (본인 + 친구)
  useEffect(() => {
    if (user) {
      loadDailyTodos(selectedDate);
      loadFriendsTodosByDate(selectedDate);
    }
  }, [user, selectedDate]);

  // 모달 새로고침 이벤트 리스너 제거 - 할일 추가 후 모달이 다시 열리는 문제 해결

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingTodo(null);
    setIsModalOpen(true);
  };

  const handleAddTodo = () => {
    console.log("Opening modal for new todo, dailyTodos:", dailyTodos);
    setEditingTodo(null);
    setIsModalOpen(true);
  };

  const handleEditTodo = (todo: Todo) => {
    // 친구의 일정은 수정할 수 없음
    if (todo.is_own_todo === false) {
      alert("친구의 일정은 수정할 수 없습니다.");
      return;
    }

    console.log("Editing todo:", todo);
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  const handleSaveTodo = async (todoData: {
    title: string;
    due_date: string;
    priority: "low" | "medium" | "high";
    completed?: boolean;
  }) => {
    try {
      if (editingTodo) {
        // 수정
        await todoApi.updateTodo(editingTodo.id, todoData);
      } else {
        // 새로 추가
        await todoApi.createTodo(todoData);
      }

      // 데이터 새로고침
      await loadAllTodos();
      await loadDailyTodos(selectedDate);

      setIsModalOpen(false);
      setEditingTodo(null);

      // 성공 메시지는 모달이 닫히는 것으로 충분
    } catch (error) {
      console.error("Failed to save todo:", error);
      alert("할 일 저장에 실패했습니다.");
    }
  };

  const handleSaveMultipleTodos = async (
    todos: Array<{
      title: string;
      due_date: string;
      priority: "low" | "medium" | "high";
      completed: boolean;
    }>
  ) => {
    try {
      // 각 할일을 개별적으로 저장
      for (const todo of todos) {
        await todoApi.createTodo(todo);
      }

      // 데이터 새로고침
      await loadAllTodos();
      await loadDailyTodos(selectedDate);

      setIsModalOpen(false);
      setEditingTodo(null);
    } catch (error) {
      console.error("Failed to save todos:", error);
      alert("할 일 저장에 실패했습니다.");
    }
  };

  const handleToggleTodo = async (id: string) => {
    const todo = dailyTodos.find((t) => t.id === id);
    if (!todo) return;

    // 친구의 일정은 토글할 수 없음
    if (todo.is_own_todo === false) {
      alert("친구의 일정은 수정할 수 없습니다.");
      return;
    }

    try {
      await todoApi.updateTodo(id, { completed: !todo.completed });
      await loadAllTodos();
      await loadDailyTodos(selectedDate);
    } catch (error) {
      console.error("Failed to toggle todo:", error);
      alert("할 일 상태 변경에 실패했습니다.");
    }
  };

  const handleUpdatePriority = async (
    id: string,
    priority: "low" | "medium" | "high"
  ) => {
    const todo = dailyTodos.find((t) => t.id === id);
    if (!todo) return;

    // 친구의 일정은 우선순위를 변경할 수 없음
    if (todo.is_own_todo === false) {
      alert("친구의 일정은 수정할 수 없습니다.");
      return;
    }

    try {
      await todoApi.updateTodo(id, { priority });
      await loadAllTodos();
      await loadDailyTodos(selectedDate);
    } catch (error) {
      console.error("Failed to update priority:", error);
      alert("우선순위 변경에 실패했습니다.");
    }
  };

  const handleDeleteTodo = async (id: string) => {
    console.log("Deleting todo with id:", id);

    const todo = dailyTodos.find((t) => t.id === id);
    if (!todo) return;

    // 친구의 일정은 삭제할 수 없음
    if (todo.is_own_todo === false) {
      alert("친구의 일정은 삭제할 수 없습니다.");
      return;
    }

    try {
      console.log("Proceeding with delete...");
      await todoApi.deleteTodo(id);
      console.log("Todo deleted successfully");
      await loadAllTodos();
      await loadDailyTodos(selectedDate);
    } catch (error) {
      console.error("Failed to delete todo:", error);
      alert("할 일 삭제에 실패했습니다.");
    }
  };

  // 인증 로딩 중이거나 로그인하지 않은 경우 로딩 표시
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 캘린더와 할일 목록 */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 캘린더 */}
          <div>
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onDateClick={handleDateClick}
              todosByDate={todosByDate}
              todosData={todosDataByDate}
            />
          </div>

          {/* 그날의 할일 목록 */}
          <div>
            <DailyTodos
              selectedDate={selectedDate}
              todos={dailyTodos}
              onEditTodo={handleEditTodo}
              onToggleTodo={handleToggleTodo}
              onDeleteTodo={handleDeleteTodo}
              onAddTodo={handleAddTodo}
              onDateChange={setSelectedDate}
            />
          </div>
        </div>


        {/* 전체 통계 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            전체 통계
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {todos.length}
              </div>
              <div className="text-sm text-gray-600">전체 할 일</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {todos.filter((todo) => todo.completed).length}
              </div>
              <div className="text-sm text-gray-600">완료</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {todos.filter((todo) => !todo.completed).length}
              </div>
              <div className="text-sm text-gray-600">진행 중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {
                  todos.filter(
                    (todo) =>
                      todo.due_date &&
                      new Date(todo.due_date) < new Date() &&
                      !todo.completed
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600">지연됨</div>
            </div>
          </div>
        </div>
      </main>

      {/* Todo 모달 */}
      <TodoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTodo(null);
        }}
        selectedDate={selectedDate}
        editingTodo={editingTodo}
        existingTodos={dailyTodos}
        // 디버깅: dailyTodos 상태 확인
        // {console.log("HomePage dailyTodos:", dailyTodos)}
        onSave={handleSaveTodo}
        onSaveMultiple={handleSaveMultipleTodos}
        onEdit={handleEditTodo}
        onDelete={handleDeleteTodo}
        onToggle={handleToggleTodo}
        onUpdatePriority={handleUpdatePriority}
      />
    </div>
  );
};

export default HomePage;
