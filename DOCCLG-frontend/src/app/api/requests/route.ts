import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createRequestSchema = z.object({
  documentType: z.enum(['BONAFIDE', 'ATTENDANCE', 'RECOMMENDATION', 'CHARACTER', 'CUSTOM']),
  customDocumentName: z.string().optional(),
  purpose: z.string().min(1, 'Purpose is required'),
  additionalDetails: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentType, customDocumentName, purpose, additionalDetails } = createRequestSchema.parse(body);

    // Create document request
    const documentRequest = await db.documentRequest.create({
      data: {
        studentId: payload.userId,
        documentType,
        customDocumentName,
        purpose,
        additionalDetails,
        status: 'PENDING'
      },
      include: {
        student: {
          select: {
            name: true,
            email: true,
            registrationNumber: true,
            department: true,
            class: true
          }
        }
      }
    });

    return NextResponse.json({
      request: documentRequest,
      message: 'Document request created successfully'
    });

  } catch (error) {
    console.error('Create request error:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let requests;

    if (payload.role === 'STUDENT') {
      // Get student's own requests
      requests = await db.documentRequest.findMany({
        where: { studentId: payload.userId },
        include: {
          student: {
            select: {
              name: true,
              email: true,
              registrationNumber: true
            }
          },
          classIncharge: {
            select: {
              name: true,
              email: true
            }
          },
          hod: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (payload.role === 'CLASS_INCHARGE') {
      // Get requests for class incharge's classes
      requests = await db.documentRequest.findMany({
        where: {
          student: {
            class: {
              department: {
                users: {
                  some: {
                    id: payload.userId,
                    role: 'CLASS_INCHARGE'
                  }
                }
              }
            }
          },
          status: 'PENDING'
        },
        include: {
          student: {
            select: {
              name: true,
              email: true,
              registrationNumber: true,
              department: true,
              class: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (payload.role === 'HOD') {
      // Get requests approved by class incharge for HOD's department
      requests = await db.documentRequest.findMany({
        where: {
          student: {
            department: {
              users: {
                some: {
                  id: payload.userId,
                  role: 'HOD'
                }
              }
            }
          },
          status: 'CLASS_INCHARGE_APPROVED'
        },
        include: {
          student: {
            select: {
              name: true,
              email: true,
              registrationNumber: true,
              department: true,
              class: true
            }
          },
          classIncharge: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Admin can see all requests
      requests = await db.documentRequest.findMany({
        include: {
          student: {
            select: {
              name: true,
              email: true,
              registrationNumber: true,
              department: true,
              class: true
            }
          },
          classIncharge: {
            select: {
              name: true,
              email: true
            }
          },
          hod: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ requests });

  } catch (error) {
    console.error('Get requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}