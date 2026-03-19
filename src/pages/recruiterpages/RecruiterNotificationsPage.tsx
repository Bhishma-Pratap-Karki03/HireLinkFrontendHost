import PortalFooter from "../../components/PortalFooter";
import { useState } from "react";
import RecruiterSidebar from "../../components/recruitercomponents/RecruiterSidebar";
import RecruiterTopBar from "../../components/recruitercomponents/RecruiterTopBar";
import ConnectionNotificationsPanel from "../../components/notifications/ConnectionNotificationsPanel";
import "../../styles/ConnectionNotificationsPage.css";

const RecruiterNotificationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="recruiter-friend-layout">
      <RecruiterSidebar />
      <main className="recruiter-notification-main-content">
        <RecruiterTopBar
          showSearch
          searchPlaceholder="Search notifications..."
          onSearch={setSearchQuery}
        />
        <ConnectionNotificationsPanel role="recruiter" searchQuery={searchQuery} />
              <PortalFooter />
</main>
    </div>
  );
};

export default RecruiterNotificationsPage;


