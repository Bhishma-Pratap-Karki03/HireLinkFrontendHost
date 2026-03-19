import PortalFooter from "../../components/PortalFooter";
import CandidateSidebar from "../../components/candidatecomponents/CandidateSidebar";
import CandidateTopBar from "../../components/candidatecomponents/CandidateTopBar";
import SettingsContent from "../../components/settingsContent/SettingsContent";
import "../../styles/SettingsPage.css";

const CandidateSettingsPage = () => {
  return (
    <div className="candidate-dashboard-container">
      <CandidateSidebar />
      <main className="candidate-settings-main">
        <CandidateTopBar />
        <div className="candidate-settings-content-wrapper">
          <SettingsContent
            title="Settings"
            subtitle="Update your password and manage your account access."
          />
          <PortalFooter />
        </div>
      </main>
    </div>
  );
};

export default CandidateSettingsPage;


