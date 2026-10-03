// export default function Avatar({ name, size="md", bg }: { name:string; size?:"xs"|"sm"|"md"|"lg"; bg?:string }) {
//   const sz = {xs:"w-6 h-6 text-xs",sm:"w-8 h-8 text-xs",md:"w-9 h-9 text-sm",lg:"w-12 h-12 text-base"};
//   const colors = ["bg-blue-500","bg-indigo-500","bg-cyan-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-violet-500","bg-teal-500"];
//   const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
//   return <div className={`${sz[size]} ${bg||colors[name.charCodeAt(0)%colors.length]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>{initials}</div>;
// }

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  bg?: string;
  imageUrl?: string;
}

export default function Avatar({
  name,
  size = "md",
  bg,
  imageUrl,
}: AvatarProps) {
  const sz = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const colors = [
    "bg-blue-500",
    "bg-indigo-500",
    "bg-cyan-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-teal-500",
  ];

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const imageSrc = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `http://localhost:5168/uploads/${imageUrl}`
    : null;

  return (
    <div
      className={`${sz[size]} ${
        bg || colors[name.charCodeAt(0) % colors.length]
      } rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden`}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}
