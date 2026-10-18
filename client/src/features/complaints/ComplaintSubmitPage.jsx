import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Sparkles, 
  MapPin, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  X,
  FileImage,
  Info
} from 'lucide-react';
import api from '../../api/client';
import { CIVIC_CATEGORIES, POPULAR_LOCALITIES } from '../../utils/constants';

export const ComplaintSubmitPage = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedResult, setSubmittedResult] = useState(null);

  // Quick prompt filler for rapid portfolio testing
  const fillSamplePrompt = (sampleTitle, sampleDesc, sampleLoc) => {
    setTitle(sampleTitle);
    setDescription(sampleDesc);
    setLocationText(sampleLoc);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size cannot exceed 5MB.");
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSelectLocality = (loc) => {
    setLocationText(loc.name);
    setLatitude(loc.lat);
    setLongitude(loc.lon);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 5) {
      setError("Please provide a title of at least 5 characters.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Please provide a detailed description of at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category || null,
        location_text: locationText.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        city: "Varanasi"
      };

      const res = await api.post('/complaints', payload);
      const createdComplaint = res.data;

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        try {
          await api.post(`/complaints/${createdComplaint.id}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (uploadErr) {
          console.warn("Attachment upload warning:", uploadErr);
        }
      }

      setSubmittedResult(createdComplaint);
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred while submitting your complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedResult) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 text-emerald-600">
          <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Grievance Registered Successfully</h2>
            <p className="text-xs text-slate-500">Your complaint has been processed through the CivicPulse AI pipeline.</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
            <span className="text-slate-500">Complaint Reference:</span>
            <span className="font-mono font-bold text-indigo-600 text-sm">{submittedResult.reference_no}</span>
          </div>
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
            <span className="text-slate-500">AI Assigned Category:</span>
            <span className="font-semibold text-slate-800">{submittedResult.category}</span>
          </div>
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
            <span className="text-slate-500">AI Model Confidence:</span>
            <span className="font-semibold text-slate-800">{Math.round((submittedResult.ai_confidence || 0) * 100)}%</span>
          </div>
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
            <span className="text-slate-500">Priority Assessment:</span>
            <span className="font-semibold text-slate-800 uppercase">{submittedResult.priority} ({submittedResult.priority_score} pts)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Geospatial Resolution:</span>
            <span className="font-semibold text-slate-800">
              {submittedResult.has_verified_coordinates
                ? `Verified (${submittedResult.latitude}, ${submittedResult.longitude})`
                : 'Text mention only (unresolved GPS)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/complaints/${submittedResult.id}`)}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Open Grievance Detail & Analysis →
          </button>
          <button
            onClick={() => {
              setSubmittedResult(null);
              setTitle('');
              setDescription('');
              setLocationText('');
              setSelectedFile(null);
            }}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            File Another Grievance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Register Citizen Grievance</h2>
        <p className="text-xs text-slate-500">Submit municipal infrastructure issues for automated NLP categorization and dispatch</p>
      </div>

      {/* Quick Test Samples Banner */}
      <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Quick Portfolio Samples (Click to autofill):
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => fillSamplePrompt(
              "Deep pothole near Lanka crossing",
              "There is a huge pothole near Lanka crossing in Varanasi. It has been there for weeks and two-wheelers are struggling to pass, causing minor accidents.",
              "Lanka crossing"
            )}
            className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md font-medium shadow-2xs transition-colors"
          >
            Lanka Crossing Pothole (Roads)
          </button>
          <button
            type="button"
            onClick={() => fillSamplePrompt(
              "Overflowing garbage container at Godowlia chowk",
              "Municipal garbage bin at Godowlia chowk is overflowing with rotten food waste. Foul smell spreading across shops.",
              "Godowlia chowk"
            )}
            className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md font-medium shadow-2xs transition-colors"
          >
            Godowlia Waste Overflow (Garbage)
          </button>
          <button
            type="button"
            onClick={() => fillSamplePrompt(
              "Sewage backflow in Sigra market lane",
              "Drainage manhole is clogged and overflowing black sewage water directly onto Sigra market lane.",
              "Sigra"
            )}
            className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md font-medium shadow-2xs transition-colors"
          >
            Sigra Drainage Leak (Sewage)
          </button>
          <button
            type="button"
            onClick={() => fillSamplePrompt(
              "Hanging live power wire near Pandeypur",
              "Overhead transformer wire has broken and is sparking intermittently near Pandeypur crossing. Electrocution hazard.",
              "Pandeypur crossing"
            )}
            className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md font-medium shadow-2xs transition-colors"
          >
            Pandeypur Sparking Cable (Electricity)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Grievance Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Deep road pothole near Lanka crossing"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe the severity, duration, and specific hazard of the issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="h-3 w-3" /> The AI pipeline will automatically parse named landmarks, hazard levels, and semantic vectors.
          </p>
        </div>

        {/* Category (Optional override) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Category (Optional — AI will classify automatically if left blank)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Auto-Detect via AI NLP Classifier</option>
            {CIVIC_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Location & Landmark */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Location, Landmark or Crossing
          </label>
          <input
            type="text"
            placeholder="e.g., Lanka crossing, Godowlia chowk, near Assi Ghat..."
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />

          {/* Quick Varanasi Localities Autocomplete */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 font-medium">Quick Landmarks:</span>
            {POPULAR_LOCALITIES.slice(0, 6).map((loc) => (
              <button
                key={loc.name}
                type="button"
                onClick={() => handleSelectLocality(loc)}
                className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Optional GPS Coordinates */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Latitude (Optional)
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 25.2798"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Longitude (Optional)
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 82.9996"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>
        </div>

        {/* Photo Upload Attachment */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Photo Evidence (Optional, max 5MB)
          </label>
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl p-4 text-center bg-slate-50/50 transition-colors">
            {previewUrl ? (
              <div className="relative inline-block">
                <img src={previewUrl} alt="Preview" className="h-32 object-cover rounded-lg border border-slate-200" />
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full shadow-xs hover:bg-rose-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-600 font-medium">Click to select photo or drag and drop</p>
                <p className="text-[10px] text-slate-400">PNG, JPG, or WEBP up to 5MB</p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            {submitting ? "Analyzing & Registering Grievance..." : "Submit Grievance to Municipal Authority"}
          </button>
        </div>
      </form>
    </div>
  );
};
