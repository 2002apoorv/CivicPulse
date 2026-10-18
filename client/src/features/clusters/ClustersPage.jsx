import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Eye,
  Building2
} from 'lucide-react';
import api from '../../api/client';
import { CategoryBadge } from '../../components/common/Badge';
import { LoadingSpinner, EmptyState, Modal } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

export const ClustersPage = () => {
  const navigate = useNavigate();
  const { isOfficer, isAdmin } = useAuth();

  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClusterDetail, setSelectedClusterDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  const fetchClusters = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/clusters?status=${statusFilter}` : '/clusters';
      const res = await api.get(url);
      setClusters(res.data);
    } catch (err) {
      console.error("Fetch clusters failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, [statusFilter]);

  const handleConfirmAction = async (clusterId, action) => {
    try {
      await api.post(`/clusters/${clusterId}/confirm`, {
        action: action,
        notes: `Cluster status transitioned to ${action} by officer.`
      });
      fetchClusters();
      if (selectedClusterDetail?.id === clusterId) {
        setSelectedClusterDetail(null);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Action failed");
    }
  };

  const handleOpenDetail = async (clusterId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/clusters/${clusterId}`);
      setSelectedClusterDetail(res.data);
    } catch (err) {
      alert("Failed to load cluster details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      const res = await api.post('/clusters/recompute');
      alert(res.data.message);
      fetchClusters();
    } catch (err) {
      alert(err.response?.data?.detail || "Recompute failed");
    } finally {
      setRecomputing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Candidate Recurring Issue Clusters (DBSCAN)</h2>
          <p className="text-xs text-slate-500">Automated spatial-temporal and semantic grouping of correlated grievances</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700"
          >
            <option value="">All Cluster Statuses</option>
            <option value="candidate">Candidate Only</option>
            <option value="confirmed">Confirmed</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          {isAdmin && (
            <button
              onClick={handleRecompute}
              disabled={recomputing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${recomputing ? 'animate-spin' : ''}`} />
              Recompute Clusters
            </button>
          )}
        </div>
      </div>

      {/* Clusters Grid */}
      {loading ? (
        <LoadingSpinner text="Computing spatio-semantic clusters..." size="lg" />
      ) : clusters.length === 0 ? (
        <EmptyState
          title="No recurring issue clusters found"
          description="DBSCAN has not detected dense clusters matching your filter criteria."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clusters.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {c.cluster_code}
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                    c.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    c.status === 'candidate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    c.status === 'resolved' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <CategoryBadge category={c.category} size="xs" />
                    <span className="text-[11px] font-semibold text-slate-500">
                      • {c.complaint_count} correlated complaints
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  {c.summary}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Span: {new Date(c.first_reported_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(c.latest_reported_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-medium text-slate-700">Priority: {c.priority_score} pts</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenDetail(c.id)}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View {c.complaint_count} Members
                </button>

                {(isOfficer || isAdmin) && (
                  <div className="flex items-center gap-1.5">
                    {c.status === 'candidate' && (
                      <>
                        <button
                          onClick={() => handleConfirmAction(c.id, 'confirm')}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleConfirmAction(c.id, 'reject')}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-md transition-colors"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    {c.status === 'confirmed' && (
                      <button
                        onClick={() => handleConfirmAction(c.id, 'resolve')}
                        className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md border border-blue-200 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Complaints Inspection Modal */}
      <Modal
        isOpen={!!selectedClusterDetail}
        onClose={() => setSelectedClusterDetail(null)}
        title={selectedClusterDetail ? `${selectedClusterDetail.cluster_code} — Member Grievances` : ''}
        maxWidth="max-w-2xl"
      >
        {selectedClusterDetail && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-slate-900">{selectedClusterDetail.title}</h4>
              <p className="text-xs text-slate-600 mt-1">{selectedClusterDetail.summary}</p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Correlated Grievance Records ({selectedClusterDetail.members?.length || 0})
              </span>
              {selectedClusterDetail.members?.map((m) => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/complaints/${m.complaint_id}`)}
                  className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-600">{m.complaint_reference}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-semibold text-slate-900">{m.complaint_title}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Status: {m.complaint_status}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {Math.round(m.similarity_to_centroid * 100)}% Sim
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
