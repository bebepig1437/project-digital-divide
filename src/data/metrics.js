// Impact metrics shown on the Home page as animated count-up numbers.
//
// HOW TO USE:
//  - Update `value` as your numbers grow.
//  - Set `ready: false` to HIDE a metric until you have a real number
//    (so the section never shows an empty or "0" stat).
//  - `suffix` adds a symbol after the number (e.g. "+").

export const metrics = [
  {
    id: 'devices',
    label: 'Devices donated',
    value: 0,
    suffix: '+',
    ready: false, // TODO: set true once you have devices donated
  },
  {
    id: 'people',
    label: 'People reached',
    value: 0,
    suffix: '+',
    ready: false, // TODO: set true once social media + outreach is rolling
  },
  {
    id: 'businesses',
    label: 'Organizations helped',
    value: 0,
    suffix: '+',
    ready: false, // TODO: set true once you've helped your first orgs
  },
]
