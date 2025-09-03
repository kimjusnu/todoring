"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

  const router = useRouter();

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

  const loadDailyTodos = async (date: Date) => {
    try {
      setLoading(true);
      // 날짜의 시작과 끝 시간으로 범위 검색하도록 수정 필요
      const dateString = date.toISOString().split("T")[0];
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

  // 모든 Todo 데이터 로드
  useEffect(() => {
    loadAllTodos();
  }, []);

  // 선택된 날짜의 Todo 로드
  useEffect(() => {
    loadDailyTodos(selectedDate);
  }, [selectedDate]);

  // 모달 새로고침 이벤트 리스너
  useEffect(() => {
    const handleRefreshModal = () => {
      setIsModalOpen(true);
    };

    window.addEventListener("refreshModal", handleRefreshModal);
    return () => window.removeEventListener("refreshModal", handleRefreshModal);
  }, []);

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
