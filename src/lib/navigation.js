
import { LayoutDashboard, MessageCircle, ShieldAlert, UserCheck, Users } from 'lucide-react';

export const navigationItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'My Tasks', icon: UserCheck, path: '/my-tasks' },
  { label: 'Community', icon: Users, path: '/community' },
  { label: 'Chat', icon: MessageCircle, path: '/chat' },
  { label: 'System Control', icon: ShieldAlert, path: '/admin', roles: ['ADMIN'] },
];
