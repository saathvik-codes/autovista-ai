import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Car, Heart, History, BarChart3, LogOut, TrendingUp, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, authAxios } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;
import AutoVistaLogo from '@/components/AutoVistaLogo';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Car, label: 'Browse Cars', path: '/cars' },
  { icon: Heart, label: 'Saved Cars', section: 'saved' },
  { icon: History, label: 'Recommendations', section: 'recs' },
  { icon: BarChart3, label: 'Analytics', section: 'analytics' },
  { icon: Shield, label: 'Admin Panel', path: '/admin', adminOnly: true },
];

const brandData = [
  { name: 'Maruti', cars: 3 }, { name: 'Hyundai', cars: 3 },
  { name: 'Tata', cars: 3 }, { name: 'Mahindra', cars: 3 },
  { name: 'Honda', cars: 1 }, { name: 'Toyota', cars: 1 }, { name: 'Kia', cars: 1 },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('saved');
  const [savedCars, setSavedCars] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [savedRes, recRes] = await Promise.all([
        authAxios.get(`${API_URL}/api/cars/saved`),
        authAxios.get(`${API_URL}/api/recommendations/history`)
      ]);
      setSavedCars(savedRes.data);
      setRecommendations(recRes.data);
    } catch (e) {
      console.error('Dashboard data error:', e);
    } finally { setLoading(false); }
  };

  const removeSavedCar = async (carId) => {
    try {
      await authAxios.delete(`${API_URL}/api/cars/save/${carId}`);
      setSavedCars(prev => prev.filter(c => c.id !== carId));
      toast.success('Car removed from saved list');
    } catch (e) { toast.error('Failed to remove car'); }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <motion.div className="light min-h-screen flex" style={{ background: '#F4F5F7' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>

      {/* Sidebar */}
      <motion.aside
        className="bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-screen sticky top-0"
        animate={{ width: sidebarOpen ? 260 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AutoVistaLogo className="h-8" dark={false} />
              </motion.div>
            )}
          </AnimatePresence>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} data-testid="sidebar-toggle"
            className="hover:bg-gray-100">
            {sidebarOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.filter(item => !item.adminOnly || user?.role === 'admin').map((item, idx) => {
            const isActive = item.section === activeSection;
            return (
              <motion.div key={idx} whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-11 ${isActive
                    ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen && 'justify-center px-0'}`}
                  onClick={() => item.path ? navigate(item.path) : setActiveSection(item.section)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-cyan-600' : ''}`} />
                  <AnimatePresence>
                    {sidebarOpen && <motion.span className="ml-3 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{item.label}</motion.span>}
                  </AnimatePresence>
                </Button>
              </motion.div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center mb-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div className="ml-3 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="font-medium text-sm text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="ghost" onClick={handleLogout} data-testid="logout-button"
              className={`w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 ${!sidebarOpen && 'justify-center px-0'}`}>
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3 text-sm">Logout</span>}
            </Button>
          </motion.div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-10">
          <motion.h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} data-testid="dashboard-title">
            Dashboard
          </motion.h1>
          <p className="text-gray-500 mt-1 text-sm">Welcome back, {user?.name}!</p>
        </div>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Saved Cars', value: savedCars.length, icon: Heart, gradient: 'from-cyan-50 to-cyan-100', border: 'border-cyan-200', textColor: 'text-cyan-700', iconColor: 'text-cyan-500' },
              { label: 'Recommendations', value: recommendations.length, icon: Zap, gradient: 'from-blue-50 to-blue-100', border: 'border-blue-200', textColor: 'text-blue-700', iconColor: 'text-blue-500' },
              { label: 'Cars Viewed', value: 24, icon: TrendingUp, gradient: 'from-purple-50 to-purple-100', border: 'border-purple-200', textColor: 'text-purple-700', iconColor: 'text-purple-500' },
            ].map((stat, idx) => (
              <motion.div key={idx}
                className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-6 border ${stat.border}`}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4, shadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${stat.textColor} mb-1`}>{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`w-12 h-12 ${stat.iconColor} opacity-60`} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Content based on active section */}
          <AnimatePresence mode="wait">
            {activeSection === 'saved' && (
              <motion.div key="saved" className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 className="text-2xl font-bold mb-6 text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Saved Cars</h2>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse rounded-xl border border-gray-200 overflow-hidden">
                        <div className="aspect-video bg-gray-100" />
                        <div className="p-4 space-y-2"><div className="h-5 bg-gray-100 rounded w-2/3" /><div className="h-4 bg-gray-100 rounded w-1/3" /></div>
                      </div>
                    ))}
                  </div>
                ) : savedCars.length === 0 ? (
                  <div className="text-center py-16">
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <Car className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-gray-500 mb-4 text-lg">No saved cars yet</p>
                    <p className="text-gray-400 mb-6 text-sm">Start browsing to save your favorite cars</p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white" onClick={() => navigate('/cars')} data-testid="browse-cars-button">
                        Browse Cars
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedCars.map((car, idx) => (
                      <motion.div key={car.id}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -4 }}
                        onClick={() => navigate(`/car/${car.id}`)} data-testid={`saved-car-${car.id}`}>
                        <div className="aspect-video bg-gray-100 overflow-hidden">
                          <img src={car.image_url} alt={car.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{car.name}</h3>
                              <p className="text-sm text-gray-500">{car.brand}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50"
                              onClick={(e) => { e.stopPropagation(); removeSavedCar(car.id); }}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-cyan-600 font-bold mt-2">₹{(car.price_min / 100000).toFixed(2)}L</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeSection === 'recs' && (
              <motion.div key="recs" className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 className="text-2xl font-bold mb-6 text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Recommendation History</h2>
                {recommendations.length === 0 ? (
                  <div className="text-center py-16">
                    <History className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No recommendations yet</p>
                    <p className="text-gray-400 text-sm mt-2">Get AI-powered car recommendations from the search page</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec, idx) => (
                      <motion.div key={idx} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                        data-testid={`recommendation-${idx}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">Budget: ₹{(rec.budget / 100000).toFixed(1)}L</p>
                            <div className="flex gap-2 mt-1">
                              {rec.fuel_type && <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full">{rec.fuel_type}</span>}
                              {rec.body_type && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{rec.body_type}</span>}
                              {rec.usage && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{rec.usage}</span>}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{new Date(rec.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-3 line-clamp-3">{rec.recommendations}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeSection === 'analytics' && (
              <motion.div key="analytics" className="space-y-6"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Cars by Brand</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={brandData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
                        <Bar dataKey="cars" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                        <defs>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
