export interface Message {
  id: string;
  text: string;
  image?: string;
  time: string;
  isOwn: boolean;
  avatar: string;
  name: string;
}