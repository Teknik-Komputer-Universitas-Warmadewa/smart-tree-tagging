import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { Project } from "../types";
import { db } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

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

export const uploadImage = async (
  file: File,
  userId: string,
  projectId: string
): Promise<string> => {
  try {
    // Buat referensi penyimpanan dengan path unik, misalnya: users/{userId}/projects/{projectId}/logo
    const storageRef = ref(storage, `users/${userId}/projects/${projectId}/logo`);

    // Unggah file ke Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);

    // Dapatkan URL download gambar
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
};

export const deleteOldLogo = async (userId: string, projectId: string) => {
  const oldLogoRef = ref(storage, `users/${userId}/projects/${projectId}/logo`);
  try {
    await deleteObject(oldLogoRef);
  } catch (error) {
    console.error("Error deleting old logo:", error);
  }
};
