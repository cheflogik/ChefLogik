// ChefLogik Icon Library — all SVG icons exported to window.Icons
const _Ic = ({ children, size = 16, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, display: 'inline-block' }}>
    {children}
  </svg>
);

window.Icons = {
  Home: ({ size }) => <_Ic size={size}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></_Ic>,
  Receipt: ({ size }) => <_Ic size={size}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="13" y2="15"/></_Ic>,
  ChefHat: ({ size }) => <_Ic size={size}><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></_Ic>,
  Grid: ({ size }) => <_Ic size={size}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></_Ic>,
  Calendar: ({ size }) => <_Ic size={size}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></_Ic>,
  CalendarStar: ({ size }) => <_Ic size={size}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 14l.5 1.5H14l-1.2.9.4 1.6L12 17l-1.2 1 .4-1.6L10 15.5h1.5z"/></_Ic>,
  BookOpen: ({ size }) => <_Ic size={size}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></_Ic>,
  Box: ({ size }) => <_Ic size={size}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></_Ic>,
  Users: ({ size }) => <_Ic size={size}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></_Ic>,
  Heart: ({ size }) => <_Ic size={size}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></_Ic>,
  BarChart: ({ size }) => <_Ic size={size}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></_Ic>,
  Bell: ({ size }) => <_Ic size={size}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></_Ic>,
  Search: ({ size }) => <_Ic size={size}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></_Ic>,
  ChevronDown: ({ size }) => <_Ic size={size}><polyline points="6 9 12 15 18 9"/></_Ic>,
  ChevronRight: ({ size }) => <_Ic size={size}><polyline points="9 18 15 12 9 6"/></_Ic>,
  Plus: ({ size }) => <_Ic size={size}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></_Ic>,
  X: ({ size }) => <_Ic size={size}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></_Ic>,
  Settings: ({ size }) => <_Ic size={size}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93L17.66 6.34A7 7 0 0 0 12 5a7 7 0 0 0-5.66 1.34L4.93 4.93A9 9 0 0 1 12 3a9 9 0 0 1 7.07 1.93z"/></_Ic>,
  LogOut: ({ size }) => <_Ic size={size}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></_Ic>,
  AlertTriangle: ({ size }) => <_Ic size={size}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></_Ic>,
  Clock: ({ size }) => <_Ic size={size}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></_Ic>,
  Check: ({ size }) => <_Ic size={size}><polyline points="20 6 9 17 4 12"/></_Ic>,
  CheckCircle: ({ size }) => <_Ic size={size}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></_Ic>,
  Star: ({ size }) => <_Ic size={size}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></_Ic>,
  Filter: ({ size }) => <_Ic size={size}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></_Ic>,
  Phone: ({ size }) => <_Ic size={size}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></_Ic>,
  Mail: ({ size }) => <_Ic size={size}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></_Ic>,
  Download: ({ size }) => <_Ic size={size}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></_Ic>,
  Edit: ({ size }) => <_Ic size={size}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></_Ic>,
  Trash: ({ size }) => <_Ic size={size}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></_Ic>,
  MoreHorizontal: ({ size }) => <_Ic size={size}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></_Ic>,
  ArrowRight: ({ size }) => <_Ic size={size}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></_Ic>,
  Building: ({ size }) => <_Ic size={size}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></_Ic>,
  Wifi: ({ size }) => <_Ic size={size}><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M10.54 16.1a6 6 0 0 1 2.92 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></_Ic>,
  TrendingUp: ({ size }) => <_Ic size={size}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></_Ic>,
  Package: ({ size }) => <_Ic size={size}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></_Ic>,
  Eye: ({ size }) => <_Ic size={size}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></_Ic>,
  MapPin: ({ size }) => <_Ic size={size}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></_Ic>,
  Shield: ({ size }) => <_Ic size={size}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></_Ic>,
  Activity: ({ size }) => <_Ic size={size}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></_Ic>,
  DollarSign: ({ size }) => <_Ic size={size}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></_Ic>,
  User: ({ size }) => <_Ic size={size}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></_Ic>,
  Lock: ({ size }) => <_Ic size={size}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></_Ic>,
  RefreshCw: ({ size }) => <_Ic size={size}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></_Ic>,
  Printer: ({ size }) => <_Ic size={size}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></_Ic>,
  Layers: ({ size }) => <_Ic size={size}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></_Ic>,
  Tag: ({ size }) => <_Ic size={size}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></_Ic>,
  Clipboard: ({ size }) => <_Ic size={size}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></_Ic>,
  PieChart: ({ size }) => <_Ic size={size}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></_Ic>,
  Globe: ({ size }) => <_Ic size={size}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></_Ic>,
  Zap: ({ size }) => <_Ic size={size}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></_Ic>,
};
