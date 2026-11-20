export interface CabinConfig {
  apiUrl: string;
  wsUrl: string;
  tenantId: string;
  siteId: string;
  entryLaneId: string;
  exitLaneId: string;
  cabinName: string;
}

const defaults: CabinConfig = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  wsUrl: import.meta.env.VITE_WS_URL ?? 'http://localhost:8000',
  tenantId: import.meta.env.VITE_TENANT_ID ?? '',
  siteId: import.meta.env.VITE_SITE_ID ?? 'site-lm81',
  entryLaneId: import.meta.env.VITE_ENTRY_LANE_ID ?? 'lane-entry-01',
  exitLaneId: import.meta.env.VITE_EXIT_LANE_ID ?? 'lane-exit-01',
  cabinName: 'LANDMARK 81 · CONTROL ROOM',
};

export function getCabinConfig(): CabinConfig {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem('spm_cabin_config') ?? '{}') };
  } catch {
    return defaults;
  }
}

export function saveCabinConfig(config: CabinConfig) {
  localStorage.setItem('spm_cabin_config', JSON.stringify(config));
  if (config.tenantId) localStorage.setItem('spm_tenant_id', config.tenantId);
}
