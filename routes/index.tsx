import { lazy } from 'react';

// Lazy load routes for code splitting
export const LandingPage = lazy(() => import('../components/LandingPage'));
export const Login = lazy(() => import('../components/Login'));
export const ProfessionalView = lazy(() => import('../components/ProfessionalView'));
export const QuestionnairesView = lazy(() => import('../components/QuestionnairesView'));
export const ReportView = lazy(() => import('../components/ReportView'));
export const ComparisonView = lazy(() => import('../components/ComparisonView'));
export const ValidateView = lazy(() => import('../components/ValidateView'));
export const PrivacyPolicy = lazy(() => import('../components/PrivacyPolicy'));
export const ConsentLGPD = lazy(() => import('../components/ConsentLGPD'));

