import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar.jsx';
import Navbar from '../components/common/Navbar.jsx';

export default function MainLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar abierto={menuAbierto} onNavegar={() => setMenuAbierto(false)} />
      {menuAbierto && (
        <div
          className="no-print fixed inset-0 z-30 bg-espresso-950/50 lg:hidden"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onToggleMenu={() => setMenuAbierto((v) => !v)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
