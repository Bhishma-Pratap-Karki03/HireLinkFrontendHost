import PortalFooter from "../../components/PortalFooter";
// Current imports
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SideNavigation from "../../components/candidatecomponents/CandidateSidebar.tsx";
import CandidateTopBar from "../../components/candidatecomponents/CandidateTopBar";
import ProfilePictureEditor from "../../components/candidatecomponents/ProfilePictureEditor.tsx";
import PersonalInfoEditor from "../../components/candidatecomponents/PersonalInfoEditor.tsx";
import AboutUsEditor from "../../components/candidatecomponents/AboutUsEditor.tsx";
import ResumeEditor from "../../components/candidatecomponents/ResumeEditor.tsx";
import ExperienceEditor from "../../components/candidatecomponents/ExperienceEditor.tsx";
import EducationEditor from "../../components/candidatecomponents/EducationEditor.tsx.tsx";
import SkillEditor from "../../components/candidatecomponents/SkillEditor.tsx";
import LanguageEditor from "../../components/candidatecomponents/LanguageEditor.tsx";
import ProjectEditor from "../../components/candidatecomponents/ProjectEditor.tsx";
import CertificationEditor, {
  Certification as CertificationType,
} from "../../components/candidatecomponents/CertificationEditor.tsx";
import "../../styles/CandidateProfilePage.css";
import fileIcon from "../../images/Candidate Profile Page Images/Resume-icon.png";

// Import images
import defaultAvatar from "../../images/Register Page Images/Default Profile.webp";
import editIcon from "../../images/Candidate Profile Page Images/261_2045.svg";
import emailIcon from "../../images/Candidate Profile Page Images/261_2082.svg";
import phoneIcon from "../../images/Candidate Profile Page Images/261_2173.svg";
import locationIcon from "../../images/Candidate Profile Page Images/261_2182.svg";
import addIcon from "../../images/Candidate Profile Page Images/264_2241.svg";
import addIcon2 from "../../images/Candidate Profile Page Images/264_2253.svg";
import addIcon3 from "../../images/Candidate Profile Page Images/264_2262.svg";
import addIcon4 from "../../images/Candidate Profile Page Images/264_2271.svg";
import editIcon2 from "../../images/Candidate Profile Page Images/264_2282.svg";
import addIcon5 from "../../images/Candidate Profile Page Images/264_2364.svg";
import arrowIcon from "../../images/Candidate Profile Page Images/267_1325.svg";
import addIcon6 from "../../images/Candidate Profile Page Images/267_1296.svg";
import editIcon4 from "../../images/Candidate Profile Page Images/267_1301.svg";
import projectImage from "../../images/Candidate Profile Page Images/493a4569683a62d53e1463f47634429e10edc7cf.png";
import starIcon from "../../images/Candidate Profile Page Images/star-icon.svg";
import emptyStarIcon from "../../images/Candidate Profile Page Images/empty-star-icon.png";
import eyeIcon from "../../images/Candidate Profile Page Images/eye-icon.svg";
import closeIcon from "../../images/Candidate Profile Page Images/corss icon.png";

// Define Education interface locally to avoid import conflict
interface Education {
  _id?: string; // Make _id optional for new entries
  degreeTitle: string;
  degreeType: string;
  institution: string;
  location: string;
  description: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  createdAt?: string;
  updatedAt?: string;
}
interface Project {
  _id?: string;
  projectTitle: string;
  projectDescription: string;
  coverImage: string;
  coverImageFileName: string;
  coverImageFileSize: number;
  startDate: string;
  endDate: string | null;
  isOngoing: boolean;
  projectUrl: string;
  technologies: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Certification {
  _id?: string;
  certificationName: string;
  issuingOrganization: string;
  credentialId: string;
  issueDate: string;
  expirationDate: string | null;
  doesNotExpire: boolean;
  credentialUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Language {
  _id?: string;
  languageName: string;
  rating: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Skill {
  _id?: string;
  skillName: string;
  proficiencyLevel: string;
  yearsOfExperience: number;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

type QuizResult = {
  id: string;
  assessmentId: string;
  assessmentSource: "admin" | "recruiter";
  title: string;
  type: "quiz" | "writing" | "task" | "code";
  difficulty?: string;
  score: number;
  total: number;
  completedAt: string;
};

// Interface for Experience
interface Experience {
  _id: string;
  jobTitle: string;
  jobType: string;
  organization: string;
  location: string;
  description: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for Resume Data
interface ResumeData {
  url: string;
  fileName: string;
  fileSize: number;
}

// Interface for User Profile
interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone: string;
  address: string;
  about: string;
  currentJobTitle?: string;
  profileVisibility?: "public" | "private";
  profilePicture: string;
  resume: string;
  resumeFileName: string;
  resumeFileSize: number;
  experience: Experience[];
  education: Education[];
  languages: Language[];
  certifications: Certification[];
    projects: Project[];
    skills: Skill[];
    createdAt: string;
    updatedAt: string;
  }

/**
 * CandidateProfilePage Component
 * Main profile page for candidates displaying all profile information
 * Includes editable sections for personal info, about, skills, resume, experience, and education
 */
const CandidateProfilePage = () => {
  const navigate = useNavigate();

  // State for user profile data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [allQuizResults, setAllQuizResults] = useState<QuizResult[]>([]);
  const [visibleQuizIds, setVisibleQuizIds] = useState<string[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  // State for resume data
  const [resumeData, setResumeData] = useState<ResumeData>({
    url: "",
    fileName: "",
    fileSize: 0,
  });

  // State for modal visibility
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPersonalInfoEditorOpen, setIsPersonalInfoEditorOpen] =
    useState(false);
  const [isAboutUsEditorOpen, setIsAboutUsEditorOpen] = useState(false);
  const [isResumeEditorOpen, setIsResumeEditorOpen] = useState(false);
  const [isExperienceEditorOpen, setIsExperienceEditorOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(
    null
  );
  const [isEducationEditorOpen, setIsEducationEditorOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(
    null
  );
  const [isSkillEditorOpen, setIsSkillEditorOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isLanguageEditorOpen, setIsLanguageEditorOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [isCertificationEditorOpen, setIsCertificationEditorOpen] =
    useState(false);
  const [editingCertification, setEditingCertification] =
    useState<Certification | null>(null);
  const [isProjectEditorOpen, setIsProjectEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Fetch user profile from backend API
   * This function retrieves all user profile data including resume information
   * Uses JWT token for authentication
   */
  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");

      // Redirect to login if no token found
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/api/profile/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Handle unauthorized access (token expired/invalid)
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        navigate("/login");
        return;
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch profile");
      }

      const data = await response.json();
      console.log("Fetched profile data:", data);
      setUserProfile(data.user);

      // Set resume data from profile
      setResumeData({
        url: data.user.resume || "",
        fileName: data.user.resumeFileName || "",
        fileSize: data.user.resumeFileSize || 0,
      });

      // Update localStorage with minimal user data
      if (data.user) {
        const minimalUserData = {
          id: data.user.id,
          fullName: data.user.fullName,
          email: data.user.email,
          role: data.user.role,
        };
        localStorage.setItem("userData", JSON.stringify(minimalUserData));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load profile data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const fetchQuizResults = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return;
    }
    try {
      setQuizLoading(true);
      const [historyResponse, showcaseResponse] = await Promise.all([
        fetch("http://localhost:5000/api/assessments/my-submissions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("http://localhost:5000/api/assessments/my-showcase", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const historyData = await historyResponse.json();
      const showcaseData = await showcaseResponse.json();
      if (!historyResponse.ok) {
        return;
      }

      const results = (historyData.submissions || [])
        .map((item: any) => ({
          id: item.attemptId,
          assessmentId: item.assessmentId,
          assessmentSource: item.assessmentSource || "admin",
          title: item.title,
          type: item.type || "quiz",
          difficulty: item.difficulty || "",
          score: typeof item.score === "number" ? item.score : 0,
          total: typeof item.quizTotal === "number" ? item.quizTotal : 0,
          completedAt: item.submittedAt || "",
        }))
        .sort((a: any, b: any) => {
          const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return bTime - aTime;
        });

      setAllQuizResults(results);
      const hasStoredSelection = Array.isArray(showcaseData?.attemptIds);
      const storedIds = hasStoredSelection ? showcaseData.attemptIds : [];
      const validStoredIds = storedIds.filter((id: any) =>
        results.some((r) => r.id === id),
      );
      const defaultIds = results.slice(0, 5).map((r) => r.id);
      const idsToUse = hasStoredSelection ? validStoredIds : defaultIds;
      setVisibleQuizIds(idsToUse);
      setQuizResults(results.filter((r) => idsToUse.includes(r.id)).slice(0, 5));
    } catch (error) {
      console.error("Error fetching quiz results:", error);
    } finally {
      setQuizLoading(false);
    }
  }, []);

  // Fetch profile on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile, refreshTrigger]);

  useEffect(() => {
    fetchQuizResults();
  }, [fetchQuizResults, refreshTrigger]);

  /**
   * Open profile picture editor modal
   */
  const handleEditProfilePicture = () => {
    setIsEditorOpen(true);
  };

  /**
   * Open personal info editor modal
   */
  const handleEditPersonalInfo = () => {
    setIsPersonalInfoEditorOpen(true);
  };


  /**
   * Open about us editor modal
   */
  const handleEditAboutUs = () => {
    setIsAboutUsEditorOpen(true);
  };

  /**
   * Open resume editor modal
   */
  const handleEditResume = () => {
    setIsResumeEditorOpen(true);
  };

  /**
   * Open experience editor for adding new experience
   */
  const handleAddExperience = () => {
    setEditingExperience(null);
    setIsExperienceEditorOpen(true);
  };

  /**
   * Open experience editor for editing existing experience
   */
  const handleEditExperience = (experience: Experience) => {
    setEditingExperience(experience);
    setIsExperienceEditorOpen(true);
  };

  /**
   * Open education editor for adding new education
   */
  const handleAddEducation = () => {
    setEditingEducation(null);
    setIsEducationEditorOpen(true);
  };

  /**
   * Open education editor for editing existing education
   */
  const handleEditEducation = (education: Education) => {
    setEditingEducation(education);
    setIsEducationEditorOpen(true);
  };

  const handleAddSkill = () => {
    setEditingSkill(null);
    setIsSkillEditorOpen(true);
  };

  /**
   * Open skill editor for editing existing skill
   */
  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setIsSkillEditorOpen(true);
  };

  const handleAddLanguage = () => {
    setEditingLanguage(null);
    setIsLanguageEditorOpen(true);
  };

  /**
   * Open language editor for editing existing language
   */
  const handleEditLanguage = (language: Language) => {
    setEditingLanguage(language);
    setIsLanguageEditorOpen(true);
  };

  // Add function to handle adding certification
  const handleAddCertification = () => {
    setEditingCertification(null);
    setIsCertificationEditorOpen(true);
  };

  // Add function to handle editing certification
  const handleEditCertification = (certification: Certification) => {
    setEditingCertification(certification);
    setIsCertificationEditorOpen(true);
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setIsProjectEditorOpen(true);
  };

  // Add function to handle editing project
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectEditorOpen(true);
  };

  // Add function to save project
  const handleSaveProject = async (formData: FormData) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const url = formData.get("_id")
        ? `http://localhost:5000/api/project/${formData.get("_id")}`
        : "http://localhost:5000/api/project";

      const method = formData.get("_id") ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save project");
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving project:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to delete project
  const handleDeleteProject = async (projectId: string) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/project/${projectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete project");
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to format project date range
  const formatProjectDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatQuizDate = (dateString: string): string => {
    if (!dateString) return "Completed";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Completed";
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const toggleQuizVisible = (id: string) => {
    setVisibleQuizIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSaveQuizVisibility = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const nextIds = visibleQuizIds.slice(0, 5);
    try {
      const response = await fetch("http://localhost:5000/api/assessments/my-showcase", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attemptIds: nextIds }),
      });
      if (!response.ok) return;
      setQuizResults(
        allQuizResults.filter((r) => nextIds.includes(r.id)).slice(0, 5),
      );
      setIsQuizModalOpen(false);
    } catch (error) {
      console.error("Failed to save showcased assessments:", error);
    }
  };

  // Add function to format project date range display
  const formatProjectDateRange = (
    startDate: string,
    endDate: string | null,
    isOngoing: boolean
  ): string => {
    const start = formatProjectDate(startDate);
    if (isOngoing) {
      return `${start} - Present`;
    } else if (endDate) {
      const end = formatProjectDate(endDate);
      return `${start} - ${end}`;
    }
    return start;
  };

  // Add function to get project image URL
  const getProjectImageUrl = (coverImage: string): string => {
    if (!coverImage || coverImage.trim() === "") {
      return projectImage; // default project image
    }
    return `http://localhost:5000${coverImage}`;
  };

  /**
   * Save skill (add or update)
   */
  const handleSaveSkill = async (skillData: any) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const url = skillData._id
        ? `http://localhost:5000/api/profile/me/skills/${skillData._id}`
        : "http://localhost:5000/api/profile/me/skills";

      const method = skillData._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(skillData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save skill");
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving skill:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete skill
   */
  const handleDeleteSkill = async (skillId: string) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/profile/me/skills/${skillId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete skill");
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting skill:", error);
      alert("Failed to delete skill. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save profile picture and job title
   * This function handles both uploading new profile picture and removing existing one
   */
  const handleSaveProfilePicture = async (data: {
    imageFile?: File | null;
    currentJobTitle: string;
    profileVisibility: "public" | "private";
  }) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      // Persist profile basics managed by this modal
      const updateResponse = await fetch("http://localhost:5000/api/profile/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentJobTitle: data.currentJobTitle ?? "",
          profileVisibility: data.profileVisibility,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || "Failed to update profile settings");
      }

      // Then handle the profile picture if needed
      if (data.imageFile !== undefined) {
        if (data.imageFile) {
          // Upload new profile picture to backend
          const formData = new FormData();
          formData.append("profilePicture", data.imageFile);

          console.log(
            "Uploading profile picture:",
            data.imageFile.name,
            data.imageFile.type,
            data.imageFile.size
          );

          const response = await fetch(
            "http://localhost:5000/api/profile/me/picture", // CHANGED FROM /upload-picture to /me/picture
            {
              method: "POST", // CHANGED FROM PUT to POST
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            }
          );

          const responseData = await response.json();
          console.log("Upload response:", responseData);

          if (!response.ok) {
            throw new Error(
              responseData.message || "Failed to upload profile picture"
            );
          }
        } else {
          // Remove profile picture via backend
          const response = await fetch(
            "http://localhost:5000/api/profile/me/picture", // CHANGED FROM /remove-picture to /me/picture
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || "Failed to remove profile picture"
            );
          }
        }
      }

      // Refresh profile data from database
      await fetchUserProfile();

      // Force refresh by incrementing the trigger
      setRefreshTrigger((prev) => prev + 1);

      // Dispatch custom event to notify other components (Navbar and SideNavigation)
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile picture. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to save certification
  const handleSaveCertification = async (
    certificationData: CertificationType
  ) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const url = certificationData._id
        ? `http://localhost:5000/api/profile/me/certifications/${certificationData._id}`
        : "http://localhost:5000/api/profile/me/certifications";

      const method = certificationData._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(certificationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save certification");
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving certification:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to delete certification
  const handleDeleteCertification = async (certificationId: string) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/profile/me/certifications/${certificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete certification");
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting certification:", error);
      alert("Failed to delete certification. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to format date for certification display
  const formatCertificationDate = (dateString: string | null): string => {
    if (!dateString) return "No expiration";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  /**
   * Save personal information (phone and address)
   * This function updates phone number and address in the backend
   */
  const handleSavePersonalInfo = async (data: {
    phone: string;
    address: string;
  }): Promise<void> => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("http://localhost:5000/api/profile/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: data.phone || "",
          address: data.address || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update personal information"
        );
      }

      // Refresh profile data from database
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);

      // Notify other components
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (error) {
      console.error("Error saving personal information:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };


  /**
   * Save about information
   * This function updates the about section text in the backend
   */
  const handleSaveAboutUs = async (aboutText: string): Promise<void> => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("http://localhost:5000/api/profile/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          about: aboutText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update about information"
        );
      }

      // Refresh profile data from database
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);

      // Notify other components
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (error) {
      console.error("Error saving about information:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save resume file
   * This function handles both uploading new resume and removing existing one
   * Supports PDF, DOC, and DOCX files up to 5MB
   */
  const handleSaveResume = async (file: File | null) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      if (file) {
        // Upload new resume to backend
        const formData = new FormData();
        formData.append("resume", file);

        console.log("Uploading resume:", file.name, file.type, file.size);

        const response = await fetch(
          "http://localhost:5000/api/resume/upload",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const responseData = await response.json();
        console.log("Upload response:", responseData);

        if (!response.ok) {
          throw new Error(responseData.message || "Failed to upload resume");
        }

        // Update local state with new resume data
        setResumeData({
          url: responseData.resume,
          fileName: responseData.resumeFileName,
          fileSize: responseData.resumeFileSize,
        });
      } else {
        // Remove resume via backend
        const response = await fetch(
          "http://localhost:5000/api/resume/remove",
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to remove resume");
        }

        // Clear local resume data
        setResumeData({
          url: "",
          fileName: "",
          fileSize: 0,
        });
      }

      // Refresh profile data from database
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving resume:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save experience (add or update)
   */
  const handleSaveExperience = async (experienceData: any) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const url = experienceData._id
        ? `http://localhost:5000/api/profile/me/experience/${experienceData._id}`
        : "http://localhost:5000/api/profile/me/experience";

      const method = experienceData._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(experienceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save experience");
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving experience:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete experience
   */
  const handleDeleteExperience = async (experienceId: string) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/profile/me/experience/${experienceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete experience");
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting experience:", error);
      alert("Failed to delete experience. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save education (add or update)
   */
  const handleSaveEducation = async (educationData: any) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      // Prepare the data to send (without optional fields)
      const educationToSend = {
        degreeTitle: educationData.degreeTitle,
        degreeType: educationData.degreeType,
        institution: educationData.institution,
        location: educationData.location,
        description: educationData.description,
        startDate: educationData.startDate,
        endDate: educationData.endDate,
        isCurrent: educationData.isCurrent,
      };

      const url = educationData._id
        ? `http://localhost:5000/api/profile/me/education/${educationData._id}`
        : "http://localhost:5000/api/profile/me/education";

      const method = educationData._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(educationToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save education");
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving education:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete education
   */
  const handleDeleteEducation = async (educationId: string) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/profile/me/education/${educationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete education");
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting education:", error);
      alert("Failed to delete education. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get current profile image URL from database
   * Returns default avatar if no profile picture exists
   */
  const getProfileImageUrl = () => {
    if (!userProfile) {
      return defaultAvatar;
    }

    // If no profile picture is set or it's empty, return default avatar
    if (
      !userProfile.profilePicture ||
      userProfile.profilePicture.trim() === ""
    ) {
      return defaultAvatar;
    }

    // If it's already a full URL (shouldn't happen with our setup, but just in case)
    if (userProfile.profilePicture.startsWith("http")) {
      // Add cache-busting timestamp
      const separator = userProfile.profilePicture.includes("?") ? "&" : "?";
      return `${userProfile.profilePicture}${separator}t=${Date.now()}`;
    }

    // It's a relative path, prepend the backend URL with cache-busting
    return `http://localhost:5000${userProfile.profilePicture}?t=${Date.now()}`;
  };

  /**
   * Format phone number for display
   * Returns "Not provided" if phone number is empty
   */
  const formatPhoneNumber = (phone: string): string => {
    if (!phone || phone.trim() === "") {
      return "Not provided";
    }
    return phone;
  };

  /**
   * Format address for display
   * Returns "Not provided" if address is empty
   */
  const formatAddress = (address: string): string => {
    if (!address || address.trim() === "") {
      return "Not provided";
    }
    return address;
  };

  /**
   * Format file size for display
   * Converts bytes to human-readable format (KB, MB, etc.)
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  /**
   * Truncate file name for display
   * Shows shortened name with ellipsis if too long
   */
  const truncateFileName = (
    fileName: string,
    maxLength: number = 15
  ): string => {
    if (!fileName) return "";

    if (fileName.length <= maxLength) return fileName;

    const extensionIndex = fileName.lastIndexOf(".");
    if (extensionIndex === -1) {
      return fileName.substring(0, maxLength) + "...";
    }

    const name = fileName.substring(0, extensionIndex);
    const extension = fileName.substring(extensionIndex);
    const maxNameLength = maxLength - extension.length - 3;

    if (name.length <= maxNameLength) return fileName;

    return name.substring(0, maxNameLength) + "..." + extension;
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Present";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  /**
   * Save language (add or update)
   */
  const handleSaveLanguage = async (languageData: any) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const url = languageData._id
        ? `http://localhost:5000/api/profile/me/languages/${languageData._id}`
        : "http://localhost:5000/api/profile/me/languages";

      const method = languageData._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(languageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save language");
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving language:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete language
   */
  const handleDeleteLanguage = async (languageId: string) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/profile/me/languages/${languageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete language");
      }

      // Refresh profile data
      await fetchUserProfile();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting language:", error);
      alert("Failed to delete language. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render star ratings for languages
   */
  const renderLanguageStars = (rating: number) => {
    const stars = [];
    const totalStars = 5;

    for (let i = 1; i <= totalStars; i++) {
      stars.push(
        <img
          key={i}
          src={i <= rating ? starIcon : emptyStarIcon}
          alt={i <= rating ? "Filled Star" : "Empty Star"}
          className="candidate-star-icon"
        />
      );
    }
    return stars;
  };

  /**
   * Calculate duration between dates
   */
  const calculateDuration = (
    startDate: string,
    endDate: string | null
  ): string => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();

    let totalMonths = years * 12 + months;
    if (totalMonths < 0) totalMonths = 0;

    const yearsDisplay = Math.floor(totalMonths / 12);
    const monthsDisplay = totalMonths % 12;

    if (yearsDisplay > 0 && monthsDisplay > 0) {
      return `${yearsDisplay} yr ${monthsDisplay} mo`;
    } else if (yearsDisplay > 0) {
      return `${yearsDisplay} yr`;
    } else {
      return `${monthsDisplay} mo`;
    }
  };

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1:
        return "Basic";
      case 2:
        return "Elementary";
      case 3:
        return "Intermediate";
      case 4:
        return "Advanced";
      case 5:
        return "Native/Fluent";
      default:
        return "Not rated";
    }
  };
  /**
   * Render star ratings for languages
   * Creates an array of star icons based on rating (1-6)
   */
  const renderStars = (rating: number) => {
    const stars = [];
    const totalStars = 6;

    for (let i = 1; i <= totalStars; i++) {
      stars.push(
        <img
          key={i}
          src={i <= rating ? starIcon : emptyStarIcon}
          alt={i <= rating ? "Filled Star" : "Empty Star"}
          className="candidate-star-icon"
        />
      );
    }
    return stars;
  };

  // Loading state - Show loading indicator while fetching data
  if (isLoading) {
    return (
      <div className="candidate-dashboard-container">
        <SideNavigation />
        <main className="candidate-main-content">
          <div className="loading-container">
            <p>Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state - Show error message if profile fetch failed
  if (error) {
    return (
      <div className="candidate-dashboard-container">
        <SideNavigation />
        <main className="candidate-main-content">
          <div className="error-container">
            <p>Error: {error}</p>
            <button onClick={fetchUserProfile} className="retry-button">
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  // No profile data state - Show message if no profile data found
  if (!userProfile) {
    return (
      <div className="candidate-dashboard-container">
        <SideNavigation />
        <main className="candidate-main-content">
          <div className="error-container">
            <p>No profile data found</p>
            <button onClick={fetchUserProfile} className="retry-button">
              Refresh
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="candidate-dashboard-container">
      <SideNavigation />
      <main className="candidate-main-content">
        <CandidateTopBar />

        <div className="candidate-content-grid">
          {/* Profile Header Card */}
          <article className="candidate-profile-card">
            <div className="candidate-profile-main">
              <div className="candidate-profile-avatar">
                <img
                  src={getProfileImageUrl()}
                  alt={userProfile.fullName || "Profile Avatar"}
                  onError={(e) => {
                    // If image fails to load, show default avatar
                    e.currentTarget.src = defaultAvatar;
                  }}
                />
              </div>
              <div className="candidate-profile-info">
                <div className="candidate-profile-name-row">
                  <h2>{userProfile.fullName || "User"}</h2>
                  <span
                    className={
                      userProfile.profileVisibility === "private"
                        ? "candidate-badge-private"
                        : "candidate-badge-public"
                    }
                  >
                    {userProfile.profileVisibility === "private"
                      ? "Private"
                      : "Public"}
                  </span>
                </div>
                {userProfile.currentJobTitle && (
                  <div className="candidate-job-title">
                    <strong>{userProfile.currentJobTitle}</strong>
                  </div>
                )}
              </div>
            </div>
            <button
              className="candidate-edit-btn"
              onClick={handleEditProfilePicture}
            >
              <img src={editIcon} alt="Edit" />
            </button>
          </article>
          {/* Personal Information */}
          <article className="candidate-card">
            <div className="candidate-card-header">
              <h3>Personal Information</h3>
              <button
                className="candidate-edit-btn"
                onClick={handleEditPersonalInfo}
              >
                <img src={editIcon} alt="Edit" />
              </button>
            </div>
            <div className="candidate-info-grid">
              <div className="candidate-info-item">
                <div className="candidate-icon-box">
                  <img src={emailIcon} alt="Email" />
                </div>
                <div className="candidate-info-text">
                  <span className="candidate-label">Email</span>
                  <span className="candidate-value">
                    {userProfile.email || "No email provided"}
                  </span>
                </div>
              </div>
              <div className="candidate-info-item">
                <div className="candidate-icon-box">
                  <img src={phoneIcon} alt="Phone" />
                </div>
                <div className="candidate-info-text">
                  <span className="candidate-label">Phone Number</span>
                  <span className="candidate-value">
                    {formatPhoneNumber(userProfile.phone || "Not provided")}
                  </span>
                </div>
              </div>
              <div className="candidate-info-item">
                <div className="candidate-icon-box">
                  <img src={locationIcon} alt="Location" />
                </div>
                <div className="candidate-info-text">
                  <span className="candidate-label">Address</span>
                  <span className="candidate-value">
                    {formatAddress(userProfile.address || "Not provided")}
                  </span>
                </div>
              </div>
            </div>
          </article>
          {/* About Section */}
          <article className="candidate-card">
            <div className="candidate-card-header">
              <h3>About</h3>
              <button
                className="candidate-edit-btn"
                onClick={handleEditAboutUs}
              >
                <img src={editIcon} alt="Edit" />
              </button>
            </div>
            <div
              className="candidate-description-text"
              dangerouslySetInnerHTML={{
                __html: userProfile.about || "No about information provided.",
              }}
            />
          </article>
          {/* Resume Section */}
          <article className="candidate-card">
            <div className="candidate-card-header">
              <h3>Resume</h3>
              <div className="candidate-actions">
                {resumeData.url ? (
                  // Show edit icon when resume exists
                  <button
                    className="candidate-edit-btn"
                    onClick={handleEditResume}
                  >
                    <img src={editIcon} alt="Edit" />
                  </button>
                ) : (
                  // Show add button when no resume
                  <button
                    className="candidate-add-btn"
                    onClick={handleEditResume}
                  >
                    <img src={addIcon} alt="Add" />
                    <span>Add</span>
                  </button>
                )}
              </div>
            </div>

            {resumeData.url ? (
              // Show resume file info when resume exists
              <div className="resume-display-container">
                <div className="resume-file-info-display">
                  <div className="resume-file-name-display">
                    <span className="resume-file-icon">
                      <img src={fileIcon} alt="Resume File" />
                    </span>
                    <span className="resume-file-name-text">Resume</span>
                  </div>
                  <div className="resume-file-meta">
                    <span className="resume-file-size">
                      {formatFileSize(resumeData.fileSize)}
                    </span>
                    <a
                      href={`http://localhost:5000${resumeData.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resume-view-link"
                    >
                      View
                    </a>
                  </div>
                </div>
                <p className="candidate-description-text">
                  The resume stands as the most crucial document that recruiters
                  prioritize, often disregarding profiles lacking this essential
                  component.
                </p>
              </div>
            ) : (
              // Show description text when no resume
              <p className="candidate-description-text">
                The resume stands as the most crucial document that recruiters
                prioritize, often disregarding profiles lacking this essential
                component.
              </p>
            )}
          </article>
          {/* Experience Section */}
          <article className="candidate-card">
            <div className="candidate-card-header">
              <h3>Experience</h3>
              <button
                className="candidate-add-btn"
                onClick={handleAddExperience}
              >
                <img src={addIcon2} alt="Add" />
                <span>Add</span>
              </button>
            </div>

            {userProfile.experience && userProfile.experience.length === 0 ? (
              <p className="candidate-description-text">
                Outline your employment particulars encompassing both your
                present role and past professional experiences with previous
                companies.
              </p>
            ) : (
              <div className="candidate-experience-list">
                {userProfile.experience &&
                  userProfile.experience.map((experience) => (
                    <div
                      key={experience._id}
                      className="candidate-experience-item"
                    >
                      <div className="candidate-experience-header">
                        <div className="candidate-experience-title-row">
                          <h4 className="candidate-experience-job-title">
                            {experience.jobTitle}
                          </h4>
                          <div className="candidate-experience-actions">
                            <button
                              className="candidate-edit-btn"
                              onClick={() => handleEditExperience(experience)}
                            >
                              <img src={editIcon} alt="Edit" />
                            </button>
                            <button
                              className="candidate-delete-btn"
                              onClick={() =>
                                handleDeleteExperience(experience._id)
                              }
                            >
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                        <p className="candidate-experience-company">
                          {experience.organization}
                          {experience.location && ` • ${experience.location}`}
                          {experience.jobType && ` • ${experience.jobType}`}
                        </p>
                        <p className="candidate-experience-dates">
                          {formatDate(experience.startDate)} -{" "}
                          {formatDate(experience.endDate)}
                          {experience.isCurrent && " • Present"}
                          <span className="candidate-experience-duration">
                            •{" "}
                            {calculateDuration(
                              experience.startDate,
                              experience.endDate
                            )}
                          </span>
                        </p>
                      </div>

                      {experience.description && (
                        <div
                          className="candidate-experience-description"
                          dangerouslySetInnerHTML={{
                            __html: experience.description,
                          }}
                        />
                      )}
                    </div>
                  ))}
              </div>
            )}
          </article>
          {/* Education Section */}
          <article className="candidate-card">
            <div className="candidate-card-header">
              <h3>Education</h3>
              <button
                className="candidate-add-btn"
                onClick={handleAddEducation}
              >
                <img src={addIcon3} alt="Add" />
                <span>Add</span>
              </button>
            </div>

            {userProfile.education && userProfile.education.length === 0 ? (
              <p className="candidate-description-text">
                Kindly provide information about your educational background,
                including details about your schooling, college attendance, and
                degrees earned. This will enhance the robustness of your
                profile.
              </p>
            ) : (
              <div className="candidate-education-list">
                {userProfile.education &&
                  userProfile.education.map((education) => (
                    <div
                      key={education._id}
                      className="candidate-education-item"
                    >
                      <div className="candidate-education-header">
                        <div className="candidate-education-title-row">
                          <h4 className="candidate-education-degree-title">
                            {education.degreeTitle}
                          </h4>
                          <div className="candidate-education-actions">
                            <button
                              className="candidate-edit-btn"
                              onClick={() => handleEditEducation(education)}
                            >
                              <img src={editIcon} alt="Edit" />
                            </button>
                            <button
                              className="candidate-delete-btn"
                              onClick={() =>
                                handleDeleteEducation(education._id!)
                              }
                            >
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                        <p className="candidate-education-institution">
                          {education.institution}
                          {education.location && ` • ${education.location}`}
                          {education.degreeType && ` • ${education.degreeType}`}
                        </p>
                        <p className="candidate-education-dates">
                          {formatDate(education.startDate)} -{" "}
                          {formatDate(education.endDate)}
                          {education.isCurrent && " • Present"}
                          <span className="candidate-education-duration">
                            •{" "}
                            {calculateDuration(
                              education.startDate,
                              education.endDate
                            )}
                          </span>
                        </p>
                      </div>

                      {education.description && (
                        <div
                          className="candidate-education-description"
                          dangerouslySetInnerHTML={{
                            __html: education.description,
                          }}
                        />
                      )}
                    </div>
                  ))}
              </div>
            )}
          </article>
          {/* Skills Section */}
          <article className="candidate-card">
            <div className="candidate-card-header">
              <h3>Skills</h3>
              <div className="candidate-actions">
                <button className="candidate-add-btn" onClick={handleAddSkill}>
                  <img src={addIcon4} alt="Add" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {userProfile.skills && userProfile.skills.length === 0 ? (
              <p className="candidate-description-text">
                Add your skills to showcase your expertise to recruiters and
                employers. Include technical skills, soft skills, tools, and
                languages you know.
              </p>
            ) : (
              <div className="candidate-skills-list">
                <div className="candidate-skills-grid">
                  {userProfile.skills.map((skill) => (
                    <div key={skill._id} className="candidate-skill-item">
                      <div className="candidate-skill-header">
                        <div className="candidate-skill-title-row">
                          <h4 className="candidate-skill-name">
                            {skill.skillName}
                          </h4>
                          <div className="candidate-skill-actions">
                            <button
                              className="candidate-edit-btn-small"
                              onClick={() => handleEditSkill(skill)}
                            >
                              <img src={editIcon} alt="Edit" />
                            </button>
                            <button
                              className="candidate-delete-btn-small"
                              onClick={() => handleDeleteSkill(skill._id!)}
                            >
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                        <div className="candidate-skill-meta">
                          <span className="candidate-skill-level">
                            {skill.proficiencyLevel}
                          </span>
                          <span className="candidate-skill-experience">
                            {skill.yearsOfExperience}{" "}
                            {skill.yearsOfExperience === 1 ? "year" : "years"}
                          </span>
                          <span className="candidate-skill-category">
                            {skill.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
          {/* Quiz/Assessment and Language Sections in same row */}
          <div className="candidate-dual-section-row">
            {/* Quiz/Assessment Section */}
            <article className="candidate-card candidate-half-card">
              <div className="candidate-card-header">
                <h3>Quiz / Assessment</h3>
                <div className="candidate-actions">
                  <button
                    className="candidate-eye-btn"
                    onClick={() => setIsQuizModalOpen(true)}
                    title="Manage showcased assessments"
                  >
                    <img src={eyeIcon} alt="View" />
                  </button>
                </div>
              </div>
              <p className="candidate-description-text">
                Showing up to 5 completed assessments from your history. Click
                the eye icon to choose which assessments appear here.
              </p>
              {quizLoading ? (
                <p className="candidate-description-text">
                  Loading assessment history...
                </p>
              ) : quizResults.length === 0 ? (
                <p className="candidate-description-text">
                  No completed assessments yet.
                </p>
              ) : (
                <div className="candidate-quiz-list">
                  {quizResults.map((quiz) => (
                    <div key={quiz.id} className="candidate-quiz-item">
                      <div className="candidate-quiz-header">
                        <h4>{quiz.title}</h4>
                        {quiz.type === "quiz" ? (
                          <span className="candidate-quiz-score candidate-score-passed">
                            {quiz.score}/{quiz.total}
                          </span>
                        ) : (
                          <span className="candidate-quiz-type-badge">
                            {quiz.type === "task" ? "Task-Based" : "Writing"}
                          </span>
                        )}
                      </div>
                      <p className="candidate-quiz-status">
                        Completed {formatQuizDate(quiz.completedAt)}
                      </p>
                      <button
                        type="button"
                        className="candidate-quiz-view-btn"
                        onClick={() =>
                          navigate(
                            `/candidate/${userProfile?.id}/assessments/${quiz.id}`,
                          )
                        }
                      >
                        View Submission
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </article>
            {/* Languages Section */}
            <article className="candidate-card candidate-half-card">
              <div className="candidate-card-header">
                <h3>Languages</h3>
                <div className="candidate-actions">
                  <button
                    className="candidate-add-btn"
                    onClick={handleAddLanguage}
                  >
                    <img src={addIcon5} alt="Add" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {userProfile.languages && userProfile.languages.length === 0 ? (
                <p className="candidate-description-text">
                  Add languages you speak to showcase your multilingual skills
                  to employers.
                </p>
              ) : (
                <div className="candidate-languageprofile-list">
                  {userProfile.languages &&
                    userProfile.languages.map((language) => (
                      <div
                        key={language._id}
                        className="candidate-languageprofile-item"
                      >
                        {/* First Row: Language Name + Actions */}
                        <div className="candidate-languageprofile-header">
                          <span className="candidate-languageprofile-name">
                            {language.languageName}
                          </span>
                          <div className="candidate-languageprofile-actions">
                            <button
                              className="candidate-languageprofile-edit-btn"
                              onClick={() => handleEditLanguage(language)}
                            >
                              <img src={editIcon} alt="Edit" />
                            </button>
                            <button
                              className="candidate-languageprofile-delete-btn"
                              onClick={() =>
                                handleDeleteLanguage(language._id!)
                              }
                            >
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Second Row: Star Rating + Text */}
                        <div className="candidate-languageprofile-rating-container">
                          <div className="candidate-languageprofile-stars">
                            {renderLanguageStars(language.rating)}
                          </div>
                          <div className="candidate-languageprofile-rating-text">
                            {language.rating}/5 -{" "}
                            {getRatingText(language.rating)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </article>
          </div>
          {isQuizModalOpen && (
            <div className="candidate-quiz-modal-overlay">
              <div className="candidate-quiz-modal">
                <div className="candidate-quiz-modal-header">
                  <div>
                    <h3>Assessment History</h3>
                    <p>Select up to 5 submissions to show on your profile.</p>
                  </div>
                  <button
                    className="candidate-quiz-modal-close"
                    onClick={() => setIsQuizModalOpen(false)}
                  >
                    <img src={closeIcon} alt="Close" />
                  </button>
                </div>

                <div className="candidate-quiz-modal-list">
                  {allQuizResults.length === 0 ? (
                    <p className="candidate-description-text">
                      No completed assessments yet.
                    </p>
                  ) : (
                    allQuizResults.map((quiz) => (
                      <label key={quiz.id} className="candidate-quiz-modal-item">
                        <input
                          type="checkbox"
                          checked={visibleQuizIds.includes(quiz.id)}
                          onChange={() => toggleQuizVisible(quiz.id)}
                        />
                        <div className="candidate-quiz-modal-info">
                          <span>{quiz.title}</span>
                          <span className="candidate-quiz-modal-meta">
                            {quiz.type === "quiz"
                              ? `${quiz.score}/${quiz.total}`
                              : quiz.type === "task"
                                ? "Task-Based"
                                : "Writing"}{" "}
                            • Completed {formatQuizDate(quiz.completedAt)}
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <div className="candidate-quiz-modal-actions">
                  <button
                    className="candidate-quiz-modal-secondary"
                    onClick={() => setIsQuizModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="candidate-quiz-modal-primary"
                    onClick={handleSaveQuizVisibility}
                  >
                    Save Selection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Certifications Section */}
          <article className="candidate-card">
            <div className="candidate-card-header">
              <h3>Certifications</h3>
              <div className="candidate-actions">
                <button
                  className="candidate-add-btn"
                  onClick={handleAddCertification}
                >
                  <img src={addIcon5} alt="Add" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {userProfile.certifications &&
            userProfile.certifications.length === 0 ? (
              <p className="candidate-description-text">
                Showcase your professional certifications to demonstrate your
                expertise and qualifications to potential employers.
              </p>
            ) : (
              <div className="candidate-cert-list">
                {userProfile.certifications.map((certification) => (
                  <div key={certification._id} className="candidate-cert-item">
                    <div className="candidate-cert-header">
                      <div className="candidate-cert-title-row">
                        <h4 className="candidate-cert-name">
                          {certification.certificationName}
                        </h4>
                        <div className="candidate-cert-actions">
                          <button
                            className="candidate-edit-btn-small"
                            onClick={() =>
                              handleEditCertification(certification)
                            }
                          >
                            <img src={editIcon} alt="Edit" />
                          </button>
                          <button
                            className="candidate-delete-btn-small"
                            onClick={() =>
                              handleDeleteCertification(certification._id!)
                            }
                          >
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                      <p className="candidate-sub-text">
                        {certification.issuingOrganization}
                        {certification.credentialId &&
                          ` • ID: ${certification.credentialId}`}
                      </p>
                    </div>
                    <p className="candidate-meta-text">
                      Issued {formatCertificationDate(certification.issueDate)}
                      {!certification.doesNotExpire &&
                        certification.expirationDate && (
                          <>
                            {" "}
                            • Expires{" "}
                            {formatCertificationDate(
                              certification.expirationDate
                            )}
                          </>
                        )}
                      {certification.doesNotExpire && " • No expiration"}
                    </p>

                    {certification.credentialUrl && (
                      <a
                        href={certification.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="candidate-show-credential-btn"
                      >
                        <span>Show Credential</span>
                        <img src={arrowIcon} alt="Arrow" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>
          {/* Project Section */}
          <article className="candidate-card">
            <div className="candidate-card-header">
              <h3>Projects</h3>
              <div className="candidate-actions">
                <button
                  className="candidate-add-btn"
                  onClick={handleAddProject}
                >
                  <img src={addIcon6} alt="Add" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {userProfile.projects && userProfile.projects.length === 0 ? (
              <p className="candidate-description-text">
                Showcase your projects to demonstrate your skills and experience
                to potential employers. Include personal projects, academic
                work, or professional projects.
              </p>
            ) : (
              <div className="candidate-project-list">
                {userProfile.projects.map((project) => (
                  <div key={project._id} className="candidate-project-item">
                    <img
                      src={getProjectImageUrl(project.coverImage)}
                      alt={project.projectTitle}
                      className="candidate-project-img"
                      onError={(e) => {
                        e.currentTarget.src = projectImage;
                      }}
                    />
                    <div className="candidate-project-details">
                      <div className="candidate-project-header">
                        <div className="candidate-project-title-row">
                          <h4 className="candidate-project-title">
                            {project.projectTitle}
                          </h4>
                          <div className="candidate-project-actions">
                            <button
                              className="candidate-edit-btn-small"
                              onClick={() => handleEditProject(project)}
                            >
                              <img src={editIcon} alt="Edit" />
                            </button>
                            <button
                              className="candidate-delete-btn-small"
                              onClick={() => handleDeleteProject(project._id!)}
                            >
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                        <p className="candidate-project-date-range">
                          {formatProjectDateRange(
                            project.startDate,
                            project.endDate,
                            project.isOngoing
                          )}
                        </p>
                      </div>

                      {project.technologies &&
                        project.technologies.length > 0 && (
                          <div className="candidate-project-technologies">
                            <span className="candidate-project-tech-label">
                              Technologies:
                            </span>
                            <div className="candidate-tech-tags">
                              {project.technologies.map((tech, index) => (
                                <span
                                  key={index}
                                  className="candidate-tech-tag"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {project.projectUrl && (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="candidate-show-project-btn"
                        >
                          <span>View Project</span>
                          <img src={arrowIcon} alt="Arrow" />
                        </a>
                      )}

                      {project.projectDescription && (
                        <p className="candidate-description-text-project">
                          {project.projectDescription}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
              <PortalFooter />
</main>
      {/* Profile Picture Editor Modal */}
      <ProfilePictureEditor
        currentImage={getProfileImageUrl()}
        userName={userProfile.fullName}
        currentJobTitle={userProfile.currentJobTitle || ""}
        currentProfileVisibility={userProfile.profileVisibility || "public"}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveProfilePicture}
      />
      {/* Personal Information Editor Modal */}
        <PersonalInfoEditor
          userData={{
            email: userProfile.email,
            phone: userProfile.phone || "",
            address: userProfile.address || "",
          }}
          isOpen={isPersonalInfoEditorOpen}
          onClose={() => setIsPersonalInfoEditorOpen(false)}
          onSave={handleSavePersonalInfo}
        />
      {/* About Us Editor Modal */}
      <AboutUsEditor
        currentAbout={userProfile.about || ""}
        isOpen={isAboutUsEditorOpen}
        onClose={() => setIsAboutUsEditorOpen(false)}
        onSave={handleSaveAboutUs}
      />
      {/* Resume Editor Modal */}
      <ResumeEditor
        currentResume={resumeData}
        isOpen={isResumeEditorOpen}
        onClose={() => setIsResumeEditorOpen(false)}
        onSave={handleSaveResume}
      />
      {/* Experience Editor Modal */}
      <ExperienceEditor
        experience={editingExperience}
        isOpen={isExperienceEditorOpen}
        onClose={() => setIsExperienceEditorOpen(false)}
        onSave={handleSaveExperience}
      />
      {/* Education Editor Modal */}
      <EducationEditor
        education={editingEducation}
        isOpen={isEducationEditorOpen}
        onClose={() => setIsEducationEditorOpen(false)}
        onSave={handleSaveEducation}
      />
      {/* Skill Editor Modal */}
      <SkillEditor
        skill={editingSkill}
        isOpen={isSkillEditorOpen}
        onClose={() => setIsSkillEditorOpen(false)}
        onSave={handleSaveSkill}
      />
      <LanguageEditor
        language={editingLanguage}
        isOpen={isLanguageEditorOpen}
        onClose={() => setIsLanguageEditorOpen(false)}
        onSave={handleSaveLanguage}
      />

      <CertificationEditor
        certification={editingCertification}
        isOpen={isCertificationEditorOpen}
        onClose={() => setIsCertificationEditorOpen(false)}
        onSave={handleSaveCertification}
      />

      <ProjectEditor
        project={editingProject}
        candidateId={userProfile?.id}
        isOpen={isProjectEditorOpen}
        onClose={() => setIsProjectEditorOpen(false)}
        onSave={handleSaveProject}
      />
    </div>
  );
};

export default CandidateProfilePage;


