"use client";

import { useState } from "react";

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onDateClick: (date: Date) => void; // 날짜 클릭 시 모달 열기
  todosByDate: Record<string, number>; // 날짜별 할일 개수
  todosData: Record<
    string,
    Array<{ title: string; completed: boolean; priority?: string }>
  >; // 날짜별 할일 데이터
}

export const Calendar = ({
  selectedDate,
  onDateSelect,
  onDateClick,
  todosByDate,
  todosData,
}: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  // 캘린더 날짜 배열 생성
  const calendarDays = [];

  // 이전 달의 빈 칸들
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // 현재 달의 날짜들
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    calendarDays.push(date);
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-md"
          style={{ color: "var(--text-secondary)" }}
        >
          &#8249;
        </button>
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {monthName}
        </h2>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-md"
          style={{ color: "var(--text-secondary)" }}
        >
          &#8250;
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {[
          { day: "일", icon: "☀️" },
          { day: "월", icon: "🌙" },
          { day: "화", icon: "🔥" },
          { day: "수", icon: "💧" },
          { day: "목", icon: "🌳" },
          { day: "금", icon: "✨" },
          { day: "토", icon: "🌱" },
        ].map(({ day, icon }) => (
          <div
            key={day}
            className="h-10 flex flex-col items-center justify-center text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="text-xs mb-1">{icon}</span>
            <span>{day}</span>
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => (
          <div key={index} className="h-20 relative">
            {date && (
              <button
                onClick={() => {
                  onDateSelect(date);
                  onDateClick(date);
                }}
                className={`w-full h-full flex flex-col p-1 text-xs rounded-md transition-colors relative ${
                  isSameDate(date, selectedDate)
                    ? "bg-blue-600 text-white"
                    : isToday(date)
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100"
                }`}
                style={{
                  color: isSameDate(date, selectedDate)
                    ? "#ffffff"
                    : isToday(date)
                    ? "var(--blue-600)"
                    : "var(--text-primary)",
                }}
              >
                {/* 날짜 */}
                <div
                  className={`font-medium mb-1 ${
                    isToday(date) ? "font-bold" : ""
                  }`}
                >
                  {date.getDate()}
                </div>

                {/* 할일 미리보기 */}
                <div className="flex-1 w-full overflow-hidden">
                  {todosData[formatDate(date)]
                    ?.slice(0, 3)
                    .map((todo, todoIndex) => (
                      <div
                        key={todoIndex}
                        className={`text-xs mb-0.5 truncate px-1 py-0.5 rounded ${
                          todo.completed ? "opacity-50 line-through" : ""
                        }`}
                        style={{
                          backgroundColor: isSameDate(date, selectedDate)
                            ? "rgba(255,255,255,0.2)"
                            : todo.priority === "high"
                            ? "rgba(239, 68, 68, 0.1)"
                            : todo.priority === "low"
                            ? "rgba(34, 197, 94, 0.1)"
                            : "rgba(59, 130, 246, 0.1)",
                          color: isSameDate(date, selectedDate)
                            ? "#ffffff"
                            : todo.priority === "high"
                            ? "var(--red-600)"
                            : todo.priority === "low"
                            ? "var(--green-600)"
                            : "var(--blue-600)",
                          fontSize: "10px",
                        }}
                        title={todo.title}
                      >
                        {todo.title}
                      </div>
                    ))}

                  {/* 더 많은 할일이 있을 때 표시 */}
                  {todosData[formatDate(date)]?.length > 3 && (
                    <div
                      className="text-xs opacity-70"
                      style={{
                        color: isSameDate(date, selectedDate)
                          ? "#ffffff"
                          : "var(--text-secondary)",
                        fontSize: "9px",
                      }}
                    >
                      +{todosData[formatDate(date)].length - 3}개 더
                    </div>
                  )}
                </div>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
