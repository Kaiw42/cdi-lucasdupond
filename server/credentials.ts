export interface TeacherCredential {
  id: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface StudentCredential {
  id: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  classe: string;
}

export const TEACHER_CREDENTIALS: TeacherCredential[] = [
  {
    id: "teacher-1",
    username: "prof1",
    password: "prof123",
    firstName: "Jean",
    lastName: "Dupont",
  },
  {
    id: "teacher-2",
    username: "prof2",
    password: "prof123",
    firstName: "Marie",
    lastName: "Martin",
  },
];

export const STUDENT_CREDENTIALS: StudentCredential[] = [
  { id: "student-1", username: "eleve1", password: "eleve123", firstName: "Lucas", lastName: "Bernard", classe: "6e" },
  { id: "student-2", username: "eleve2", password: "eleve123", firstName: "Emma", lastName: "Petit", classe: "6e" },
  { id: "student-3", username: "eleve3", password: "eleve123", firstName: "Hugo", lastName: "Robert", classe: "6e" },
  { id: "student-4", username: "eleve4", password: "eleve123", firstName: "Lea", lastName: "Richard", classe: "5e" },
  { id: "student-5", username: "eleve5", password: "eleve123", firstName: "Nathan", lastName: "Durand", classe: "5e" },
  { id: "student-6", username: "eleve6", password: "eleve123", firstName: "Chloe", lastName: "Dubois", classe: "5e" },
  { id: "student-7", username: "eleve7", password: "eleve123", firstName: "Enzo", lastName: "Moreau", classe: "4e" },
  { id: "student-8", username: "eleve8", password: "eleve123", firstName: "Manon", lastName: "Laurent", classe: "4e" },
  { id: "student-9", username: "eleve9", password: "eleve123", firstName: "Louis", lastName: "Simon", classe: "4e" },
  { id: "student-10", username: "eleve10", password: "eleve123", firstName: "Jade", lastName: "Michel", classe: "3e" },
  { id: "student-11", username: "eleve11", password: "eleve123", firstName: "Gabriel", lastName: "Leroy", classe: "3e" },
  { id: "student-12", username: "eleve12", password: "eleve123", firstName: "Sarah", lastName: "Roux", classe: "3e" },
];

export function findTeacherByCredentials(username: string, password: string): TeacherCredential | undefined {
  return TEACHER_CREDENTIALS.find(
    (t) => t.username === username && t.password === password
  );
}

export function findStudentByCredentials(username: string, password: string): StudentCredential | undefined {
  return STUDENT_CREDENTIALS.find(
    (s) => s.username === username && s.password === password
  );
}

export function getAllCredentials() {
  return {
    teachers: TEACHER_CREDENTIALS.map(t => ({
      username: t.username,
      password: t.password,
      firstName: t.firstName,
      lastName: t.lastName,
      role: "teacher" as const,
    })),
    students: STUDENT_CREDENTIALS.map(s => ({
      username: s.username,
      password: s.password,
      firstName: s.firstName,
      lastName: s.lastName,
      classe: s.classe,
      role: "student" as const,
    })),
  };
}

export function addStudentCredential(student: StudentCredential): void {
  STUDENT_CREDENTIALS.push(student);
}

export function deleteStudentCredential(username: string): boolean {
  const index = STUDENT_CREDENTIALS.findIndex(s => s.username === username);
  if (index !== -1) {
    STUDENT_CREDENTIALS.splice(index, 1);
    return true;
  }
  return false;
}

export function getStudentCredentials(): StudentCredential[] {
  return [...STUDENT_CREDENTIALS];
}

export function addTeacherCredential(teacher: TeacherCredential): void {
  TEACHER_CREDENTIALS.push(teacher);
}

export function deleteTeacherCredential(username: string): boolean {
  const index = TEACHER_CREDENTIALS.findIndex(t => t.username === username);
  if (index !== -1) {
    TEACHER_CREDENTIALS.splice(index, 1);
    return true;
  }
  return false;
}

export function getTeacherCredentials(): TeacherCredential[] {
  return [...TEACHER_CREDENTIALS];
}
