
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function MainLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'หน้าหลัก', icon: '🏠' },
    { path: '/products', label: 'สินค้า', icon: '📦' },
    { path: '/categories', label: 'หมวดหมู่', icon: '🏷️' },
    { path: '/stock', label: 'สต็อก', icon: '📊' },
    { path: '/search', label: 'ค้นหา', icon: '🔍' },
    { path: '/reports', label: 'รายงาน', icon: '📈' },
    { path: '/users', label: 'ผู้ใช้งาน', icon: '👥' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const renderNavItem = (item, mobile = false) => (
    <Link
      key={item.path}
      to={item.path}
      aria-current={isActive(item.path) ? 'page' : undefined}
      title={item.label}
      className={
        mobile
          ? `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
              isActive(item.path)
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-blue-600'
            }`
          : `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              isActive(item.path)
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`
      }
    >
      <span className={mobile ? 'text-xl leading-6' : 'text-lg'}>
        {item.icon}
      </span>

      <span
        className={
          mobile
            ? 'w-full truncate text-center leading-tight'
            : ''
        }
      >
        {item.label}
      </span>

      {mobile && isActive(item.path) && (
        <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-blue-600" />
      )}
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar: Desktop */}
      <aside className="hidden w-64 flex-shrink-0 bg-white shadow-md md:block">
        <div className="border-b p-6">
          <h1 className="text-xl font-bold text-blue-600">
            Retail Inventory
          </h1>
          <p className="text-xs text-gray-500">
            ระบบบริหารสินค้าคงคลัง
          </p>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => renderNavItem(item))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b bg-white px-4 py-4 shadow-sm sm:px-6">
          <div className="md:hidden">
            <h1 className="text-base font-bold text-blue-600">
              Retail Inventory
            </h1>
          </div>

          <div className="hidden text-sm text-gray-600 sm:block">
            ระบบบริหารสินค้าคงคลังสำหรับร้านค้าปลีก
          </div>

          <div className="ml-auto flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
              A
            </span>
            <span className="text-xs font-medium sm:text-sm">
              ผู้ดูแลระบบ
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6 sm:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation: Mobile */}
      <nav
        aria-label="เมนูหลักบนมือถือ"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur md:hidden"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex w-full items-stretch justify-around">
          {navItems.map((item) => (
            <div
              key={item.path}
              className="relative flex min-w-0 flex-1"
            >
              {renderNavItem(item, true)}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
