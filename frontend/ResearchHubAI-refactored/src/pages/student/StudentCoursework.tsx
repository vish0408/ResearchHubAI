import { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  Clock,
  Download,
  FileText,
  Plus,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import { studentService } from "../../services/StudentService";
import type { StudentCoursework } from "../../types/Student";

const COURSE_TYPES = [
  "Online Course",
  "Certification",
  "Workshop",
  "Training",
  "MOOC",
  "Other",
];

const emptyForm = {
  courseName: "",
  courseCode: "",
  courseType: "",
  credits: "",
  institution: "",
  description: "",
  startDate: "",
  completionDate: "",
};

export default function StudentCoursework() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [coursework, setCoursework] = useState<StudentCoursework[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [certificate, setCertificate] = useState<File | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCoursework();
  }, []);

  const loadCoursework = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await studentService.getMyCoursework();
      setCoursework(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load coursework"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setCertificate(null);
    setEditingId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddCoursework = () => {
    resetForm();
    setError("");
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setError("");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCertificateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      setCertificate(null);
      return;
    }

    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowed.includes(file.type)) {
      setError("Only PDF, JPG, JPEG, and PNG files are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Certificate file size cannot exceed 10 MB.");
      e.target.value = "";
      return;
    }

    setError("");
    setCertificate(file);
  };

  const validateForm = () => {
    if (!form.courseName.trim()) {
      return "Course name is required.";
    }

    if (!form.courseType) {
      return "Course type is required.";
    }

    if (
      !form.credits ||
      Number(form.credits) <= 0
    ) {
      return "Credits must be greater than zero.";
    }

    if (!form.completionDate) {
      return "Completion date is required.";
    }

    if (!editingId && !certificate) {
      return "Course certificate is required.";
    }

    return "";
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const data = {
        courseName: form.courseName.trim(),
        courseCode: form.courseCode.trim() || undefined,
        courseType: form.courseType,
        credits: Number(form.credits),
        institution:
          form.institution.trim() || undefined,
        description:
          form.description.trim() || undefined,
        startDate:
          form.startDate || undefined,
        completionDate: form.completionDate,
        ...(certificate
          ? { certificate }
          : {}),
      };

      let result: StudentCoursework;

      if (editingId) {
        result =
          await studentService.updateStudentCoursework(
            editingId,
            data
          );
      } else {
        result =
          await studentService.createStudentCoursework({
            ...data,
            certificate: certificate!,
          });
      }

      setCoursework((prev) => {
        if (editingId) {
          return prev.map((item) =>
            item.id === result.id
              ? result
              : item
          );
        }

        return [result, ...prev];
      });

      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save coursework"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (
    item: StudentCoursework
  ) => {
    setEditingId(item.id);

    setForm({
      courseName: item.courseName,
      courseCode: item.courseCode || "",
      courseType: item.courseType,
      credits: item.credits.toString(),
      institution: item.institution || "",
      description: item.description || "",
      startDate: item.startDate
        ? item.startDate.substring(0, 10)
        : "",
      completionDate:
        item.completionDate.substring(0, 10),
    });

    setCertificate(null);
    setError("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (
    id: string
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this coursework?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await studentService.deleteStudentCoursework(id);

      setCoursework((prev) =>
        prev.filter((item) => item.id !== id)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete coursework"
      );
    }
  };

  const handleDownload = async (
    item: StudentCoursework
  ) => {
    try {
      setError("");

      const result =
        await studentService
          .downloadStudentCourseworkCertificate(
            item.id
          );

      const url = URL.createObjectURL(
        result.data
      );

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        result.fileName ||
        item.certificateFileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to download certificate"
      );
    }
  };

  const getStatus = (
    status: StudentCoursework["status"]
  ) => {
    switch (status) {
      case "Approved":
        return {
          label: "Approved",
          icon: CheckCircle,
          className:
            "bg-green-50 text-green-700 border-green-200",
        };

      case "Rejected":
        return {
          label: "Rejected",
          icon: XCircle,
          className:
            "bg-red-50 text-red-700 border-red-200",
        };

      default:
        return {
          label: "Pending Review",
          icon: Clock,
          className:
            "bg-amber-50 text-amber-700 border-amber-200",
        };
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Student Coursework
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Submit your completed courses and certificates
            for guide review.
          </p>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={handleAddCoursework}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus size={17} />
            Add Coursework
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

      {/* Inline Form */}
      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 p-1"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {editingId
                    ? "Update Coursework"
                    : "Add Coursework"}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {editingId
                    ? "Update the rejected coursework and resubmit it for review."
                    : "Upload your certificate and provide the course details."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Certificate */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Course Certificate{" "}
                {!editingId && (
                  <span className="text-red-500">*</span>
                )}
              </label>

              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                 <button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition hover:bg-primary/20 cursor-pointer"
>
  <Upload size={20} />
</button>

                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {certificate
                        ? certificate.name
                        : editingId
                        ? "Choose a new certificate (optional)"
                        : "Upload course certificate"}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF, JPG, JPEG or PNG · Maximum 10 MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    Choose File
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={
                      handleCertificateChange
                    }
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Course Details */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                Course Details
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Course Name"
                  name="courseName"
                  value={form.courseName}
                  onChange={handleChange}
                  required
                />

                <FormInput
                  label="Course Code"
                  name="courseCode"
                  value={form.courseCode}
                  onChange={handleChange}
                />

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Course Type{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="courseType"
                    value={form.courseType}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="">
                      Select course type
                    </option>

                    {COURSE_TYPES.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <FormInput
                  label="Credits"
                  name="credits"
                  type="number"
                  min="1"
                  value={form.credits}
                  onChange={handleChange}
                  required
                />

                <FormInput
                  label="Institution / Provider"
                  name="institution"
                  value={form.institution}
                  onChange={handleChange}
                />

                <FormInput
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                />

                <FormInput
                  label="Completion Date"
                  name="completionDate"
                  type="date"
                  value={form.completionDate}
                  onChange={handleChange}
                  required
                />

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Briefly describe the course..."
                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    {editingId
                      ? "Resubmit Coursework"
                      : "Submit Coursework"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Existing Coursework */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            My Submissions
          </h2>

          {!loading && (
            <span className="text-xs text-muted-foreground">
              {coursework.length} submission
              {coursework.length !== 1
                ? "s"
                : ""}
            </span>
          )}
        </div>

        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <RefreshCw
                size={18}
                className="mr-2 animate-spin"
              />
              Loading coursework...
            </div>
          </Card>
        ) : coursework.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <FileText size={22} />
              </div>

              <h3 className="text-sm font-semibold text-foreground">
                No coursework submitted
              </h3>

              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Add your completed course and certificate
                to send it to your guide for review.
              </p>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {coursework.map((item) => {
              const status =
                getStatus(item.status);

              const StatusIcon = status.icon;

              return (
                <Card key={item.id}>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">
                            {item.courseName}
                          </h3>

                          <Badge>
                            <span className="inline-flex items-center gap-1">
                              <StatusIcon
                                size={13}
                              />
                              {status.label}
                            </span>
                          </Badge>
                        </div>

                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {item.courseCode && (
                            <span>
                              Code:{" "}
                              {item.courseCode}
                            </span>
                          )}

                          <span>
                            Type:{" "}
                            {item.courseType}
                          </span>

                          <span>
                            Credits:{" "}
                            {item.credits}
                          </span>

                          {item.institution && (
                            <span>
                              Provider:{" "}
                              {item.institution}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(item)
                        }
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <Download size={15} />
                        Certificate
                      </button>
                    </div>

                    {item.description && (
                      <p className="text-xs leading-5 text-muted-foreground">
                        {item.description}
                      </p>
                    )}

                    {item.status ===
                      "Rejected" &&
                      item.guideFeedback && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                          <p className="text-xs font-semibold text-red-700">
                            Guide Feedback
                          </p>

                          <p className="mt-1 text-xs leading-5 text-red-700">
                            {item.guideFeedback}
                          </p>
                        </div>
                      )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground">
                        Submitted{" "}
                        {new Date(
                          item.createdAt
                        ).toLocaleDateString()}
                      </p>

                      {item.status ===
                        "Rejected" && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(item)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
                          >
                            <RefreshCw
                              size={14}
                            />
                            Update & Resubmit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                item.id
                              )
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      {item.status ===
                        "Pending" && (
                        <span className="text-xs text-amber-600">
                          Waiting for guide review
                        </span>
                      )}

                      {item.status ===
                        "Approved" && (
                        <span className="text-xs text-green-600">
                          Coursework approved
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FormInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  min,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  type?: string;
  required?: boolean;
  min?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground">
        {label}{" "}
        {required && (
          <span className="text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}