import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { trackPageview, trackEvent, AnalyticsEvents } from '../utils/analytics';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const { professionalId, setProfessionalId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track pageview quando rota muda
  useEffect(() => {
    trackPageview(location.pathname);
  }, [location.pathname]);

  const handleSignOut = async () => {
    // Track logout event
    trackEvent(AnalyticsEvents.LOGOUT);

    const isGoogleAuth = localStorage.getItem('is_google_auth') === 'true';
    localStorage.removeItem('current_professional_id');
    localStorage.removeItem('is_google_auth');
    
    // Se autenticado com Google, fazer signOut também
    if (isGoogleAuth) {
      try {
        const { signOutIfAvailable } = await import('../utils/firebaseHelper');
        const { loadFirebaseIfAvailable } = await import('../utils/firebaseHelper');
        const { firebaseConfig } = await loadFirebaseIfAvailable();
        if (firebaseConfig?.auth) {
          await signOutIfAvailable(firebaseConfig.auth);
        }
      } catch (error) {
        console.warn('Firebase não disponível para signOut:', error);
      }
    }
    
    setProfessionalId(null);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Fechar menu mobile ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {professionalId && (
        <header className="shadow-md" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #ecfeff 50%, #f0fdf4 100%)' }}>
          <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label={t('navigation.main')} role="navigation">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link to="/patients" className="font-bold text-xl text-blue-700 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">
                  <span className="mr-2" aria-hidden="true">🩺</span>
                  <span className="hidden sm:inline">{t('common.appName')}</span>
                  <span className="sm:hidden">FQ</span>
                  <span className="ml-2 text-xs font-normal text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">{t('common.beta')}</span>
                </Link>
              </div>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to="/patients"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] flex items-center ${
                    isActive('/patients')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-current={isActive('/patients') ? 'page' : undefined}
                >
                  {t('navigation.patients')}
                </Link>
                <Link
                  to="/questionnaires"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] flex items-center ${
                    isActive('/questionnaires')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-current={isActive('/questionnaires') ? 'page' : undefined}
                >
                  {t('navigation.questionnaires')}
                </Link>
                <Link
                  to="/report"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] flex items-center ${
                    isActive('/report')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-current={isActive('/report') ? 'page' : undefined}
                >
                  {t('navigation.report')}
                </Link>
                <Link
                  to="/comparison"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] flex items-center ${
                    isActive('/comparison')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-current={isActive('/comparison') ? 'page' : undefined}
                >
                  {t('navigation.comparison')}
                </Link>
                <button
                  onClick={() => navigate('/privacy')}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] flex items-center"
                  title={t('navigation.privacy')}
                  aria-label={t('navigation.privacy')}
                >
                  <span aria-hidden="true">🔒</span> <span className="hidden lg:inline ml-1">{t('navigation.privacy')}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] flex items-center"
                  aria-label={t('navigation.logout')}
                >
                  {t('navigation.logout')}
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <span className="text-2xl">✕</span>
                ) : (
                  <span className="text-2xl">☰</span>
                )}
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-2">
                <Link
                  to="/patients"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-base font-medium rounded-md mx-2 my-1 min-h-[44px] flex items-center transition-colors ${
                    isActive('/patients')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-current={isActive('/patients') ? 'page' : undefined}
                >
                  {t('navigation.patients')}
                </Link>
                <Link
                  to="/questionnaires"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-base font-medium rounded-md mx-2 my-1 min-h-[44px] flex items-center transition-colors ${
                    isActive('/questionnaires')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-current={isActive('/questionnaires') ? 'page' : undefined}
                >
                  {t('navigation.questionnaires')}
                </Link>
                <Link
                  to="/report"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-base font-medium rounded-md mx-2 my-1 min-h-[44px] flex items-center transition-colors ${
                    isActive('/report')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-current={isActive('/report') ? 'page' : undefined}
                >
                  {t('navigation.report')}
                </Link>
                <Link
                  to="/comparison"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-base font-medium rounded-md mx-2 my-1 min-h-[44px] flex items-center transition-colors ${
                    isActive('/comparison')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-current={isActive('/comparison') ? 'page' : undefined}
                >
                  {t('navigation.comparison')}
                </Link>
                <button
                  onClick={() => {
                    navigate('/privacy');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mx-2 my-1 min-h-[44px] flex items-center transition-colors"
                  aria-label={t('navigation.privacy')}
                >
                  <span aria-hidden="true">🔒</span> <span className="ml-1">{t('navigation.privacy')}</span>
                </button>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mx-2 my-1 min-h-[44px] flex items-center transition-colors"
                  aria-label={t('navigation.logout')}
                >
                  {t('navigation.logout')}
                </button>
              </div>
            )}
          </nav>
        </header>
      )}
      <main id="main-content" role="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
};

