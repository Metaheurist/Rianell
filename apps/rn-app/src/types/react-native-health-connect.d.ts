/** Optional native module — stub types for Plan 19 Health Connect sync. */
declare module 'react-native-health-connect' {
  export function initialize(): Promise<boolean>;
  export function readRecords(
    recordType: string,
    options: { timeRangeFilter?: { operator: string; startTime: string } },
  ): Promise<{ records?: Array<{ startTime?: string; count?: number }> }>;
}
