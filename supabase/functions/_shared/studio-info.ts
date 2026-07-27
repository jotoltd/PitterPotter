export interface StudioInfo {
  address: string;
  phone: string;
}

const STUDIO_INFO: Record<string, StudioInfo> = {
  Putney: {
    address: '234 Upper Richmond Road, London, SW15 6TG',
    phone: '020 8788 1635',
  },
  Wimbledon: {
    address: '52 Wimbledon Hill Road, London, SW19 7PA',
    phone: '020 3770 4499',
  },
};

export function getStudioInfo(studio: string): StudioInfo {
  return STUDIO_INFO[studio] || STUDIO_INFO['Putney'];
}
