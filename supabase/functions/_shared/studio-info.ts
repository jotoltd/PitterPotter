export interface StudioInfo {
  address: string;
  phone: string;
}

const STUDIO_INFO: Record<string, StudioInfo> = {
  Putney: {
    address: 'Pitter Potter Putney, 2 Lacy Street, London, SW15 1NH',
    phone: '020 8789 1234',
  },
  Wimbledon: {
    address: 'Pitter Potter Wimbledon, 78 Wimbledon Hill Road, London, SW19 7AH',
    phone: '020 8946 5678',
  },
};

export function getStudioInfo(studio: string): StudioInfo {
  return STUDIO_INFO[studio] || STUDIO_INFO['Putney'];
}
