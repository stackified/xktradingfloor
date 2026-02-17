import React from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Papa from "papaparse";

/**
 * RecipientUploader Component
 * Handles file selection and validation for email campaigns
 */
function RecipientUploader({ onFileSelect, onRemoveFile, maxFileSize = 10485760 }) {
    const [isDragging, setIsDragging] = React.useState(false);
    const [file, setFile] = React.useState(null);
    const [preview, setPreview] = React.useState(null);
    const [error, setError] = React.useState("");
    const fileInputRef = React.useRef(null);

    const validateFile = (file) => {
        const validExtensions = [".csv", ".xlsx", ".xls"];
        const fileName = file.name.toLowerCase();

        if (!validExtensions.some(ext => fileName.endsWith(ext))) {
            throw new Error("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
        }

        if (file.size > maxFileSize) {
            throw new Error(
                `File size exceeds ${(maxFileSize / 1024 / 1024).toFixed(1)}MB limit`
            );
        }

        return true;
    };

    const parseCSVPreview = (file) => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                preview: 5,
                complete: (results) => {
                    if (!results.data || results.data.length === 0) {
                        resolve(null);
                        return;
                    }
                    resolve({
                        sampleRows: results.data,
                        headers: Object.keys(results.data[0] || {}),
                    });
                },
                error: (error) => {
                    reject(new Error(`Failed to parse CSV preview: ${error.message}`));
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

            if (selectedFile.name.toLowerCase().endsWith(".csv")) {
                const previewData = await parseCSVPreview(selectedFile);
                setPreview(previewData);
            }

            onFileSelect(selectedFile);
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

    const handleRemove = () => {
        setFile(null);
        setPreview(null);
        setError("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onRemoveFile();
    };

    return (
        <div className="space-y-4">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                    }
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="recipient-upload"
                />

                {!file ? (
                    <label
                        htmlFor="recipient-upload"
                        className="cursor-pointer flex flex-col items-center gap-4"
                    >
                        <div className="p-4 bg-gray-800 rounded-full">
                            <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                            <p className="text-white font-medium mb-1">
                                Drag & drop CSV/Excel file here, or click to browse
                            </p>
                            <p className="text-sm text-gray-400">
                                Supported formats: CSV, XLSX, XLS (max 10MB)
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
                            >
                                <X className="w-5 h-5 text-gray-400 hover:text-red-400" />
                            </button>
                        </div>

                        {preview && (
                            <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    <span className="text-sm font-medium text-white">
                                        Preview (first 5 rows)
                                    </span>
                                </div>
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
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}

export default RecipientUploader;
