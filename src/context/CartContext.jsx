import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Load initial cart from localStorage
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('deccan_cart');
    return savedCart ? JSON.parse(savedCart) : {};
  });
  
  const [menuCache, setMenuCache] = useState([]);
  const [lastFetch, setLastFetch] = useState(0);
  const [cartJustUpdated, setCartJustUpdated] = useState(false);
  const cartUpdateTimer = useRef(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('deccan_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((item, quantity = 1) => {
    setCartItems(prev => ({
      ...prev,
      [item.id]: {
        ...item,
        quantity: (prev[item.id]?.quantity || 0) + quantity
      }
    }));
    // Signal that cart was just updated (for highlight animation)
    if (cartUpdateTimer.current) clearTimeout(cartUpdateTimer.current);
    setCartJustUpdated(true);
    cartUpdateTimer.current = setTimeout(() => setCartJustUpdated(false), 3000);
  }, []);

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCartEntirely(id);
      return;
    }
    setCartItems(prev => ({
      ...prev,
      [id]: { ...prev[id], quantity }
    }));
  };

  const removeFromCart = (id) => {
    setCartItems(prev => {
      const newQty = (prev[id]?.quantity || 0) - 1;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [id]: { ...prev[id], quantity: newQty }
      };
    });
  };

  const removeFromCartEntirely = (id) => {
    setCartItems(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const clearCart = () => setCartItems({});

  const cartTotal = useMemo(() => {
    return Object.values(cartItems).reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return Object.values(cartItems).reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      updateQuantity,
      removeFromCart, 
      removeFromCartEntirely,
      clearCart, 
      cartTotal, 
      cartCount,
      menuCache,
      setMenuCache,
      lastFetch,
      setLastFetch,
      cartJustUpdated,
      setCartJustUpdated
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
