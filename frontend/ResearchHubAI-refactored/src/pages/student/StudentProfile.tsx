// import { useEffect, useState } from "react";
// // import {
// //   Building2,
// //   Mail,
// //   Pencil,
// //   Save,
// //   UserRound,
// // } from "lucide-react";
// import Card from "../../components/common/Card";
// import SectionHead from "../../components/common/SectionHead";
// import { useApp } from "../../context/AppContext";
// import { studentService } from "../../services/StudentService";
// import { StudentProfileDto } from "../../types/Student";

// export default function StudentProfile() {
//   const { setScreen } = useApp();

//   const [profile, setProfile] = useState<StudentProfileDto | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     studentService
//       .getProfile()
//       .then(setProfile)
//       .catch(() => {})
//       .finally(() => setLoading(false));
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (!profile) {
//     return (
//       <div className="max-w-2xl mx-auto">
//         <Card>
//           <div className="py-10 text-center text-muted-foreground">
//             Unable to load profile information.
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-2xl mx-auto pb-8">
//       <Card>
//         {/* Profile Header */}
//         <div className="flex items-center gap-5 pb-6">
//         <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-sm">
//   {profile.profilePictureUrl ? (
//     <img
//       src={
//         profile.profilePictureUrl.startsWith("http")
//           ? profile.profilePictureUrl
//           : `http://localhost:5168/uploads/${profile.profilePictureUrl}`
//       }
//       alt={profile.fullName || "Student"}
//       className="w-full h-full object-cover"
//       onError={(e) => {
//         e.currentTarget.style.display = "none";
//       }}
//     />
//   ) : (
//     profile.fullName?.charAt(0)?.toUpperCase() || "S"
//   )}
// </div>

//           <div className="min-w-0">
//             <h1 className="text-2xl font-bold text-foreground">
//               {profile.fullName || "Student"}
//             </h1>

//             <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
//               <Mail className="w-4 h-4 shrink-0" />
//               {profile.email}
//             </p>
//           </div>
//         </div>

//         {/* Academic Information */}
//         <div className="border-t border-border pt-6">
//           <SectionHead title="Academic Information" />

//           <div className="flex flex-col gap-5 mt-5">
//             <ProfileField
//               icon={<UserRound className="w-4 h-4" />}
//               label="Enrollment Number"
//               value={profile.enrollment}
//             />

//             <ProfileField
//               icon={<Building2 className="w-4 h-4" />}
//               label="Department"
//               value={profile.department}
//             />

//             <ProfileField
//               icon={<Building2 className="w-4 h-4" />}
//               label="Institution"
//               value={profile.institution}
//             />

//             <ProfileField
//               icon={<Building2 className="w-4 h-4" />}
//               label="Research Topic"
//               value={profile.researchTopic}
//             />

//             <ProfileField
//               icon={<UserRound className="w-4 h-4" />}
//               label="Guide"
//               value={profile.guideName || "Not assigned"}
//             />
//           </div>
//         </div>

//         {/* Edit Profile Button */}
//         <button
//           onClick={() => setScreen("edit-profile")}
//           className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-bold text-white transition-colors"
//         >
//           <Pencil className="w-4 h-4" />
//           Edit Profile
//         </button>
//       </Card>
//     </div>
//   );
// }

// /* =========================================================
//    PROFILE FIELD
// ========================================================= */

// function ProfileField({
//   icon,
//   label,
//   value,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   value?: string | null;
// }) {
//   return (
//     <div>
//       <div className="flex items-center gap-2 mb-2">
//         <span className="text-muted-foreground">{icon}</span>

//         <label className="text-sm font-semibold text-foreground">
//           {label}
//         </label>
//       </div>

//       <div className="w-full rounded-xl border border-border bg-muted/60 px-4 py-3 text-base text-foreground">
//         {value || "Not provided"}
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import {
  Building2,
  Mail,
  Pencil,
  UserRound,
} from "lucide-react";

import Card from "../../components/common/Card";
import SectionHead from "../../components/common/SectionHead";
import { useApp } from "../../context/AppContext";
import { studentService } from "../../services/StudentService";
import { StudentProfileDto } from "../../types/Student";

export default function StudentProfile() {
  const { setScreen } = useApp();

  const [profile, setProfile] = useState<StudentProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService
      .getProfile()
      .then((data) => {
        console.log("PROFILE DATA:", data);
        setProfile(data);
      })
      .catch((error) => {
        console.error("PROFILE ERROR:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="py-10 text-center text-muted-foreground">
            Unable to load profile information.
          </div>
        </Card>
      </div>
    );
  }

  const profileImageUrl = profile.profilePictureUrl
    ? profile.profilePictureUrl.startsWith("http")
      ? profile.profilePictureUrl
      : `http://localhost:5168/uploads/${profile.profilePictureUrl}`
    : null;

  console.log("PROFILE IMAGE URL:", profileImageUrl);

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <Card>

        {/* Profile Header */}
        <div className="flex items-center gap-5 pb-6">

          {/* Profile Picture */}
          <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-sm">

            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={profile.fullName || "Student"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(
                    "IMAGE LOAD FAILED:",
                    profileImageUrl
                  );

                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              profile.fullName?.charAt(0)?.toUpperCase() || "S"
            )}

          </div>

          {/* Name & Email */}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">
              {profile.fullName || "Student"}
            </h1>

            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0" />
              {profile.email}
            </p>
          </div>
        </div>

        {/* Academic Information */}
        <div className="border-t border-border pt-6">
          <SectionHead title="Academic Information" />

          <div className="flex flex-col gap-5 mt-5">

            <ProfileField
              icon={<UserRound className="w-4 h-4" />}
              label="Enrollment Number"
              value={profile.enrollment}
            />

            <ProfileField
              icon={<Building2 className="w-4 h-4" />}
              label="Department"
              value={profile.department}
            />

            <ProfileField
              icon={<Building2 className="w-4 h-4" />}
              label="Institution"
              value={profile.institution}
            />

            <ProfileField
              icon={<Building2 className="w-4 h-4" />}
              label="Research Topic"
              value={profile.researchTopic}
            />

            <ProfileField
              icon={<UserRound className="w-4 h-4" />}
              label="Guide"
              value={profile.guideName || "Not assigned"}
            />

          </div>
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={() => setScreen("edit-profile")}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-bold text-white transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Edit Profile
        </button>

      </Card>
    </div>
  );
}

/* =========================================================
   PROFILE FIELD
========================================================= */

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-muted-foreground">
          {icon}
        </span>

        <label className="text-sm font-semibold text-foreground">
          {label}
        </label>
      </div>

      <div className="w-full rounded-xl border border-border bg-muted/60 px-4 py-3 text-base text-foreground">
        {value || "Not provided"}
      </div>
    </div>
  );
}