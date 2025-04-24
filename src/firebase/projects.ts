import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { Project } from "../types";
import { db } from "../firebase";

export const createProject = async (
  userId: string,
  name: string,
  geolocation: { latitude: number; longitude: number }
) => {
  const project: Omit<Project, "id" | "createdAt"> = {
    name,
    geolocation,
    userId,
    description: "",
    logo: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  };
  const docRef = await addDoc(collection(db, "projects"), {
    ...project,
    createdAt: new Date().toISOString(),
  });
  return { id: docRef.id, ...project, createdAt: new Date().toISOString() } as Project;
};

export const updateProject = async (projectId: string, projectData: Partial<Project>) => {
  const projectRef = doc(db, "projects", projectId);
  await updateDoc(projectRef, projectData);
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
  const q = query(collection(db, "projects"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Project));
};
