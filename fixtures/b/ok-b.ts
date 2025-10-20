// Another valid file
export interface User {
  id: string;
  name?: string;
}

export const getId = (u: User): string => u.id;
