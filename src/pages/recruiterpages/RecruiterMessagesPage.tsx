import PortalFooter from "../../components/PortalFooter";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import RecruiterSidebar from "../../components/recruitercomponents/RecruiterSidebar";
import RecruiterTopBar from "../../components/recruitercomponents/RecruiterTopBar";
import MessagePanel from "../../components/messages/MessagePanel";
import "../../styles/MessagesPage.css";

const RecruiterMessagesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedUserId = useMemo(
    () => searchParams.get("user") || "",
    [searchParams],
  );

  const handleSelectUser = (userId: string) => {
    navigate(`/recruiter/messages?user=${userId}`, { replace: true });
  };

  return (
    <div className="recruiter-messages-layout">
      <RecruiterSidebar />
      <main className="recruiter-messages-main-content">
        <div className="recruiter-messages-topbar-wrapper">
          <RecruiterTopBar />
        </div>
        <div className="recruiter-messages-scrollable-content">
          <MessagePanel
            selectedUserIdFromQuery={selectedUserId}
            onSelectUser={handleSelectUser}
          />
          <PortalFooter />
        </div>
      </main>
    </div>
  );
};

export default RecruiterMessagesPage;


