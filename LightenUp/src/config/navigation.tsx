import React from 'react';
import Home from '../pages/Home';
import StatisticsAnalysis from '../pages/StatisticsPage';
import SettingsPage from '../pages/SettingsPage';
import Workflow from '../pages/Workflow';
import ChallengeHome from '../pages/challenge/ChallengeHome';
import ChallengeList from '../pages/challenge/ChallengeList';
import EnergyHome from '../pages/energy/EnergyHome';
import EnergyPublish from '../pages/energy/EnergyPublish';
import EnergyTrend from '../pages/EnergyTrend/EnergyTrend';
import SoulHub from '../pages/soul/SoulHub';
import SoulReport from '../pages/soul/components/SoulReport';
import Sedona from '../pages/soul/components/Sedona';
import surveyData from '../routes/test.json';

export const BRAND = {
  name: 'LightenUp&执行清单',
  logo: '🌀',
} as const;

export type NavItem = {
  path: string;
  text: string;
  icon?: string;
  children?: Array<NavItem>;
};

export const NAV_ITEMS: NavItem[] = [
  { path: '/energy', text: '能量流', icon: '⚡' },
  { path: '/trend', text: '心情趋势', icon: '📈' },
  { path: '/soul', text: '探索', icon: '✨' },
  { path: '/settings', text: '设置', icon: '⚙️' },
];

export type RouteConfig = {
  path: string;
  element: React.ReactNode;
  isProtected?: boolean;
};

export const ROUTES: RouteConfig[] = [
  { path: '/', element: <EnergyHome />, isProtected: true }, // 首页直接指向能量流
  { path: '/energy', element: <EnergyHome />, isProtected: true },
  { path: '/energy/publish', element: <EnergyPublish />, isProtected: true },
  { path: '/trend', element: <EnergyTrend />, isProtected: true },
  { path: '/soul', element: <SoulHub />, isProtected: true },
  { path: '/soul/report', element: <SoulReport />, isProtected: true },
  { path: '/soul/sedona', element: <Sedona />, isProtected: true },
  
  { path: '/settings', element: <SettingsPage />, isProtected: true },
];
