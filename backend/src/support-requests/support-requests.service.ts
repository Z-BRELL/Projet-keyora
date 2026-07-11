import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';

@Injectable()
export class SupportRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupportRequestDto) {
    return this.prisma.supportRequest.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        message: dto.message,
        status: 'PENDING',
      },
    });
  }

  async findAll() {
    const requests = await this.prisma.supportRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const emails = requests.map(r => r.email);
    const users = await this.prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true },
    });

    const userMap = new Map(users.map(u => [u.email, u.id]));

    return requests.map(r => ({
      ...r,
      userId: userMap.get(r.email) || null,
    }));
  }

  async resolve(id: string) {
    const ticket = await this.prisma.supportRequest.findUnique({
      where: { id },
    });
    if (!ticket) throw new NotFoundException('Support request not found');

    return this.prisma.supportRequest.update({
      where: { id },
      data: { status: 'RESOLVED' },
    });
  }
}
