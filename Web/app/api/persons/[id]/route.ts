import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

const updatePersonSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.any().optional(),
  gender: z.any().optional(),
  birthDate: z.any().optional(),
  deathDate: z.any().optional(),
  isAlive: z.any().optional(),
  profileImage: z.any().optional(),
  additionalImages: z.any().optional(),
  bio: z.any().optional(),
  fatherId: z.any().optional(),
  motherId: z.any().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const person = await prisma.person.findUnique({
    where: { id: params.id },
    include: {
      father: { select: { id: true, firstName: true, lastName: true } },
      mother: { select: { id: true, firstName: true, lastName: true } },
      childrenOfFather: {
        select: { id: true, firstName: true, lastName: true, gender: true },
      },
      childrenOfMother: {
        select: { id: true, firstName: true, lastName: true, gender: true },
      },
      marriagesAsPerson1: {
        include: {
          person2: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      marriagesAsPerson2: {
        include: {
          person1: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  })

  if (!person) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 })
  }

  return NextResponse.json(person)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  
  // Preprocess to handle null values - convert empty strings to null
  const processedBody: any = {}
  for (const [key, value] of Object.entries(body)) {
    if (value === '' || value === undefined) {
      processedBody[key] = null
    } else {
      processedBody[key] = value
    }
  }
  
  const data = updatePersonSchema.parse(processedBody)

  const updateData: any = { ...data }
  if (data.birthDate) updateData.birthDate = new Date(data.birthDate)
  if (data.deathDate) updateData.deathDate = new Date(data.deathDate)

  // Handle null parent IDs properly - set to undefined to clear
  if (updateData.fatherId === null) updateData.fatherId = undefined
  if (updateData.motherId === null) updateData.motherId = undefined

  const person = await prisma.person.update({
    where: { id: params.id },
    data: updateData,
    include: {
      father: { select: { id: true, firstName: true, lastName: true } },
      mother: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(person)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const personId = params.id

  try {
    await prisma.$transaction([
      prisma.marriage.deleteMany({
        where: {
          OR: [{ person1Id: personId }, { person2Id: personId }],
        },
      }),
      prisma.person.updateMany({
        where: { fatherId: personId },
        data: { fatherId: null },
      }),
      prisma.person.updateMany({
        where: { motherId: personId },
        data: { motherId: null },
      }),
      prisma.person.delete({
        where: { id: personId },
      }),
    ])
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: true })
    }
    throw error
  }

  revalidatePath('/persons')
  revalidatePath('/')
  revalidatePath('/persons/new')
  revalidatePath('/tree')

  return NextResponse.json({ success: true })
}