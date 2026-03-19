import AdminSidebar from "../../components/admincomponents/AdminSidebar";
import AdminTopBar from "../../components/admincomponents/AdminTopBar";
import SettingsContent from "../../components/settingsContent/SettingsContent";
import "../../styles/SettingsPage.css";

const AdminSettingsPage = () => {
  return (
    <div className="admin-profile-layout">
      <AdminSidebar />
      <div className="admin-profile-main-area">
        <div className="admin-profile-topbar-wrapper">
          <AdminTopBar />
        </div>
        <div className="admin-profile-scrollable-content">
          <div className="admin-profile-content-wrapper">
            <SettingsContent
              title="Admin Settings"
              subtitle="Update your password and manage your account access."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
