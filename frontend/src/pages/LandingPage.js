import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Mic, Search, Zap, Shield, TrendingUp, ChevronRight, Star, ArrowRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_autovista-search/artifacts/9soiiv3t_ChatGPT%20Image%20Apr%2017%2C%202026%2C%2007_36_31%20PM.png";
const HERO_CAR_URL = "https://static.prod-images.emergentagent.com/jobs/014d81ed-6d1e-486e-931c-c64e7d22d8e8/images/1d9f6af135f5415eae93db33eb7dbcf53f9b79e3e4918ea588ea4b57b495db64.png";
const BG_URL = "https://static.prod-images.emergentagent.com/jobs/014d81ed-6d1e-486e-931c-c64e7d22d8e8/images/1e86ca222d893c57534c15c2e03ffdcabb19f382f95705f83a3ff28b207d5ac6.png";

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            background: i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#3b82f6' : '#FF5E00',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.3 + Math.random() * 0.4,
          }}
          animate={{
            y: [0, -(20 + Math.random() * 40), 0],
            x: [0, (Math.random() - 0.5) * 20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function CountUp({ target, duration = 2, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [budget, setBudget] = useState([1500000]);
  const [fuelType, setFuelType] = useState('');
  const [listening, setListening] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Voice:', transcript);
        navigate(`/cars?search=${encodeURIComponent(transcript)}`);
      };
      recognition.start();
    } else {
      alert('Voice search not supported in this browser');
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (budget[0]) params.append('max_price', budget[0]);
    if (fuelType) params.append('fuel_type', fuelType);
    navigate(`/cars?${params.toString()}`);
  };

  return (
    <motion.div
      className="dark-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src={BG_URL} alt="" className="w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070D]/60 via-transparent to-[#05070D]" />
      </div>

      <FloatingParticles />

      {/* Navbar */}
      <nav className="relative z-20 sticky top-0 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <motion.div
            className="cursor-pointer"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
          >
            <img src={LOGO_URL} alt="AutoVista" className="h-10 object-contain" data-testid="nav-logo-img" />
          </motion.div>
          <div className="hidden md:flex items-center space-x-8 text-sm text-gray-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors duration-300" data-testid="nav-features">Features</a>
            <a href="#stats" className="hover:text-cyan-400 transition-colors duration-300" data-testid="nav-stats">Stats</a>
            <button onClick={() => navigate('/cars')} className="hover:text-cyan-400 transition-colors duration-300" data-testid="nav-browse">Browse Cars</button>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white"
              onClick={() => navigate('/login')}
              data-testid="nav-login-btn"
            >
              Log in
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 rounded-full hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all duration-300"
                onClick={() => navigate('/register')}
                data-testid="nav-get-started-btn"
              >
                Get started
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div ref={heroRef} className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
          <motion.div style={{ y: heroY }}>
            <motion.p
              className="text-xs uppercase tracking-[0.3em] text-cyan-400 mb-4 font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Drive the future
            </motion.p>
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-none mb-6"
              style={{ fontFamily: "'Outfit', sans-serif" }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Find Your<br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Perfect Drive
              </span>
            </motion.h1>
            <motion.p
              className="text-base md:text-lg text-gray-400 mb-10 leading-relaxed max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              Discover the best cars in India with AI-powered recommendations, real-time price predictions, and intelligent voice search.
            </motion.p>

            {/* Floating Search Bar */}
            <motion.div
              className="backdrop-blur-2xl bg-black/50 border border-white/15 rounded-2xl p-6 shadow-2xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2 block font-medium">Budget</label>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white font-semibold">
                      ₹{(budget[0] / 100000).toFixed(1)}L
                    </span>
                    <span className="text-xs text-gray-500">₹50L</span>
                  </div>
                  <Slider
                    value={budget}
                    onValueChange={setBudget}
                    max={5000000}
                    min={300000}
                    step={100000}
                    className="w-full"
                    data-testid="budget-slider"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2 block font-medium">Fuel Type</label>
                  <Select value={fuelType} onValueChange={setFuelType}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white hover:border-cyan-500/50 transition-colors" data-testid="fuel-type-select">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Electric">Electric</SelectItem>
                      <SelectItem value="CNG">CNG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-5 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300"
                      onClick={handleSearch}
                      data-testid="search-button"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search Cars
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 relative overflow-hidden"
                      onClick={handleVoiceSearch}
                      data-testid="voice-search-button"
                    >
                      {listening && (
                        <>
                          <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-75"></span>
                          <span className="absolute inset-[-4px] rounded-full border-2 border-orange-400 animate-ping opacity-50"></span>
                        </>
                      )}
                      <Mic className={`w-5 h-5 relative z-10 ${listening ? 'animate-pulse' : ''}`} />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Car with Travel Animation */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 1.2,
              delay: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {/* Glow Effect behind car */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(59,130,246,0.08) 50%, transparent 70%)' }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.img
              src={HERO_CAR_URL}
              alt="futuristic car"
              className="w-full h-auto drop-shadow-2xl relative z-10"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Light streaks */}
            <motion.div
              className="absolute bottom-10 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
            />
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div id="stats" className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {[
            { value: 500, suffix: '+', label: 'Cars Listed' },
            { value: 15, suffix: '+', label: 'Top Brands' },
            { value: 10, suffix: 'K+', label: 'Happy Users' },
            { value: 98, suffix: '%', label: 'Satisfaction' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <CountUp target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-gray-400 mt-2">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 mb-3">Why AutoVista</p>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Intelligent Car Discovery
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: 'AI Recommendations', desc: 'LLM-powered suggestions based on your budget, usage, and preferences', color: 'cyan' },
            { icon: TrendingUp, title: 'Price Prediction', desc: 'ML models forecast future resale values with depreciation analysis', color: 'blue' },
            { icon: Shield, title: 'Voice Search', desc: 'Just say what you need and let AI find the perfect match for you', color: 'orange' }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-500 shadow-2xl group cursor-pointer"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              whileHover={{ y: -8, scale: 1.02 }}
              data-testid={`feature-card-${idx}`}
            >
              <motion.div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${
                  feature.color === 'cyan' ? 'bg-cyan-500/10' :
                  feature.color === 'blue' ? 'bg-blue-500/10' : 'bg-orange-500/10'
                }`}
                whileHover={{ rotate: 5 }}
              >
                <feature.icon className={`w-7 h-7 ${
                  feature.color === 'cyan' ? 'text-cyan-400' :
                  feature.color === 'blue' ? 'text-blue-400' : 'text-orange-400'
                }`} strokeWidth={1.5} />
              </motion.div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-cyan-400 transition-colors" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              <div className="flex items-center mt-4 text-cyan-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          className="backdrop-blur-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-white/10 rounded-3xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Ready to Find Your Dream Car?
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Join thousands of users who found their perfect ride with AutoVista's AI-powered platform.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-10 py-6 text-lg rounded-full hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300"
              onClick={() => navigate('/register')}
              data-testid="cta-get-started"
            >
              Get Started Free
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <img src={LOGO_URL} alt="AutoVista" className="h-8 mb-4 md:mb-0 object-contain" />
          <p className="text-sm text-gray-500">2026 AutoVista. Drive Your Dream.</p>
        </div>
      </footer>
    </motion.div>
  );
}
