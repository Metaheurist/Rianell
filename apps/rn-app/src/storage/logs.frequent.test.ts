import { getFrequentLogItems } from './logs';

test('getFrequentLogItems returns sorted symptom frequencies', () => {
  const logs: any[] = [
    { symptoms: ['Nausea', 'Headache'] },
    { symptoms: ['Nausea'] },
    { symptoms: ['Headache', 'Nausea', '  '] },
  ];
  expect(getFrequentLogItems(logs as any, 'symptoms', 2)).toEqual(['Nausea', 'Headache']);
});

