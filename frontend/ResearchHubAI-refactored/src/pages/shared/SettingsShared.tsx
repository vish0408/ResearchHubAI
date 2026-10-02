import { useState } from "react";
import {
  Moon,
  Sun,
} from "lucide-react";
import Card from "../../components/common/Card";
import SectionHead from "../../components/common/SectionHead";
import { useApp } from "../../context/AppContext";
import { Role } from "../../types/Role";

type NotificationPreferences = {
  email: boolean;
  inApp: boolean;
  sms: boolean;
  meetingReminders: boolean;
};

export default function SettingsShared({ role }: { role: Role }) {
  const { theme, setTheme } = useApp();
  const [tab, setTab] = useState("appearance");

  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>({
      email: true,
      inApp: true,
      sms: false,
      meetingReminders: true,
    });

  const toggleNotification = (
    key: keyof NotificationPreferences
  ) => {
    setNotificationPreferences((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const notificationItems = [
    {
      key: "email" as const,
      label: "Email Notifications",
      description: "Receive updates via email",
    },
    {
      key: "inApp" as const,
      label: "In-App Alerts",
      description: "Browser notifications",
    },
    {
      key: "sms" as const,
      label: "SMS Alerts",
      description: "Important alerts via SMS",
    },
    {
      key: "meetingReminders" as const,
      label: "Meeting Reminders",
      description: "30 min before meetings",
    },
  ];

  return (
    <div className="flex gap-6">
      <div className="w-44 flex-shrink-0">
        <Card>
          {["appearance", "notifications", "security"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                tab === t
                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </Card>
      </div>

      <div className="flex-1">
        {tab === "appearance" && (
          <Card>
            <SectionHead title="Appearance" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Theme
                </p>
                <p className="text-xs text-muted-foreground">
                  Light or dark interface
                </p>
              </div>

              <div className="flex gap-2">
                {(["light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-xl transition-all ${
                      theme === t
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t === "light" ? (
                      <Sun className="w-3.5 h-3.5" />
                    ) : (
                      <Moon className="w-3.5 h-3.5" />
                    )}

                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {tab === "notifications" && (
          <Card>
            <SectionHead title="Notification Preferences" />

            {notificationItems.map((item) => {
              const enabled = notificationPreferences[item.key];

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.label}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`Toggle ${item.label}`}
                    onClick={() => toggleNotification(item.key)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      enabled ? "bg-blue-600" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${
                        enabled ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </Card>
        )}

        {tab === "security" && (
          <Card>
            <SectionHead title="Security & Password" />

            <div className="flex flex-col gap-4">
              {[
                "Current Password",
                "New Password",
                "Confirm New Password",
              ].map((label) => (
                <div key={label}>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    {label}
                  </label>

                  <input
                    type="password"
                    className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-all"
                    placeholder="••••••••"
                  />
                </div>
              ))}

              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors">
                Update Password
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}