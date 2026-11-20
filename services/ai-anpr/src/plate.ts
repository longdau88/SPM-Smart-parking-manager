export interface NormalizedPlate {
  clean_plate: string;
  display_plate: string;
}

const VALID_PLATE = /^[0-9]{2}[A-Z]{1,2}[0-9]{4,6}$/;

export function normalizePlate(rawPlate: string): NormalizedPlate {
  const cleanPlate = rawPlate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!VALID_PLATE.test(cleanPlate)) {
    throw new Error(`Biển số nhận diện không hợp lệ: ${rawPlate}`);
  }

  const prefix = cleanPlate.match(/^[0-9]{2}[A-Z]{1,2}/)?.[0];
  if (!prefix) throw new Error(`Không thể tách biển số: ${rawPlate}`);
  const suffix = cleanPlate.slice(prefix.length);

  return {
    clean_plate: cleanPlate,
    display_plate: `${prefix}-${suffix}`,
  };
}
