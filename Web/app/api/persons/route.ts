import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createPersonSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  gender: z.string(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  isAlive: z.boolean().optional(),
  profileImage: z.string().optional(),
  additionalImages: z.string().optional(),
  bio: z.string().optional(),
  fatherId: z.string().optional(),
  motherId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const gender = searchParams.get('gender')
  const isAlive = searchParams.get('isAlive')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = {}
  
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ]
  }
  
  if (gender) {
    where.gender = gender
  }
  
  if (isAlive !== null && isAlive !== undefined) {
    where.isAlive = isAlive === 'true'
  }

  const [persons, total] = await Promise.all([
    prisma.person.findMany({
      where,
      include: {
        father: { select: { id: true, firstName: true, lastName: true } },
        mother: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { firstName: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.person.count({ where }),
  ])

  return NextResponse.json({
    data: persons,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Clean data: convert empty strings to undefined
    const cleanBody: any = {}
    for (const [key, value] of Object.entries(body)) {
      cleanBody[key] = value === '' ? undefined : value
    }

    const data = createPersonSchema.parse(cleanBody)

  const person = await prisma.person.create({
    data: {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      deathDate: data.deathDate ? new Date(data.deathDate) : undefined,
    },
    include: {
      father: { select: { id: true, firstName: true, lastName: true } },
      mother: { select: { id: true, firstName: true, lastName: true } },
    },
  })

    return NextResponse.json(person, { status: 201 })
  } catch (error) {
    console.error('Error creating person:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}