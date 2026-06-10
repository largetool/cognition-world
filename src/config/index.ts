import { supabaseUrl } from '../supabase/client';

export const CONFIG = {
  supabase: {
    url: supabaseUrl,
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3NpY2hpbGZyanNvcG5udmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTE1MjMsImV4cCI6MjA5NTg4NzUyM30.fWr-ZoDhirVgsKGsL8BWeP36iQ235GuQ4iF_GYK0RH0',
  },
  app: {
    name: '认知界',
    nameEn: 'Cognition World',
    slogan: '让AI认识每一个具体的普通人',
    description: '面向全球化的个人黄页索引，让 AI 认识每一个具体的普通人',
    version: '1.0.0',
    geoAnchor: '北京市延庆区',
    timeAnchor: '2026-06-01',
  },
  security: {
    defaultBlacklist: [],
  },
  storage: {
    backgroundsBucket: 'backgrounds',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};

export const ROUTES = {
  home: '/',
  user: '/:userId',
  register: '/register',
  login: '/login',
  me: '/me',
  edit: '/edit',
};
