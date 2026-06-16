/** 路由配置 - React Router v6 + 代码分割 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from 'widgets/app-layout/AppLayout';

/** 加载中占位 */
function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-sm text-[var(--muted)]">加载中...</div>
    </div>
  );
}

/** 懒加载页面组件 */
const LandingPage = lazy(() => import('pages/landing/LandingPage').then((m) => ({ default: m.LandingPage })));
const WelcomePage = lazy(() => import('pages/welcome/WelcomePage').then((m) => ({ default: m.WelcomePage })));
const LiteratureManagerPage = lazy(() => import('pages/literature-manager/LiteratureManagerPage').then((m) => ({ default: m.LiteratureManagerPage })));
const LiteratureReaderPage = lazy(() => import('pages/literature-reader/LiteratureReaderPage').then((m) => ({ default: m.LiteratureReaderPage })));
const EssayPage = lazy(() => import('pages/essay/EssayPage').then((m) => ({ default: m.EssayPage })));
const PaperEditorPage = lazy(() => import('pages/paper-editor/PaperEditorPage').then((m) => ({ default: m.PaperEditorPage })));
const SettingsPage = lazy(() => import('pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const SkillsPage = lazy(() => import('pages/skills/SkillsPage').then((m) => ({ default: m.SkillsPage })));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app/literature" replace />,
  },
  {
    path: '/landing',
    element: (
      <Suspense fallback={<Loading />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: '/welcome',
    element: (
      <Suspense fallback={<Loading />}>
        <WelcomePage />
      </Suspense>
    ),
  },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="literature" replace /> },
      {
        path: 'literature',
        element: (
          <Suspense fallback={<Loading />}>
            <LiteratureManagerPage />
          </Suspense>
        ),
      },
      {
        path: 'literature/:id',
        element: (
          <Suspense fallback={<Loading />}>
            <LiteratureReaderPage />
          </Suspense>
        ),
      },
      {
        path: 'essay',
        element: (
          <Suspense fallback={<Loading />}>
            <EssayPage />
          </Suspense>
        ),
      },
      {
        path: 'essay/:id',
        element: (
          <Suspense fallback={<Loading />}>
            <EssayPage />
          </Suspense>
        ),
      },
      {
        path: 'paper',
        element: (
          <Suspense fallback={<Loading />}>
            <PaperEditorPage />
          </Suspense>
        ),
      },
      {
        path: 'paper/:id',
        element: (
          <Suspense fallback={<Loading />}>
            <PaperEditorPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<Loading />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings/:tab',
        element: (
          <Suspense fallback={<Loading />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: 'skills',
        element: (
          <Suspense fallback={<Loading />}>
            <SkillsPage />
          </Suspense>
        ),
      },
      {
        path: 'skills/:section',
        element: (
          <Suspense fallback={<Loading />}>
            <SkillsPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/app/literature" replace />,
  },
]);
