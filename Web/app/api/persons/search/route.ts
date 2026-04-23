import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const gender = searchParams.get('gender')
  const limit = parseInt(searchParams.get('limit') || '10')

  if (!query || query.length < 1) {
    return NextResponse.json([])
  }

  const where: any = {
    OR: [
      { firstName: { contains: query } },
      { lastName: { contains: query } },
    ],
  }

  if (gender && gender !== 'ALL') {
    where.gender = gender
  }

  const persons = await prisma.person.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gender: true,
      father: {
        select: { firstName: true, lastName: true },
      },
      mother: {
        select: { firstName: true },
      },
    },
    take: limit,
  })

  const formatted = persons.map((p) => ({
    id: p.id,
    label: [
      p.firstName,
      p.father?.lastName,
      p.mother?.firstName ? `(${p.mother.firstName})` : null,
      p.lastName && p.lastName !== p.father?.lastName ? `- ${p.lastName}` : null,
    ]
      .filter(Boolean)
      .join(' '),
    firstName: p.firstName,
    lastName: p.lastName,
    gender: p.gender,
  }))

  return NextResponse.json(formatted)
}