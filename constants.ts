
import { TaskStatus, Priority, User, Project, Task } from './types';

export const CURRENT_USER: User = {
  id: 'user-1',
  name: 'Alex Rivera',
  email: 'alex@zenflow.io',
  avatar: 'https://picsum.photos/seed/alex/200'
};

export const TEAM_MEMBERS: User[] = [
  CURRENT_USER,
  { id: 'user-2', name: 'Sarah Chen', email: 'sarah@zenflow.io', avatar: 'https://picsum.photos/seed/sarah/200' },
  { id: 'user-3', name: 'Mike Johnson', email: 'mike@zenflow.io', avatar: 'https://picsum.photos/seed/mike/200' },
  { id: 'user-4', name: 'Leila Smith', email: 'leila@zenflow.io', avatar: 'https://picsum.photos/seed/leila/200' },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'ZenFlow Mobile App',
    description: 'Developing the next-gen project management experience for iOS and Android.',
    ownerId: 'user-1',
    members: ['user-1', 'user-2', 'user-4'],
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'proj-2',
    name: 'Marketing Campaign Q4',
    description: 'Strategic planning and execution for the holiday season growth drive.',
    ownerId: 'user-2',
    members: ['user-1', 'user-2', 'user-3'],
    createdAt: Date.now() - 86400000 * 5,
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Design Login UI',
    description: 'Create high-fidelity mockups for the new authentication flow.',
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    assigneeId: 'user-2',
    creatorId: 'user-1',
    createdAt: Date.now() - 3600000,
    comments: [],
    labels: ['design', 'ui']
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    title: 'API Integration: OAuth',
    description: 'Connect the frontend with the Google/GitHub OAuth providers.',
    status: TaskStatus.TODO,
    priority: Priority.URGENT,
    assigneeId: 'user-1',
    creatorId: 'user-1',
    createdAt: Date.now() - 7200000,
    comments: [],
    labels: ['backend', 'security']
  },
  {
    id: 'task-3',
    projectId: 'proj-1',
    title: 'Bug: Navigation lag',
    description: 'Fix the noticeable delay when switching between project boards.',
    status: TaskStatus.REVIEW,
    priority: Priority.MEDIUM,
    assigneeId: 'user-4',
    creatorId: 'user-2',
    createdAt: Date.now() - 150000,
    comments: [
      { id: 'c1', userId: 'user-1', userName: 'Alex Rivera', text: 'I noticed this too on iPhone 13.', timestamp: Date.now() - 100000 }
    ],
    labels: ['bug', 'performance']
  }
];
