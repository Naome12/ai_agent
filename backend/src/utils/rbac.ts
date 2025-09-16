import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Loads the training by :id and ensures:
 *  - ADMIN: allowed
 *  - TRAINER: only if training.trainerId == current trainer.id
 * Attaches training to req as (req as any).training
 */
export async function canAccessTraining(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = (req as any).user as { id: number; role: string; email: string };
    const trainingId = Number(req.params.id || req.body.trainingId);
    if (!Number.isFinite(trainingId)) {
      return res.status(400).json({ success: false, message: 'Invalid training id' });
    }

    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        duration: true,
        locationDistrict: true,
        locationSector: true,
        locationCell: true,
        status: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        trainers: true, // Ensure trainers relation is included
      },
    });
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found' });
    }

    if (authUser.role === 'ADMIN') {
      (req as any).training = training;
      return next();
    }

    if (authUser.role === 'TRAINER') {
      // find trainer profile for this user
      const trainer = await prisma.trainer.findUnique({ where: { userId: authUser.id } });
      if (
        !trainer ||
        !training.trainers.some((t: { trainerId: number }) => t.trainerId === trainer.id)
      ) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      (req as any).training = training;
      return next();
    }

    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Access check failed' });
  }
}
