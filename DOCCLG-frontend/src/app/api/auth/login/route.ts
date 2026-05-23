import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or registration number is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['STUDENT', 'CLASS_INCHARGE', 'HOD', 'ADMIN']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password, role } = loginSchema.parse(body);

    // Find user based on role and identifier
    let user;
    if (role === 'STUDENT') {
      user = await db.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { registrationNumber: identifier }
          ],
          role: 'STUDENT'
        },
        include: {
          department: true,
          class: true
        }
      });
    } else {
      user = await db.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { facultyId: identifier }
          ],
          role: role
        },
        include: {
          department: true
        }
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    // Return user data and token
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      registrationNumber: user.registrationNumber,
      facultyId: user.facultyId,
      department: user.department,
      class: user.class
    };

    return NextResponse.json({
      user: userData,
      token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    
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