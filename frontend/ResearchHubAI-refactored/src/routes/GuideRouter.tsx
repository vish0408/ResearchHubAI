import AccessDenied from "../components/common/AccessDenied";
import { useApp } from "../context/AppContext";
import GuideAIReview from "../pages/guide/GuideAIReview";
import GuideAssignedStudents from "../pages/guide/GuideAssignedStudents";
import GuideDashboard from "../pages/guide/GuideDashboard";
import GuideMeetingScheduler from "../pages/guide/GuideMeetingScheduler";
import GuidePendingApprovals from "../pages/guide/GuidePendingApprovals";
import GuideProfile from "../pages/guide/GuideProfile";
import GuideReports from "../pages/guide/GuideReports";
import GuideResearchProgress from "../pages/guide/GuideResearchProgress";
import GuideThesisReviews from "../pages/guide/GuideThesisReviews";
import NotificationsScreen from "../pages/shared/NotificationsScreen";
import SettingsShared from "../pages/shared/SettingsShared";
import { GUIDE_NAV } from "../utils/navigation";
import GuideCourseworkReview from "../pages/guide/GuideCourseworkReview";

export default function GuideRouter() {
  const { screen } = useApp();
  const allowed = GUIDE_NAV.map(n=>n.id);
  if(!allowed.includes(screen)) return <AccessDenied page={screen}/>;
  switch(screen) {
    case "dashboard": return <GuideDashboard/>;
    case "assigned-students": return <GuideAssignedStudents/>;
    case "thesis-reviews": return <GuideThesisReviews/>;
    case "pending-approvals": return <GuidePendingApprovals/>;
    case "ai-review": return <GuideAIReview/>;
    case "meeting-scheduler": return <GuideMeetingScheduler/>;
    case "research-progress": return <GuideResearchProgress/>;
    case "notifications": return <NotificationsScreen/>;
    case "reports": return <GuideReports/>;
    case "profile": return <GuideProfile/>;
    case "settings": return <SettingsShared role="guide"/>;
    case "coursework-review":
  return <GuideCourseworkReview />;
    default: return <AccessDenied page={screen}/>;
  }
}
