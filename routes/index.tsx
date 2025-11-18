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

// New authentication components
export const LoginForm = lazy(() => import('../src/components/auth/LoginForm').then(m => ({ default: m.LoginForm })));
export const RegisterForm = lazy(() => import('../src/components/auth/RegisterForm').then(m => ({ default: m.RegisterForm })));
export const TwoFactorVerify = lazy(() => import('../src/components/auth/TwoFactorVerify').then(m => ({ default: m.TwoFactorVerify })));
export const TwoFactorSetup = lazy(() => import('../src/components/auth/TwoFactorSetup').then(m => ({ default: m.TwoFactorSetup })));
export const PasswordReset = lazy(() => import('../src/components/auth/PasswordReset').then(m => ({ default: m.PasswordReset })));
export const VerifyEmail = lazy(() => import('../src/components/auth/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
export const UserProfile = lazy(() => import('../src/components/auth/UserProfile').then(m => ({ default: m.UserProfile })));

