import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Car, Users, BarChart3, Plus, Trash2, Edit, X, ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth, authAxios } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AutoVistaLogo from '@/components/AutoVistaLogo';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const PIE_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899'];

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCar, setShowAddCar] = useState(false);
  const [editCar, setEditCar] = useState(null);
  const [carForm, setCarForm] = useState({
    name: '', brand: '', price_min: '', price_max: '', mileage: '', fuel_type: 'Petrol',
    transmission: 'Manual', engine: '', body_type: 'SUV', seating_capacity: '5', safety_rating: '4.0', image_url: ''
  });

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/dashboard'); return; }
    fetchData();
  }, [user, tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'stats') {
        const { data } = await authAxios.get(`${API_URL}/api/admin/stats`);
        setStats(data);
      } else if (tab === 'users') {
        const { data } = await authAxios.get(`${API_URL}/api/admin/users`);
        setUsers(data);
      } else if (tab === 'cars') {
        const { data } = await authAxios.get(`${API_URL}/api/cars`);
        setCars(data);
      }
    } catch (e) { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await authAxios.delete(`${API_URL}/api/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted');
    } catch (e) { toast.error('Failed to delete user'); }
  };

  const deleteCar = async (carId) => {
    if (!window.confirm('Delete this car?')) return;
    try {
      await authAxios.delete(`${API_URL}/api/admin/cars/${carId}`);
      setCars(prev => prev.filter(c => c.id !== carId));
      toast.success('Car deleted');
    } catch (e) { toast.error('Failed to delete car'); }
  };

  const handleCarSubmit = async () => {
    try {
      const payload = {
        ...carForm,
        price_min: parseInt(carForm.price_min),
        price_max: parseInt(carForm.price_max),
        seating_capacity: parseInt(carForm.seating_capacity),
        safety_rating: parseFloat(carForm.safety_rating)
      };
      if (editCar) {
        await authAxios.put(`${API_URL}/api/admin/cars/${editCar.id}`, payload);
        toast.success('Car updated');
      } else {
        await authAxios.post(`${API_URL}/api/admin/cars`, payload);
        toast.success('Car created');
      }
      setShowAddCar(false);
      setEditCar(null);
      setCarForm({ name: '', brand: '', price_min: '', price_max: '', mileage: '', fuel_type: 'Petrol', transmission: 'Manual', engine: '', body_type: 'SUV', seating_capacity: '5', safety_rating: '4.0', image_url: '' });
      fetchData();
    } catch (e) { toast.error('Failed to save car'); }
  };

  const startEditCar = (car) => {
    setEditCar(car);
    setCarForm({
      name: car.name, brand: car.brand, price_min: String(car.price_min), price_max: String(car.price_max),
      mileage: car.mileage, fuel_type: car.fuel_type, transmission: car.transmission, engine: car.engine,
      body_type: car.body_type, seating_capacity: String(car.seating_capacity), safety_rating: String(car.safety_rating), image_url: car.image_url
    });
    setShowAddCar(true);
  };

  const tabs = [
    { id: 'stats', label: 'Analytics', icon: BarChart3 },
    { id: 'cars', label: 'Cars', icon: Car },
    { id: 'users', label: 'Users', icon: Users },
  ];

  return (
    <motion.div className="light min-h-screen" style={{ background: '#F4F5F7' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} data-testid="admin-back">
              <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-600" />
              <span className="font-semibold text-gray-900">Admin Panel</span>
            </div>
          </div>
          <AutoVistaLogo className="h-7" dark={false} />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          {tabs.map(t => (
            <motion.div key={t.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant={tab === t.id ? 'default' : 'outline'} onClick={() => setTab(t.id)}
                className={tab === t.id ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : ''}
                data-testid={`admin-tab-${t.id}`}>
                <t.icon className="w-4 h-4 mr-2" /> {t.label}
              </Button>
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Stats Tab */}
          {tab === 'stats' && stats && (
            <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { label: 'Total Cars', value: stats.total_cars, icon: Car, color: 'cyan' },
                  { label: 'Total Users', value: stats.total_users, icon: Users, color: 'blue' },
                  { label: 'Recommendations', value: stats.total_recommendations, icon: TrendingUp, color: 'purple' },
                ].map((s, i) => (
                  <motion.div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{s.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                      </div>
                      <s.icon className={`w-10 h-10 text-${s.color}-500 opacity-50`} />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-semibold mb-4">Cars by Brand</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.brand_distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="brand" fontSize={11} stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {stats.brand_distribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-semibold mb-4">Fuel Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.fuel_distribution} dataKey="count" nameKey="fuel" cx="50%" cy="50%" outerRadius={80} label={({ fuel, count }) => `${fuel}: ${count}`}>
                          {stats.fuel_distribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Cars Tab */}
          {tab === 'cars' && (
            <motion.div key="cars" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>Manage Cars ({cars.length})</h2>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white" onClick={() => { setEditCar(null); setShowAddCar(true); }} data-testid="add-car-btn">
                  <Plus className="w-4 h-4 mr-2" /> Add Car
                </Button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Car</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Brand</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Price</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Fuel</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cars.map((car, i) => (
                        <motion.tr key={car.id} className="border-b hover:bg-gray-50 transition-colors"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={car.image_url} alt={car.name} className="w-12 h-8 rounded object-cover" />
                              <span className="font-medium text-gray-900">{car.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{car.brand}</td>
                          <td className="px-4 py-3 text-cyan-600 font-medium">₹{(car.price_min / 100000).toFixed(2)}L</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-cyan-50 text-cyan-700">{car.fuel_type}</span></td>
                          <td className="px-4 py-3 text-gray-600">{car.body_type}</td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="icon" onClick={() => startEditCar(car)} data-testid={`edit-car-${car.id}`}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteCar(car.id)} data-testid={`delete-car-${car.id}`}><Trash2 className="w-4 h-4" /></Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>Manage Users ({users.length})</h2>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Joined</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <motion.tr key={u.id} className="border-b hover:bg-gray-50"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                        <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-gray-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3 text-right">
                          {u.role !== 'admin' && (
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteUser(u.id)} data-testid={`delete-user-${u.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Car Dialog */}
        <Dialog open={showAddCar} onOpenChange={setShowAddCar}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editCar ? 'Edit Car' : 'Add New Car'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div><Label>Name</Label><Input value={carForm.name} onChange={e => setCarForm({ ...carForm, name: e.target.value })} className="mt-1" data-testid="car-form-name" /></div>
              <div><Label>Brand</Label><Input value={carForm.brand} onChange={e => setCarForm({ ...carForm, brand: e.target.value })} className="mt-1" data-testid="car-form-brand" /></div>
              <div><Label>Min Price (₹)</Label><Input type="number" value={carForm.price_min} onChange={e => setCarForm({ ...carForm, price_min: e.target.value })} className="mt-1" /></div>
              <div><Label>Max Price (₹)</Label><Input type="number" value={carForm.price_max} onChange={e => setCarForm({ ...carForm, price_max: e.target.value })} className="mt-1" /></div>
              <div><Label>Mileage</Label><Input value={carForm.mileage} onChange={e => setCarForm({ ...carForm, mileage: e.target.value })} className="mt-1" /></div>
              <div><Label>Engine</Label><Input value={carForm.engine} onChange={e => setCarForm({ ...carForm, engine: e.target.value })} className="mt-1" /></div>
              <div><Label>Fuel Type</Label>
                <Select value={carForm.fuel_type} onValueChange={v => setCarForm({ ...carForm, fuel_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Petrol', 'Diesel', 'Electric', 'CNG'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Transmission</Label>
                <Select value={carForm.transmission} onValueChange={v => setCarForm({ ...carForm, transmission: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Manual', 'Automatic'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Body Type</Label>
                <Select value={carForm.body_type} onValueChange={v => setCarForm({ ...carForm, body_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['SUV', 'Sedan', 'Hatchback', 'MUV'].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Seating</Label><Input type="number" value={carForm.seating_capacity} onChange={e => setCarForm({ ...carForm, seating_capacity: e.target.value })} className="mt-1" /></div>
              <div><Label>Safety Rating</Label><Input type="number" step="0.1" value={carForm.safety_rating} onChange={e => setCarForm({ ...carForm, safety_rating: e.target.value })} className="mt-1" /></div>
              <div><Label>Image URL</Label><Input value={carForm.image_url} onChange={e => setCarForm({ ...carForm, image_url: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddCar(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white" onClick={handleCarSubmit} data-testid="car-form-submit">
                {editCar ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}
