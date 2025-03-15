export interface TreeData {
  id: string;
  location: { latitude: number; longitude: number } | null;
  remark: string;
  type: string;
  age: number;
  fertilizationDate: string;
  pesticideDate: string;
  wateringDate: string;
  updatedAt: string;
}
