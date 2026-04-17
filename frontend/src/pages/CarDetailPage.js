import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Calculator, TrendingUp, Fuel, Users, Cog, Gauge, Star, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useAuth, authAxios } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;
import AutoVistaLogo from '@/components/AutoVistaLogo';

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const inc = value / 40;
    const timer = setInterval(() => {
      start += inc;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(Math.floor(start));
    }, 25);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{displayed.toLocaleString()}{suffix}</span>;
}

export default function CarDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(9.5);
  const [tenure, setTenure] = useState(60);
  const [emiData, setEmiData] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchCar(); }, [id]);

  const fetchCar = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/cars/${id}`);
      setCar(data);
      setLoanAmount(Math.floor(data.price_min * 0.8));
      fetchPricePrediction(data);
    } catch (e) { console.error(e); toast.error('Failed to load car'); }
    finally { setLoading(false); }
  };

  const fetchPricePrediction = async (c) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/predict-price`, {
        brand: c.brand, model: c.name, year: 2024, km_driven: 0, fuel_type: c.fuel_type, transmission: c.transmission
      });
      setPriceData(data);
    } catch (e) { console.error(e); }
  };

  const calculateEMI = async () => {
    try {
      const { data } = await axios.post(`${API_URL}/api/emi`, {
        loan_amount: loanAmount, interest_rate: interestRate, tenure_months: tenure
      });
      setEmiData(data);
      toast.success('EMI calculated successfully!');
    } catch (e) { toast.error('Failed to calculate EMI'); }
  };

  const saveCar = async () => {
    if (!user) { toast.error('Please login to save cars'); navigate('/login'); return; }
    try {
      await authAxios.post(`${API_URL}/api/cars/save`, { car_id: id });
      setSaved(true);
      toast.success('Car saved!');
    } catch (e) { toast.error('Failed to save car'); }
  };

  if (loading) {
    return (
      <div className="light min-h-screen flex items-center justify-center" style={{ background: '#F4F5F7' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
          className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="light min-h-screen flex items-center justify-center" style={{ background: '#F4F5F7' }}>
        <div className="text-center"><p className="text-xl text-gray-600 mb-4">Car not found</p>
          <Button onClick={() => navigate('/cars')}>Back to Listings</Button></div>
      </div>
    );
  }

  const specs = [
    { icon: Fuel, label: 'Fuel Type', value: car.fuel_type, color: 'text-cyan-600' },
    { icon: Cog, label: 'Transmission', value: car.transmission, color: 'text-blue-600' },
    { icon: Gauge, label: 'Mileage', value: car.mileage, color: 'text-green-600' },
    { icon: Users, label: 'Seating', value: `${car.seating_capacity} Seats`, color: 'text-purple-600' },
  ];

  return (
    <motion.div className="light min-h-screen" style={{ background: '#F4F5F7' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>

      <nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/cars')} data-testid="back-button">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <AutoVistaLogo className="h-7 hidden md:block" dark={false} />
          </div>
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" onClick={saveCar} data-testid="save-car-button"
                className={saved ? 'border-red-500 text-red-500' : ''}>
                <Heart className={`w-4 h-4 mr-2 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
                {saved ? 'Saved' : 'Save'}
              </Button>
            </motion.div>
            <Button variant="outline"><Share2 className="w-4 h-4 mr-2" /> Share</Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Image */}
        <motion.div className="rounded-3xl overflow-hidden mb-10 bg-gradient-to-br from-gray-100 to-gray-200 aspect-[21/9] shadow-xl"
          initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }}>
          <img src={car.image_url} alt={car.name} className="w-full h-full object-cover" />
        </motion.div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="car-name">
                  {car.brand} {car.name}
                </h1>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                    <span className="text-sm font-medium text-yellow-700">{car.safety_rating} Safety</span>
                  </div>
                  <span className="text-sm">{car.body_type}</span>
                  <span className="text-sm">{car.engine}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Starting at</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent" data-testid="car-price">
                  ₹<AnimatedNumber value={Math.round(car.price_min / 100000 * 100) / 100} suffix="L" />
                </p>
                <p className="text-sm text-gray-400">- ₹{(car.price_max / 100000).toFixed(2)}L</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {specs.map((spec, idx) => (
                <motion.div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + idx * 0.1 }}
                  whileHover={{ y: -4 }}>
                  <spec.icon className={`w-6 h-6 ${spec.color} mb-2`} />
                  <p className="text-xs text-gray-500">{spec.label}</p>
                  <p className="font-semibold text-gray-900">{spec.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <h3 className="font-semibold text-lg mb-4 text-gray-900">Quick Specifications</h3>
            <div className="space-y-3 text-sm">
              {[
                ['Engine', car.engine],
                ['Body Type', car.body_type],
                ['Safety Rating', `${car.safety_rating}/5`],
                ['Seating', `${car.seating_capacity} Persons`],
                ['Mileage', car.mileage],
              ].map(([label, value], i) => (
                <motion.div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="emi" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white rounded-xl h-12">
            <TabsTrigger value="emi" data-testid="tab-emi" className="rounded-lg"><Calculator className="w-4 h-4 mr-2" /> EMI Calculator</TabsTrigger>
            <TabsTrigger value="price" data-testid="tab-price" className="rounded-lg"><TrendingUp className="w-4 h-4 mr-2" /> Price Prediction</TabsTrigger>
          </TabsList>

          <TabsContent value="emi">
            <motion.div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-bold mb-6 text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>EMI Calculator</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div>
                    <Label className="text-gray-700">Loan Amount (₹)</Label>
                    <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="mt-2 focus:ring-2 focus:ring-cyan-500" data-testid="loan-amount-input" />
                  </div>
                  <div>
                    <Label className="text-gray-700">Interest Rate (%)</Label>
                    <Input type="number" step="0.1" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="mt-2 focus:ring-2 focus:ring-cyan-500" data-testid="interest-rate-input" />
                  </div>
                  <div>
                    <Label className="text-gray-700">Tenure (Months)</Label>
                    <Input type="number" value={tenure} onChange={(e) => setTenure(Number(e.target.value))}
                      className="mt-2 focus:ring-2 focus:ring-cyan-500" data-testid="tenure-input" />
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-5 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                      onClick={calculateEMI} data-testid="calculate-emi-button">
                      Calculate EMI
                    </Button>
                  </motion.div>
                </div>

                {emiData && (
                  <motion.div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">EMI Breakdown</h3>
                    <div className="space-y-4">
                      <div className="border-b border-cyan-200 pb-3">
                        <p className="text-sm text-gray-600">Monthly EMI</p>
                        <p className="text-3xl font-bold text-cyan-600" data-testid="emi-result">
                          ₹<AnimatedNumber value={Math.round(emiData.emi)} />
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-sm text-gray-600">Principal</span><span className="font-medium">₹{emiData.principal.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-gray-600">Total Interest</span><span className="font-medium text-orange-600">₹{Math.round(emiData.total_interest).toLocaleString()}</span></div>
                        <div className="flex justify-between border-t border-cyan-200 pt-2"><span className="font-semibold">Total Amount</span><span className="font-bold text-gray-900">₹{Math.round(emiData.total_amount).toLocaleString()}</span></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="price">
            <motion.div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-bold mb-6 text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Price Prediction</h2>
              {priceData && (
                <div>
                  <motion.div className="mb-6 p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-100"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-sm text-gray-600 mb-2">Current Estimated Value</p>
                    <p className="text-4xl font-bold text-cyan-600" data-testid="predicted-price">
                      ₹<AnimatedNumber value={Math.round(priceData.current_estimated_price / 100000 * 100) / 100} suffix="L" />
                    </p>
                  </motion.div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={priceData.future_predictions}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="year" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                        <Tooltip formatter={(v) => `₹${(v / 100000).toFixed(2)}L`}
                          contentStyle={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={3} fill="url(#colorPrice)" dot={{ fill: '#06b6d4', r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-gray-400 mt-4 text-center">
                    Depreciation rate: 12% annually. Based on market trends and vehicle condition.
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
