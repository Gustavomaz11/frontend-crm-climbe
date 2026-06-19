import { useState, type ReactNode } from 'react';
import svgPathsTheme from '../../imports/svg-24pw80vll6';
import { useTheme } from '../context/ThemeContext';
import logo from '../../imports/Logo-vetorizada-escuro.svg';
import logoBranca from '../../imports/Logo-vetorizada-claro.svg';
import barrasClimbe from '../../imports/Barras-climbe.svg';

type SidebarPage = 'home' | 'contratos' | 'climbe' | 'permissoes' | 'empresas' | 'configuracoes';

interface SidebarItem {
  id: SidebarPage;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: SidebarPage) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems: SidebarItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: (
        <svg className="size-[18px]" viewBox="0 0 18 18" fill="none">
          <path d="M3 9L9 3L15 9M5 7V15H7V11H11V15H13V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'contratos',
      label: 'Contratos',
      icon: (
        <svg className="size-[18px]" viewBox="0 0 18 18" fill="none">
          <rect x="4" y="3" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <line x1="6" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="6" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  const operationalItems: SidebarItem[] = [
    {
      id: 'climbe',
      label: 'Agenda',
      icon: (
        <svg className="size-[18px]" viewBox="0 0 18 18" fill="none">
          <rect x="3" y="4" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <line x1="6" y1="2" x2="6" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="3" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: 'permissoes',
      label: 'Permissões',
      icon: (
        <svg className="size-[18px]" viewBox="0 0 18 18" fill="none">
          <rect x="4" y="7" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 7V5C6 3.34315 7.34315 2 9 2C10.6569 2 12 3.34315 12 5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="11" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'empresas',
      label: 'Empresas',
      icon: (
        <svg className="size-[18px]" viewBox="0 0 18 18" fill="none">
          <rect x="3" y="5" width="12" height="11" stroke="currentColor" strokeWidth="1.5" />
          <line x1="3" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" />
          <line x1="3" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.5" />
          <line x1="9" y1="5" x2="9" y2="16" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 2L9 5L12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: (
        <svg className="size-[18px]" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 2V3M9 15V16M16 9H15M3 9H2M13.5 4.5L12.8 5.2M5.2 12.8L4.5 13.5M13.5 13.5L12.8 12.8M5.2 5.2L4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile top icon only */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className={`h-12 w-12 rounded-[16px] flex items-center justify-center border shadow-sm transition-colors duration-300 ${
            theme === 'dark' ? 'bg-[#1e1f1d] border-[#2d2e2c]' : 'bg-white border-[#e2e7ed]'
          }`}
          aria-label="Menu"
        >
          <img src={barrasClimbe} alt="Barras Climbe" className="w-[20px] h-[20px] object-contain" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar Container with Padding */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'hidden lg:block w-[90px]' : 'block lg:block w-[calc(100vw-2rem)] lg:w-[260px]'}`}>
        {/* Sidebar */}
        <aside
          className={`fixed top-4 left-4 h-[calc(100vh-2rem)] rounded-[16px] ${
            theme === 'dark' ? 'bg-[#1e1f1d]' : 'bg-white'
          } border ${
            theme === 'dark' ? 'border-[#2d2e2c]' : 'border-[#e2e7ed]'
          } shadow-sm z-50 transition-all duration-300 ${isCollapsed ? 'w-[90px]' : 'w-[calc(100vw-2rem)] lg:w-[260px]'}`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`border-b transition-all ${isCollapsed ? 'p-2' : 'p-6'} ${theme === 'dark' ? 'border-[#2d2e2c]' : 'border-[#e2e7ed]'}`}>
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`mx-auto block transition-all duration-300 ${isCollapsed ? 'h-[28px] w-[28px]' : 'h-[49px] w-[142px]'}`}
                aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
              >
                <img
                  src={isCollapsed ? barrasClimbe : theme === 'dark' ? logoBranca : logo}
                  alt={isCollapsed ? 'Barras Climbe' : 'Logo'}
                  className={`mx-auto object-contain ${isCollapsed ? 'w-[20px] h-[20px]' : 'w-full h-full'}`}
                />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 py-4 overflow-y-auto sidebar-scroll">
              {/* Main Menu */}
              <div className="px-3 mb-6">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center gap-0 px-0' : 'gap-3 px-3'} py-2.5 rounded-lg mb-1 transition-all ${
                      currentPage === item.id
                        ? 'bg-[#d4f1ed] text-[#0abfa3]'
                        : theme === 'dark'
                        ? 'text-[#b8bcc4] hover:bg-[#2d2e2c]'
                        : 'text-[#5c6370] hover:bg-[#f4f6f8]'
                    }`}
                  >
                    <div className="shrink-0">{item.icon}</div>
                    {!isCollapsed && (
                      <span className="font-['DM_Sans:Medium',sans-serif] text-[13px]">
                        {item.label}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Operational Section */}
              <div className="px-3">
                {!isCollapsed && (
                  <p className={`px-3 mb-2 font-['DM_Sans:Medium',sans-serif] text-[10px] ${
                    theme === 'dark' ? 'text-[#6b6d6f]' : 'text-[#9ea5b0]'
                  } uppercase tracking-wider`}>
                    Operacional
                  </p>
                )}
                {operationalItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center gap-0 px-0' : 'gap-3 px-3'} py-2.5 rounded-lg mb-1 transition-all ${
                      currentPage === item.id
                        ? 'bg-[#d4f1ed] text-[#0abfa3]'
                        : theme === 'dark'
                        ? 'text-[#b8bcc4] hover:bg-[#2d2e2c]'
                        : 'text-[#5c6370] hover:bg-[#f4f6f8]'
                    }`}
                  >
                    <div className="shrink-0">{item.icon}</div>
                    {!isCollapsed && (
                      <span className="font-['DM_Sans:Medium',sans-serif] text-[13px]">
                        {item.label}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </nav>

            {/* Theme Toggle */}
            <div className={`transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'} border-t ${theme === 'dark' ? 'border-[#2d2e2c]' : 'border-[#e2e7ed]'}`}>
              <div className={`${
                theme === 'dark' ? 'bg-[#2d2e2c]' : 'bg-[#ededed]'
              } rounded-[6px] p-[3px] flex ${isCollapsed ? 'justify-center gap-[4px]' : 'gap-[6px]'}`}>
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex items-center justify-center ${isCollapsed ? 'gap-0 px-2 py-2' : 'gap-2 px-3 py-[5px]'} rounded-[6px] transition-all ${
                    theme === 'light'
                      ? 'bg-[#c7e5e3]'
                      : 'hover:bg-[#d0d0d0]'
                  }`}
                >
                  <svg className={`${isCollapsed ? 'size-[12px]' : 'size-[15px]'}`} viewBox="0 0 12.4333 12.4333" fill="none">
                    <path d={svgPathsTheme.p36758a00} fill={theme === 'light' ? 'black' : '#9e9e9e'} />
                  </svg>
                  {!isCollapsed && (
                    <span className={`font-['Inter:Semi_Bold',sans-serif] font-semibold text-[9.5px] ${
                      theme === 'light' ? 'text-black' : 'text-[#9e9e9e]'
                    }`}>
                      Light
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex items-center justify-center ${isCollapsed ? 'gap-0 px-2 py-2' : 'gap-2 px-3 py-[5px]'} rounded-[6px] transition-all ${
                    theme === 'dark'
                      ? 'bg-[#c7e5e3]'
                      : 'hover:bg-[#d0d0d0]'
                  }`}
                >
                  <svg className={`${isCollapsed ? 'size-[12px]' : 'size-[15px]'}`} viewBox="0 0 12.4333 12.4333" fill="none">
                    <path d={svgPathsTheme.p146f7580} fill={theme === 'dark' ? 'black' : '#9e9e9e'} />
                  </svg>
                  {!isCollapsed && (
                    <span className={`font-['Inter:Semi_Bold',sans-serif] font-semibold text-[9.5px] ${
                      theme === 'dark' ? 'text-black' : 'text-[#9e9e9e]'
                    }`}>
                      Dark
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

    </>
  );
}