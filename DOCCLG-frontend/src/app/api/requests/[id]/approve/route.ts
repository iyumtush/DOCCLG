import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const approveSchema = z.object({
  comments: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'CLASS_INCHARGE' && payload.role !== 'HOD')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { comments } = approveSchema.parse(body);

    // Get the request
    const documentRequest = await db.documentRequest.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            department: true,
            class: true
          }
        }
      }
    });

    if (!documentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    let updatedRequest;

    if (payload.role === 'CLASS_INCHARGE') {
      // Class Incharge approval
      if (documentRequest.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Request is not in pending state' },
          { status: 400 }
        );
      }

      updatedRequest = await db.documentRequest.update({
        where: { id },
        data: {
          status: 'CLASS_INCHARGE_APPROVED',
          classInchargeId: payload.userId,
          classInchargeApprovedAt: new Date(),
          classInchargeComments: comments
        },
        include: {
          student: {
            select: {
              name: true,
              email: true,
              registrationNumber: true
            }
          }
        }
      });

      // TODO: Send email notification to student and HOD

    } else if (payload.role === 'HOD') {
      // HOD approval
      if (documentRequest.status !== 'CLASS_INCHARGE_APPROVED') {
        return NextResponse.json(
          { error: 'Request must be approved by Class Incharge first' },
          { status: 400 }
        );
      }

      // Generate certificate ID
      const certificateId = `${process.env.COLLEGE_CODE || 'ABC'}/${documentRequest.student.department?.code || 'DEPT'}/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      updatedRequest = await db.documentRequest.update({
        where: { id },
        data: {
          status: 'HOD_APPROVED',
          hodId: payload.userId,
          hodApprovedAt: new Date(),
          hodComments: comments,
          certificateId,
          issuedAt: new Date()
        },
        include: {
          student: {
            select: {
              name: true,
              email: true,
              registrationNumber: true
            }
          }
        }
      });

      // TODO: Generate certificate document and send email
    }

    return NextResponse.json({
      request: updatedRequest,
      message: 'Request approved successfully'
    });

  } catch (error) {
    console.error('Approve request error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
