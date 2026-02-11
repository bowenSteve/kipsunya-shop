import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import API_BASE_URL from '../config';

const CartContext = createContext();

const initialCartState = {
    items: [],
    totalItems: 0,
    subtotal: 0,
    totalAmount: 0,
    loading: false,
    error: null,
    lastUpdated: null
};

const CART_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_CART: 'SET_CART',
    ADD_ITEM: 'ADD_ITEM',
    UPDATE_ITEM: 'UPDATE_ITEM',
    REMOVE_ITEM: 'REMOVE_ITEM',
    CLEAR_CART: 'CLEAR_CART',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR'
};

function cartReducer(state, action) {
    switch (action.type) {
        case CART_ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload,
                error: action.payload ? null : state.error
            };

        case CART_ACTIONS.SET_CART:
            return {
                ...state,
                items: action.payload.items || [],
                totalItems: action.payload.total_items || 0,
                subtotal: action.payload.subtotal || 0,
                totalAmount: action.payload.total_amount || 0,
                loading: false,
                error: null,
                lastUpdated: Date.now()
            };

        case CART_ACTIONS.ADD_ITEM:
            const existingItemIndex = state.items.findIndex(
                item => item.product_id === action.payload.product_id
            );

            let newItems;
            if (existingItemIndex >= 0) {
                // Update existing item
                newItems = [...state.items];
                newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: newItems[existingItemIndex].quantity + action.payload.quantity
                };
            } else {
                // Add new item
                newItems = [...state.items, action.payload];
            }

            const newTotalItems = newItems.reduce((total, item) => total + item.quantity, 0);
            const newSubtotal = newItems.reduce((total, item) => total + (item.unit_price * item.quantity), 0);

            return {
                ...state,
                items: newItems,
                totalItems: newTotalItems,
                subtotal: newSubtotal,
                totalAmount: newSubtotal * 1.16, // Including 16% VAT
                lastUpdated: Date.now()
            };

        case CART_ACTIONS.UPDATE_ITEM:
            const updatedItems = state.items.map(item =>
                item.id === action.payload.id
                    ? { ...item, ...action.payload }
                    : item
            );

            const updatedTotalItems = updatedItems.reduce((total, item) => total + item.quantity, 0);
            const updatedSubtotal = updatedItems.reduce((total, item) => total + (item.unit_price * item.quantity), 0);

            return {
                ...state,
                items: updatedItems,
                totalItems: updatedTotalItems,
                subtotal: updatedSubtotal,
                totalAmount: updatedSubtotal * 1.16,
                lastUpdated: Date.now()
            };

        case CART_ACTIONS.REMOVE_ITEM:
            const filteredItems = state.items.filter(item => item.id !== action.payload);
            const filteredTotalItems = filteredItems.reduce((total, item) => total + item.quantity, 0);
            const filteredSubtotal = filteredItems.reduce((total, item) => total + (item.unit_price * item.quantity), 0);

            return {
                ...state,
                items: filteredItems,
                totalItems: filteredTotalItems,
                subtotal: filteredSubtotal,
                totalAmount: filteredSubtotal * 1.16,
                lastUpdated: Date.now()
            };

        case CART_ACTIONS.CLEAR_CART:
            return {
                ...state,
                items: [],
                totalItems: 0,
                subtotal: 0,
                totalAmount: 0,
                lastUpdated: Date.now()
            };

        case CART_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false
            };

        case CART_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };

        default:
            return state;
    }
}

export function CartProvider({ children }) {
    const [state, dispatch] = useReducer(cartReducer, initialCartState);
    const { isAuthenticated, getAuthToken } = useUser();

    // Fetch cart data
    const fetchCart = useCallback(async () => {
        try {
            dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

            const headers = {};
            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart/`, {
                headers
            });

            if (response.ok) {
                const data = await response.json();
                dispatch({ type: CART_ACTIONS.SET_CART, payload: data });
            } else {
                throw new Error('Failed to fetch cart');
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
            dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
        } finally {
            dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
        }
    }, [getAuthToken]);

    // Add item to cart
    const addToCart = async (productId, quantity = 1, options = {}) => {
        try {
            dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
            dispatch({ type: CART_ACTIONS.CLEAR_ERROR });

            const headers = {
                'Content-Type': 'application/json'
            };

            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart/add/`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    product_id: productId,
                    quantity: quantity
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Update cart with new data
                if (data.cart_summary) {
                    dispatch({ type: CART_ACTIONS.SET_CART, payload: data.cart_summary });
                }

                // Show success message if provided in options
                if (options.onSuccess) {
                    options.onSuccess(data.message || 'Item added to cart');
                }

                return { success: true, message: data.message };
            } else {
                const errorMessage = data.error || 'Failed to add item to cart';
                dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });

                if (options.onError) {
                    options.onError(errorMessage);
                }

                return { success: false, error: errorMessage };
            }
        } catch (error) {
            const errorMessage = error.message || 'Network error occurred';
            console.error('Error adding to cart:', error);
            dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });

            if (options.onError) {
                options.onError(errorMessage);
            }

            return { success: false, error: errorMessage };
        } finally {
            dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
        }
    };

    // Update item quantity
    const updateItemQuantity = async (itemId, newQuantity) => {
        try {
            dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

            const headers = {
                'Content-Type': 'application/json'
            };

            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}/`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ quantity: newQuantity })
            });

            const data = await response.json();

            if (response.ok) {
                dispatch({
                    type: CART_ACTIONS.UPDATE_ITEM,
                    payload: { id: itemId, quantity: newQuantity }
                });

                if (data.cart_summary) {
                    dispatch({ type: CART_ACTIONS.SET_CART, payload: data.cart_summary });
                }

                return { success: true, message: data.message };
            } else {
                throw new Error(data.error || 'Failed to update quantity');
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
            return { success: false, error: error.message };
        } finally {
            dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
        }
    };

    // Remove item from cart
    const removeFromCart = async (itemId) => {
        try {
            dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

            const headers = {};
            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}/remove/`, {
                method: 'DELETE',
                headers
            });

            const data = await response.json();

            if (response.ok) {
                dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: itemId });

                if (data.cart_summary) {
                    dispatch({ type: CART_ACTIONS.SET_CART, payload: data.cart_summary });
                }

                return { success: true, message: data.message };
            } else {
                throw new Error(data.error || 'Failed to remove item');
            }
        } catch (error) {
            console.error('Error removing item:', error);
            dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
            return { success: false, error: error.message };
        } finally {
            dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
        }
    };

    // Clear entire cart
    const clearCart = async () => {
        try {
            dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

            const headers = {};
            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart/clear/`, {
                method: 'POST',
                headers
            });

            const data = await response.json();

            if (response.ok) {
                dispatch({ type: CART_ACTIONS.CLEAR_CART });
                return { success: true, message: data.message };
            } else {
                throw new Error(data.error || 'Failed to clear cart');
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
            return { success: false, error: error.message };
        } finally {
            dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
        }
    };

    // Get cart item count for a specific product
    const getProductQuantityInCart = (productId) => {
        const item = state.items.find(item => item.product_id === productId);
        return item ? item.quantity : 0;
    };

    // Check if product is in cart
    const isInCart = (productId) => {
        return state.items.some(item => item.product_id === productId);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount || 0);
    };

    // Calculate totals
    const calculateTotals = () => {
        const subtotal = state.subtotal;
        const taxAmount = subtotal * 0.16; // 16% VAT
        const shippingFee = 0; // Free shipping
        const total = subtotal + taxAmount + shippingFee;

        return {
            subtotal,
            taxAmount,
            shippingFee,
            total
        };
    };

    // Clear error
    const clearError = () => {
        dispatch({ type: CART_ACTIONS.CLEAR_ERROR });
    };

    // Load cart on mount and when authentication changes
    useEffect(() => {
        fetchCart();
    }, [isAuthenticated, fetchCart]);

    const value = {
        // State
        ...state,

        // Actions
        fetchCart,
        addToCart,
        updateItemQuantity,
        removeFromCart,
        clearCart,
        clearError,

        // Utilities
        getProductQuantityInCart,
        isInCart,
        formatCurrency,
        calculateTotals
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }

    return context;
}