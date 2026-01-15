import React, { useState, useMemo } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, Megaphone, Building2,
  Truck, UserCircle, UserPlus, ClipboardList, Receipt,
  FileText, DollarSign, BarChart3, Settings, Menu, X, LogOut, Activity, Brain, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '../hooks/usePermissions';

const allSidebarItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', menuKey: 'dashboard', adminOnly: true },
  { path: '/vendor-dashboard', icon: Building2, label: 'Vendor Dashboard', menuKey: 'vendor-dashboard' },
  { path: '/client-servicing-dashboard', icon: BarChart3, label: 'Client Servicing Dashboard', menuKey: 'client-servicing-dashboard' },
  { path: '/driver-dashboard', icon: Truck, label: 'Driver Dashboard', menuKey: 'driver-dashboard' },
  { path: '/clients', icon: Users, label: 'Clients', menuKey: 'clients' },
  { path: '/projects', icon: Briefcase, label: 'Projects', menuKey: 'projects' },
  { path: '/campaigns', icon: Megaphone, label: 'Campaigns', menuKey: 'campaigns', excludeForRoles: ['vendorS','godown_manager'] },
  { path: '/vendors', icon: Building2, label: 'Vendors', menuKey: 'vendors' },
  { path: '/vehicles', icon: Truck, label: 'Vehicles', menuKey: 'vehicles' },
  { path: '/drivers', icon: UserCircle, label: 'Drivers', menuKey: 'drivers' },
  { path: '/promoters', icon: UserPlus, label: 'Promoters / Anchors', menuKey: 'promoters' },
  { path: '/promoter-activities', icon: Activity, label: 'Promoter Activities', menuKey: 'promoter-activities' },
  { path: '/operations', icon: ClipboardList, label: 'Operations', menuKey: 'operations' },
  { path: '/expenses', icon: Receipt, label: 'Expenses', menuKey: 'expenses' },
  { path: '/reports', icon: FileText, label: 'Reports', menuKey: 'reports' },
  { path: '/accounts', icon: DollarSign, label: 'Accounts & Payments', menuKey: 'accounts' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', menuKey: 'analytics' },
  { path: '/godown-inventory', icon: Package, label: 'Godown Inventory', menuKey: 'godown-inventory', requiredPermissions: ['admin', 'godown_manager'] },
  { path: '/ml-insights', icon: Brain, label: 'ML Insights', menuKey: 'ml-insights', adminOnly: true },
  { path: '/settings/user-registration', icon: UserPlus, label: 'New Registration', menuKey: 'user-registration', adminOnly: true },
  { path: '/settings', icon: Settings, label: 'Settings', menuKey: 'settings' },
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { isMenuVisible, loading } = usePermissions();

  // Filter sidebar items based on user's menu permissions
  const sidebarItems = useMemo(() => {
    if (loading) return [];
    
    console.log('🔍 Menu Visibility Debug:', {
      userRole: user.role,
      loading: loading,
      totalMenuItems: allSidebarItems.length,
      projectsVisible: isMenuVisible('projects'),
      allVisibleMenus: allSidebarItems.map(item => ({
        label: item.label,
        menuKey: item.menuKey,
        visible: item.adminOnly ? user.role === 'admin' : isMenuVisible(item.menuKey)
      }))
    });
    
    return allSidebarItems.filter(item => {
      // Check if role is excluded for this menu item
      if (item.excludeForRoles && item.excludeForRoles.includes(user.role)) {
        return false;
      }
      
      // Check if specific roles are required (HIGHEST PRIORITY)
      if (item.requiredPermissions) {
        const hasRequiredRole = item.requiredPermissions.includes(user.role);
        console.log(`Menu item "${item.label}": requiredPermissions=${JSON.stringify(item.requiredPermissions)}, userRole="${user.role}", visible=${hasRequiredRole}`);
        return hasRequiredRole;
      }
      
      // Admin-only items - show if user is admin, skip permission check
      if (item.adminOnly) {
        return user.role === 'admin';
      }
      
      // Permission-based items - check isMenuVisible
      return isMenuVisible(item.menuKey);
    });
  }, [isMenuVisible, loading, user.role]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          {sidebarOpen && (
            <a href="/"><h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              FleetOps
            </h1></a>
          )}
          <button
            data-testid="toggle-sidebar-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-140px)]">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                  {sidebarOpen && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-slate-200 p-3">
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Welcome back, {user.name} Ji</h2>
              <p className="text-sm text-slate-500 mt-0.5">{user.role} </p>
            </div>
          </div>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
