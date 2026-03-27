export type PermissionName = 'notifications' | 'microphone';

export type PermissionStatus = 'unavailable' | 'denied' | 'granted';

/**
 * Placeholder permissions manager for parity with the web app.
 * Next steps: implement platform-specific request + rationale strings.
 */
export const Permissions = {
  async getStatus(_permission: PermissionName): Promise<PermissionStatus> {
    return 'unavailable';
  },
  async request(_permission: PermissionName): Promise<PermissionStatus> {
    return 'unavailable';
  },
};

