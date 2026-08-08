export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  birthdate: string;
  password: string;
  avatar: string;
  bio?: string;
  joined?: string;
}