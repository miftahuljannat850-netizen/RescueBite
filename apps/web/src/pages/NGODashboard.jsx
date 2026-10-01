import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Handshake, Heart, Package, LoaderCircle } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import HeroCollage from '../components/dashboard/HeroCollage';
import SummaryCard from '../components/dashboard/SummaryCard';
import FoodCard from '../components/dashboard/FoodCard';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

export default function NGODashboard() {
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [donationPayload, requestPayload] = await Promise.all([
        api.getDonations(),
        api.getNgoRequests(),
      ]);
      setDonations(Array.isArray(donationPayload.data) ? donationPayload.data : []);
      setRequests(Array.isArray(requestPayload.data) ? requestPayload.data : []);
    } catch (err) {
      setError(err.message || 'Could not load donations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDonations();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDonations]);

  const available = donations.filter(d => d.status === 'available').length;
  const pendingRequests = requests.filter((item) => item.status === 'pending').length;
  const approvedRequests = requests.filter((item) => item.status === 'approved').length;
  const completedPickups = requests.filter((item) => item.status === 'completed').length;

  return (
    <DashboardShell role="ngo">
      <HeroCollage role="ngo" />

      <section className="grid grid-cols-1 gap-5 mt-6 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Available Donations" value={String(available)} subtitle="Ready to request" trend="Live" color="emerald" icon={<Package size={22} />} />
        <SummaryCard title="Pending Requests" value={String(pendingRequests)} subtitle="View requests" trend="Live" color="blue" icon={<Handshake size={22} />} />
        <SummaryCard title="Completed Pickups" value={String(completedPickups)} subtitle="Delivered" trend="Live" color="violet" icon={<CheckCircle2 size={22} />} />
        <SummaryCard title="Approved Requests" value={String(approvedRequests)} subtitle="Awaiting pickup" trend="Live" color="orange" icon={<Heart size={22} />} />
      </section>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <LoaderCircle className="animate-spin text-[#0F9F76]" size={32} />
        </div>
      )}

      {error && !loading && (
        <div className="mt-6 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4 text-sm text-rose-700 dark:text-rose-300">
          {error} <button onClick={fetchDonations} className="ml-2 font-bold underline">Retry</button>
        </div>
      )}

      {!loading && !error && donations.length === 0 && (
        <div className="mt-10 rounded-3xl border border-[color:var(--color-rescue-border)] bg-[color:var(--color-rescue-surface)] p-12 text-center">
          <div className="text-5xl mb-4">🍽️</div>
          <h3 className="text-xl font-bold text-[color:var(--color-rescue-text)]">No Food Donations Available</h3>
          <p className="text-sm text-[color:var(--color-rescue-text-muted)] mt-2">Check back soon for new food rescue opportunities.</p>
        </div>
      )}

      {!loading && !error && donations.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div><h2 className="text-2xl font-bold text-[color:var(--color-rescue-text)]">Nearby Food Donations</h2><p className="mt-1 text-sm text-[color:var(--color-rescue-text-muted)]">Fresh opportunities close to your organization.</p></div>
            <Link to="/ngo/browse-food" className="text-sm font-semibold text-[#0F9F76] hover:text-[#0C8562]">Browse all</Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {donations.slice(0, 6).map(donation => <FoodCard key={donation.id} donation={donation} />)}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
