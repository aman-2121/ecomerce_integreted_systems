import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  isLoading: boolean;
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
    const loadCart = async () => {
      console.log('CartContext: Loading cart for user:', user?.id || 'guest');
      setIsInitialized(false);
      try {
        const cartKey = getCartKey(user?.id);
        const savedCart = localStorage.getItem(cartKey);
        console.log('CartContext: Raw localStorage data for key', cartKey, ':', savedCart);

        if (savedCart && savedCart !== 'undefined' && savedCart !== 'null') {
          const parsedCart = JSON.parse(savedCart);
          console.log('CartContext: Parsed minimal cart items:', parsedCart);

          if (Array.isArray(parsedCart)) {
            // Validate minimal cart items (only productId and quantity)
            const validMinimalItems = parsedCart.filter(item => {
              const isValid = item &&
                typeof item.productId === 'number' &&
                typeof item.quantity === 'number' &&
                item.quantity > 0;

              if (!isValid) {
                console.warn('CartContext: Invalid minimal cart item found:', item);
              }
              return isValid;
            });

            console.log('CartContext: Valid minimal cart items:', validMinimalItems);

            // Fetch fresh product data for each item
            const validItems: CartItem[] = [];
            for (const item of validMinimalItems) {
              try {
                const response = await fetch(`http://localhost:5000/api/products/${item.productId}`);
                if (response.ok) {
                  const data = await response.json();
                  const product = data.product;
                  validItems.push({
                    id: `${product.id}-${Date.now()}`,
                    productId: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    quantity: item.quantity,
                    image: product.image,
                    stock: product.stock
                  });
                } else {
                  console.warn('CartContext: Failed to fetch product', item.productId, 'status:', response.status);
                }
              } catch (error) {
                console.warn('CartContext: Error fetching product', item.productId, ':', error);
              }
            }

            console.log('CartContext: Final cart items with fresh data:', validItems);
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
    };

    loadCart();
  }, [user]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isInitialized) {
      try {
        const cartKey = getCartKey(user?.id);
        // Save only productId and quantity to prevent stale data issues
        const minimalCart = items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));
        const cartData = JSON.stringify(minimalCart);
        localStorage.setItem(cartKey, cartData);
        console.log('CartContext: Saved minimal cart to localStorage for key', cartKey, ':', minimalCart);
      } catch (error) {
        console.error('CartContext: Error saving cart to localStorage:', error);
      }
    }
  }, [items, isInitialized, user]);

  const addToCart = useCallback((newItem: Omit<CartItem, 'id'>) => {
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
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const value: CartContextType = {
    items,
    isLoading: !isInitialized,
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
