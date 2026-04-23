import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPersonDisplayName(person: {
  firstName: string
  lastName: string | null
  father?: { firstName: string; lastName: string | null } | null
  mother?: { firstName: string } | null
}): string {
  const parts = [person.firstName]
  
  if (person.father?.lastName) {
    parts.push(person.father.lastName)
  }
  
  if (person.mother?.firstName) {
    parts.push(`(${person.mother.firstName})`)
  }
  
  if (person.lastName && person.lastName !== person.father?.lastName) {
    parts.push(`- ${person.lastName}`)
  }
  
  return parts.join(' ')
}