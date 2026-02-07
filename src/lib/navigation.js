import { LayoutDashboard, MessageCircle, ShieldAlert, Smartphone, UserCheck, Users, Zap } from 'lucide-react';

export const navigationItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'My Tasks', icon: UserCheck, path: '/my-tasks' },
  { label: 'Remote Control', icon: Smartphone, path: '/controlled' },
  { label: 'Operations', icon: Zap, path: '/operations', roles: ['ADMIN'] },
  { label: 'Community', icon: Users, path: '/community' },
  { label: 'Chat', icon: MessageCircle, path: '/chat' },
  { label: 'System Control', icon: ShieldAlert, path: '/admin', roles: ['ADMIN'] },
];
