import React from 'react';
import Home from '../pages/Home';
import StatisticsAnalysis from '../pages/StatisticsPage';
import SettingsPage from '../pages/SettingsPage';
import Workflow from '../pages/Workflow';
import ChallengeHome from '../pages/challenge/ChallengeHome';
import ChallengeList from '../pages/challenge/ChallengeList';
import EnergyHome from '../pages/energy/EnergyHome';
import EnergyPublish from '../pages/energy/EnergyPublish';
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
  { path: '/', text: '首页', icon: '' },
  { path: '/challenge', text: '修炼场', icon: '⚔️' },
  { path: '/energy', text: '能量流', icon: '⚡' },
  {
    path: '/workflow',
    text: '工作流',
    icon: '',
    children: [
      { path: '/workflow/overview', text: '总览', icon: '' },
      { path: '/workflow/nodes', text: '节点', icon: '' },
    ],
  },
  { path: '/settings', text: '设置', icon: '' },
];

export type RouteConfig = {
  path: string;
  element: React.ReactNode;
  isProtected?: boolean;
};

export const ROUTES: RouteConfig[] = [
  { path: '/', element: <Home />, isProtected: true },
  { path: '/challenge', element: <ChallengeHome />, isProtected: true },
  { path: '/challenge/list', element: <ChallengeList />, isProtected: true },
  { path: '/energy', element: <EnergyHome />, isProtected: true },
  { path: '/energy/publish', element: <EnergyPublish />, isProtected: true },

  { path: '/statistics', element: <StatisticsAnalysis data={surveyData} />, isProtected: true },
  { path: '/settings', element: <SettingsPage />, isProtected: true },
  { path: '/workflow', element: <Workflow />, isProtected: true },
  
];
