import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, HashRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ToastProvider } from './components/ui/Toast';
import { ConfigProvider } from './context/ConfigContext';
import About from './pages/About';
import Calculator from './pages/Calculator';
import Contact from './pages/Contact';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Projects from './pages/Projects';
import Services from './pages/Services';

// The admin panel is code-split so ordinary visitors never download it.
const Admin = lazy(() => import('./pages/Admin'));

// Hash routing is useful on hosts without SPA rewrites (e.g. GitHub Pages): set VITE_ROUTER=hash.
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter;

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only z-[100] rounded bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <ToastProvider>
        <Router basename={import.meta.env.VITE_ROUTER === 'hash' ? undefined : import.meta.env.BASE_URL}>
          <ScrollManager />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="services" element={<Services />} />
              <Route path="projects" element={<Projects />} />
              <Route path="calculator" element={<Calculator />} />
              <Route path="contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route
              path="admin/*"
              element={
                <Suspense fallback={<div className="grid min-h-screen place-items-center text-slate-500">Loading admin…</div>}>
                  <Admin />
                </Suspense>
              }
            />
          </Routes>
        </Router>
      </ToastProvider>
    </ConfigProvider>
  );
}
