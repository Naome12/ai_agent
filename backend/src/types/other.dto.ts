import { z } from "zod";

/**
 * JobSeeker update DTO
 */
export const JobSeekerUpdateDto = z.object({
  body: z.object({
    phone: z.string().min(5).optional(),
    skills: z.string().optional(),
    experience: z.enum(["beginner", "skilled", "advanced"]).optional(),
    location: z.string().optional(),
    desiredJob: z.enum(["full_time", "part_time", "contract", "temporary"]).optional(),
    expectedSalary: z.number().min(0).optional(),
  }),
});

/**
 * Job create DTO
 */
export const JobCreateDto = z.object({
  body: z.object({
    employerId: z.number(),
    title: z.string().min(2),
    description: z.string().optional(),
    jobType: z.enum(["full_time", "part_time", "contract", "temporary"]),
    category: z.enum(["BASIC", "ADVANCED"]),
    location: z.string().optional(),
    salary: z.number().min(0).optional(),
  }),
});

/**
 * Job update DTO
 */
export const JobUpdateDto = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    jobType: z.enum(["full_time", "part_time", "contract", "temporary"]).optional(),
    category: z.enum(["BASIC", "ADVANCED"]).optional(),
    location: z.string().optional(),
    salary: z.number().min(0).optional(),
  }),
});

/**
 * Employer update DTO
 */
export const EmployerUpdateDto = z.object({
  body: z.object({
    companyName: z.string().optional(),
    companySize: z.number().min(1).optional(),
    industry: z.string().optional(),
  }),
});
