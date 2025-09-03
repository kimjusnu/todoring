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

  // 본인과 친구의 할일을 구분
  const ownTodos = todos.filter((todo) => todo.is_own_todo);
  const friendsTodos = todos.filter((todo) => !todo.is_own_todo);

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
            {friendsTodos.length > 0 && (
              <span className="ml-2 text-blue-600">
                · {friendsTodos[0]?.owner_name}의 일정 {friendsTodos.length}개
              </span>
            )}
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
        <div className="space-y-4">
          {/* 내 할일 섹션 */}
          {pendingTodos.filter((todo) => todo.is_own_todo).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                내 할일 (
                {pendingTodos.filter((todo) => todo.is_own_todo).length}개)
              </h4>
              <div className="space-y-3">
                {pendingTodos
                  .filter((todo) => todo.is_own_todo)
                  .map((todo) => (
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
                            borderColor: getPriorityColor(
                              todo.priority || "medium"
                            ),
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
                                color: getPriorityColor(
                                  todo.priority || "medium"
                                ),
                              }}
                            >
                              {getPriorityLabel(todo.priority || "medium")}
                            </span>
                          </div>
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
              </div>
            </div>
          )}

          {/* 친구 할일 섹션 */}
          {pendingTodos.filter((todo) => !todo.is_own_todo).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                {pendingTodos.filter((todo) => !todo.is_own_todo).length > 0 &&
                  pendingTodos.filter((todo) => !todo.is_own_todo)[0]
                    ?.owner_name}
                의 할일 (
                {pendingTodos.filter((todo) => !todo.is_own_todo).length}개)
              </h4>
              <div className="space-y-3">
                {pendingTodos
                  .filter((todo) => !todo.is_own_todo)
                  .map((todo) => (
                    <div
                      key={todo.id}
                      className="group border rounded-lg p-4 bg-blue-50 border-blue-200"
                    >
                      <div className="flex items-start space-x-3">
                        {/* 체크박스 (비활성화) */}
                        <div className="mt-1 w-5 h-5 rounded border-2 flex items-center justify-center bg-gray-100 border-gray-300 cursor-not-allowed">
                          <svg
                            className="w-3 h-3 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>

                        {/* 할일 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm truncate text-blue-800">
                              {todo.title}
                            </h4>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {getPriorityLabel(todo.priority || "medium")}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                              {todo.owner_name}
                            </span>
                          </div>
                          <p className="text-xs text-blue-600">
                            {todo.owner_name}의 일정 (읽기 전용)
                          </p>
                        </div>

                        {/* 읽기 전용 표시 */}
                        <div className="flex items-center">
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            읽기 전용
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

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

              <div className="space-y-3">
                {/* 내 완료된 할일들 */}
                {completedTodos.filter((todo) => todo.is_own_todo).length >
                  0 && (
                  <div>
                    <h6 className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                      내 완료된 할일 (
                      {completedTodos.filter((todo) => todo.is_own_todo).length}
                      개)
                    </h6>
                    <div className="space-y-2">
                      {completedTodos
                        .filter((todo) => todo.is_own_todo)
                        .map((todo) => (
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

                {/* 친구 완료된 할일들 */}
                {completedTodos.filter((todo) => !todo.is_own_todo).length >
                  0 && (
                  <div>
                    <h6 className="text-xs font-medium text-blue-600 mb-2 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                      {completedTodos.filter((todo) => !todo.is_own_todo)
                        .length > 0 &&
                        completedTodos.filter((todo) => !todo.is_own_todo)[0]
                          ?.owner_name}
                      의 완료된 할일 (
                      {
                        completedTodos.filter((todo) => !todo.is_own_todo)
                          .length
                      }
                      개)
                    </h6>
                    <div className="space-y-2">
                      {completedTodos
                        .filter((todo) => !todo.is_own_todo)
                        .map((todo) => (
                          <div
                            key={todo.id}
                            className="flex items-center space-x-3 p-3 rounded-lg opacity-60 bg-blue-50"
                          >
                            <div className="w-4 h-4 rounded border-2 flex items-center justify-center bg-blue-200 border-blue-300">
                              <svg
                                className="w-2.5 h-2.5 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <span className="flex-1 text-sm line-through text-blue-700">
                              {todo.title}
                            </span>
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {todo.owner_name}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
