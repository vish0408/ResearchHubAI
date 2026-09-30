// import { ChangeEvent, useEffect, useRef, useState } from "react";
// import { Camera, Save } from "lucide-react";
// import Card from "../../components/common/Card";
// import SectionHead from "../../components/common/SectionHead";
// import { useApp } from "../../context/AppContext";
// import { studentService } from "../../services/StudentService";
// import { StudentProfileDto } from "../../types/Student";

// export default function StudentProfileEdit() {
//   const { setScreen } = useApp();

//   const [profile, setProfile] = useState<StudentProfileDto | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [uploadingPhoto, setUploadingPhoto] = useState(false);
//   const [error, setError] = useState("");

//   const fileInputRef = useRef<HTMLInputElement | null>(null);

//   useEffect(() => {
//     studentService
//       .getProfile()
//       .then(setProfile)
//       .catch(() => {
//         setError("Unable to load profile.");
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   const updateField = (
//     field: keyof StudentProfileDto,
//     value: string
//   ) => {
//     setProfile((current) =>
//       current
//         ? {
//             ...current,
//             [field]: value,
//           }
//         : null
//     );
//   };

//   // ==============================
//   // PROFILE PHOTO
//   // ==============================

//   const handlePhotoClick = () => {
//     fileInputRef.current?.click();
//   };

//   const handlePhotoChange = async (
//     event: ChangeEvent<HTMLInputElement>
//   ) => {
//     const file = event.target.files?.[0];

//     if (!file) return;

//     const allowedTypes = [
//       "image/jpeg",
//       "image/jpg",
//       "image/png",
//       "image/webp",
//     ];

//     if (!allowedTypes.includes(file.type)) {
//       setError("Please select a JPG, JPEG, PNG or WEBP image.");
//       event.target.value = "";
//       return;
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       setError("Profile picture must be less than 5 MB.");
//       event.target.value = "";
//       return;
//     }

//     try {
//       setUploadingPhoto(true);
//       setError("");

//       const updatedProfile =
//         await studentService.uploadProfilePicture(file);

//       setProfile(updatedProfile);
//     } catch (err) {
//       setError(
//         err instanceof Error
//           ? err.message
//           : "Failed to upload profile picture."
//       );
//     } finally {
//       setUploadingPhoto(false);
//       event.target.value = "";
//     }
//   };

//   // ==============================
//   // SAVE PROFILE
//   // ==============================

//   const handleSave = async () => {
//     if (!profile) return;

//     setSaving(true);
//     setError("");

//     try {
//       const updatedProfile =
//         await studentService.updateProfile({
//           fullName: profile.fullName,
//           email: profile.email,
//           enrollment: profile.enrollment,
//           department: profile.department,
//           institution: profile.institution,
//           researchTopic: profile.researchTopic,
//         });

//       setProfile(updatedProfile);
//       setScreen("profile");
//     } catch {
//       setError("Failed to update profile. Please try again.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ==============================
//   // LOADING
//   // ==============================

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   // ==============================
//   // PROFILE NOT FOUND
//   // ==============================

//   if (!profile) {
//     return (
//       <div className="max-w-xl mx-auto pb-6">
//         <Card>
//           <div className="py-10 text-center text-muted-foreground">
//             {error || "Profile not found."}
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-2xl mx-auto pb-8">
//       <Card>

//         {/* =========================================
//             PERSONAL INFORMATION
//         ========================================= */}

//         <div className="mb-7">
//           <SectionHead title="Personal Information" />

//           {/* Profile Photo */}

//           <div className="flex items-center gap-4 mt-5">

//             <div className="relative shrink-0">

//               <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-sm">

//                 {profile.profilePictureUrl ? (
//                   <img
//                     src={
//                       profile.profilePictureUrl.startsWith("http")
//                         ? profile.profilePictureUrl
//                         : `http://localhost:5168/uploads/${profile.profilePictureUrl}`
//                     }
//                     alt={profile.fullName || "Student"}
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   profile.fullName
//                     ?.charAt(0)
//                     ?.toUpperCase() || "S"
//                 )}

//               </div>

//               {/* Camera Button */}

//               <button
//                 type="button"
//                 onClick={handlePhotoClick}
//                 disabled={uploadingPhoto}
//                 className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
//                 aria-label="Change profile picture"
//               >
//                 <Camera className="w-3.5 h-3.5" />
//               </button>

//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/jpeg,image/jpg,image/png,image/webp"
//                 onChange={handlePhotoChange}
//                 className="hidden"
//               />

//             </div>

//             <div className="min-w-0">
//               <p className="text-sm font-semibold text-foreground">
//                 {profile.fullName || "Student"}
//               </p>
//             </div>

//           </div>

//           {/* Name + Email */}

//           <div className="flex flex-col gap-3 mt-5">

//             <FormField
//               label="Full Name"
//               value={profile.fullName || ""}
//               onChange={(value) =>
//                 updateField("fullName", value)
//               }
//             />

//             <FormField
//               label="Email"
//               value={profile.email || ""}
//               onChange={(value) =>
//                 updateField("email", value)
//               }
//             />

//           </div>
//         </div>

//         {/* =========================================
//             ACADEMIC INFORMATION
//         ========================================= */}

//         <div className="border-t border-border pt-6">

//           <SectionHead title="Academic Information" />

//           <div className="flex flex-col gap-3 mt-4">

//             <FormField
//               label="Enrollment Number"
//               value={profile.enrollment || ""}
//               onChange={(value) =>
//                 updateField("enrollment", value)
//               }
//             />

//             <FormField
//               label="Department"
//               value={profile.department || ""}
//               onChange={(value) =>
//                 updateField("department", value)
//               }
//             />

//             <FormField
//               label="Institution"
//               value={profile.institution || ""}
//               onChange={(value) =>
//                 updateField("institution", value)
//               }
//             />

//             <FormField
//               label="Research Topic"
//               value={profile.researchTopic || ""}
//               onChange={(value) =>
//                 updateField("researchTopic", value)
//               }
//             />

//             <FormField
//               label="Guide"
//               value={profile.guideName || "Not assigned"}
//               disabled
//             />

//           </div>
//         </div>

//         {/* =========================================
//             ERROR
//         ========================================= */}

//         {error && (
//           <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//             {error}
//           </div>
//         )}

//         {/* =========================================
//             SAVE
//         ========================================= */}

//         <button
//           type="button"
//           onClick={handleSave}
//           disabled={saving || uploadingPhoto}
//           className="mt-5 w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
//         >
//           <Save className="w-4 h-4" />

//           {saving ? "Saving..." : "Save Changes"}
//         </button>

//       </Card>
//     </div>
//   );
// }


// /* =========================================================
//    EDITABLE FORM FIELD

//    Outside StudentProfileEdit so input focus is preserved
// ========================================================= */

// function FormField({
//   label,
//   value,
//   onChange,
//   disabled = false,
// }: {
//   label: string;
//   value: string;
//   onChange?: (value: string) => void;
//   disabled?: boolean;
// }) {
//   return (
//     <div>
//       <label className="block text-xs font-semibold text-foreground mb-1">
//         {label}
//       </label>

//       <input
//         type="text"
//         value={value}
//         disabled={disabled}
//         onChange={(e) => onChange?.(e.target.value)}
//         className={`w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors ${
//           disabled
//             ? "bg-muted text-muted-foreground cursor-not-allowed"
//             : "bg-muted/60 text-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//         }`}
//       />
//     </div>
//   );
// }

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, Save } from "lucide-react";

import Card from "../../components/common/Card";
import SectionHead from "../../components/common/SectionHead";
import { useApp } from "../../context/AppContext";
import { studentService } from "../../services/StudentService";
import { StudentProfileDto } from "../../types/Student";

export default function StudentProfileEdit() {
  const { setScreen } = useApp();

  const [profile, setProfile] = useState<StudentProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ==============================
  // LOAD PROFILE
  // ==============================

  useEffect(() => {
    studentService
      .getProfile()
      .then(setProfile)
      .catch(() => {
        setError("Unable to load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  // ==============================
  // UPDATE FIELD
  // ==============================

  const updateField = (
    field: keyof StudentProfileDto,
    value: string
  ) => {
    setProfile((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : null
    );
  };

  // ==============================
  // PROFILE PHOTO
  // ==============================

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    // File type validation
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, JPEG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    // File size validation
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingPhoto(true);
      setError("");

      const updatedProfile =
        await studentService.uploadProfilePicture(file);

      setProfile(updatedProfile);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload profile picture."
      );
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  // ==============================
  // SAVE PROFILE
  // ==============================

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError("");

    try {
      const updatedProfile =
        await studentService.updateProfile({
          fullName: profile.fullName,
          email: profile.email,
          enrollment: profile.enrollment,
          department: profile.department,
          institution: profile.institution,
          researchTopic: profile.researchTopic,
        });

      setProfile(updatedProfile);

      // Go back to profile screen
      setScreen("profile");
    } catch {
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ==============================
  // PROFILE NOT FOUND
  // ==============================

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto pb-6">
        <Card>
          <div className="py-10 text-center text-muted-foreground">
            {error || "Profile not found."}
          </div>
        </Card>
      </div>
    );
  }

  // ==============================
  // MAIN UI
  // ==============================

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <Card>

        {/* =========================================
            PERSONAL INFORMATION
        ========================================= */}

        <div className="mb-7">
          <SectionHead title="Personal Information" />

          {/* Profile Photo */}

          <div className="flex items-center gap-4 mt-5">

            <div className="relative shrink-0">

              {/* Profile Image */}

              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-sm">

                {profile.profilePictureUrl ? (
                  <img
                    src={
                      profile.profilePictureUrl.startsWith("http")
                        ? profile.profilePictureUrl
                        : `http://localhost:5168/uploads/${profile.profilePictureUrl}`
                    }
                    alt={profile.fullName || "Student"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.fullName
                    ?.charAt(0)
                    ?.toUpperCase() || "S"
                )}

              </div>

              {/* Camera Button */}

              <button
                type="button"
                onClick={handlePhotoClick}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
                aria-label="Change profile picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              {/* Hidden File Input */}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />

            </div>

            {/* Student Name */}

            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {profile.fullName || "Student"}
              </p>

              {/* <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG or WEBP · Max 5 MB
              </p> */}
            </div>

          </div>

          {/* Name + Email */}

          <div className="flex flex-col gap-3 mt-5">

            <FormField
              label="Full Name"
              value={profile.fullName || ""}
              onChange={(value) =>
                updateField("fullName", value)
              }
            />

            <FormField
              label="Email"
              value={profile.email || ""}
              onChange={(value) =>
                updateField("email", value)
              }
            />

          </div>
        </div>

        {/* =========================================
            ACADEMIC INFORMATION
        ========================================= */}

        <div className="border-t border-border pt-6">

          <SectionHead title="Academic Information" />

          <div className="flex flex-col gap-3 mt-4">

            {/* Enrollment Number */}

            <FormField
              label="Enrollment Number"
              value={profile.enrollment || ""}
              onChange={(value) =>
                updateField("enrollment", value)
              }
            />

            {/* Department */}

            <FormField
              label="Department"
              value={profile.department || ""}
              onChange={(value) =>
                updateField("department", value)
              }
            />

            {/* Institution */}

            <FormField
              label="Institution"
              value={profile.institution || ""}
              onChange={(value) =>
                updateField("institution", value)
              }
            />

            {/* Research Topic */}

            <FormField
              label="Research Topic"
              value={profile.researchTopic || ""}
              onChange={(value) =>
                updateField("researchTopic", value)
              }
            />

            {/* Guide */}

            <FormField
              label="Guide"
              value={profile.guideName || "Not assigned"}
              disabled
            />

          </div>
        </div>

        {/* =========================================
            ERROR MESSAGE
        ========================================= */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =========================================
            SAVE BUTTON
        ========================================= */}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploadingPhoto}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />

          {saving ? "Saving..." : "Save Changes"}
        </button>

      </Card>
    </div>
  );
}


/* =========================================================
   EDITABLE FORM FIELD

   IMPORTANT:
   This is OUTSIDE StudentProfileEdit.
   So typing continuously works without losing focus.
========================================================= */

function FormField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1">
        {label}
      </label>

      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors ${
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-muted/60 text-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        }`}
      />
    </div>
  );
}