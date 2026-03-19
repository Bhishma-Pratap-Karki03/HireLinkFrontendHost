import PortalFooter from "../../components/PortalFooter";
import RecruiterSidebar from "../../components/recruitercomponents/RecruiterSidebar";
import RecruiterTopBar from "../../components/recruitercomponents/RecruiterTopBar";
import SettingsContent from "../../components/settingsContent/SettingsContent";
import "../../styles/SettingsPage.css";

const RecruiterSettingsPage = () => {
  return (
    <div className="recruiter-profile-layout">
      <RecruiterSidebar />
      <div className="recruiter-profile-main-area">
        <div className="recruiter-profile-topbar-wrapper">
          <RecruiterTopBar />
        </div>
        <div className="recruiter-profile-scrollable-content">
          <div className="recruiter-profile-content-wrapper">
            <SettingsContent
              title="Settings"
              subtitle="Update your password and manage your account access."
            />
          </div>
        </div>
        <PortalFooter />
      </div>
    </div>
  );
};

export default RecruiterSettingsPage;
