export type PresenceStatus = 'online' | 'away' | 'dnd' | 'offline';

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen?: number | null; // Epoch seconds timestamp
  customStatus?: string | null;
  updatedAt?: number | null;
}

export interface BatchPresenceRequest {
  userIds: string[];
}

export type BatchPresenceResponse = Record<string, UserPresence>;

export interface PresenceSubscriptionPayload {
  user_ids: string[];
}

export interface PresenceHeartbeatPayload {
  status: PresenceStatus;
  custom_status?: string;
}

export interface PresenceSnapshotPayload {
  presences: Record<
    string,
    {
      user_id: string;
      status: PresenceStatus;
      last_seen?: number | null;
      custom_status?: string | null;
      updated_at?: number | null;
    }
  >;
}

export interface PresenceChangedPayload {
  user_id: string;
  status: PresenceStatus;
  last_seen?: number | null;
  custom_status?: string | null;
}
