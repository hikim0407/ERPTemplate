// 가짜 DB (In-Memory Database)
// 서버가 재시작되면 데이터가 날아가지만, 개발 테스트용으로는 충분합니다.

type User = {
  id: string
  email: string
  name: string
  role: string
  password?: string // 실제로는 해싱해야 하지만 여기선 평문 저장
}

const initialUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    password: 'password123'
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Normal User',
    role: 'user',
    password: 'password123'
  }
]

// Global 객체에 저장하여 HMR(Hot Module Replacement) 시에도 데이터 유지
const globalForMock = global as unknown as { mockDb: { users: User[] } }

export const mockDb = globalForMock.mockDb || {
  users: [...initialUsers]
}

if (process.env.NODE_ENV !== 'production') globalForMock.mockDb = mockDb

