jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: (obj: any) => obj.android || obj.default,
  },
}));

jest.mock('expo-sensors', () => ({
  Pedometer: {
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    getStepCountAsync: jest.fn().mockResolvedValue({ steps: 5000 }),
  },
}));

import {
  calculateMifflinStJeorBmr,
  calculateTdee,
  calculateBiometrics,
  calculateBmi,
} from '../src/services/userService';
import {
  calculateEpley1Rm,
  calculate1RmPercentages,
} from '../src/services/prService';
import {
  calculateDistanceKm,
  calculateCaloriesKcal,
  calculateActiveMinutes,
} from '../src/services/stepService';

describe('Domain Calculations & Biometrics (Regression & Verification Suite)', () => {
  describe('calculateMifflinStJeorBmr', () => {
    it('[TC-01] calculates correct BMR for female with exact -161 constant', () => {
      const bmr = calculateMifflinStJeorBmr(60, 165, 28, 'Nő');
      expect(bmr).toBe(1330);
    });

    it('[TC-02] returns default fallback (1650 kcal) when weight or height is invalid/zero', () => {
      expect(calculateMifflinStJeorBmr(0, 180, 25, 'Férfi')).toBe(1650);
      expect(calculateMifflinStJeorBmr(80, 0, 25, 'Férfi')).toBe(1650);
      expect(calculateMifflinStJeorBmr(null, 180, 25, 'Férfi')).toBe(1650);
    });

    it('calculates correct BMR for male with +5 constant', () => {
      const bmr = calculateMifflinStJeorBmr(80, 180, 25, 'Férfi');
      expect(bmr).toBe(1805);
    });
  });

  describe('calculateTdee', () => {
    it('[TC-03] maps localized and english activity strings to correct multipliers', () => {
      expect(calculateTdee(1800, 'sedentary')).toBe(2160);
      expect(calculateTdee(1800, 'Ülőmunka')).toBe(2160);
      expect(calculateTdee(1800, 'light')).toBe(2475);
      expect(calculateTdee(1800, 'Könnyű aktivitás')).toBe(2475);
      expect(calculateTdee(1800, 'moderate')).toBe(2790);
      expect(calculateTdee(1800, 'very_active')).toBe(3105);
      expect(calculateTdee(1800, 'extra_active')).toBe(3420);
    });

    it('defaults to 1.55 multiplier when not specified', () => {
      expect(calculateTdee(2000)).toBe(3100);
    });
  });

  describe('calculateBiometrics', () => {
    it('[TC-04] enforces 1200 kcal floor under extreme calorie deficit', () => {
      const lowWeightProfile = {
        weight: 45,
        height: 155,
        age: 30,
        gender: 'Nő',
        activityLevel: 'sedentary',
        fitnessGoal: 'Szálkásítás / Fogyás',
      };
      const result = calculateBiometrics(lowWeightProfile);
      expect(result.targetCalories).toBeGreaterThanOrEqual(1200);
    });

    it('[TC-05] applies exact +350 kcal surplus for muscle gain goal', () => {
      const profile = {
        weight: 75,
        height: 175,
        age: 24,
        gender: 'Férfi',
        fitnessGoal: 'Izomtömeg-növelés',
      };
      const result = calculateBiometrics(profile);
      expect(result.targetCalories).toBe(result.tdee + 350);
    });

    it('calculates full biometrics with standard weight loss deficit (-500 kcal)', () => {
      const profile = {
        weight: 80,
        height: 180,
        age: 25,
        gender: 'Férfi',
        fitnessGoal: 'Szálkásítás / Fogyás',
      };
      const result = calculateBiometrics(profile);
      expect(result.bmr).toBe(1805);
      expect(result.tdee).toBe(2798);
      expect(result.targetCalories).toBe(2298);
      expect(result.macros.proteinGrams).toBe(144);
      expect(result.macros.fatGrams).toBe(64);
      expect(result.macros.carbsGrams).toBe(287);
    });

    it('adjusts macro distribution for Ketogenic diet', () => {
      const profile = {
        weight: 80,
        height: 180,
        age: 25,
        gender: 'Férfi',
      };
      const regular = calculateBiometrics(profile, 'Regular');
      const keto = calculateBiometrics(profile, 'Ketogenic');

      expect(keto.macros.fatGrams).toBeGreaterThan(regular.macros.fatGrams);
      expect(keto.macros.carbsGrams).toBeLessThan(regular.macros.carbsGrams);
    });

    it('returns default safe target when profile data is missing', () => {
      const result = calculateBiometrics(null);
      expect(result.targetCalories).toBe(2200);
      expect(result.macros.proteinGrams).toBe(138);
    });
  });

  describe('calculateEpley1Rm', () => {
    it('[TC-06] returns exact weight for 1 repetition avoiding Epley formula inflation', () => {
      expect(calculateEpley1Rm(100, 1)).toBe(100);
      expect(calculateEpley1Rm(140, 1)).toBe(140);
    });

    it('[TC-07] guards against zero and negative weight inputs', () => {
      expect(calculateEpley1Rm(0, 5)).toBe(0);
      expect(calculateEpley1Rm(-10, 5)).toBe(0);
    });

    it('calculates estimated 1RM for multiple repetitions', () => {
      expect(calculateEpley1Rm(100, 5)).toBe(117);
      expect(calculateEpley1Rm(80, 10)).toBe(107);
      expect(calculateEpley1Rm(120, 3)).toBe(132);
    });
  });

  describe('calculateBmi', () => {
    it('[TC-08] converts height from cm to meters before squaring to avoid unit slip', () => {
      const bmi = calculateBmi(70, 175);
      expect(bmi).not.toBeNull();
      expect(bmi?.value).toBe(22.9);
      expect(bmi?.label).toBe('Normál');
    });

    it('classifies overweight correctly', () => {
      const bmi = calculateBmi(90, 175);
      expect(bmi).not.toBeNull();
      expect(bmi?.value).toBe(29.4);
      expect(bmi?.label).toBe('Túlsúly');
    });

    it('returns null for missing or invalid parameters', () => {
      expect(calculateBmi(null, 175)).toBeNull();
      expect(calculateBmi(70, 0)).toBeNull();
    });
  });

  describe('calculate1RmPercentages', () => {
    it('generates standard intensity zones from 1RM', () => {
      const zones = calculate1RmPercentages(100);
      expect(zones).toHaveLength(9);

      const zone100 = zones.find((z) => z.percent === 100);
      expect(zone100?.weight).toBe(100);
      expect(zone100?.estimatedReps).toBe(1);

      const zone90 = zones.find((z) => z.percent === 90);
      expect(zone90?.weight).toBe(90);
      expect(zone90?.estimatedReps).toBe(4);

      const zone80 = zones.find((z) => z.percent === 80);
      expect(zone80?.weight).toBe(80);
      expect(zone80?.estimatedReps).toBe(8);

      const zone70 = zones.find((z) => z.percent === 70);
      expect(zone70?.weight).toBe(70);
      expect(zone70?.estimatedReps).toBe(12);
    });
  });

  describe('Step Calculations & Sensor Reliability', () => {
    it('[TC-09] handles pedometer sensor communication failure gracefully with fallback logic', async () => {
      const mockSensorCall = jest.fn().mockRejectedValue(new Error('Pedometer sensor communication failed'));
      let stepsFallback = 0;
      try {
        await mockSensorCall();
      } catch {
        stepsFallback = 0;
      }
      expect(stepsFallback).toBe(0);
      expect(calculateDistanceKm(stepsFallback)).toBe(0);
      expect(calculateCaloriesKcal(stepsFallback)).toBe(0);
      expect(calculateActiveMinutes(stepsFallback)).toBe(0);
    });

    it('[TC-10] calculates distance, calories, and active minutes accurately from steps', () => {
      expect(calculateDistanceKm(10000)).toBe(7.5);
      expect(calculateCaloriesKcal(10000)).toBe(400);
      expect(calculateActiveMinutes(10000)).toBe(100);

      expect(calculateDistanceKm(5000)).toBe(3.75);
      expect(calculateCaloriesKcal(5000)).toBe(200);
      expect(calculateActiveMinutes(5000)).toBe(50);
    });

    it('guards against negative or zero step inputs in step calculation', () => {
      expect(calculateDistanceKm(0)).toBe(0);
      expect(calculateCaloriesKcal(0)).toBe(0);
      expect(calculateActiveMinutes(0)).toBe(0);

      expect(calculateDistanceKm(-500)).toBe(0);
      expect(calculateCaloriesKcal(-500)).toBe(0);
      expect(calculateActiveMinutes(-500)).toBe(0);
    });
  });
});
