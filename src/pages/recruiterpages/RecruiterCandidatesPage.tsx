import PortalFooter from "../../components/PortalFooter";
import { useEffect, useMemo, useState } from "react";
import RecruiterSidebar from "../../components/recruitercomponents/RecruiterSidebar";
import RecruiterTopBar from "../../components/recruitercomponents/RecruiterTopBar";
import "../../styles/RecruiterCandidatesPage.css";
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";

type CandidateSkill = {
  skillName: string;
};

type CandidateExperience = {
  startDate?: string;
  endDate?: string | null;
  isCurrent?: boolean;
};

type CandidateItem = {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  currentJobTitle?: string;
  address?: string;
  profilePicture?: string;
  skills?: CandidateSkill[];
  experience?: CandidateExperience[];
};

const resolveAvatar = (profilePicture?: string) => {
  if (!profilePicture) return defaultAvatar;
  if (profilePicture.startsWith("http")) return profilePicture;
  return `http://localhost:5000${profilePicture}`;
};

const getExperienceYears = (experience?: CandidateExperience[]) => {
  if (!experience || experience.length === 0) return 0;
  const now = new Date();
  const totalMonths = experience.reduce((sum, item) => {
    const start = item.startDate ? new Date(item.startDate) : null;
    const end = item.isCurrent
      ? now
      : item.endDate
      ? new Date(item.endDate)
      : now;
    if (!start || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return sum;
    }
    const months = Math.max(
      0,
      (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth())
    );
    return sum + months;
  }, 0);
  return Math.round(totalMonths / 12);
};

const RecruiterCandidatesPage = () => {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [minExperience, setMinExperience] = useState("");

  useEffect(() => {
    const fetchCandidates = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      try {
        setLoading(true);
        setError("");
        const res = await fetch("http://localhost:5000/api/users/candidates", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load candidates");
        }
        setCandidates(data.candidates || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load candidates");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const filteredCandidates = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const locationValue = locationFilter.trim().toLowerCase();
    const skillValue = skillFilter.trim().toLowerCase();
    const minYears = Number(minExperience) || 0;

    return candidates.filter((candidate) => {
      const skills = (candidate.skills || []).map((s) => s.skillName || "");
      const skillsText = skills.join(" ").toLowerCase();
      const nameMatch = candidate.fullName.toLowerCase().includes(searchValue);
      const titleMatch = (candidate.currentJobTitle || "")
        .toLowerCase()
        .includes(searchValue);
      const skillMatch = skillsText.includes(searchValue);
      const searchPass = !searchValue || nameMatch || titleMatch || skillMatch;

      const locationPass =
        !locationValue ||
        (candidate.address || "").toLowerCase().includes(locationValue);

      const skillFilterPass =
        !skillValue || skillsText.includes(skillValue);

      const experienceYears = getExperienceYears(candidate.experience);
      const experiencePass = !minExperience || experienceYears >= minYears;

      return searchPass && locationPass && skillFilterPass && experiencePass;
    });
  }, [candidates, search, locationFilter, skillFilter, minExperience]);

  return (
    <div className="recruiter-candidates-layout">
      <RecruiterSidebar />
      <main className="recruiter-candidates-main">
        <RecruiterTopBar />
        <div className="recruiter-candidates-content">
          <div className="recruiter-candidates-header">
            <div>
              <h1>Candidates</h1>
              <p>Discover and connect with talented candidates.</p>
            </div>
          </div>

          <div className="recruiter-candidates-search">
            <input
              type="text"
              placeholder="Search by name, title, or skill"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="recruiter-candidates-body">
            <aside className="recruiter-candidates-filters">
              <div className="recruiter-candidates-filter-card">
                <h3>Location</h3>
                <input
                  type="text"
                  placeholder="e.g. Kathmandu"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div className="recruiter-candidates-filter-card">
                <h3>Skill</h3>
                <input
                  type="text"
                  placeholder="e.g. React, UI/UX"
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                />
              </div>
              <div className="recruiter-candidates-filter-card">
                <h3>Experience (years)</h3>
                <input
                  type="number"
                  min="0"
                  placeholder="Min years"
                  value={minExperience}
                  onChange={(e) => setMinExperience(e.target.value)}
                />
              </div>
            </aside>

            <section className="recruiter-candidates-grid">
              {loading && (
                <div className="recruiter-candidates-state">Loading...</div>
              )}
              {error && !loading && (
                <div className="recruiter-candidates-state error">{error}</div>
              )}
              {!loading && !error && filteredCandidates.length === 0 && (
                <div className="recruiter-candidates-state">
                  No candidates found.
                </div>
              )}

              {filteredCandidates.map((candidate) => {
                const skills = (candidate.skills || [])
                  .map((s) => s.skillName)
                  .filter(Boolean)
                  .slice(0, 6);
                const experienceYears = getExperienceYears(candidate.experience);
                const cardId = candidate.id || candidate._id || candidate.email;

                return (
                  <article key={cardId} className="recruiter-candidate-card">
                    <div className="recruiter-candidate-header">
                      <img
                        src={resolveAvatar(candidate.profilePicture)}
                        alt={candidate.fullName}
                      />
                      <div>
                        <h3>{candidate.fullName}</h3>
                        <p>{candidate.currentJobTitle || "Candidate"}</p>
                        <span>{candidate.address || "Location not specified"}</span>
                      </div>
                    </div>
                    <div className="recruiter-candidate-meta">
                      <div>
                        <span>Experience</span>
                        <strong>
                          {experienceYears > 0 ? `${experienceYears}+ yrs` : "Entry"}
                        </strong>
                      </div>
                      <div>
                        <span>Email</span>
                        <strong>{candidate.email}</strong>
                      </div>
                    </div>
                    <div className="recruiter-candidate-skills">
                      {skills.length > 0 ? (
                        skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))
                      ) : (
                        <span className="empty">Skills not added</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          </div>
        </div>
              <PortalFooter />
</main>
    </div>
  );
};

export default RecruiterCandidatesPage;


