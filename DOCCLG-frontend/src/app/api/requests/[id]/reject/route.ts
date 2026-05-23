import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
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
    const { reason } = rejectSchema.parse(body);

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

    // Check if user can reject this request
    let canReject = false;
    if (payload.role === 'CLASS_INCHARGE' && documentRequest.status === 'PENDING') {
      canReject = true;
    } else if (payload.role === 'HOD' && documentRequest.status === 'CLASS_INCHARGE_APPROVED') {
      canReject = true;
    }

    if (!canReject) {
      return NextResponse.json(
        { error: 'Cannot reject this request at current status' },
        { status: 400 }
      );
    }

    // Update request to rejected
    const updatedRequest = await db.documentRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedBy: payload.userId,
        rejectedAt: new Date(),
        rejectionReason: reason
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

    // TODO: Send rejection email notification to student

    return NextResponse.json({
      request: updatedRequest,
      message: 'Request rejected successfully'
    });

  } catch (error) {
    console.error('Reject request error:', error);
    
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
