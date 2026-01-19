export interface Category {
  id: string;
  name: string;
  color: string;
  iconName: string;
}

export interface Task {
  id: number;
  text: string;
  categoryId: string;
  completed: boolean;
  note?: string;
  createdAt: number;
  dueDate?: string; // ISO String
}

export interface AICoachResponse {
  message: string;
  isUrgent: boolean;
}