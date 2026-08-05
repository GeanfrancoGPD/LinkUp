import { Routes } from '@angular/router';
import { LoginComponent } from './components/pages/login/login.component';
import { RegisterComponent } from './components/pages/register/register.component';
import { HomeComponent } from './components/pages/home/home.component';
import { ProfileComponent } from './components/pages/profile/profile.component';
import { ProfileEditComponent } from './components/pages/profile-edit/profile-edit.component';
import { ProfileOtherComponent } from './components/pages/profile-other/profile-other.component';
import { SwipeComponent } from './components/pages/swipe/swipe.component';
import { ChatListComponent } from './components/pages/chat-list/chat-list.component';
import { ChatRoomComponent } from './components/pages/chat-room/chat-room.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'profile/edit', component: ProfileEditComponent },
  { path: 'profile/:id', component: ProfileOtherComponent },
  { path: 'swipe', redirectTo: '/solicitudes', pathMatch: 'full' },
  { path: 'solicitudes', component: SwipeComponent },
  { path: 'chats', component: ChatListComponent },
  { path: 'chat/:id', component: ChatRoomComponent },
  { path: '**', redirectTo: '/home' } // <-- wildcard correcto
];