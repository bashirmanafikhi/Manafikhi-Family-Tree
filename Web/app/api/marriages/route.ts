import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMarriageSchema = z.object({
  person1Id: z.string(),
  person2Id: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isCurrent: z.boolean().optional(),
  notes: z.string().nullable(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const personId = searchParams.get('personId')

  if (!personId) {
    return NextResponse.json({ error: 'personId required' }, { status: 400 })
  }

  const marriages = await prisma.marriage.findMany({
    where: {
      OR: [{ person1Id: personId }, { person2Id: personId }],
    },
    include: {
      person1: { select: { id: true, firstName: true, lastName: true, gender: true } },
      person2: { select: { id: true, firstName: true, lastName: true, gender: true } },
    },
  })

  return NextResponse.json(marriages)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const data = createMarriageSchema.parse(body)

  const marriage = await prisma.marriage.create({
    data: {
      person1Id: data.person1Id,
      person2Id: data.person2Id,
      isCurrent: data.isCurrent ?? true,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      notes: data.notes || null,
    },
    include: {
      person1: { select: { id: true, firstName: true, lastName: true } },
      person2: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(marriage, { status: 201 })
}