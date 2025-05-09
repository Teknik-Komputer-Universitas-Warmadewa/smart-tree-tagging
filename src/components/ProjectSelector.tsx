import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { createProject, getUserProjects, updateProject, uploadImage } from "../firebase/projects";
import { useNavigate } from "react-router-dom";
import { Project } from "../types";
import ProjectModal from "./ProjectModal";

const ProjectSelector: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    console.log("User:", user?.uid);
    if (user) {
      getUserProjects(user.uid)
        .then(setProjects)
        .catch(() => setError("Failed to load projects"));
    }
  }, [user]);

  const getStatus = (project: Project) => {
    const endDate = new Date(project.endDate);
    const now = new Date();
    if (endDate < now) return { label: "OVERDUE", color: "bg-orange-500" };
    return { label: "IN PROGRESS", color: "bg-yellow-500" };
  };

  const handleCreateProject = async (
    projectData: Omit<Project, "id" | "userId" | "createdAt"> & { logoFile?: File }
  ) => {
    if (!user) return;
    setLoading(true);
    try {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser");
        setLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const newProjectData = {
            name: projectData.name,
            description: projectData.description,
            logo: "", // Akan diisi setelah upload
            startDate: projectData.startDate,
            endDate: projectData.endDate,
            geolocation: { latitude, longitude },
          };

          // Buat proyek terlebih dahulu untuk mendapatkan ID
          const newProject = await createProject(user.uid, newProjectData.name, {
            latitude,
            longitude,
          });

          // Jika ada file logo, unggah ke Firebase Storage
          let logoUrl = projectData.logo;
          if (projectData.logoFile) {
            logoUrl = await uploadImage(projectData.logoFile, user.uid, newProject.id);
            // Perbarui proyek dengan URL logo
            await updateProject(newProject.id, { ...newProjectData, logo: logoUrl });
            newProject.logo = logoUrl;
          }

          setProjects([...projects, newProject]);
          setShowCreateModal(false);
          setLoading(false);
        },
        () => {
          setError("Please allow location access to create a project");
          setLoading(false);
        }
      );
    } catch (err) {
      if (err instanceof Error) {
        setError("Failed to create project");
      }

      setLoading(false);
    }
  };

  const handleSelectProject = (projectId: string) => {
    localStorage.setItem("selectedProjectId", projectId);
    navigate("/dashboard");
  };

  const handleEditProject = async (
    projectData: Omit<Project, "id" | "userId" | "createdAt"> & { logoFile?: File }
  ) => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      let logoUrl = projectData.logo;
      if (projectData.logoFile && user) {
        // Unggah logo baru jika ada file yang dipilih
        logoUrl = await uploadImage(projectData.logoFile, user.uid, selectedProject.id);
      }

      const updatedProjectData = {
        name: projectData.name,
        description: projectData.description,
        logo: logoUrl,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        geolocation: projectData.geolocation,
      };

      await updateProject(selectedProject.id, updatedProjectData);
      setProjects(
        projects.map((p) => (p.id === selectedProject.id ? { ...p, ...updatedProjectData } : p))
      );
      setShowEditModal(false);
    } catch (err) {
      if (err instanceof Error) {
        setError("Failed to create project");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Own Project</h1>
        <p className="text-xs font-bold">Version {__APP_VERSION__}</p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Create New Project
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {projects.map((project) => {
          const status = getStatus(project);
          return (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow cursor-pointer relative"
              onClick={() => handleSelectProject(project.id)}
            >
              <div className="relative">
                <div className="h-40 bg-gray-200 rounded-t-lg flex items-center justify-center">
                  {project.logo ? (
                    <img
                      src={project.logo}
                      alt={project.name}
                      className="h-full w-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <span className="text-gray-500">No Image</span>
                  )}
                </div>
                <span
                  className={`absolute top-2 left-2 text-white px-2 py-1 rounded ${status.color}`}
                >
                  {status.label}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <p className="text-gray-600 text-sm">{project.description || "No description"}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProject(project);
                  setShowEditModal(true);
                }}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <ProjectModal
          onSave={handleCreateProject}
          onClose={() => setShowCreateModal(false)}
          loading={loading}
        />
      )}

      {showEditModal && selectedProject && (
        <ProjectModal
          project={selectedProject}
          onSave={handleEditProject}
          onClose={() => setShowEditModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ProjectSelector;
