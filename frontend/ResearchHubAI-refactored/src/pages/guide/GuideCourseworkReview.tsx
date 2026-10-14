
import { useEffect, useState } from "react";
import {
  CheckCircle,
  GraduationCap,
  RefreshCw,
  XCircle,
  Eye,
  Download,
} from "lucide-react";
import Card from "../../components/common/Card";
import SectionHead from "../../components/common/SectionHead";
import { guideService } from "../../services/GuideService";
import type { StudentCoursework } from "../../types/Student";

export default function GuideCourseworkReview() {
  const [items, setItems] = useState<StudentCoursework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function loadCoursework() {
    setLoading(true);
    setError("");

    try {
      const data = await guideService.getPendingCoursework();
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load pending coursework."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCoursework();
  }, []);

  
async function reviewItem(
  item: StudentCoursework,
  status: "Approved" | "Rejected"
) {
  const itemFeedback = feedback[item.id]?.trim() || "";

  // Feedback is mandatory only when rejecting
  if (status === "Rejected" && !itemFeedback) {
    setError("Please enter feedback before rejecting coursework.");
    return;
  }

  setSubmitting(item.id);
  setError("");

  try {
    await guideService.reviewCoursework(item.id, {
      status,
      feedback: itemFeedback,
    });

    setItems((current) =>
      current.filter((coursework) => coursework.id !== item.id)
    );

    setFeedback((current) => {
      const updated = { ...current };
      delete updated[item.id];
      return updated;
    });
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to submit coursework review."
    );
  } finally {
    setSubmitting(null);
  }
}

  async function openCertificate(item: StudentCoursework) {
  setError("");

  try {
    const result = await guideService.downloadCourseworkCertificate(item.id);

    const blob =
      result.data instanceof Blob
        ? result.data
        : new Blob([result.data]);

    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to open certificate."
    );
  }
}

async function downloadCertificate(item: StudentCoursework) {
  setError("");

  try {
    const result = await guideService.downloadCourseworkCertificate(item.id);

    const blob =
      result.data instanceof Blob
        ? result.data
        : new Blob([result.data]);

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.certificateFileName || "certificate";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to download certificate."
    );
  }
}

  return (
    <div className="space-y-6">
      <SectionHead
        title="Coursework Review"
        // subtitle="Review coursework submitted by your assigned students."
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {items.length} pending submission{items.length === 1 ? "" : "s"}
        </p>

        <button
          type="button"
          onClick={() => void loadCoursework()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <p className="py-6 text-center text-sm text-gray-500">
            Loading coursework submissions...
          </p>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <GraduationCap size={36} className="text-gray-400" />
            <h3 className="font-semibold">No pending coursework</h3>
            <p className="text-sm text-gray-500">
              New submissions from your assigned students will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.courseName}
                    </h3>
                    {item.courseCode && (
                      <p className="mt-1 text-sm text-gray-500">
                        Course code: {item.courseCode}
                      </p>
                    )}
                  </div>

                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    Pending
                  </span>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-gray-500">Type: </span>
                    {item.courseType}
                  </p>
                  <p>
                    <span className="text-gray-500">Credits: </span>
                    {item.credits}
                  </p>
                  <p>
                    <span className="text-gray-500">Institution: </span>
                    {item.institution || "Not specified"}
                  </p>
                  <p>
                    <span className="text-gray-500">Completed: </span>
                    {item.completionDate
                      ? new Date(item.completionDate).toLocaleDateString()
                      : "Not specified"}
                  </p>
                </div>

                {item.description && (
                  <p className="whitespace-pre-wrap text-sm text-gray-600">
                    {item.description}
                  </p>
                )}


                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
  <div className="min-w-0">
    <p className="text-sm font-medium">Certificate</p>
    <p className="break-all text-sm text-gray-500">
      {item.certificateFileName || "Certificate file"}
    </p>
  </div>

  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => void openCertificate(item)}
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
    >
      <Eye size={16} />
      View
    </button>

    <button
      type="button"
      onClick={() => void downloadCertificate(item)}
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
    >
      <Download size={16} />
      Download
    </button>
  </div>
</div>

                <div>
                  <label
                    htmlFor={`feedback-${item.id}`}
                    className="mb-2 block text-sm font-medium"
                  >
                    Guide feedback
                  </label>
                  <textarea
                    id={`feedback-${item.id}`}
                    value={feedback[item.id] || ""}
                    onChange={(event) =>
                      setFeedback((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Enter feedback (required when rejecting)..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => void reviewItem(item, "Rejected")}
                    disabled={submitting !== null}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    {submitting === item.id ? "Submitting..." : "Reject"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void reviewItem(item, "Approved")}
                    disabled={submitting !== null}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {submitting === item.id ? "Submitting..." : "Approve"}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}