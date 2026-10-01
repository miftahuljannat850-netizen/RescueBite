import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from './components/HeroCarousel';
import FoodRescueCard from './components/homepage/FoodRescueCard';
import LoadingSkeleton from './components/homepage/LoadingSkeleton';
import HowItWorks from './components/homepage/HowItWorks';
import ImpactSection from './components/homepage/ImpactSection';
import UrgentRescue from './components/homepage/UrgentRescue';
import CommunityHeroes from './components/homepage/CommunityHeroes';
import EnvironmentalImpact from './components/homepage/EnvironmentalImpact';
import ThemeToggle from './components/ThemeToggle';
import { api } from './api/client';
import { getStoredToken, getStoredUser } from './lib/auth';
import { Pizza, Soup, Carrot, Home, Handshake, Bike, Backpack, Package, User, Search, X, ChevronDown, ShieldCheck } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RESCUE_CATEGORIES = [
  { id: 'restaurants', name: 'Restaurants', icon: Pizza, badge: 'Active' },
  { id: 'events', name: 'Events & Catering', icon: Soup, badge: 'Huge Qty' },
  { id: 'groceries', name: 'Raw Groceries', icon: Carrot, badge: 'Fresh' },
  { id: 'households', name: 'Households', icon: Home, badge: '' },
  { id: 'ngos', name: 'NGOs & Shelters', icon: Handshake, badge: 'Urgent' },
  { id: 'volunteer-action', name: 'Express Delivery', icon: Bike, badge: 'Fast' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('food');
  const [filter, setFilter] = useState('All');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [donations, setDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [donationFetchError, setDonationFetchError] = useState('');
  const [homepageAnalytics, setHomepageAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');
  const [donationForm, setDonationForm] = useState({
    food: '',
    quantity: '',
    beneficiary_type: 'human',
    pickup_deadline: '',
    address: '',
  });
  const [donationSubmitting, setDonationSubmitting] = useState(false);
  const [donationError, setDonationError] = useState('');
  const [donationSuccess, setDonationSuccess] = useState('');
  const [signInOpen, setSignInOpen] = useState(false);
  const signInRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (signInRef.current && !signInRef.current.contains(event.target)) {
        setSignInOpen(false);
      }
    };
    if (signInOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [signInOpen]);

  const fetchDonations = useCallback(async () => {
    setLoadingDonations(true);
    setDonationFetchError('');
    try {
      const payload = await api.getDonations();
      setDonations(Array.isArray(payload.data) ? payload.data : []);
    } catch (err) {
      setDonationFetchError(err.message || 'Could not load donations.');
    } finally {
      setLoadingDonations(false);
    }
  }, []);

  const fetchHomepageAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    setAnalyticsError('');
    try {
      const payload = await api.getHomepageAnalytics();
      setHomepageAnalytics(payload);
    } catch (err) {
      setAnalyticsError(err.message || 'Could not load live impact data.');
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { fetchHomepageAnalytics(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchHomepageAnalytics]);

  useEffect(() => {
    if (activeTab !== 'food') return;
    const timer = setTimeout(() => { fetchDonations(); }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, fetchDonations]);

  // Recompute the "now" timestamp when filter/segment/search changes so that
  // expiry-based filters (Urgent / Expiring Soon) re-evaluate on every render
  // that depends on them. The lint rule is suppressed because the deps are
  // intentionally tied to user-controlled filter state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => new Date().getTime(), [filter, segmentFilter, search]);

  const filteredDonations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return donations.filter(post => {
      if (q) {
        const hay = `${post.food} ${post.address} ${post.donor_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (segmentFilter === 'human' && post.beneficiary_type !== 'human') return false;
      if (segmentFilter === 'animal' && post.beneficiary_type !== 'animal') return false;

      if (filter === 'Available') return post.status === 'available';
      if (filter === 'Urgent') {
        const deadline = new Date(post.pickup_deadline).getTime();
        const hoursLeft = (deadline - now) / (1000 * 60 * 60);
        return post.status === 'available' && hoursLeft > 0 && hoursLeft <= 3;
      }
      if (filter === 'Expiring Soon') {
        const deadline = new Date(post.pickup_deadline).getTime();
        const hoursLeft = (deadline - now) / (1000 * 60 * 60);
        return post.status === 'available' && hoursLeft > 0 && hoursLeft <= 24;
      }
      if (filter === 'Nearby') return true;
      return true;
    });
  }, [donations, filter, segmentFilter, search, now]);

  const updateDonationField = (field) => (e) => {
    setDonationForm((current) => ({ ...current, [field]: e.target.value }));
  };

  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    if (donationSubmitting) return;

    setDonationError('');
    setDonationSuccess('');

    const user = getStoredUser();
    const token = getStoredToken();

    if (!token || user?.role !== 'donor') {
      setDonationError('Please sign in with a donor account before posting food.');
      return;
    }

    const pickupDeadline = new Date(donationForm.pickup_deadline);
    if (!donationForm.pickup_deadline || Number.isNaN(pickupDeadline.getTime())) {
      setDonationError('Please choose a valid pickup deadline.');
      return;
    }

    setDonationSubmitting(true);

    try {
      const payload = await api.createDonation({
        ...donationForm,
        pickup_deadline: pickupDeadline.toISOString(),
      });

      setDonationSuccess(
        `Food post submitted successfully. ${payload.notifications_created} matching NGO notification${payload.notifications_created === 1 ? '' : 's'} created.`,
      );
      setDonationForm({
        food: '',
        quantity: '',
        beneficiary_type: 'human',
        pickup_deadline: '',
        address: '',
      });
      setActiveTab('food');
      fetchDonations();
    } catch (requestError) {
      setDonationError(requestError.message || 'Could not submit the food donation.');
    } finally {
      setDonationSubmitting(false);
    }
  };

  const handleVolunteerSubmit = (e) => {
    e.preventDefault();
    alert("Registration as Volunteer successful! Thank you.");
    setActiveTab('food');
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-rescue-bg)] text-[color:var(--color-rescue-text)] font-sans flex flex-col selection:bg-[#0F9F76] selection:text-white pb-24 md:pb-0 scroll-smooth">

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-r from-[color:var(--color-rescue-accent-soft)] via-[color:var(--color-rescue-bg)] to-[color:var(--color-rescue-accent-soft)] blur-3xl pointer-events-none -z-10" />

      <nav className="bg-[color:var(--color-rescue-surface)]/80 backdrop-blur-md border-b border-[color:var(--color-rescue-border)] sticky top-0 z-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
           <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('food')}>
            <img src="/rescuebite-icon.svg" alt="RescueBite" className="h-9 w-auto group-hover:rotate-6 transition-transform duration-300" />
            <span className="font-extrabold text-2xl tracking-tight text-[#0F9F76]">
              RescueBite
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('food')}
              className={`text-sm font-bold tracking-wide transition-all duration-200 ${activeTab === 'food' ? 'text-[#0F9F76] border-[#0F9F76] border-2 bg-[color:var(--color-rescue-accent-soft)] px-4 py-2 rounded-xl' : 'text-[color:var(--color-rescue-text-muted)] hover:text-[#0F9F76]'}`}
            >
              Explore Food
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`text-sm font-bold tracking-wide transition-all duration-200 ${activeTab === 'services' ? 'text-[#0F9F76] border-b-2 border-[#0F9F76] pb-1' : 'text-[color:var(--color-rescue-text-muted)] hover:text-[#0F9F76]'}`}
            >
              All Services
            </button>
            <button
              onClick={() => setActiveTab('volunteer')}
              className={`text-sm font-bold tracking-wide transition-all duration-200 ${activeTab === 'volunteer' ? 'text-[#0F9F76] border-b-2 border-[#0F9F76] pb-1' : 'text-[color:var(--color-rescue-text-muted)] hover:text-[#0F9F76]'}`}
            >
              Become Volunteer
            </button>
            <ThemeToggle />
            <button
              onClick={() => setActiveTab('donate')}
              className="bg-[#0F9F76] text-white text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-[1.25rem] hover:bg-[#0C8562] transition-all duration-300 shadow-[0_4px_15px_rgba(15,159,118,0.2)] active:scale-95"
            >
              Donate Surplus Food
            </button>
            <div className="relative" ref={signInRef}>
              <button
                onClick={() => setSignInOpen((value) => !value)}
                className="text-xs font-black uppercase tracking-wider text-[color:var(--color-rescue-text-muted)] hover:text-[#0F9F76] border-2 border-[color:var(--color-rescue-border)] px-5 py-3 rounded-[1.25rem] hover:border-[color:var(--color-rescue-green-tint)] transition-all duration-300 bg-[color:var(--color-rescue-surface)] inline-flex items-center gap-2"
              >
                Sign In
                <ChevronDown size={16} className={`transition-transform duration-200 ${signInOpen ? 'rotate-180' : ''}`} />
              </button>
              {signInOpen && (
                <div className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl border border-[color:var(--color-rescue-border)] bg-[color:var(--color-rescue-surface)] shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--color-rescue-text-muted)]">User</p>
                  </div>
                  <div className="px-2 py-1.5 space-y-1">
                    <Link to="/login" onClick={() => setSignInOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[color:var(--color-rescue-text)] hover:bg-[color:var(--color-rescue-accent-soft)] hover:text-[#0F9F76] transition-colors">
                      <User size={18} /> Donor
                    </Link>
                    <Link to="/login" onClick={() => setSignInOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[color:var(--color-rescue-text)] hover:bg-[color:var(--color-rescue-accent-soft)] hover:text-[#0F9F76] transition-colors">
                      <Handshake size={18} /> NGO
                    </Link>
                    <Link to="/login" onClick={() => setSignInOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[color:var(--color-rescue-text)] hover:bg-[color:var(--color-rescue-accent-soft)] hover:text-[#0F9F76] transition-colors">
                      <Bike size={18} /> Volunteer
                    </Link>
                  </div>
                  <div className="mx-3 my-1.5 h-px bg-[color:var(--color-rescue-border)]" />
                  <div className="px-4 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--color-rescue-text-muted)]">Admin</p>
                  </div>
                  <div className="px-2 py-1.5">
                    <Link to="/admin/login" onClick={() => setSignInOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0F9F76] hover:bg-[color:var(--color-rescue-accent-soft)] transition-colors">
                      <ShieldCheck size={18} /> Admin Login
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <header className="bg-[color:var(--color-rescue-surface)]/80 backdrop-blur-md border-b border-[color:var(--color-rescue-border)] p-4 sticky top-0 z-50 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2" onClick={() => setActiveTab('food')}>
          <img src="/rescuebite-icon.svg" alt="RescueBite" className="h-7 w-auto" />
          <span className="font-extrabold text-lg text-[#0F9F76]">RescueBite</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-[9px] bg-[color:var(--color-rescue-accent-soft)] text-[#0F9F76] font-extrabold px-3 py-1 rounded-full border border-[color:var(--color-rescue-border)] tracking-wider">DHAKA</span>
        </div>
      </header>

      <main className="flex-grow">
        {donationSuccess && (
          <div className="mx-auto mt-6 max-w-7xl px-6">
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/25 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              {donationSuccess}
            </div>
          </div>
        )}

        {activeTab === 'food' && (
          <div className="max-w-7xl mx-auto px-6 py-8">

            <div className="mb-8">
              <HeroCarousel approvedVolunteerCount={homepageAnalytics?.stats?.approved_volunteers} />
            </div>

            <UrgentRescue
              donations={donations}
              loading={loadingDonations}
              error={donationFetchError}
            />

            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-[color:var(--color-rescue-surface)] p-1.5 rounded-2xl border border-[color:var(--color-rescue-border)] shadow-sm gap-2">
                <button
                  onClick={() => setSegmentFilter('all')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 ${
                    segmentFilter === 'all'
                      ? 'bg-[#0F9F76] text-white shadow-md'
                      : 'text-[color:var(--color-rescue-text-muted)] hover:text-[#0F9F76]'
                  }`}
                >
                  All Rescues
                </button>
                <button
                  onClick={() => setSegmentFilter('human')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 ${
                    segmentFilter === 'human'
                      ? 'bg-[#0F9F76] text-white shadow-md'
                      : 'text-[color:var(--color-rescue-text-muted)] hover:text-[#0F9F76]'
                  }`}
                >
                  Human Food
                </button>
                <button
                  onClick={() => setSegmentFilter('animal')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 ${
                    segmentFilter === 'animal'
                      ? 'bg-[#0F9F76] text-white shadow-md'
                      : 'text-[color:var(--color-rescue-text-muted)] hover:text-[#0F9F76]'
                  }`}
                >
                  Animal Shelters
                </button>
              </div>
            </div>

            <div className="flex justify-center mb-10">
              <div className="w-full max-w-[620px] relative">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[color:var(--color-rescue-text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search food, location, or category..."
                  className="w-full bg-[color:var(--color-rescue-surface)] border border-[color:var(--color-rescue-border)] rounded-xl pl-14 pr-14 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0F9F76] focus:border-[#0F9F76] transition"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--color-rescue-text-muted)] hover:text-[color:var(--color-rescue-text)]"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-extrabold text-[color:var(--color-rescue-text)] tracking-tight">Active Rescues</h2>
                <p className="text-[color:var(--color-rescue-text-muted)] font-medium text-sm mt-1">Real-time surplus edible food & animal nourishment waiting to be collected.</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {['All', 'Available', 'Urgent', 'Expiring Soon', 'Nearby'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    aria-pressed={filter === item}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 font-black tracking-wide uppercase text-[10px] ${
                      filter === item
                        ? 'bg-[#0F9F76] text-white shadow-md'
                        : 'bg-[color:var(--color-rescue-surface)] text-[color:var(--color-rescue-text-muted)] hover:text-[#0F9F76] border border-[color:var(--color-rescue-border)]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {loadingDonations ? (
              <LoadingSkeleton count={6} />
            ) : donationFetchError ? (
                <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4 text-sm font-semibold text-rose-700 dark:text-rose-300">
                  {donationFetchError}
                  <button
                    onClick={fetchDonations}
                    className="mt-3 text-xs font-black uppercase text-[#0F9F76] hover:underline"
                  >
                    Try Again
                  </button>
                </div>
            ) : filteredDonations.length === 0 ? (
              <div className="rounded-3xl border border-[color:var(--color-rescue-border)] bg-[color:var(--color-rescue-surface)] p-12 text-center shadow-sm">
                <div className="text-5xl mb-4">🍽️</div>
                <h3 className="text-xl font-bold text-[color:var(--color-rescue-text)]">No Food Rescues Available</h3>
                <p className="text-[color:var(--color-rescue-text-muted)] font-medium text-sm mt-2">
                  {search || filter !== 'All'
                    ? 'No rescues match your current filters. Try adjusting your search or filters.'
                    : 'Be the first to donate surplus food and help those in need.'}
                </p>
                <button
                  onClick={() => { setActiveTab('donate'); }}
                  className="mt-6 bg-[#0F9F76] text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-[#0C8562] transition-all duration-300"
                >
                  Donate Food
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDonations.map((donation) => (
                  <FoodRescueCard
                    key={donation.id}
                    donation={donation}
                    onRequest={() => alert(`Request sent to: ${donation.donor_name || 'donor'}`)}
                  />
                ))}
              </div>
            )}

            <ImpactSection
              stats={homepageAnalytics?.stats}
              loading={loadingAnalytics}
              error={analyticsError}
              onRetry={fetchHomepageAnalytics}
            />

            <div className="mt-16 bg-[color:var(--color-rescue-surface)] p-6 md:p-8 rounded-[2rem] border border-[color:var(--color-rescue-border)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-md">
                <span className="text-xs font-black uppercase text-[#0F9F76] tracking-wider">Live Analytics</span>
                <h3 className="text-2xl font-extrabold text-[color:var(--color-rescue-text)] mt-1">Today's Food Rescue Status</h3>
                <p className="text-[color:var(--color-rescue-text-muted)] text-sm mt-1">Here is the real-time breakdown of distributed human and animal surplus food across Dhaka today.</p>
              </div>
              <div className="h-56 w-full md:w-80">
                {loadingAnalytics ? (
                  <div role="status" className="flex h-full items-center justify-center text-sm text-[color:var(--color-rescue-text-muted)]">Loading live analytics...</div>
                ) : analyticsError || !homepageAnalytics ? (
                  <div role="status" className="flex h-full items-center justify-center text-center text-sm text-[color:var(--color-rescue-text-muted)]">Live chart data is unavailable.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Delivered', value: homepageAnalytics.chart.delivered, color: '#0F9F76' },
                          { name: 'Received by NGOs', value: homepageAnalytics.chart.received_by_ngos, color: '#3B82F6' },
                          { name: 'Pending / Available', value: homepageAnalytics.chart.pending_available, color: '#F59E0B' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { color: '#0F9F76' },
                          { color: '#3B82F6' },
                          { color: '#F59E0B' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <CommunityHeroes
              volunteers={homepageAnalytics?.top_volunteers}
              loading={loadingAnalytics}
              error={Boolean(analyticsError)}
            />
            <EnvironmentalImpact
              impact={homepageAnalytics?.impact}
              loading={loadingAnalytics}
              error={Boolean(analyticsError)}
            />
            <HowItWorks />

          </div>
        )}

        {activeTab === 'services' && (
           <div className="max-w-5xl mx-auto px-6 py-12 bg-[color:var(--color-rescue-bg)]">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 bg-[color:var(--color-rescue-surface)] text-[color:var(--color-rescue-text)] text-xs font-bold px-3 py-1.5 rounded-full border border-[color:var(--color-rescue-border)] uppercase tracking-wider mb-3">
                <Backpack size={14} />
                Choose Your Segment
              </span>
              <h2 className="text-3xl font-extrabold text-[color:var(--color-rescue-text)] tracking-tight">Our Rescue Categories</h2>
              <p className="text-[color:var(--color-rescue-text-muted)] text-sm mt-2 max-w-md mx-auto">Explore surplus options tailored by source. Pick what fits your scope best.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {RESCUE_CATEGORIES.map((cat) => {
                const CategoryIcon = cat.icon;
                return (
                <div
                  key={cat.id}
                  onClick={() => { setActiveTab('food'); }}
                  className="bg-[color:var(--color-rescue-surface)] rounded-[2rem] p-6 border border-[color:var(--color-rescue-border)] shadow-[0_8px_25px_-10px_rgba(15,159,118,0.06)] hover:shadow-[0_12px_25px_-8px_rgba(15,159,118,0.12)] hover:border-[color:var(--color-rescue-green-tint)] hover:-translate-y-1 transition-all duration-300 text-center cursor-pointer group"
                >
                  <div className="relative w-16 h-16 bg-[color:var(--color-rescue-accent-soft)] rounded-2xl flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110">
                    {cat.badge && (
                      <span className={`absolute -top-2 px-1.5 py-0.5 text-[8px] font-black rounded-full tracking-wider uppercase ${cat.badge === 'Urgent' || cat.badge === 'Huge Qty' ? 'bg-rose-500 text-white' : 'bg-[#0F9F76] text-white'}`}>
                        {cat.badge}
                      </span>
                    )}
                    <CategoryIcon size={28} className="text-[#0F9F76]" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-[color:var(--color-rescue-text)] group-hover:text-[#0F9F76] transition-colors duration-200">
                    {cat.name}
                  </h3>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'donate' && (
          <div className="max-w-xl mx-auto py-12 px-6">
            <div className="bg-[color:var(--color-rescue-surface)] p-8 md:p-10 rounded-[2.5rem] border border-[color:var(--color-rescue-border)] shadow-[0_15px_45px_-12px_rgba(15,159,118,0.02)]">
              <h2 className="text-3xl font-extrabold text-[color:var(--color-rescue-text)] tracking-tight">Post Surplus Food</h2>
              <p className="text-[color:var(--color-rescue-text-muted)] font-medium text-sm mt-1">Let's prevent food wastage. Register your surplus meal below.</p>

              {donationError && (
                <div className="mt-5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
                  {donationError}
                </div>
              )}

              <form className="mt-8 space-y-5" onSubmit={handleDonateSubmit}>
                <div>
                  <label className="block text-xs font-black text-[color:var(--color-rescue-text-muted)] uppercase tracking-wider">Food Description</label>
                  <input type="text" value={donationForm.food} onChange={updateDonationField('food')} placeholder="e.g. 30 Boxes of Catering Chicken Pulao or Animal Trimmings" className="w-full mt-2 p-3.5 rounded-[1.15rem] border border-[color:var(--color-rescue-border)] focus:border-[#0F9F76] focus:outline-none focus:ring-4 focus:ring-[#0F9F76]/5 text-sm font-medium bg-[color:var(--color-rescue-bg)]" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[color:var(--color-rescue-text-muted)] uppercase tracking-wider">Quantity</label>
                    <input type="text" value={donationForm.quantity} onChange={updateDonationField('quantity')} placeholder="e.g. 30 Servings / 15 kg" className="w-full mt-2 p-3.5 rounded-[1.15rem] border border-[color:var(--color-rescue-border)] focus:border-[#0F9F76] focus:outline-none focus:ring-4 focus:ring-[#0F9F76]/5 text-sm font-medium bg-[color:var(--color-rescue-bg)]" required />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[color:var(--color-rescue-text-muted)] uppercase tracking-wider">Pickup Deadline</label>
                    <input type="datetime-local" value={donationForm.pickup_deadline} onChange={updateDonationField('pickup_deadline')} className="w-full mt-2 p-3.5 rounded-[1.15rem] border border-[color:var(--color-rescue-border)] focus:border-[#0F9F76] focus:outline-none focus:ring-4 focus:ring-[#0F9F76]/5 text-sm font-medium bg-[color:var(--color-rescue-bg)]" required />
                  </div>
                </div>
                <fieldset>
                  <legend className="block text-xs font-black text-[color:var(--color-rescue-text-muted)] uppercase tracking-wider">Beneficiary</legend>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {['human', 'animal'].map((type) => (
                      <label key={type} className={`cursor-pointer rounded-[1.15rem] border-2 p-3.5 text-center text-sm font-black uppercase tracking-wider transition-all ${donationForm.beneficiary_type === type ? 'border-[#0F9F76] bg-[color:var(--color-rescue-accent-soft)] text-[#0F9F76]' : 'border-[color:var(--color-rescue-border)] text-[color:var(--color-rescue-text-muted)] hover:border-[color:var(--color-rescue-green-tint)]'}`}>
                        <input type="radio" name="beneficiary_type" value={type} checked={donationForm.beneficiary_type === type} onChange={updateDonationField('beneficiary_type')} className="sr-only" />
                        {type}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label className="block text-xs font-black text-[color:var(--color-rescue-text-muted)] uppercase tracking-wider">Pickup Area Address</label>
                  <input type="text" value={donationForm.address} onChange={updateDonationField('address')} placeholder="e.g. Meena Bazar, Gulshan 2" className="w-full mt-2 p-3.5 rounded-[1.15rem] border border-[color:var(--color-rescue-border)] focus:border-[#0F9F76] focus:outline-none focus:ring-4 focus:ring-[#0F9F76]/5 text-sm font-medium bg-[color:var(--color-rescue-bg)]" required />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setActiveTab('food')} className="flex-1 bg-[color:var(--color-rescue-accent-soft)] hover:bg-[color:var(--color-rescue-border)] text-[color:var(--color-rescue-text)] font-bold p-3.5 rounded-[1.15rem] border border-[color:var(--color-rescue-border)] transition-all duration-300">
                    Cancel
                  </button>
                  <button type="submit" disabled={donationSubmitting} className="flex-1 bg-[#0F9F76] hover:bg-[#0C8562] text-white font-black uppercase tracking-wider p-3.5 rounded-[1.15rem] transition-all duration-300 shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
                    {donationSubmitting ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'volunteer' && (
           <div className="max-w-xl mx-auto py-12 px-6 bg-[color:var(--color-rescue-bg)]">
            <div className="bg-[color:var(--color-rescue-surface)] p-8 md:p-10 rounded-[2.5rem] border border-[color:var(--color-rescue-border)] shadow-[0_15px_45px_-12px_rgba(15,159,118,0.06)]">
              <div className="text-center">
                <Bike size={48} className="mx-auto text-[#0F9F76]" strokeWidth={1.5} />
                <h2 className="text-3xl font-extrabold text-[color:var(--color-rescue-text)] tracking-tight mt-3">Become a Rescue Hero</h2>
                <p className="text-[color:var(--color-rescue-text-muted)] font-medium text-sm mt-2">Become the bridge between surplus food and the local families who need it.</p>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleVolunteerSubmit}>
                <div>
                  <label className="block text-xs font-black text-[color:var(--color-rescue-text-muted)] uppercase tracking-wider">Your Full Name</label>
                  <input type="text" placeholder="Enter your name" className="w-full mt-2 p-3.5 rounded-[1.15rem] border border-[color:var(--color-rescue-border)] focus:border-[#0F9F76] focus:outline-none focus:ring-4 focus:ring-[#0F9F76]/5 text-sm font-medium bg-[color:var(--color-rescue-bg)]" required />
                </div>
                <div>
                  <label className="block text-xs font-black text-[color:var(--color-rescue-text-muted)] uppercase tracking-wider">Transport Mode</label>
                  <select className="w-full mt-2 p-3.5 rounded-[1.15rem] border border-[color:var(--color-rescue-border)] focus:border-[#0F9F76] focus:outline-none focus:ring-4 focus:ring-[#0F9F76]/5 text-sm font-medium bg-[color:var(--color-rescue-bg)]">
                    <option>Bicycle</option>
                    <option>Motorbike</option>
                    <option>On Foot</option>
                    <option>Rickshaw / Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-[color:var(--color-rescue-text-muted)] uppercase tracking-wider">Preferred Area (Dhaka)</label>
                  <input type="text" placeholder="e.g. Dhanmondi, Banani, Mirpur" className="w-full mt-2 p-3.5 rounded-[1.15rem] border border-[color:var(--color-rescue-border)] focus:border-[#0F9F76] focus:outline-none focus:ring-4 focus:ring-[#0F9F76]/5 text-sm font-medium bg-[color:var(--color-rescue-bg)]" required />
                </div>

                <button type="submit" className="w-full bg-[#0F9F76] hover:bg-[#0C8562] text-white font-black uppercase tracking-wider p-4 rounded-[1.15rem] mt-4 transition-all duration-300 shadow-md active:scale-95">
                  Sign Up as Volunteer
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-[color:var(--color-rescue-surface)]/95 backdrop-blur-md border-t border-[color:var(--color-rescue-border)] px-4 py-2.5 flex items-center justify-between md:hidden z-50 shadow-[0_-5px_25px_rgba(15,159,118,0.08)]">

        <button
          onClick={() => setActiveTab('food')}
          className="flex flex-col items-center justify-center flex-1 py-1"
        >
          <Pizza size={22} className={`transition-all duration-200 ${activeTab === 'food' ? 'scale-110 opacity-100 text-[#0F9F76]' : 'opacity-40 text-[color:var(--color-rescue-text-muted)]'}`} />
          <span className={`text-[9px] font-black uppercase tracking-wider mt-1 ${activeTab === 'food' ? 'text-[#0F9F76]' : 'text-[color:var(--color-rescue-text-muted)]'}`}>Food</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className="flex flex-col items-center justify-center flex-1 py-1"
        >
          <Package size={22} className={`transition-all duration-200 ${activeTab === 'services' ? 'scale-110 opacity-100 text-[#0F9F76]' : 'opacity-40 text-[color:var(--color-rescue-text-muted)]'}`} />
          <span className={`text-[9px] font-black uppercase tracking-wider mt-1 ${activeTab === 'services' ? 'text-[#0F9F76]' : 'text-[color:var(--color-rescue-text-muted)]'}`}>Services</span>
        </button>

        <button
          onClick={() => setActiveTab('donate')}
          className="flex flex-col items-center justify-center -mt-8 bg-gradient-to-br from-[#0F9F76] to-[#0A805E] w-14 h-14 rounded-[1.25rem] shadow-[0_6px_20px_rgba(15,159,118,0.3)] border-4 border-[color:var(--color-rescue-bg)] active:scale-95 transition-all duration-300"
        >
          <span className="text-white text-2xl font-black select-none">+</span>
        </button>

        <button
          onClick={() => setActiveTab('volunteer')}
          className="flex flex-col items-center justify-center flex-1 py-1"
        >
          <Bike size={22} className={`transition-all duration-200 ${activeTab === 'volunteer' ? 'scale-110 opacity-100 text-[#0F9F76]' : 'opacity-40 text-[color:var(--color-rescue-text-muted)]'}`} />
          <span className={`text-[9px] font-black uppercase tracking-wider mt-1 ${activeTab === 'volunteer' ? 'text-[#0F9F76]' : 'text-[color:var(--color-rescue-text-muted)]'}`}>Hero</span>
        </button>

        <Link
          to="/login"
          className="flex flex-col items-center justify-center flex-1 py-1"
        >
          <User size={22} className={`transition-all duration-200 ${activeTab === 'profile' ? 'scale-110 opacity-100 text-[#0F9F76]' : 'opacity-40 text-[color:var(--color-rescue-text-muted)]'}`} />
          <span className={`text-[9px] font-black uppercase tracking-wider mt-1 ${activeTab === 'profile' ? 'text-[#0F9F76]' : 'text-[color:var(--color-rescue-text-muted)]'}`}>Profile</span>
        </Link>

      </div>

      <footer className="bg-[color:var(--color-rescue-footer)] text-[color:var(--color-rescue-text)]/50 py-12 px-6 border-t border-[color:var(--color-rescue-footer)] hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded">
                <img src="/rescuebite-logo-dark.svg" alt="RescueBite" className="h-6 w-auto" />
                <span className="font-extrabold text-white">RescueBite</span>
              </Link>
            </div>
            <p className="text-xs mt-1 text-white/60">Share excess food, support families & shelters in Dhaka.</p>
          </div>
          <div className="text-xs text-white/40">
            © 2026 RescueBite Team. All Rights Reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
