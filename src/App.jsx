import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { Castle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

// Robust Lazy Loading with Auto-Reload on Chunk Failure
const lazyRetry = (componentImport, name) => {
  return lazy(async () => {
    const pageHasAlreadyForceReloaded = window.sessionStorage.getItem(
      `force-reload-${name}`
    );

    try {
      const component = await componentImport();
      window.sessionStorage.removeItem(`force-reload-${name}`);
      return component;
    } catch (error) {
      if (!pageHasAlreadyForceReloaded) {
        // First failure: flag and reload
        window.sessionStorage.setItem(`force-reload-${name}`, "true");
        console.warn(`Chunk load failed for ${name}, forcing reload...`);
        window.location.reload();
        return { default: () => null };
      }

      // Second failure: actually an error (e.g. offline)
      console.error(`Chunk load failed twice for ${name}:`, error);
      throw error;
    }
  });
};

const Landing = lazyRetry(() => import('./pages/Landing'), 'Landing')
const Login = lazyRetry(() => import('./pages/Login'), 'Login')
const CustomerMenu = lazyRetry(() => import('./pages/CustomerMenu'), 'CustomerMenu')
const AdminDashboard = lazyRetry(() => import('./pages/AdminDashboard'), 'AdminDashboard')
const DishDetails = lazyRetry(() => import('./pages/DishDetails'), 'DishDetails')
const CartPage = lazyRetry(() => import('./pages/CartPage'), 'CartPage')
const PaymentPage = lazyRetry(() => import('./pages/PaymentPage'), 'PaymentPage')

const Loader = () => (
  <div className="min-h-screen bg-[#EDE8D0] flex flex-col items-center justify-center gap-4">
    <Castle className="w-10 h-10 text-[#B8860B] animate-spin" />
    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#B8860B]">Deccan Catering</span>
  </div>
)

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/menu" element={<PageWrapper><CustomerMenu /></PageWrapper>} />
        <Route path="/menu/:id" element={<PageWrapper><DishDetails /></PageWrapper>} />
        <Route path="/cart" element={<PageWrapper><CartPage /></PageWrapper>} />
        <Route path="/payment" element={<PageWrapper><PaymentPage /></PageWrapper>} />
        <Route path="/admin-dashboard" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="app-container overflow-x-hidden">
          <Suspense fallback={<Loader />}>
            <AnimatedRoutes />
          </Suspense>
        </div>
      </Router>
    </CartProvider>
  )
}

export default App
