import { parseLogDeepLink } from '@/notifications/deeplink';

describe('parseLogDeepLink', () => {
  it('parses context + meal', () => {
    expect(parseLogDeepLink('glico://log?context=pre_meal&meal=lunch'))
      .toEqual({ context: 'pre_meal', mealLabel: 'lunch' });
  });
  it('returns empty for malformed', () => {
    expect(parseLogDeepLink('garbage')).toEqual({});
  });
  it('only context', () => {
    expect(parseLogDeepLink('glico://log?context=hypo'))
      .toEqual({ context: 'hypo' });
  });
});
