"use client";

import { useState, useEffect, useRef } from "react";
import type { Todo } from "@/shared/api/todoApi";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  editingTodo?: Todo | null;
  existingTodos?: Todo[];
  onSave: (todoData: {
    title: string;
    due_date: string;
    priority: "low" | "medium" | "high";
    completed?: boolean;
  }) => Promise<void>;
  onSaveMultiple?: (
    todos: Array<{
      title: string;
      due_date: string;
      priority: "low" | "medium" | "high";
      completed: boolean;
    }>
  ) => Promise<void>;
  onEdit?: (todo: Todo) => void;
  onDelete?: (id: string) => void;
  onToggle?: (id: string) => void;
  onUpdatePriority?: (id: string, priority: "low" | "medium" | "high") => void;
}

export const TodoModal = ({
  isOpen,
  onClose,
  selectedDate,
  editingTodo,
  existingTodos = [],
  onSave,
  onSaveMultiple,
  onEdit,
  onDelete,
  onToggle,
  onUpdatePriority,
}: TodoModalProps) => {
  const [todoItems, setTodoItems] = useState<TodoItem[]>([
    { id: "1", text: "", completed: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [textareaValue, setTextareaValue] = useState("");
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [showPriorityTooltip, setShowPriorityTooltip] = useState<string | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingTodo) {
      // 기존 할일 편집 모드
      setTodoItems([
        {
          id: "1",
          text: editingTodo.title,
          completed: editingTodo.completed,
        },
      ]);
      setTextareaValue(editingTodo.title);
    } else {
      // 새 할일 추가 모드
      setTodoItems([{ id: "1", text: "", completed: false }]);
      setTextareaValue("");
    }
  }, [editingTodo, isOpen]);

  // existingTodos가 변경될 때마다 모달 내부 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setShowTooltip(null);
      setShowPriorityTooltip(null);
      setShowDeleteConfirm(null);
    }
  }, [existingTodos, isOpen]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // 툴팁 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showTooltip && !target.closest("[data-tooltip]")) {
        setShowTooltip(null);
      }
      if (showPriorityTooltip && !target.closest("[data-priority-tooltip]")) {
        setShowPriorityTooltip(null);
      }
      if (showDeleteConfirm && !target.closest("[data-delete-confirm]")) {
        setShowDeleteConfirm(null);
      }
    };

    if (showTooltip || showPriorityTooltip || showDeleteConfirm) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTooltip, showPriorityTooltip, showDeleteConfirm]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const lines = value.split("\n");

    const newTodoItems: TodoItem[] = lines
      .map((line, index) => {
        const existingItem = todoItems[index];
        const cleanText = line.trim();

        return {
          id: existingItem?.id || `${index + 1}`,
          text: cleanText,
          completed: existingItem?.completed || false,
        };
      })
      .filter((item) => item.text.length > 0 || lines.length === 1);

    setTodoItems(newTodoItems);
  };

  const getTextareaValue = () => {
    return todoItems
      .map((item) => {
        return item.text;
      })
      .join("\n");
  };

  const toggleTodoItem = (id: string) => {
    setTodoItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  // 로컬 시간 기준으로 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDateToLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 텍스트 에어리어에서 직접 줄을 읽어와서 개별 할일로 처리
    console.log("Textarea value:", textareaValue);

    const lines = textareaValue
      .split("\n")
      .filter((line) => line.trim().length > 0);

    console.log("Filtered lines:", lines);

    if (lines.length === 0) {
      console.log("No lines to save");
      return;
    }

    setLoading(true);
    console.log("Starting save process...");

    try {
      if (editingTodo && lines.length === 1) {
        console.log("Saving single todo (edit mode):", lines[0]);
        // 기존 할일 수정
        await onSave({
          title: lines[0].trim(),
          due_date: formatDateToLocal(selectedDate),
          priority: editingTodo.priority || "medium",
          completed: editingTodo.completed,
        });
        // 수정 완료 후 모달 닫기
        onClose();
      } else if (onSaveMultiple && lines.length > 0) {
        console.log("Saving multiple todos:", lines);
        // 다중 할일 저장 - 각 줄을 개별 할일로 저장
        const todosToSave = lines.map((line) => ({
          title: line.trim(),
          due_date: formatDateToLocal(selectedDate),
          priority: "medium" as const,
          completed: false,
        }));
        console.log("Todos to save:", todosToSave);
        await onSaveMultiple(todosToSave);
        // 다중 할일 저장 후에는 onClose를 호출하지 않음 (HomePage에서 처리)
        return;
      } else {
        console.log("No save function available or no lines");
      }

      console.log("Save completed successfully");
      onClose();
    } catch (error) {
      console.error("Failed to save todos:", error);
      alert(
        `할 일 저장 실패: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTodoItems([{ id: "1", text: "", completed: false }]);
    setTextareaValue("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {selectedDate.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 기존 저장된 할일 목록 */}
          {(() => {
            console.log(
              "existingTodos:",
              existingTodos,
              "length:",
              existingTodos.length
            );
            return null;
          })()}
          {existingTodos.length > 0 && (
            <div className="border-b pb-4 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                저장된 할 일
              </h4>
              <div className="space-y-3">
                {/* 내 할일 섹션 */}
                {existingTodos.filter((todo) => todo.is_own_todo).length >
                  0 && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                      내 할일 (
                      {existingTodos.filter((todo) => todo.is_own_todo).length}
                      개)
                    </h5>
                    <div className="space-y-2">
                      {existingTodos
                        .filter((todo) => todo.is_own_todo)
                        .map((todo) => (
                          <div
                            key={todo.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              {/* 체크박스 */}
                              <button
                                type="button"
                                onClick={() => onToggle?.(todo.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  todo.completed
                                    ? "bg-blue-600 border-blue-600"
                                    : "border-gray-300 hover:border-blue-500"
                                }`}
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

                              {/* 할일 텍스트 */}
                              <span
                                className={`text-sm flex-1 ${
                                  todo.completed
                                    ? "line-through opacity-50"
                                    : ""
                                }`}
                                style={{ color: "var(--text-primary)" }}
                              >
                                {todo.title}
                              </span>

                              {/* 우선순위 표시 */}
                              <div className="relative" data-priority-tooltip>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowPriorityTooltip(
                                      showPriorityTooltip === todo.id
                                        ? null
                                        : todo.id
                                    )
                                  }
                                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                    todo.priority === "high"
                                      ? "bg-red-100 text-red-800 hover:bg-red-200"
                                      : todo.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                      : "bg-green-100 text-green-800 hover:bg-green-200"
                                  }`}
                                >
                                  {todo.priority === "high"
                                    ? "높음"
                                    : todo.priority === "medium"
                                    ? "보통"
                                    : "낮음"}
                                </button>

                                {/* 우선순위 변경 툴팁 */}
                                {showPriorityTooltip === todo.id && (
                                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[60px]">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await onUpdatePriority?.(
                                          todo.id,
                                          "high"
                                        );
                                        setShowPriorityTooltip(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                    >
                                      높음
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await onUpdatePriority?.(
                                          todo.id,
                                          "medium"
                                        );
                                        setShowPriorityTooltip(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50"
                                    >
                                      보통
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await onUpdatePriority?.(
                                          todo.id,
                                          "low"
                                        );
                                        setShowPriorityTooltip(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50"
                                    >
                                      낮음
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 수정/삭제 버튼 */}
                            <div
                              className="flex items-center space-x-1 ml-3 relative"
                              data-tooltip
                            >
                              {/* 더보기 버튼 */}
                              <button
                                type="button"
                                onClick={() =>
                                  setShowTooltip(
                                    showTooltip === todo.id ? null : todo.id
                                  )
                                }
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>

                              {/* 툴팁 메뉴 */}
                              {showTooltip === todo.id && (
                                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[80px]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      console.log(
                                        "Edit button clicked for todo:",
                                        todo
                                      );
                                      onEdit?.(todo);
                                      setShowTooltip(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                    <span>수정</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      console.log(
                                        "Delete button clicked for todo id:",
                                        todo.id
                                      );
                                      setShowDeleteConfirm(todo.id);
                                      setShowTooltip(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0V8a1 1 0 10-2 0v1zm4 0a1 1 0 102 0V8a1 1 0 10-2 0v1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span>삭제</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 친구 할일 섹션 */}
                {existingTodos.filter((todo) => !todo.is_own_todo).length >
                  0 && (
                  <div>
                    <h5 className="text-xs font-medium text-blue-600 mb-2 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                      {
                        existingTodos.filter((todo) => !todo.is_own_todo)[0]
                          ?.owner_name
                      }
                      의 할일 (
                      {existingTodos.filter((todo) => !todo.is_own_todo).length}
                      개)
                    </h5>
                    <div className="space-y-2">
                      {existingTodos
                        .filter((todo) => !todo.is_own_todo)
                        .map((todo) => (
                          <div
                            key={todo.id}
                            className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200"
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              {/* 체크박스 (비활성화) */}
                              <div className="w-5 h-5 rounded border-2 flex items-center justify-center bg-gray-100 border-gray-300 cursor-not-allowed">
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

                              {/* 할일 텍스트 */}
                              <span
                                className={`text-sm flex-1 text-blue-800 ${
                                  todo.completed
                                    ? "line-through opacity-50"
                                    : ""
                                }`}
                              >
                                {todo.title}
                              </span>

                              {/* 우선순위 표시 (읽기 전용) */}
                              <div
                                className={`px-2 py-1 text-xs rounded-full ${
                                  todo.priority === "high"
                                    ? "bg-red-100 text-red-800"
                                    : todo.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {todo.priority === "high"
                                  ? "높음"
                                  : todo.priority === "medium"
                                  ? "보통"
                                  : "낮음"}
                              </div>

                              {/* 친구 이름 태그 */}
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-200 text-blue-800">
                                {todo.owner_name}
                              </span>
                            </div>

                            {/* 읽기 전용 표시 */}
                            <div className="ml-3">
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                읽기 전용
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 새 할일 추가 섹션 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              새 할 일 추가
            </h4>

            {/* 텍스트 에리어 */}
            <div>
              <textarea
                ref={textareaRef}
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                style={{
                  borderColor: "var(--border-color)",
                  fontFamily: "monospace",
                  lineHeight: "1.6",
                }}
                placeholder="할 일을 입력해주세요..."
              />
              <p
                className="text-xs mt-2"
                style={{ color: "var(--text-muted)" }}
              >
                "꿈을 계획으로, 계획을 행동으로" - 각 줄이 하나의 목표가 됩니다.
              </p>
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              style={{
                borderColor: "var(--border-color)",
                color: "var(--text-secondary)",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !textareaValue.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "저장 중..."
                : `${
                    textareaValue
                      .split("\n")
                      .filter((line) => line.trim().length > 0).length || 0
                  }개 할 일 저장`}
            </button>
          </div>
        </form>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div
            className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6"
            data-delete-confirm
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                할 일 삭제
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                정말로 이 할 일을 삭제하시겠습니까?
                <br />
                삭제된 할 일은 복구할 수 없습니다.
              </p>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete?.(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
