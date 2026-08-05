import { User } from '../models/user.model';

export const mockUsers: User[] = [
  {
    id: 'user-ana',
    firstName: 'Ana',
    lastName: 'Pérez',
    username: 'ana.perez',
    email: 'ana@linkup.com',
    birthdate: '1995-05-12',
    password: '123456',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    bio: 'Me encanta la fotografía, el café y crear experiencias memorables.',
    joined: '12 de mayo de 2024'
  },
  {
    id: 'user-lucas',
    firstName: 'Lucas',
    lastName: 'García',
    username: 'lucas.garcia',
    email: 'lucas@linkup.com',
    birthdate: '1993-08-18',
    password: '123456',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    bio: 'Diseñador de producto con pasión por interfaces limpias y trabajo en equipo.',
    joined: '3 de julio de 2024'
  },
  {
    id: 'user-mariana',
    firstName: 'Mariana',
    lastName: 'Ruiz',
    username: 'mariana.ruiz',
    email: 'mariana@linkup.com',
    birthdate: '1998-02-23',
    password: '123456',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80',
    bio: 'Amante de la música, viajes y conversaciones bonitas.',
    joined: '14 de agosto de 2024'
  },
  {
    id: 'user-diego',
    firstName: 'Diego',
    lastName: 'Torres',
    username: 'diego.torres',
    email: 'diego@linkup.com',
    birthdate: '1991-11-04',
    password: '123456',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    bio: 'Desarrollador frontend que disfruta convertir ideas en productos útiles.',
    joined: '21 de septiembre de 2024'
  },
  {
    id: 'user-sara',
    firstName: 'Sara',
    lastName: 'Chen',
    username: 'sara.chen',
    email: 'sara@linkup.com',
    birthdate: '1996-06-29',
    password: '123456',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    bio: 'Explorando nuevas conexiones, ciudades y proyectos creativos.',
    joined: '6 de enero de 2025'
  }
];

export const mockMessagesByConversation: Record<string, any[]> = {
  'conv-user-lucas': [
    {
      id: 'msg-1',
      text: '¡Hola! ¿Cómo estás?',
      time: '18:25',
      isOwn: false,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      name: 'Lucas García'
    },
    {
      id: 'msg-2',
      text: 'Todo bien, ¿y tú?',
      time: '18:26',
      isOwn: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      name: 'Ana Pérez'
    },
    {
      id: 'msg-3',
      text: 'Muy bien. Me gustaría que vieras el prototipo de la app antes de la reunión.',
      time: '18:28',
      isOwn: false,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      name: 'Lucas García'
    }
  ],
  'conv-user-mariana': [
    {
      id: 'msg-4',
      text: '¿Te gustó el lugar del domingo?',
      time: '11:15',
      isOwn: false,
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80',
      name: 'Mariana Ruiz'
    },
    {
      id: 'msg-5',
      text: 'Sí, la vista era increíble. Me quedó con ganas de volver.',
      time: '11:18',
      isOwn: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      name: 'Ana Pérez'
    }
  ],
  'conv-user-diego': [
    {
      id: 'msg-6',
      text: 'Te compartí la última versión del diseño.',
      time: '09:10',
      isOwn: false,
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      name: 'Diego Torres'
    },
    {
      id: 'msg-7',
      text: 'Gracias, la reviso ahora mismo.',
      time: '09:12',
      isOwn: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      name: 'Ana Pérez'
    }
  ],
  'conv-user-sara': [
    {
      id: 'msg-8',
      text: '¿Vamos a tomar un café este fin de semana?',
      time: '20:40',
      isOwn: false,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      name: 'Sara Chen'
    },
    {
      id: 'msg-9',
      text: '¡Me encantaría! Te escribo para confirmar.',
      time: '20:43',
      isOwn: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      name: 'Ana Pérez'
    }
  ]
};

export function ensureMockData(): void {
  if (typeof localStorage === 'undefined') return;

  const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
  if (!storedUsers.length) {
    localStorage.setItem('users', JSON.stringify(mockUsers));
  }

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser && mockUsers.length) {
    localStorage.setItem('currentUser', JSON.stringify(mockUsers[0]));
  }

  Object.entries(mockMessagesByConversation).forEach(([conversationId, messages]) => {
    if (!localStorage.getItem('messages_' + conversationId)) {
      localStorage.setItem('messages_' + conversationId, JSON.stringify(messages));
    }
  });
}
