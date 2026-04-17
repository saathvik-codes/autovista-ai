import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Star, Fuel, Settings, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

const API_URL = process.env.REACT_APP_BACKEND_URL;
import AutoVistaLogo from '@/components/AutoVistaLogo';

function Skeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 animate-pulse">
      <div className="aspect-video bg-white/10" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-white/10 rounded w-2/3" />
        <div className="h-4 bg-white/10 rounded w-1/3" />
        <div className="h-8 bg-white/10 rounded w-1/2 mt-4" />
      </div>
    </div>
  );
}

export default function CarListingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    brands: [],
    fuelTypes: [],
    bodyTypes: [],
    priceRange: [300000, 5000000],
    sort: ''
  });

  useEffect(() => {
    const init = {
      ...filters,
      priceRange: [300000, parseInt(searchParams.get('max_price') || 5000000)]
    };
    if (searchParams.get('fuel_type')) init.fuelTypes = [searchParams.get('fuel_type')];
    setFilters(init);
    fetchCars(init);
  }, []);

  const fetchCars = async (f = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.brands.length > 0) params.append('brand', f.brands[0]);
      if (f.fuelTypes.length > 0) params.append('fuel_type', f.fuelTypes[0]);
      if (f.bodyTypes.length > 0) params.append('body_type', f.bodyTypes[0]);
      params.append('min_price', f.priceRange[0]);
      params.append('max_price', f.priceRange[1]);
      if (f.sort) params.append('sort', f.sort);
      const { data } = await axios.get(`${API_URL}/api/cars?${params.toString()}`);
      setCars(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleFilter = (key, value) => {
    const arr = filters[key];
    const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [value];
    const newFilters = { ...filters, [key]: newArr };
    setFilters(newFilters);
    fetchCars(newFilters);
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <Filter className="w-5 h-5 mr-2 text-cyan-400" />
        Filters
      </h2>

      <div>
        <h3 className="text-sm font-medium mb-3 text-gray-300">Brand</h3>
        <div className="space-y-2">
          {['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota', 'Kia'].map((brand) => (
            <label key={brand} className="flex items-center space-x-2 cursor-pointer group">
              <Checkbox
                checked={filters.brands.includes(brand)}
                onCheckedChange={() => toggleFilter('brands', brand)}
                data-testid={`filter-brand-${brand.toLowerCase().replace(/\s/g, '-')}`}
              />
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3 text-gray-300">Price Range</h3>
        <div className="mb-2 text-sm text-cyan-400 font-medium">
          ₹{(filters.priceRange[0] / 100000).toFixed(1)}L - ₹{(filters.priceRange[1] / 100000).toFixed(1)}L
        </div>
        <Slider
          value={filters.priceRange}
          onValueChange={(v) => setFilters({ ...filters, priceRange: v })}
          max={5000000} min={300000} step={100000}
          data-testid="price-range-slider"
        />
        <Button size="sm" className="w-full mt-3 bg-cyan-600 hover:bg-cyan-700" onClick={() => fetchCars()} data-testid="apply-price-filter">
          Apply
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3 text-gray-300">Fuel Type</h3>
        <div className="space-y-2">
          {['Petrol', 'Diesel', 'Electric', 'CNG'].map((fuel) => (
            <label key={fuel} className="flex items-center space-x-2 cursor-pointer group">
              <Checkbox checked={filters.fuelTypes.includes(fuel)} onCheckedChange={() => toggleFilter('fuelTypes', fuel)} data-testid={`filter-fuel-${fuel.toLowerCase()}`} />
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{fuel}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3 text-gray-300">Body Type</h3>
        <div className="space-y-2">
          {['SUV', 'Sedan', 'Hatchback'].map((body) => (
            <label key={body} className="flex items-center space-x-2 cursor-pointer group">
              <Checkbox checked={filters.bodyTypes.includes(body)} onCheckedChange={() => toggleFilter('bodyTypes', body)} data-testid={`filter-body-${body.toLowerCase()}`} />
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{body}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div className="dark-page min-h-screen"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <nav className="sticky top-0 z-30 backdrop-blur-xl bg-black/40 border-b border-white/10 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div className="cursor-pointer" onClick={() => navigate('/')} whileHover={{ scale: 1.05 }}>
            <AutoVistaLogo className="h-8" dark={true} data-testid="nav-logo" />
          </motion.div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="lg:hidden text-white" onClick={() => setMobileFiltersOpen(true)} data-testid="mobile-filter-toggle">
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 rounded-full" onClick={() => navigate('/dashboard')} data-testid="dashboard-button">
                Dashboard
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-2xl p-6 sticky top-24">
              <FilterPanel />
            </div>
          </div>

          {/* Mobile Filters */}
          <AnimatePresence>
            {mobileFiltersOpen && (
              <motion.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="absolute inset-0 bg-black/60" onClick={() => setMobileFiltersOpen(false)} />
                <motion.div className="absolute left-0 top-0 bottom-0 w-80 bg-[#0a0f1e] border-r border-white/10 p-6 overflow-y-auto"
                  initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: 'spring', damping: 25 }}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <Button variant="ghost" size="icon" onClick={() => setMobileFiltersOpen(false)}><X className="w-5 h-5" /></Button>
                  </div>
                  <FilterPanel />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Car Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <motion.h1 className="text-3xl font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                Available Cars <span className="text-cyan-400">({cars.length})</span>
              </motion.h1>
              <Select value={filters.sort} onValueChange={(v) => { const nf = { ...filters, sort: v }; setFilters(nf); fetchCars(nf); }}>
                <SelectTrigger className="w-48 bg-white/5 border-white/10" data-testid="sort-select">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {cars.map((car, idx) => (
                    <motion.div
                      key={car.id}
                      layout
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: idx * 0.05, duration: 0.4 }}
                      whileHover={{ y: -8, transition: { duration: 0.3 } }}
                      className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 shadow-xl cursor-pointer group"
                      onClick={() => navigate(`/car/${car.id}`)}
                      data-testid={`car-card-${car.id}`}
                    >
                      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden relative">
                        <img src={car.image_url} alt={car.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-white font-medium">{car.safety_rating}</span>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold group-hover:text-cyan-400 transition-colors">{car.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">{car.brand}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                          <span className="flex items-center gap-1"><Fuel className="w-3 h-3" />{car.fuel_type}</span>
                          <span className="flex items-center gap-1"><Settings className="w-3 h-3" />{car.transmission}</span>
                          <span>{car.mileage}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-bold text-cyan-400">₹{(car.price_min / 100000).toFixed(2)}L</p>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                              onClick={(e) => { e.stopPropagation(); navigate(`/car/${car.id}`); }} data-testid={`view-details-${car.id}`}>
                              View Details
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
