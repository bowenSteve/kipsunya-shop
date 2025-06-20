// src/contexts/UserContext.js - Updated to not auto-login after registration
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Backend API base URL
const API_BASE_URL = '/api';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  userRole: null
};

const USER_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS'
};

function userReducer(state, action) {
  switch (action.type) {
    case USER_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case USER_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        userRole: action.payload.user.role || 'customer',
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case USER_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null
      };
    case USER_ACTIONS.TOKEN_REFRESH:
      return {
        ...state,
        token: action.payload.token
      };
    case USER_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        userRole: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case USER_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        userRole: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case USER_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case USER_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case USER_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}

// Helper function to decode JWT
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

// Helper function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

const UserContext = createContext();

export function UserProvider({ children }) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = localStorage.getItem('kipsunya_jwt_token');
        const refreshToken = localStorage.getItem('kipsunya_refresh_token');
        const savedUser = localStorage.getItem('kipsunya_user');
        
        if (token && savedUser) {
          // Check if token is expired
          if (isTokenExpired(token)) {
            // Try to refresh token
            if (refreshToken && !isTokenExpired(refreshToken)) {
              const refreshResult = await refreshAuthToken(refreshToken);
              if (refreshResult.success) {
                const userData = JSON.parse(savedUser);
                dispatch({
                  type: USER_ACTIONS.LOGIN_SUCCESS,
                  payload: { 
                    user: userData, 
                    token: refreshResult.token 
                  }
                });
                return;
              }
            }
            // If refresh fails, clear storage
            clearAuthStorage();
            dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false });
            return;
          }

          // Token is valid, validate with backend
          const response = await fetch(`${API_BASE_URL}/auth/verify/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = JSON.parse(savedUser);
            dispatch({
              type: USER_ACTIONS.LOGIN_SUCCESS,
              payload: { user: userData, token }
            });
          } else {
            clearAuthStorage();
            dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false });
          }
        } else {
          dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Session validation failed:', error);
        clearAuthStorage();
        dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false });
      }
    };

    checkExistingSession();
  }, []);

  // Clear authentication storage
  const clearAuthStorage = () => {
    localStorage.removeItem('kipsunya_jwt_token');
    localStorage.removeItem('kipsunya_refresh_token');
    localStorage.removeItem('kipsunya_user');
  };

  // Refresh token function
  const refreshAuthToken = async (refreshToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh: refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.accessToken || data.access;
        localStorage.setItem('kipsunya_jwt_token', newAccessToken);
        
        if (data.refreshToken || data.refresh) {
          localStorage.setItem('kipsunya_refresh_token', data.refreshToken || data.refresh);
        }
        
        dispatch({
          type: USER_ACTIONS.TOKEN_REFRESH,
          payload: { token: newAccessToken }
        });
        
        return { success: true, token: newAccessToken };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      return { success: false };
    }
  };

  // Login function
  const login = async (credentials) => {
    dispatch({ type: USER_ACTIONS.LOGIN_START });
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store tokens and user data
        localStorage.setItem('kipsunya_jwt_token', data.accessToken);
        localStorage.setItem('kipsunya_refresh_token', data.refreshToken);
        localStorage.setItem('kipsunya_user', JSON.stringify(data.user));
        
        dispatch({
          type: USER_ACTIONS.LOGIN_SUCCESS,
          payload: { 
            user: data.user, 
            token: data.accessToken 
          }
        });
        
        return { 
          success: true, 
          user: data.user
        };
      } else {
        dispatch({
          type: USER_ACTIONS.LOGIN_FAILURE,
          payload: data.message || 'Login failed'
        });
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      dispatch({
        type: USER_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function - Updated to NOT auto-login
  const register = async (userData) => {
    dispatch({ type: USER_ACTIONS.LOGIN_START });
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Don't store tokens or login automatically
        // Just dispatch success without authentication
        dispatch({
          type: USER_ACTIONS.REGISTER_SUCCESS
        });
        
        return { 
          success: true, 
          message: 'Registration successful. Please log in to continue.'
        };
      } else {
        dispatch({
          type: USER_ACTIONS.LOGIN_FAILURE,
          payload: data.message || 'Registration failed'
        });
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = 'Registration failed. Please try again.';
      dispatch({
        type: USER_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const token = localStorage.getItem('kipsunya_jwt_token');
      const refreshToken = localStorage.getItem('kipsunya_refresh_token');
      
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      clearAuthStorage();
      dispatch({ type: USER_ACTIONS.LOGOUT });
    }
  };

  // Update user profile
  const updateUser = async (updates) => {
    try {
      const token = localStorage.getItem('kipsunya_jwt_token');
      const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({
          type: USER_ACTIONS.UPDATE_USER,
          payload: data.user
        });
        
        localStorage.setItem('kipsunya_user', JSON.stringify(data.user));
        
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Update failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: USER_ACTIONS.CLEAR_ERROR });
  };

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('kipsunya_jwt_token');
  };

  // API call helper with auto token refresh
  const apiCall = async (url, options = {}) => {
    let token = getAuthToken();
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      const refreshToken = localStorage.getItem('kipsunya_refresh_token');
      if (refreshToken) {
        const refreshResult = await refreshAuthToken(refreshToken);
        if (refreshResult.success) {
          token = refreshResult.token;
        } else {
          logout();
          throw new Error('Session expired');
        }
      } else {
        logout();
        throw new Error('Session expired');
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    return response;
  };

  // Role checking functions
  const hasRole = (role) => {
    return state.userRole === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(state.userRole);
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    getAuthToken,
    apiCall,
    hasRole,
    hasAnyRole,
    isTokenExpired: () => isTokenExpired(state.token)
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  return context;
}