"use client";

import { useState, useEffect } from "react";
import {
  connectionApi,
  type UserConnection,
  type ConnectionInvite,
} from "@/shared/api/connectionApi";

interface ConnectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionManager = ({
  isOpen,
  onClose,
}: ConnectionManagerProps) => {
  const [activeTab, setActiveTab] = useState<
    "connections" | "invites" | "create"
  >("connections");
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [myFriendCode, setMyFriendCode] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [connectionsData, friendCode] = await Promise.all([
        connectionApi.getConnections(),
        connectionApi.getMyFriendCode(),
      ]);
      setConnections(connectionsData);
      setMyFriendCode(friendCode);
    } catch (error) {
      console.error("Failed to load connection data:", error);
      alert("연결 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFriendCode = async () => {
    if (!inviteCode.trim()) {
      alert("친구코드를 입력해주세요.");
      return;
    }

    console.log("Starting friend code acceptance:", inviteCode.trim());
    setLoading(true);
    try {
      console.log("Calling acceptFriendCode API...");
      const result = await connectionApi.acceptFriendCode(inviteCode.trim());
      console.log("Friend code acceptance successful:", result);
      alert("연결이 성공적으로 완료되었습니다!");
      setInviteCode("");

      // 연결 목록 새로고침
      console.log("Reloading connection data...");
      await loadData();
    } catch (error) {
      console.error("Failed to accept friend code:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      // 사용자 친화적인 에러 메시지
      let userMessage = "친구코드 처리에 실패했습니다.";
      if (error instanceof Error) {
        if (error.message.includes("존재하지 않는 친구코드")) {
          userMessage =
            "존재하지 않는 친구코드입니다. 친구코드를 다시 확인해주세요.";
        } else if (error.message.includes("자기 자신과는 연결할 수 없습니다")) {
          userMessage = "자기 자신과는 연결할 수 없습니다.";
        } else if (error.message.includes("이미 연결된 사용자")) {
          userMessage = "이미 연결된 사용자입니다.";
        } else {
          userMessage = error.message;
        }
      }

      alert(userMessage);
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const handleCopyFriendCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      alert("친구코드가 클립보드에 복사되었습니다!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // 클립보드 API가 지원되지 않는 경우 대체 방법
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("친구코드가 클립보드에 복사되었습니다!");
    }
  };

  const handleDeleteConnection = async (
    connectionId: string,
    friendName: string
  ) => {
    if (!confirm(`${friendName}님과의 연결을 삭제하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    try {
      console.log("Deleting connection:", connectionId);
      await connectionApi.deleteConnection(connectionId);
      alert("연결이 삭제되었습니다.");

      // 연결 목록 새로고침
      console.log("Reloading connection data after deletion...");
      await loadData();
    } catch (error) {
      console.error("Failed to delete connection:", error);
      alert(
        error instanceof Error ? error.message : "연결 삭제에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            일정 공유 관리
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
          {[
            { key: "connections", label: "연결된 친구", icon: "👥" },
            { key: "invites", label: "내 친구코드", icon: "📝" },
            { key: "create", label: "친구코드 입력", icon: "🔗" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* 연결된 친구 목록 */}
        {activeTab === "connections" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">연결된 친구</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">로딩 중...</p>
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>아직 연결된 친구가 없습니다.</p>
                <p className="text-sm mt-2">
                  초대코드를 생성하거나 받아서 친구와 연결해보세요!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {connection.connected_user?.full_name?.charAt(0) ||
                            "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {connection.connected_user?.full_name || "알 수 없음"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {connection.connected_user?.email}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              connection.connection_type === "partner"
                                ? "bg-pink-100 text-pink-800"
                                : connection.connection_type === "family"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {connection.connection_type === "partner"
                              ? "연인"
                              : connection.connection_type === "family"
                              ? "가족"
                              : "친구"}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              connection.permissions === "read_write"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {connection.permissions === "read_write"
                              ? "편집 가능"
                              : "읽기 전용"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleDeleteConnection(
                          connection.id,
                          connection.connected_user?.full_name || "친구"
                        )
                      }
                      disabled={loading}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 내 친구코드 목록 */}
        {activeTab === "invites" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">내 친구코드</h3>

            {/* 내 친구코드 */}
            {myFriendCode && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-3">
                  내 친구코드
                </h4>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="font-mono text-xl font-bold text-blue-600 bg-white px-4 py-3 rounded border text-center">
                      {myFriendCode}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyFriendCode(myFriendCode)}
                    className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    title="친구코드 복사"
                  >
                    📋 복사
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 친구코드 입력 */}
        {activeTab === "create" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">친구코드 입력</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  친구코드
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="8자리 친구코드를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={8}
                />
              </div>
              <button
                onClick={handleAcceptFriendCode}
                disabled={loading || !inviteCode.trim()}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "처리 중..." : "친구 추가하기"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
