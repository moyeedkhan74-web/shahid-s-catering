import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { Castle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

// Lazy Loading
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const CustomerMenu = lazy(() => import('./pages/CustomerMenu'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const DishDetails = lazy(() => import('./pages/DishDetails'))
const CartPage = lazy(() => import('./pages/CartPage'))
const PaymentPage = lazy(() => import('./pages/PaymentPage'))

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
