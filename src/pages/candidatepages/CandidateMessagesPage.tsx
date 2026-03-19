import PortalFooter from "../../components/PortalFooter";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CandidateSidebar from "../../components/candidatecomponents/CandidateSidebar";
import CandidateTopBar from "../../components/candidatecomponents/CandidateTopBar";
import MessagePanel from "../../components/messages/MessagePanel";
import "../../styles/MessagesPage.css";

const CandidateMessagesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedUserId = useMemo(
    () => searchParams.get("user") || "",
    [searchParams],
  );

  const handleSelectUser = (userId: string) => {
    navigate(`/candidate/messages?user=${userId}`, { replace: true });
  };

  return (
    <div className="candidate-dashboard-container">
      <CandidateSidebar />
      <main className="candidate-messages-main-content">
        <CandidateTopBar />
        <MessagePanel
          selectedUserIdFromQuery={selectedUserId}
          onSelectUser={handleSelectUser}
        />
              <PortalFooter />
</main>
    </div>
  );
};

export default CandidateMessagesPage;


