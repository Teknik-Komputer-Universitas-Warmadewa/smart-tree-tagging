/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";

import { getUserProjects } from "../firebase/projects";
import { Project } from "../types";
import { useUser } from "./UserContext";

interface ProjectContextType {
  selectedProject: Project | null;
  projects: Project[];
  setSelectedProject: (project: Project | null) => void;
}
export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (user) {
      getUserProjects(user.uid).then((projects) => {
        setProjects(projects);
        const selectedId = localStorage.getItem("selectedProjectId");
        const project = projects.find((p) => p.id === selectedId) || projects[0] || null;
        setSelectedProject(project);
      });
    }
  }, [user]);

  return (
    <ProjectContext.Provider value={{ selectedProject, projects, setSelectedProject }}>
      {children}
    </ProjectContext.Provider>
  );
};
