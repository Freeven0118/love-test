
export type Category = '形象外表' | '社群形象' | '行動與互動' | '心態與習慣';

export interface Question {
  id: number;
  category: Category;
  text: string;
  imageUrl?: string; // 新增：預設圖片路徑
}

export interface DimensionResult {
  category: Category;
  score: number;
  level: '紅燈' | '黃燈' | '綠燈';
  color: string;
  description: string;
  suggestion: string;
}

export interface Answer {
  questionId: number;
  score: number;
}
