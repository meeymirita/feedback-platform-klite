// Роль с бэкенда (Prisma enum UserRole). НЕ путать с Employee.role
export type UserRole = 'USER' | 'ADMIN' | 'MIRA'

// Пользователь как его отдаёт /api/v1/users/profile и /auth/{login,register}.
// Пароль бэк не отдаёт никогда.
export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface Credentials {
  email: string
  password: string
}
