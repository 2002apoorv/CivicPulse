import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  CheckCircle, 
  Edit3, 
  ShieldCheck, 
  Building2,
  FileText,
  User,
  History,
  Send,
  ExternalLink
} from 'lucide-react';
import api from '../../api/client';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { LoadingSpinner, Modal } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { CIVIC_CATEGORIES } from '../../utils/constants';

export const ComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOfficer, isAdmin, user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Reclassify Modal State
  const [isReclassifyModalOpen, setIsReclassifyModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [reclassifyReason, setReclassifyReason] = useState('');
  const [reclassifySubmitting, setReclassifySubmitting] = useState(false);

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
      setNewStatus(res.data.status);
      setNewCategory(res.data.category);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load complaint details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setStatusSubmitting(true);
    try {
      await api.patch(`/complaints/${id}/status`, {
        status: newStatus,
        notes: statusNotes
      });
      setIsStatusModalOpen(false);
      setStatusNotes('');
      fetchComplaint();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleReclassify = async (e) => {
    e.preventDefault();
    if (!reclassifyReason.trim()) {
      alert("Please provide an explicit rationale for overriding the AI category.");
      return;
    }
    setReclassifySubmitting(true);
    try {
      await api.post(`/complaints/${id}/reclassify`, {
        new_category: newCategory,
        reason: reclassifyReason.trim()
      });
      setIsReclassifyModalOpen(false);
      setReclassifyReason('');
      fetchComplaint();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to reclassify");
    } finally {
      setReclassifySubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading grievance dossier..." size="lg" />;
  if (error || !complaint) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-sm font-semibold text-rose-600 mb-2">{error || "Complaint not found"}</p>
        <button
          onClick={() => navigate('/complaints')}
          className="text-xs text-indigo-600 hover:underline font-medium"
        >
          ← Return to Grievance Explorer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/complaints')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Explorer
        </button>

        {/* Action Controls for Officers and Admins */}
        {(isOfficer || isAdmin) && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReclassifyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5 text-indigo-600" />
              Override AI Category
            </button>
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Update Status
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Details Left, AI Intelligence Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Complaint Dossier & Lifecycle */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {complaint.reference_no}
                </span>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
              </div>
              <span className="text-xs text-slate-400">
                Filed on {new Date(complaint.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{complaint.title}</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{complaint.description}</p>
            </div>

            {/* Metadata Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Active Category</span>
                <CategoryBadge category={complaint.category} size="xs" />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Assigned Department</span>
                <span className="font-semibold text-slate-800">{complaint.assigned_department?.name || 'General Grievance Cell'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Locality & Ward</span>
                <span className="font-semibold text-slate-800">{complaint.locality || 'Varanasi'} ({complaint.ward || 'General'})</span>
              </div>
            </div>

            {/* Priority Explanation */}
            {complaint.priority_reason && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Priority Score: {complaint.priority_score} pts ({complaint.priority.toUpperCase()})
                </div>
                <p className="text-amber-800 text-[11px]">{complaint.priority_reason}</p>
              </div>
            )}
          </div>

          {/* Lifecycle Status Timeline */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="h-4 w-4 text-slate-400" />
              Audit Trail & Lifecycle Timeline
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {complaint.status_history?.map((h, idx) => (
                <div key={h.id || idx} className="relative">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 uppercase tracking-wider">{h.new_status.replace('_', ' ')}</span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(h.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {h.notes && (
                    <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {h.notes}
                    </p>
                  )}
                  {h.changed_by && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Updated by {h.changed_by.full_name} ({h.changed_by.role})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Model Intelligence & Similar Reports */}
        <div className="space-y-6">
          {/* AI Intelligence Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                AI Classification Intelligence
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Model Prediction</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{complaint.ai_predicted_category || complaint.category}</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium">Confidence Score</span>
                  <span className="font-bold text-indigo-600">{Math.round((complaint.ai_confidence || 0) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${Math.round((complaint.ai_confidence || 0) * 100)}%` }}
                  />
                </div>
              </div>

              {complaint.requires_human_review && (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Flagged for Human Review (uncertain prediction)</span>
                </div>
              )}

              {/* Extracted Locations */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Extracted Entities</span>
                <div className="mt-2 space-y-1.5">
                  {complaint.extracted_locations?.length > 0 ? (
                    complaint.extracted_locations.map((loc) => (
                      <div key={loc.id} className="p-2 bg-slate-50 rounded border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800">{loc.raw_mention}</span>
                          <span className="text-[10px] text-slate-400 block">{loc.entity_type} ({loc.resolution_source})</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          loc.is_geocoded ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {loc.is_geocoded ? 'Geocoded' : 'Unresolved'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No specific landmark extracted.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Semantically Similar Complaints */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Similar Grievances (SentenceTransformers)
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {complaint.similar_complaints?.length > 0 ? (
                complaint.similar_complaints.map((sim) => (
                  <div
                    key={sim.complaint_id}
                    onClick={() => navigate(`/complaints/${sim.complaint_id}`)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-indigo-600">{sim.reference_no}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {Math.round(sim.similarity_score * 100)}% Sim
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{sim.title}</p>
                    <div className="flex flex-wrap gap-1 text-[10px] text-slate-500">
                      {sim.distance_meters !== null && (
                        <span className="bg-slate-100 px-1.5 py-0.2 rounded font-medium text-slate-600">
                          {Math.round(sim.distance_meters)}m away
                        </span>
                      )}
                      <span className="bg-slate-100 px-1.5 py-0.2 rounded font-medium text-slate-600">
                        {sim.category}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No similar complaints above correlation threshold.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Grievance Status"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Lifecycle Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Officer Remediation Notes</label>
            <textarea
              rows={3}
              placeholder="Document inspection findings, crew dispatch, or resolution outcome..."
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={statusSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              {statusSubmitting ? "Updating..." : "Commit Status Change"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reclassify Modal */}
      <Modal
        isOpen={isReclassifyModalOpen}
        onClose={() => setIsReclassifyModalOpen(false)}
        title="Override AI Category Prediction"
      >
        <form onSubmit={handleReclassify} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Correct Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              {CIVIC_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Correction Rationale <span className="text-rose-500">*</span></label>
            <textarea
              required
              rows={3}
              placeholder="Explain why the AI prediction was inaccurate (saved for model retraining dataset)..."
              value={reclassifyReason}
              onChange={(e) => setReclassifyReason(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReclassifyModalOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reclassifySubmitting}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              {reclassifySubmitting ? "Saving Correction..." : "Save Human Correction"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
