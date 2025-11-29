import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, XCircle, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { getCompanyById, createCompany, updateCompany } from "../../../controllers/companiesController.js";
import { getUserCookie } from "../../../utils/cookies.js";
import RichTextEditor from "../../shared/RichTextEditor.jsx";

const MAX_SHORT_DESCRIPTION = 150;

export default function CompanyForm({ redirectPath = "/admin/companies" }) {
  const navigate = useNavigate();
  const params = useParams();
  const companyId = params.companyId;
  const isEditing = Boolean(companyId);
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();

  const [form, setForm] = React.useState({
    name: "",
    category: "Broker",
    website: "",
    logo: "",
    details: "",
    description: "",
    status: "pending",
    promoCodes: [],
  });
  const [logoFile, setLogoFile] = React.useState(null);
  const [logoPreview, setLogoPreview] = React.useState("");
  const [images, setImages] = React.useState([]);
  const [imageFiles, setImageFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (isEditing && companyId) {
      loadCompany();
    }
  }, [companyId, isEditing]);

  async function loadCompany() {
    setLoading(true);
    try {
      const { data } = await getCompanyById(companyId);
      setForm({
        name: data.name || "",
        category: data.category || "Broker",
        website: data.website || "",
        logo: data.logo || "",
        details: data.details || "",
        description: data.description || "",
        status: data.status || "pending",
        promoCodes: data.promoCodes || [],
      });
      setLogoPreview(data.logo || "");
      setImages(data.images || []);
    } catch (error) {
      setError("Failed to load company: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleImagesChange(e) {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((prev) => [...prev, { url: e.target.result, file }]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleShortDescriptionChange(e) {
    const value = e.target.value;
    if (value.length <= MAX_SHORT_DESCRIPTION) {
      setForm({ ...form, details: value });
    }
  }

  function handleDescriptionChange(content) {
    setForm({ ...form, description: content });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (form.details.trim().length < 10) {
      setError("Short description must be at least 10 characters.");
      setSubmitting(false);
      return;
    }

    try {
      const companyData = {
        ...form,
        logo: logoFile || form.logo,
        images: imageFiles.length > 0 ? imageFiles : images.map((img) => img.url),
      };

      if (isEditing) {
        await updateCompany(companyId, companyData);
      } else {
        await createCompany(companyData);
      }
      navigate(redirectPath);
    } catch (error) {
      setError(error.message || "Failed to save company");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const shortDescLength = form.details.length;
  const shortDescRemaining = MAX_SHORT_DESCRIPTION - shortDescLength;

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-3xl border border-white/10 bg-gray-900/60 p-8 shadow-2xl">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest text-indigo-300">
              {isEditing ? "Edit company" : "Create company"}
            </p>
            <h1 className="text-3xl font-semibold mt-2">
              {isEditing ? "Update company" : "Add new company"}
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Company Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input input-bordered w-full border-white/10 bg-gray-950/40 text-white"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="select select-bordered w-full border-white/10 bg-gray-950/40 text-white"
                  required
                >
                  <option value="Broker">Broker</option>
                  <option value="PropFirm">Prop Firm</option>
                  <option value="Crypto">Crypto Exchange</option>
                </select>
              </div>

              {user?.role === "admin" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="select select-bordered w-full border-white/10 bg-gray-950/40 text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Website URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="input input-bordered w-full border-white/10 bg-gray-950/40 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Company Logo</label>
              <div className="rounded-2xl border border-dashed border-white/20 bg-gray-950/30 p-4">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-32 w-auto rounded-xl object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview("");
                      }}
                      className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-500/80 px-3 py-1 text-xs font-semibold text-white"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-white/10 bg-gray-900/50 px-6 py-10 text-center text-gray-400 hover:border-indigo-400/40">
                    <Upload className="h-6 w-6" />
                    <span>Upload logo (JPG/PNG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Short Description <span className="text-red-400">*</span>
                <span className="ml-2 text-xs text-gray-500">
                  ({shortDescLength} / {MAX_SHORT_DESCRIPTION} characters)
                </span>
              </label>
              <input
                type="text"
                value={form.details}
                onChange={handleShortDescriptionChange}
                className="input input-bordered w-full border-white/10 bg-gray-950/40 text-white"
                placeholder="Brief one-line description (max 150 characters)"
                required
                maxLength={MAX_SHORT_DESCRIPTION}
              />
              {shortDescRemaining < 20 && (
                <p className="text-xs text-yellow-400">
                  {shortDescRemaining} characters remaining
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Full Description</label>
              <RichTextEditor
                value={form.description}
                onChange={handleDescriptionChange}
                placeholder="Detailed description of the company..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Company Images</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img.url}
                      alt={`Company image ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full p-1"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/20 bg-gray-900/50 p-4 text-gray-400 hover:border-indigo-400/40">
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImagesChange}
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <button
                type="submit"
                className="btn btn-primary px-6"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update Company"
                ) : (
                  "Create Company"
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(redirectPath)}
                className="btn btn-secondary px-6"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
