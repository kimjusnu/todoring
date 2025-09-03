"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const steps = [
    {
      title: "투두링에 오신 것을 환영합니다",
      description: "효율적인 할 일 관리를 시작해보세요",
      content: (
        <div className="text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📝</span>
            </div>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed">
            투두링은 캘린더 기반의 직관적인 할 일 관리 도구입니다.
            <br />
            일정과 할 일을 한눈에 확인하고 효율적으로 관리해보세요.
          </p>
        </div>
      ),
    },
    {
      title: "캘린더로 한눈에 확인하세요",
      description: "날짜별 할 일을 시각적으로 관리",
      content: (
        <div className="text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📅</span>
            </div>
          </div>
          <div className="text-left max-w-md mx-auto space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-gray-700">
                캘린더에서 날짜를 클릭하여 할 일 추가
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-700">
                각 날짜에 할 일 미리보기 표시
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <span className="text-gray-700">우선순위별 색상 구분</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "간편한 텍스트 에디터",
      description: "자동 번호 매김과 체크박스로 쉽게 작성",
      content: (
        <div className="text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✏️</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-left max-w-sm mx-auto">
            <div className="font-mono text-sm space-y-1">
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">1.</span>
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-700">회의 준비하기</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">2.</span>
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-gray-700 line-through">보고서 작성</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">3.</span>
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-700">장보기</span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 mt-4">
            엔터를 누르면 자동으로 다음 번호가 생성됩니다
          </p>
        </div>
      ),
    },
    {
      title: "준비 완료",
      description: "지금 바로 첫 번째 할 일을 만들어보세요",
      content: (
        <div className="text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✨</span>
            </div>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            모든 준비가 완료되었습니다!
            <br />
            로그인하여 나만의 할 일 관리를 시작해보세요.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-800 text-sm">
              💡 <strong>팁:</strong> 우선순위를 설정하여 중요한 일을 먼저
              처리하세요!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToLogin = () => {
    router.push("/login");
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* 진행 표시바 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">
              {currentStep + 1} / {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              {currentStepData.title}
            </h1>
            <p className="text-lg text-gray-600">
              {currentStepData.description}
            </p>
          </div>

          {/* 컨텐츠 */}
          <div className="mb-12">{currentStepData.content}</div>

          {/* 네비게이션 버튼 */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                currentStep === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              이전
            </button>

            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentStep
                      ? "bg-blue-600"
                      : index < currentStep
                      ? "bg-blue-300"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-w-[80px]"
              >
                다음
              </button>
            ) : (
              <button
                onClick={goToLogin}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors min-w-[80px]"
              >
                시작하기
              </button>
            )}
          </div>
        </div>

        {/* 건너뛰기 링크 */}
        <div className="text-center mt-6">
          <button
            onClick={goToLogin}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            건너뛰고 바로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
};
