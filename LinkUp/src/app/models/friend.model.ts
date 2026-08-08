export interface FriendSuggestion {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  bio?: string;
  mutual?: number;
}