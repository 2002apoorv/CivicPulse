import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  ArrowUpDown, 
  Calendar, 
  MapPin, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import api from '../../api/client';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { LoadingSpinner, EmptyState } from '../../components/common/LoadingSpinner';
import { CIVIC_CATEGORIES } from '../../utils/constants';

export const ComplaintListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [priority, setPriority] = useState(searchParams.get('priority') || '');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('page_size', 12);
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

      const res = await api.get(`/complaints?${params.toString()}`);
      setComplaints(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (err) {
      console.error("Fetch complaints failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, category, status, priority, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setPriority('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & New Complaint Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Public Grievance Explorer</h2>
          <p className="text-xs text-slate-500">Search and filter active citizen infrastructure and service tickets</p>
        </div>
        <button
          onClick={() => navigate('/complaints/new')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          Submit Grievance
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by complaint title, reference ID, description, or landmark..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filters:
          </span>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
          >
            <option value="">All Categories</option>
            {CIVIC_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
          >
            <option value="created_at">Date Submitted</option>
            <option value="priority_score">Priority Score</option>
            <option value="category">Category</option>
          </select>

          {(search || category || status || priority) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:underline font-medium ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading grievances table..." />
        ) : complaints.length === 0 ? (
          <EmptyState
            title="No complaints matched your query"
            description="Try modifying search keywords or clearing active category and status filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Grievance Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Locality</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/complaints/${c.id}`)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      {c.reference_no}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {c.description}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <CategoryBadge category={c.category} size="xs" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{c.locality || 'Varanasi'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={c.priority} size="xs" />
                        <span className="text-[10px] text-slate-400 font-medium">{Math.round(c.priority_score)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="xs" />
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/complaints/${c.id}`); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing <strong className="font-semibold text-slate-900">{complaints.length}</strong> of <strong className="font-semibold text-slate-900">{total}</strong> total grievances
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium text-slate-700 px-2">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
