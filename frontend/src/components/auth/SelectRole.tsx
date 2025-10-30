import React from 'react';
import { useAppSelector } from '../../hooks/redux';
import { useNavigate, useLocation } from 'react-router-dom';

const roleToLabel: Record<string, string> = {
  admin: 'Admin',
  owner: 'Owner',
  buyer: 'Buyer',
  service: 'Service Provider',
  insurance: 'Insurance',
  government: 'Government'
};

const roleToRoute = (role: string) => {
  switch (role) {
    case 'admin': return '/admin/dashboard';
    case 'owner': return '/owner/dashboard';
    case 'buyer': return '/buyer/dashboard';
    case 'service': return '/sp/dashboard';
    case 'insurance': return '/insurance/dashboard';
    case 'government': return '/government/dashboard';
    default: return '/dashboard';
  }
};

const SelectRole: React.FC = () => {
  const { user } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const roles: string[] = (user as any)?.roles || (user?.role ? [user.role] : []);

  const handleSelect = (role: string) => {
    try {
      window.localStorage.setItem('selectedRole', role);
    } catch (_e) { void 0; }
    navigate(roleToRoute(role), { replace: true, state: { from: location } });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h1 className="text-xl font-semibold mb-1">Select a role</h1>
        <p className="text-sm text-slate-400 mb-5">Your account has multiple roles. Choose the space you want to work in.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => handleSelect(role)}
              className="text-left rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-900 transition p-4"
            >
              <div className="text-slate-200 font-medium">{roleToLabel[role] || role}</div>
              <div className="text-xs text-slate-400 mt-1">Go to {roleToLabel[role] || role} dashboard</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
