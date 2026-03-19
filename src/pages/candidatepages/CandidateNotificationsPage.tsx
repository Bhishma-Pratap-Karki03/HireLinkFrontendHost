import PortalFooter from "../../components/PortalFooter";
import { useState } from "react";
import CandidateSidebar from "../../components/candidatecomponents/CandidateSidebar";
import CandidateTopBar from "../../components/candidatecomponents/CandidateTopBar";
import ConnectionNotificationsPanel from "../../components/notifications/ConnectionNotificationsPanel";
import "../../styles/ConnectionNotificationsPage.css";

const CandidateNotificationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="candidate-dashboard-container">
      <CandidateSidebar />
      <main className="candidate-notification-main-content">
        <CandidateTopBar
          showSearch
          searchPlaceholder="Search notifications..."
          onSearch={setSearchQuery}
        />
        <div className="candidate-notification-content-wrapper">
          <ConnectionNotificationsPanel role="candidate" searchQuery={searchQuery} />
          <PortalFooter />
        </div>
      </main>
    </div>
  );
};

export default CandidateNotificationsPage;


