import { supabase } from "@/shared/config/supabase";

export interface UserConnection {
  id: string;
  user_id: string;
  connected_user_id: string;
  connection_type: "friend" | "partner" | "family";
  status: "pending" | "accepted" | "blocked";
  permissions: "read_only" | "read_write";
  created_at: string;
  updated_at: string;
  connected_user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface ConnectionInvite {
  id: string;
  inviter_id: string;
  invite_code: string;
  connection_type: "friend" | "partner" | "family";
  permissions: "read_only" | "read_write";
  expires_at: string;
  used_at?: string;
  used_by?: string;
  created_at: string;
  inviter?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface SharingSettings {
  id: string;
  user_id: string;
  connected_user_id: string;
  share_all_todos: boolean;
  share_future_todos: boolean;
  share_completed_todos: boolean;
  share_priority: boolean;
  created_at: string;
  updated_at: string;
}

// 8자리 친구코드 생성 함수
const generateFriendCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 사용자의 친구코드 조회
export const getMyFriendCode = async (): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .select("friend_code")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data.friend_code;
};

// 친구코드로 사용자 찾기
export const getUserByFriendCode = async (friendCode: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, friend_code")
    .eq("friend_code", friendCode)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error(
        "존재하지 않는 친구코드입니다. 친구코드를 다시 확인해주세요."
      );
    }
    throw error;
  }
  return data;
};

// 친구코드로 연결 수락
export const acceptFriendCode = async (friendCode: string) => {
  console.log("acceptFriendCode: Starting with friend code:", friendCode);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("acceptFriendCode: User not authenticated");
    throw new Error("User not authenticated");
  }
  console.log("acceptFriendCode: User authenticated:", user.id);

  // 친구코드로 사용자 찾기
  console.log("acceptFriendCode: Looking up user by friend code...");
  const targetUser = await getUserByFriendCode(friendCode);
  console.log("acceptFriendCode: Target user found:", targetUser);

  if (targetUser.id === user.id) {
    console.error("acceptFriendCode: Cannot connect to self");
    throw new Error("자기 자신과는 연결할 수 없습니다.");
  }

  // 이미 연결되어 있는지 확인 (양방향)
  console.log("acceptFriendCode: Checking for existing connections...");
  const { data: existingConnections, error: checkError } = await supabase
    .from("user_connections")
    .select("*")
    .or(
      `and(user_id.eq.${user.id},connected_user_id.eq.${targetUser.id}),and(user_id.eq.${targetUser.id},connected_user_id.eq.${user.id})`
    );

  if (checkError) {
    console.error(
      "acceptFriendCode: Error checking existing connections:",
      checkError
    );
    throw checkError;
  }

  if (existingConnections && existingConnections.length > 0) {
    console.error("acceptFriendCode: Already connected");
    throw new Error("이미 연결된 사용자입니다.");
  }

  // 양방향 연결 생성
  console.log("acceptFriendCode: Creating bidirectional connections...");
  const { data, error } = await supabase
    .from("user_connections")
    .insert([
      {
        user_id: user.id,
        connected_user_id: targetUser.id,
        connection_type: "friend",
        status: "accepted",
        permissions: "read_only",
      },
      {
        user_id: targetUser.id,
        connected_user_id: user.id,
        connection_type: "friend",
        status: "accepted",
        permissions: "read_only",
      },
    ])
    .select();

  if (error) {
    console.error("acceptFriendCode: Error creating connections:", error);
    throw error;
  }

  console.log(
    "acceptFriendCode: Bidirectional connections created successfully:",
    data
  );
  return { success: true, connections: data };
};

// 연결된 사용자 목록 조회
export const getConnections = async (): Promise<UserConnection[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  console.log("getConnections: Fetching connections for user:", user.id);

  // 양방향 연결이므로 user_id가 현재 사용자인 경우만 조회하면 됨
  const { data: connections, error } = await supabase
    .from("user_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "accepted");

  if (error) {
    console.error("getConnections: Error fetching connections:", error);
    throw error;
  }

  console.log("getConnections: Found connections:", connections);

  // 연결된 사용자 ID들을 수집
  const connectedUserIds = new Set<string>();

  connections?.forEach((conn) => {
    connectedUserIds.add(conn.connected_user_id);
  });

  console.log(
    "getConnections: Connected user IDs:",
    Array.from(connectedUserIds)
  );

  // 연결된 사용자들의 프로필 정보 조회
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name, friend_code")
    .in("id", Array.from(connectedUserIds));

  if (profilesError) {
    console.error("getConnections: Error fetching profiles:", profilesError);
    throw profilesError;
  }

  console.log("getConnections: Found profiles:", profiles);

  // UserConnection 형태로 변환
  const allConnections: UserConnection[] = [];

  // 내가 추가한 친구들
  connections?.forEach((conn) => {
    const profile = profiles?.find((p) => p.id === conn.connected_user_id);
    if (profile) {
      allConnections.push({
        id: conn.id,
        user_id: conn.user_id,
        connected_user_id: conn.connected_user_id,
        connection_type: conn.connection_type,
        status: conn.status,
        permissions: conn.permissions,
        created_at: conn.created_at,
        updated_at: conn.updated_at,
        connected_user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
        },
      });
    }
  });

  // 나를 추가한 친구들 (양방향 연결이므로 이 부분은 제거됨)
  // reverseConnections?.forEach((conn) => {
  //   const profile = profiles?.find((p) => p.id === conn.user_id);
  //   if (profile) {
  //     allConnections.push({
  //       id: conn.id,
  //       user_id: conn.user_id,
  //       connected_user_id: conn.connected_user_id,
  //       connection_type: conn.connection_type,
  //       status: conn.status,
  //       permissions: conn.permissions,
  //       created_at: conn.created_at,
  //       updated_at: conn.updated_at,
  //       connected_user: {
  //         id: profile.id,
  //         email: profile.email,
  //         full_name: profile.full_name,
  //         friend_code: profile.friend_code,
  //       },
  //     });
  //   }
  // });

  console.log("getConnections: Final connections list:", allConnections);
  return allConnections;
};

// 친구 연결 삭제
export const deleteConnection = async (connectionId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  console.log("deleteConnection: Deleting connection:", connectionId);

  const { error } = await supabase
    .from("user_connections")
    .delete()
    .eq("id", connectionId)
    .eq("user_id", user.id); // 본인이 생성한 연결만 삭제 가능

  if (error) {
    console.error("deleteConnection: Error deleting connection:", error);
    throw error;
  }

  console.log("deleteConnection: Connection deleted successfully");
  return { success: true };
};

// 내가 생성한 초대 코드 목록 조회 (임시로 비활성화)
export const getMyInvites = async (): Promise<ConnectionInvite[]> => {
  // 임시로 빈 배열 반환
  return [];
};

// 공유 설정 조회 (임시로 비활성화)
export const getSharingSettings = async (): Promise<SharingSettings[]> => {
  // 임시로 빈 배열 반환
  return [];
};

// 공유 설정 업데이트 (임시로 비활성화)
export const updateSharingSettings = async (
  connectedUserId: string,
  settings: Partial<
    Omit<
      SharingSettings,
      "id" | "user_id" | "connected_user_id" | "created_at" | "updated_at"
    >
  >
) => {
  // 임시로 성공 응답 반환
  return { success: true };
};

// 공유된 할일 조회 (임시로 비활성화)
export const getSharedTodos = async (connectedUserId: string) => {
  // 임시로 빈 배열 반환
  return [];
};

// connectionApi 객체 export
export const connectionApi = {
  getMyFriendCode,
  getUserByFriendCode,
  acceptFriendCode,
  getConnections,
  getMyInvites,
  deleteConnection,
  getSharingSettings,
  updateSharingSettings,
  getSharedTodos,
};
