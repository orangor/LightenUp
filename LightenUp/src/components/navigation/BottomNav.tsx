import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';
import { NAV_ITEMS, BRAND, type NavItem } from '../../config/navigation';

// Icon components
const Icons = {
  Home: (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  Workflow: (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  Settings: (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  )
};

const getIcon = (path: string) => {
  if (path === '/') return Icons.Home;
  if (path.startsWith('/workflow')) return Icons.Workflow;
  if (path.startsWith('/settings')) return Icons.Settings;
  return Icons.Home;
};

// 判断当前路径是否匹配某个导航项或其子项（递归）
const matchesItemOrChildren = (currentPath: string, item: NavItem): boolean => {
  const normalize = (p: string) => p.replace(/\/+$/, '') || '/';
  const cp = normalize(currentPath);
  const ip = normalize(item.path);

  if (ip === '/') {
    if (cp === '/') return true;
  } else {
    if (cp === ip || cp.startsWith(ip + '/')) return true;
  }

  if (Array.isArray(item.children) && item.children.length > 0) {
    return item.children.some((child) => {
      const childPath = normalize(child.path);
      if (childPath === '/') {
        if (cp === '/') return true;
      } else {
        if (cp === childPath || cp.startsWith(childPath + '/')) return true;
      }
      return matchesItemOrChildren(cp, child);
    });
  }
  return false;
};

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleNavigation = (path: string) => {
    navigate(path, { replace: true });
    setDrawerOpen(false);
  };

  React.useEffect(() => {
    // 路由变化时自动关闭抽屉
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav className="top-nav">
        <div className="nav-inner">
          <div className="brand" onClick={() => handleNavigation('/')}>{BRAND?.logo && <span className="nav-icon" style={{marginRight: 6}}>{BRAND.logo}</span>}{BRAND?.name || 'App'}</div>
          <div className="nav-items">
            {NAV_ITEMS.map((item: NavItem) => {
              const isActive = matchesItemOrChildren(location.pathname, item);
              const hasChildren = Array.isArray(item.children) && item.children.length > 0;
              return (
                <div
                  key={item.path}
                  className={`nav-item ${isActive ? 'active' : ''} ${hasChildren ? 'has-children' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                  tabIndex={0}
                  role="button"
                >
                  {item.icon && <span className="nav-icon">{item.icon}</span>}
                  <span className="nav-text">{item.text}</span>
                  {hasChildren && (
                    <div className="submenu" onClick={(e) => e.stopPropagation()}>
                      {item.children!.map((child: NavItem) => {
                        const childIsActive = matchesItemOrChildren(location.pathname, child);
                        return (
                          <div
                            key={child.path}
                            className={`submenu-item ${childIsActive ? 'active' : ''}`}
                            onClick={() => handleNavigation(child.path)}
                          >
                            {child.icon && <span className="nav-icon" style={{marginRight: 6}}>{child.icon}</span>}
                            {child.text}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* 移动端汉堡按钮（在 CSS 中控制显示隐藏）*/}
          <button
            className={`hamburger ${drawerOpen ? 'open' : ''}`}
            aria-label={drawerOpen ? '关闭导航' : '打开导航'}
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <span className="bar top"></span>
            <span className="bar middle"></span>
            <span className="bar bottom"></span>
          </button>
        </div>
      </nav>

      {/* 底部导航栏（移动端显示） */}
      <nav className="bottom-nav-bar">
        {NAV_ITEMS.map((item: NavItem) => {
          const isActive = matchesItemOrChildren(location.pathname, item);
          const Icon = getIcon(item.path);
          return (
            <div
              key={item.path}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavigation(item.path)}
              role="button"
              tabIndex={0}
            >
              <div className="icon-container">
                <Icon width={24} height={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="nav-text">{item.text}</span>
            </div>
          );
        })}
      </nav>

      {/* 通过 Portal 渲染到 body，避免被其他层级遮挡 */}
      {drawerOpen && createPortal(
        <div className="drawer-overlay" role="presentation" onClick={() => setDrawerOpen(false)} />,
        document.body
      )}

      {createPortal(
        <div id="mobile-drawer" className={`mobile-drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
          <div className="drawer-content">
            {NAV_ITEMS.map((item: NavItem) => {
              const isActive = matchesItemOrChildren(location.pathname, item);
              const hasChildren = Array.isArray(item.children) && item.children.length > 0;
              return (
                <div key={item.path}>
                  <div
                    className={`drawer-item ${isActive ? 'active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.icon && <span className="nav-icon" style={{marginRight: 8}}>{item.icon}</span>}
                    <span>{item.text}</span>
                  </div>
                  {hasChildren && (
                    <div className="drawer-children">
                      {item.children!.map((child: NavItem) => {
                        const childIsActive = matchesItemOrChildren(location.pathname, child);
                        return (
                          <div
                            key={child.path}
                            className={`drawer-subitem ${childIsActive ? 'active' : ''}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleNavigation(child.path)}
                          >
                            {child.icon && <span className="nav-icon" style={{marginRight: 6}}>{child.icon}</span>}
                            <span>{child.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default BottomNav;