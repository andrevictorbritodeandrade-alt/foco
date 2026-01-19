export interface Category {
  id: string;
  name: string;
  color: string;
  iconName: string;
  bgColor?: string;
}

export interface Task {
  id: number;
  text: string;
  categoryId: string;
  completed: boolean;
  note?: string;
  insight?: string;
  createdAt: number;
  dueDate?: string;
}

export interface AICoachResponse {
  message: string;
  isUrgent: boolean;
}