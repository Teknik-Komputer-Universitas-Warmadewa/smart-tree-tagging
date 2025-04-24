/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { createProject, getUserProjects, updateProject } from "../firebase/projects";

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

  const handleCreateProject = async (projectData: Omit<Project, "id" | "userId" | "createdAt">) => {
    if (!user) return;
    setLoading(true);
    try {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const newProject = await createProject(user.uid, projectData.name, {
            latitude,
            longitude,
          });
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
      setError("Failed to create project");
      setLoading(false);
    }
  };

  const handleSelectProject = (projectId: string) => {
    localStorage.setItem("selectedProjectId", projectId);
    navigate("/dashboard");
  };

  const handleEditProject = async (projectData: Omit<Project, "id" | "userId" | "createdAt">) => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      await updateProject(selectedProject.id, projectData);
      setProjects(
        projects.map((p) => (p.id === selectedProject.id ? { ...p, ...projectData } : p))
      );
      setShowEditModal(false);
    } catch (err) {
      setError("Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Own Project</h1>
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
                {/* Placeholder for project image/logo */}
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536M9 14h6l-3-3m-3 3V8a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2z"
                  />
                </svg>
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
