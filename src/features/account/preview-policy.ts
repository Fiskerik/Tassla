export function isDevPreviewEnabled(flag: string | undefined, developmentBuild: boolean): boolean {
  return flag === 'true' && developmentBuild === true;
}

export const DEV_PREVIEW_ENABLED = isDevPreviewEnabled(
  process.env.EXPO_PUBLIC_DEV_PREVIEW,
  typeof __DEV__ !== 'undefined' && __DEV__ === true,
);
