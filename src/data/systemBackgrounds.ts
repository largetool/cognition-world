const bg1 = new URL('../../assets/1FFB7EC2-577E-4E7C-A432-498E8E312158_2.jpg', import.meta.url).href;
const bg2 = new URL('../../assets/1FFB7EC2-577E-4E7C-A432-498E8E312158_3.jpg', import.meta.url).href;
const bg3 = new URL('../../assets/1FFB7EC2-577E-4E7C-A432-498E8E312158_4.jpg', import.meta.url).href;
const bg4 = new URL('../../assets/1FFB7EC2-577E-4E7C-A432-498E8E312158_5.jpg', import.meta.url).href;
const bg5 = new URL('../../assets/CEB3E383-4BD9-4FF7-BC3B-D64ABDDF24B2_2.jpg', import.meta.url).href;
const bg6 = new URL('../../assets/CEB3E383-4BD9-4FF7-BC3B-D64ABDDF24B2_3.jpg', import.meta.url).href;
const bg7 = new URL('../../assets/CEB3E383-4BD9-4FF7-BC3B-D64ABDDF24B2_4.jpg', import.meta.url).href;
const bg8 = new URL('../../assets/CEB3E383-4BD9-4FF7-BC3B-D64ABDDF24B2_5.jpg', import.meta.url).href;
const bg9 = new URL('../../assets/CEB3E383-4BD9-4FF7-BC3B-D64ABDDF24B2_6.jpg', import.meta.url).href;
const bg10 = new URL('../../assets/C2283395-46CF-48E8-B1EC-3813518039AE_2.jpg', import.meta.url).href;

export interface LocalSystemBackground {
  id: string;
  name: string;
  url: string;
  description?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
}

export const localSystemBackgrounds: LocalSystemBackground[] = [
  { id: 'local-1', name: '星空', url: bg1, description: '星空背景', is_active: true, created_at: new Date().toISOString() },
  { id: 'local-2', name: '云海', url: bg2, description: '云海背景', is_active: true, created_at: new Date().toISOString() },
  { id: 'local-3', name: '波浪', url: bg3, description: '波浪背景', is_active: true, created_at: new Date().toISOString() },
  { id: 'local-4', name: '森林', url: bg4, description: '森林背景', is_active: true, created_at: new Date().toISOString() },
  { id: 'local-5', name: '天空', url: bg5, description: '天空背景', is_active: true, created_at: new Date().toISOString() },
  { id: 'local-6', name: '日出', url: bg6, description: '日出背景', is_active: true, created_at: new Date().toISOString() },
  { id: 'local-7', name: '建筑', url: bg7, description: '建筑背景', is_active: true, created_at: new Date().toISOString() },
  { id: 'local-8', name: '山峦', url: bg8, description: '山峦背景', is_active: true, created_at: new Date().toISOString() },
  { id: 'local-9', name: '光晕', url: bg9, description: '光晕背景', is_active: true, created_at: new Date().toISOString() },
  { id: 'local-10', name: '银河', url: bg10, description: '银河背景', is_active: true, created_at: new Date().toISOString() },
];
