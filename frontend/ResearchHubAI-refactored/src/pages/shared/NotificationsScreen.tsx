import { useEffect, useState } from "react";
import { CheckCheck, Bell } from "lucide-react";
import { studentService } from "../../services/StudentService";
import { AppNotification } from "../../types/Student";
import { NotifItem } from "../../types/Notification";
import Badge from "../../components/common/Badge";

interface Props {
  items?: NotifItem[];
}

function formatNotificationDate(value: string | Date) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function NotificationsScreen({ items: propItems }: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(!propItems);

  useEffect(() => {
    if (propItems) {
      setLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        const data = await studentService.getNotifications();
        setNotifications(data || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [propItems]);

  const handleMarkAllRead = async () => {
    try {
      await studentService.markAllNotificationsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch {
      // Keep current state if API fails
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await studentService.markNotificationsRead([id]);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch {
      // Keep current state if API fails
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const items = propItems
    ? propItems.map((notification) => ({
        id: String(notification.id),
        title: notification.text,
        message: notification.text,
        type: notification.type,
        isRead: notification.read,
        createdAt: notification.time,
      }))
    : notifications;

  const unread = items.filter((notification) => !notification.isRead).length;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Notifications
          </h1>

          <p className="text-sm text-muted-foreground">
            {unread === 0
              ? "0 unread"
              : `${unread} unread`}
          </p>
        </div>

        {unread > 0 && !propItems && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Bell className="w-6 h-6" />
          </div>

          <p className="text-sm font-medium">
            No notifications yet
          </p>

          <p className="text-xs mt-1">
            You're all caught up.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((notification: any) => {
            const isUnread = !notification.isRead;

            return (
              <div
                key={notification.id}
                onClick={() =>
                  isUnread &&
                  !propItems &&
                  handleMarkRead(notification.id)
                }
                className={`
                  relative p-4 rounded-xl border
                  transition-all duration-200
                  ${
                    isUnread
                      ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700"
                      : "border-border bg-card hover:bg-muted/30"
                  }
                  ${
                    isUnread && !propItems
                      ? "cursor-pointer"
                      : ""
                  }
                `}
              >
                {/* Unread indicator */}
                {isUnread && (
                  <span className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-r-full" />
                )}

                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                      ${
                        isUnread
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-muted text-muted-foreground"
                      }
                    `}
                  >
                    <Bell className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {notification.title}
                        </p>

                        {isUnread && (
                          <Badge variant="warning">
                            New
                          </Badge>
                        )}
                      </div>

                      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {formatNotificationDate(
                          notification.createdAt
                        )}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>

                    {isUnread && !propItems && (
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-2">
                        Click to mark as read
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}