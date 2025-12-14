import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface CartItem {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Helper function to get the cart key based on user ID
const getCartKey = (userId?: number): string => {
  return userId ? `cart_${userId}` : 'cart_guest';
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage when user changes
  useEffect(() => {
    console.log('CartContext: Loading cart for user:', user?.id || 'guest');
    setIsInitialized(false);
    try {
      const cartKey = getCartKey(user?.id);
      const savedCart = localStorage.getItem(cartKey);
      console.log('CartContext: Raw localStorage data for key', cartKey, ':', savedCart);

      if (savedCart && savedCart !== 'undefined' && savedCart !== 'null') {
        const parsedCart = JSON.parse(savedCart);
        console.log('CartContext: Parsed cart items:', parsedCart);

        if (Array.isArray(parsedCart)) {
          // Validate cart items
          const validItems = parsedCart.filter(item => {
            const isValid = item &&
              typeof item.id === 'string' &&
              typeof item.productId === 'number' &&
              typeof item.name === 'string' &&
              typeof item.price === 'number' &&
              typeof item.quantity === 'number' &&
              typeof item.image === 'string' &&
              typeof item.stock === 'number';

            if (!isValid) {
              console.warn('CartContext: Invalid cart item found:', item);
            }
            return isValid;
          });

          console.log('CartContext: Valid cart items:', validItems);
          setItems(validItems);
        } else {
          console.warn('CartContext: Cart data is not an array, resetting to empty');
          setItems([]);
        }
      } else {
        console.log('CartContext: No valid cart data found in localStorage for key:', cartKey);
        setItems([]);
      }
    } catch (error) {
      console.error('CartContext: Error loading cart from localStorage:', error);
      setItems([]);
    } finally {
      setIsInitialized(true);
      console.log('CartContext: Cart initialization complete for user:', user?.id || 'guest');
    }
  }, [user]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isInitialized) {
      try {
        const cartKey = getCartKey(user?.id);
        const cartData = JSON.stringify(items);
        localStorage.setItem(cartKey, cartData);
        console.log('CartContext: Saved cart to localStorage for key', cartKey, ':', items);
      } catch (error) {
        console.error('CartContext: Error saving cart to localStorage:', error);
      }
    }
  }, [items, isInitialized, user]);

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    console.log('CartContext: addToCart called with item:', newItem);

    setItems(currentItems => {
      console.log('CartContext: Current cart items before add:', currentItems);

      const existingItem = currentItems.find(item =>
        item.productId === newItem.productId
      );

      let newItems;
      if (existingItem) {
        console.log('CartContext: Updating existing item quantity');
        // Update quantity if item already exists
        newItems = currentItems.map(item =>
          item.productId === newItem.productId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      } else {
        console.log('CartContext: Adding new item to cart');
        // Add new item with generated ID
        const itemWithId: CartItem = {
          ...newItem,
          id: `${newItem.productId}-${Date.now()}`
        };
        newItems = [...currentItems, itemWithId];
      }

      console.log('CartContext: New cart items after add:', newItems);
      return newItems;
    });
  };

  const removeFromCart = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
