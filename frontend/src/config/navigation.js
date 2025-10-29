import {
  LayoutDashboard,
  Wallet,
  Car,
  Settings,
  Smartphone,
  History,
  Store,
  Users,
  Wrench,
  ShieldCheck,
  Building,
  FileText,
  ShoppingCart
} from 'lucide-react';

export const roleNavigation = {
  owner: [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      path: '/owner/dashboard', 
      icon: LayoutDashboard,
      visibleForRoles: ['owner']
    },
    { 
      key: 'wallet', 
      label: 'Wallet', 
      path: '/owner/wallet', 
      icon: Wallet,
      visibleForRoles: ['owner']
    },
    { 
      key: 'vehicles', 
      label: 'Vehicles', 
      path: '/owner/vehicles', 
      icon: Car,
      visibleForRoles: ['owner']
    },
    { 
      key: 'devices', 
      label: 'Devices', 
      path: '/owner/devices', 
      icon: Smartphone,
      visibleForRoles: ['owner']
    },
    { 
      key: 'history', 
      label: 'History', 
      path: '/owner/history', 
      icon: History,
      visibleForRoles: ['owner']
    },
    { 
      key: 'marketplace', 
      label: 'Marketplace', 
      path: '/owner/marketplace/browse', 
      icon: Store,
      visibleForRoles: ['owner']
    }
  ],
  buyer: [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      path: '/buyer/dashboard', 
      icon: LayoutDashboard,
      visibleForRoles: ['buyer']
    },
    { 
      key: 'marketplace', 
      label: 'Marketplace', 
      path: '/buyer/marketplace', 
      icon: Store,
      visibleForRoles: ['buyer']
    },
    { 
      key: 'my-vehicles', 
      label: 'My Vehicles', 
      path: '/buyer/my-vehicles', 
      icon: Car,
      visibleForRoles: ['buyer']
    }
  ],
  admin: [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      path: '/admin/dashboard', 
      icon: LayoutDashboard,
      visibleForRoles: ['admin']
    },
    { 
      key: 'marketplace', 
      label: 'Marketplace', 
      path: '/marketplace/browse', 
      icon: Store,
      visibleForRoles: ['admin']
    },
    { 
      key: 'installs', 
      label: 'Install Requests', 
      path: '/admin/installs', 
      icon: Settings,
      visibleForRoles: ['admin']
    },
    { 
      key: 'history', 
      label: 'History', 
      path: '/admin/history', 
      icon: History,
      visibleForRoles: ['admin']
    },
    { 
      key: 'users', 
      label: 'Users', 
      path: '/admin/users', 
      icon: Users,
      visibleForRoles: ['admin']
    }
  ],
  service: [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      path: '/sp/dashboard', 
      icon: LayoutDashboard,
      visibleForRoles: ['service']
    },
    { 
      key: 'installs', 
      label: 'Assigned Installs', 
      path: '/sp/installs', 
      icon: Wrench,
      visibleForRoles: ['service']
    },
    { 
      key: 'devices', 
      label: 'Devices', 
      path: '/sp/devices', 
      icon: Smartphone,
      visibleForRoles: ['service']
    }
  ],
  insurance: [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      path: '/insurance/dashboard', 
      icon: LayoutDashboard,
      visibleForRoles: ['insurance']
    },
    { 
      key: 'vehicles', 
      label: 'Vehicle Claims', 
      path: '/insurance/vehicles', 
      icon: Car,
      visibleForRoles: ['insurance']
    },
    { 
      key: 'history', 
      label: 'Claims History', 
      path: '/insurance/history', 
      icon: History,
      visibleForRoles: ['insurance']
    }
  ],
  government: [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      path: '/government/dashboard', 
      icon: LayoutDashboard,
      visibleForRoles: ['government']
    },
    { 
      key: 'vehicles', 
      label: 'Vehicle Registry', 
      path: '/government/vehicles', 
      icon: Car,
      visibleForRoles: ['government']
    },
    { 
      key: 'history', 
      label: 'Audit History', 
      path: '/government/history', 
      icon: History,
      visibleForRoles: ['government']
    }
  ]
};

export const getNavigationForRole = (role) => {
  return roleNavigation[role] || [];
};

export const getRoleBasePath = (role) => {
  const rolePaths = {
    admin: '/admin',
    owner: '/owner', 
    service: '/sp',
    buyer: '/buyer',
    insurance: '/insurance',
    government: '/government'
  };
  return rolePaths[role] || '/dashboard';
};
