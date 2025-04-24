import { useState } from "react";
import { Project } from "../types";

interface ProjectModalProps {
  project?: Project;
  onSave: (projectData: Omit<Project, "id" | "userId" | "createdAt">) => void;
  onClose: () => void;
  loading: boolean;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, onSave, onClose, loading }) => {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [logo, setLogo] = useState(project?.logo || "");
  const [startDate, setStartDate] = useState(project?.startDate || "");
  const [endDate, setEndDate] = useState(project?.endDate || "");

  const handleSubmit = () => {
    onSave({
      name,
      description,
      logo,
      startDate,
      endDate,
      geolocation: project?.geolocation || { latitude: 0, longitude: 0 }, // Will be updated by parent
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Project | Basic Information</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Logo (main logo will come first)</label>
            <input
              type="text"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="Logo URL"
              className="w-full p-2 bg-gray-700 rounded text-white"
            />
            <button className="mt-2 px-4 py-2 bg-gray-600 rounded">+ Add Logo</button>
          </div>

          <div>
            <label className="block text-sm mb-1">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">End Date *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Location *</label>
            <input
              type="text"
              value={
                project?.geolocation
                  ? `${project.geolocation.latitude}, ${project.geolocation.longitude}`
                  : "Fetching location..."
              }
              className="w-full p-2 bg-gray-700 rounded text-white"
              disabled
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name || !startDate || !endDate}
            className="px-4 py-2 bg-yellow-500 text-black rounded disabled:bg-gray-400"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
