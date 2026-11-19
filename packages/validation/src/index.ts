import { z } from 'zod';

// Vietnam License Plate Normalizer and Validator
export const cleanPlateRegex = /^[0-9]{2}[A-Z]{1,2}[0-9]{4,5}$/;

export const EntrySessionSchema = z.object({
  site_id: z.string().uuid({ message: 'Site ID phải là UUID hợp lệ' }),
  lane_id: z.string().uuid({ message: 'Lane ID phải là UUID hợp lệ' }),
  clean_plate: z
    .string()
    .min(5, { message: 'Biển số phải có tối thiểu 5 ký tự' })
    .max(12, { message: 'Biển số tối đa 12 ký tự' })
    .transform((val) => val.toUpperCase().replace(/[^A-Z0-9]/g, '')),
  display_plate: z.string().min(5).max(15),
  confidence_score: z.number().min(0).max(100),
  vehicle_type: z.enum([
    'MOTORCYCLE',
    'CAR_SEDAN',
    'CAR_SUV',
    'TRUCK',
    'BUS',
    'EV_CAR',
    'BICYCLE',
  ]),
  entry_time: z.string().datetime({ message: 'Thời gian vào phải chuẩn ISO-8601' }),
  entry_image_url: z.string().url({ message: 'Đường dẫn ảnh toàn cảnh phải là URL hợp lệ' }),
  entry_plate_crop_url: z.string().url({ message: 'Đường dẫn ảnh biển số crop phải là URL hợp lệ' }),
  ai_model_version: z.string().min(1),
  is_offline_event: z.boolean().default(false),
});

export const ExitCheckSchema = z.object({
  site_id: z.string().uuid(),
  lane_id: z.string().uuid(),
  clean_plate: z
    .string()
    .transform((val) => val.toUpperCase().replace(/[^A-Z0-9]/g, '')),
  exit_time: z.string().datetime(),
  exit_image_url: z.string().url(),
});

export const ManualBarrierOpenSchema = z.object({
  reason: z.string().min(3, { message: 'Bắt buộc phải nhập lý do mở barrier thủ công' }),
  operator_note: z.string().optional(),
});

export const ManualPlateCorrectionSchema = z.object({
  corrected_plate: z
    .string()
    .min(5)
    .max(15)
    .transform((val) => val.toUpperCase().trim()),
  reason: z.string().min(3),
});

export type EntrySessionInput = z.infer<typeof EntrySessionSchema>;
export type ExitCheckInput = z.infer<typeof ExitCheckSchema>;
export type ManualBarrierOpenInput = z.infer<typeof ManualBarrierOpenSchema>;
export type ManualPlateCorrectionInput = z.infer<typeof ManualPlateCorrectionSchema>;
