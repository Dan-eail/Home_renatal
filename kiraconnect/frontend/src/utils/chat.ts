export const buildRoomId = (uid1: string, uid2: string, propertyId: string): string => {
  const sorted = [uid1, uid2].sort().join('_');
  return `${sorted}_${propertyId}`;
};
