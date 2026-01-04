import React from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Papa from "papaparse";

/**
 * CSVUploader Component
 * Handles CSV file upload, validation, and parsing
 */
function CSVUploader({ onUploadSuccess, onUploadError, maxFileSize = 10485760 }) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [error, setError] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);

  // Expected CSV columns from Whop export
  const expectedColumns = [
    "Id",
    "Name",
    "Email",
    "Whop ID",
    "Plan",
    "Discord username",
    "Discord ID",
    "Subscription status",
    "Total spend (in USD)",
    "Joined at",
    "Whop title",
    "Plan type",
  ];

  const validateFile = (file) => {
    // Check file type
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      throw new Error("Please upload a CSV file (.csv)");
    }

    // Check file size
    if (file.size > maxFileSize) {
      throw new Error(
        `File size exceeds ${(maxFileSize / 1024 / 1024).toFixed(1)}MB limit`
      );
    }

    return true;
  };

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors);
          }

          if (!results.data || results.data.length === 0) {
            reject(new Error("CSV file is empty or has no valid data"));
            return;
          }

          // Validate required columns
          const headers = Object.keys(results.data[0] || {});
          const hasEmail = headers.some((h) =>
            h.toLowerCase().includes("email")
          );

          if (!hasEmail) {
            reject(new Error("CSV file must contain an 'Email' column"));
            return;
          }

          resolve(results.data);
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        },
      });
    });
  };

  const handleFileSelect = async (selectedFile) => {
    setError("");
    setPreview(null);

    try {
      validateFile(selectedFile);
      setFile(selectedFile);

      // Parse and preview first 5 rows
      const data = await parseCSV(selectedFile);
      setPreview({
        totalRows: data.length,
        sampleRows: data.slice(0, 5),
        headers: Object.keys(data[0] || {}),
      });
    } catch (err) {
      setError(err.message);
      setFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      // Import the controller function
      const { uploadCSV } = await import(
        "../../../controllers/emailCampaignController.js"
      );

      const result = await uploadCSV(file);
      onUploadSuccess(result);
      
      // Reset state
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      const errorMessage = err.message || "Failed to upload CSV file";
      setError(errorMessage);
      onUploadError?.(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileInputChange}
          className="hidden"
          id="csv-upload"
        />

        {!file ? (
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            <div className="p-4 bg-gray-800 rounded-full">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-white font-medium mb-1">
                Drag & drop CSV file here, or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Supported format: CSV (max {(maxFileSize / 1024 / 1024).toFixed(1)}MB)
              </p>
            </div>
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-6 h-6 text-blue-400" />
              <div className="flex-1 text-left">
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-sm text-gray-400">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={handleRemove}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                disabled={isUploading}
              >
                <X className="w-5 h-5 text-gray-400 hover:text-red-400" />
              </button>
            </div>

            {/* Preview */}
            {preview && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white">
                    CSV parsed successfully
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Found {preview.totalRows} rows
                </p>

                {/* Sample Data Table */}
                {preview.sampleRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-700">
                          {preview.headers.slice(0, 5).map((header) => (
                            <th
                              key={header}
                              className="px-2 py-2 text-left text-gray-400 font-medium"
                            >
                              {header}
                            </th>
                          ))}
                          {preview.headers.length > 5 && (
                            <th className="px-2 py-2 text-left text-gray-400 font-medium">
                              ...
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sampleRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-800 hover:bg-gray-800/50"
                          >
                            {preview.headers.slice(0, 5).map((header) => (
                              <td
                                key={header}
                                className="px-2 py-2 text-gray-300 truncate max-w-[150px]"
                                title={row[header]}
                              >
                                {row[header] || "-"}
                              </td>
                            ))}
                            {preview.headers.length > 5 && (
                              <td className="px-2 py-2 text-gray-500">...</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload CSV
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default CSVUploader;

