"use client";

import type { Todo } from "@/shared/api/todoApi";

interface DailyTodosProps {
  selectedDate: Date;
  todos: Todo[];
  onEditTodo: (todo: Todo) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onAddTodo: () => void;
  onDateChange: (date: Date) => void;
}

export const DailyTodos = ({
  selectedDate,
  todos,
  onEditTodo,
  onToggleTodo,
  onDeleteTodo,
  onAddTodo,
  onDateChange,
}: DailyTodosProps) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "var(--red-600)";
      case "low":
        return "var(--green-600)";
      default:
        return "var(--blue-600)";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "높음";
      case "low":
        return "낮음";
      default:
        return "보통";
    }
  };

  const completedTodos = todos.filter((todo) => todo.completed);
  const pendingTodos = todos.filter((todo) => !todo.completed);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      {/* 날짜 네비게이션 버튼 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
        <button
          onClick={() => {
            const prevDate = new Date(selectedDate);
            prevDate.setDate(prevDate.getDate() - 1);
            onDateChange(prevDate);
          }}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          title="이전 날"
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={() => {
            const nextDate = new Date(selectedDate);
            nextDate.setDate(nextDate.getDate() + 1);
            onDateChange(nextDate);
          }}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          title="다음 날"
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 mt-6">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {formatDate(selectedDate)}
          </h3>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            총 {todos.length}개의 할 일 · 완료 {completedTodos.length}개
          </p>
        </div>
        <button
          onClick={onAddTodo}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + 할 일 추가
        </button>
      </div>

      {/* 진행률 */}
      {todos.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span style={{ color: "var(--text-secondary)" }}>진행률</span>
            <span style={{ color: "var(--text-primary)" }}>
              {Math.round((completedTodos.length / todos.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(completedTodos.length / todos.length) * 100}%`,
                backgroundColor: "var(--green-600)",
              }}
            />
          </div>
        </div>
      )}

      {/* 할일 목록이 없을 때 */}
      {todos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h4
            className="text-lg font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            할 일이 없습니다
          </h4>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            이 날에 대한 새로운 할 일을 추가해보세요
          </p>
          <button
            onClick={onAddTodo}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            첫 할 일 추가하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 미완료 할일들 */}
          {pendingTodos.map((todo) => (
            <div
              key={todo.id}
              className="group border rounded-lg p-4 hover:shadow-md transition-shadow"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="flex items-start space-x-3">
                {/* 체크박스 */}
                <button
                  onClick={() => onToggleTodo(todo.id)}
                  className="mt-1 w-5 h-5 rounded border-2 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: getPriorityColor(todo.priority || "medium"),
                  }}
                >
                  {todo.completed && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>

                {/* 할일 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4
                      className="font-medium text-sm truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {todo.title}
                    </h4>
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${getPriorityColor(
                          todo.priority || "medium"
                        )}20`,
                        color: getPriorityColor(todo.priority || "medium"),
                      }}
                    >
                      {getPriorityLabel(todo.priority || "medium")}
                    </span>
                  </div>
                  {todo.description && (
                    <p
                      className="text-sm line-clamp-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {todo.description}
                    </p>
                  )}
                </div>

                {/* 액션 버튼들 */}
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditTodo(todo)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="수정"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteTodo(todo.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="삭제"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* 완료된 할일들 */}
          {completedTodos.length > 0 && (
            <div className="pt-4">
              <h5
                className="text-sm font-medium mb-3 flex items-center"
                style={{ color: "var(--text-secondary)" }}
              >
                <span>완료된 할 일 ({completedTodos.length})</span>
                <div className="flex-1 h-px bg-gray-200 ml-3"></div>
              </h5>

              <div className="space-y-2">
                {completedTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="group flex items-center space-x-3 p-3 rounded-lg opacity-60 hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "var(--background)" }}
                  >
                    <button
                      onClick={() => onToggleTodo(todo.id)}
                      className="w-4 h-4 rounded border-2 flex items-center justify-center"
                      style={{
                        backgroundColor: getPriorityColor(
                          todo.priority || "medium"
                        ),
                        borderColor: getPriorityColor(
                          todo.priority || "medium"
                        ),
                      }}
                    >
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <span
                      className="flex-1 text-sm line-through"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {todo.title}
                    </span>
                    <button
                      onClick={() => onDeleteTodo(todo.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="삭제"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
