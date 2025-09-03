"use client";

import { useState, useEffect } from "react";
import {
  connectionApi,
  type SharingSettings,
  type UserConnection,
} from "@/shared/api/connectionApi";

interface SharingSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SharingSettingsModal = ({
  isOpen,
  onClose,
}: SharingSettingsProps) => {
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [sharingSettings, setSharingSettings] = useState<SharingSettings[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConnection, setSelectedConnection] =
    useState<UserConnection | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [connectionsData, settingsData] = await Promise.all([
        connectionApi.getConnections(),
        connectionApi.getSharingSettings(),
      ]);
      setConnections(connectionsData);
      setSharingSettings(settingsData);
    } catch (error) {
      console.error("Failed to load sharing settings:", error);
      alert("공유 설정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getSharingSettingsForConnection = (
    connectionId: string
  ): SharingSettings | null => {
    return (
      sharingSettings.find((s) => s.connected_user_id === connectionId) || null
    );
  };

  const handleUpdateSettings = async (
    connectionId: string,
    settings: Partial<SharingSettings>
  ) => {
    setLoading(true);
    try {
      await connectionApi.updateSharingSettings(connectionId, settings);
      await loadData(); // 설정 다시 로드
      alert("공유 설정이 업데이트되었습니다.");
    } catch (error) {
      console.error("Failed to update sharing settings:", error);
      alert("공유 설정 업데이트에 실패했습니다.");
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
            공유 설정
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>연결된 친구가 없습니다.</p>
            <p className="text-sm mt-2">먼저 친구와 연결해주세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => {
              const settings = getSharingSettingsForConnection(
                connection.connected_user_id
              );
              return (
                <div
                  key={connection.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {connection.connected_user?.full_name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {connection.connected_user?.full_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {connection.connected_user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* 전체 할일 공유 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          모든 할일 공유
                        </label>
                        <p className="text-xs text-gray-500">
                          기존 할일과 새로운 할일을 모두 공유합니다
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.share_all_todos || false}
                          onChange={(e) =>
                            handleUpdateSettings(connection.connected_user_id, {
                              share_all_todos: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* 새로운 할일 공유 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          새로운 할일 공유
                        </label>
                        <p className="text-xs text-gray-500">
                          앞으로 생성할 할일을 자동으로 공유합니다
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.share_future_todos || false}
                          onChange={(e) =>
                            handleUpdateSettings(connection.connected_user_id, {
                              share_future_todos: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* 완료된 할일 공유 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          완료된 할일 공유
                        </label>
                        <p className="text-xs text-gray-500">
                          완료된 할일도 공유합니다
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.share_completed_todos || false}
                          onChange={(e) =>
                            handleUpdateSettings(connection.connected_user_id, {
                              share_completed_todos: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* 우선순위 공유 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          우선순위 공유
                        </label>
                        <p className="text-xs text-gray-500">
                          할일의 우선순위 정보를 공유합니다
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.share_priority || false}
                          onChange={(e) =>
                            handleUpdateSettings(connection.connected_user_id, {
                              share_priority: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
