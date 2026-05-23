// ===== CALIA — MAIN ENTRY POINT =====
import './styles/index.css';
import './styles/components.css';
import './styles/login.css';

import { auth } from './services/auth.js';
import { storage } from './services/storage.js';
import { renderLogin, seedFrancoAccount } from './pages/login.js';
import { renderNavigation } from './components/navigation.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderScanner } from './pages/scanner.js';
import { renderPlan } from './pages/plan.js';
import { renderHistory } from './pages/history.js';
import { renderProfile } from './pages/profile.js';
import { PAGES } from './utils/constants.js';

class CaliaApp {
  constructor() {
    this.currentPage = PAGES.DASHBOARD;
    this.pageContainer = document.getElementById('page-container');
    this.pageParams = {};
    this.init();
  }

  async init() {
    // Check for PWA updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.update();
        }
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    // Ensure database tables exist
    fetch('/api/db-init').catch(() => {});

    // Migrate any legacy local-only accounts to Turso
    await auth.migrateLegacyLocalAccounts();

    // Ensure Franco's account is seeded
    await seedFrancoAccount();

    if (!auth.isLoggedIn()) {
      this.showLogin();
    } else {
      storage.initUserDefaults();
      const settings = storage.getSettings();
      document.body.classList.toggle('light-theme', !!settings.lightTheme);
      this.navigateTo(PAGES.DASHBOARD);
    }
  }

  showLogin() {
    renderLogin(this.pageContainer, {
      onLogin: () => {
        document.getElementById('bottom-nav').style.display = 'flex';
        const settings = storage.getSettings();
        document.body.classList.toggle('light-theme', !!settings.lightTheme);
        this.navigateTo(PAGES.DASHBOARD);
      }
    });
  }

  navigateTo = (page, params = {}) => {
    if (!auth.isLoggedIn()) {
      this.showLogin();
      return;
    }

    this.currentPage = page;
    this.pageParams = params;
    this.render();
    // Scroll to top
    this.pageContainer.scrollTo(0, 0);
  }

  render() {
    renderNavigation(this.currentPage, this.navigateTo, this.pageParams);

    const opts = {
      navigateTo: this.navigateTo,
      onLogout: () => {
        auth.logout();
        this.showLogin();
      },
      ...this.pageParams,
    };

    switch (this.currentPage) {
      case PAGES.DASHBOARD:
        renderDashboard(this.pageContainer, opts);
        break;
      case PAGES.SCANNER:
        renderScanner(this.pageContainer, opts);
        break;
      case PAGES.PLAN:
        renderPlan(this.pageContainer, opts);
        break;
      case PAGES.HISTORY:
        renderHistory(this.pageContainer, opts);
        break;
      case PAGES.PROFILE:
        renderProfile(this.pageContainer, opts);
        break;
      default:
        renderDashboard(this.pageContainer, opts);
    }
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  new CaliaApp();
});
