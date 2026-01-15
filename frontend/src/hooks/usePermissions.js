import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api/v1';

/**
 * Hook to manage user permissions
 * Fetches permissions from backend and provides methods to check them
 */
export const usePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Try to get from localStorage first (set during login)
        const storedPermissions = localStorage.getItem('permissions');
        const storedMenuItems = localStorage.getItem('menu_items');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (storedPermissions && storedMenuItems) {
          setPermissions(JSON.parse(storedPermissions));
          setMenuItems(JSON.parse(storedMenuItems));
          setRole(user.role);
          setLoading(false);
          return;
        }

        // Fetch user's permissions from backend as fallback
        const response = await axios.get(`${API_URL}/roles/my-permissions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setPermissions(response.data.permissions || []);
        setMenuItems(response.data.menu_visibility || []);
        setRole(response.data.role);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        setPermissions([]);
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission to check (e.g., "client.create")
   * @returns {boolean}
   */
  const hasPermission = useCallback((permission) => {
    return permissions.includes(permission);
  }, [permissions]);

  /**
   * Check if user has ANY of the specified permissions
   * @param {string[]} permissionList - List of permissions to check
   * @returns {boolean}
   */
  const hasAnyPermission = useCallback((permissionList) => {
    return permissionList.some(perm => permissions.includes(perm));
  }, [permissions]);

  /**
   * Check if user has ALL of the specified permissions
   * @param {string[]} permissionList - List of permissions to check
   * @returns {boolean}
   */
  const hasAllPermissions = useCallback((permissionList) => {
    return permissionList.every(perm => permissions.includes(perm));
  }, [permissions]);

  /**
   * Check if a menu item should be visible
   * @param {string} menuItem - Menu item identifier
   * @returns {boolean}
   */
  const isMenuVisible = useCallback((menuItem) => {
    return menuItems.includes(menuItem);
  }, [menuItems]);

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  const isAdmin = useCallback(() => {
    return role === 'admin';
  }, [role]);

  return {
    permissions,
    menuItems,
    role,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isMenuVisible,
    isAdmin
  };
};

/**
 * Simple permission check for conditionally rendering components
 * Usage: <PermissionGate permission="client.create"><Button>Create</Button></PermissionGate>
 */
export const PermissionGate = ({ permission, permissions, children, fallback = null }) => {
  const { hasPermission, hasAnyPermission } = usePermissions();

  if (Array.isArray(permission)) {
    return hasAnyPermission(permission) ? children : fallback;
  }

  return hasPermission(permission) ? children : fallback;
};

export default usePermissions;
